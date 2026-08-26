# The iOS music receipt — and how to measure it without a phone

`iospolicy-probe.mjs` is the instrument that settled the record-box half of the
iOS music bug. It is kept because the technique is worth more than the result:
**it models iOS's autoplay POLICY rather than trying to obtain iOS's engine.**

## What it does

Injects two shims before the page loads:

- `HTMLMediaElement.play()` rejects with `NotAllowedError` unless a gesture is in
  flight — which is exactly what iOS does and what desktop does not.
- The `src` setter is counted, so a tap's cost is visible as a number.

Then it reports, per tap: **how many `src` assignments and how many `play()`
attempts** it took. That is the whole diagnosis in two integers.

```
node design/cs35-research/ios-music/iospolicy-probe.mjs         # a SHIPPED row
UNSHIPPED=1 node design/cs35-research/ios-music/iospolicy-probe.mjs   # a streaming row
```
(Serve the repo on `127.0.0.1:8899` first — `python3 -m http.server 8899`.)

## The measured result (2026-08-26, tip a3fa9a9)

| | src swaps | play() attempts | ends on |
|---|---|---|---|
| title screen, no tap | 0 | 0 | — (the latch holds) |
| shipped row, tapped | 1 | 1 | `music/<name>.mp3` (same-origin) |
| streaming row, tapped | 1 | 1 | the release URL |
| **streaming row, boot probe removed** | **2** | **2** | `music/archive/…` → 404 |

That last row is the control, and it is the bug: the first tap of a session spent
its gesture on a 404 and only reached the real URL from an async `.catch()`, a
full network round trip later — by which time iOS has withdrawn permission.
One line (`musProbeArchive()`) is the difference between the last two rows.

## Why this instrument and not a real WebKit

A WebKit **was** built in-pod for this (`apt-get download` + `dpkg -x` into the
playwright bundle's own `sys/lib`) and it produced a **confident wrong answer**:
that WebKit rejects the release CDN's `application/octet-stream` +
`Content-Disposition: attachment`. It does not. That browser had **no TLS**, so
every `https://` URL failed identically, and the "control" was a same-origin
plaintext file — which could only ever prove the codec worked, never the network.

Two rules came out of it, both cheap and both general:

1. **A positive control must exercise the same transport as the subject.** Remote
   HTTPS subject → remote HTTPS control, on a host you do not suspect.
2. **Prefer simulating the policy to obtaining the engine.** The failing thing
   here is a *rule about gestures*, not a codec or a parser. A rule can be
   modelled in fifteen lines, in a browser you already trust.

The tell that exposed the bad result: the proposed *remedy* (jsDelivr,
raw.githubusercontent — both `audio/mpeg` + CORS + 206) failed in the same
browser in exactly the same way as the disease. **When a fix and the bug produce
identical symptoms, suspect the instrument before believing either.**

For the header question specifically, the right tool turned out to be a local
replay: serve the same bytes from `127.0.0.1` under each host's real headers and
vary one header at a time. Deterministic, offline, no CDN in the path. It showed
both engines play `octet-stream` + `attachment` fine (43.5s both), which is what
killed the header theory.

# THE FOLLOW STUTTER — the camera's clock was quantized (close-out)

The play-test's report: a followed crab stutters in motion, new in 3.5.

## The measurement, before

Following a walking crab at 120Hz, the crab's screen-space x (probe
inside the swap window, reading exactly what the draw read) advanced
**+0.46px for five frames, then snapped −2.3px on the sixth** — a
sawtooth at exactly tick rate, max |Δ| 2.41px. The probe also recorded
`dt === 0` on **200 of 240** followCam calls.

## The cause — the phase hypothesis, refuted and replaced

The suspected phase bug (followCam reading raw tick positions outside
the interpolation swap window) is NOT the cause: followCam is the first
call inside `viewFrame`, inside the window, reading interpolated
positions. The real cause is the CLOCK: the follow lerp ran on `dt`,
which is tick-quantized sim time — **zero on five of six 120Hz frames**.
The camera stood still while the interpolated crab glided, then lurched
when the tick frame handed it 0.05s at once. `interp(crab) −
stepped(cam)` oscillates at tick rate: stutter exactly and only when
focused.

## The fix (view-only, two lines that matter)

`vpCamDt = (rawMs / 1000) * TURBO * (ffSleep ? 6 : FF_SPEED[ffMode])` —
the same scaling as `dtT` with NO tick quantization — and
`followCam(vpCamDt)` in viewFrame. camX is view float by the contract
("what stays float forever"); its clock can be too. The suite's cycler
scenario drives `followCam(seconds)` directly and is untouched; headless
never enters viewFrame, so the browser clock is not headlessly
assertable — the in-browser measurement below is the receipt.

## The measurement, after

Same probe, same conditions: `dt === 0` on **0** of 240 calls; lock-on
steady state reads Δ = 0.00 flat; tracking a walking crab (23.7px of
world motion in the window) reads a smooth ramp, **max |Δ| 0.29px, 2
sign flips in 119 deltas** (before: a flip every 6th frame). Zero
console errors. Free camera untouched by construction (followCam
early-outs when nothing is followed; nothing else reads vpCamDt).

## Gate

Suite **283/283 exit 0** kernel-armed (98.9s) and unarmed (251.5s), main
realm; bench fingerprints identical to the pin on BOTH backends
(`1337:10390:11! 4242:4990:13 909:10190:11! 31:400:12!`) — the sim is
untouched; the seam scenarios (render moves nothing, zero sim draws,
smoothness receipt) ride in the suite and passed unmodified.

Two debug seams stay (the `_vpLerped` family): `window._probeCam` /
`_camProbe` (the follow probe) and `window._dbgFollow(i)` (follow a crab
addressably — the card click, reachable from a harness).

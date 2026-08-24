# App Store listing — draft copy

Every field below is a DRAFT for Matt to cut. The character limits are Apple's
and they are hard: App Store Connect truncates nothing, it just refuses to save.
`node ios/checklen.mjs` re-counts them.

**Embargo check before any of this is pasted anywhere**: the town's name and the
ending card do not appear in store copy, in screenshots, or in the preview
video. The App Store listing is the single most public surface this game has.

---

## Name — limit 30

```
CRAB SHACK
```
Alternate, if the plain name is taken (it very likely is — check first):
```
Crab Shack: Beach Economy
```
The Store name and the name under the icon can differ. `CFBundleDisplayName` is
already `CRAB SHACK` in `project.yml`, and that is the one players see daily.

## Subtitle — limit 30

```
The crabs have their own plans
```
Alternates — one fenced block each, because the checker measures a block as one
field value and two candidates in one block read as a 51-character subtitle:
```
A beach economy that argues
```
```
A town that runs itself
```

## Promotional text — limit 170 (editable without a new build)

```
The crabs think for themselves now — a distilled neural policy decides where
each one goes. Pig tourists ride in on the ferry. Nobody is waiting for your
permission.
```

## Keywords — limit 100, comma-separated, NO spaces after commas

```
simulation,economy,tycoon,town,pixel,management,beach,restaurant,sim,retro,idle,crab,village,shop
```

## Description — limit 4000

```
You run a shack on a beach. That is the smallest true thing anyone can say
about this game.

The town does not wait for you. The crabs who live here have names, jobs,
wages, moods and diaries. They get hungry, they get bored, they get sick of
their commute, and they quit. Other crabs open their own businesses using
exactly the abilities you have — they price their menus, hire staff, run out of
money and fail. A rival can move in across the sand and undercut you. An
election can hand the town hall to someone with different ideas about your
wages.

Nothing in this town is conjured. Every coin that reaches a till came out of
somebody's pocket. Every ingredient was bought from someone who had it. If the
economy is tight, it is tight for a reason you can find.

The crabs now think with a neural policy — a real one, distilled from millions
of simulated decisions and small enough to run inside the game. It gives them
opinions. They are not always your opinions.

Lately the ferry has been bringing pigs from the mainland, who have their own
manners, their own tastes, and firm views about what counts as food. They will
tell you, at length, what your town is missing.

There is a way off this island. It costs twenty thousand dollars and you will
not be shown the road to it until you have built something worth leaving.

- A simulated town, not an idle clicker: every crab is an actor with the same
  rules you have
- Named characters with diaries, needs, friendships, careers and mortality
- A real economy — wages, rents, prices, imports, tips, taxes, failure and
  succession
- Foreign visitors with their own cuisine, class registers and complaints
- Elections, rivals, hotels, shelter, and businesses that outlive their owners
- Hand-drawn pixel art on a 256x240 screen, and twenty-two original tracks
- Plays entirely offline. No ads, no purchases, no account, no data collected.
  Your towns never leave your phone.

Built in the open. The full development log, including the parts that went
wrong, is at groblegark.github.io/crab-shack-3.5
```

## What's New (first release)

```
The first release on iPhone and iPad. Everything the browser version has, in
your pocket: the whole town, the whole economy, and all twenty-two tracks,
offline.
```

## The rest of the form

| field | answer |
|---|---|
| Primary category | Games → Simulation |
| Secondary category | Games → Strategy |
| Support URL | https://groblegark.github.io/crab-shack-3.5 |
| Marketing URL | https://groblegark.github.io/crab-shack-3.5 |
| Privacy Policy URL | https://groblegark.github.io/crab-shack-3.5/privacy.html |
| Price | Matt's call |
| Age rating | answer the questionnaire honestly — the true answer is None to
  every question. Crabs do die, of old age, off-screen and in text. That is not
  "Realistic Violence"; do not over-declare and land a 12+ for nothing. |
| Privacy label | **Data Not Collected**, and it is literally true |
| Export compliance | already answered in project.yml |

## Screenshots

6.9" and 6.5" iPhone are required; iPad 13" if the iPad build is submitted.
Take them from the simulator. Good candidates, in order:

1. The shack mid-shift, queue out the door
2. The town at dusk with the nav strip up
3. A crab's diary card
4. A pig tourist complaining on a departure card
5. The manage screen — wages, prices, hours

**Not the ending card. Not the ferry's hull.**

MEASURED 2026-08-24 (experiments/rungprobe.json at 2733a32, receipts
kube-runs/cs-rungprobe-2733a32-egop). This is the vacuity check that the
ladder change earned by moving NO fingerprint despite growing the platform
grid ~40% (to 4900).

    109 crabs asked, 8 towns, 30 lived days each
    chosen cap index histogram:  { 0: 94, 3: 15 }
    policy cap per town:         0 in all eight

TWO FINDINGS, and the second is the one that needs Matt.

1. THE NEW RUNGS ARE DEAD DATA FOR THE TOWN. Not one crab in 109 chose index
   4, 5 or 6 - the 6, 8 and 12 rungs. 94 want NO LIMIT (index 0); the other 15
   want 4 staff (index 3). So the ladder extension is real for the PLAYER (the
   campaign dial now offers 8 and 12, which is the bug Matt reported) and inert
   for NPC voters. That is why the suite stayed 682/682 with no pin moving: the
   enlarged search space is never entered.

2. THE FOUNDING CAP IS VOTED AWAY. Matt asked for "the starting condition
   should be 6 staff" and the founding policy now sets cap: 4 (the 6 rung) -
   but every town reads policy cap 0 after 30 days. The town dismantles the
   limit at its first election, so the starting condition survives days, not a
   run.

THE MECHANISM IS NOT A BUG - read capStake100 before "fixing" it. A house limit
costs the shop that is at it, pays the shops that are not, and a crab with no
wage job takes -18 because a cap is "a posting that never goes up on the
board". Most voters are in one of those two groups, so a majority is
structurally against any limit. The dial is honest; the electorate just does
not want it.

WHAT THIS NEEDS FROM MATT - a design ruling, not a patch:
  (a) leave it: the house limit is something a town CAN have and usually votes
      away, and the founding cap is flavour that the player may campaign to
      keep. Honest, but his instruction then means less than it sounds like.
  (b) re-weight capStake100 so a limit is genuinely attractive to somebody -
      e.g. small shop owners, or crabs queueing for work at a saturated
      employer - so the vote is a real argument rather than a foregone one.
  (c) make the founding cap harder to remove (a supermajority, or a term
      before it can be re-opened), which is a civics mechanism and belongs in
      E4 proper rather than in this slice.

DO NOT resolve this by widening the ladder further or by pinning the policy -
neither touches why nobody wants it.

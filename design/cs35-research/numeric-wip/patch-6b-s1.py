#!/usr/bin/env python3
# SLICE 6, LANDING 6b STAGE 1: position/target residency flips into SoA
# Int32Arrays (the grain IS the stored value now; the px Number the whole
# read surface sees is the accessor's exact q/256 image). One shared agent
# pool for crabs, npcs and customers; slots are reclaimed by a per-frame
# mark-and-reap so no removal door can leak. Byte-identical by gate.
import re

src = open("game.js").read()

POOL = '''
// ------------------------------------------------------------- the agent pool
// SLICE 6b. Positions and motion targets live in SoA Int32Arrays of Q8
// GRAINS - the numerator is the stored truth, the px Number every reader
// sees is its exact double image q/256 through the prototype accessors
// below. SoA over AoS-stride: the hot loops (collide, stepTo, visStep)
// touch two or three fields across every agent, so each field is its own
// dense cache line - and it is the layout the batch future wants. A town's
// whole pool is ~7KB against 128KB of L1.
const POOL_MAX = 160;
const PXQ = new Int32Array(POOL_MAX), PYQ = new Int32Array(POOL_MAX),
      PTXQ = new Int32Array(POOL_MAX), PTYQ = new Int32Array(POOL_MAX),
      PWYQ = new Int32Array(POOL_MAX),
      PMXQ = new Int32Array(POOL_MAX), PMYQ = new Int32Array(POOL_MAX);
const MNULL = -0x80000000;   // the _mx/_my "no motion target this frame" sentinel
const POOL_LIVE = new Uint8Array(POOL_MAX), POOL_MARK = new Uint8Array(POOL_MAX);
let poolTop = 0; const poolFree = [];
function poolAlloc() {
  const i = poolFree.length ? poolFree.pop() : poolTop++;
  if (i >= POOL_MAX) throw new Error("agent pool overflow at " + POOL_MAX);
  PXQ[i] = 0; PYQ[i] = 0; PTXQ[i] = 0; PTYQ[i] = 0; PWYQ[i] = 0;
  PMXQ[i] = MNULL; PMYQ[i] = MNULL; POOL_LIVE[i] = 1;
  return i;
}
// the reap: slots owned by objects no pool can reach any more go back on the
// freelist. Runs once a frame; marking every live agent is ~60 writes. This
// replaces hooking each of the seven removal doors - a door added later
// cannot leak.
function poolReap() {
  POOL_MARK.fill(0);
  for (const c of crabs) POOL_MARK[c.si] = 1;
  for (const c of npcs) POOL_MARK[c.si] = 1;
  for (const k of customers) POOL_MARK[k.si] = 1;
  for (let i = 0; i < poolTop; i++)
    if (POOL_LIVE[i] && !POOL_MARK[i]) { POOL_LIVE[i] = 0; poolFree.push(i); }
}
'''

# 1. pool lands right before the newCrab function (after the tables from 6a)
anchor = "function newCrab(persona) {"
assert src.count(anchor) == 1
src = src.replace(anchor, POOL + anchor)

# 2. accessors join the 6a protos
crab_acc = '''  get x() { return PXQ[this.si] / Q8; }
  set x(v) { PXQ[this.si] = Math.round(v * Q8); }
  get y() { return PYQ[this.si] / Q8; }
  set y(v) { PYQ[this.si] = Math.round(v * Q8); }
  get tx() { return PTXQ[this.si] / Q8; }
  set tx(v) { PTXQ[this.si] = Math.round(v * Q8); }
  get ty() { return PTYQ[this.si] / Q8; }
  set ty(v) { PTYQ[this.si] = Math.round(v * Q8); }
  get _mx() { return PMXQ[this.si] === MNULL ? null : PMXQ[this.si] / Q8; }
  set _mx(v) { PMXQ[this.si] = v == null ? MNULL : Math.round(v * Q8); }
  get _my() { return PMYQ[this.si] === MNULL ? null : PMYQ[this.si] / Q8; }
  set _my(v) { PMYQ[this.si] = v == null ? MNULL : Math.round(v * Q8); }
'''
a1 = "  get dayState() { return DS_NAMES[this.dsC]; }"
assert src.count(a1) == 1
src = src.replace(a1, crab_acc + a1)
vis_acc = crab_acc + '''  get wy() { return PWYQ[this.si] / Q8; }
  set wy(v) { PWYQ[this.si] = Math.round(v * Q8); }
'''
a2 = "  get state() { return VS_NAMES[this.stC]; }"
assert src.count(a2) == 1
src = src.replace(a2, vis_acc + a2)

# 3. vivifyCust lifts the numeric own-props through the accessors too
v1 = '''function vivifyCust(o) {
  if (Object.prototype.hasOwnProperty.call(o, "state")) {
    const s = o.state; delete o.state; Object.setPrototypeOf(o, VisProto); o.state = s;
  } else Object.setPrototypeOf(o, VisProto);
  return o;
}'''
assert src.count(v1) == 1
src = src.replace(v1, '''function vivifyCust(o) {
  const lift = {};
  for (const f of ["state", "x", "y", "wy", "tx", "ty", "_mx", "_my"])
    if (Object.prototype.hasOwnProperty.call(o, f)) { lift[f] = o[f]; delete o[f]; }
  Object.setPrototypeOf(o, VisProto);
  o.si = poolAlloc();
  for (const f in lift) o[f] = lift[f];
  return o;
}''')

# 4. the crab constructor: own x/y/tx/ty out of the literal, slot + accessor init in
c1 = '''  return Object.setPrototypeOf({
    p: persona,
    x: homeX({ p: persona }), y: 160, tx: 0, ty: 160,
    flip: false, hidden: false, animT: srand() * 9,'''
assert src.count(c1) == 1
src = src.replace(c1, '''  const c = Object.setPrototypeOf({
    p: persona,
    si: poolAlloc(),
    flip: false, hidden: false, animT: srand() * 9,''')
c2 = '''    quip: null, quipT: 8 + srand() * 15,
  }, CrabProto);
}'''
assert src.count(c2) == 1
src = src.replace(c2, '''    quip: null, quipT: 8 + srand() * 15,
  }, CrabProto);
  c.x = homeX({ p: persona }); c.y = 160; c.tx = 0; c.ty = 160;
  return c;
}''')

# 5. the visitor constructor
c3 = '''    x: FERRY.gangway, y: FERRY.deckY, wy: FERRY.deckY, leg: 0,
    stC: VS.ashore,'''
assert src.count(c3) == 1
src = src.replace(c3, '''    si: poolAlloc(), leg: 0,
    stC: VS.ashore,''')
c4 = "  Object.setPrototypeOf(v, VisProto);"
assert src.count(c4) == 1
src = src.replace(c4, '''  Object.setPrototypeOf(v, VisProto);
  v.x = FERRY.gangway; v.y = FERRY.deckY; v.wy = FERRY.deckY;''')

# 6. the errand-crab customer literal (x: c.x is pooled now)
c5 = '''      const cust = Object.setPrototypeOf({ biz: c.errandBiz, recipe: c.errand.recipe, isCrab: true, crab: c,
        need: c.errand.need, x: c.x, spawnX: c.x, stC: VS.waiting,'''
assert src.count(c5) == 1
src = src.replace(c5, '''      const cust = Object.setPrototypeOf({ biz: c.errandBiz, recipe: c.errand.recipe, isCrab: true, crab: c,
        si: poolAlloc(),
        need: c.errand.need, spawnX: c.x, stC: VS.waiting,''')
c6 = '''        patience: 90 * PQ, maxPatience: 90 * PQ, claimed: false, served: false, server: null }, VisProto);   // locals will wait'''
assert src.count(c6) == 1
src = src.replace(c6, c6 + "\n      cust.x = c.x;")

# 7. the walk-in literal
c7 = '''  return Object.setPrototypeOf({ biz: bizKey, recipe: r,'''
assert src.count(c7) == 1
src = src.replace(c7, '''  const w = Object.setPrototypeOf({ biz: bizKey, recipe: r,''')
c8 = '''    x: spawnX, spawnX, stC: VS.arriving, patience: 50 * PQ, maxPatience: 50 * PQ,'''
assert src.count(c8) == 1
src = src.replace(c8, '''    si: poolAlloc(), spawnX, stC: VS.arriving, patience: 50 * PQ, maxPatience: 50 * PQ,''')
c9 = '''    claimed: false, served: false, server: null }, VisProto);
}'''
assert src.count(c9) == 1
src = src.replace(c9, '''    claimed: false, served: false, server: null }, VisProto);
  w.x = spawnX;
  return w;
}''')

# 8. the reap rides at the top of simTown, before anything allocates
s1 = "function simTown(dt) {"
assert src.count(s1) == 1
src = src.replace(s1, s1 + "\n  poolReap();")

open("game.js", "w").write(src)
print("6b stage 1 applied")

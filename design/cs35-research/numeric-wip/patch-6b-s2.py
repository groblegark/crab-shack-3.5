#!/usr/bin/env python3
# SLICE 6, LANDING 6b STAGE 2: the hot loops leave the accessors and run on
# the pool arrays directly - stepTo, visStep, and collide's pair loop. Every
# replacement is an exact-value identity: the stored grain IS x*Q8, so
# `c.x * Q8` becomes PXQ[i], `c.x = (c.x*Q8 + e)/Q8` becomes PXQ[i] += e,
# and px compares scale by 256 on both sides (strict order preserved).
src = open("game.js").read()

# ---- stepTo
old = '''function stepTo(c, tx, speed, dt, ty) {
  if (ty == null) ty = c.ty != null ? c.ty : 160;
  const dxq = tx * Q8 - c.x * Q8, dyq = ty * Q8 - c.y * Q8;   // exact: grains
  const dsq = dxq * dxq + dyq * dyq;
  if (dsq <= ARRIVE_Q * ARRIVE_Q) { c.x = tx; c.y = ty; return true; }
  if (dxq > Q8 || dxq < -Q8) c.flip = dxq < 0;
  const dq = isqrt(dsq);
  const stepq = Math.min(idiv(speed * dtT, TICK_HZ), dq);
  c.x = (c.x * Q8 + tdiv(dxq * stepq, dq)) / Q8;
  c.y = (c.y * Q8 + tdiv(dyq * stepq, dq)) / Q8;
  c._stepped = true;   // moved this frame (anchors are crabs that did not)
  c._mx = tx;          // actual motion target this frame (collision uses this, not c.tx)
  c._my = ty;          // ...and its y (slice 5: the mover-target exemption reads both)
  return false;
}'''
assert src.count(old) == 1
src = src.replace(old, '''function stepTo(c, tx, speed, dt, ty) {
  // (6b) straight onto the pool: the stored grain IS the truth, so the px
  // dance (x*Q8 ... /Q8) collapses into integer adds on PXQ/PYQ.
  const i = c.si;
  const txq = Math.round(tx * Q8), tyq = ty == null ? PTYQ[i] : Math.round(ty * Q8);
  const dxq = txq - PXQ[i], dyq = tyq - PYQ[i];
  const dsq = dxq * dxq + dyq * dyq;
  if (dsq <= ARRIVE_Q * ARRIVE_Q) { PXQ[i] = txq; PYQ[i] = tyq; return true; }
  if (dxq > Q8 || dxq < -Q8) c.flip = dxq < 0;
  const dq = isqrt(dsq);
  const stepq = Math.min(idiv(speed * dtT, TICK_HZ), dq);
  PXQ[i] += tdiv(dxq * stepq, dq);
  PYQ[i] += tdiv(dyq * stepq, dq);
  c._stepped = true;   // moved this frame (anchors are crabs that did not)
  PMXQ[i] = txq;       // actual motion target this frame (collision uses this, not c.tx)
  PMYQ[i] = tyq;       // ...and its y (slice 5: the mover-target exemption reads both)
  return false;
}''')

# ---- visStep
old = '''  const spq = idiv(VIS_SPEED * Q8 * dtT, TICK_HZ);
  const dxq = tx * Q8 - k.x * Q8, dyq = (ty == null ? k.wy : ty) * Q8 - k.wy * Q8;
  if (dxq > Q8 || dxq < -Q8) { k.x = (k.x * Q8 + Math.sign(dxq) * Math.min(spq, Math.abs(dxq))) / Q8; k.face = Math.sign(dxq); }
  if (dyq > Q8 || dyq < -Q8) k.wy = (k.wy * Q8 + Math.sign(dyq) * Math.min(spq, Math.abs(dyq))) / Q8;
  return Math.abs(tx - k.x) <= 1 && Math.abs((ty == null ? k.wy : ty) - k.wy) <= 1;'''
assert src.count(old) == 1
src = src.replace(old, '''  const i = k.si;
  const spq = idiv(VIS_SPEED * Q8 * dtT, TICK_HZ);
  const txq = Math.round(tx * Q8), tyq = ty == null ? PWYQ[i] : Math.round(ty * Q8);
  const dxq = txq - PXQ[i], dyq = tyq - PWYQ[i];
  if (dxq > Q8 || dxq < -Q8) { PXQ[i] += Math.sign(dxq) * Math.min(spq, Math.abs(dxq)); k.face = Math.sign(dxq); }
  if (dyq > Q8 || dyq < -Q8) PWYQ[i] += Math.sign(dyq) * Math.min(spq, Math.abs(dyq));
  return Math.abs(txq - PXQ[i]) <= Q8 && Math.abs(tyq - PWYQ[i]) <= Q8;''')

# ---- collide's pair loop
old = '''      const dxq = b.x * Q8 - a.x * Q8, dyq = b.y * Q8 - a.y * Q8;   // exact: grains'''
assert src.count(old) == 1
src = src.replace(old, '''      const ia = a.si, ib = b.si;
      const dxq = PXQ[ib] - PXQ[ia], dyq = PYQ[ib] - PYQ[ia];   // exact: grains''')

old = '''        const atTarget = (m, still) => {
          if (m._mx == null) return false;
          const tA5 = 5 * Math.round((m._mx - still.x) * Q8), tB9 = 9 * Math.round(((m._my != null ? m._my : m.y) - still.y) * Q8);
          return tA5 * tA5 + tB9 * tB9 < 15360 * 15360;
        };
        if (aStill && !bStill) { if (!atTarget(b, a)) { b.x = (b.x * Q8 + px2x) / Q8; b.y = clampY((b.y * Q8 + px2y) / Q8); } }
        else if (bStill && !aStill) { if (!atTarget(a, b)) { a.x = (a.x * Q8 - px2x) / Q8; a.y = clampY((a.y * Q8 - px2y) / Q8); } }
        else if (Math.sign((a._mx != null ? a._mx : a.x) - a.x) !== Math.sign((b._mx != null ? b._mx : b.x) - b.x) && (dxq > 512 || dxq < -512)) {
          // head-on: step around each other, not into each other
          a.y = clampY(Math.max(FLOOR_MIN, (a.y * Q8 - pushq * 2) / Q8));
          b.y = clampY((b.y * Q8 + pushq * 2) / Q8);
          if (b.y >= FLOOR_MAX - 0.5) b.y = clampY((b.y * Q8 - pushq * 4) / Q8);   // no room below: b passes above instead
        }
        else {
          const p1x = tdiv(5 * dxq * pushq, d5), p1y = tdiv(5 * dyq * pushq, d5);
          a.x = (a.x * Q8 - p1x) / Q8; a.y = clampY((a.y * Q8 - p1y) / Q8);
          b.x = (b.x * Q8 + p1x) / Q8; b.y = clampY((b.y * Q8 + p1y) / Q8);
        }'''
assert src.count(old) == 1
src = src.replace(old, '''        const atTargetQ = (mi, si2) => {
          if (PMXQ[mi] === MNULL) return false;
          const tA5 = 5 * (PMXQ[mi] - PXQ[si2]), tB9 = 9 * ((PMYQ[mi] === MNULL ? PYQ[mi] : PMYQ[mi]) - PYQ[si2]);
          return tA5 * tA5 + tB9 * tB9 < 15360 * 15360;
        };
        const clampYQ = (q) => Math.max(FLOOR_MIN * Q8, Math.min(FLOOR_MAX * Q8, q));
        if (aStill && !bStill) { if (!atTargetQ(ib, ia)) { PXQ[ib] += px2x; PYQ[ib] = clampYQ(PYQ[ib] + px2y); } }
        else if (bStill && !aStill) { if (!atTargetQ(ia, ib)) { PXQ[ia] -= px2x; PYQ[ia] = clampYQ(PYQ[ia] - px2y); } }
        else if (Math.sign((PMXQ[ia] === MNULL ? PXQ[ia] : PMXQ[ia]) - PXQ[ia]) !== Math.sign((PMXQ[ib] === MNULL ? PXQ[ib] : PMXQ[ib]) - PXQ[ib]) && (dxq > 512 || dxq < -512)) {
          // head-on: step around each other, not into each other
          PYQ[ia] = clampYQ(Math.max(FLOOR_MIN * Q8, PYQ[ia] - pushq * 2));
          PYQ[ib] = clampYQ(PYQ[ib] + pushq * 2);
          if (PYQ[ib] >= FLOOR_MAX * Q8 - 128) PYQ[ib] = clampYQ(PYQ[ib] - pushq * 4);   // no room below: b passes above instead
        }
        else {
          const p1x = tdiv(5 * dxq * pushq, d5), p1y = tdiv(5 * dyq * pushq, d5);
          PXQ[ia] -= p1x; PYQ[ia] = clampYQ(PYQ[ia] - p1y);
          PXQ[ib] += p1x; PYQ[ib] = clampYQ(PYQ[ib] + p1y);
        }''')

open("game.js", "w").write(src)
print("6b stage 2 applied")

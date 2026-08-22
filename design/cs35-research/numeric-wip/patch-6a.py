#!/usr/bin/env python3
# SLICE 6, LANDING 6a: event codes for the four per-tick state machines.
# dayState -> dsC/DS, kstate -> ksC/KS, cstate -> csC/CS, visitor state -> stC/VS.
# Pure representation: the string surface survives on prototype accessors
# (strict setters - an unknown string THROWS, so the suite is the exhaustive
# value oracle), the sim's own compares and literal assignments become int
# compares against the tables. Byte-identical by gate.
import re, sys

src = open("game.js").read()
orig = src

TABLES = '''
// ---------------------------------------------------------------- event codes
// SLICE 6a. The four per-tick state machines store an INT CODE; the string
// the suite, the save and the diary read is a prototype accessor over the
// name table. The CODES drive logic; the strings render at the observation
// point. Setters are STRICT - an unknown string is a thrown error, not a
// silent NaN state - so every write site is provably in-table.
const DS_NAMES = ["home", "toWork", "working", "toErrand", "errand", "atTap",
  "toHome", "selfCook", "chat", "atBall", "directed"];
const KS_NAMES = ["idle", "walk", "work", "toSlot", "waitSlot", "waitCash",
  "busingTable", "cleaningStall", "toStallClean", "toTableClean", "nap", "wander"];
const CS_NAMES = ["", "walkToStop", "waitBus", "onBus", "walkFromPark",
  "walkToVehicle", "drive", "travel", "walkOff"];
const VS_NAMES = ["", "ashore", "arriving", "waiting", "toSeat", "seatedWaiting",
  "dining", "toStall", "waitStall", "outStall", "toTable", "showering", "toBiz",
  "toPier", "toRoom", "inRoom", "onSand", "roam", "leaving"];
const DS = {}, KS = {}, CS = {}, VS = {};
DS_NAMES.forEach((n, i) => DS[n] = i); KS_NAMES.forEach((n, i) => KS[n] = i);
CS_NAMES.forEach((n, i) => CS[n] = i); VS_NAMES.forEach((n, i) => VS[n] = i);
class CrabS {
  get dayState() { return DS_NAMES[this.dsC]; }
  set dayState(s) { const c = DS[s]; if (c === undefined) throw new Error("dayState? " + s); this.dsC = c; }
  get kstate() { return KS_NAMES[this.ksC]; }
  set kstate(s) { const c = KS[s]; if (c === undefined) throw new Error("kstate? " + s); this.ksC = c; }
  get cstate() { return CS_NAMES[this.csC]; }
  set cstate(s) { const c = CS[s]; if (c === undefined) throw new Error("cstate? " + s); this.csC = c; }
}
class VisS {
  get state() { return VS_NAMES[this.stC]; }
  set state(s) { const c = VS[s]; if (c === undefined) throw new Error("state? " + s); this.stC = c; }
}
const CrabProto = CrabS.prototype, VisProto = VisS.prototype;

'''

# 1. tables + protos land just before newCrab
anchor = "function newCrab(persona) {"
assert src.count(anchor) == 1
src = src.replace(anchor, TABLES + anchor)

# 2. compares and literal assignments -> int codes
def conv(src, field, code, tab):
    # compares: X.field === "v" / !== "v"
    src = re.sub(r"\." + field + r' (===|!==) "(\w*)"',
                 lambda m: "." + code + " " + m.group(1) + " " + tab + (('["' + m.group(2) + '"]') if m.group(2) == "" else "." + m.group(2)),
                 src)
    # literal assignments: X.field = "v"  (not ==, catch via lookbehind on '= ')
    src = re.sub(r"\." + field + r' = "(\w*)"',
                 lambda m: "." + code + " = " + tab + (('["' + m.group(1) + '"]') if m.group(1) == "" else "." + m.group(1)),
                 src)
    return src

src = conv(src, "dayState", "dsC", "DS")
src = conv(src, "kstate", "ksC", "KS")
# cstate: "" compares/assigns become index 0
src = src.replace('.cstate === ""', ".csC === 0").replace('.cstate !== ""', ".csC !== 0")
src = src.replace('.cstate = ""', ".csC = 0")
src = conv(src, "cstate", "csC", "CS")

# visitor state: receiver-limited (bus.state stays a string; its 3 compares are its own machine)
VRX = r"\b(k|cust|guest|o|occupant|sel|c)"
src = re.sub(VRX + r'\.state (===|!==) "(\w+)"', r"\1.stC \2 VS.\3", src)
src = re.sub(r"\b(k|cust|guest|v|nv|g)\.state = \"(\w+)\"", r"\1.stC = VS.\2", src)

# 3. the four constructor literals get codes + protos
c1 = 'dayState: "home", cstate: "", target: 0'
assert src.count(c1) == 1
src = src.replace(c1, "dsC: DS.home, csC: 0, target: 0")
c2 = 'kstate: "idle", cust: null, carrying: null, stepIdx: 0,'
assert src.count(c2) == 1
src = src.replace(c2, "ksC: KS.idle, cust: null, carrying: null, stepIdx: 0,")
# newCrab returns the literal; wrap it with the proto
c3 = "  return {\n    p: persona,"
assert src.count(c3) == 1
src = src.replace(c3, "  return Object.setPrototypeOf({\n    p: persona,")
c4 = "    quip: null, quipT: 8 + srand() * 15,\n  };\n}"
assert src.count(c4) == 1
src = src.replace(c4, "    quip: null, quipT: 8 + srand() * 15,\n  }, CrabProto);\n}")
# the visitor
c5 = '    state: "ashore",'
assert src.count(c5) == 1
src = src.replace(c5, "    stC: VS.ashore,")
c6 = "    hunger: n.hunger, thirst: n.thirst, dirt: n.dirt, bored: n.bored, tired: n.tired,\n  };"
assert src.count(c6) == 1
src = src.replace(c6, "    hunger: n.hunger, thirst: n.thirst, dirt: n.dirt, bored: n.bored, tired: n.tired,\n  };\n  Object.setPrototypeOf(v, VisProto);")
# the errand-crab customer. THE LESSON THAT COST AN HOUR: wrapping a literal
# in the proto is not enough - an own `state:` DATA property SHADOWS the
# prototype accessor completely (assigns write the string past the setter,
# converted compares read an old stC that is not there). The literal's own
# property must become the CODE, or the object is a string-state alien
# wearing the right prototype.
c6b = '        need: c.errand.need, x: c.x, spawnX: c.x, state: "waiting",'
assert src.count(c6b) == 1
src = src.replace(c6b, "        need: c.errand.need, x: c.x, spawnX: c.x, stC: VS.waiting,")
c6c = '    x: spawnX, spawnX, state: "arriving", patience: 50 * PQ, maxPatience: 50 * PQ,'
assert src.count(c6c) == 1
src = src.replace(c6c, "    x: spawnX, spawnX, stC: VS.arriving, patience: 50 * PQ, maxPatience: 50 * PQ,")
c7 = "      const cust = { biz: c.errandBiz, recipe: c.errand.recipe, isCrab: true, crab: c,"
assert src.count(c7) == 1
src = src.replace(c7, "      const cust = Object.setPrototypeOf({ biz: c.errandBiz, recipe: c.errand.recipe, isCrab: true, crab: c,")
c8 = "      patience: 90 * PQ, maxPatience: 90 * PQ, claimed: false, served: false, server: null };   // locals will wait"
assert src.count(c8) == 1
src = src.replace(c8, "      patience: 90 * PQ, maxPatience: 90 * PQ, claimed: false, served: false, server: null }, VisProto);   // locals will wait")
# the walk-in
c9 = "  return { biz: bizKey, recipe: r,"
assert src.count(c9) == 1
src = src.replace(c9, "  return Object.setPrototypeOf({ biz: bizKey, recipe: r,")
c10 = "    claimed: false, served: false, server: null };\n}"
assert src.count(c10) == 1
src = src.replace(c10, "    claimed: false, served: false, server: null }, VisProto);\n}")

open("game.js", "w").write(src)
n = sum(1 for a, b in zip(orig.split("\n"), []) )
print("patched; dsC:", src.count(".dsC"), " ksC:", src.count(".ksC"),
      " csC:", src.count(".csC"), " stC:", src.count(".stC"),
      " leftover dayState lit:", len(re.findall(r'dayState[^\n]*"', src)),
      " leftover k.state lit:", len(re.findall(r'k\.state[^\n]*"', src)))

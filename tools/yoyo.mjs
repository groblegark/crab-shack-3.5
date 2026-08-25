// THE YO-YO. Count home -> out-again departures per crab-evening, after shift end.
import { createSim } from "./simlib.mjs";
const arg = (k,d)=>{const i=process.argv.indexOf(k);return i>0&&process.argv[i+1]?process.argv[i+1]:d;};
const SEEDS=+arg("--seeds",3), DAYS=+arg("--days",10), CREW=+arg("--crew",6);
const ev=[];
for (let s=0;s<SEEDS;s++){
  const sim=createSim({seed:1337+s*337});
  sim.runUntil("day >= 2 && tmin >= 7 * 60",{maxSteps:200000});
  sim.G(`coins=3000; UPS.chef.lvl=Math.max(UPS.chef.lvl,${CREW}); while(crabs.length<${CREW}) hireCrew();`);
  // log every home->non-home departure with the hour and the destination state
  sim.G(`window._y=[]; window._yp={};
    window._t=function(){
      for (const c of allCrabs()){ const n=c.p.name, was=window._yp[n];
        if (was==="home" && c.dayState!=="home")
          window._y.push([day,Math.round(tmin),n,!!c.p.npc,c.dayState,awayToday(c)?1:0,Math.round(effShift(c).end)]);
        window._yp[n]=c.dayState; } return false; };`);
  const stop=sim.G(`day`)+DAYS; let g=0;
  while(sim.G(`day`)<stop && !sim.G("gameOver") && g++<8000){
    sim.G("if (coins < 500) coins = 900;");
    sim.runUntil(`window._t()`,{maxSteps:3000});
  }
  ev.push(...JSON.parse(sim.G("JSON.stringify(window._y)")));
  process.stdout.write(".");
}
process.stdout.write("\n");
const K=["day","tmin","name","npc","to","off","shEnd"];
const R=ev.map(a=>Object.fromEntries(a.map((v,i)=>[K[i],v])));
console.log(`== ${R.length} home->out departures, ${SEEDS} seeds x ${DAYS}d`);
const late=R.filter(r=>r.tmin>=20*60);
console.log(`departures AFTER 20:00 (i.e. leaving the house at night): ${late.length}`);
const byH=new Map(); for(const r of R) byH.set(Math.floor(r.tmin/60),(byH.get(Math.floor(r.tmin/60))||0)+1);
console.log("by hour:", [...byH].sort((a,b)=>a[0]-b[0]).map(([h,n])=>`${h}h:${n}`).join(" "));
console.log("night departures by destination:", JSON.stringify(Object.fromEntries(
  [...late.reduce((m,r)=>m.set(r.to,(m.get(r.to)||0)+1),new Map())].sort((a,b)=>b[1]-a[1]))));
// per crab-evening yo-yo count (after shift end, before 06:00)
const per=new Map();
for(const r of R){ if(!r.off && r.tmin < r.shEnd) continue;
  const k=r.day+"|"+r.name; per.set(k,(per.get(k)||0)+1); }
const v=[...per.values()].sort((a,b)=>b-a);
console.log(`per crab-evening trips out after clocking off: mean ${(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2)}  max ${v[0]}  >=3 trips: ${v.filter(x=>x>=3).length}/${v.length}`);
// day-off crabs
const offEv=R.filter(r=>r.off);
console.log(`departures on DAY-OFF crabs: ${offEv.length}; after 20:00: ${offEv.filter(r=>r.tmin>=20*60).length}`);

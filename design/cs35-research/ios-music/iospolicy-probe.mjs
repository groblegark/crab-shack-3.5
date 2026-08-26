import { chromium } from '/usr/local/lib/node_modules/playwright/index.mjs';
const b=await chromium.launch({executablePath:'/ms-playwright/chromium_headless_shell-1237/chrome-headless-shell-linux64/chrome-headless-shell'});
const p=await b.newPage();
// SIMULATE iOS: play() rejects NotAllowedError unless it happens inside a real
// gesture. This models the POLICY (which is what fails on a phone) rather than
// trying to obtain WebKit. Also count how many src swaps happen per tap.
await p.addInitScript(`
  window.__unlocked = false; window.__attempts = 0; window.__srcs = [];
  const proto = HTMLMediaElement.prototype;
  const realPlay = proto.play;
  proto.play = function(){
    window.__attempts++;
    if (!window.__gesture && !window.__unlocked) {
      return Promise.reject(Object.assign(new Error('NotAllowedError'),{name:'NotAllowedError'}));
    }
    window.__unlocked = true;
    return realPlay.call(this).catch(()=>{});
  };
  const d = Object.getOwnPropertyDescriptor(proto,'src');
  Object.defineProperty(proto,'src',{ get(){return d.get.call(this);},
    set(v){ window.__srcs.push(String(v)); d.set.call(this,v); } });
`);
await p.addInitScript('window.PROBE_UNSHIPPED='+(process.env.UNSHIPPED?'1':'undefined')+';');
 await p.goto('http://127.0.0.1:8899/index.html',{waitUntil:'load'});
await p.waitForTimeout(4000);
const before = await p.evaluate(()=>({attempts:window.__attempts,srcs:window.__srcs.length}));
console.log('AFTER 4s ON TITLE, NO TAP  ->', JSON.stringify(before), '(the storm their fix kills)');
// Now the record-box tap: simulate a gesture and play a SHIPPED row.
const tap = await p.evaluate(async ()=>{
  window.__gesture = true; const n0=window.__srcs.length, a0=window.__attempts;
  const r = window.eval(`(function(){
    var t=(typeof MUSCAT!=='undefined'&&MUSCAT&&MUSCAT.tracks)?MUSCAT.tracks:null;
    if(!t) return {err:'no catalog'};
    var want=(typeof PROBE_UNSHIPPED!=='undefined')?false:true; var sh=t.filter(function(x){return want?x.shipped:!x.shipped;});
    musPlay(sh[0]);
    return {name:sh[0].name, src: theSrc()};
    function theSrc(){ return SPEAKER? SPEAKER.src : '(none)'; }
  })()`);
  await new Promise(r=>setTimeout(r,1500)); window.__gesture=false;
  return {...r, srcSwapsDuringTap: window.__srcs.length-n0, playAttemptsDuringTap: window.__attempts-a0};
});
console.log('RECORD-BOX TAP (shipped row) ->', JSON.stringify(tap));
await b.close();

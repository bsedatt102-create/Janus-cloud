<!doctype html>
<!--
Projekti Janus — Interactive HTML Prototype
Run: save this entire source as projekti-janus.html and open in a modern browser.
No server, network, installation, external assets or real money needed.
Browser storage must be available for placement simulation and reload protection.
Test notes: 31 Chromium browser checks passed: arithmetic, negative-EV preset,
score threshold, invalid/overflow input, cap rejection, explicit acceptance,
lock interception, double click/action guards, modal keyboard containment,
reload/second-tab persistence, deadline boundaries, zero negative-EV cap,
responsive layout and reduced motion. An automated dashboard accessibility scan
reported zero violations. Desktop/mobile screenshots were visually reviewed.
Deadline boundaries were tested with a controlled browser clock, not a 60-second
wait. The UI still uses a real 60-second wall-clock lock: no fast-forward controls.
Untested: Firefox/Safari, physical mobile devices, screen readers, private-mode
storage, and prolonged real-world background suspension. Local storage/clock are
not tamper-proof. Nothing is hosted; all actions are simulations.
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>Projekti Janus — Interactive HTML Prototype</title>
<style>
:root{color-scheme:dark;--bg:#0b0e15;--panel:#151b27;--line:#344054;--text:#f1f5fc;--muted:#b1bfd4;--accent:#ff7884;--wash:#38232d;--blue:#80bcff;--good:#8fe4bf}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 system-ui,-apple-system,sans-serif}body.rational{--accent:#80bcff;--wash:#172e4a}
button,input{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.55}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #ffe195;outline-offset:4px}
button{border:1px solid var(--line);background:#202a3c;color:var(--text);border-radius:9px;padding:10px 14px;font-weight:650}button:hover:not(:disabled){border-color:var(--accent)}.primary{background:var(--accent);border-color:var(--accent);color:#101521}.secondary{background:transparent}.small{font-size:12px;padding:7px 10px}
header{border-bottom:1px solid var(--line);padding:24px max(24px,calc((100vw - 1280px)/2));display:flex;justify-content:space-between;gap:20px;align-items:center}h1{font-size:25px;letter-spacing:-1px;margin:0}h2{font-size:19px;margin:0 0 12px}h3{font-size:15px;margin:0 0 10px}p{margin:8px 0}small,.muted{color:var(--muted)}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:750;color:var(--accent);text-transform:uppercase}.badge{border:1px solid var(--accent);color:var(--accent);border-radius:30px;padding:5px 11px;font-size:11px;letter-spacing:1px;font-weight:750;white-space:nowrap}.brand{display:flex;align-items:center;gap:14px}.mark{width:43px;height:43px;border:2px solid var(--accent);border-radius:12px;display:grid;place-items:center;font-weight:900;font-size:26px}
main{max-width:1280px;margin:auto;padding:26px 24px 32px}.intro{display:flex;justify-content:space-between;gap:20px;margin-bottom:20px}.intro h2{font-size:28px;margin-bottom:4px}.actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.grid{display:grid;grid-template-columns:1.15fr .85fr;gap:20px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:22px;min-width:0}.stack{display:grid;gap:20px;align-content:start}.row{display:flex;justify-content:space-between;align-items:center;gap:12px}.rule{border-top:1px solid var(--line);margin:18px 0}.field-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}label{display:block;font-size:12px;font-weight:650;color:var(--muted)}input[type=number]{width:100%;border:1px solid #53627b;border-radius:8px;background:#0d1420;color:var(--text);padding:9px;margin-top:5px;min-width:0}input:disabled{opacity:.6}.leg{background:#101621;border:1px solid var(--line);border-radius:10px;padding:14px;margin-top:12px}.leg-head{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}.leg-head label{color:var(--text);font-size:14px}.leg input[type=checkbox]{accent-color:var(--accent);width:18px;height:18px}.leg-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fixture{display:block;font-size:12px;color:var(--muted);font-weight:400}.pitch{width:36px;height:27px;border:1px solid #5c8876;border-radius:3px;position:relative;background:#12332b;flex:none}.pitch:before{content:'';position:absolute;left:50%;top:0;height:100%;border-left:1px solid #5c8876}.pitch:after{content:'';position:absolute;width:10px;height:10px;border:1px solid #5c8876;border-radius:50%;left:12px;top:7px}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.metric{background:#0d1420;border:1px solid var(--line);border-radius:9px;padding:12px}.metric strong{display:block;font-size:24px;color:var(--accent);line-height:1.4}.metric span{font-size:11px;color:var(--muted)}.score-num{font-size:42px;line-height:1.1;font-weight:800;color:var(--accent)}progress{width:100%;height:10px;accent-color:var(--accent);margin:12px 0}.components{font-size:13px}.components div{display:flex;justify-content:space-between;padding:5px 0}.warning{background:var(--wash);border-left:3px solid var(--accent);padding:12px;border-radius:5px}.error{color:#ffb3bb;font-weight:650}.pulse{animation:pulse 1s ease-in-out 3}@keyframes pulse{50%{box-shadow:0 0 0 4px #ff788438}}.spark{width:100%;height:48px;margin-top:8px}.spark polyline{fill:none;stroke:var(--accent);stroke-width:3}.spark line{stroke:#65728b;stroke-dasharray:4 4}.spark text{fill:var(--muted);font-size:10px}
.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.calc-grid div{border-bottom:1px solid var(--line);padding-bottom:7px}.calc-grid span{display:block;color:var(--muted);font-size:12px}.calc-grid strong{font-size:18px}code{font-family:ui-monospace,monospace;font-size:12px;color:#cee1ff;overflow-wrap:anywhere}.flow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.flow button{text-align:left;position:relative;padding:12px;font-size:12px}.flow button b{display:block;font-size:14px}.flow .active{border-color:var(--accent);background:var(--wash)}.flow .selected{outline:1px dashed var(--blue);outline-offset:2px}.flow-wide{grid-column:1/-1}.arrow{color:var(--muted);font-size:11px}.flow-note{min-height:66px;font-size:13px;color:var(--muted)}ol.log{padding-left:0;list-style:none;max-height:190px;overflow:auto;margin-bottom:0}.log li{font-size:12px;border-bottom:1px solid var(--line);padding:8px 0}.log time{color:var(--blue);margin-right:8px}footer{margin-top:20px;font-size:12px;color:var(--muted)}.cap{font-size:32px;font-weight:800;color:var(--blue)}[hidden]{display:none!important}
dialog{background:#141b28;color:var(--text);border:1px solid var(--accent);border-radius:18px;padding:26px;width:min(590px,calc(100% - 32px));max-height:90dvh;overflow:auto;box-shadow:0 25px 100px #0009}dialog::backdrop{background:#04080de6;backdrop-filter:blur(5px)}dialog h2{font-size:26px}.timer{font-variant-numeric:tabular-nums;font-size:58px;font-weight:800;color:var(--accent);text-align:center;margin:16px 0 0}.timer-label{text-align:center;color:var(--muted);margin-bottom:18px}.modal-actions{margin-top:18px}.modal-actions button{width:100%}.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:900px){.grid{grid-template-columns:1fr}.intro{display:block}.intro .actions{margin-top:16px}}@media(max-width:540px){header{padding:18px;align-items:flex-start}.mark{display:none}h1{font-size:21px}main{padding:20px 14px}.panel{padding:16px}.field-grid{grid-template-columns:1fr 1fr}.metrics{gap:6px}.metric{padding:8px}.metric strong{font-size:20px}.intro h2{font-size:24px}.badge{font-size:9px;padding:5px 8px}.flow{gap:8px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<header><div class="brand"><div class="mark" aria-hidden="true">J</div><div><div class="eyebrow">Decision architecture / football</div><h1>Projekti Janus</h1></div></div><span class="badge">SIMULATION ONLY</span></header>
<main id="app">
<section class="intro" aria-labelledby="intro-title"><div><div class="eyebrow" id="scene">01 / Observe</div><h2 id="intro-title">A pause before the play.</h2><p class="muted">No real bets or money. Explore the decision, not the chase.</p></div><div class="actions"><button id="normal" class="secondary">Normal scenario</button><button id="tilt" class="primary">Simulate tilt after loss</button></div></section>
<p id="storage-error" class="warning error" hidden>Browser storage unavailable. Placement simulation is disabled because a reload-safe lock cannot be guaranteed. Enable local storage and reopen this file.</p>
<div class="grid">
<div class="stack">
<section class="panel" aria-labelledby="slip-title"><div class="row"><h2 id="slip-title">Illustrative football slip</h2><span class="badge" id="slip-type">3-LEG PARLAY</span></div><p class="muted">Fictional fixtures • assumed model estimates • decimal odds</p>
<div id="legs"></div>
<div class="rule"></div><div class="field-grid">
<label>Proposed stake (units)<input id="stake" type="number" min="0.01" step="0.01"></label>
<label>Baseline unit<input id="baseline" type="number" min="0.01" step="0.01"></label>
<label>ΔT — simulated seconds<input id="dt" type="number" min="0" step="1"></label>
<label>Session loss budget<input id="budget" type="number" min="0.01" step="0.01"></label>
<label>Illustrative prior losses<input id="losses" type="number" min="0" step="0.01"></label>
<label style="align-self:end;padding:12px 0"><input id="recent" type="checkbox"> Recent loss scenario</label>
</div><p class="muted"><small>Budget is discretionary and illustrative, never essential money. Accepted simulations reserve exposure against it.</small></p>
<p id="validation" class="error" role="alert" hidden></p>
<div class="actions" style="margin-top:16px"><button id="place" class="primary">Check simulated placement</button><button id="review" class="secondary">Review calculations</button></div>
<p id="result" role="status" class="muted">No simulated placement accepted.</p></section>
<section class="panel" aria-labelledby="math-title"><h2 id="math-title">Mathematical reality</h2><div id="calculations"></div><div class="rule"></div><p><code>O = ∏ decimal odds · p = ∏ assumed probabilities<br>EV / unit = p × O − 1 · expected profit = stake × EV</code></p><p class="muted"><small>Product probabilities assume independence. Correlation and uncertain estimates invalidate this simplification. These are not fair probabilities inferred from odds. Model-positive EV is not verified value.</small></p></section>
<section class="panel" id="rational-panel" aria-labelledby="rational-title" hidden><div class="eyebrow">04 / Rational review</div><h2 id="rational-title">Revisit. Do not auto-place.</h2><div id="cap-details"></div><p class="warning">Limits reduce exposure; they do not make betting safe. No amount is guaranteed safe.</p><div class="actions"><button id="revisit">Revisit original slip</button><button id="eligible" class="secondary">Load separate eligible example</button></div><p class="muted"><small>The optional single-leg example changes assumptions only on your explicit action. It is not a recommendation and does not recover losses.</small></p></section>
</div>
<div class="stack">
<section class="panel" aria-labelledby="telemetry-title"><div class="row"><h2 id="telemetry-title">Decision telemetry</h2><span class="eyebrow" id="risk-badge">MONITORING</span></div><div class="metrics"><div class="metric"><span>Decision speed ΔT</span><strong id="speed">—</strong><span>simulated input</span></div><div class="metric"><span>Stake multiplier</span><strong id="multiplier">—</strong><span>vs baseline</span></div><div class="metric"><span>Risk level</span><strong id="risk">—</strong><span>UI heuristic</span></div></div><div class="rule"></div><div class="row"><div><div class="eyebrow">Impulse score</div><div class="score-num" id="score">—</div></div><div class="muted">Threshold <strong>60 / 100</strong><br><small>Triggers at ≥ 60</small></div></div><progress id="score-bar" max="100" value="0" aria-label="Impulse score out of 100"></progress><svg class="spark" viewBox="0 0 400 50" role="img" aria-label="Illustrative recent impulse score trace; not measured neurological data"><line x1="0" y1="21" x2="400" y2="21"/><polyline id="trace" points="0,40 80,36 160,38 240,35 320,34 400,35"/><text x="2" y="12">threshold 60 — illustrative trace</text></svg><div id="components" class="components"></div><p id="trigger-note" class="warning">A transparent UI heuristic, not clinically validated. A pause does not guarantee rationality or neurological efficacy.</p></section>
<section class="panel" aria-labelledby="flow-title"><div class="eyebrow">Interactive guard map</div><h2 id="flow-title">Decision → friction → review</h2><p class="muted"><small>Click a node to inspect its rule. Navigation never accepts a bet or bypasses a lock.</small></p><nav class="flow" aria-label="Decision flowchart">
<button data-node="observe" class="flow-wide"><b>01 · Observe slip</b><span class="arrow">↓ validate finite inputs</span></button>
<button data-node="ev"><b>EV ≤ 0?</b><span class="arrow">Yes → intercept · No ↓</span></button>
<button data-node="extreme"><b>Extreme risk?</b><span class="arrow">Yes → intercept · No ↓</span></button>
<button data-node="impulse" class="flow-wide"><b>02 · Impulse ≥ 60?</b><span class="arrow">Yes → intercept · No → manual review</span></button>
<button data-node="lock" class="flow-wide"><b>03 · Cooling lock · 60s</b><span class="arrow">All warning branches → lock → expiration ↓</span></button>
<button data-node="review" class="flow-wide"><b>04 · Review & budget cap</b><span class="arrow">EV ≤ 0 / risk unresolved → cap 0 · eligible → explicit capped simulation</span></button>
</nav><div id="flow-note" class="flow-note">Active stage: observe. No simulated placement accepted.</div></section>
<section class="panel"><div class="row"><h2>Session event log</h2><span class="muted" id="accepted-count">0 accepted</span></div><ol id="log" class="log" aria-label="Timestamped simulation events"></ol></section>
</div></div>
<footer><strong>Simulation, not financial advice.</strong> This local prototype uses your browser’s clock and storage, not production-grade tamper protection. Changing the clock, clearing storage, or modifying the source can defeat it. Keep the same file/location and browser profile for reload persistence; private mode and file-storage behavior vary. No network requests, accounts, payments, or wagers.</footer>
<p id="announcement" class="sr" role="status" aria-live="polite"></p>
</main>
<dialog id="guard" aria-labelledby="modal-title" aria-describedby="modal-reason"><div class="eyebrow" id="modal-stage">03 / Intercepted before acceptance</div><h2 id="modal-title">Mathematical Reality / Negative Expected Value</h2><p id="modal-reason"></p><div id="modal-math"></div><div class="timer" id="countdown" aria-label="Cooling time remaining">01:00</div><div class="timer-label" id="timer-label">Actual 60-second cooling lock • no skip</div><p class="muted"><small>Editable bets stay locked while this modal is open. The countdown uses an absolute wall-clock deadline and refreshes on return to the tab. No simulated placement has been accepted by this interception.</small></p><div class="modal-actions"><button id="finish" disabled>Cooling lock active</button></div></dialog>
<script>
(() => {
'use strict';
const KEY='janus.guard.v1', THRESHOLD=60, LOCK_MS=60000;
const $=id=>document.getElementById(id);
const names=[['Northbridge FC vs Vale United','Northbridge to win'],['Harbor City vs Alpine FC','Over 2.5 goals'],['Eastfield vs Riverside','Both teams to score']];
const notes={observe:'Validate odds > 1, probabilities strictly between 0% and 100%, positive stake/baseline/budget, and nonnegative time/losses. Invalid values stop every placement route.',ev:'EV ≤ 0 triggers interception. Negative EV means negative expectation under the stated assumptions, not certainty of a loss. Cap is zero for this proposal.',extreme:'Extreme risk: combined odds ≥ 15 or stake ≥ 5× baseline. These conservative demonstration rules trigger a lock even if assumed EV is positive.',impulse:'Score = rushed time (0/15/30) + stake escalation (0/10/20/35) + recent loss (20) + 2+ legs (15), capped at 100. Score ≥ 60 triggers interception.',lock:'An absolute persisted unlock timestamp controls the real 60-second lock. No navigation, preset, double click, reset or reload can shorten an active lock through this UI.',review:'Review never places automatically. Negative EV or unresolved risk gives cap 0. Eligible maximum = min(baseline, 5% of remaining discretionary loss budget). A separate explicit click is required to simulate acceptance.'};
function base(){return {legs:[{on:true,odds:'1.7',p:'65'},{on:true,odds:'1.8',p:'65'},{on:true,odds:'1.6',p:'70'}],stake:'5',baseline:'10',dt:'45',budget:'200',losses:'0',recent:false,reserved:0,accepted:0,unlockAt:0,stage:'observe',reviewed:false,selected:'observe',events:[],result:'No simulated placement accepted.'};}
let s=base(), storageOK=true;
try{localStorage.setItem(KEY+'.probe','1');localStorage.removeItem(KEY+'.probe');const raw=localStorage.getItem(KEY);if(raw){const saved=JSON.parse(raw);if(saved && Array.isArray(saved.legs)&&saved.legs.length===3&&Number.isFinite(saved.unlockAt)&&Array.isArray(saved.events)){s={...base(),...saved};}}}catch(e){storageOK=false;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){storageOK=false;$('storage-error').hidden=false;}}
function log(message){s.events.push({at:Date.now(),message});s.events=s.events.slice(-40);persist();}
function sync(){if(!storageOK)return;try{const raw=localStorage.getItem(KEY);if(raw){const other=JSON.parse(raw);if(Number.isFinite(other.unlockAt)&&other.unlockAt>Date.now()&&other.unlockAt>=s.unlockAt){s=other;}}}catch(e){storageOK=false;}}
function locked(){sync();return s.unlockAt>Date.now();}
function busy(){return locked()||$('guard').open;}
function number(value){if(typeof value==='boolean'||value===null||String(value).trim()==='')return NaN;return Number(value);}
function calculate(){
 const errors=[], active=s.legs.filter(l=>l.on);let odds=1,p=1;
 if(!active.length)errors.push('Select at least one leg.');
 s.legs.forEach((l,i)=>{const o=number(l.odds),q=number(l.p);if(!Number.isFinite(o)||o<=1)errors.push('Leg '+(i+1)+': decimal odds must be finite and greater than 1.');if(!Number.isFinite(q)||q<=0||q>=100)errors.push('Leg '+(i+1)+': probability must be strictly between 0 and 100.');if(l.on){odds*=o;p*=q/100;}});
 const stake=number(s.stake),baseline=number(s.baseline),dt=number(s.dt),budget=number(s.budget),losses=number(s.losses);
 for(const [n,v] of [['Stake',stake],['Baseline',baseline],['Budget',budget]])if(!Number.isFinite(v)||v<=0)errors.push(n+' must be finite and positive.');
 if(!Number.isFinite(dt)||dt<0)errors.push('Simulated ΔT must be finite and nonnegative.');
 if(!Number.isFinite(losses)||losses<0)errors.push('Prior losses must be finite and nonnegative.');
 const ev=p*odds-1,profit=stake*ev,mult=stake/baseline;
 const remaining=Math.max(0,budget-losses-s.reserved),budgetCap=Math.min(baseline,.05*remaining);
 const parts=[dt<10?30:dt<30?15:0,mult>=5?35:mult>=3?20:mult>=2?10:0,s.recent?20:0,active.length>=2?15:0];
 const score=Math.min(100,parts.reduce((a,b)=>a+b,0));const extreme=odds>=15||mult>=5;
 const eligible=ev>0&&!extreme&&score<THRESHOLD;
 const cap=eligible?budgetCap:0;
 if(![odds,p,ev,profit,profit*100,mult,remaining,budgetCap,cap,1/odds].every(Number.isFinite))errors.push('Values are too large to calculate reliably.');
 return {errors,odds,p,ev,profit,mult,remaining,budgetCap,cap,parts,score,extreme,eligible,stake,count:active.length};
}
const fmt=(v,d=2)=>Number.isFinite(v)?v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
function mathHTML(c){return '<div class="calc-grid"><div><span>Combined decimal odds</span><strong>'+fmt(c.odds,3)+'</strong></div><div><span>Assumed joint chance</span><strong>'+fmt(c.p*100,3)+'%</strong></div><div><span>Break-even chance</span><strong>'+fmt(100/c.odds,3)+'%</strong></div><div><span>EV per unit</span><strong>'+fmt(c.ev,4)+' ('+fmt(c.ev*100)+'%)</strong></div><div><span>Expected '+(c.profit<0?'loss':'profit')+' at proposed stake</span><strong>'+fmt(Math.abs(c.profit))+' units</strong></div><div><span>100 identical bets: net expectation</span><strong>'+fmt(c.profit*100)+' units</strong></div></div><p class="muted"><small>100 × '+fmt(c.stake)+' × '+fmt(c.ev,4)+'; an expectation, not a predicted realized result. Outcomes vary; you could lose every stake.</small></p>';}
function drawLegs(){ $('legs').innerHTML=names.map((n,i)=>'<div class="leg"><div class="leg-head"><div class="pitch" aria-hidden="true"></div><input type="checkbox" id="leg'+i+'" data-leg="'+i+'" data-field="on" aria-label="Include leg '+(i+1)+'"><label for="leg'+i+'">'+n[1]+'<span class="fixture">'+n[0]+' • illustrative</span></label></div><div class="leg-fields"><label>Leg '+(i+1)+' decimal odds<input type="number" step="0.01" data-leg="'+i+'" data-field="odds"></label><label>Leg '+(i+1)+' assumed probability (%)<input type="number" step="0.1" data-leg="'+i+'" data-field="p"></label></div></div>').join('');}
function render(){
 const c=calculate(), valid=!c.errors.length, isLock=s.unlockAt>Date.now(), modal=$('guard').open;
 document.body.classList.toggle('rational',s.stage==='review');
 $('scene').textContent=isLock?'03 / Cooling lock':s.stage==='review'?'04 / Rational review':s.stage==='impulse'?'02 / Impulse trigger':'01 / Observe';
 $('intro-title').textContent=isLock?'The next move is a pause.':s.stage==='review'?'Less exposure. More perspective.':s.stage==='impulse'?'The chase changes the decision.':'A pause before the play.';
 document.querySelectorAll('[data-leg]').forEach(el=>{const l=s.legs[Number(el.dataset.leg)];if(el.type==='checkbox')el.checked=!!l.on;else el.value=l[el.dataset.field];el.disabled=isLock||modal;});
 for(const key of ['stake','baseline','dt','budget','losses']){$(key).value=s[key];$(key).disabled=isLock||modal;}$('recent').checked=s.recent;$('recent').disabled=isLock||modal;
 for(const id of ['normal','tilt','review','revisit','eligible'])$(id).disabled=isLock||modal;
 $('place').disabled=isLock||modal||!valid||!storageOK;$('place').textContent=s.reviewed?'Simulate placement (cap enforced)':'Check simulated placement';
 $('storage-error').hidden=storageOK;$('validation').hidden=valid;$('validation').textContent=c.errors.join(' ');
 $('slip-type').textContent=valid?(c.count===1?'SINGLE LEG':c.count+'-LEG PARLAY'):'INPUT ERROR';
 $('speed').textContent=valid?fmt(number(s.dt),0)+'s':'—';$('multiplier').textContent=valid?fmt(c.mult)+'×':'—';$('risk').textContent=valid?(c.extreme?'Extreme':c.count>1?'Elevated':'Lower'):'—';
 $('score').textContent=valid?c.score+' / 100':'—';$('score-bar').value=valid?c.score:0;
 $('risk-badge').textContent=isLock?'LOCKED':valid&&c.score>=60?'THRESHOLD BREACHED':'MONITORING';
 $('trace').setAttribute('points','0,40 80,36 160,38 240,35 320,34 400,'+(valid?Math.max(3,48-c.score*.45):48));
 $('components').innerHTML=valid?['Rushed ΔT (<10s: 30; <30s: 15)','Stake ≥2×: 10; ≥3×: 20; ≥5×: 35','Recent loss: 20','Parlay (2+ legs): 15'].map((name,i)=>'<div><span>'+name+'</span><b>+'+c.parts[i]+'</b></div>').join(''):'Correct inputs to calculate the heuristic.';
 $('calculations').innerHTML=valid?mathHTML(c):'<p class="error">Calculations unavailable until all inputs are valid.</p>';
 $('rational-panel').hidden=s.stage!=='review';
 $('cap-details').innerHTML=valid?'<div class="cap">'+fmt(c.cap)+' units</div><p>Proposed-bet cap '+(c.ev<=0?'= 0: EV ≤ 0. Do not place.':!c.eligible?'= 0: impulse or extreme risk remains unresolved.':'= budget-based maximum for an eligible reviewed scenario.')+'</p><p class="muted">Remaining budget = '+fmt(number(s.budget))+' − '+fmt(number(s.losses))+' prior losses − '+fmt(s.reserved)+' reserved exposure = '+fmt(c.remaining)+'.<br>Separate eligible maximum = min('+fmt(number(s.baseline))+' baseline, 5% × '+fmt(c.remaining)+') = '+fmt(c.budgetCap)+' units.</p>':'<p class="error">No cap: correct invalid inputs before review.</p>';
 $('result').textContent=s.result;$('accepted-count').textContent=s.accepted+' accepted';
 $('log').replaceChildren(...s.events.slice().reverse().map(e=>{const li=document.createElement('li'),t=document.createElement('time');t.textContent=new Date(e.at).toLocaleTimeString('en-GB');li.append(t,document.createTextNode(e.message));return li;}));
 const active=isLock?'lock':s.stage==='review'?'review':s.stage==='impulse'?'impulse':'observe';
 document.querySelectorAll('[data-node]').forEach(b=>{b.classList.toggle('active',b.dataset.node===active);b.classList.toggle('selected',b.dataset.node===s.selected);b.setAttribute('aria-current',b.dataset.node===active?'step':'false');});
 $('flow-note').textContent='Active: '+active+'. '+notes[s.selected];
}
function expire(){if(s.unlockAt&&s.unlockAt<=Date.now()&&s.stage==='lock'){s.stage='review';s.reviewed=true;s.selected='review';s.result='Cooling complete. Review the unchanged slip; nothing placed automatically.';log('60-second lock expired. Rational review available; original slip unchanged.');$('announcement').textContent=s.result;render();}}
function tick(){sync();expire();if(s.unlockAt>Date.now()&&!$('guard').open)openGuard();if($('guard').open){const seconds=Math.max(0,Math.ceil((s.unlockAt-Date.now())/1000));$('countdown').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');$('finish').disabled=seconds>0;$('finish').textContent=seconds>0?'Cooling lock active':'Open rational review — no placement';$('timer-label').textContent=seconds>0?'Actual 60-second cooling lock • no skip':'Cooling complete • review required';} }
function openGuard(){const c=calculate();if(!c.errors.length){$('modal-title').textContent=c.ev<=0?'Mathematical Reality / Negative Expected Value':'Mathematical Reality / Risk Interception';$('modal-math').innerHTML=mathHTML(c);$('modal-reason').textContent='Intercepted BEFORE acceptance. '+[c.ev<=0?'EV ≤ 0.':'',c.extreme?'Extreme risk.':'',c.score>=60?'Impulse '+c.score+' ≥ '+THRESHOLD+'.':''].filter(Boolean).join(' ')+' Independence and probability assumptions may be wrong.';}if(!$('guard').open){$('guard').showModal();$('guard').setAttribute('tabindex','-1');$('guard').focus();}render();}
function denyBusy(){if(busy()){tick();return true;}return false;}
function intercept(c){if(denyBusy())return;s.unlockAt=Date.now()+LOCK_MS;s.stage='lock';s.reviewed=false;s.selected='lock';s.result='Intercepted before acceptance. No simulated bet placed.';log('Placement intercepted: EV '+fmt(c.ev,4)+', score '+c.score+', extreme risk '+c.extreme+'. 60-second lock started.');if(!storageOK){s.result='Storage failed. Placement remains disabled.';}openGuard();tick();}
function review(){if(denyBusy())return;const c=calculate();if(c.errors.length){s.result='Review rejected: invalid input.';log(s.result);render();return;}s.stage='review';s.reviewed=true;s.selected='review';s.result='Manual review opened. No placement accepted.';log(s.result);render();}
function place(){if(denyBusy())return;if(!storageOK){s.result='Cannot simulate placement without persistent storage.';render();return;}const c=calculate();if(c.errors.length){s.result='Invalid input: simulation rejected.';log(s.result);render();return;}if(!c.eligible){intercept(c);return;}if(!s.reviewed){review();s.result='Eligible under illustrative assumptions only. Review the cap, then explicitly simulate if desired.';persist();render();return;}if(c.stake>c.cap+1e-9){s.result='Rejected: stake '+fmt(c.stake)+' exceeds reviewed cap '+fmt(c.cap)+'.';log(s.result);render();return;}s.reserved+=c.stake;s.accepted++;s.reviewed=false;s.result='Simulated placement accepted ('+fmt(c.stake)+' units); no real bet or money. Exposure reserved against budget.';log(s.result);render();}
function preset(kind){if(denyBusy())return;const old=s;const next=base();next.events=old.events;next.accepted=old.accepted;next.reserved=old.reserved;next.budget=old.budget;next.baseline=old.baseline;next.losses=old.losses;
 if(kind==='tilt'){next.legs=[{on:true,odds:'2.4',p:'35'},{on:true,odds:'2.1',p:'40'},{on:true,odds:'1.9',p:'45'}];next.stake='60';next.baseline='10';next.budget='200';next.losses='50';next.dt='4';next.recent=true;next.stage='impulse';next.selected='impulse';next.result='Tilt preset loaded: recent loss, rushed 4s decision, 6× stake, 3-leg parlay. Nothing placed.';}
 else if(kind==='eligible'){next.legs=[{on:true,odds:'2',p:'55'},{on:false,odds:'1.8',p:'65'},{on:false,odds:'1.6',p:'70'}];next.stake='5';next.dt='60';next.stage='review';next.reviewed=true;next.selected='review';next.result='Separate single-leg model-positive example loaded by your action. Estimates unverified; no placement.';}
 else{next.result='Normal non-tilt scenario loaded. Existing losses and reserved exposure preserved.';}
 s=next;log(s.result);render();if(kind==='tilt'){$('trigger-note').classList.remove('pulse');void $('trigger-note').offsetWidth;$('trigger-note').classList.add('pulse');$('announcement').textContent='Impulse score 100, above threshold 60. Negative EV trap loaded.';}}
drawLegs();
document.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{if(denyBusy()){render();return;}if(el.dataset.leg!==undefined){s.legs[Number(el.dataset.leg)][el.dataset.field]=el.type==='checkbox'?el.checked:el.value;}else{s[el.id]=el.type==='checkbox'?el.checked:el.value;}s.reviewed=false;if(s.stage!=='review')s.stage='observe';s.result='Slip changed. Explicit review required before eligible acceptance.';persist();render();}));
document.querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{if(!busy()){log('Edited '+(el.dataset.leg!==undefined?'leg '+(Number(el.dataset.leg)+1)+' '+el.dataset.field:el.id)+'. Review invalidated.');render();}}));
$('normal').addEventListener('click',()=>preset('normal'));$('tilt').addEventListener('click',()=>preset('tilt'));$('eligible').addEventListener('click',()=>preset('eligible'));$('place').addEventListener('click',place);$('review').addEventListener('click',review);
$('revisit').addEventListener('click',()=>{if(denyBusy())return;log('Revisited unchanged slip; no placement.');render();$('stake').focus();$('slip-title').scrollIntoView({block:'start'});});
document.querySelectorAll('[data-node]').forEach(b=>b.addEventListener('click',()=>{if(denyBusy())return;s.selected=b.dataset.node;log('Inspected flow rule: '+s.selected+'. No state bypass or acceptance.');render();}));
$('guard').addEventListener('cancel',e=>e.preventDefault());
$('guard').addEventListener('keydown',e=>{if(e.key==='Tab'){const b=$('finish');e.preventDefault();if(b.disabled)$('guard').focus();else b.focus();}});
$('finish').addEventListener('click',()=>{if(locked()){tick();return;}expire();$('guard').close();s.stage='review';s.reviewed=true;s.selected='review';log('Rational review opened after expiration. No automatic placement.');render();$('rational-title').setAttribute('tabindex','-1');$('rational-title').focus();});
window.addEventListener('storage',()=>{sync();tick();render();});document.addEventListener('visibilitychange',tick);window.addEventListener('pageshow',tick);window.addEventListener('focus',tick);
if(!s.events.length)log('Local simulation initialized. All fixture data illustrative.');
expire();render();tick();setInterval(tick,250);
})();
</script>
</body>
</html>

<!doctype html>

<html lang="en"><head>
<!--
Janus — Player impact merged source. PARTIAL analytical capability.
Save this complete source as projekti-janus.html and open in a browser.
No initial network requests. On-demand read-only fixture fetch needs internet.
If local-file CORS is blocked in your environment, serve this file over localhost
using an ordinary static HTTP server. Never disable browser security.
All placement is simulation; no wagers, money, guarantees or calibrated prediction.
Live schedule data does not provide projected xG, bench ratings, normalized current
form, five-year strength, comprehensive H2H, motivation, volatility, model market
probability, pitch, climate shock, player availability, injury return or fatigue. Missing context blocks all-rule eligibility.
Manual enrichment is unverified assumption, not fully automated validated analysis.
No forecast lookup implemented: weather/pitch/climate require explicit manual context.
Source scope, provider caching, UTC uncertainty and retrieval times are shown in UI.
Historical source remains untouched. Verification notes are appended after testing.
Local clock/storage are tamperable; cross-tab coordination is best effort.
-->
<!--
Executed verification of this player-impact integration: 404 checks passed:
65 core guard; 172 motivation/environment/selector/merged integration;
65 live-scan and controlled scan cases; 102 player-specific engine/UI/migration cases.
These are executed Chromium checks, not a prediction or safety certification.
Player cases include exact constants and public snake_case methods, Python-style
nearest-even rounding (including binary midpoint cases), absent ELSE recovered,
fatigue 0.8 versus 0.8001, combined factors 0.675/0.765, two-team sums,
zero valid, negative/type/unknown/range/overflow rejection, raw 1.598 FAIL despite
display 1.60, both-team completeness, per-fixture isolation, manual/DEMO provenance,
live UNKNOWN adaptation, reconfirmation, HOLD after penalties, unchanged market EV,
fingerprints, forced locked events, old playerless active lock migration/reload,
unchanged deadline/challenge/exposure and released negative-EV no-relock behavior.
Prior core/merged/scan suites were rerun, not copied historical counts. They cover
strict impulse >3.5/floor0.25, observed click velocity separate, signed math+ack OR
exact timer expiry, frozen snapshots, caps/duplicate checks, 1–8 legs, symmetric
motivation, environmental >=3 guard, selector strict/inclusive boundaries, sorting,
deduplication, mocked errors/timeouts/partial success/cooldown/out-of-order responses,
async lock-start discard, no initial network, current UTC date and narrow CSP.
Actual ordinary Chromium file:// scan rerun at 2026-11-12T02:31:28.199298+00:00:
OpenLigaDB BL1 returned 306 season entries and zero day fixtures; TheSportsDB
returned 3 capped records, all unknown for eligibility. Results remained HOLD.
Canonical downloaded HTML also booted its player editor and fetched the capped
sample. No forecast lookup or live player analytics were added or tested.
Responsive DOM/text bounds: 320/390/1280px; keyboard controls and modal Tab/Escape
behavior checked. Automated accessibility scans: zero reported violations.
No shipped test hooks or fast-forward. An additional 15 final acceptance checks
passed: complete source, all modules, no boot network, per-leg impact summaries,
player edits/isolation, 320/390/1280px text bounds, actual capped file-browser fetch,
UNKNOWN/HOLD, canonical download retaining run/test notes, independent boot and
absence of runtime errors. Thus 419 functional/acceptance checks executed in total.
Untested: Firefox/Safari, physical devices, screen readers, prolonged background
suspension, private-mode variations and simultaneous cross-tab races. Storage/clock
are locally tamperable; cross-tab coordination is best effort. No calibration exists
linking player-adjusted xG or TPI to the manually assumed market probability/EV.
Partial live capabilities remain: feeds do not supply projected xG, player
availability/injury return/fatigue, bench/volatility analytics, calibrated market
probability, verified form/five-year/H2H or motivation/pitch/climate context.
Manual assumptions permit illustrative review, not automated validated prediction.
-->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https://api.openligadb.de https://www.thesportsdb.com; base-uri 'none'; form-action 'none'">
<title>Anti-Impulse Football Guard — Today Scan + Player Impact</title><style>
:root{color-scheme:dark;--bg:#0b0e15;--panel:#151b27;--line:#344054;--text:#f1f5fc;--muted:#b1bfd4;--accent:#ff7884;--wash:#38232d;--blue:#80bcff;--good:#8fe4bf}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 system-ui,-apple-system,sans-serif}body.rational{--accent:#80bcff;--wash:#172e4a}
button,input{font:inherit}.panel,.leg,button,summary{overflow-wrap:anywhere}details{margin-top:14px}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.55}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #ffe195;outline-offset:4px}
button{border:1px solid var(--line);background:#202a3c;color:var(--text);border-radius:9px;padding:10px 14px;font-weight:650}button:hover:not(:disabled){border-color:var(--accent)}.primary{background:var(--accent);border-color:var(--accent);color:#101521}.secondary{background:transparent}.small{font-size:12px;padding:7px 10px}
header{border-bottom:1px solid var(--line);padding:24px max(24px,calc((100vw - 1280px)/2));display:flex;justify-content:space-between;gap:20px;align-items:center}h1{font-size:25px;letter-spacing:-1px;margin:0}h2{font-size:19px;margin:0 0 12px}h3{font-size:15px;margin:0 0 10px}p{margin:8px 0}small,.muted{color:var(--muted)}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:750;color:var(--accent);text-transform:uppercase}.badge{border:1px solid var(--accent);color:var(--accent);border-radius:30px;padding:5px 11px;font-size:11px;letter-spacing:1px;font-weight:750;white-space:nowrap}.brand{display:flex;align-items:center;gap:14px}.mark{width:43px;height:43px;border:2px solid var(--accent);border-radius:12px;display:grid;place-items:center;font-weight:900;font-size:26px}
main{max-width:1280px;margin:auto;padding:26px 24px 32px}.intro{display:flex;justify-content:space-between;gap:20px;margin-bottom:20px}.intro h2{font-size:28px;margin-bottom:4px}.actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.grid{display:grid;grid-template-columns:1.15fr .85fr;gap:20px}.panel{background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:22px;min-width:0}.stack{display:grid;gap:20px;align-content:start}.row{display:flex;justify-content:space-between;align-items:center;gap:12px}.rule{border-top:1px solid var(--line);margin:18px 0}.field-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}label{display:block;font-size:12px;font-weight:650;color:var(--muted)}input[type=number]{width:100%;border:1px solid #53627b;border-radius:8px;background:#0d1420;color:var(--text);padding:9px;margin-top:5px;min-width:0}input:disabled{opacity:.6}.leg{background:#101621;border:1px solid var(--line);border-radius:10px;padding:14px;margin-top:12px}.leg-head{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}.leg-head label{color:var(--text);font-size:14px}.leg input[type=checkbox]{accent-color:var(--accent);width:18px;height:18px}.leg-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fixture{display:block;font-size:12px;color:var(--muted);font-weight:400}.pitch{width:36px;height:27px;border:1px solid #5c8876;border-radius:3px;position:relative;background:#12332b;flex:none}.pitch:before{content:'';position:absolute;left:50%;top:0;height:100%;border-left:1px solid #5c8876}.pitch:after{content:'';position:absolute;width:10px;height:10px;border:1px solid #5c8876;border-radius:50%;left:12px;top:7px}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.metric{background:#0d1420;border:1px solid var(--line);border-radius:9px;padding:12px}.metric strong{display:block;font-size:24px;color:var(--accent);line-height:1.4}.metric span{font-size:11px;color:var(--muted)}.score-num{font-size:42px;line-height:1.1;font-weight:800;color:var(--accent)}progress{width:100%;height:10px;accent-color:var(--accent);margin:12px 0}.components{font-size:13px}.components div{display:flex;justify-content:space-between;padding:5px 0}.warning{background:var(--wash);border-left:3px solid var(--accent);padding:12px;border-radius:5px}.error{color:#ffb3bb;font-weight:650}.pulse{animation:pulse 1s ease-in-out 3}@keyframes pulse{50%{box-shadow:0 0 0 4px #ff788438}}.spark{width:100%;height:48px;margin-top:8px}.spark polyline{fill:none;stroke:var(--accent);stroke-width:3}.spark line{stroke:#65728b;stroke-dasharray:4 4}.spark text{fill:var(--muted);font-size:10px}
.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.calc-grid div{border-bottom:1px solid var(--line);padding-bottom:7px}.calc-grid span{display:block;color:var(--muted);font-size:12px}.calc-grid strong{font-size:18px}code{font-family:ui-monospace,monospace;font-size:12px;color:#cee1ff;overflow-wrap:anywhere}.flow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.flow button{text-align:left;position:relative;padding:12px;font-size:12px}.flow button b{display:block;font-size:14px}.flow .active{border-color:var(--accent);background:var(--wash)}.flow .selected{outline:1px dashed var(--blue);outline-offset:2px}.flow-wide{grid-column:1/-1}.arrow{color:var(--muted);font-size:11px}.flow-note{min-height:66px;font-size:13px;color:var(--muted)}ol.log{padding-left:0;list-style:none;max-height:190px;overflow:auto;margin-bottom:0}.log li{font-size:12px;border-bottom:1px solid var(--line);padding:8px 0}.log time{color:var(--blue);margin-right:8px}footer{margin-top:20px;font-size:12px;color:var(--muted)}.cap{font-size:32px;font-weight:800;color:var(--blue)}[hidden]{display:none!important}
dialog{background:#141b28;color:var(--text);border:1px solid var(--accent);border-radius:18px;padding:26px;width:min(590px,calc(100% - 32px));max-height:90dvh;overflow:auto;box-shadow:0 25px 100px #0009}dialog::backdrop{background:#04080de6;backdrop-filter:blur(5px)}dialog h2{font-size:26px}.timer{font-variant-numeric:tabular-nums;font-size:58px;font-weight:800;color:var(--accent);text-align:center;margin:16px 0 0}.timer-label{text-align:center;color:var(--muted);margin-bottom:18px}.modal-actions{margin-top:18px}.modal-actions button{width:100%}.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:900px){.grid{grid-template-columns:1fr}.intro{display:block}.intro .actions{margin-top:16px}}@media(max-width:540px){header{padding:18px;align-items:flex-start}.mark{display:none}h1{font-size:21px}main{padding:20px 14px}.panel{padding:16px}.field-grid{grid-template-columns:1fr 1fr}.metrics{gap:6px}.metric{padding:8px}.metric strong{font-size:20px}.intro h2{font-size:24px}.badge{font-size:9px;padding:5px 8px}.flow{gap:8px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}

.flow{grid-template-columns:1fr 1fr}.flow button{min-height:95px}
.formula{font-size:14px}select{display:block;width:100%;margin:6px 0 12px;background:#0d1420;color:var(--text);font:inherit;padding:10px;border:1px solid #53627b;border-radius:8px}select:focus-visible{outline:3px solid #ffe195;outline-offset:3px}.checks{display:flex;gap:10px;align-items:flex-start;margin:14px 0}
.checks input{width:20px;height:20px;flex:none}.checks label{font-size:13px}
.challenge{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.modal-actions button{margin-top:8px}.metric strong{font-size:21px}
@media(max-width:540px){.challenge{grid-template-columns:1fr}.brand h1{font-size:18px}}

input[type=text]{width:100%;min-width:0;background:#0d1420;color:var(--text);
border:1px solid #53627b;border-radius:8px;padding:9px;margin-top:5px}
fieldset{min-width:0}legend{font-weight:700;color:var(--blue)}
#analytics-panel p{overflow-wrap:anywhere}#analytics-panel select{min-width:0}
@media(max-width:540px){#analytics-panel .leg-fields{grid-template-columns:1fr}}
</style></head><body>
<header><div class="brand"><div class="mark" aria-hidden="true">J</div><div><div class="eyebrow">Projekti Janus / decision architecture</div><h1>Anti-Impulse Football Guard</h1></div></div><span class="badge">NO REAL MONEY</span></header>
<main><section class="intro"><div><div class="eyebrow" id="scene">01 / Input Monitoring</div><h2>A pause before the play.</h2><p class="muted">“Transforming the mechanics of risk and illusion into absolute mathematical transparency.”</p><small>A design aspiration: arithmetic is conditional on assumptions, not certainty about probabilities.</small></div><div class="actions"><button id="normal">Calm normal scenario</button><button id="tilt" class="primary">Simulate tilt after loss</button></div></section>
<p id="storage-error" class="warning error" role="alert" hidden>Storage unavailable or invalid. Fail-closed: all placement simulation is disabled. Any in-memory cooling lock remains active. Reopen with usable local storage; this is not production security.</p>
<div class="grid"><div class="stack">
<section class="panel"><div class="row"><h2>Illustrative football slip</h2><span class="badge">LOCAL SIMULATION</span></div><p id="slip-data-note" class="muted">DEMO fixtures • editable assumed model probabilities</p><p id="leg-count"></p><div id="legs"></div><div class="actions"><button id="add-leg">Add fictional custom leg</button><button id="remove-leg">Remove last leg (minimum one)</button></div>
<div class="rule"></div><div class="field-grid">
<label>Stake (units)<input id="stake" type="number" step="0.01"></label>
<label>Discretionary bankroll<input id="bankroll" type="number" step="0.01"></label>
<label>Baseline maximum unit<input id="baseline" type="number" step="0.01"></label>
<label>Session loss budget<input id="budget" type="number" step="0.01"></label>
<label>Simulated prior loss units<input id="spent" type="number" step="0.01"></label>
<label>Consecutive simulated losses<input id="streak" type="number" step="1" min="0"></label>
</div><div class="actions" style="margin-top:12px"><button id="loss">Record simulated loss</button><button id="win">Simulated win: reset streak</button></div>
<p class="muted"><small>No outcomes are observed from real matches. Loss button increases the streak only; prior loss units are a separate editable budget input. A win resets the streak, never refunds reserved exposure.</small></p>
<div class="warning"><label>Telemetry mode<select id="mode"><option value="observed">Observed local decision time</option><option value="demo">Manual demo override (time only)</option></select></label><label>Demo decision seconds (floor 0.25s)<input id="demoTime" type="number" step="0.25"></label><small id="mode-note"></small></div>
<p id="validation" class="error" role="alert" hidden></p><div class="actions" style="margin-top:16px"><button id="place" class="primary">Place Bet — simulation check</button><button id="review">Start rational review</button></div><p id="result" role="status"></p></section>
<section class="panel" id="daily-panel" aria-labelledby="daily-title">
<div class="eyebrow">DailyMatchSelector / DEMO or live schedule</div>
<h2 id="daily-title">Today’s fixture workspace</h2>
<p>PARTIAL capability: live schedules, not complete real-time screening. Select up to 8 fully eligible candidates for review; never force eight from deficient data. Demo datasets remain fictional and separate.</p>
<p>Original base rule: either xG ≥1.6. Corrected rule: either HOME or AWAY player-adjusted xG ≥1.6 (unrounded), with BOTH teams known; both benches ≥7.5; raw volatility &lt;0.25; derived EV &gt;0.05 (strict decimal boundary; no rounding into a pass). Final guard additionally uses adjusted volatility &lt;0.25, excludes three-factor high risk and unknown conditions, and deduplicates IDs/fixtures.</p>
<p>EV = named market assumed probability × decimal odds − 1. “calculated_real_prob” is an assumed market probability, not objective truth. Sort by assumed probability descending, not maximum EV; take up to eight. 0–5 → HOLD; 6–8 → APPROVED for REVIEW only. Even 6–8-leg products can have low overall chance.</p>

<div class="warning"><h3>Live schedule • manual analytics • review only</h3>
<p>Today means UTC. OpenLigaDB filters confirmed UTC kickoffs; TheSportsDB uses a provider-day query, which may differ from UTC. Ambiguous kickoffs are not eligible.</p>
<div class="field-grid">
<label>UTC date<input id="scan-date" type="date"></label>
<label>OpenLiga starting season year<input id="scan-season" type="number" min="2000" max="2100"></label>
<label>Sources<select id="scan-sources"><option value="both">BL1 + capped soccer sample</option><option value="ol">OpenLigaDB Bundesliga BL1 only</option><option value="sports">TheSportsDB capped soccer sample only</option></select></label></div>
<div class="actions"><button id="scan-today" class="primary">Skano Ndeshjet e Sotme / Scan Today’s Matches</button><button id="scan-cancel">Cancel scan</button></div>
<p id="scan-status" role="status">No live request yet. Boot is offline; current feed is DEMO.</p>
<div id="scan-reports"></div>
<p>OpenLigaDB: selected BL1 community coverage, no SLA; <a href="https://www.openligadb.de/">ODbL attribution</a>.
TheSportsDB: public shared 123 key, free daily sample capped at 3, provider cache up to 4 hours, not worldwide complete or real-time; 30 requests/minute. Local scan cooldown 10 seconds, no polling. <a href="https://www.thesportsdb.com/documentation">Documentation</a>.</p>
<p>Weather integration limitation: no venue forecast here. Manually supplied weather is NOT detected pitch or climate shock. No secret keys, proxy or external libraries.</p></div>
<div class="actions"><button id="feed-qualify">Qualifying feed demo</button><button id="feed-hold">HOLD feed demo</button><button id="feed-trap">Environmental trap feed demo</button></div>
<p id="selection-status" class="warning" role="status"></p>
<button id="load-selected">Load selected matches for review</button>
<details><summary>Every fixture: criteria, calculations and reasons</summary><div id="feed-results"></div></details>
</section>

<section class="panel" id="analytics-panel" aria-labelledby="analytics-title">
<div class="eyebrow">Two-team scouting context / manual prototype</div>
<h2 id="analytics-title">Motivation & illustrative strength</h2>
<p id="analysis-fixture"></p>
<p class="warning">Unvalidated heuristic, not a forecast or probability. All scores are manual illustrative proxies, not verified current form, 5-year data or H2H records. Relegation pressure can increase errors as well as effort. No guarantees. This contextual warning is NOT a fourth ImpulseScore factor.</p>
<p>Weighted base TPI = 50% current form + 30% illustrative 5-year strength + 20% H2H. These fixed weights are prototype design assumptions, not user-supplied or calibrated. All component and base scores are normalized indices from 0–100. Manual mode uses only the override, without double counting.</p>
<p>Engine: relegation_fight ×1.25; title_or_europe ×1.15; safe_zone ×0.85; default ×1.0. must_win is unconfigured (×1.0). Points needed and table position are descriptive only. Adjusted TPI is an index and can exceed 100; multiplication is not clamped. Display rounds to 2 decimals; ranking uses full precision.</p>
<div class="actions"><button id="motivation-trap">Load motivation trap demo</button><button id="motivation-calm">Load calm / non-trap demo</button></div>
<label>Independent fixture detail editor (slip or feed)
<select id="fixture-editor"></select></label>
<p>Edits apply only to the named fixture. Feed edits update an already loaded matching leg; other fixtures stay independent. Slip copies otherwise remain unchanged.</p>
<p id="live-detail" class="warning"></p><button id="confirm-enrichment">Confirm these manual assumptions for this scan</button>
<div id="fixture-fields" class="leg-fields"></div>
<p class="warning">Environmental heuristic: muddy/waterlogged/badly damaged pitch ×0.85 favourite TPI. Extreme storm/winds/snow divides favourite TPI by 1.2 and separately multiplies volatility by 1.2. Both: 0.85/1.2. The favourite is identified from BASE TPI before motivation; base ties get no selective penalty. Climate shock warns only. Each category counts once; high risk requires all three. Conditions may harm BOTH teams. Unknown is not silently normal. TPI NEVER edits probability or EV.</p>
<p id="environment-summary" role="status"></p>
<section aria-labelledby="player-title"><h3 id="player-title">Player impact / Expected goals estimate</h3>
<p class="warning">Uncalibrated illustrative attack heuristic, not medical analysis or an exact future goal count.
Absence ×0.75 ELSE recent injury return ×0.85; fatigue strictly above 0.8 ×0.90.
Missing context stays UNKNOWN. These feeds do not supply player fields. Manual assumptions are not real-time analysis.</p>
<div id="player-inputs" class="leg-fields"></div>
<div class="actions"><button id="player-absence">Absence demo</button>
<button id="player-recovery">Recovery demo</button><button id="player-fatigue">High fatigue demo</button>
<button id="player-strength">Full strength demo</button><button id="player-calculate">Calculate selected fixture &amp; selection</button></div>
<p id="player-summary" role="status"></p></section><div id="team-inputs"></div>
<p id="analytics-errors" class="error" role="alert" hidden></p>
<p id="analytics-summary" role="status"></p>
<p class="muted">Each named fixture has its own independent scouting and environmental context; select its editor above. Live schedules do not supply the analytical fields. No validated TPI conversion to odds, assumed win probabilities or EV: those slip inputs remain unchanged. Context edits invalidate confirmation; analytics controls and demos freeze during interception.</p>
</section>
<section class="panel"><h2>Mathematical transparency</h2><div id="calculations"></div><div class="rule"></div><code>O = ∏ odds; p_joint = ∏ (assumed leg probability / 100)<br>EV/unit = p_joint × O − 1<br>EV% = EV/unit × 100; expected net = stake × EV/unit<br>Break-even chance = 1 / O</code><p class="muted">The probability product explicitly assumes independent legs. Correlation and estimation uncertainty can invalidate this model. Break-even chance is not an assumed fair or objective true probability. Nonnegative model EV is not verified value.</p></section>
<section class="panel" id="rational-panel" hidden><div class="eyebrow">04 / Rational Reset</div><h2>Lock released ≠ bet eligible</h2><div id="cap-details"></div><p class="warning">No stake is safe. Limits reduce exposure; they do not make betting safe. No promises of recovering losses.</p><button id="revisit">Revisit unchanged slip</button></section>
</div><div class="stack">
<section class="panel"><h2>Decision telemetry</h2><p id="telemetry-mode" class="badge"></p><div class="metrics"><div class="metric"><span>DecisionTime</span><strong id="speed"></strong><span>seconds, floor 0.25</span></div><div class="metric"><span>Observed clicks/sec</span><strong id="velocity"></strong><span>rolling 2s, not a score factor</span></div><div class="metric"><span>LossMultiplier</span><strong id="multiplier"></strong><span>1 + simulated streak</span></div></div><div class="rule"></div><div class="row"><div><div class="eyebrow">ImpulseScore</div><div class="score-num" id="score"></div></div><span>Strict threshold<br><b>&gt; 3.5</b></span></div><progress id="score-bar" max="10" value="0" aria-label="Impulse score visual scale capped at 10"></progress><div id="components" class="formula"></div><p id="trigger-note" class="warning">Explainable UI heuristic, not clinically validated. Units: stake percentage points per second, scaled by losses. Click velocity is separate observational context, never an extra formula factor.</p></section>
<section class="panel"><div class="eyebrow">Clickable guard map</div><h2>Four connected stages</h2><nav class="flow" aria-label="Decision flowchart"><button data-node="monitor"><b>01 · Input Monitoring</b>Clicks · bankroll risk · losses ↓</button><button data-node="evaluate"><b>02 · Threshold Evaluation</b>Score &gt; 3.5 → interceptor<br>Score ≤ 3.5 → cap/review</button><button data-node="lock"><b>03 · Cooling-Off Interceptor</b>Freeze before acceptance<br>60 seconds OR correct math ↓</button><button data-node="review"><b>04 · Rational Reset</b>Blue review, unchanged proposal<br>EV ≤ 0 → cap zero / reject</button></nav><p id="flow-note" class="flow-note"></p></section>
<section class="panel"><div class="row"><h2>Simulation event log</h2><span id="accepted-count"></span></div><ol id="log" class="log"></ol></section>
</div></div><footer>Schedule facts are live; analytics are manual or fictional. On-demand read-only fixture requests only. No accounts, payments or real wagers. Browser clock and storage are local and tamperable, not production-grade security. Reload requires the same file/location and browser profile. Cross-tab coordination is best-effort; file storage and private-mode behavior vary.</footer><p><button id="download-source">Download complete standalone HTML source</button></p></main>
<dialog id="guard" aria-labelledby="modal-title" aria-describedby="modal-reason"><div class="eyebrow">03 / Frozen BEFORE acceptance</div><h2 id="modal-title"></h2><p id="modal-reason"></p><div id="modal-math"></div><p id="snapshot-score" class="muted"></p><div id="countdown" class="timer" aria-live="off">01:00</div><p class="timer-label">Actual wall-clock countdown. Correct math may release early.</p><p>Calculate the <b>signed EV percentage</b> and <b>signed expected net units at this snapshot stake</b>, rounded to 2 decimals. Negative values mean expected loss. Formulas and snapshot data above; tolerance ≤0.01 from the rounded targets.</p><div class="challenge"><label>Signed EV (%)<input id="answerEV" type="number" step="0.01"></label><label>Signed expected net (units)<input id="answerProfit" type="number" step="0.01"></label></div><div class="checks"><input id="ack" type="checkbox"><label for="ack">I understand the estimates are uncertain, independence may fail, and loss of the stake is possible. Release does not make this bet eligible or safe.</label></div><p id="feedback" role="alert"></p><div class="modal-actions"><button id="confirm" class="primary">Verify mathematics & release</button></div><small>Timer expiry releases automatically without answers or acknowledgement. Nothing is automatically placed. Proposal, score and deadline are frozen during interception.</small></dialog>
<script>(() => {
	"use strict";
const CANONICAL_SOURCE = "<!doctype html>\n" + document.documentElement.outerHTML;
	const KEY = "janus.guard.v2",
		FLOOR = 0.25,
		THRESHOLD = 3.5,
		LOCK_MS = 60000;
	const $ = (id) => document.getElementById(id);
	const clone = (o) => JSON.parse(JSON.stringify(o));
	const num = (v) => (String(v).trim() === "" ? NaN : Number(v));
	const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "—");
// Player context is fixture-local. This uncalibrated heuristic never edits EV.
// Python-style nearest-even rounding of the actual binary Number, not a
// rounded input or decimal epsilon. Large finite values already have coarse ULPs.
function roundExpectedGoals(value) {
  if(!Number.isFinite(value)) return null;
  if(value>=1e21 || value===0) return value;
  const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,value);
  const bits=view.getBigUint64(0), exp=Number((bits>>52n)&2047n);
  const fraction=bits&((1n<<52n)-1n);
  let numerator=(exp===0?fraction:(1n<<52n)+fraction)*100n;
  const power=exp===0?-1074:exp-1075;
  if(power>=0) return Number(numerator<<BigInt(power))/100;
  const denominator=1n<<BigInt(-power);
  let whole=numerator/denominator;
  const twice=(numerator%denominator)*2n;
  if(twice>denominator || (twice===denominator && whole%2n===1n)) whole++;
  return Number(whole)/100;
}
const goalFmt = v => v===null ? '—' : fmt(roundExpectedGoals(v));
class PlayerImpactGoalEngine {
  constructor() {
    this.star_player_absence_penalty = 0.75;
    this.recent_injury_return_penalty = 0.85;
    this.full_strength = 1.0;
    this.high_fatigue_threshold = 0.8;
    this.high_fatigue_penalty = 0.90;
  }
  evaluate_team_attack_capacity_detailed(base_team_xg,
      key_attacker_available, recovered_from_injury, fatigue_index) {
    const missing = [], warnings = [];
    if (typeof base_team_xg !== 'number' || !Number.isFinite(base_team_xg) ||
        base_team_xg < 0) missing.push('base xG must be finite and nonnegative');
    if (typeof key_attacker_available !== 'boolean')
      missing.push('key attacker availability is unknown or invalid');
    if (key_attacker_available === true && typeof recovered_from_injury !== 'boolean')
      missing.push('injury return status is unknown or invalid');
    if (typeof fatigue_index !== 'number' || !Number.isFinite(fatigue_index) ||
        fatigue_index < 0 || fatigue_index > 1)
      missing.push('fatigue must be known and finite in [0,1]');
    if (missing.length) return {status:'unknown', adjusted_xg:null,
      rounded_xg:null, availability_recovery_factor:null, fatigue_factor:null,
      multiplier:null, missing, warnings, recovery_applicable:key_attacker_available !== false};
    let factor = this.full_strength;
    if (key_attacker_available === false) {
      factor *= this.star_player_absence_penalty;
      warnings.push('Key attacker absent: illustrative attack penalty ×0.75; recovery N/A.');
    } else if (recovered_from_injury === true) {
      factor *= this.recent_injury_return_penalty;
      warnings.push('Recently returned from injury: illustrative penalty ×0.85.');
    }
    const fatigue_factor = fatigue_index > this.high_fatigue_threshold ?
      this.high_fatigue_penalty : this.full_strength;
    if (fatigue_factor !== 1) warnings.push('High fatigue (>0.8): additional ×0.90.');
    const multiplier = factor * fatigue_factor;
    const adjusted_xg = base_team_xg * multiplier;
    return {status:'evaluated', adjusted_xg,
      rounded_xg:roundExpectedGoals(adjusted_xg), multiplier,
      availability_recovery_factor:factor, fatigue_factor, missing, warnings,
      recovery_applicable:key_attacker_available !== false};
  }
  evaluate_team_attack_capacity(...args) {
    return this.evaluate_team_attack_capacity_detailed(...args).rounded_xg;
  }
  predict_match_goal_range(team_a_xg, team_b_xg) {
    if (![team_a_xg,team_b_xg].every(v=>typeof v === 'number' &&
        Number.isFinite(v) && v >= 0) || !Number.isFinite(team_a_xg+team_b_xg))
      return {team_a_expected_goals:null,team_b_expected_goals:null,total_predicted_goals:null};
    return {team_a_expected_goals:roundExpectedGoals(team_a_xg),
      team_b_expected_goals:roundExpectedGoals(team_b_xg),
      total_predicted_goals:roundExpectedGoals(team_a_xg+team_b_xg)};
  }
}
const playerEngine = new PlayerImpactGoalEngine();
const playerKeys = ['key_attacker_available','recovered_from_injury','fatigue_index'];
const attackNumber = v => (typeof v === 'number' ||
  (typeof v === 'string' && v.trim() !== '')) ? Number(v) : NaN;
const playerDefaults = (demo = false) => Object.fromEntries(['home','away'].map(side=>
  [side,{key_attacker_available:demo?true:null,
    recovered_from_injury:demo?false:null,fatigue_index:demo?'0.25':''}]));
function ensurePlayer(f) {
  let changed = false;
  if (!f.player || typeof f.player !== 'object') {f.player={};changed=true;}
  f.provenance ||= {};
  for (const side of ['home','away']) {
    if (!f.player[side]) {f.player[side]={};changed=true;}
    for (const k of playerKeys) {
      if (f.player[side][k] === undefined) {
        f.player[side][k] = k==='fatigue_index'?'':null;
        f.provenance['player.'+side+'.'+k]={kind:'UNKNOWN',at:new Date().toISOString()};
        changed=true;
      }
    }
  }
  if(changed && f.live) f.live.confirmed=false;
  return changed;
}
function attackEvaluation(f) {
  const teams = {};
  for (const side of ['home','away']) {
    const t=f.player?.[side] || {};
    teams[side]=playerEngine.evaluate_team_attack_capacity_detailed(
      attackNumber(f[side+'_xg']), t.key_attacker_available,
      t.recovered_from_injury, attackNumber(t.fatigue_index));
  }
  const known=['home','away'].every(side=>teams[side].status==='evaluated');
  const raw_total=known?teams.home.adjusted_xg+teams.away.adjusted_xg:null;
  const complete=known && Number.isFinite(raw_total);
  return {teams,complete,raw_total:complete?raw_total:null,
    estimate:playerEngine.predict_match_goal_range(
      complete?teams.home.adjusted_xg:null,complete?teams.away.adjusted_xg:null),
    passes:complete && (teams.home.adjusted_xg>=1.6 || teams.away.adjusted_xg>=1.6)};
}
function playerSummary(f,a=attackEvaluation(f)) {
  const lines=['Expected goals estimate — uncalibrated heuristic, not an exact future count or guaranteed range.'];
  for (const side of ['home','away']) {
    const v=a.teams[side];
    lines.push(side.toUpperCase()+': '+(v.status==='evaluated'?
      'raw base '+goalFmt(attackNumber(f[side+'_xg']))+' × availability/recovery '+
      fmt(v.availability_recovery_factor)+' × fatigue '+fmt(v.fatigue_factor)+
      ' → adjusted '+goalFmt(v.adjusted_xg)+' (unrounded '+v.adjusted_xg+'). '+v.warnings.join(' '):
      'UNKNOWN / Not evaluated: '+v.missing.join('; ')));
  }
  lines.push(a.complete?'Home '+goalFmt(a.teams.home.adjusted_xg)+'; away '+
    goalFmt(a.teams.away.adjusted_xg)+'; total '+goalFmt(a.raw_total)+
    ' (unrounded sum '+a.raw_total+'). Each displayed value rounds independently to 2 decimals; '+
    'using nearest-even rounding of binary numeric values (as in Python); total sums unrounded adjusted values, not displayed values.':
    'Overall estimate UNKNOWN: both teams require attack context; no zero/full-strength substitute.');
  lines.push('Original base xG criterion: '+
    (num(f.home_xg)>=1.6 || num(f.away_xg)>=1.6?'PASS':'FAIL / UNKNOWN')+
    '; corrected player-adjusted xG criterion: '+(a.complete?(a.passes?'PASS':'FAIL'):'NOT EVALUATED')+
    '. Threshold ≥1.6 uses unrounded adjusted values. TPI/environment never multiply xG; '+
    'odds, probability and EV remain separate and unchanged.');
  lines.push('Player field provenance: '+['home','away'].map(side=>side+' '+
    playerKeys.map(k=>k+'='+ (f.provenance?.['player.'+side+'.'+k]?.kind || 'UNKNOWN')).join(', ')).join('; '));
  return lines.join(' ');
}
function buildPlayerEditor() {
  const root=$('player-inputs');root.replaceChildren();
  for (const side of ['home','away']) {
    const box=node('fieldset',undefined,'leg');box.append(node('legend',side==='home'?'Home attack context':'Away attack context'));
    for (const k of playerKeys) {
      const label=node('label',k==='fatigue_index'?'Fatigue index (0–1; blank = unknown)':
        k==='key_attacker_available'?'Key attacker':'Recently returned from injury');
      const input=node(k==='fatigue_index'?'input':'select');
      input.id='player-'+side+'-'+k;input.dataset.playerSide=side;input.dataset.playerField=k;
      if(k==='fatigue_index') {input.type='number';input.min='0';input.max='1';input.step='any';}
      else for(const [value,text] of [['unknown','Unknown'],['true',k==='key_attacker_available'?'Available':'Yes'],
        ['false',k==='key_attacker_available'?'Absent':'No']]) {
        const option=node('option',text);option.value=value;input.append(option);
      }
      label.append(input);box.append(label);
    }
    box.append(node('p','',undefined));box.lastChild.id='player-'+side+'-recovery-note';root.append(box);
  }
}
function renderPlayer(locked) {
  const f=editingFixture();
  document.querySelectorAll('[data-player-side]').forEach(e=>{
    const t=f.player[e.dataset.playerSide],k=e.dataset.playerField;
    e.value=k==='fatigue_index'?t[k]:t[k]===true?'true':t[k]===false?'false':'unknown';
    e.disabled=locked || (k==='recovered_from_injury' && t.key_attacker_available===false);
  });
  for(const side of ['home','away']) $('player-'+side+'-recovery-note').textContent=
    f.player[side].key_attacker_available===false?'Recovery N/A while key attacker is absent; no recovery input required.':
      'When available, injury-return status must be explicitly known. Fatigue must always be known.';
  $('player-summary').textContent=playerSummary(f);
}
function playerDemo(kind) {
  if(!prepare() || editingFixture().live)return;
  const f=editingFixture();f.player=playerDefaults(true);
  for(const side of ['home','away']) {
    if(kind==='absence') f.player[side].key_attacker_available=false;
    if(kind==='recovery') f.player[side].recovered_from_injury=true;
    if(kind==='fatigue') f.player[side].fatigue_index='0.9';
    for(const k of playerKeys) f.provenance['player.'+side+'.'+k]={kind:'DEMO',at:new Date().toISOString()};
  }
  syncLoadedFixture(f);invalidate();log('Explicit illustrative '+kind+' player demo for selected fixture only; limits and market inputs unchanged.');render();
}

// Motivation adjusts an illustrative index, never betting probabilities or EV.
class MotivationalUrgencyEngine {
  evaluate_urgency_context(team_context = {}) {
    const status = team_context.motivation_status;
    if (status === 'relegation_fight') return 1.25;
    if (status === 'title_or_europe') return 1.15;
    if (status === 'safe_zone') return 0.85;
    return 1.0; // Includes must_win: supplied engine has no branch for it.
  }
  adjust_tpi_with_motivation(base_tpi, team_context) {
    if (!Number.isFinite(base_tpi) || base_tpi < 0 || base_tpi > 100)
      throw new RangeError('Base TPI must be finite in [0,100].');
    // Preserve full precision for comparisons; fmt(...,2) rounds UI only.
    return base_tpi * this.evaluate_urgency_context(team_context);
  }
}
const urgencyEngine = new MotivationalUrgencyEngine();
const teamDefaults = (name, score, status) => ({
  name, form: String(score), history: String(score), h2h: String(score),
  baseMode: 'weighted', manualBase: String(score), motivation_status: status,
  points_needed: '', table_position: ''
});
const analyticsDefaults = () => ({
  home: teamDefaults('Northbridge', 70, 'title_or_europe'),
  away: teamDefaults('Vale', 65, 'title_or_europe')
});
const teamKeys = ['name','form','history','h2h','baseMode','manualBase',
  'motivation_status','points_needed','table_position'];
const statuses = {
  neutral: 'Neutral / default — unconfigured (1.0)',
  other: 'Other — unconfigured (1.0)',
  default: 'Default — unconfigured (1.0)',
  relegation_fight: 'Relegation fight (1.25)',
  title_or_europe: 'Title or Europe (1.15)',
  safe_zone: 'Safe zone (0.85)',
  must_win: 'Must win — unconfigured multiplier (1.0)'
};
function analyticsShape(a) {
  return a && ['home','away'].every(side => a[side] &&
    teamKeys.every(k => typeof a[side][k] === 'string'));
}
function migrate(v) {
  const original = JSON.stringify(v);
  let changed = false;
  if (!v.proposal.analytics) {
    v.proposal.analytics = analyticsDefaults();
    v.token = null;
    v.review = null;
    changed = true;
  }
  if (v.lock && !v.lock.proposal.analytics) {
    v.lock.proposal.analytics = clone(v.proposal.analytics);
    v.lock.fp = fingerprint(v.lock.proposal);
    // Deadline, mathematical challenge, accepted count and exposure unchanged.
    changed = true;
  }
  mergeProposal(v.proposal);
  if (v.lock) { mergeProposal(v.lock.proposal); v.lock.fp = fingerprint(v.lock.proposal); }
  if (!v.feed) v.feed = demoFeed();
  if (original !== JSON.stringify(v)) { v.token = null; v.review = null; changed = true; }
  for (const f of [...v.proposal.legs, ...(v.feed || []), ...(v.lock?.proposal.legs || [])])
    if(ensurePlayer(f)) changed=true;
  if(v.lock) v.lock.fp=fingerprint(v.lock.proposal);
  if(changed) {v.token=null;v.review=null;}
  v.schema = 5;
  if (changed) v.events.push({at: Date.now(), message:
    'Migrated context; missing player fields UNKNOWN. Existing deadline, challenge, labels and exposure preserved.'});
  return v;
}
function analyze(a) {
  const errors = [], teams = {};
  for (const side of ['home','away']) {
    const t = a[side];
    if (!t.name.trim() || t.name.length > 80)
      errors.push(side + ': name required, maximum 80 characters.');
    for (const k of ['form','history','h2h', ...(t.baseMode === 'manual' || t.manualBase.trim() !== '' ? ['manualBase'] : [])]) {
      const n = num(t[k]);
      if (!Number.isFinite(n) || n < 0 || n > 100)
        errors.push(side + ': ' + k + ' must be finite in [0,100].');
    }
    if (!['weighted','manual'].includes(t.baseMode))
      errors.push(side + ': choose a valid base mode.');
    for (const k of ['points_needed','table_position']) {
      const n = num(t[k]);
      if (t[k].trim() !== '' && (!Number.isSafeInteger(n) ||
          n < (k === 'table_position' ? 1 : 0)))
        errors.push(side + ': ' + k + ' must be an integer or unknown blank.');
    }
    const base = t.baseMode === 'manual' ? num(t.manualBase) :
      0.5 * num(t.form) + 0.3 * num(t.history) + 0.2 * num(t.h2h);
    const multiplier = urgencyEngine.evaluate_urgency_context(t);
    teams[side] = {base, multiplier,
      adjusted: Number.isFinite(base) && base >= 0 && base <= 100 ?
        urgencyEngine.adjust_tpi_with_motivation(base, t) : null};
  }
  if (errors.length) return {errors, teams};
  const h = teams.home, w = teams.away;
  const trapHome = h.base < w.base && a.home.motivation_status ===
    'relegation_fight' && a.away.motivation_status === 'safe_zone';
  const trapAway = w.base < h.base && a.away.motivation_status ===
    'relegation_fight' && a.home.motivation_status === 'safe_zone';
  const before = h.base - w.base, after = h.adjusted - w.adjusted;
  return {errors, teams, trapHome, trapAway, before, after,
    reversal: before !== 0 && after !== 0 && Math.sign(before) !== Math.sign(after)};
}
function buildAnalytics() {
  for (const side of ['home','away']) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'leg';
    const legend = document.createElement('legend');
    legend.textContent = side === 'home' ? 'Home team' : 'Away team';
    fieldset.append(legend);
    const grid = document.createElement('div');
    grid.className = 'leg-fields';
    const labels = {
      name: 'Team name (demo or read-only provider fact)', form: 'Current form proxy (0–100)',
      history: '5-year strength proxy (illustrative, 0–100)',
      h2h: 'H2H proxy (illustrative, 0–100)', baseMode: 'Base TPI mode',
      manualBase: 'Manual base TPI (0–100)', motivation_status: 'Motivation status',
      points_needed: 'Points needed (descriptive; blank = unknown)',
      table_position: 'Table position (descriptive; blank = unknown)'
    };
    for (const k of teamKeys) {
      const label = document.createElement('label');
      label.textContent = labels[k];
      const select = k === 'baseMode' || k === 'motivation_status';
      const input = document.createElement(select ? 'select' : 'input');
      input.id = side + '-' + k;
      input.dataset.team = side;
      input.dataset.teamField = k;
      if (select) {
        const options = k === 'baseMode' ? {
          weighted: 'Weighted prototype model', manual: 'Manual override only'
        } : statuses;
        for (const [value,text] of Object.entries(options)) {
          const o = document.createElement('option');
          o.value = value; o.textContent = text; input.append(o);
        }
      } else {
        input.type = k === 'name' ? 'text' : 'number';
        if (k === 'name') input.maxLength = 80;
        else {
          input.min = k === 'table_position' ? '1' : '0';
          input.step = ['points_needed','table_position'].includes(k) ? '1' : 'any';
          if (!['points_needed','table_position'].includes(k)) input.max = '100';
        }
      }
      label.append(input); grid.append(label);
    }
    const output = document.createElement('p');
    output.id = side + '-tpi';
    fieldset.append(grid, output); $('team-inputs').append(fieldset);
  }
}
function renderAnalytics(locked) {
  const a = editingContext(), c = analyze(a);
  document.querySelectorAll('[data-team]').forEach(e => {
    const t = a[e.dataset.team], k = e.dataset.teamField;
    if (e.tagName === 'SELECT' &&
        ![...e.options].some(o => o.value === t[k])) {
      const o = document.createElement('option');
      o.value = t[k]; o.textContent = 'Unknown: ' + t[k] + ' — fallback 1.0';
      e.append(o);
    }
    e.value = t[k];
    e.disabled = locked || (editingFixture().live && k === 'name') || (k === 'manualBase' && t.baseMode !== 'manual');
  });
  $('analytics-errors').textContent = c.errors.join(' ');
  $('analytics-errors').hidden = !c.errors.length;
  for (const side of ['home','away']) {
    const t = a[side], v = c.teams[side];
    const warning = ['must_win','other','default','neutral'].includes(t.motivation_status) ?
      ' Unconfigured multiplier: ' + t.motivation_status + ' has no supplied branch; fallback 1.0.' :
      !Object.hasOwn(statuses, t.motivation_status) ?
        ' WARNING: unknown motivation; default multiplier 1.0.' : '';
    $(side + '-tpi').textContent = c.errors.length ? 'Correct invalid context.' :
      t.name + ': ' + (t.baseMode === 'manual' ?
        'Manual override only; component scores are NOT added. Base = ' + t.manualBase :
        'Base = 0.50 × ' + t.form + ' + 0.30 × ' + t.history +
        ' + 0.20 × ' + t.h2h) + ' = ' + fmt(v.base) +
      '. Adjusted TPI = ' + v.base + ' × ' + v.multiplier + ' = ' +
      fmt(v.adjusted) + ' (index units; full precision used internally).' + warning;
  }
  $('analysis-fixture').textContent = 'Illustrative scouting example: ' +
    a.home.name + ' (home) vs ' + a.away.name + ' (away). Independent fixture context.';
  $('analytics-summary').textContent = c.errors.length ?
    'Analysis unavailable until context is valid.' :
    'Signed relative gap = home − away (index units, NOT percentage): base ' +
    fmt(c.teams.home.base) + ' − ' + fmt(c.teams.away.base) + ' = ' + fmt(c.before) +
    '; adjusted ' + fmt(c.teams.home.adjusted) + ' − ' +
    fmt(c.teams.away.adjusted) + ' = ' + fmt(c.after) + '. ' +
    (c.trapHome || c.trapAway ? 'POSSIBLE MOTIVATION TRAP: weaker-on-paper ' +
      (c.trapHome ? a.home.name : a.away.name) +
      ' fights relegation against a safe-zone opponent. Warning applies even without reversal. ' :
      'No trap under the exact weaker-base/relegation-versus-safe-zone rule. ') +
    (c.reversal ? 'RANK REVERSAL after adjustment.' :
      'No rank reversal.' + (c.before === 0 ? ' Base tie is not a weaker team.' : '') ) +
    (c.before !== 0 && c.after === 0 ? ' Adjusted ranking is tied.' : '');
  $('analytics-summary').classList.toggle('warning',
    !!(c.trapHome || c.trapAway || c.reversal));
}
function motivationDemo(trap) {
  if (!prepare() || editingFixture().live) return;
  editingFixture().context = trap ? {
    home: teamDefaults('Northbridge', 60, 'relegation_fight'),
    away: teamDefaults('Vale', 80, 'safe_zone')
  } : analyticsDefaults();
  syncLoadedFixture(editingFixture());
  invalidate();
  log(trap ? 'Loaded illustrative motivation trap: 60×1.25=75 vs 80×0.85=68. No bet action.' :
    'Loaded calm illustrative scouting context. No odds, probabilities or EV changed.');
  render();
}

// Per-fixture environmental/selector heuristics; no probability lift or forecast acquisition.
class EnvironmentalConditionEngine {
  evaluate_environment(weather_condition, pitch_status, visiting_team_climate_shock) {
    const heavy = ['muddy','waterlogged','badly_damaged'].includes(pitch_status);
    const extreme = ['heavy_storm','gale_force_winds','heavy_snow'].includes(weather_condition);
    const climate = visiting_team_climate_shock === true;
    const warnings = [];
    const known = ['normal','rain','heavy_storm','gale_force_winds','heavy_snow'].includes(weather_condition)
      && ['normal','muddy','waterlogged','badly_damaged'].includes(pitch_status)
      && typeof visiting_team_climate_shock === 'boolean';
    if (!known) warnings.push('Unknown / unsupported environmental context; not verified normal.');
    if (heavy || extreme) warnings.push('Environmental Trap / Kurth Mjedisor.');
    if (climate) warnings.push('Visiting climate shock: warning only; no numeric penalty.');
    const risk_factor_count = Number(heavy) + Number(extreme) + Number(climate);
    if (risk_factor_count >= 3)
      warnings.push('High randomness risk / Rrezik i lartë rastësie.');
    return {favourite_tpi_multiplier: (heavy ? 0.85 : 1) / (extreme ? 1.2 : 1),
      volatility_multiplier: extreme ? 1.2 : 1, risk_factor_count, warnings,
      environmental_trap: heavy || extreme, high_risk_flag: risk_factor_count >= 3,
      supported: known};
  }
}
const environmentEngine = new EnvironmentalConditionEngine();
const environmentDefaults = (unknown = false) => ({
  weather: unknown ? 'unknown' : 'normal', pitch: unknown ? 'unknown' : 'normal',
  climate: unknown ? 'unknown' : 'no', raw_volatility: '0.15'
});
const fixtureDefaults = (i = 0) => ({
  id: 'fictional-' + (i + 1),
  market: ['Home win','Over 2.5 goals','Both teams score'][i % 3],
  odds: '1.8', p: String(70 - i), home_xg: '1.7', away_xg: '1.2',
  home_bench: '8', away_bench: '8',
  player: playerDefaults(true),
  provenance: Object.fromEntries(['home','away'].flatMap(side=>playerKeys.map(k=>
    ['player.'+side+'.'+k,{kind:'DEMO',at:new Date().toISOString()}]))),
  context: {
    home: teamDefaults(['Northbridge','Harbor','Eastfield'][i] || 'Fictional Home ' + (i+1), 70, 'neutral'),
    away: teamDefaults(['Vale','Alpine','Riverside'][i] || 'Fictional Away ' + (i+1), 65, 'neutral')
  }, environment: environmentDefaults()
});
function demoFeed(kind = 'qualify') {
  const feed = Array.from({length:13}, (_,i) => fixtureDefaults(i));
  // Nine pass statistically; selection truncates to eight by assumed probability.
  feed[9].home_xg = '1.5'; feed[9].away_xg = '1.5';
  feed[9].home_bench = '7'; feed[9].away_bench = '7';
  feed[9].environment.raw_volatility = '0.25'; feed[9].p = '50';
  feed[10].environment = {weather:'heavy_storm',pitch:'muddy',climate:'yes',raw_volatility:'0.15'};
  feed[11].environment = {weather:'gale_force_winds',pitch:'normal',climate:'no',raw_volatility:'0.22'};
  feed[12].environment.weather = 'unknown';
  if (kind === 'hold') feed.slice(5,9).forEach(f => { f.home_bench = '7'; });
  if (kind === 'trap') {
    feed[0].environment = {weather:'heavy_snow',pitch:'waterlogged',climate:'yes',raw_volatility:'0.15'};
    feed[0].context.home = teamDefaults('Northbridge',60,'relegation_fight');
    feed[0].context.away = teamDefaults('Vale',80,'safe_zone');
  }
  return feed;
}
const fixtureKeys = ['market','odds','p','home_xg','away_xg','home_bench','away_bench'];
function fixtureShape(f) {
  return f && typeof f.id === 'string' && f.id.length <= 80 &&
    fixtureKeys.every(k => typeof f[k] === 'string' && f[k].length <= 120) &&
    analyticsShape(f.context) && f.environment &&
    ['weather','pitch','climate','raw_volatility'].every(k => typeof f.environment[k] === 'string');
}
// Decimal boundary comparison, not an epsilon or a rounded EV. The displayed EV
// remains the full Number calculation. This avoids 50% × 2.1 being misclassified
// above exactly 0.05 solely because of binary floating-point roundoff.
function decimalRatio(text) {
  const value=String(text).trim();
  const m=value.match(/^([+]?)(\d*\.?\d+)(?:e([+-]?\d+))?$/i);
  if(!m || value.length>400) return null;
  const parts=m[2].split('.'), digits=parts.join(''), exponent=Number(m[3]||0)-(parts[1]?.length||0);
  if(!Number.isSafeInteger(exponent) || Math.abs(exponent)>400)return null;
  return exponent>=0 ? [BigInt(digits)*10n**BigInt(exponent),1n] :
    [BigInt(digits),10n**BigInt(-exponent)];
}
function passesEVBoundary(f,ev) {
  const p=decimalRatio(f.p),o=decimalRatio(f.odds);
  return p && o ? p[0]*o[0] > 105n*p[1]*o[1] : ev>0.05;
}
function evaluateFixture(f) {
  const errors = [];
  const attack = attackEvaluation(f);
  const analysis = analyze(f.context);
  errors.push(...analysis.errors);
  if (!f.id.trim() || f.id.length > 80) errors.push('Fixture ID required (max 80).');
  if (!f.market.trim() || f.market.length > 120) errors.push('Named market required (max 120).');
  for (const key of ['home_xg','away_xg','home_bench','away_bench']) {
    const value = num(f[key]);
    if (!Number.isFinite(value) || value < 0 || (key.includes('bench') && value > 10))
      errors.push(key + ': finite nonnegative value' + (key.includes('bench') ? ' in [0,10].' : '.'));
  }
  const raw = num(f.environment.raw_volatility), odds = num(f.odds), prob = num(f.p)/100;
  if (!Number.isFinite(raw) || raw < 0 || raw > 1) errors.push('Raw volatility must be in [0,1].');
  if (!Number.isFinite(odds) || odds <= 1) errors.push('Decimal odds must be finite >1.');
  if (!Number.isFinite(prob) || prob <= 0 || prob >= 1) errors.push('Assumed market probability must be strictly (0,100)%.');
  const e = f.environment;
  const env = environmentEngine.evaluate_environment(e.weather,e.pitch,
    e.climate === 'yes' ? true : e.climate === 'no' ? false : null);
  const ev = prob * odds - 1;
  if (!Number.isFinite(ev)) errors.push('EV arithmetic overflow.');
  if (f.calculated_ev !== undefined && (!Number.isFinite(num(f.calculated_ev)) ||
      Math.abs(num(f.calculated_ev)-ev) > 1e-10))
    errors.push('Supplied calculated_ev discrepancy: rejected; only p × odds − 1 is authoritative.');
  const favourite = !analysis.errors.length ?
    analysis.before > 0 ? 'home' : analysis.before < 0 ? 'away' : null : null;
  const final = {};
  for (const side of ['home','away']) final[side] = (analysis.teams[side].adjusted === null ? null : analysis.teams[side].adjusted *
    (side === favourite ? env.favourite_tpi_multiplier : 1));
  const finalGap = final.home - final.away;
  const adjusted_volatility = raw * env.volatility_multiplier;
  const reasons = [];
  if (!attack.passes) reasons.push(attack.complete?'Player-adjusted xG: neither team ≥1.6 (unrounded).':'Player-adjusted xG: Not evaluated; both teams require known base/player context.');
  if (!(num(f.home_bench)>=7.5)) reasons.push('Home bench <7.5.');
  if (!(num(f.away_bench)>=7.5)) reasons.push('Away bench <7.5.');
  if (!(raw<0.25)) reasons.push('Original raw volatility must be <0.25.');
  if (!passesEVBoundary(f,ev)) reasons.push('Derived EV must be >0.05 per unit.');
  const statistical_pass = !errors.length && !reasons.length;
  const guardReasons = [];
  if(!attack.complete) guardReasons.push('Expected goals estimate UNKNOWN: both teams need valid attack context.');
  if (!(adjusted_volatility<0.25)) guardReasons.push('Adjusted volatility must be <0.25.');
  if (env.high_risk_flag) guardReasons.push('Excluded: three-factor high randomness risk.');
  if (!env.supported) guardReasons.push('Excluded: unknown / unsupported conditions require explicit context review.');
  const live = liveRules(f);
  guardReasons.push(...live.missing.map(k=>'Not evaluated (missing data): '+k));
  guardReasons.push(...live.blocks);
  return {attack, base_xg_pass:num(f.home_xg)>=1.6 || num(f.away_xg)>=1.6, liveRules:live.rules, errors, analysis, env, favourite, final, finalGap, adjusted_volatility,
    calculated_ev: ev, calculated_real_prob: prob, statistical_pass,
    eligible: statistical_pass && !guardReasons.length, reasons, guardReasons,
    reversal: analysis.before !== 0 && finalGap !== 0 && Math.sign(analysis.before)!==Math.sign(finalGap)};
}
const fixtureIdentity = f => [f.context.home.name.trim().toLowerCase(),
  f.context.away.name.trim().toLowerCase()].sort().join(' vs ') + (f.live ? ' @ '+f.live.day : '');
class DailyMatchSelector {
  select_matches(matches) {
    const ids = new Set(), fixtures = new Set();
    const evaluations = matches.map((match,index) => {
      const result = evaluateFixture(match), identity = fixtureIdentity(match);
      const duplicate = ids.has(match.id.trim()) || fixtures.has(identity);
      ids.add(match.id.trim()); fixtures.add(identity);
      if (duplicate) { result.eligible = false; result.guardReasons.push('Duplicate ID or fixture excluded.'); }
      return {match,index,...result};
    });
    const selected_slip = evaluations.filter(e => e.eligible)
      .sort((a,b) => b.calculated_real_prob-a.calculated_real_prob || a.index-b.index).slice(0,8);
    return {status: selected_slip.length < 6 ? 'HOLD' : 'APPROVED', selected_slip,
      total_matches: selected_slip.length, evaluations,
      recommendation: selected_slip.length < 6 ? 'Do not place: fewer than six qualify.' :
        'Filter-qualified for REVIEW only; not safe, approved wagering or placement.'};
  }
}
const dailySelector = new DailyMatchSelector();
// Migration keeps old labels, mathematical snapshot, absolute deadline and exposure.
function mergeProposal(p) {
  p.legs.forEach((leg,i) => {
    const defaults = fixtureDefaults(i);
    for (const k of ['id','market','home_xg','away_xg','home_bench','away_bench'])
      if (leg[k] === undefined) leg[k] = leg.live ? '' : defaults[k];
    if (!leg.context) leg.context = clone(i === 0 ? p.analytics : defaults.context);
    if (!leg.environment) leg.environment = environmentDefaults(true);
  });
}
let editorSource = 'slip', editorIndex = 0;
function editingFixture() { return editorSource === 'feed' ? s.feed[editorIndex] : s.proposal.legs[editorIndex]; }
function editingContext() { return editingFixture().context; }
function syncLoadedFixture(f) {
  if (editorSource === 'feed' && !f.live) s.proposal.legs = s.proposal.legs.map(l => l.id === f.id ? clone(f) : l);
  s.proposal.analytics = clone(s.proposal.legs[0].context);
}
function labelFixture(f) { return (f.live ? 'LIVE / MANUAL: ' : 'DEMO: ') + f.context.home.name + ' vs ' + f.context.away.name + ' · ' + (f.market || 'market UNKNOWN'); }
function node(tag,text,className) {
  const e = document.createElement(tag); if (text !== undefined) e.textContent = text;
  if (className) e.className = className; return e;
}
let legSignature = '';
function renderLegs() {
  const signature = s.proposal.legs.map(l=>l.id).join('|');
  if (signature !== legSignature || $('legs').children.length !== s.proposal.legs.length) {
    legSignature = signature; $('legs').replaceChildren();
    s.proposal.legs.forEach((l,i) => {
      const box = node('div',undefined,'leg'), heading = node('h3');
      heading.dataset.legLabel = i; box.append(heading);
      const grid = node('div',undefined,'leg-fields');
      for (const [key,text] of [['odds','Decimal odds'],['p','Assumed market probability (%)']]) {
        const label = node('label','Leg '+(i+1)+' '+text), input = node('input');
        input.type = 'number'; input.step = 'any'; input.dataset.leg = i;
        input.dataset.field = key; label.append(input); grid.append(label);
      }
      box.append(grid);
      const summary=node('p');summary.dataset.legPlayerSummary=i;
      box.append(summary);$('legs').append(box);
    });
  }
  document.querySelectorAll('[data-leg-label]').forEach(e=>{
    e.textContent = 'Leg ' + (+e.dataset.legLabel+1) + ': ' + labelFixture(s.proposal.legs[+e.dataset.legLabel]);
  });
  document.querySelectorAll('[data-leg-player-summary]').forEach(e=>{
    e.textContent=playerSummary(s.proposal.legs[+e.dataset.legPlayerSummary]);
  });
  $('leg-count').textContent = s.proposal.legs.length + ' legs (supported range 1–8)';
}
function editorOptions() {
  const select = $('fixture-editor'); select.replaceChildren();
  for (const source of ['slip','feed']) {
    const list = source === 'slip' ? s.proposal.legs : s.feed;
    list.forEach((f,i) => {
      const option = node('option',source.toUpperCase()+' '+(i+1)+': '+labelFixture(f));
      option.value = source+':'+i; select.append(option);
    });
  }
  if (!(editorSource === 'feed' ? s.feed : s.proposal.legs)[editorIndex]) editorIndex = 0;
  select.value = editorSource+':'+editorIndex;
}
function buildFixtureEditor() {
  const grid = $('fixture-fields');
  const definitions = {
    market:'Named market (fictional/manual)', home_xg:'Home base xG (manual)',away_xg:'Away base xG (manual)',
    home_bench:'Home bench rating (0–10)',away_bench:'Away bench rating (0–10)',
    weather:'Weather condition',pitch:'Pitch status',climate:'Visiting climate shock',
    raw_volatility:'Raw volatility (0–1)', odds:'Market decimal odds',p:'Assumed market probability (%)'
  };
  const choices = {
    weather:['normal','rain','heavy_storm','gale_force_winds','heavy_snow','unknown'],
    pitch:['normal','muddy','waterlogged','badly_damaged','unknown'],climate:['no','yes','unknown']
  };
  grid.replaceChildren();
  for (const [key,text] of Object.entries(definitions)) {
    const label = node('label',text), input = node(choices[key] ? 'select' : 'input');
    input.id = 'fixture-'+key; input.dataset.fixtureField = key;
    if (choices[key]) choices[key].forEach(v=> { const o=node('option',v);o.value=v;input.append(o); });
    else {input.type=key==='market'?'text':'number';input.step='any';if(key==='market')input.maxLength=120;}
    label.append(input);grid.append(label);
  }
}
function renderWorkspace(locked) {
  renderLegs(); editorOptions();
  const f = editingFixture(), evaluation = evaluateFixture(f);
  document.querySelectorAll('[data-fixture-field]').forEach(e=>{
    const k=e.dataset.fixtureField;
    const value = Object.hasOwn(f.environment,k) ? f.environment[k] : f[k];
    if(e.tagName==='SELECT' && ![...e.options].some(o=>o.value===value)) {
      const o=node('option','Unsupported: '+value);o.value=value;e.append(o);
    }
    e.value=value;e.disabled=locked;
  });
  $('fixture-editor').disabled=locked;
  $('environment-summary').textContent = environmentalSummary(f,evaluation);
  const selection = dailySelector.select_matches(s.feed);
  $('selection-status').textContent = selection.status+' · '+selection.total_matches+' selected. '+selection.recommendation;
  $('feed-results').replaceChildren(...selection.evaluations.map((e,i)=>{
    const box=node('div',undefined,'leg');
    box.append(node('h3',labelFixture(e.match)));
    box.append(node('p','Player-adjusted statistical pass: '+(e.statistical_pass?'PASS':'FAIL')+
      ' · Final all-context/identity eligibility: '+(e.eligible?'PASS':'FAIL')+
      ' · Selected: '+(selection.selected_slip.some(x=>x.index===i)?'YES':'NO')));
    box.append(node('p','Assumed market chance '+fmt(e.calculated_real_prob*100)+'% · derived EV '+
      fmt(e.calculated_ev,6)+' · raw volatility '+e.match.environment.raw_volatility+' × '+
      e.env.volatility_multiplier+' = adjusted '+fmt(e.adjusted_volatility,6)));
    box.append(node('p',[...e.errors,...e.reasons,...e.guardReasons].join(' ') || 'All criteria passed.'));
    box.append(node('p',environmentalSummary(e.match,e)));
    box.append(node('p',playerSummary(e.match,e.attack)));
    if(e.match.live) box.append(node('p',JSON.stringify(e.liveRules)));
    if(e.match.live) box.append(node('p','Provider status: '+e.match.live.status+' · kickoff: '+(e.match.live.kickoff || 'AMBIGUOUS')+' · retrieved UTC: '+e.match.live.retrieved));
    const b=node('button','Edit this fixture');b.dataset.editFeed=i;b.disabled=locked;box.append(b);
    return box;
  }));
  $('load-selected').disabled=locked || selection.status !== 'APPROVED';
}
function environmentalSummary(f,v) {
  const env=v.env;
  return 'On-paper favourite (higher BASE TPI, identity held fixed): '+
    (v.favourite?f.context[v.favourite].name:'NONE — base tie or invalid; no selective penalty')+
    '. Favourite strength multiplier '+fmt(env.favourite_tpi_multiplier,9)+
    '; separate weather volatility multiplier '+env.volatility_multiplier+
    '; factors '+env.risk_factor_count+'; high_risk_flag '+env.high_risk_flag+'. '+
    env.warnings.join(' ')+' Raw '+f.environment.raw_volatility+' → adjusted volatility '+
    fmt(v.adjusted_volatility,6)+' (not clamped). '+
    (v.errors.length ? 'Context/calculation errors: '+v.errors.join(' ') :
      ['home','away'].map(side=>f.context[side].name+': base '+fmt(v.analysis.teams[side].base)+
        ' → motivation '+fmt(v.analysis.teams[side].adjusted)+' → environment '+fmt(v.final[side])).join('; ')+
      (v.analysis.trapHome || v.analysis.trapAway ? '. POSSIBLE MOTIVATION TRAP (weaker base relegation vs safe zone), even without reversal. ' : '')+
      '. Gap home−away: base '+fmt(v.analysis.before)+' → motivation '+fmt(v.analysis.after)+
      ' → environment '+fmt(v.finalGap)+'. '+(v.reversal?'Final ranking reversal.':'No final ranking reversal.'));
}
function loadSelected() {
  if (!prepare()) return;
  const result=dailySelector.select_matches(s.feed);
  if(result.status!=='APPROVED') {s.result='HOLD: not permission to place.';render();return;}
  s.proposal.legs=result.selected_slip.map(e=>clone(e.match));
  s.proposal.analytics=clone(s.proposal.legs[0].context);
  editorSource='slip';editorIndex=0;invalidate();
  log('Explicitly loaded '+result.total_matches+' local filter-qualified legs for review. Nothing placed.');render();
}
function loadFeedDemo(kind) {
  if(!prepare()) return;
  cancelScan('Demo selected: staged live scan discarded.');
  activeBatch=null;scanMessage='DEMO selected — fictional feed; previous live source reports are historical only.';
  s.feed=demoFeed(kind);editorSource='feed';editorIndex=0;
  // A demo changes only the local feed, never auto-replaces the current slip or limits.
  invalidate();log('Loaded fictional '+kind+' feed; current slip and exposure unchanged.');render();
}

	// Live adapters never call fixtureDefaults: absence is empty/UNKNOWN, not safe.
let scanController = null, scanVersion = 0, lastScan = -Infinity;
let scanMessage = 'No live request yet. Boot is offline; current feed is DEMO.';
let reports = [];
let activeBatch = null;
const providerBackoff = new Map();
const todayUTC = () => new Date().toISOString().slice(0,10);
let scanSettings = {day:todayUTC(),season:seasonFor(todayUTC()),source:'both'};
function seasonFor(day) {
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(day);
  return m ? +m[1] - (+m[2] < 7 ? 1 : 0) : '';
}
function validDay(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day+'T00:00:00Z')) &&
    new Date(day+'T00:00:00Z').toISOString().slice(0,10) === day;
}
function awareTime(value) {
  if(typeof value !== 'string' || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return null;
  const n=Date.parse(value);return Number.isFinite(n)?new Date(n).toISOString():null;
}
const cleanName = v => typeof v==='string' && v.trim() && v.length<=80 ? v.trim() : null;
function liveFixture(provider,id,home,away,kickoff,status,day,retrieved,batch) {
  const team = name => ({name,form:'',history:'',h2h:'',baseMode:'weighted',
    manualBase:'',motivation_status:'unknown',points_needed:'',table_position:''});
  const f={id:provider+':'+id,market:'',odds:'',p:'',home_xg:'',away_xg:'',
    home_bench:'',away_bench:'',context:{home:team(home),away:team(away)},
    environment:{weather:'unknown',pitch:'unknown',climate:'unknown',raw_volatility:''},
    player:playerDefaults(false),
    live:{provider,providerID:String(id),kickoff,status,day,retrieved,batch,confirmed:false},
    provenance:{}};
  for(const side of ['home','away']) for(const k of playerKeys)
    f.provenance['player.'+side+'.'+k]={kind:'UNKNOWN',at:retrieved};
  for(const k of fixtureKeys) f.provenance[k]={kind:'UNKNOWN',at:retrieved};
  for(const side of ['home','away']) for(const k of teamKeys)
    f.provenance[side+'.'+k]={kind:k==='name'?'live provider':'UNKNOWN',at:retrieved};
  for(const k of Object.keys(f.environment)) f.provenance[k]={kind:'UNKNOWN',at:retrieved};
  for(const k of ['kickoff','status','providerID']) f.provenance[k]={kind:'live provider',at:retrieved};
  return f;
}
function adaptOL(data,day,retrieved,batch) {
  if(!Array.isArray(data) || data.length>2000) throw Error('Invalid OpenLiga array or >2000 entries.');
  const fixtures=[], counts={pre:0,inplay:0,completed:0,unknown:0};let invalid=0;
  for(const m of data) {
    if(!m || !Number.isSafeInteger(m.matchID) || m.matchID<0) {invalid++;continue;}
    const kickoff=awareTime(m.matchDateTimeUTC),h=cleanName(m.team1?.teamName),a=cleanName(m.team2?.teamName);
    if(!h || !a || !kickoff) {invalid++;continue;}
    if(kickoff.slice(0,10)!==day)continue;
    // A false finished flag after kickoff does not prove live play: fail closed.
    const status=m.matchIsFinished===true?'completed':m.matchIsFinished===false &&
      Date.parse(kickoff)>Date.now()?'pre':'unknown';
    counts[status]++;
    fixtures.push(liveFixture('OpenLigaDB',m.matchID,h,a,kickoff,status,day,retrieved,batch));
  }
  return {fixtures,counts,invalid,received:data.length};
}
function adaptSports(data,day,retrieved,batch) {
  if(!data || !Object.hasOwn(data,'events') || !(data.events===null || Array.isArray(data.events)))
    throw Error('Invalid TheSportsDB events schema.');
  const entries=data.events || [];
  if(entries.length>100)throw Error('TheSportsDB entry bound exceeded.');
  const fixtures=[],counts={pre:0,inplay:0,completed:0,unknown:0};let invalid=0;
  for(const m of entries) {
    if(!m || !/^\d{1,20}$/.test(String(m.idEvent)) || !validDay(m.dateEvent)) {invalid++;continue;}
    const h=cleanName(m.strHomeTeam),a=cleanName(m.strAwayTeam);
    if(!h || !a) {invalid++;continue;}
    if(m.dateEvent!==day)continue;
    const kickoff=awareTime(m.strTimestamp);
    if(kickoff && kickoff.slice(0,10)!==day) {invalid++;continue;}
    const raw=String(m.strStatus || '').toUpperCase();
    const completed=['FT','AET','AP','MATCH FINISHED'].includes(raw);
    const inplay=['1H','2H','HT','ET','P','LIVE','IN PLAY'].includes(raw);
    const status=completed?'completed':inplay?'inplay':raw==='NS' && kickoff &&
      Date.parse(kickoff)>Date.now()?'pre':'unknown';
    counts[status]++;
    const f=liveFixture('TheSportsDB',m.idEvent,h,a,kickoff,status,day,retrieved,batch);
    f.live.providerStatus=String(m.strStatus || 'UNKNOWN').slice(0,80);
    f.live.providerDayUncertain=true;
    fixtures.push(f);
  }
  return {fixtures,counts,invalid,received:entries.length};
}
function dedupLive(fixtures) {
  const result=[], ids=new Set(), pairs=new Map();let duplicates=0;
  const pair=f=>[f.context.home.name.toLowerCase().replace(/[^\p{L}\p{N}]/gu,''),
    f.context.away.name.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'')].sort().join('|')+'@'+f.live.day;
  for(const f of fixtures) {
    if(ids.has(f.id)) {duplicates++;continue;}ids.add(f.id);
    const old=pairs.get(pair(f));
    if(old) {
      duplicates++;
      if(old.live.kickoff!==f.live.kickoff || old.live.status!==f.live.status)
        old.live.conflict=true;
      continue; // One provider owns each retained fixture; conflicts block, not merge analytics.
    }
    pairs.set(pair(f),f);result.push(f);
  }
  if(result.length>100)throw Error('Daily fixture bound exceeded (100); nothing committed.');
  return {fixtures:result,duplicates};
}
function liveRules(f) {
  if(!f.live)return {missing:[],blocks:[],rules:{}};
  const missing=[],blocks=[],rules={};
  const check=(name,known,passed)=>{
    rules[name]=!known?'Not evaluated (missing data)':passed?'Passed':'Failed';
    if(!known)missing.push(name);
  };
  const finite=(v,min,max)=>String(v).trim()!=='' && Number.isFinite(num(v)) && num(v)>=min && num(v)<=max;
  for(const side of ['home','away']) {
    for(const k of ['form','history','h2h'])
      check(side+' '+({form:'current form',history:'five-year strength',h2h:'H2H'}[k]),
        finite(f.context[side][k],0,100),true);
    check(side+' motivation',Object.hasOwn(statuses,f.context[side].motivation_status),true);
  }
  const xgKnown=finite(f.home_xg,0,Infinity)&&finite(f.away_xg,0,Infinity);
  check('original base either xG ≥1.6',xgKnown,num(f.home_xg)>=1.6 || num(f.away_xg)>=1.6);
  // Base pass is informational: selection uses adjusted xG only.
  const attack=attackEvaluation(f);
  for(const side of ['home','away']) {
    const t=f.player?.[side] || {};
    check(side+' key attacker availability',typeof t.key_attacker_available==='boolean',true);
    if(t.key_attacker_available===false) rules[side+' injury return']='N/A (attacker absent)';
    else check(side+' injury return',t.key_attacker_available===true && typeof t.recovered_from_injury==='boolean',true);
    const fatigue=attackNumber(t.fatigue_index);
    check(side+' fatigue',Number.isFinite(fatigue) && fatigue>=0 && fatigue<=1,true);
    check(side+' expected goals',attack.teams[side].status==='evaluated',true);
  }
  check('either player-adjusted xG ≥1.6',attack.complete,attack.passes);
  for(const side of ['home','away']) check(side+' bench ≥7.5',finite(f[side+'_bench'],0,10),num(f[side+'_bench'])>=7.5);
  const e=f.environment,env=environmentEngine.evaluate_environment(e.weather,e.pitch,
    e.climate==='yes'?true:e.climate==='no'?false:null);
  check('weather',e.weather!=='unknown' && env.supported,true);
  check('pitch',e.pitch!=='unknown' && env.supported,true);
  check('climate shock',e.climate!=='unknown' && env.supported,true);
  check('raw volatility <0.25',finite(e.raw_volatility,0,1),num(e.raw_volatility)<0.25);
  check('adjusted volatility <0.25',finite(e.raw_volatility,0,1)&&env.supported,
    num(e.raw_volatility)*env.volatility_multiplier<0.25);
  check('extra HIGH guard',env.supported,!env.high_risk_flag);
  const evKnown=!!f.market.trim() && Number.isFinite(num(f.odds)) && num(f.odds)>1 &&
    finite(f.p,0,100) && num(f.p)>0 && num(f.p)<100;
  check('named market / odds / probability / EV >0.05',evKnown,
    passesEVBoundary(f,num(f.p)/100*num(f.odds)-1));
  const fresh=activeBatch===f.live.batch && !f.live.stale && Date.now()-Date.parse(f.live.retrieved)<300000 &&
    Date.now()>=Date.parse(f.live.retrieved) && s.feed.some(x=>x.id===f.id && x.live?.batch===f.live.batch);
  check('fresh scan provenance',true,fresh);
  check('scheduled confirmed future',!!f.live.kickoff,
    f.live.status==='pre' && Date.parse(f.live.kickoff)>Date.now());
  check('provider identity agreement',true,!f.live.conflict);
  check('explicit manual reconfirmation',true,f.live.confirmed===true);
  for(const [k,v] of Object.entries(rules))if(v==='Failed' && k!=='original base either xG ≥1.6')blocks.push(k+': Failed.');
  return {missing,blocks,rules};
}
function cancelScan(message) {
  if(scanController) {scanController.abort();scanController=null;scanVersion++;scanMessage=message;}
}
async function fetchJSON(url,signal) {
  const c=new AbortController(),forward=()=>c.abort();
  signal.addEventListener('abort',forward,{once:true});
  if(signal.aborted)c.abort();
  const timer=setTimeout(()=>c.abort(),12000);
  try {
    const r=await fetch(url,{credentials:'omit',signal:c.signal,redirect:'error'});
    if(c.signal.aborted)throw new DOMException('Aborted or timed out','AbortError');
    if(r.status===429) {
      const raw=r.headers.get('retry-after'), seconds=Number(raw);
      const until=raw && Number.isFinite(seconds)?Date.now()+Math.max(60,seconds)*1000:
        raw && Number.isFinite(Date.parse(raw))?Math.max(Date.now()+60000,Date.parse(raw)):Date.now()+60000;
      providerBackoff.set(new URL(url).origin,until);
    }
    if(!r.ok)throw Error('HTTP '+r.status+(r.status===429?' — rate limited; retry delay respected (at least 60s).':''));
    if(!r.headers.get('content-type')?.includes('json'))throw Error('Expected JSON content type.');
    const reader=r.body.getReader(),chunks=[];let size=0;
    while(true) {
      const {done,value}=await reader.read();if(done)break;
      if(c.signal.aborted)throw new DOMException('Aborted or timed out','AbortError');
      size+=value.byteLength;if(size>4000000) {await reader.cancel();throw Error('Response exceeds 4 MB.');}
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);let offset=0;
    for(const b of chunks) {bytes.set(b,offset);offset+=b.length;}
    return JSON.parse(new TextDecoder().decode(bytes));
  } finally {clearTimeout(timer);signal.removeEventListener('abort',forward);}
}
async function scanToday() {
  if(!prepare() || scanController)return;
  if(Date.now()-lastScan<10000) {scanMessage='Local cooldown: wait 10 seconds between scans; no request made.';renderScan(false);return;}
  const day=$('scan-date').value,season=+$('scan-season').value,source=$('scan-sources').value;
  if(!validDay(day) || !Number.isInteger(season) || season<2000 || season>2100) {
    scanMessage='Invalid UTC date or starting season (2000–2100).';renderScan(false);return;
  }
  const controller=new AbortController();scanController=controller;
  const version=++scanVersion,batch=String(Date.now())+'-'+version;
  const settings=[day,season,source].join('|');lastScan=Date.now();
  scanMessage='Fetching sequentially… current slip remains unchanged.';renderScan(false);
  const staged=[],stagedReports=[];
  const providers=[];
  if(source!=='sports')providers.push({name:'OpenLigaDB BL1',
    url:'https://api.openligadb.de/getmatchdata/bl1/'+season,adapter:adaptOL,
    scope:'BL1 selected season; UTC-filtered community schedule, no SLA or completeness guarantee'});
  if(source!=='ol')providers.push({name:'TheSportsDB',
    url:'https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d='+day+'&s=Soccer',adapter:adaptSports,
    scope:'Capped global soccer SAMPLE (free limit 3); provider-day uncertainty; provider cache up to 4h, NOT real-time'});
  for(const provider of providers) {
    if(controller.signal.aborted)break;
    try {
      const until=providerBackoff.get(new URL(provider.url).origin) || 0;
      if(Date.now()<until)throw Error('Rate-limit cooldown until '+new Date(until).toISOString());
      const data=await fetchJSON(provider.url,controller.signal),retrieved=new Date().toISOString();
      const result=provider.adapter(data,day,retrieved,batch);
      staged.push(...result.fixtures);
      stagedReports.push({...result,fixtures:undefined,name:provider.name,scope:provider.scope,retrieved,ok:true});
    } catch(e) {
      if(controller.signal.aborted)break;
      stagedReports.push({name:provider.name,scope:provider.scope,ok:false,
        retrieved:new Date().toISOString(),error:e.name==='AbortError'?'Timeout after 12s':String(e.message).slice(0,180)});
    }
  }
  // Synchronize lock/exposure before any asynchronous commit. No snapshot mutation.
  sync();
  if(controller.signal.aborted || version!==scanVersion || s.lock ||
    settings!==[$('scan-date').value,+$('scan-season').value,$('scan-sources').value].join('|')) {
    if(scanController===controller)scanController=null;
    if(s.lock)render();
    return;
  }
  scanController=null;reports=stagedReports;
  if(stagedReports.some(r=>r.ok)) {
    try {
      const unique=dedupLive(staged);
      activeBatch=batch;
      s.feed=unique.fixtures;
      editorSource=s.feed.length?'feed':'slip';editorIndex=0;
      scanMessage='LIVE schedule: '+s.feed.length+' unique day fixtures, '+unique.duplicates+
        ' duplicates removed. '+(stagedReports.some(r=>!r.ok)?'PARTIAL source success. ':'')+
        'Not worldwide coverage. Missing analytics → HOLD. Refresh did NOT replace slip; older loaded live provenance is stale.';
      log(scanMessage);
    } catch(e) {s.feed.forEach(f=>{if(f.live)f.live.stale=true;});scanMessage='Scan not committed: '+e.message+' Prior live results STALE.';log(scanMessage);}
  } else {
    activeBatch=null;
    s.feed.forEach(f=>{if(f.live)f.live.stale=true;});
    scanMessage='TOTAL FAILURE. Prior live results retained STALE and ineligible. No demo fallback. See source errors.';
    log(scanMessage);
  }
  render();
}
function renderScan(locked) {
  $('scan-date').value=scanSettings.day;
  $('scan-season').value=scanSettings.season;
  $('scan-sources').value=scanSettings.source;
  $('scan-status').textContent=scanMessage;
  const staleCount=s.feed.filter(f=>f.live && (Date.now()-Date.parse(f.live.retrieved)>=300000 ||
    activeBatch!==f.live.batch || f.live.stale)).length;
  if(staleCount)$('scan-status').textContent+=' · '+staleCount+' retained live fixtures STALE / HOLD.';
  if(scanMessage.startsWith('No live request') && s.feed.some(f=>f.live))
    $('scan-status').textContent='Restored live results STALE / HOLD until a fresh scan. No initial network request.';
  $('scan-reports').replaceChildren(...reports.map(r=>node('p',r.name+' · '+r.scope+
    ' · retrieved UTC '+r.retrieved+' · '+(r.ok?'received '+r.received+', day counts '+JSON.stringify(r.counts)+
    ', invalid/excluded '+r.invalid:r.error))));
  for(const id of ['scan-date','scan-season','scan-sources'])$(id).disabled=locked;
  $('scan-today').disabled=locked || !!scanController;
  $('scan-cancel').disabled=locked || !scanController;
  $('download-source').disabled=false;
  const f=editingFixture();
  $('confirm-enrichment').disabled=locked || !f.live;
  $('motivation-trap').disabled=locked || !!f.live;
  $('motivation-calm').disabled=locked || !!f.live;
  for(const id of ['player-absence','player-recovery','player-fatigue','player-strength']) $(id).disabled=locked || !!f.live;
  $('live-detail').textContent=f.live?'MANUAL ASSUMPTIONS — not calibrated or verified. Provider names/status are read-only. '+
    'Freshness expires after 5 minutes; every rescan resets enrichment. Missing: '+liveRules(f).missing.join(', ')+
    '. Rules: '+JSON.stringify(liveRules(f).rules)+'. Per-field provenance: '+JSON.stringify(f.provenance):
    'DEMO: fictional/manual data; not part of any live fixture feed.';
  const slipLive=s.proposal.legs.filter(f=>f.live);
  $('slip-data-note').textContent=slipLive.length?
    'LIVE schedule names • MANUAL ASSUMPTIONS, not calibrated or verified • simulation only':
    'DEMO fictional fixtures • editable illustrative probabilities • simulation only';
  if(slipLive.length && !locked)$('leg-count').textContent+=' · LIVE / MANUAL ASSUMPTIONS, not automated prediction'+
    (slipLive.some(f=>liveRules(f).blocks.length)?' · HOLD / STALE or invalid provenance':'');
}

	const initial = () => ({
		schema: 5,
    feed: demoFeed(),
		proposal: {
			analytics: analyticsDefaults(),
      legs: [0,1,2].map(i => ({...fixtureDefaults(i),
        odds: ['1.7','1.8','1.6'][i], p: ['65','65','70'][i],
        context: i===0 ? analyticsDefaults() : fixtureDefaults(i).context})),
			stake: "5",
			bankroll: "1000",
			baseline: "10",
			budget: "200",
			spent: "0",
			streak: "0",
			mode: "observed",
			demoTime: "0.5",
		},
		reserved: 0,
		accepted: 0,
		lock: null,
		token: null,
		review: null,
		stage: "monitor",
		selected: "monitor",
		events: [],
		result: "No simulated placement accepted.",
	});
	let s = initial(),
		storageOK = true,
		started = performance.now(),
		clicks = [],
		lastAccepted = -Infinity;
	let lastPlace = -Infinity;
	const fingerprint = (p) => JSON.stringify(p);
	function proposalShape(p) {
		return (
			p &&
			(!p.analytics || analyticsShape(p.analytics)) &&
			Array.isArray(p.legs) &&
			p.legs.length >= 1 && p.legs.length <= 8 &&
			p.legs.every(
				(l) => l && typeof l.odds === "string" && typeof l.p === "string" && (!l.context || fixtureShape(l)),
			) &&
			[
				"stake",
				"bankroll",
				"baseline",
				"budget",
				"spent",
				"streak",
				"demoTime",
			].every((k) => typeof p[k] === "string") &&
			["observed", "demo"].includes(p.mode)
		);
	}
	function validStored(v) {
		return (
			v &&
			proposalShape(v.proposal) &&
      (!v.feed || (Array.isArray(v.feed) && v.feed.length <= 100 && v.feed.every(fixtureShape))) &&
			Number.isFinite(v.reserved) &&
			v.reserved >= 0 &&
			Number.isSafeInteger(v.accepted) &&
			v.accepted >= 0 &&
			["monitor", "evaluate", "lock", "review"].includes(v.stage) &&
			Array.isArray(v.events) &&
			v.events.every(
				(e) => Number.isFinite(e.at) && typeof e.message === "string",
			) &&
			(!v.token || typeof v.token.fp === "string") &&
			(!v.review || typeof v.review === "string") &&
			(!v.lock ||
				(Number.isFinite(v.lock.deadline) &&
					proposalShape(v.lock.proposal) &&
					v.lock.fp === fingerprint(v.lock.proposal) &&
					v.lock.calc &&
					Array.isArray(v.lock.calc.errors) &&
					[
						"odds",
						"joint",
						"dt",
						"risk",
						"lm",
						"score",
						"ev",
						"profit",
						"stake",
						"remaining",
						"budgetCap",
						"cap",
					].every((k) => Number.isFinite(v.lock.calc[k]))))
		);
	}
	function storageFail() {
		storageOK = false;
		$("storage-error").hidden = false;
	}
	try {
		localStorage.setItem(KEY + ".probe", "1");
		localStorage.removeItem(KEY + ".probe");
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const v = JSON.parse(raw);
			if (!validStored(v)) throw Error("Invalid storage");
			s = migrate(v);
        if (JSON.stringify(s) !== raw && !save()) storageFail();
		}
	} catch (e) {
		storageFail();
	}
	function save() {
		if (!storageOK) return false;
		try {
			localStorage.setItem(KEY, JSON.stringify(s));
			return true;
		} catch (e) {
			storageFail();
			return false;
		}
	}
	function sync() {
		if (!storageOK) return;
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) {
				const v = JSON.parse(raw);
				if (!validStored(v)) throw Error("Invalid storage");
				s = migrate(v);
        if (JSON.stringify(s) !== raw && !save()) storageFail();
			}
		} catch (e) {
			storageFail();
		}
	}
	function log(message) {
		s.events.push({ at: Date.now(), message });
		s.events = s.events.slice(-50);
		save();
	}
	function decision(p) {
		return Math.max(
			FLOOR,
			p.mode === "demo"
				? num(p.demoTime)
				: (performance.now() - started) / 1000,
		);
	}
	function calculate(p = s.proposal) {
		const errors = [], unsuitable = [];
    const identities=new Set(), ids=new Set();
    p.legs.forEach((f,i)=>{
      const v=evaluateFixture(f), identity=fixtureIdentity(f);
      errors.push(...v.errors.map(e=>'Leg '+(i+1)+': '+e));
      if(ids.has(f.id) || identities.has(identity)) errors.push('Duplicate slip fixture or ID.');
      ids.add(f.id);identities.add(identity);
      if(!v.attack.complete) unsuitable.push('Leg '+(i+1)+': player context UNKNOWN; review required.');
      if(f.live && !v.eligible) unsuitable.push('Leg '+(i+1)+': live all-rule eligibility HOLD. '+v.guardReasons.join(' '));
      if(v.env.high_risk_flag || !v.env.supported)
        unsuitable.push('Leg '+(i+1)+': '+(v.env.high_risk_flag?'High randomness risk.':'Unknown environmental context.'));
    });
		if(p.legs.some(f=>f.live) && (p.legs.length<6 || p.legs.some(f=>!f.live)))
      unsuitable.push('Live review requires 6–8 fully eligible live candidates; no mixed demo/live slip.');
    let odds = 1,
			joint = 1;
		p.legs.forEach((l, i) => {
			const o = num(l.odds),
				q = num(l.p);
			if (!Number.isFinite(o) || o <= 1)
				errors.push("Leg " + (i + 1) + " odds must be finite and >1.");
			if (!Number.isFinite(q) || q <= 0 || q >= 100)
				errors.push("Leg " + (i + 1) + " probability must be in (0,100).");
			odds *= o;
			joint *= q / 100;
		});
		const stake = num(p.stake),
			bank = num(p.bankroll),
			base = num(p.baseline),
			budget = num(p.budget),
			spent = num(p.spent),
			streak = num(p.streak);
		for (const [name, v] of [
			["Stake", stake],
			["Bankroll", bank],
			["Baseline", base],
			["Loss budget", budget],
		])
			if (!Number.isFinite(v) || v <= 0)
				errors.push(name + " must be finite and positive.");
		if (!Number.isFinite(spent) || spent < 0)
			errors.push("Prior loss units must be finite and nonnegative.");
		if (!Number.isSafeInteger(streak) || streak < 0)
			errors.push("Loss streak must be a nonnegative safe integer.");
		if (!["observed", "demo"].includes(p.mode))
			errors.push("Invalid telemetry mode.");
		if (!Number.isFinite(num(p.demoTime)) || num(p.demoTime) < 0)
			errors.push("Demo seconds must be finite and nonnegative.");
		// Algebraic equivalent avoids avoidable binary roundoff at e.g. 35/1000*100.
		const dt = decision(p),
			risk = stake / (bank / 100),
			lm = 1 + streak,
			score = (1 / dt) * risk * lm;
		const ev = joint * odds - 1,
			profit = stake * ev,
			remaining = Math.max(0, budget - spent - s.reserved);
		const budgetCap = Math.min(base, 0.01 * bank, 0.05 * remaining),
			cap = ev > 0 && !unsuitable.length ? budgetCap : 0;
		if (
			![
				odds,
				joint,
				1 / odds,
				dt,
				risk,
				lm,
				score,
				ev,
				ev * 100,
				profit,
				profit * 100,
				remaining,
				budgetCap,
				cap,
			].every(Number.isFinite) ||
			joint <= 0 ||
			1 / odds <= 0
		)
			errors.push("Arithmetic overflow/underflow: reduce values.");
		return {
      unsuitable, count: p.legs.length,
			errors,
			odds,
			joint,
			dt,
			risk,
			lm,
			score,
			ev,
			profit,
			stake,
			remaining,
			budgetCap,
			cap,
		};
	}
	function math(c) {
		return (
			'<p>Slip count: ' + (c.count || 3) + ' independent assumed legs.</p><div class="calc-grid"><div><span>Combined decimal odds</span><strong>' +
			fmt(c.odds, 6) +
			"</strong></div><div><span>Assumed joint chance</span><strong>" +
			fmt(c.joint * 100, 6) +
			"%</strong></div><div><span>Break-even chance (not fair probability)</span><strong>" +
			fmt(100 / c.odds, 6) +
			"%</strong></div><div><span>" +
			(c.ev < 0 ? "Negative EV" : "Nonnegative EV") +
			" / unit</span><strong>" +
			fmt(c.ev, 6) +
			" (" +
			fmt(c.ev * 100) +
			"%)</strong></div><div><span>Signed expected net at " +
			fmt(c.stake) +
			" units</span><strong>" +
			fmt(c.profit) +
			" units</strong></div><div><span>100 identical bets: net expectation, NOT prediction</span><strong>" +
			fmt(c.profit * 100) +
			' units</strong></div></div><p class="muted"><small>100 × ' +
			fmt(c.stake) +
			" × " +
			fmt(c.ev, 6) +
			". Outcome variance remains; this is not a forecast of realized results.</small></p>"
		);
	}
  $('team-inputs').replaceChildren();
  buildAnalytics(); buildFixtureEditor(); buildPlayerEditor();

	const fields = [
		"stake",
		"bankroll",
		"baseline",
		"budget",
		"spent",
		"streak",
		"mode",
		"demoTime",
	];
	function updateTelemetry(c) {
		clicks = clicks.filter((t) => performance.now() - t < 2000);
		$("velocity").textContent = fmt(clicks.length / 2) + " /s";
		$("telemetry-mode").textContent =
			s.proposal.mode === "demo"
				? "MANUAL DEMO OVERRIDE"
				: "OBSERVED LOCAL TIMING";
		$("mode-note").textContent =
			s.proposal.mode === "demo"
				? "Only DecisionTime is overridden. Observed clicks remain separate; streak comes from the labelled simulation input."
				: "Timing starts at load or the latest slip edit/preset/review start, using monotonic time. Placement itself does not reset it.";
		const ok = !c.errors.length;
		$("speed").textContent = ok ? fmt(c.dt) + "s" : "—";
		$("multiplier").textContent = ok ? fmt(c.lm, 0) + "×" : "—";
		$("score").textContent = ok ? fmt(c.score, 4) : "—";
		$("score-bar").value = ok ? Math.min(10, c.score) : 0;
		$("components").textContent = ok
			? "RiskScale = (" +
				fmt(c.stake) +
				" / " +
				fmt(num(s.proposal.bankroll)) +
				") × 100 = " +
				fmt(c.risk, 4) +
				" stake percentage points. LossMultiplier = 1 + " +
				s.proposal.streak +
				" = " +
				c.lm +
				". ImpulseScore = (1 / " +
				fmt(c.dt, 4) +
				" seconds) × " +
				fmt(c.risk, 4) +
				" × " +
				c.lm +
				" = " +
				fmt(c.score, 4) +
				". " +
				(c.score > THRESHOLD
					? "Above 3.5 → intercept."
					: "≤ 3.5 → no threshold interception.")
			: "Correct invalid inputs to calculate.";
	}
	function render() {
    if(s.lock && scanController) cancelScan('Cooling lock began: staged scan discarded.');
		const locked = !!s.lock,
			c = locked ? s.lock.calc : calculate(),
			fp = fingerprint(s.proposal);
		renderWorkspace(locked);
		renderAnalytics(locked);
    renderPlayer(locked);
		document.body.classList.toggle("rational", s.stage === "review" && !locked);
		$("scene").textContent = locked
			? "03 / Cooling-Off Interceptor"
			: s.stage === "review"
				? "04 / Rational Reset"
				: "01–02 / Monitor & Evaluate";
		document.querySelectorAll("[data-leg]").forEach((e) => {
			e.value = s.proposal.legs[+e.dataset.leg][e.dataset.field];
			e.disabled = locked;
		});
		fields.forEach((k) => {
			$(k).value = s.proposal[k];
			$(k).disabled = locked;
		});
		document
			.querySelectorAll("main button")
			.forEach((b) => (b.disabled = locked));
		$('load-selected').disabled = locked || dailySelector.select_matches(s.feed).status !== 'APPROVED';
    $('add-leg').disabled = locked || s.proposal.legs.length >= 8;
    $('remove-leg').disabled = locked || s.proposal.legs.length <= 1;
    $("demoTime").disabled = locked || s.proposal.mode !== "demo";
		$("place").disabled = locked || !storageOK || !!c.errors.length;
		$("storage-error").hidden = storageOK;
		$("validation").hidden = !c.errors.length;
		$("validation").textContent = c.errors.join(" ");
		$("calculations").innerHTML = c.errors.length
			? "Calculations unavailable: correct the inputs."
			: math(c);
		updateTelemetry(c);
		$("result").textContent = s.result;
		$("rational-panel").hidden = s.stage !== "review" || locked;
		$("cap-details").innerHTML = c.errors.length
			? "No eligible cap until inputs are valid."
			: '<div class="cap">' +
				fmt(c.cap) +
				" units</div><p>" +
				(c.unsuitable?.length ? 'Environmental suitability blocked: '+c.unsuitable.join(' ')+' Cap ZERO.' : c.ev <= 0
					? "EV ≤ 0: proposed-bet cap is ZERO. Do not place; checking again rejects without re-locking this released unchanged snapshot."
					: "Model-positive only: explicit review and placement action still required.") +
				'</p><p class="muted">Remaining = ' +
				fmt(num(s.proposal.budget)) +
				" budget − " +
				fmt(num(s.proposal.spent)) +
				" prior loss units − " +
				fmt(s.reserved) +
				" accepted reserved exposure = " +
				fmt(c.remaining) +
				".<br>Eligible maximum = min(" +
				fmt(num(s.proposal.baseline)) +
				" baseline, 1% × " +
				fmt(num(s.proposal.bankroll)) +
				" bankroll, 5% × " +
				fmt(c.remaining) +
				" remaining) = " +
				fmt(c.budgetCap) +
				".</p>";
		$("accepted-count").textContent = s.accepted + " accepted";
		$("log").replaceChildren(
			...s.events
				.slice()
				.reverse()
				.map((e) => {
					const li = document.createElement("li"),
						time = document.createElement("time");
					time.textContent = new Date(e.at).toLocaleTimeString("en-GB");
					li.append(time, document.createTextNode(e.message));
					return li;
				}),
		);
		document.querySelectorAll("[data-node]").forEach((b) => {
			b.classList.toggle("active", b.dataset.node === s.stage);
			b.setAttribute(
				"aria-current",
				b.dataset.node === s.stage ? "step" : "false",
			);
		});
		$("flow-note").textContent =
			"Active: " +
			s.stage +
			". Inspected: " +
			s.selected +
			". Threshold branch: strictly >3.5 freezes before acceptance; ≤3.5 proceeds to review/cap checks. Navigation never places or releases a lock.";
		renderScan(locked);
    if (locked) openModal();
		else if ($("guard").open) {
			$("guard").close();
			$("revisit").focus();
		}
	}
	function openModal() {
		const l = s.lock,
			c = l.calc;
		$("modal-title").textContent =
			c.ev < 0
				? "Mathematical Reality / Negative EV"
				: "Mathematical Reality / Nonnegative EV";
		$("modal-reason").textContent =
			"Frozen snapshot. No placement accepted. Probability estimates remain uncertain; independence is assumed.";
		$("modal-math").innerHTML = math(c);
		$("snapshot-score").textContent =
			"Snapshot score: (1 / " +
			fmt(c.dt, 6) +
			") × " +
			fmt(c.risk, 6) +
			" × " +
			c.lm +
			" = " +
			fmt(c.score, 6) +
			" >3.5; stake " +
			fmt(c.stake) +
			".";
		if (!$("guard").open) {
			$("answerEV").value = "";
			$("answerProfit").value = "";
			$("ack").checked = false;
			$("feedback").textContent = "";
			$("guard").showModal();
			$("guard").setAttribute("tabindex", "-1");
			$("guard").focus({ preventScroll: true });
			$("guard").scrollTop = 0;
		}
	}
	function release(reason) {
		if (!s.lock) return;
		const l = s.lock;
		s.proposal = clone(l.proposal);
		s.token = { fp: l.fp, reason };
		s.review = l.fp;
		s.lock = null;
		s.stage = "review";
		s.selected = "review";
		s.result =
			"Lock released: " +
			reason +
			". Unchanged proposal preserved; nothing placed. Bet eligibility and cap remain separate.";
		log(s.result);
		started = performance.now();
		render();
	}
	let lastValiditySignal='';
  function tick() {
    if(!s.lock) {
      const signal=s.feed.filter(f=>f.live).map(f=>f.id+':'+
        (Date.now()-Date.parse(f.live.retrieved)>=300000)+':'+
        (f.live.kickoff && Date.now()>=Date.parse(f.live.kickoff))).join('|');
      if(signal!==lastValiditySignal) {lastValiditySignal=signal;render();}
    }
		if (s.lock) {
			// Click window decays while the mathematical snapshot stays frozen.
			updateTelemetry(s.lock.calc);
			if (Date.now() >= s.lock.deadline) {
				release("timer expiry");
				return;
			}
			$("countdown").textContent =
				"00:" +
				String(Math.ceil((s.lock.deadline - Date.now()) / 1000)).padStart(
					2,
					"0",
				);
			if (s.lock.deadline - Date.now() > 59000)
				$("countdown").textContent = "01:00";
		} else updateTelemetry(calculate());
	}
	function prepare() {
		sync();
		tick();
		if (s.lock) {
			render();
			return false;
		}
		return true;
	}
	function invalidate() {
		s.token = null;
		s.review = null;
		s.stage = "monitor";
		s.result = "Proposal changed; previous review/release token invalidated.";
		started = performance.now();
	}
	function intercept(c) {
		cancelScan('Cooling lock began: staged scan discarded.');
    const p = clone(s.proposal);
		s.lock = {
			proposal: p,
			fp: fingerprint(p),
			calc: clone(c),
			deadline: Date.now() + LOCK_MS,
		};
		s.stage = "lock";
		s.selected = "lock";
		s.review = null;
		s.result = "Intercepted before acceptance. Nothing placed.";
		log(
			"Score " +
				fmt(c.score, 6) +
				" >3.5: actual 60-second interception started.",
		);
		render();
		tick();
	}
	function place() {
		if (!prepare() || !storageOK) return;
		if (performance.now() - lastPlace < 600) {
			s.result = "Rapid duplicate placement check ignored; no acceptance.";
			render();
			return;
		}
		lastPlace = performance.now();
		const c = calculate(),
			fp = fingerprint(s.proposal);
		if (c.errors.length) {
			s.result = "Rejected: invalid proposal.";
			render();
			return;
		}
		if (c.score > THRESHOLD && s.token?.fp !== fp) {
			intercept(c);
			return;
		}
		s.stage = "review";
		s.selected = "review";
		if (c.unsuitable?.length) {
      s.result = 'Rejected: unsuitable environmental slip. ' + c.unsuitable.join(' ') +
        ' Cap ZERO; lock release does not remove warnings.';
      log(s.result);render();return;
    }
    if (c.ev <= 0) {
			s.result =
				"Rejected: EV ≤ 0, cap ZERO. Lock release is not bet eligibility. Unchanged released proposal will not restart its lock.";
			log(s.result);
			render();
			return;
		}
		if (s.review !== fp) {
			s.review = fp;
			s.result =
				"Rational review opened. Nothing placed. Check cap, then take a separate explicit action.";
			log(s.result);
			render();
			return;
		}
		if (c.stake > c.cap) {
			s.result = "Rejected: stake exceeds cap " + fmt(c.cap) + ".";
			log(s.result);
			render();
			return;
		}
		if (performance.now() - lastAccepted < 800) {
			s.result = "Duplicate click ignored. No additional exposure accepted.";
			render();
			return;
		}
		const previous = clone(s);
		s.reserved += c.stake;
		s.accepted++;
		s.review = null;
		s.result =
			"Accepted SIMULATION ONLY: " +
			fmt(c.stake) +
			" units reserved. No real bet or money.";
		if (!Number.isFinite(s.reserved) || !save()) {
			s = previous;
			storageFail();
			s.result = "Storage failure: simulation not accepted.";
			render();
			return;
		}
		lastAccepted = performance.now();
		log(s.result);
		render();
	}
	function preset(tilt) {
		if (!prepare()) return;
		const p = s.proposal;
    p.legs = initial().proposal.legs;
    if (tilt) p.legs.forEach((l,i)=> {l.odds=['2.4','2.1','1.9'][i];l.p=['35','40','45'][i];});
    p.analytics = clone(p.legs[0].context); editorSource='slip';editorIndex=0;
		p.mode = tilt ? "demo" : "observed";
		p.demoTime = "0.25";
		p.streak = tilt ? "2" : "0";
		p.stake = String(
			tilt
				? num(p.bankroll) * 0.1
				: Math.min(
						num(p.baseline),
						num(p.bankroll) * 0.005,
						Math.max(0.01, (num(p.budget) - num(p.spent) - s.reserved) * 0.025),
					),
		);
		invalidate();
		s.stage = tilt ? "evaluate" : "monitor";
		s.result = tilt
			? "Simulated tilt: 3 independent assumed legs, 2 consecutive demo losses, manual 0.25s DecisionTime. Limits and accepted exposure unchanged."
			: "Calm observed-time scenario; limits, prior loss units and accepted exposure unchanged.";
		log(s.result);
		render();
	}
  document.querySelector('main').addEventListener('input', event => {
    const e=event.target;
    if (!e.matches('input,select')) return;
    if(['scan-date','scan-season','scan-sources'].includes(e.id)) {
      const next=e.value;
      if(!prepare()) {render();return;}
      cancelScan('Settings changed: scan again.');
      if(e.id==='scan-date') {scanSettings.day=next;scanSettings.season=seasonFor(next);}
      if(e.id==='scan-season')scanSettings.season=next;
      if(e.id==='scan-sources')scanSettings.source=next;
      renderScan(false);return;
    }
    const value=e.value; // sync may re-render during a lock: capture only, never mutate first.
    if (!prepare()) {render();return;}
    if(e.id==='fixture-editor') {
      const [source,index]=value.split(':');
      if(['feed','slip'].includes(source) && Number.isInteger(+index) &&
        (source==='feed'?s.feed:s.proposal.legs)[+index]) {editorSource=source;editorIndex=+index;}
      render();return;
    }
    if(e.dataset.teamField==='name' && editingFixture().live) {render();return;}
    const targetFixture=e.dataset.leg!==undefined?s.proposal.legs[+e.dataset.leg]:editingFixture();
    if(targetFixture?.live) {
      targetFixture.live.confirmed=false;
      const key=e.dataset.playerSide ? 'player.'+e.dataset.playerSide+'.'+e.dataset.playerField : e.dataset.team ? e.dataset.team+'.'+e.dataset.teamField : e.dataset.fixtureField || e.dataset.field;
      if(key) targetFixture.provenance[key]={kind:'manual assumption',at:new Date().toISOString()};
    }
    if(e.dataset.playerSide!==undefined) {
      const f=editingFixture(),t=f.player[e.dataset.playerSide],k=e.dataset.playerField;
      if(k==='recovered_from_injury' && t.key_attacker_available===false) {render();return;}
      t[k]=k==='fatigue_index'?value:value==='true'?true:value==='false'?false:null;
      f.provenance['player.'+e.dataset.playerSide+'.'+k]={kind:'MANUAL ASSUMPTION',at:new Date().toISOString()};
    } else if(e.dataset.leg!==undefined) {
      const l=s.proposal.legs[+e.dataset.leg];
      if(l && ['odds','p'].includes(e.dataset.field)) l[e.dataset.field]=value;
    } else if(e.dataset.team!==undefined) editingContext()[e.dataset.team][e.dataset.teamField]=value;
    else if(e.dataset.fixtureField) {
      const f=editingFixture(),k=e.dataset.fixtureField;
      if(Object.hasOwn(f.environment,k)) f.environment[k]=value;else f[k]=value;
    } else if(fields.includes(e.id)) s.proposal[e.id]=value;
    else return;
    if(e.dataset.playerSide!==undefined || e.dataset.team!==undefined || e.dataset.fixtureField) syncLoadedFixture(editingFixture());
    invalidate();log('Edited '+(e.id || ('leg '+(+e.dataset.leg+1)+' '+e.dataset.field))+
      '; previous review/release invalidated.');render();
  });
  $('feed-results').addEventListener('click',event=>{
    const b=event.target.closest('[data-edit-feed]');if(!b || !prepare())return;
    editorSource='feed';editorIndex=+b.dataset.editFeed;render();$('fixture-editor').focus();
  });
  $('load-selected').onclick=loadSelected;
  for(const [id,kind] of [['player-absence','absence'],['player-recovery','recovery'],
    ['player-fatigue','fatigue'],['player-strength','full strength']]) $(id).onclick=()=>playerDemo(kind);
  $('player-calculate').onclick=()=>{if(!prepare())return;log('Recalculated selected fixture, all criteria and daily selection; no market inputs changed.');render();};
  $('scan-date').value=todayUTC();$('scan-season').value=seasonFor(todayUTC());
  $('scan-today').onclick=scanToday;
  $('scan-cancel').onclick=()=>{cancelScan('Cancelled; prior successful results retained, no staged commit.');render();};
  $('confirm-enrichment').onclick=()=>{
    if(!prepare())return;const f=editingFixture();if(!f.live)return;
    if(!attackEvaluation(f).complete) {
      f.live.confirmed=false;log('Manual confirmation refused: both teams require valid base/player fields.');render();return;
    }
    f.live.confirmed=true;f.live.confirmedAt=new Date().toISOString();
    invalidate();log('Explicitly confirmed MANUAL ASSUMPTIONS, not calibrated or verified.');render();
  };
  $('add-leg').onclick=()=>{
    if(!prepare() || s.proposal.legs.length>=8)return;
    let i=3;while(s.proposal.legs.some(l=>l.id===fixtureDefaults(i).id))i++;
    s.proposal.legs.push(fixtureDefaults(i));invalidate();
    log('Added independent fictional custom leg; nothing placed.');render();
  };
  $('remove-leg').onclick=()=>{
    if(!prepare() || s.proposal.legs.length<=1)return;
    s.proposal.legs.pop();editorSource='slip';editorIndex=0;invalidate();
    log('Removed last leg; nothing placed.');render();
  };
  $('feed-qualify').onclick=()=>loadFeedDemo('qualify');
  $('feed-hold').onclick=()=>loadFeedDemo('hold');
  $('feed-trap').onclick=()=>loadFeedDemo('trap');
  $('download-source').onclick=()=>{
    const url=URL.createObjectURL(new Blob([CANONICAL_SOURCE],{type:'text/html;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='projekti-janus.html';
    a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    log('Downloaded complete standalone source; no lock bypass or placement.');
  };
	// Only meaningful unlocked simulation clicks. No timer tick counts as input.
	document.querySelector("main").addEventListener(
		"click",
		(e) => {
			if (!s.lock && e.target.closest("button,input,select")) {
				clicks.push(performance.now());
				updateTelemetry(calculate());
			}
		},
		true,
	);
  $('motivation-trap').onclick = () => motivationDemo(true);
  $('motivation-calm').onclick = () => motivationDemo(false);
	$("normal").onclick = () => preset(false);
	$("tilt").onclick = () => preset(true);
	$("place").onclick = place;
	$("loss").onclick = () => {
		if (!prepare()) return;
		const n = num(s.proposal.streak);
		if (!Number.isSafeInteger(n) || n < 0 || n >= Number.MAX_SAFE_INTEGER) {
			s.result =
				"Set a valid nonnegative integer streak before recording a loss.";
			render();
			return;
		}
		s.proposal.streak = String(n + 1);
		invalidate();
		log(
			"Simulated loss recorded: streak " +
				(n + 1) +
				". No real result observed.",
		);
		render();
	};
	$("win").onclick = () => {
		if (!prepare()) return;
		s.proposal.streak = "0";
		invalidate();
		log("Simulated win resets streak only; reserved exposure unchanged.");
		render();
	};
	$("review").onclick = () => {
		if (!prepare()) return;
		started = performance.now();
		s.stage = "review";
		s.selected = "review";
		s.result =
			"Review starting point reset for observed decision time. No placement; threshold still checked on Place Bet.";
		log(s.result);
		render();
	};
	$("revisit").onclick = () => {
		if (!prepare()) return;
		log("Revisited unchanged proposal; no acceptance or token change.");
		render();
		$("stake").focus();
	};
	document.querySelectorAll("[data-node]").forEach(
		(b) =>
			(b.onclick = () => {
				if (!prepare()) return;
				s.selected = b.dataset.node;
				log("Inspected " + s.selected + "; no placement or state bypass.");
				render();
			}),
	);
	$("confirm").onclick = () => {
		sync();
		tick();
		if (!s.lock) return;
		const c = s.lock.calc,
			a = num($("answerEV").value),
			b = num($("answerProfit").value);
		const targetEV = Number((c.ev * 100).toFixed(2)),
			targetProfit = Number(c.profit.toFixed(2));
		if (
			Number.isFinite(a) &&
			Number.isFinite(b) &&
			Math.abs(a - targetEV) <= 0.010000000001 &&
			Math.abs(b - targetProfit) <= 0.010000000001 &&
			$("ack").checked
		)
			release("correct mathematical confirmation");
		else
			$("feedback").textContent =
				"Not confirmed. Enter both finite signed answers within 0.01 of their 2-decimal targets and acknowledge the risk. Lock and deadline unchanged.";
	};
	$("guard").addEventListener("cancel", (e) => e.preventDefault());
	$("guard").addEventListener("keydown", (e) => {
		if (e.key !== "Tab") return;
		const list = [...$("guard").querySelectorAll("input,button")].filter(
			(x) => !x.disabled,
		);
		if (e.shiftKey && document.activeElement === list[0]) {
			e.preventDefault();
			list.at(-1).focus();
		} else if (!e.shiftKey && document.activeElement === list.at(-1)) {
			e.preventDefault();
			list[0].focus();
		}
	});
	window.addEventListener("storage", (e) => {
		if (e.key === KEY || e.key === null) {
			sync();
			tick();
			render();
		}
	});
	["focus", "pageshow"].forEach((event) =>
		window.addEventListener(event, () => {
			sync();
			tick();
			render();
		}),
	);
	document.addEventListener("visibilitychange", () => {
		sync();
		tick();
		render();
	});
	if (!s.events.length) log("Initialized illustrative local simulation.");
	tick();
	render();
	setInterval(tick, 100);
})();
</script></body></html>

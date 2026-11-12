# Projekti Janus — Anti-Impulse Football Betting Guard

## Purpose and deliverable
- App name: Anti-Impulse Football Guard. Philosophy: transform mechanics of risk and illusion into mathematical transparency, while disclosing probability uncertainty.
- Build an interactive UI/UX prototype for rational decision-making in football betting, including a visual flowchart and simulation dashboard.
- Deliver complete self-contained HTML/CSS/JavaScript source suitable for saving as projekti-janus.html and opening in a browser. The prototype is a simulation, not a real betting integration.
- Use English interface copy.

## Required interaction flow
1. Input Monitoring: track actual local interaction click velocity and decision time, stake relative to bankroll, and consecutive simulated losses (Tilt state). Clearly distinguish observed local telemetry from demo presets.
2. Threshold Evaluation: ImpulseScore = (1 / DecisionTime) * RiskScale * LossMultiplier. Trigger friction when ImpulseScore > 3.5 (strict comparison). Define and display RiskScale and LossMultiplier and guard against zero decision time.
3. Cooling-Off Interceptor: intercept before acceptance, freeze Place Bet, start a real 60-second countdown, and display calculated EV percentage with explicit probability assumptions.
4. Rational Reset: unlock when the user correctly confirms risk mathematically OR the time lock expires. This replaces the earlier no-early-unlock rule. Do not automatically place a bet upon unlocking. Shift to calm blue rational review and display a calculated exposure cap.

## Calculation and safety clarity
- Make EV probability assumptions explicit; distinguish estimated probability from bookmaker-implied probability and flag uncertainty and correlation in multi-bets. Do not claim estimated EV is objectively true or all bets have negative EV.
- Treat staking limits as discretionary-budget caps, never as guaranteed safe bets or profit assurances. Unlocking does not make a negative-EV bet eligible for simulated acceptance.
- Keep all bets simulated; do not connect to betting services or process money.
## Team motivation and TPI
- Integrate MotivationalUrgencyEngine for both teams alongside current form, five-year history and H2H context. Show base and motivation-adjusted team power index (TPI).
- Apply the supplied multipliers: relegation_fight = 1.25, title_or_europe = 1.15, safe_zone = 0.85; other statuses retain 1.0 until explicitly defined. Adjusted TPI = base TPI * multiplier, displayed to two decimals.
- Warn about a possible motivational trap when the team weaker by base TPI is fighting relegation against a safe-zone opponent, even if the adjustment does not reverse their ranking.
- These coefficients are uncalibrated heuristics, not proven percentage changes in performance or probabilities. Do not silently convert adjusted TPI into win probability or EV.
- Historical, form and H2H data must have explicit provenance; live schedule access does not establish complete historical or analytical coverage. Distinguish live-provider fields, manual assumptions and demo data.

## Player impact and expected goals
- Integrate PlayerImpactGoalEngine for each team's attack capacity on every fixture: key attacker absent multiplies base xG by 0.75; otherwise a recently recovered available attacker multiplies by 0.85. These two branches are mutually exclusive, as in the supplied code.
- Fatigue index strictly greater than 0.8 adds a 0.90 multiplier; equal to 0.8 does not. Validate fatigue within 0–1. Display base xG, factor breakdown, adjusted expected goals for each team and summed expected goals to two decimals.
- Expected goals are uncertain model estimates, not exact future goal counts or a guaranteed goal range. Do not silently derive probabilities/EV from player-adjusted xG or apply motivation/environment penalties again to xG without an explicitly defined model.
- Missing player availability, relevant recovery status or fatigue is unknown, not full strength. For live matches these missing fields prevent all-rule eligibility until labelled manual or verified source data supplies them. Demo full-strength defaults must be explicitly illustrative.
- Player context edits invalidate current review and cannot change a frozen cooling snapshot. Preserve existing API scan, other modules, caps and lock behavior.


## Environmental conditions
- Integrate EnvironmentalConditionEngine for each individual match. Live-provider or optional venue-linked forecast data may supplement labelled manual/demo data; missing pitch and climate information remains unknown.
- Heavy pitch categories muddy, waterlogged, badly_damaged apply a 0.85 penalty to the identified favourite's motivation-adjusted TPI. Extreme weather categories heavy_storm, gale_force_winds, heavy_snow increase a separate volatility multiplier by 1.2 and divide the favourite's TPI by 1.2. Normal factors are 1.0. Do not multiply favourite TPI by 1.2.
- The user confirmed this separated TPI/volatility approach and the threshold of 3 or more simultaneous environmental factors for High randomness risk. Count the three independent categories once each: heavy pitch, extreme weather, visiting-team climate shock. Two factors do not meet the high-risk threshold.
- Heavy pitch or extreme weather produces an Environmental Trap warning. Climate shock also has its own warning; no unsupported numerical climate penalty.
- Environmental and motivation adjustments are contextual heuristics, not calibrated changes to probabilities/EV. Make the chosen favourite basis explicit and preserve raw inputs and factor breakdowns.

## Combined daily selector
- Merge DailyMatchSelector with motivation/environment evaluation and the existing anti-impulse flow.
- Apply selection conditions: either team's player-adjusted xG >=1.6; both bench ratings >=7.5; adjusted volatility index <0.25; calculated EV per unit >0.05. Compare unrounded adjusted xG at the threshold and display rounded estimates separately. Rank by assumed real probability descending and choose at most 8; fewer than 6 qualifying matches yields HOLD.
- Bind probability and EV to a named market and decimal odds, validate data and explain independence assumptions for combined slips. APPROVED means filter-qualified for review, not safe or placed. Never auto-place selected matches.
- Evaluate each match's environmental and team contexts and expose warnings alongside selection. Keep raw versus weather-adjusted volatility explicit; use adjusted volatility for the tactical-risk filter. High-randomness matches cannot be labelled eligible while ignoring the environmental warning.

## Today's fixture scan
- Add Skano Ndeshjet e Sotme / Scan Today's Matches using browser fetch to public sports APIs, with an explicit date/timezone, coverage scope, source and retrieval time. On-demand refresh is not a guaranteed real-time feed.
- Prefer browser-tested credential-free/public sources. Limited or cached daily results must be labelled incomplete; no claim of worldwide fixture coverage or eight safest matches.
- Missing xG, bench ratings, five-year strength, H2H, motivation evidence, volatility, market odds/probability and environmental context must remain unknown and prevent all-rule eligibility. Never fill live-provider gaps with demo scores, implied fair probabilities or automatic safe-zone/normal-weather assumptions.
- Keep every existing filter and guard. The selector chooses at most eight fully eligible candidates; fewer than six yields HOLD. Manual enrichment must be labelled as assumptions, not validated live predictions.
- Optional weather forecast must be tied to venue coordinates and kickoff time, with attribution and uncertainty. Forecasts do not establish pitch damage or climate shock.
- Do not embed confidential API credentials or connect to betting placement. Preserve in-flight cooling snapshots and explicit review requirements during asynchronous refresh.

## Cloud backend, scheduler and notifications
- Prepare a deployable Node.js backend with PostgreSQL persistence, a separate scheduled scan command and standard Web Push with VAPID. Render is the initial deployment target; no cloud deployment, purchase, phone subscription or production notification is activated by code preparation.
- Keep all analytical modules and fail-closed completeness checks on the backend. Notify only when 6–8 current, fully filter-qualified candidates exist; no notifications for HOLD, unknown/stale data or demo results. Notification wording is for review, never guaranteed safety or automatic betting.
- Prepare a configurable Render Cron Job. Initial template schedule is 07:00 UTC daily, not a user-fixed local timezone; document UTC and daylight-saving implications before activation. Do not run the daily scheduler inside the web process.
- Persist scan results, data provenance, subscriptions and notification delivery/outbox state in PostgreSQL, not ephemeral JSON files. Use locks, deduplication and bounded retry/expiration; push service acceptance is not proof of delivery to the phone.
- Require authenticated owner access and safe handling of subscriptions/CSRF. VAPID private keys, credentials and provider secrets stay server-side. Secure-context service worker and explicit user permission are required for Web Push.
- Retain the existing local prototype as a fallback; the cloud-served frontend connects to the backend and exposes login, scan results and explicit notification opt-in. Preserve all cooling snapshots, caps and no-auto-placement rules.
- Deployment guide and setup material are in Albanian; application interface remains English with existing bilingual scan/notification labels as appropriate.

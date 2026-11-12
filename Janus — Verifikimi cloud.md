# Janus — Verifikimi cloud

**Përgatitje e përfunduar; analitika live e pjesshme.** Testuar më 12 nëntor 2026.
Nuk është bërë deploy, provisioning, blerje, abonim real telefoni ose dërgim Push
real. Nuk ka URL publike të krijuar. “Accepted” nuk është provë shfaqjeje.

## Rezultatet e ekzekutuara

| Grup | Rezultat / metoda |
|---|---|
| Node | **113 teste kaluan**, 0 dështime/skip në ekzekutimin e plotë me DB lokale; `npm ci` nga lockfile kaloi. |
| PostgreSQL | DB reale lokale, jo pg-mock: migrime të përsëritura, constraints, run/results/outbox atomik, enrichment, sesione/auth/CSRF, dedup, leases, retry/TTL dhe lock concurrent. |
| Daily CLI | Skripti real u ekzekutua në subprocess me fixtures të izoluara dhe transport Push mock: missing → HOLD; 6 → APPROVED/queue një herë/accepted mock; rerun pa queue tjetër; 5, HIGH dhe started → HOLD. |
| Chromium — guard | **65 kontrolle** të ekzekutuara: formula/floor/strict threshold, signed math+ack, timer boundary, lock/reload/cross-tab, caps/ekspozim/double-click dhe navigim. |
| Chromium — module të bashkuara | **172 kontrolle**: motivation/default/traps, environment/kombinimet/favourite identity, selector/boundaries/dedup/sort/1–8 legs dhe integrim. |
| Chromium — lojtarët | **102 kontrolle**: absence ELSE recovery, fatigue >.8, rounding/raw threshold 1.598, dy ekipet, UNKNOWN/types, isolation, provenance, migrim/fingerprint/freeze. |
| Chromium — scan | **65 kontrolle**, përfshirë fetch real file:// dhe download/boot; mocks për gabime/partial/cooldown/out-of-order/lock-start discard. CSP i ri i ngushtë u kontrollua. |
| Chromium — cloud | **34 kontrolle** me API/SW/PushManager mocks: login/logout, source/status HOLD/review, explicit load, manual payload, denied permission, user-gesture opt-in, VAPID options, disable, explicit TEST, async lock freeze, responsive bounds dhe file fallback. |
| Browser gjithsej | **438 kontrolle** të rerunuara mbi frontend-in final; jo kopjim i pretendimit historik 419. |
| Materializer | Ekstraktim i plotë dhe krahasim byte-për-byte/SHA-256; target ekzistues, symlink, path traversal, hash/payload i korruptuar dhe konflikt file/directory u refuzuan. Nuk shkarkoi asgjë. |
| Komandat/helper-at | Migrim/nisje web/health/HTML lokal dhe daily CLI read-only; helper-at krijuan vetëm kredenciale sintetike private lokale dhe refuzuan overwrite. |
| Blueprint | YAML parse dhe strukturë/routing/env/schedule testuar; plan IDs/disk kontrolluar kundrejt dokumentacionit zyrtar aktual. Jo validim/deploy nga Render. |

Testet browser ruhen te `tests/` bashkë me fixture generator të izoluar; test hooks
nuk ndodhen në HTML/server të prodhimit. Kopja `tests/legacy-source.html` është
inputi historik për migration regression, jo versioni final cloud. Testet nuk
bëjnë baste, pagesa ose përdorin provider analitik të trilluar.

## Evidenca dhe kufijtë specifikë

Backend-i nuk beson një APPROVED nga klienti. Engine i përbashkët është nxjerrë
nga app-i i dhënë, pa DOM/network; i njëjti tekst është embedded në frontend dhe
modul në server. Testi i parity krahason 20 fixture variants në dy ekzekutime të
kodit, plus regresionet UI. Missing/stale/finished/inplay/ambiguous/HIGH/demo
mbeten të pakualifikuara. Manual override nuk anashkalon form/history/H2H.

DB reale provoi lock që merret para leximit të providers, busy për scan paralel,
run ERROR për dështim fatal, recover/unlock dhe rerun pa notification të dyfishtë
kur ndryshon vetëm retrieval timestamp. Snapshot ruan version/hash rregullash,
provenancë dhe reports. Mungesa e subscription regjistrohet no_subscriptions.

Push është **mock**: 404/410 çaktivizim, 401/403 pa fshirje masive, 429 Retry-After,
5xx/timeout/backoff/exhaustion, TTL para kickoff/freshness, unique delivery dhe
lease concurrent u testuan. CLI test përdori librarinë reale web-push për
VAPID/enkriptim, por `https.request` u interceptua në preload test-only: **asnjë
kërkesë te telefoni/Push endpoint real**. Recover i lease-it tregon pse crash
pas pranimit e para DB mund të ridërgojë; stable tag nuk është exactly-once.

Auth u testua edhe me HTTP server lokal real: no default password, scrypt,
sesione të skaduara/logout, cookie HttpOnly/SameSite dhe Secure në config HTTPS,
origin/CSRF/custom login header, body/rate limits, endpoint ownership dhe refuzim
SSRF/keys/expiry. Trusted push hosts janë exact allowlist; private/mapped IP dhe
DNS private destinations bllokohen; transporti nuk ndjek redirects. Nuk u provua
një DNS rebinding i orkestruar në rrjet real ose penetration test i jashtëm.

Service worker u ekzekutua në harness VM: showNotification, valid count/scan ID,
tag, same-origin click dhe mungesa e fetch-cache handler. Në Chromium, permission/
registration/subscribe të cloud suite janë mocks; nuk pretendohen provë Android,
Push delivery ose regjistrim real. Nuk pati prompt automatik në boot ose TEST
automatik. Elementet cloud/player u kontrolluan brenda bounds dhe pa document
overflow në 320/390/1280 px; modal focus/Tab/Escape u kontrolluan nga core suite.

## Providers realë, read-only

Më **12 nëntor 2026**, browser-i file:// dhe backend HTTP i testuar lexuan:

- `https://api.openligadb.de/getmatchdata/bl1/2026`: **306** season entries,
  **0** fixtures për ditën UTC të testit, **0** entries të pavlefshme.
- `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2026-11-12&s=Soccer`:
  **3** records të kufizuara, **3 UNKNOWN**, zero kualifikime. Response cache
  `public, max-age=14400`; timestamps pa timezone nuk u trajtuan si UTC.
- Backend read-only smoke u krye rreth **12:25 UTC**; file-browser scan u rerunua
  edhe mbi versionin përfundimtar. Rezultati: **HOLD**, jo “sot nuk ka ndeshje
  në botë”, jo “8 më të sigurta”. Download-i canonical u hap dhe skanoi sërish.

Mungojnë analiza lojtarësh, xG/bench/volatility, probabilitet i kalibruar,
histori/form/H2H e validuar dhe motivim/pitch/climate. Nuk është integruar
forecast ose provider analitik i jashtëm. Manual assumptions mund të krijojnë
kandidatë për shqyrtim; kjo nuk i bën parashikime të validuara.

## Integriteti i dorëzimit

- **49 skedarë** në repository-n e rindërtueshëm; package.json,
  package-lock.json, frontend, SW/manifest, server, migrime, CLI, Blueprint, teste
  dhe README/ky raport përfshihen në payload-in JSON të kompresuar.
- SHA-256 i `public/index.html` dhe i dokumentit të frontend-it:
  `5c7346fc922074ea16109c5fbbf0106602d098efa17cd543e0c842d00f2e4a7a`
- SHA-256 i `package-lock.json`:
  `7c9db3fc5e3466080589d2cb629f21864f891861b4424bd81e39c21548e5bde1`
- Python materializer kontrollon hash-in e payload-it dhe të **çdo skedari**,
  pastaj hash-in pas shkrimit. Përmbajtja e ekstraktuar u krahasua me repository-n
  e testuar. Nuk ka ZIP të jashtëm, shkarkime Python, secrets të vërteta, caches,
  node_modules ose test-fixtures të gjeneruara në payload.
- Inputi origjinal nuk u ndryshua. Frontend-i i veçantë është i njëjtë me atë
  që materializer-i rikrijon; udhëzuesi dhe raporti përputhen me repository-n.

## Ende të patestuara / jo të përfshira

Deploy/Build real Render, blerje/billing, migrim në DB cloud, Docker Compose,
TLS/domain real, OS/browser permissions të telefonit, dërgim/shfaqje Push real,
Firefox/Safari, pajisje fizike, screen readers, private-mode variations, background
suspension e gjatë dhe race multi-tab e stresuar mbeten **të patestuara**.
Node 24.20.0 u ekzekutua; kompatibiliteti i deklaruar Node 22+ nuk është provë
ekzekutimi në Node 22. Suite nuk certifikon siguri të plotë ose efekt klinik.

Cron-i default është literal 07:00 UTC, jo localtime e konfirmuar. Nuk ka timer
ditor në web. Retry të vonuara kërkojnë dispatch tjetër para TTL; vetëm cron ditor
mund t’i lërë të skadojnë. Nuk u shtua shërbim i dytë me pagesë fshehurazi.
Kostot aktuale nuk u riverifikuan me sukses; nuk është hardcoded total monetar.
Guard/storage/ora lokale janë të tamperueshme. Asnjë rezultat nuk është bast
i sigurt, parashikim i garantuar ose vendosje automatike.

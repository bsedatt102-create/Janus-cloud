'use strict';

const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, 'results-ledger.json');
const BASE_URL = 'https://api.football-data.org/v4';
const DEFAULT_API_KEY = 'bf623055aba94cffa85140d6d3a76b9b';

const pad = (n) => String(n).padStart(2, '0');

function toApiDate(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function addDays(d = new Date(), days = 0) {
  const copy = new Date(d.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || DEFAULT_API_KEY;
}

function normalizeTeamKey(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(fc|cf|sc|afc|ac|as|us|ss|rc|cd|ud|sd|fk|sk|nk|bv|sv|vfb|fsv|rcd|real|atletico|atlético|inter|milan|united|city|1907)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMatchLookupKey(home = '', away = '', dateStr = '') {
  const h = normalizeTeamKey(home);
  const a = normalizeTeamKey(away);
  const d = String(dateStr || '').slice(0, 10);
  return `${h}__${a}__${d}`;
}

function normalizeScoreDisplay(rawScore = '') {
  if (!rawScore) return null;
  if (typeof rawScore === 'string') {
    const cleaned = rawScore.trim().replace(/\s*-\s*/g, ':').replace(/\s+/g, '');
    return /^\d+:\d+$/.test(cleaned) ? cleaned : (cleaned || null);
  }
  if (typeof rawScore === 'object') {
    const h = rawScore.home ?? rawScore.current ?? null;
    const a = rawScore.away ?? null;
    if (Number.isFinite(Number(h)) && Number.isFinite(Number(a))) {
      return `${Number(h)}:${Number(a)}`;
    }
  }
  return null;
}

function parseScorePair(scoreStr = '') {
  const match = String(scoreStr || '').match(/(\d+)\s*[:\-]\s*(\d+)/);
  if (!match) return { home: null, away: null };
  return {
    home: Number(match[1]),
    away: Number(match[2]),
  };
}

function loadLedger() {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return { records: [], settledTickets: [], updatedAt: null };
    }
    const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      records: Array.isArray(parsed?.records) ? parsed.records : [],
      settledTickets: Array.isArray(parsed?.settledTickets) ? parsed.settledTickets : [],
      updatedAt: parsed?.updatedAt || null,
    };
  } catch {
    return { records: [], settledTickets: [], updatedAt: null };
  }
}

function saveLedger(ledger) {
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  ledger.records = Array.isArray(ledger.records) ? ledger.records : [];
  ledger.settledTickets = Array.isArray(ledger.settledTickets) ? ledger.settledTickets : [];
  ledger.updatedAt = new Date().toISOString();
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8');
}

function classifyMarketCategory(betType = '') {
  const b = String(betType || '').toLowerCase().replace(/\s+/g, ' ').trim();

  if (
    b.includes('1-1') ||
    b.includes('2-2') ||
    b.includes('x-1') ||
    b.includes('1-x') ||
    b.includes('ht/ft') ||
    b.includes('1 & 3,5') ||
    b.includes('1 & 3.5') ||
    b.includes('1 & mbi 3.5') ||
    b.includes('2 & mbi 3.5') ||
    b.includes('gg & mbi 2.5') ||
    b.includes('gg & over 2.5')
  ) {
    return 'HIGH_ODDS_COMBO';
  }

  if (
    b.includes('1 & gg') ||
    b.includes('1&gg') ||
    b.includes('2 & gg') ||
    b.includes('2&gg') ||
    b.includes('gg & 1') ||
    b.includes('gg & 2')
  ) {
    return 'WIN_AND_GG';
  }

  if (b.includes('dnb') || b.includes('draw no bet') || b.includes('pa barazim')) {
    return 'DRAW_NO_BET';
  }

  if (
    b.includes('0.5') ||
    b.includes('0,5') ||
    b.includes('1.5') ||
    b.includes('1,5') ||
    b.includes('2.5') ||
    b.includes('2,5') ||
    b.includes('3.5') ||
    b.includes('3,5') ||
    b.includes('4.5') ||
    b.includes('4,5') ||
    b.includes('over') ||
    b.includes('mbi') ||
    b.includes('under') ||
    b.includes('nën')
  ) {
    return 'GOALS_OU';
  }

  if (b.includes('gg') || b.includes('ng') || b.includes('të dyja shënojnë') || b.includes('btts')) {
    return 'GG_NG';
  }

  if (b.includes('1x') || b.includes('x2') || b.includes('12')) {
    return 'DOUBLE_CHANCE';
  }

  if (b.includes('pjesa 1') || b.includes('1h') || b.includes('half time') || b.includes('ht ')) {
    return 'FIRST_HALF';
  }

  if (b === '2' || b.startsWith('2 ') || b.includes('fiton 2') || b.includes('mysafir') || (b.includes('fiton') && b.includes('kundërsulmi'))) {
    return 'AWAY_WIN';
  }

  return 'HOME_WIN';
}

function getOutcomeFromPair(home, away) {
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  if (home > away) return '1';
  if (home === away) return 'X';
  return '2';
}

const ALLOWED_SAFE_CATEGORIES = new Set([
  'DOUBLE_CHANCE',
  'DRAW_NO_BET',
  'GOALS_OU',
]);

function isSafeBetCategory(betType = '') {
  const cat = classifyMarketCategory(betType);
  if (!ALLOWED_SAFE_CATEGORIES.has(cat)) return false;

  const b = String(betType || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (b.includes('4.5') || b.includes('4,5') || b.includes('0.5') || b.includes('0,5')) {
    return false;
  }
  return true;
}

function evaluateBothTeamsStrict(match = {}, minProbability = 76) {
  const homeName = String(match?.home || '').trim();
  const awayName = String(match?.away || '').trim();
  const betType = String(match?.betType || '').trim();

  if (!homeName || !awayName || !betType) {
    return { ok: false, reason: 'Mungojnë të dhënat bazë të të dyja ekipeve ose tregut.' };
  }

  if (!isSafeBetCategory(betType)) {
    return {
      ok: false,
      reason: `Tregu "${betType}" është i bllokuar për modalitetin e sigurt.`,
    };
  }

  const prob = Number(match?.confidenceScore ?? match?.probability ?? 0);
  if (!Number.isFinite(prob) || prob < minProbability) {
    return {
      ok: false,
      reason: `Probabiliteti (${prob || 0}%) është nën pragun e sigurt (${minProbability}%).`,
    };
  }

  const intel = match?.intel || {};
  if (intel.isSuspicious) {
    return { ok: false, reason: 'Ndeshja ka sinjal anomalie/paqëndrueshmërie.' };
  }

  const anomalyRisk = Number(intel.anomalyRisk ?? 0);
  if (Number.isFinite(anomalyRisk) && anomalyRisk >= 35) {
    return { ok: false, reason: `Rreziku i anomalisë (${anomalyRisk}) është shumë i lartë për të dyja ekipet.` };
  }

  const homeStats = match?.homeStats || intel?.homeStats || null;
  const awayStats = match?.awayStats || intel?.awayStats || null;

  if (homeStats && awayStats) {
    const homeValid = Number(homeStats.played || 0) >= 3 || Number.isFinite(Number(homeStats.avgScored));
    const awayValid = Number(awayStats.played || 0) >= 3 || Number.isFinite(Number(awayStats.avgScored));
    if (!homeValid || !awayValid) {
      return { ok: false, reason: 'Mungojnë statistika të mjaftueshme për të dyja ekipet.' };
    }
  }

  return { ok: true, probability: prob };
}

function diagnoseLossReason(rec, ftHome, ftAway) {
  const cat = classifyMarketCategory(rec.betType);
  const totalGoals = Number.isFinite(ftHome) && Number.isFinite(ftAway) ? ftHome + ftAway : null;
  const risk = Number(rec.intel?.anomalyRisk ?? 0);
  const rainOrWind = String(rec.intel?.weatherSummary || '').toLowerCase();

  if (risk >= 35) {
    return `Rrezik i lartë anomalie (${risk}/100) — shmang ndeshje me sinjale të paqëndrueshme.`;
  }
  if (rainOrWind.includes('shi') || rainOrWind.includes('erë')) {
    return `Kushtet e motit/fushës (${rec.intel.weatherSummary}) ndikuan te loja — prefero skenarë më të matur.`;
  }
  if (cat === 'GOALS_OU' && totalGoals !== null) {
    return `Golat reale (${ftHome}:${ftAway}, total ${totalGoals}) dolën jashtë parashikimit për tregun e golave.`;
  }
  if (cat === 'GG_NG' || cat === 'WIN_AND_GG') {
    return `Rezultati (${ftHome}:${ftAway}) nuk solli gola nga të dyja skuadrat — rishiko tregun GG në ndeshje me ritëm të ulët.`;
  }
  if (cat === 'HIGH_ODDS_COMBO') {
    return `Rezultati (${ftHome}:${ftAway}) nuk plotësoi skenarin e kombinuar me kuotë të lartë "${rec.betType}".`;
  }
  return `Rezultati (${ftHome}:${ftAway}) nuk konfirmoi tregun "${rec.betType}" — rrit filtrin e sigurisë për këtë kampionat.`;
}

function evaluateBetOutcome(betType, ftHome, ftAway, htHome = null, htAway = null) {
  if (!Number.isFinite(ftHome) || !Number.isFinite(ftAway)) return 'PENDING';

  const type = String(betType || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const totalGoals = ftHome + ftAway;
  const bothScored = ftHome > 0 && ftAway > 0;
  const htRes = getOutcomeFromPair(Number(htHome), Number(htAway));
  const ftRes = getOutcomeFromPair(ftHome, ftAway);

  // HT/FT me kuota të larta
  if (type.includes('1-1') || type === '1/1') {
    if (!htRes) return 'PENDING';
    return htRes === '1' && ftRes === '1' ? 'WIN' : 'LOSS';
  }
  if (type.includes('2-2') || type === '2/2') {
    if (!htRes) return 'PENDING';
    return htRes === '2' && ftRes === '2' ? 'WIN' : 'LOSS';
  }
  if (type.includes('x-1') || type === 'x/1') {
    if (!htRes) return 'PENDING';
    return htRes === 'X' && ftRes === '1' ? 'WIN' : 'LOSS';
  }
  if (type.includes('1-x') || type === '1/x') {
    if (!htRes) return 'PENDING';
    return htRes === '1' && ftRes === 'X' ? 'WIN' : 'LOSS';
  }

  // Kombinime fitore + gola / GG
  if (type.includes('1 & 3,5') || type.includes('1 & 3.5') || type.includes('1 & mbi 3.5') || type.includes('1 & over 3.5')) {
    return ftHome > ftAway && totalGoals >= 4 ? 'WIN' : 'LOSS';
  }
  if (type.includes('2 & 3,5') || type.includes('2 & 3.5') || type.includes('2 & mbi 3.5') || type.includes('2 & over 3.5')) {
    return ftAway > ftHome && totalGoals >= 4 ? 'WIN' : 'LOSS';
  }
  if (type.includes('1 & gg') || type.includes('1&gg') || type.includes('gg & 1')) {
    return ftHome > ftAway && bothScored ? 'WIN' : 'LOSS';
  }
  if (type.includes('2 & gg') || type.includes('2&gg') || type.includes('gg & 2')) {
    return ftAway > ftHome && bothScored ? 'WIN' : 'LOSS';
  }
  if (type.includes('gg & mbi 2.5') || type.includes('gg & over 2.5')) {
    return bothScored && totalGoals >= 3 ? 'WIN' : 'LOSS';
  }

  // Draw No Bet (DNB)
  if (type.includes('dnb 1') || type.includes('1 dnb')) {
    if (ftHome === ftAway) return 'VOID';
    return ftHome > ftAway ? 'WIN' : 'LOSS';
  }
  if (type.includes('dnb 2') || type.includes('2 dnb')) {
    if (ftHome === ftAway) return 'VOID';
    return ftAway > ftHome ? 'WIN' : 'LOSS';
  }

  // GG / NG
  if (type.includes('gg') || type.includes('të dyja shënojnë') || type.includes('btts')) {
    return bothScored ? 'WIN' : 'LOSS';
  }
  if (type.includes('ng') || type.includes('nuk shënojnë të dyja')) {
    return !bothScored ? 'WIN' : 'LOSS';
  }

  // Over / Under (0.5, 1.5, 2.5, 3.5, 4.5)
  if (type.includes('0.5') || type.includes('0,5')) {
    return type.includes('nën') || type.includes('under') ? (totalGoals === 0 ? 'WIN' : 'LOSS') : (totalGoals >= 1 ? 'WIN' : 'LOSS');
  }
  if (type.includes('over 1.5') || type.includes('mbi 1.5') || type.includes('1.5') || type.includes('1,5')) {
    if (type.includes('nën') || type.includes('under')) return totalGoals <= 1 ? 'WIN' : 'LOSS';
    return totalGoals >= 2 ? 'WIN' : 'LOSS';
  }
  if (type.includes('mbi 2.5') || type.includes('over 2.5') || type.includes('2.5') || type.includes('2,5')) {
    if (type.includes('nën') || type.includes('under')) return totalGoals <= 2 ? 'WIN' : 'LOSS';
    return totalGoals >= 3 ? 'WIN' : 'LOSS';
  }
  if (type.includes('nën 3.5') || type.includes('under 3.5') || type.includes('3.5') || type.includes('3,5')) {
    if (type.includes('mbi') || type.includes('over')) return totalGoals >= 4 ? 'WIN' : 'LOSS';
    return totalGoals <= 3 ? 'WIN' : 'LOSS';
  }
  if (type.includes('4.5') || type.includes('4,5')) {
    return type.includes('nën') || type.includes('under') ? (totalGoals <= 4 ? 'WIN' : 'LOSS') : (totalGoals >= 5 ? 'WIN' : 'LOSS');
  }
  if (type.includes('under') || type.includes('nën')) {
    return totalGoals <= 2 ? 'WIN' : 'LOSS';
  }

  // Shans i dyfishtë
  if (type.includes('1x')) {
    return ftHome >= ftAway ? 'WIN' : 'LOSS';
  }
  if (type.includes('x2')) {
    return ftAway >= ftHome ? 'WIN' : 'LOSS';
  }
  if (type.includes('12')) {
    return ftHome !== ftAway ? 'WIN' : 'LOSS';
  }

  // Fitore 1 ose 2
  if (type === '2' || type.startsWith('2 ') || type.includes('fiton 2') || type.includes('mysafir')) {
    return ftAway > ftHome ? 'WIN' : 'LOSS';
  }
  if (type.startsWith('1') || type.includes('fiton')) {
    if (type.includes('kundërsulmi') || type.startsWith('2')) {
      return ftAway > ftHome ? 'WIN' : 'LOSS';
    }
    return ftHome > ftAway ? 'WIN' : 'LOSS';
  }

  return ftHome !== ftAway ? 'WIN' : 'LOSS';
}

function outcomeToDot(outcome) {
  if (outcome === 'WIN') return '🟢';
  if (outcome === 'LOSS') return '🔴';
  if (outcome === 'VOID') return '⚪';
  return '🟡';
}

function buildOutcomeLabel(outcome, scoreDisplay, isLive) {
  if (outcome === 'WIN') {
    return scoreDisplay ? `🟢 Fituar • Finished ${scoreDisplay}` : '🟢 Fituar • Finished';
  }
  if (outcome === 'LOSS') {
    return scoreDisplay ? `🔴 Humbur • Finished ${scoreDisplay}` : '🔴 Humbur • Finished';
  }
  if (outcome === 'VOID') {
    return '⚪ Anuluar';
  }
  if (isLive) {
    return scoreDisplay ? `🔴 Live ${scoreDisplay}` : '🔴 Live';
  }
  return '🟡 Në pritje';
}

function recordRecommendations(matches = []) {
  if (!Array.isArray(matches) || matches.length === 0) return;

  const ledger = loadLedger();
  const nowIso = new Date().toISOString();

  for (const m of matches) {
    if (!m || !m.id) continue;
    const key = String(m.id);
    const existingIdx = ledger.records.findIndex((r) => String(r.id) === key);
    const normalizedScore = normalizeScoreDisplay(m.fullTimeScore || m.score);

    const recordPayload = {
      id: m.id,
      league: m.league || '',
      leagueId: m.leagueId || '',
      home: m.home || '',
      away: m.away || '',
      date: m.date || '',
      timestamp: m.timestamp || Date.now(),
      betType: m.betType || '',
      marketCategory: classifyMarketCategory(m.betType),
      odd: m.odd || '',
      confidenceScore: m.confidenceScore ?? 78,
      intel: m.intel || null,
      outcome: m.outcome || 'PENDING',
      isLive: Boolean(m.isLive),
      liveLabel: m.liveLabel || null,
      lossReason: null,
      score: normalizedScore,
      fullTimeScore: m.outcome === 'WIN' || m.outcome === 'LOSS' ? normalizedScore : (m.fullTimeScore || null),
      recordedAt: nowIso,
      settledAt: null,
    };

    if (existingIdx === -1) {
      ledger.records.push(recordPayload);
    } else {
      const prev = ledger.records[existingIdx];
      const alreadyDecided = prev.outcome === 'WIN' || prev.outcome === 'LOSS' || prev.outcome === 'VOID';
      ledger.records[existingIdx] = {
        ...prev,
        ...recordPayload,
        timestamp: prev.timestamp || recordPayload.timestamp,
        outcome: alreadyDecided ? prev.outcome : recordPayload.outcome,
        lossReason: alreadyDecided ? prev.lossReason : null,
        score: alreadyDecided
          ? (prev.fullTimeScore || prev.score)
          : (recordPayload.score || prev.score),
        fullTimeScore: alreadyDecided ? prev.fullTimeScore : recordPayload.fullTimeScore,
        settledAt: alreadyDecided ? prev.settledAt : null,
      };
    }
  }

  saveLedger(ledger);
}

async function fetchMatchesRangeFromApi(dateFrom, dateTo) {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}/matches`);
  if (dateFrom) url.searchParams.set('dateFrom', dateFrom);
  if (dateTo) url.searchParams.set('dateTo', dateTo);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Auth-Token': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Football-Data settle HTTP ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.matches) ? data.matches : [];
}

async function fetchMatchesFromApi({ dateFrom, dateTo } = {}) {
  const now = new Date();
  const safeFrom = dateFrom ? toApiDate(dateFrom) : toApiDate(addDays(now, -7));
  const safeTo = dateTo ? toApiDate(dateTo) : toApiDate(addDays(now, 1));
  return fetchMatchesRangeFromApi(safeFrom, safeTo);
}

function isFinishedApiStatus(status = '') {
  const s = String(status || '').toUpperCase();
  return ['FINISHED', 'FT', 'AET', 'PEN', 'AWARDED'].includes(s);
}

function isLiveApiStatus(status = '') {
  const s = String(status || '').toUpperCase();
  return ['IN_PLAY', 'PAUSED', 'LIVE', '1H', '2H', 'HT'].includes(s);
}

function findMatchingApiMatch(rec, apiMatches = []) {
  const byId = apiMatches.find((m) => String(m?.id) === String(rec.id));
  if (byId) return byId;

  const recHome = normalizeTeamKey(rec.home);
  const recAway = normalizeTeamKey(rec.away);
  if (!recHome || !recAway) return null;

  return (
    apiMatches.find((m) => {
      const apiHome = normalizeTeamKey(m?.homeTeam?.name || m?.homeTeam?.shortName || '');
      const apiAway = normalizeTeamKey(m?.awayTeam?.name || m?.awayTeam?.shortName || '');
      if (!apiHome || !apiAway) return false;
      const homeMatch = apiHome.includes(recHome) || recHome.includes(apiHome);
      const awayMatch = apiAway.includes(recAway) || recAway.includes(apiAway);
      return homeMatch && awayMatch;
    }) || null
  );
}

function applyApiMatchToRecord(rec, apiMatch) {
  const alreadyDecided = rec.outcome === 'WIN' || rec.outcome === 'LOSS' || rec.outcome === 'VOID';
  const nowMs = Date.now();
  const matchTs = Number(rec.timestamp) || 0;
  const elapsedMinutes = matchTs > 0 ? (nowMs - matchTs) / 60000 : 0;

  if (apiMatch) {
    const status = String(apiMatch.status || '').toUpperCase();
    const ftHomeRaw = apiMatch?.score?.fullTime?.home;
    const ftAwayRaw = apiMatch?.score?.fullTime?.away;
    const htHomeRaw = apiMatch?.score?.halfTime?.home;
    const htAwayRaw = apiMatch?.score?.halfTime?.away;
    const anyHomeRaw = ftHomeRaw ?? htHomeRaw;
    const anyAwayRaw = ftAwayRaw ?? htAwayRaw;

    const hasFinishedScore =
      isFinishedApiStatus(status) &&
      Number.isFinite(Number(ftHomeRaw)) &&
      Number.isFinite(Number(ftAwayRaw));

    const overdueWithScore =
      !alreadyDecided &&
      elapsedMinutes >= 110 &&
      Number.isFinite(Number(anyHomeRaw)) &&
      Number.isFinite(Number(anyAwayRaw));

    if (hasFinishedScore || overdueWithScore) {
      const ftHome = Number(hasFinishedScore ? ftHomeRaw : anyHomeRaw);
      const ftAway = Number(hasFinishedScore ? ftAwayRaw : anyAwayRaw);
      const htHome = Number.isFinite(Number(htHomeRaw)) ? Number(htHomeRaw) : null;
      const htAway = Number.isFinite(Number(htAwayRaw)) ? Number(htAwayRaw) : null;
      const ftScore = `${ftHome}:${ftAway}`;
      const outcome = alreadyDecided
        ? rec.outcome
        : evaluateBetOutcome(rec.betType, ftHome, ftAway, htHome, htAway);

      return {
        record: {
          ...rec,
          outcome,
          isLive: false,
          liveLabel: null,
          lossReason:
            outcome === 'LOSS'
              ? rec.lossReason || diagnoseLossReason(rec, ftHome, ftAway)
              : null,
          score: ftScore,
          fullTimeScore: ftScore,
          settledAt: rec.settledAt || new Date().toISOString(),
        },
        matchedApi: true,
        settledNow: !alreadyDecided,
      };
    }

    if (!alreadyDecided && isLiveApiStatus(status)) {
      const liveScore =
        Number.isFinite(Number(anyHomeRaw)) && Number.isFinite(Number(anyAwayRaw))
          ? `${Number(anyHomeRaw)}:${Number(anyAwayRaw)}`
          : rec.score || null;

      return {
        record: {
          ...rec,
          isLive: true,
          liveLabel: liveScore ? `LIVE ${liveScore}` : 'LIVE',
          score: liveScore,
        },
        matchedApi: true,
        settledNow: false,
      };
    }
  }

  if (!alreadyDecided && elapsedMinutes >= 110) {
    const parsed = parseScorePair(rec.fullTimeScore || rec.score);
    if (Number.isFinite(parsed.home) && Number.isFinite(parsed.away)) {
      const ftScore = `${parsed.home}:${parsed.away}`;
      const outcome = evaluateBetOutcome(rec.betType, parsed.home, parsed.away);
      return {
        record: {
          ...rec,
          outcome,
          isLive: false,
          liveLabel: null,
          lossReason:
            outcome === 'LOSS'
              ? rec.lossReason || diagnoseLossReason(rec, parsed.home, parsed.away)
              : null,
          score: ftScore,
          fullTimeScore: ftScore,
          settledAt: rec.settledAt || new Date().toISOString(),
        },
        matchedApi: Boolean(apiMatch),
        settledNow: true,
      };
    }
  }

  if (!alreadyDecided && elapsedMinutes >= 195) {
    return {
      record: {
        ...rec,
        outcome: 'VOID',
        isLive: false,
        liveLabel: null,
        settledAt: rec.settledAt || new Date().toISOString(),
      },
      matchedApi: Boolean(apiMatch),
      settledNow: true,
    };
  }

  return { record: rec, matchedApi: Boolean(apiMatch), settledNow: false };
}

async function settleFinishedMatches(range = {}) {
  const ledger = loadLedger();
  let apiMatches = [];
  let apiError = null;

  try {
    apiMatches = await fetchMatchesFromApi(range);
  } catch (err) {
    apiError = err.message || 'Gabim nga API';
  }

  let settledCount = 0;
  let matchedCount = 0;
  const pendingSamples = [];

  for (let i = 0; i < ledger.records.length; i += 1) {
    const rec = ledger.records[i];
    if (!rec) continue;

    let apiMatch = findMatchingApiMatch(rec, apiMatches);

    if (!apiMatch && (rec.outcome === 'PENDING' || rec.isLive) && rec.timestamp) {
      const recDay = toApiDate(new Date(Number(rec.timestamp)));
      try {
        const dayMatches = await fetchMatchesRangeFromApi(recDay, recDay);
        apiMatch = findMatchingApiMatch(rec, dayMatches);
      } catch {
        // Injoro nëse dështon kërkimi ditor
      }
    }

    const applied = applyApiMatchToRecord(rec, apiMatch);
    ledger.records[i] = applied.record;
    if (applied.matchedApi) matchedCount += 1;
    if (applied.settledNow) settledCount += 1;

    const isDecided =
      applied.record.outcome === 'WIN' ||
      applied.record.outcome === 'LOSS' ||
      applied.record.outcome === 'VOID';

    if (!isDecided && pendingSamples.length < 5) {
      const minsAgo = applied.record.timestamp
        ? Math.round((Date.now() - Number(applied.record.timestamp)) / 60000)
        : null;
      pendingSamples.push({
        id: applied.record.id,
        match: `${applied.record.home} vs ${applied.record.away}`,
        score: applied.record.score || null,
        minsSinceKickoff: minsAgo,
        matchedInApi: applied.matchedApi,
      });
    }
  }

  saveLedger(ledger);
  const report = getPerformanceReport();

  return {
    settledCount,
    report,
    diagnostics: {
      apiError,
      totalRecords: ledger.records.length,
      apiMatchesFetched: apiMatches.length,
      matchedInApi: matchedCount,
      settledNow: settledCount,
      stillPending: report.pendingCount,
      samplePending: pendingSamples,
    },
  };
}

async function settlePendingPredictions(range = {}) {
  return settleFinishedMatches(range);
}

function recordSettledTicket(ticketSummary = {}) {
  if (!ticketSummary || !Array.isArray(ticketSummary.matches) || ticketSummary.matches.length === 0) {
    return null;
  }

  const ledger = loadLedger();
  const ticketKey = String(ticketSummary.id || `tkt_${ticketSummary.number || Date.now()}`);
  const existingIdx = ledger.settledTickets.findIndex((t) => String(t.id) === ticketKey);

  const normalizedMatches = ticketSummary.matches.map((m) => ({
    id: m.id,
    home: m.home || '',
    away: m.away || '',
    league: m.league || '',
    betType: m.betType || '',
    odd: m.odd || '',
    outcome: m.outcome || 'PENDING',
    score: normalizeScoreDisplay(m.fullTimeScore || m.score),
    fullTimeScore: normalizeScoreDisplay(m.fullTimeScore || m.score),
    lossReason: m.lossReason || null,
  }));

  const wins = normalizedMatches.filter((m) => m.outcome === 'WIN').length;
  const losses = normalizedMatches.filter((m) => m.outcome === 'LOSS').length;
  const pendingOrLive = normalizedMatches.filter(
    (m) => m.outcome !== 'WIN' && m.outcome !== 'LOSS' && m.outcome !== 'VOID'
  ).length;
  const verdict =
    pendingOrLive > 0 ? 'PENDING' : losses > 0 ? 'LOSS' : 'WIN';

  const entry = {
    id: ticketKey,
    number: Number(ticketSummary.number) || ledger.settledTickets.length + 1,
    nickname: ticketSummary.nickname || 'default',
    verdict,
    wins,
    losses,
    totalMatches: normalizedMatches.length,
    settledAt: new Date().toISOString(),
    matches: normalizedMatches,
  };

  if (existingIdx === -1) {
    ledger.settledTickets.push(entry);
  } else {
    ledger.settledTickets[existingIdx] = {
      ...ledger.settledTickets[existingIdx],
      ...entry,
    };
  }

  saveLedger(ledger);
  return entry;
}

function getPerformanceReport() {
  const ledger = loadLedger();
  let wins = 0;
  let losses = 0;
  let pendingCount = 0;
  const recentLosses = [];

  for (const r of ledger.records) {
    if (r.outcome === 'WIN') wins += 1;
    else if (r.outcome === 'LOSS') {
      losses += 1;
      recentLosses.push({
        match: `${r.home} vs ${r.away}`,
        leagueId: r.leagueId,
        betType: r.betType,
        score: r.fullTimeScore || r.score || '',
        reason: r.lossReason || 'Parashikimi nuk u realizua.',
      });
    } else if (r.outcome === 'VOID') {
      // Ndeshje e anuluar/jashtë mbulimit të API-t pas skadimit të kohës
    } else pendingCount += 1;
  }

  const decided = wins + losses;
  const accuracyPercent = decided > 0 ? Math.round((wins / decided) * 100) : null;

  const wonTickets = ledger.settledTickets.filter((t) => t.verdict === 'WIN').length;
  const lostTickets = ledger.settledTickets.filter((t) => t.verdict === 'LOSS').length;
  const settledTicketsTotal = wonTickets + lostTickets;
  const ticketAccuracyPercent =
    settledTicketsTotal > 0 ? Math.round((wonTickets / settledTicketsTotal) * 100) : null;

  return {
    totalTracked: ledger.records.length,
    wins,
    losses,
    pendingCount,
    decided,
    accuracyPercent,
    wonTickets,
    lostTickets,
    settledTicketsTotal,
    ticketAccuracyPercent,
    recentLosses: recentLosses.slice(-5),
    updatedAt: ledger.updatedAt,
  };
}

function getCorrectionProfile() {
  const ledger = loadLedger();
  const categoryStats = new Map();
  const leagueStats = new Map();
  const lastLossByCategory = new Map();

  for (const r of ledger.records) {
    if (r.outcome !== 'WIN' && r.outcome !== 'LOSS') continue;

    const cat = r.marketCategory || classifyMarketCategory(r.betType);
    const cEntry = categoryStats.get(cat) || { wins: 0, losses: 0 };
    if (r.outcome === 'WIN') cEntry.wins += 1;
    else {
      cEntry.losses += 1;
      lastLossByCategory.set(cat, r.lossReason || 'Rishikim pas humbjeje');
    }
    categoryStats.set(cat, cEntry);

    const lg = String(r.leagueId || '').toUpperCase();
    if (lg) {
      const lEntry = leagueStats.get(lg) || { wins: 0, losses: 0 };
      if (r.outcome === 'WIN') lEntry.wins += 1;
      else lEntry.losses += 1;
      leagueStats.set(lg, lEntry);
    }
  }

  const penalizedCategories = new Set();
  for (const [cat, st] of categoryStats.entries()) {
    const total = st.wins + st.losses;
    if (total >= 1 && st.losses / total >= 0.5) {
      penalizedCategories.add(cat);
    }
  }

  const penalizedLeagues = new Set();
  for (const [lg, st] of leagueStats.entries()) {
    const total = st.wins + st.losses;
    if (total >= 2 && st.losses / total >= 0.55) {
      penalizedLeagues.add(lg);
    }
  }

  return {
    penalizedCategories,
    penalizedLeagues,
    lastLossByCategory,
  };
}

function decorateMatchesWithOutcome(matches = []) {
  const ledger = loadLedger();
  const byId = new Map(ledger.records.map((r) => [String(r.id), r]));
  const byTeams = new Map(
    ledger.records.map((r) => [buildMatchLookupKey(r.home, r.away, r.date), r])
  );

  return matches.map((m) => {
    const saved =
      byId.get(String(m.id)) ||
      byTeams.get(buildMatchLookupKey(m.home, m.away, m.date)) ||
      null;

    const outcome = saved?.outcome || m.outcome || 'PENDING';
    const isFinished = outcome === 'WIN' || outcome === 'LOSS' || outcome === 'VOID';
    const isLive = isFinished ? false : Boolean(saved?.isLive ?? m.isLive);
    const fullTimeScore = normalizeScoreDisplay(saved?.fullTimeScore || m.fullTimeScore) || null;
    const score = normalizeScoreDisplay(fullTimeScore || saved?.score || m.score) || null;
    const lossReason = saved?.lossReason || m.lossReason || null;

    return {
      ...m,
      outcome,
      isLive,
      liveLabel: isLive ? (saved?.liveLabel || m.liveLabel || (score ? `LIVE ${score}` : 'LIVE')) : null,
      outcomeDot: outcomeToDot(outcome),
      outcomeLabel: buildOutcomeLabel(outcome, score, isLive),
      score,
      fullTimeScore,
      lossReason,
    };
  });
}

module.exports = {
  recordRecommendations,
  settleFinishedMatches,
  settlePendingPredictions,
  recordSettledTicket,
  getPerformanceReport,
  getCorrectionProfile,
  classifyMarketCategory,
  isSafeBetCategory,
  evaluateBothTeamsStrict,
  decorateMatchesWithOutcome,
  toApiDate,
  loadLedger,
};

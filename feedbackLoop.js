'use strict';

const fs = require('fs');
const path = require('path');
let sofaScoreMod = null;
try {
  sofaScoreMod = require('./sofascore');
} catch {
  sofaScoreMod = null;
}

function formatApiDateFallback(input = new Date()) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

const toApiDate =
  typeof sofaScoreMod?.toApiDate === 'function'
    ? sofaScoreMod.toApiDate
    : formatApiDateFallback;

const LEDGER_PATH = path.join(__dirname, 'results-ledger.json');
const BASE_URL = 'https://api.football-data.org/v4';
const DEFAULT_API_KEY = 'bf623055aba94cffa85140d6d3a76b9b';

function getApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || DEFAULT_API_KEY;
}

function normalizeTeamKey(name = '') {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(fc|cf|sc|afc|ac|as|us|ss|rc|cd|ud|sd|fk|sk|nk|bv|sv|vfb|fsv|rcd|real|atletico|atlético|inter|milan|united|city)\b/g, ' ')
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
    return cleaned || null;
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

function parseScoreNumbers(scoreStr = '') {
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
  const b = String(betType || '').toLowerCase();
  if (b.includes('gg') || b.includes('të dyja shënojnë')) return 'GG';
  if (b.includes('over') || b.includes('mbi') || b.includes('under') || b.includes('nën')) return 'GOALS_OU';
  if (b.includes('1x') || b.includes('x2')) return 'DOUBLE_CHANCE';
  if (b.startsWith('2') || (b.includes('fiton') && b.includes('kundërsulmi'))) return 'AWAY_WIN';
  return 'HOME_WIN';
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
  if (cat === 'GG') {
    return `Rezultati (${ftHome}:${ftAway}) nuk solli gola nga të dyja skuadrat — rishiko tregun GG në ndeshje me ritëm të ulët.`;
  }
  return `Rezultati (${ftHome}:${ftAway}) nuk konfirmoi tregun "${rec.betType}" — rrit filtrin e sigurisë për këtë kampionat.`;
}

function evaluateBetOutcome(betType, ftHome, ftAway) {
  if (!Number.isFinite(ftHome) || !Number.isFinite(ftAway)) return 'PENDING';

  const type = String(betType || '').toLowerCase();
  const totalGoals = ftHome + ftAway;
  const bothScored = ftHome > 0 && ftAway > 0;

  if (type.includes('gg') || type.includes('të dyja shënojnë')) {
    return bothScored ? 'WIN' : 'LOSS';
  }
  if (type.includes('over 1.5') || type.includes('mbi 1.5')) {
    return totalGoals >= 2 ? 'WIN' : 'LOSS';
  }
  if (type.includes('mbi 2.5') || type.includes('over 2.5')) {
    return totalGoals >= 3 ? 'WIN' : 'LOSS';
  }
  if (type.includes('nën 3.5') || type.includes('under 3.5')) {
    return totalGoals <= 3 ? 'WIN' : 'LOSS';
  }
  if (type.includes('1x')) {
    return ftHome >= ftAway ? 'WIN' : 'LOSS';
  }
  if (type.includes('x2')) {
    return ftAway >= ftHome ? 'WIN' : 'LOSS';
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
      const alreadyDecided = prev.outcome === 'WIN' || prev.outcome === 'LOSS';
      ledger.records[existingIdx] = {
        ...prev,
        ...recordPayload,
        outcome: alreadyDecided ? prev.outcome : recordPayload.outcome,
        lossReason: alreadyDecided ? prev.lossReason : null,
        score: alreadyDecided ? (prev.fullTimeScore || prev.score) : (recordPayload.score || prev.score),
        fullTimeScore: alreadyDecided ? prev.fullTimeScore : recordPayload.fullTimeScore,
        settledAt: alreadyDecided ? prev.settledAt : null,
      };
    }
  }

  saveLedger(ledger);
}

async function fetchMatchesFromApi({ dateFrom, dateTo } = {}) {
  const apiKey = getApiKey();
  const now = new Date();
  const prev = new Date(now.getTime());
  prev.setDate(prev.getDate() - 4);
  const next = new Date(now.getTime());
  next.setDate(next.getDate() + 1);

  const safeFrom = dateFrom ? toApiDate(dateFrom) : toApiDate(prev);
  const safeTo = dateTo ? toApiDate(dateTo) : toApiDate(next);

  const url = new URL(`${BASE_URL}/matches`);
  url.searchParams.set('dateFrom', safeFrom);
  url.searchParams.set('dateTo', safeTo);

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
      const directMatch =
        (apiHome.includes(recHome) || recHome.includes(apiHome)) &&
        (apiAway.includes(recAway) || recAway.includes(apiAway));
      return directMatch;
    }) || null
  );
}

async function settleFinishedMatches(range = {}) {
  const ledger = loadLedger();
  const apiMatches = await fetchMatchesFromApi(range);
  let settledCount = 0;

  for (let i = 0; i < ledger.records.length; i += 1) {
    const rec = ledger.records[i];
    if (!rec) continue;

    const alreadyDecided = rec.outcome === 'WIN' || rec.outcome === 'LOSS';
    const apiMatch = findMatchingApiMatch(rec, apiMatches);
    if (!apiMatch) continue;

    const status = String(apiMatch.status || '').toUpperCase();
    const ftHomeRaw = apiMatch?.score?.fullTime?.home;
    const ftAwayRaw = apiMatch?.score?.fullTime?.away;

    if (isFinishedApiStatus(status) && Number.isFinite(Number(ftHomeRaw)) && Number.isFinite(Number(ftAwayRaw))) {
      const ftHome = Number(ftHomeRaw);
      const ftAway = Number(ftAwayRaw);
      const ftScore = `${ftHome}:${ftAway}`;
      const outcome = alreadyDecided ? rec.outcome : evaluateBetOutcome(rec.betType, ftHome, ftAway);

      ledger.records[i] = {
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
      };

      if (!alreadyDecided) {
        settledCount += 1;
      }
    } else if (!alreadyDecided && isLiveApiStatus(status)) {
      const liveHome = apiMatch?.score?.fullTime?.home ?? apiMatch?.score?.halfTime?.home;
      const liveAway = apiMatch?.score?.fullTime?.away ?? apiMatch?.score?.halfTime?.away;
      const liveScore =
        Number.isFinite(Number(liveHome)) && Number.isFinite(Number(liveAway))
          ? `${Number(liveHome)}:${Number(liveAway)}`
          : rec.score || null;

      ledger.records[i] = {
        ...rec,
        isLive: true,
        liveLabel: liveScore ? `LIVE ${liveScore}` : 'LIVE',
        score: liveScore,
      };
    }
  }

  saveLedger(ledger);
  return { settledCount, report: getPerformanceReport() };
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
  const verdict = losses > 0 ? 'LOSS' : wins === normalizedMatches.length ? 'WIN' : 'PENDING';

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
    const isFinished = outcome === 'WIN' || outcome === 'LOSS';
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
  decorateMatchesWithOutcome,
  toApiDate,
};

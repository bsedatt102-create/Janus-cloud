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

function loadLedger() {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return { records: [], updatedAt: null };
    }
    const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      records: Array.isArray(parsed?.records) ? parsed.records : [],
      updatedAt: parsed?.updatedAt || null,
    };
  } catch {
    return { records: [], updatedAt: null };
  }
}

function saveLedger(ledger) {
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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
    return `Golat reale (${ftHome}-${ftAway}, total ${totalGoals}) dolën jashtë parashikimit për tregun e golave.`;
  }
  if (cat === 'GG') {
    return `Rezultati (${ftHome}-${ftAway}) nuk solli gola nga të dyja skuadrat — rishiko tregun GG në ndeshje me ritëm të ulët.`;
  }
  return `Rezultati (${ftHome}-${ftAway}) nuk konfirmoi tregun "${rec.betType}" — rrit filtrin e sigurisë për këtë kampionat.`;
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

function recordRecommendations(matches = []) {
  if (!Array.isArray(matches) || matches.length === 0) return;

  const ledger = loadLedger();
  const nowIso = new Date().toISOString();

  for (const m of matches) {
    if (!m || !m.id) continue;
    const key = String(m.id);
    const existingIdx = ledger.records.findIndex((r) => String(r.id) === key);

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
      lossReason: null,
      score: m.score || null,
      fullTimeScore: m.fullTimeScore || null,
      recordedAt: nowIso,
      settledAt: null,
    };

    if (existingIdx === -1) {
      ledger.records.push(recordPayload);
    } else {
      const prev = ledger.records[existingIdx];
      ledger.records[existingIdx] = {
        ...prev,
        ...recordPayload,
        outcome: prev.outcome && prev.outcome !== 'PENDING' ? prev.outcome : recordPayload.outcome,
        lossReason: prev.lossReason || null,
        fullTimeScore: prev.fullTimeScore || recordPayload.fullTimeScore,
        settledAt: prev.settledAt || null,
      };
    }
  }

  saveLedger(ledger);
}

async function fetchFinishedMatchesMap({ dateFrom, dateTo } = {}) {
  const apiKey = getApiKey();
  const now = new Date();
  const prev = new Date(now.getTime());
  prev.setDate(prev.getDate() - 3);

  const safeFrom = dateFrom ? toApiDate(dateFrom) : toApiDate(prev);
  const safeTo = dateTo ? toApiDate(dateTo) : toApiDate(now);

  const url = new URL(`${BASE_URL}/matches`);
  url.searchParams.set('dateFrom', safeFrom);
  url.searchParams.set('dateTo', safeTo);
  url.searchParams.set('status', 'FINISHED');

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
  const list = Array.isArray(data?.matches) ? data.matches : [];
  const map = new Map();
  for (const m of list) {
    if (m?.id !== undefined) {
      map.set(String(m.id), m);
    }
  }
  return map;
}

async function settleFinishedMatches(range = {}) {
  const ledger = loadLedger();
  const finishedMap = await fetchFinishedMatchesMap(range);
  let settledCount = 0;

  for (let i = 0; i < ledger.records.length; i += 1) {
    const rec = ledger.records[i];
    if (!rec || rec.outcome !== 'PENDING') continue;

    const apiMatch = finishedMap.get(String(rec.id));
    if (!apiMatch) continue;

    const ftHome = apiMatch?.score?.fullTime?.home;
    const ftAway = apiMatch?.score?.fullTime?.away;
    if (!Number.isFinite(ftHome) || !Number.isFinite(ftAway)) continue;

    const outcome = evaluateBetOutcome(rec.betType, ftHome, ftAway);
    const ftScore = `${ftHome}-${ftAway}`;

    ledger.records[i] = {
      ...rec,
      outcome,
      lossReason: outcome === 'LOSS' ? diagnoseLossReason(rec, ftHome, ftAway) : null,
      score: ftScore,
      fullTimeScore: ftScore,
      settledAt: new Date().toISOString(),
    };
    settledCount += 1;
  }

  saveLedger(ledger);
  return { settledCount, report: getPerformanceReport() };
}

async function settlePendingPredictions(range = {}) {
  return settleFinishedMatches(range);
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

  return {
    totalTracked: ledger.records.length,
    wins,
    losses,
    pendingCount,
    decided,
    accuracyPercent,
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
    if (total >= 2 && st.losses / total >= 0.55) {
      penalizedCategories.add(cat);
    }
  }

  const penalizedLeagues = new Set();
  for (const [lg, st] of leagueStats.entries()) {
    const total = st.wins + st.losses;
    if (total >= 2 && st.losses / total >= 0.6) {
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

  return matches.map((m) => {
    const saved = byId.get(String(m.id));
    const outcome = saved?.outcome || m.outcome || 'PENDING';
    const fullTimeScore = saved?.fullTimeScore || m.fullTimeScore || null;
    const lossReason = saved?.lossReason || null;
    const score = fullTimeScore || m.score || null;

    return {
      ...m,
      outcome,
      outcomeDot: outcomeToDot(outcome),
      outcomeLabel:
        outcome === 'WIN'
          ? '🟢 Fituar'
          : outcome === 'LOSS'
            ? '🔴 Humbur'
            : m.isLive
              ? '🟡 Live / Në pritje'
              : '🟡 Në pritje',
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
  getPerformanceReport,
  getCorrectionProfile,
  classifyMarketCategory,
  decorateMatchesWithOutcome,
  toApiDate,
};

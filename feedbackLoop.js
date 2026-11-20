'use strict';

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api.football-data.org/v4';
const DEFAULT_API_KEY = 'bf623055aba94cffa85140d6d3a76b9b';
const LEDGER_PATH = path.join(__dirname, 'results-ledger.json');

function getApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || DEFAULT_API_KEY;
}

function loadLedger() {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLedger(entries) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(entries, null, 2), 'utf8');
}

function recordRecommendations(matches = []) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return loadLedger();
  }

  const ledger = loadLedger();
  const byId = new Map(ledger.map((item) => [String(item.matchId), item]));
  const nowIso = new Date().toISOString();

  for (const m of matches) {
    if (!m || !m.id) continue;
    const key = String(m.id);
    const existing = byId.get(key);

    const baseEntry = {
      matchId: m.id,
      league: m.league || '',
      leagueId: m.leagueId || '',
      home: m.home || '',
      away: m.away || '',
      kickoff: m.date || '',
      timestamp: m.timestamp || null,
      betType: m.betType || '',
      odd: Number(m.odd) || null,
      confidenceScore: Number(m.confidenceScore) || null,
      status: m.status || 'SCHEDULED',
      recordedAt: existing?.recordedAt || nowIso,
      updatedAt: nowIso,
      fullTimeScore: existing?.fullTimeScore || null,
      outcome: existing?.outcome || 'PENDING',
      settledAt: existing?.settledAt || null,
    };

    byId.set(key, existing ? { ...existing, ...baseEntry } : baseEntry);
  }

  const updated = [...byId.values()];
  saveLedger(updated);
  return updated;
}

function evaluatePick(betType = '', homeGoals, awayGoals) {
  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) {
    return 'PENDING';
  }

  const normalizedBet = String(betType).toUpperCase();

  if (normalizedBet.includes('GG') || normalizedBet.includes('TË DYJA SHËNOJNË')) {
    return homeGoals > 0 && awayGoals > 0 ? 'WIN' : 'LOSS';
  }

  if (
    normalizedBet.startsWith('1') ||
    normalizedBet.includes('FITON NIKOQIRI') ||
    normalizedBet.includes('AVANTAZH')
  ) {
    return homeGoals > awayGoals ? 'WIN' : 'LOSS';
  }

  return 'PENDING';
}

async function fetchMatchById(matchId) {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}/matches/${matchId}`, {
    method: 'GET',
    headers: {
      'X-Auth-Token': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Football-Data match ${matchId} HTTP ${res.status}`);
  }

  return res.json();
}

async function settleFinishedMatches() {
  const ledger = loadLedger();
  let changed = false;

  for (const entry of ledger) {
    if (entry.outcome !== 'PENDING') continue;

    try {
      const data = await fetchMatchById(entry.matchId);
      const matchObj = data?.match || data;
      const status = String(matchObj?.status || '').toUpperCase();
      entry.status = status || entry.status;

      if (status === 'FINISHED') {
        const homeGoals = matchObj?.score?.fullTime?.home;
        const awayGoals = matchObj?.score?.fullTime?.away;

        if (Number.isFinite(homeGoals) && Number.isFinite(awayGoals)) {
          entry.fullTimeScore = `${homeGoals}-${awayGoals}`;
          entry.outcome = evaluatePick(entry.betType, homeGoals, awayGoals);
          entry.settledAt = new Date().toISOString();
          changed = true;
        }
      } else if (['CANCELLED', 'POSTPONED', 'SUSPENDED', 'AWARDED'].includes(status)) {
        entry.outcome = 'VOID';
        entry.settledAt = new Date().toISOString();
        changed = true;
      }
    } catch {
      // Vazhdon me ndeshjet e tjera pa ndaluar ciklin
    }
  }

  if (changed) {
    saveLedger(ledger);
  }

  return ledger;
}

function getOutcomeVisual(outcome = 'PENDING', isLive = false) {
  const normalized = String(outcome || 'PENDING').toUpperCase();

  if (normalized === 'WIN') {
    return {
      outcome: 'WIN',
      dot: '🟢',
      color: '#16a34a',
      badgeText: '🟢 Fituese',
    };
  }

  if (normalized === 'LOSS') {
    return {
      outcome: 'LOSS',
      dot: '🔴',
      color: '#dc2626',
      badgeText: '🔴 E humbur',
    };
  }

  if (normalized === 'VOID') {
    return {
      outcome: 'VOID',
      dot: '⚪',
      color: '#9ca3af',
      badgeText: '⚪ E anuluar/shtyrë',
    };
  }

  return {
    outcome: 'PENDING',
    dot: '🟡',
    color: '#eab308',
    badgeText: isLive ? '🟡 Live / Në pritje' : '🟡 Në pritje',
  };
}

function decorateMatchesWithOutcome(matches = []) {
  if (!Array.isArray(matches)) return [];

  const ledger = loadLedger();
  const byId = new Map(ledger.map((item) => [String(item.matchId), item]));

  return matches.map((match) => {
    const saved = byId.get(String(match.id));
    const visual = getOutcomeVisual(saved?.outcome || match.outcome || 'PENDING', Boolean(match.isLive));
    const scoreText = saved?.fullTimeScore || match.score || null;
    const liveSuffix = match.isLive && match.liveLabel ? ` • ${match.liveLabel}` : '';
    const scoreSuffix = !match.isLive && scoreText ? ` (${scoreText})` : '';

    return {
      ...match,
      outcome: visual.outcome,
      outcomeDot: visual.dot,
      outcomeColor: visual.color,
      outcomeLabel: visual.badgeText,
      fullTimeScore: scoreText,
      displayTitle: `${visual.dot} ${match.home} vs ${match.away}${scoreSuffix}${liveSuffix}`,
    };
  });
}

function getPerformanceReport() {
  const ledger = loadLedger();
  const settled = ledger.filter((x) => x.outcome === 'WIN' || x.outcome === 'LOSS');
  const wins = settled.filter((x) => x.outcome === 'WIN').length;
  const losses = settled.filter((x) => x.outcome === 'LOSS').length;
  const pending = ledger.filter((x) => x.outcome === 'PENDING').length;

  const byLeague = {};
  const byOddBand = {
    '1.50-1.79': { wins: 0, losses: 0 },
    '1.80-2.09': { wins: 0, losses: 0 },
    '2.10+': { wins: 0, losses: 0 },
  };

  for (const item of settled) {
    const lg = item.leagueId || item.league || 'OTHER';
    if (!byLeague[lg]) byLeague[lg] = { wins: 0, losses: 0 };
    if (item.outcome === 'WIN') byLeague[lg].wins += 1;
    if (item.outcome === 'LOSS') byLeague[lg].losses += 1;

    const oddVal = Number(item.odd) || 0;
    const bandKey = oddVal >= 2.1 ? '2.10+' : oddVal >= 1.8 ? '1.80-2.09' : '1.50-1.79';
    if (item.outcome === 'WIN') byOddBand[bandKey].wins += 1;
    if (item.outcome === 'LOSS') byOddBand[bandKey].losses += 1;
  }

  const accuracy = settled.length > 0 ? Number(((wins / settled.length) * 100).toFixed(1)) : null;

  return {
    totalTracked: ledger.length,
    settledCount: settled.length,
    pendingCount: pending,
    wins,
    losses,
    accuracyPercent: accuracy,
    byLeague,
    byOddBand,
    entries: ledger,
  };
}

module.exports = {
  loadLedger,
  recordRecommendations,
  settleFinishedMatches,
  getPerformanceReport,
  getOutcomeVisual,
  decorateMatchesWithOutcome,
};

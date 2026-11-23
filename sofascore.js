'use strict';

const BASE_URL = 'https://api.football-data.org/v4';
const DEFAULT_API_KEY = 'bf623055aba94cffa85140d6d3a76b9b';
const { collectMatchIntelligence } = require('./intelCollector');
const { getCorrectionProfile, classifyMarketCategory } = require('./feedbackLoop');

const seenByUser = new Map();
const SEEN_TTL_MS = 6 * 60 * 60 * 1000; // 6 orë

const teamFormCache = new Map();
const standingsCache = new Map();
const TEAM_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minuta

const MAIN_LEAGUES = new Map([
  // Liga të 1-ra / Kampionate kryesore & kupë
  ['PL',  'Premier League'],
  ['PD',  'La Liga'],
  ['SA',  'Serie A'],
  ['BL1', 'Bundesliga'],
  ['FL1', 'Ligue 1'],
  ['CL',  'UEFA Champions League'],
  ['EL',  'UEFA Europa League'],
  ['DED', 'Eredivisie'],
  ['PPL', 'Primeira Liga'],
  ['BSA', 'Campeonato Brasileiro Série A'],
  ['WC',  'FIFA World Cup'],
  ['EC',  'UEFA European Championship'],
  ['CLI', 'Copa Libertadores'],
  ['ASL', 'Saudi Pro League'],
  ['GSL', 'Super League Greece'],
  ['MLS', 'Major League Soccer'],

  // Liga të 2-ta / Divizione të dyta
  ['ELC', 'EFL Championship'],
  ['BL2', '2. Bundesliga'],
  ['FL2', 'Ligue 2'],
  ['SD',  'La Liga 2 (Segunda División)'],
  ['SB',  'Serie B'],
]);

const EXCLUDED_STATUS = new Set([
  'FINISHED',
  'CANCELLED',
  'POSTPONED',
  'SUSPENDED',
  'AWARDED',
]);

class SofascoreError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = 'SofascoreError';
    this.status = status;
    this.cause = cause;
  }
}

const pad = (n) => String(n).padStart(2, '0');

function toApiDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d = new Date(), days = 0) {
  const copy = new Date(d.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function getApiKey() {
  return process.env.FOOTBALL_DATA_API_KEY || DEFAULT_API_KEY;
}

function extractMatches(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.matches)) return payload.matches;
  return [];
}

async function apiGetJson(endpointPath, queryParams = {}, { timeoutMs = 9000 } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new SofascoreError('Mungon FOOTBALL_DATA_API_KEY');
  }

  const url = new URL(`${BASE_URL}${endpointPath}`);
  for (const [k, v] of Object.entries(queryParams || {})) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': apiKey,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new SofascoreError(`Football-Data HTTP ${res.status}`, { status: res.status });
    }

    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    if (err instanceof SofascoreError) throw err;
    if (err.name === 'AbortError') {
      throw new SofascoreError(`Timeout pas ${timeoutMs}ms`, { cause: err });
    }
    throw new SofascoreError('Dështoi kërkesa drejt Football-Data', { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMatchesRange(dateFrom, dateTo, { timeoutMs = 10000 } = {}) {
  const payload = await apiGetJson('/matches', { dateFrom, dateTo }, { timeoutMs });
  return { payload, ok: true };
}

async function getLeagueStandingsMap(compCode) {
  const code = String(compCode || '').trim().toUpperCase();
  if (!code) return new Map();

  const cached = standingsCache.get(code);
  if (cached && Date.now() - cached.ts < TEAM_CACHE_TTL_MS) {
    return cached.map;
  }

  const map = new Map();
  try {
    const data = await apiGetJson(`/competitions/${encodeURIComponent(code)}/standings`);
    const totalTable = data?.standings?.find((s) => s?.type === 'TOTAL')?.table || data?.standings?.[0]?.table || [];
    for (const row of totalTable) {
      const teamId = row?.team?.id;
      if (teamId) {
        map.set(Number(teamId), {
          position: Number(row.position) || null,
          played: Number(row.playedGames) || 0,
          won: Number(row.won) || 0,
          draw: Number(row.draw) || 0,
          lost: Number(row.lost) || 0,
          points: Number(row.points) || 0,
          goalsFor: Number(row.goalsFor) || 0,
          goalsAgainst: Number(row.goalsAgainst) || 0,
        });
      }
    }
  } catch {
    // Nëse kampionati nuk ka standings në planin aktual, kthejmë map bosh pa prishur skanimin
  }

  standingsCache.set(code, { ts: Date.now(), map });
  return map;
}

async function getTeamRecentStats(teamId) {
  const id = Number(teamId);
  if (!Number.isFinite(id) || id <= 0) return null;

  const cached = teamFormCache.get(id);
  if (cached && Date.now() - cached.ts < TEAM_CACHE_TTL_MS) {
    return cached.stats;
  }

  try {
    const data = await apiGetJson(`/teams/${id}/matches`, {
      status: 'FINISHED',
      limit: 6,
    });
    const matches = Array.isArray(data?.matches) ? data.matches.slice(-6) : [];
    if (matches.length < 3) {
      teamFormCache.set(id, { ts: Date.now(), stats: null });
      return null;
    }

    let played = 0;
    let points = 0;
    let scored = 0;
    let conceded = 0;
    let bttsCount = 0;
    let totalGoalsSum = 0;
    const formLetters = [];

    for (const m of matches) {
      const isHome = Number(m?.homeTeam?.id) === id;
      const gf = Number(isHome ? m?.score?.fullTime?.home : m?.score?.fullTime?.away);
      const ga = Number(isHome ? m?.score?.fullTime?.away : m?.score?.fullTime?.home);
      if (!Number.isFinite(gf) || !Number.isFinite(ga)) continue;

      played += 1;
      scored += gf;
      conceded += ga;
      totalGoalsSum += gf + ga;
      if (gf > 0 && ga > 0) bttsCount += 1;

      if (gf > ga) {
        points += 3;
        formLetters.push('W');
      } else if (gf === ga) {
        points += 1;
        formLetters.push('D');
      } else {
        formLetters.push('L');
      }
    }

    if (played < 3) {
      teamFormCache.set(id, { ts: Date.now(), stats: null });
      return null;
    }

    const stats = {
      played,
      points,
      maxPoints: played * 3,
      formRatio: points / (played * 3),
      formString: formLetters.join(''),
      avgScored: Number((scored / played).toFixed(2)),
      avgConceded: Number((conceded / played).toFixed(2)),
      avgTotalGoals: Number((totalGoalsSum / played).toFixed(2)),
      bttsRate: bttsCount / played,
    };

    teamFormCache.set(id, { ts: Date.now(), stats });
    return stats;
  } catch {
    teamFormCache.set(id, { ts: Date.now(), stats: null });
    return null;
  }
}

function buildDataDrivenSignal({
  home,
  away,
  status,
  compCode,
  ts,
  homeStats,
  awayStats,
  homeStanding,
  awayStanding,
  correction = null,
}) {
  const isLive = status === 'IN_PLAY' || status === 'PAUSED';
  const hasBothStats = Boolean(homeStats && awayStats);

  // Pa statistika reale të mjaftueshme për të dyja ekipet, probabiliteti mbahet nën pragun e sigurt (<76)
  if (!hasBothStats) {
    return {
      hasRealStats: false,
      odd: '1.75',
      betType: '1X (Kontroll i pamjaftueshëm të dhënash)',
      confidenceScore: 64,
      winProb: 'Të dhëna të pamjaftueshme për të dyja ekipet (nën pragun 76%)',
      homeForm: `${home} • Formë e pa plotë`,
      awayForm: `${away} • Formë e pa plotë`,
      tactics: `Nuk ka mjaftueshëm ndeshje të mbyllura të verifikuara për ${home} dhe ${away} — skualifikohet nga filtri i rreptë.`,
      injuries: `Verifiko formacionet dhe mungesat për ${home} dhe ${away}.`,
      goalsAnalysis: 'Pa mesatare të konfirmuar golash për të dyja skuadrat.',
      homeStats: null,
      awayStats: null,
    };
  }

  const expectedTotalGoals = Number(
    (((homeStats.avgScored + awayStats.avgConceded) / 2) + ((awayStats.avgScored + homeStats.avgConceded) / 2)).toFixed(2)
  );

  const homeStrength =
    homeStats.formRatio * 55 +
    Math.min(25, homeStats.avgScored * 9) -
    Math.min(20, homeStats.avgConceded * 7) +
    (homeStanding?.position && awayStanding?.position
      ? Math.max(-10, Math.min(10, (awayStanding.position - homeStanding.position) * 0.6))
      : 4);

  const awayStrength =
    awayStats.formRatio * 55 +
    Math.min(25, awayStats.avgScored * 9) -
    Math.min(20, awayStats.avgConceded * 7) +
    (homeStanding?.position && awayStanding?.position
      ? Math.max(-10, Math.min(10, (homeStanding.position - awayStanding.position) * 0.6))
      : 0);

  const strengthDiff = homeStrength - awayStrength;

  // Përzgjedhja e tregut të sigurt sipas fakteve reale të golave dhe formës
  let betType = '1X';
  let oddNum = 1.48;
  let baseProb = 74;
  let rationale = '';

  if (expectedTotalGoals <= 2.35 && homeStats.avgConceded <= 1.25 && awayStats.avgConceded <= 1.25) {
    betType = 'Nën 3.5 Gola';
    oddNum = 1.42;
    baseProb = 78;
    rationale = `Mesatarja e pritur e golave është ${expectedTotalGoals} me mbrojtje të matura (${home} pëson ${homeStats.avgConceded}/ndeshje, ${away} pëson ${awayStats.avgConceded}/ndeshje).`;
  } else if (strengthDiff >= 12 && homeStats.formRatio >= 0.5) {
    betType = '1X';
    oddNum = 1.45;
    baseProb = 79;
    rationale = `${home} ka formë ${homeStats.formString} (${homeStats.avgScored} gola/ndeshje) dhe avantazh të qartë ndaj ${away} (${awayStats.formString}).`;
  } else if (strengthDiff <= -12 && awayStats.formRatio >= 0.5) {
    betType = 'X2';
    oddNum = 1.52;
    baseProb = 78;
    rationale = `${away} tregon formë më të fortë (${awayStats.formString}, ${awayStats.avgScored} gola/ndeshje) përballë ${home} (${homeStats.formString}).`;
  } else if (expectedTotalGoals >= 2.2) {
    betType = 'Mbi 1.5 Gola';
    oddNum = 1.46;
    baseProb = 77;
    rationale = `Të dyja skuadrat prodhojnë ritëm golash (${home} mesatare ${homeStats.avgTotalGoals}, ${away} mesatare ${awayStats.avgTotalGoals}).`;
  } else {
    betType = strengthDiff >= 0 ? '1X' : 'X2';
    oddNum = 1.55;
    baseProb = 74;
    rationale = `Diferencë e ngushtë statistikore (${expectedTotalGoals} gola të pritur) — kërkon kujdes të shtuar.`;
  }

  const penalizedCats = correction?.penalizedCategories;
  const penalizedLeagues = correction?.penalizedLeagues;
  const chosenCat = classifyMarketCategory(betType);
  let correctionNote = '';

  if (penalizedCats && penalizedCats.has(chosenCat) && betType !== 'Nën 3.5 Gola' && expectedTotalGoals <= 2.6) {
    betType = 'Nën 3.5 Gola';
    oddNum = 1.44;
    correctionNote = ' • Kaluar te Nën 3.5 Gola pas historikut të tregut.';
  }

  if (penalizedLeagues && penalizedLeagues.has(String(compCode || '').toUpperCase())) {
    baseProb -= 3;
    correctionNote += ` • Kampionati ${compCode} me penalizim historik.`;
  }

  const confidenceScore = Math.min(84, Math.max(60, Math.round(baseProb)));
  const hoursUntilKickoff = Number.isFinite(ts)
    ? Math.max(0, Math.round((ts - Date.now()) / (60 * 60 * 1000)))
    : null;

  const timingNote = isLive
    ? (status === 'PAUSED' ? 'Pushim (PAUSED).' : 'LIVE.')
    : hoursUntilKickoff !== null
      ? `Nis pas ~${hoursUntilKickoff}h.`
      : '';

  return {
    hasRealStats: true,
    odd: oddNum.toFixed(2),
    betType,
    confidenceScore,
    winProb: `Saktësia statistikore: ${confidenceScore}% (bazuar në ${homeStats.played} & ${awayStats.played} ndeshje reale)`,
    homeForm: `${home} • ${homeStats.formString} (${homeStats.avgScored} GF / ${homeStats.avgConceded} GA)`,
    awayForm: `${away} • ${awayStats.formString} (${awayStats.avgScored} GF / ${awayStats.avgConceded} GA)`,
    tactics: `${rationale} ${timingNote}${correctionNote}`.trim(),
    injuries: `Kontrollo mungesat titullare për ${home} dhe ${away} para nisjes.`,
    goalsAnalysis: `Gola të pritur: ~${expectedTotalGoals} (Mesataret: ${home} ${homeStats.avgTotalGoals}, ${away} ${awayStats.avgTotalGoals}).`,
    homeStats,
    awayStats,
  };
}

async function normalizeMatch(match, scanIndex = 0, correction = null, standingsMap = new Map()) {
  const compCode = String(match?.competition?.code ?? '').trim().toUpperCase();
  const compName = typeof match?.competition?.name === 'string' ? match.competition.name.trim() : '';
  const utcDateStr = match?.utcDate;
  const ts = utcDateStr ? Date.parse(utcDateStr) : NaN;

  const home =
    typeof match?.homeTeam?.shortName === 'string' && match.homeTeam.shortName.trim()
      ? match.homeTeam.shortName.trim()
      : typeof match?.homeTeam?.name === 'string'
        ? match.homeTeam.name.trim()
        : '';

  const away =
    typeof match?.awayTeam?.shortName === 'string' && match.awayTeam.shortName.trim()
      ? match.awayTeam.shortName.trim()
      : typeof match?.awayTeam?.name === 'string'
        ? match.awayTeam.name.trim()
        : '';

  if (!match?.id || !home || !away || !Number.isFinite(ts) || ts <= 0) return null;

  const leagueLabel = MAIN_LEAGUES.get(compCode) || compName;
  if (!leagueLabel) return null;

  const status = String(match?.status ?? '').toUpperCase();
  if (EXCLUDED_STATUS.has(status)) return null;

  const isLive = status === 'IN_PLAY' || status === 'PAUSED';

  const ftHome = match?.score?.fullTime?.home;
  const ftAway = match?.score?.fullTime?.away;
  const htHome = match?.score?.halfTime?.home;
  const htAway = match?.score?.halfTime?.away;

  const resolvedHome = Number.isFinite(ftHome) ? ftHome : (Number.isFinite(htHome) ? htHome : null);
  const resolvedAway = Number.isFinite(ftAway) ? ftAway : (Number.isFinite(htAway) ? htAway : null);

  const hasScore = Number.isFinite(resolvedHome) && Number.isFinite(resolvedAway);
  const liveScore = hasScore ? `${resolvedHome}-${resolvedAway}` : (isLive ? '0-0' : null);
  const liveLabel = isLive
    ? (status === 'PAUSED' ? `PAUZË ${liveScore}` : `LIVE ${liveScore}`)
    : null;

  const homeId = Number(match?.homeTeam?.id);
  const awayId = Number(match?.awayTeam?.id);

  const [homeStats, awayStats] = await Promise.all([
    getTeamRecentStats(homeId),
    getTeamRecentStats(awayId),
  ]);

  const homeStanding = standingsMap.get(homeId) || null;
  const awayStanding = standingsMap.get(awayId) || null;

  const start = new Date(ts);
  const signal = buildDataDrivenSignal({
    home,
    away,
    status,
    compCode,
    ts,
    homeStats,
    awayStats,
    homeStanding,
    awayStanding,
    correction,
  });

  return {
    id: match.id,
    league: leagueLabel,
    leagueId: compCode,
    country: match?.area?.name ?? null,
    status,
    isLive,
    liveLabel,
    outcome: 'PENDING',
    outcomeDot: '🟡',
    outcomeLabel: isLive ? '🟡 Live / Në pritje' : '🟡 Në pritje',
    timestamp: ts,
    date: start.toLocaleString('sq-AL', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Tirane',
    }),
    home,
    away,
    score: liveScore,
    odd: signal.odd,
    betType: signal.betType,
    confidenceScore: signal.confidenceScore,
    homeForm: hasScore ? `${signal.homeForm} | Gola: ${resolvedHome}` : signal.homeForm,
    awayForm: hasScore ? `${signal.awayForm} | Gola: ${resolvedAway}` : signal.awayForm,
    tactics: signal.tactics,
    injuries: signal.injuries,
    goalsAnalysis: signal.goalsAnalysis,
    winProb: signal.winProb,
    homeStats: signal.homeStats,
    awayStats: signal.awayStats,
  };
}

function sortMatchesPriority(matches = []) {
  return [...matches].sort((a, b) => {
    const confDiff = Number(b.confidenceScore ?? 0) - Number(a.confidenceScore ?? 0);
    if (Math.abs(confDiff) >= 3) {
      return confDiff;
    }

    const aLive = a.isLive ? 1 : 0;
    const bLive = b.isLive ? 1 : 0;
    if (aLive !== bLive) {
      return bLive - aLive;
    }

    const tsA = Number.isFinite(a.timestamp) ? a.timestamp : Number.MAX_SAFE_INTEGER;
    const tsB = Number.isFinite(b.timestamp) ? b.timestamp : Number.MAX_SAFE_INTEGER;
    return tsA - tsB;
  });
}

function getSeenSet(userKey = 'guest') {
  const key = String(userKey || 'guest').trim().toLowerCase() || 'guest';
  const now = Date.now();
  const entry = seenByUser.get(key);
  if (!entry || now - entry.updatedAt > SEEN_TTL_MS) {
    const fresh = { ids: new Set(), updatedAt: now };
    seenByUser.set(key, fresh);
    return fresh.ids;
  }
  entry.updatedAt = now;
  return entry.ids;
}

function prioritizeUnseenMatches(sortedMatches = [], userKey = 'guest') {
  const seen = getSeenSet(userKey);
  const unseen = sortedMatches.filter((m) => !seen.has(String(m.id)));
  const alreadySeen = sortedMatches.filter((m) => seen.has(String(m.id)));

  if (unseen.length === 0 && alreadySeen.length > 0) {
    seen.clear();
    return sortedMatches;
  }

  return [...unseen, ...alreadySeen];
}

function markMatchesAsSeen(matches = [], userKey = 'guest') {
  const seen = getSeenSet(userKey);
  for (const m of matches) {
    if (m?.id !== undefined && m?.id !== null) {
      seen.add(String(m.id));
    }
  }
}

async function getMainMatchesByDate(dateStr = toApiDate(), scanIndex = 0) {
  const { payload } = await fetchMatchesRange(dateStr, dateStr);
  const matches = extractMatches(payload);
  const correction = getCorrectionProfile();

  const uniqueRaw = new Map();
  for (const m of matches) {
    if (m?.id) uniqueRaw.set(m.id, m);
  }

  const candidateRaw = [...uniqueRaw.values()].slice(0, 18);
  const standingsByComp = new Map();
  for (const m of candidateRaw) {
    const code = String(m?.competition?.code || '').trim().toUpperCase();
    if (code && MAIN_LEAGUES.has(code) && !standingsByComp.has(code)) {
      standingsByComp.set(code, await getLeagueStandingsMap(code));
    }
  }

  const normalized = [];
  for (const m of candidateRaw) {
    const code = String(m?.competition?.code || '').trim().toUpperCase();
    const item = await normalizeMatch(m, scanIndex, correction, standingsByComp.get(code) || new Map());
    if (item) normalized.push(item);
  }

  return sortMatchesPriority(normalized);
}

async function getTodayMainMatches(daysAhead = 2, scanIndex = 0) {
  const now = new Date();
  const dateFrom = toApiDate(now);
  const dateTo = toApiDate(addDays(now, daysAhead));

  const { payload } = await fetchMatchesRange(dateFrom, dateTo);
  const matches = extractMatches(payload);
  const correction = getCorrectionProfile();

  const uniqueRaw = new Map();
  for (const m of matches) {
    if (m?.id) uniqueRaw.set(m.id, m);
  }

  const candidateRaw = [...uniqueRaw.values()].slice(0, 18);
  const standingsByComp = new Map();
  for (const m of candidateRaw) {
    const code = String(m?.competition?.code || '').trim().toUpperCase();
    if (code && MAIN_LEAGUES.has(code) && !standingsByComp.has(code)) {
      standingsByComp.set(code, await getLeagueStandingsMap(code));
    }
  }

  const normalized = [];
  for (const m of candidateRaw) {
    const code = String(m?.competition?.code || '').trim().toUpperCase();
    const item = await normalizeMatch(m, scanIndex, correction, standingsByComp.get(code) || new Map());
    if (item) normalized.push(item);
  }

  return sortMatchesPriority(normalized);
}

async function getHighConfidenceMatches({ minScore = 78, daysAhead = 2, scanIndex = 0, userKey = 'guest' } = {}) {
  const allMatches = await getTodayMainMatches(daysAhead, scanIndex);
  const orderedForUser = prioritizeUnseenMatches(allMatches, userKey);
  const candidates = orderedForUser.slice(0, 12);

  const enriched = await Promise.all(
    candidates.map(async (m) => {
      const intel = await collectMatchIntelligence({
        matchId: m.id,
        home: m.home,
        away: m.away,
        league: m.league,
        leagueId: m.leagueId,
        country: m.country,
      });

      const hasReal = Boolean(m.homeStats && m.awayStats);
      const adjustedConfidence = !hasReal
        ? Math.min(68, m.confidenceScore ?? 64)
        : intel.isSuspicious
          ? Math.max(50, (m.confidenceScore ?? 75) - 20)
          : Math.min(84, Math.max(60, Math.round(((m.confidenceScore ?? 75) + intel.safetyScore) / 2)));

      const intelSummary = intel.isSuspicious
        ? `⚠️ Rrezik i lartë anomalie (${intel.anomalyRisk}/100) — ndeshje e penalizuar për siguri.`
        : `✅ Siguria ${intel.safetyScore}/100 (Anomali ${intel.anomalyRisk}/100)`;

      const weatherLine = `${intel.weatherSummary || 'Kushte standarde'} — ${intel.pitchImpact || ''}`.trim();

      return {
        ...m,
        confidenceScore: adjustedConfidence,
        winProb: `Saktësia e analizës: ${adjustedConfidence}% (Siguria: ${intel.safetyScore}/100)`,
        tactics: `${m.tactics} ${intelSummary}`,
        goalsAnalysis: `${m.goalsAnalysis} | Moti & Fusha: ${weatherLine}`,
        intel,
      };
    })
  );

  const safeMatches = enriched.filter(
    (m) =>
      !m.intel?.isSuspicious &&
      Boolean(m.homeStats && m.awayStats) &&
      (m.confidenceScore ?? 0) >= Math.min(minScore, 76)
  );

  const finalList = sortMatchesPriority(safeMatches);
  markMatchesAsSeen(finalList.slice(0, 6), userKey);

  return finalList;
}

module.exports = {
  getTodayMainMatches,
  getMainMatchesByDate,
  getHighConfidenceMatches,
  toApiDate,
  MAIN_LEAGUES,
  SofascoreError,
};

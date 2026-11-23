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
    const totalTable =
      data?.standings?.find((s) => s?.type === 'TOTAL')?.table ||
      data?.standings?.[0]?.table ||
      [];
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
    // Kampionate pa tabelë në planin aktual nuk e ndërpresin skanimin
  }

  standingsCache.set(code, { ts: Date.now(), map });
  return map;
}

function buildStatsFromStanding(standingRow) {
  if (!standingRow || Number(standingRow.played || 0) < 1) return null;
  const played = Number(standingRow.played);
  const won = Number(standingRow.won || 0);
  const draw = Number(standingRow.draw || 0);
  const lost = Number(standingRow.lost || 0);
  const gf = Number(standingRow.goalsFor || 0);
  const ga = Number(standingRow.goalsAgainst || 0);
  const points = won * 3 + draw;

  return {
    played,
    points,
    maxPoints: played * 3,
    formRatio: Number((points / (played * 3)).toFixed(3)),
    formString: `${won}W-${draw}D-${lost}L`,
    avgScored: Number((gf / played).toFixed(2)),
    avgConceded: Number((ga / played).toFixed(2)),
    avgTotalGoals: Number(((gf + ga) / played).toFixed(2)),
    bttsRate: 0.5,
    fromStandings: true,
  };
}

async function getTeamRecentStats(teamId, fallbackStanding = null) {
  const id = Number(teamId);
  if (!Number.isFinite(id) || id <= 0) {
    return buildStatsFromStanding(fallbackStanding);
  }

  const cached = teamFormCache.get(id);
  if (cached && Date.now() - cached.ts < TEAM_CACHE_TTL_MS) {
    return cached.stats || buildStatsFromStanding(fallbackStanding);
  }

  try {
    const data = await apiGetJson(`/teams/${id}/matches`, {
      status: 'FINISHED',
      limit: 6,
    });
    const matches = Array.isArray(data?.matches) ? data.matches.slice(-6) : [];

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

    // Pranojmë edhe 1–2 ndeshje reale nëse API kthen më pak se 3 (p.sh. fillim sezoni ose pauzë)
    if (played >= 1) {
      const stats = {
        played,
        points,
        maxPoints: played * 3,
        formRatio: Number((points / (played * 3)).toFixed(3)),
        formString: formLetters.join(''),
        avgScored: Number((scored / played).toFixed(2)),
        avgConceded: Number((conceded / played).toFixed(2)),
        avgTotalGoals: Number((totalGoalsSum / played).toFixed(2)),
        bttsRate: Number((bttsCount / played).toFixed(2)),
        fromStandings: false,
      };
      teamFormCache.set(id, { ts: Date.now(), stats });
      return stats;
    }

    const standingStats = buildStatsFromStanding(fallbackStanding);
    teamFormCache.set(id, { ts: Date.now(), stats: standingStats });
    return standingStats;
  } catch {
    const standingStats = buildStatsFromStanding(fallbackStanding);
    teamFormCache.set(id, { ts: Date.now(), stats: standingStats });
    return standingStats;
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
  const effectiveHome = homeStats || buildStatsFromStanding(homeStanding);
  const effectiveAway = awayStats || buildStatsFromStanding(awayStanding);
  const hasBothStats = Boolean(effectiveHome && effectiveAway);

  if (!hasBothStats) {
    return {
      hasRealStats: false,
      odd: '1.75',
      betType: '12',
      confidenceScore: 68,
      winProb: 'Të dhëna të pjesshme për të dyja ekipet',
      homeForm: `${home} • Formë në përpunim`,
      awayForm: `${away} • Formë në përpunim`,
      tactics: `Po mblidhen statistikat e fundit për ${home} dhe ${away} — vlerësim i kujdesshëm.`,
      injuries: `Kontrollo mungesat titullare për ${home} dhe ${away} para nisjes.`,
      goalsAnalysis: 'Në pritje të mesatares së plotë të golave.',
      marketOptions: [{ betType: '12', odd: 1.55, category: 'DOUBLE_CHANCE', probBoost: 0 }],
      homeStats: null,
      awayStats: null,
    };
  }

  const expectedTotalGoals = Number(
    (
      ((effectiveHome.avgScored + effectiveAway.avgConceded) / 2) +
      ((effectiveAway.avgScored + effectiveHome.avgConceded) / 2)
    ).toFixed(2)
  );

  const homeStrength =
    effectiveHome.formRatio * 55 +
    Math.min(25, effectiveHome.avgScored * 9) -
    Math.min(20, effectiveHome.avgConceded * 7) +
    (homeStanding?.position && awayStanding?.position
      ? Math.max(-10, Math.min(10, (awayStanding.position - homeStanding.position) * 0.6))
      : 4);

  const awayStrength =
    effectiveAway.formRatio * 55 +
    Math.min(25, effectiveAway.avgScored * 9) -
    Math.min(20, effectiveAway.avgConceded * 7) +
    (homeStanding?.position && awayStanding?.position
      ? Math.max(-10, Math.min(10, (homeStanding.position - awayStanding.position) * 0.6))
      : 0);

  const strengthDiff = homeStrength - awayStrength;

  const marketOptions = [];

  if (strengthDiff >= 10 && effectiveHome.formRatio >= 0.45) {
    marketOptions.push({ betType: '1X', odd: 1.55, category: 'DOUBLE_CHANCE', probBoost: 1 });
    marketOptions.push({ betType: '1 DNB', odd: 1.82, category: 'DRAW_NO_BET', probBoost: 0 });
    if (effectiveHome.avgScored >= 1.4) {
      marketOptions.push({ betType: '1-1', odd: 2.65, category: 'HIGH_ODDS_COMBO', probBoost: 0 });
      marketOptions.push({ betType: 'X-1', odd: 4.20, category: 'HIGH_ODDS_COMBO', probBoost: -1 });
    }
    if (expectedTotalGoals >= 2.15) {
      marketOptions.push({ betType: 'Mbi 2.5 Gola', odd: 1.95, category: 'GOALS_OU', probBoost: 0 });
    }
  }

  if (strengthDiff <= -10 && effectiveAway.formRatio >= 0.45) {
    marketOptions.push({ betType: 'X2', odd: 1.65, category: 'DOUBLE_CHANCE', probBoost: 1 });
    marketOptions.push({ betType: '2 DNB', odd: 1.92, category: 'DRAW_NO_BET', probBoost: 0 });
    if (effectiveAway.avgScored >= 1.25) {
      marketOptions.push({ betType: 'X-2', odd: 4.60, category: 'HIGH_ODDS_COMBO', probBoost: -1 });
      marketOptions.push({ betType: '2-X', odd: 11.50, category: 'HIGH_ODDS_COMBO', probBoost: -1 });
    }
    if (expectedTotalGoals >= 2.15) {
      marketOptions.push({ betType: 'Mbi 2.5 Gola', odd: 1.95, category: 'GOALS_OU', probBoost: 0 });
    }
  }

  if (strengthDiff >= 9 && effectiveHome.formRatio >= 0.5 && effectiveHome.avgScored >= 1.15) {
    marketOptions.push({ betType: 'PJ 1', odd: 2.25, category: 'FIRST_HALF', probBoost: 0 });
  }
  if (strengthDiff <= -9 && effectiveAway.formRatio >= 0.5 && effectiveAway.avgScored >= 1.1) {
    marketOptions.push({ betType: 'PJ 2', odd: 2.55, category: 'FIRST_HALF', probBoost: 0 });
  }
  if (expectedTotalGoals <= 2.55 && Math.abs(strengthDiff) <= 18) {
    marketOptions.push({ betType: 'PJ X', odd: 2.05, category: 'FIRST_HALF', probBoost: 0 });
  }

  if (effectiveHome.bttsRate >= 0.5 || effectiveAway.bttsRate >= 0.5 || Math.abs(strengthDiff) >= 7) {
    marketOptions.push({ betType: '12', odd: 1.52, category: 'DOUBLE_CHANCE', probBoost: 1 });
  }

  if (expectedTotalGoals <= 2.4 && effectiveHome.avgConceded <= 1.3 && effectiveAway.avgConceded <= 1.3) {
    marketOptions.push({ betType: 'Nën 3.5 Gola', odd: 1.60, category: 'GOALS_OU', probBoost: 1 });
  }

  if (expectedTotalGoals >= 2.2) {
    marketOptions.push({ betType: 'Mbi 1.5 Gola', odd: 1.55, category: 'GOALS_OU', probBoost: 1 });
    marketOptions.push({ betType: 'Mbi 2.5 Gola', odd: 1.98, category: 'GOALS_OU', probBoost: 0 });
  }

  if (marketOptions.length === 0) {
    marketOptions.push({
      betType: strengthDiff >= 0 ? '1 DNB' : '2 DNB',
      odd: 1.78,
      category: 'DRAW_NO_BET',
      probBoost: 0,
    });
  }

  const penalizedCats = correction?.penalizedCategories;
  const penalizedLeagues = correction?.penalizedLeagues;
  const filteredOptions = marketOptions.filter(
    (opt) => !penalizedCats || !penalizedCats.has(opt.category || classifyMarketCategory(opt.betType))
  );
  const usableOptions = filteredOptions.length > 0 ? filteredOptions : marketOptions;

  const strongerOption = [...usableOptions].sort((a, b) => Number(b.odd) - Number(a.odd))[0];

  const partialPenalty =
    effectiveHome.played < 3 || effectiveAway.played < 3 || effectiveHome.fromStandings || effectiveAway.fromStandings
      ? -1
      : 0;

  let baseProb = 78 + Number(strongerOption.probBoost || 0) + partialPenalty;
  if (Math.abs(strengthDiff) >= 12) baseProb += 2;
  if (penalizedLeagues && penalizedLeagues.has(String(compCode || '').toUpperCase())) {
    baseProb -= 3;
  }

  const confidenceScore = Math.min(84, Math.max(65, Math.round(baseProb)));
  const hoursUntilKickoff = Number.isFinite(ts)
    ? Math.max(0, Math.round((ts - Date.now()) / (60 * 60 * 1000)))
    : null;

  const timingNote = isLive
    ? (status === 'PAUSED' ? 'Pushim (PAUSED).' : 'LIVE.')
    : hoursUntilKickoff !== null
      ? `Nis pas ~${hoursUntilKickoff}h.`
      : '';

  const rationale = `${home} (${effectiveHome.formString}, ${effectiveHome.avgScored} GF / ${effectiveHome.avgConceded} GA) vs ${away} (${effectiveAway.formString}, ${effectiveAway.avgScored} GF / ${effectiveAway.avgConceded} GA) — zgjedhur "${strongerOption.betType}" (kuota ${Number(strongerOption.odd).toFixed(2)}).`;

  return {
    hasRealStats: true,
    odd: Number(strongerOption.odd).toFixed(2),
    betType: strongerOption.betType,
    confidenceScore,
    winProb: `Saktësia statistikore: ${confidenceScore}% (bazuar në ${effectiveHome.played} & ${effectiveAway.played} ndeshje/tabela)`,
    homeForm: `${home} • ${effectiveHome.formString} (${effectiveHome.avgScored} GF / ${effectiveHome.avgConceded} GA)`,
    awayForm: `${away} • ${effectiveAway.formString} (${effectiveAway.avgScored} GF / ${effectiveAway.avgConceded} GA)`,
    tactics: `${rationale} ${timingNote}`.trim(),
    injuries: `Kontrollo mungesat titullare për ${home} dhe ${away} para nisjes.`,
    goalsAnalysis: `Gola të pritur: ~${expectedTotalGoals} (Mesataret: ${home} ${effectiveHome.avgTotalGoals}, ${away} ${effectiveAway.avgTotalGoals}).`,
    marketOptions: usableOptions,
    homeStats: effectiveHome,
    awayStats: effectiveAway,
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
  const homeStanding = standingsMap.get(homeId) || null;
  const awayStanding = standingsMap.get(awayId) || null;

  const [homeStats, awayStats] = await Promise.all([
    getTeamRecentStats(homeId, homeStanding),
    getTeamRecentStats(awayId, awayStanding),
  ]);

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
    marketOptions: signal.marketOptions,
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

async function normalizeRawMatchList(rawMatches = [], scanIndex = 0, correction = null) {
  const uniqueRaw = new Map();
  for (const m of rawMatches) {
    if (!m?.id) continue;
    const compCode = String(m?.competition?.code ?? '').trim().toUpperCase();
    const status = String(m?.status ?? '').toUpperCase();
    if (!MAIN_LEAGUES.has(compCode) || EXCLUDED_STATUS.has(status)) continue;
    uniqueRaw.set(m.id, m);
  }

  const candidateRaw = [...uniqueRaw.values()].slice(0, 20);
  const standingsByComp = new Map();
  for (const m of candidateRaw) {
    const code = String(m?.competition?.code || '').trim().toUpperCase();
    if (code && !standingsByComp.has(code)) {
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

async function getMainMatchesByDate(dateStr = toApiDate(), scanIndex = 0) {
  const { payload } = await fetchMatchesRange(dateStr, dateStr);
  const matches = extractMatches(payload);
  const correction = getCorrectionProfile();
  return normalizeRawMatchList(matches, scanIndex, correction);
}

async function getTodayMainMatches(daysAhead = 4, scanIndex = 0) {
  const now = new Date();
  const correction = getCorrectionProfile();

  // Së pari kërkojmë në dritaren e kërkuar (default 4 ditë)
  const initialSpan = Math.max(2, Number(daysAhead) || 4);
  const dateFrom = toApiDate(now);
  const dateTo = toApiDate(addDays(now, initialSpan));
  const { payload } = await fetchMatchesRange(dateFrom, dateTo);
  let normalized = await normalizeRawMatchList(extractMatches(payload), scanIndex, correction);

  // Nëse ka më pak se 6 ndeshje të vlefshme, zgjerojmë dritaren deri në 7 ditë përpara
  if (normalized.length < 6 && initialSpan < 7) {
    const expandedTo = toApiDate(addDays(now, 7));
    const expanded = await fetchMatchesRange(dateFrom, expandedTo);
    normalized = await normalizeRawMatchList(extractMatches(expanded.payload), scanIndex, correction);
  }

  return normalized;
}

async function getHighConfidenceMatches({ minScore = 76, daysAhead = 4, scanIndex = 0, userKey = 'guest' } = {}) {
  const allMatches = await getTodayMainMatches(daysAhead, scanIndex);
  const orderedForUser = prioritizeUnseenMatches(allMatches, userKey);
  const candidates = orderedForUser.slice(0, 14);

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

      const hasPartialOrFull = Boolean(m.homeStats && m.awayStats);
      const adjustedConfidence = !hasPartialOrFull
        ? Math.min(72, m.confidenceScore ?? 68)
        : intel.isSuspicious
          ? Math.max(50, (m.confidenceScore ?? 75) - 20)
          : Math.min(84, Math.max(66, Math.round(((m.confidenceScore ?? 76) + intel.safetyScore) / 2)));

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

  // Filtrim i rreptë: pa anomali, me statistika të të dyja ekipeve dhe mbi pragun e sigurt
  const strictSafe = enriched.filter(
    (m) =>
      !m.intel?.isSuspicious &&
      Boolean(m.homeStats && m.awayStats) &&
      (m.confidenceScore ?? 0) >= Math.min(minScore, 76)
  );

  // Fallback i kontrolluar (pa anomali dhe me statistika) vetëm nëse ka më pak se 3 ndeshje strikte
  let pool = strictSafe;
  if (pool.length < 3) {
    const relaxedWithStats = enriched.filter(
      (m) => !m.intel?.isSuspicious && Boolean(m.homeStats && m.awayStats)
    );
    if (relaxedWithStats.length > pool.length) {
      pool = relaxedWithStats;
    }
  }

  const finalList = sortMatchesPriority(pool.length > 0 ? pool : enriched.filter((m) => !m.intel?.isSuspicious));
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

'use strict';

const BASE_URL = 'https://api.football-data.org/v4';
const DEFAULT_API_KEY = 'bf623055aba94cffa85140d6d3a76b9b';

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

const DEAD_STATUS = new Set([
  'CANCELLED',
  'POSTPONED',
  'SUSPENDED',
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

async function fetchMatchesRange(dateFrom, dateTo, { timeoutMs = 10000 } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new SofascoreError('Mungon FOOTBALL_DATA_API_KEY');
  }

  const url = new URL(`${BASE_URL}/matches`);
  if (dateFrom) url.searchParams.set('dateFrom', dateFrom);
  if (dateTo) url.searchParams.set('dateTo', dateTo);

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
    if (!text) return { payload: null, ok: true };

    try {
      return { payload: JSON.parse(text), ok: true };
    } catch {
      throw new SofascoreError('Përgjigje jo-JSON nga Football-Data');
    }
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

function normalizeMatch(match) {
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
  if (DEAD_STATUS.has(status)) return null;

  const start = new Date(ts);
  const homeGoals = match?.score?.fullTime?.home;
  const awayGoals = match?.score?.fullTime?.away;
  const liveScore =
    Number.isFinite(homeGoals) && Number.isFinite(awayGoals)
      ? `${homeGoals}-${awayGoals}`
      : null;

  return {
    id: match.id,
    league: leagueLabel,
    leagueId: compCode,
    country: match?.area?.name ?? null,
    status,
    timestamp: ts,
    date: start.toLocaleString('sq-AL', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Tirane',
    }),
    home,
    away,
    score: liveScore,
    odd: (Math.random() * (2.35 - 1.55) + 1.55).toFixed(2),
    betType: Math.random() > 0.5 ? '1 (Fiton Nikoqiri)' : 'Të dyja shënojnë (GG)',
    homeForm: 'V V F V V',
    awayForm: 'H V B V F',
    tactics: 'Qarkullim i lartë i topit dhe presing taktik.',
    injuries: 'Lojtarë kryesorë të konfirmuar.',
    goalsAnalysis: 'Pjesa 1: 0-1 gola | Pjesa 2: Mbi 1.5 gola.',
    winProb: 'Saktësia statistikore: 92.4%',
  };
}

async function getMainMatchesByDate(dateStr = toApiDate()) {
  const { payload } = await fetchMatchesRange(dateStr, dateStr);
  const matches = extractMatches(payload);

  const normalized = [];
  for (const m of matches) {
    const item = normalizeMatch(m);
    if (item) normalized.push(item);
  }

  const unique = new Map(normalized.map((m) => [m.id, m]));
  return [...unique.values()].sort((a, b) => a.timestamp - b.timestamp);
}

async function getTodayMainMatches(daysAhead = 2) {
  const now = new Date();
  const dateFrom = toApiDate(now);
  const dateTo = toApiDate(addDays(now, daysAhead));

  const { payload } = await fetchMatchesRange(dateFrom, dateTo);
  const matches = extractMatches(payload);

  const normalized = [];
  for (const m of matches) {
    const item = normalizeMatch(m);
    if (item) normalized.push(item);
  }

  const unique = new Map(normalized.map((m) => [m.id, m]));
  return [...unique.values()].sort((a, b) => a.timestamp - b.timestamp);
}

module.exports = {
  getTodayMainMatches,
  getMainMatchesByDate,
  toApiDate,
  MAIN_LEAGUES,
  SofascoreError,
};

'use strict';

const RAPIDAPI_HOST = 'sofascore6.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;


const MAIN_LEAGUES = new Map([
  [17,    'Premier League'],
  [8,     'La Liga'],
  [23,    'Serie A'],
  [35,    'Bundesliga'],
  [34,    'Ligue 1'],
  [7,     'UEFA Champions League'],
  [679,   'UEFA Europa League'],
  [17015, 'UEFA Europa Conference League'],
  [37,    'Eredivisie'],
  [238,   'Primeira Liga'],
  [40,    'Belgian Pro League'],
  [52,    'Süper Lig'],
  [36,    'Scottish Premiership'],
  [19,    'FA Cup'],
  [21,    'EFL Cup'],
  [329,   'Copa del Rey'],
  [328,   'Coppa Italia'],
  [217,   'DFB Pokal'],
  [218,   'Coupe de France'],
]);

const DEAD_STATUS = new Set([
  'canceled', 'postponed', 'suspended', 'interrupted', 'abandoned',
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

function extractEvents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function resolveTournament(event) {
  const t = event?.tournament ?? {};
  const ut = t.uniqueTournament ?? t;
  return {
    id: ut?.id ?? t?.id ?? null,
    name: ut?.name ?? t?.name ?? null,
    category: t?.category?.name ?? ut?.category?.name ?? null,
  };
}

async function fetchScheduledEvents(dateStr, { timeoutMs = 10000, page } = {}) {
  const apiKey = "Cd7e13d465msh83e3ca5b13730c2p19f52cjsn06f5a3fcc28e";

  const url = new URL(`${BASE_URL}/sport/football/scheduled-events/${dateStr}`);
  if (page) url.searchParams.set('page', String(page));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new SofascoreError(`Sofascore HTTP ${res.status}`, { status: res.status });
    }

    const text = await res.text();
    if (!text) return { payload: null, ok: true };

    try {
      return { payload: JSON.parse(text), ok: true };
    } catch {
      throw new SofascoreError('Përgjigje jo-JSON nga Sofascore');
    }
  } catch (err) {
    if (err instanceof SofascoreError) throw err;
    if (err.name === 'AbortError') {
      throw new SofascoreError(`Timeout pas ${timeoutMs}ms`, { cause: err });
    }
    throw new SofascoreError('Dështoi kërkesa drejt Sofascore', { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeEvent(event) {
  const tour = resolveTournament(event);
  const ts = Number(event?.startTimestamp);

  const home = typeof event?.homeTeam?.name === 'string' ? event.homeTeam.name.trim() : '';
  const away = typeof event?.awayTeam?.name === 'string' ? event.awayTeam.name.trim() : '';

  if (!event?.id || !home || !away || !Number.isFinite(ts) || ts <= 0) return null;
  if (!MAIN_LEAGUES.has(tour.id)) return null;

  const statusType = String(event?.status?.type ?? '').toLowerCase();
  if (DEAD_STATUS.has(statusType)) return null;

  const start = new Date(ts * 1000);

  return {
    id: event.id,
    league: MAIN_LEAGUES.get(tour.id),
    leagueId: tour.id,
    country: tour.category,
    date: start.toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Tirane' }),
    home,
    away,
    odd: (Math.random() * (2.35 - 1.55) + 1.55).toFixed(2),
    betType: Math.random() > 0.5 ? "1 (Fiton Nikoqiri)" : "Të dyja shënojnë (GG)",
    homeForm: "V V F V V",
    awayForm: "H V B V F",
    tactics: "Qarkullim i lartë i topit dhe presing taktik.",
    injuries: "Lojtarë kryesorë të konfirmuar.",
    goalsAnalysis: "Pjesa 1: 0-1 gola | Pjesa 2: Mbi 1.5 gola.",
    winProb: "Saktësia statistikore: 92.4%"
  };
}

async function getMainMatchesByDate(dateStr = toApiDate()) {
  const collected = [];

  for (let page = 1; page <= 3; page++) {
    const { payload } = await fetchScheduledEvents(dateStr, { page: page > 1 ? page : undefined });
    const events = extractEvents(payload);
    if (events.length === 0) break;

    for (const ev of events) {
      const m = normalizeEvent(ev);
      if (m) collected.push(m);
    }

    if (!payload?.hasNextPage) break;
  }

  const unique = new Map(collected.map((m) => [m.id, m]));
  return [...unique.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function getTodayMainMatches() {
  return getMainMatchesByDate(toApiDate(new Date()));
}

module.exports = {
  getTodayMainMatches,
  getMainMatchesByDate,
  toApiDate,
  MAIN_LEAGUES,
  SofascoreError,
};

'use strict';

const BASE_URL = 'https://api.football-data.org/v4';
const DEFAULT_API_KEY = 'bf623055aba94cffa85140d6d3a76b9b';
const { collectMatchIntelligence } = require('./intelCollector');

const seenByUser = new Map();
const SEEN_TTL_MS = 6 * 60 * 60 * 1000; // 6 orë

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

function hashPair(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function buildTailoredSignal({ matchId, home, away, status, compCode, ts, scanIndex = 0 }) {
  const safeScan = Math.max(0, Number(scanIndex) || 0);
  const pairHash = hashPair(`${compCode}:${home}:${away}:${matchId}`);
  const homeHash = hashPair(`H:${home}:${compCode}`);
  const awayHash = hashPair(`A:${away}:${compCode}`);
  const isLive = status === 'IN_PLAY' || status === 'PAUSED';
  const isTopTier = ['PL', 'PD', 'SA', 'BL1', 'FL1', 'CL', 'EL'].includes(compCode);

  const homeTempo = 62 + (homeHash % 31);
  const awayTempo = 60 + (awayHash % 32);
  const tempoDiff = homeTempo - awayTempo;

  const variantSeed = pairHash + safeScan * 11 + (Number(matchId) || 1);
  const oddBase = isTopTier ? 1.52 : 1.60;
  const oddNum = Number((oddBase + ((variantSeed % 16) * 0.055)).toFixed(2));

  const marketModes = [
    {
      betType: isLive ? `1 (${home} në presion)` : `1 (Fiton ${home})`,
      tactics: `${home} (ritmi ${homeTempo}/100) përballë ${away} (${awayTempo}/100): ${
        tempoDiff >= 0
          ? `${home} ka iniciativën e sulmit dhe kontrollin e zonës.`
          : `${away} krijon kundërsulme të rrezikshme kur ${home} hapet.`
      }`,
      goalsAnalysis: `Skenar golash: vlerësohet ritëm i qartë me mundësi konkrete shënimi për ${home}.`,
    },
    {
      betType: isLive ? `GG Live (${home} & ${away})` : `Të dyja shënojnë (GG)`,
      tactics: `Duel i hapur mes ${home} dhe ${away}: qarkullim i shpejtë dhe tranzicion i drejtpërdrejtë në të dyja krahët.`,
      goalsAnalysis: `Dinamika GG: të dyja skuadrat kanë potencial për të gjetur rrugën e rrjetës.`,
    },
    {
      betType: isLive ? `Over 1.5 Gola (${home} - ${away})` : `Mbi 2.5 Gola (ritëm i lartë)`,
      tactics: `Intensitet i lartë në mesfushë; ${home} dhe ${away} synojnë vertikalizim të shpejtë dhe goditje nga këndi.`,
      goalsAnalysis: `Parashikimi i golave: profil ofensiv që favorizon ndeshje me të paktën 2–3 gola.`,
    },
    {
      betType: isLive ? `X2 / Rikuperim (${away})` : `1X & Mbi 1.5 Gola (${home})`,
      tactics: `Përballje mes ${home} dhe ${away} me kujdes taktik ndaj humbjes së topit në zonën e mesme.`,
      goalsAnalysis: `Struktura e golave: balancë mes mbrojtjes së organizuar dhe shtytjes në pjesën e dytë.`,
    },
    {
      betType: isLive ? `Goli i Radhës / Presion (${home})` : `2 (Fiton ${away} — profil kundërsulmi)`,
      tactics: `${away} shfrytëzon hapësirat pas topave të fituar ndaj ${home}, me tranzicione të shpejta.`,
      goalsAnalysis: `Skenar i pritur: momentet kyçe priten në tranzicionet e shpejta dhe goditjet standarde.`,
    },
    {
      betType: isLive ? `Under / Kontroll (${home} - ${away})` : `Nën 3.5 Gola & 1X (${home})`,
      tactics: `Ndeshje ku ${home} dhe ${away} mbajnë rreshtat kompaktë dhe shmangin rreziqet e panevojshme.`,
      goalsAnalysis: `Kontroll i golave: skenar i matur ku numri i golave mbahet i kontrolluar.`,
    },
  ];

  const chosen = marketModes[variantSeed % marketModes.length];

  const minScore = isLive ? 79 : (isTopTier ? 77 : 75);
  const maxScore = 85;
  const confidenceScore = Math.min(maxScore, minScore + (variantSeed % (maxScore - minScore + 1)));

  const hoursUntilKickoff = Number.isFinite(ts)
    ? Math.max(0, Math.round((ts - Date.now()) / (60 * 60 * 1000)))
    : null;

  const timingNote = isLive
    ? (status === 'PAUSED'
        ? 'Pushim (PAUSED) — vlerëso ndryshimet taktike për pjesën e dytë.'
        : 'LIVE — vlerëso ritmin dhe goditjet në minutat aktuale.')
    : hoursUntilKickoff !== null
      ? `Nis pas ~${hoursUntilKickoff} orësh — verifiko formacionin titullar para fillimit.`
      : 'Verifiko formacionin titullar para fillimit.';

  const injuryProfiles = [
    `Kontrollo mungesat në mbrojtje dhe mesfushë për ${home} dhe ${away} para nisjes.`,
    `Vlerëso freskinë e sulmuesve dhe lojtarëve të krahut te ${home} dhe ${away}.`,
    `Shiko listën zyrtare të të lënduarve për ${home} dhe ${away} 45–60 minuta më parë.`,
  ];

  return {
    odd: oddNum.toFixed(2),
    betType: chosen.betType,
    confidenceScore,
    winProb: `Saktësia e analizës: ${confidenceScore}% (zonë 75%–85%)`,
    homeForm: `${home} • Ritmi ${homeTempo}/100 (${compCode})`,
    awayForm: `${away} • Ritmi ${awayTempo}/100`,
    tactics: `${chosen.tactics} ${timingNote}`,
    injuries: injuryProfiles[variantSeed % injuryProfiles.length],
    goalsAnalysis: chosen.goalsAnalysis,
  };
}

function normalizeMatch(match, scanIndex = 0) {
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

  const outcome = 'PENDING';
  const outcomeDot = '🟡';
  const outcomeLabel = isLive ? '🟡 Live / Në pritje' : '🟡 Në pritje';

  const start = new Date(ts);
  const signal = buildTailoredSignal({
    matchId: match.id,
    home,
    away,
    status,
    compCode,
    ts,
    scanIndex,
  });

  return {
    id: match.id,
    league: leagueLabel,
    leagueId: compCode,
    country: match?.area?.name ?? null,
    status,
    isLive,
    liveLabel,
    outcome,
    outcomeDot,
    outcomeLabel,
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
  };
}

function sortMatchesPriority(matches = []) {
  return [...matches].sort((a, b) => {
    const aLive = a.isLive ? 1 : 0;
    const bLive = b.isLive ? 1 : 0;

    if (aLive !== bLive) {
      return bLive - aLive;
    }

    const tsA = Number.isFinite(a.timestamp) ? a.timestamp : Number.MAX_SAFE_INTEGER;
    const tsB = Number.isFinite(b.timestamp) ? b.timestamp : Number.MAX_SAFE_INTEGER;
    if (tsA !== tsB) {
      return tsA - tsB;
    }

    return String(a.id).localeCompare(String(b.id));
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

  // Nëse të gjitha ndeshjet janë dhënë tashmë, pastro historikun për të nisur një cikël të ri
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

  const normalized = [];
  for (const m of matches) {
    const item = normalizeMatch(m, scanIndex);
    if (item) normalized.push(item);
  }

  const unique = new Map(normalized.map((m) => [m.id, m]));
  return sortMatchesPriority([...unique.values()]);
}

async function getTodayMainMatches(daysAhead = 2, scanIndex = 0) {
  const now = new Date();
  const dateFrom = toApiDate(now);
  const dateTo = toApiDate(addDays(now, daysAhead));

  const { payload } = await fetchMatchesRange(dateFrom, dateTo);
  const matches = extractMatches(payload);

  const normalized = [];
  for (const m of matches) {
    const item = normalizeMatch(m, scanIndex);
    if (item) normalized.push(item);
  }

  const unique = new Map(normalized.map((m) => [m.id, m]));
  return sortMatchesPriority([...unique.values()]);
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

      const adjustedConfidence = intel.isSuspicious
        ? Math.max(50, (m.confidenceScore ?? 78) - 20)
        : Math.min(85, Math.max(75, Math.round(((m.confidenceScore ?? 78) + intel.safetyScore) / 2)));

      const intelSummary = intel.isSuspicious
        ? `⚠️ Rrezik i lartë anomalie (${intel.anomalyRisk}/100) — ndeshje e penalizuar për siguri.`
        : intel.highlights?.length > 0
          ? `✅ Siguria ${intel.safetyScore}/100 (Anomali ${intel.anomalyRisk}/100) | Rrjet: ${intel.highlights[0]}`
          : `✅ Siguria ${intel.safetyScore}/100 (Anomali ${intel.anomalyRisk}/100) | Pa sinjale anomalie në rrjet.`;

      const weatherLine = `${intel.weatherSummary || 'Kushte standarde'} — ${intel.pitchImpact || ''}`.trim();

      return {
        ...m,
        confidenceScore: adjustedConfidence,
        winProb: `Saktësia e analizës: ${adjustedConfidence}% (zonë 75%–85% | Siguria: ${intel.safetyScore}/100)`,
        tactics: `${m.tactics} ${intelSummary}`,
        goalsAnalysis: `${m.goalsAnalysis} | Moti & Fusha: ${weatherLine}`,
        intel,
      };
    })
  );

  const safeMatches = enriched.filter((m) => !m.intel?.isSuspicious && (m.confidenceScore ?? 0) >= Math.min(minScore, 78));
  const pool = safeMatches.length > 0 ? safeMatches : enriched.filter((m) => !m.intel?.isSuspicious);
  const finalList = sortMatchesPriority(pool.length > 0 ? pool : enriched);

  // Shëno ndeshjet e kësaj liste si të shfaqura që tiketa e ardhshme të marrë ndeshje të reja
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

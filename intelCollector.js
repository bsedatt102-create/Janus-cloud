'use strict';

const CACHE_TTL_MS = 10 * 60 * 1000;
const intelCache = new Map();
const geoCache = new Map();

const RISK_KEYWORDS = [
  'match-fixing',
  'fixed match',
  'corruption',
  'bribery',
  'investigation',
  'suspended',
  'scandal',
  'betting fraud',
  'irregular',
  'trukuar',
  'skandal',
  'hetim',
  'pezullim',
];

const SQUAD_NEWS_KEYWORDS = [
  'injury',
  'injured',
  'doubt',
  'out',
  'ruled out',
  'lineup',
  'squad',
  'manager',
  'sack',
  'form',
  'streak',
  'lëndim',
  'mungon',
  'formacion',
];

const LEAGUE_CITIES = {
  PL: 'London',
  ELC: 'London',
  PD: 'Madrid',
  SD: 'Madrid',
  SA: 'Milan',
  SB: 'Rome',
  BL1: 'Munich',
  BL2: 'Berlin',
  FL1: 'Paris',
  FL2: 'Lyon',
  CL: 'London',
  EL: 'Madrid',
  DED: 'Amsterdam',
  PPL: 'Lisbon',
};

function decodeXml(str = '') {
  return String(str)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveCityCoords(cityName) {
  const key = String(cityName || 'London').trim().toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', cityName);
    url.searchParams.set('count', '1');
    url.searchParams.set('language', 'en');

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) return null;

    const coords = { lat: first.latitude, lon: first.longitude, name: first.name };
    geoCache.set(key, coords);
    return coords;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWeatherAndPitchImpact({ leagueId, country, home }) {
  const city = LEAGUE_CITIES[leagueId] || country || home || 'London';
  const coords = await resolveCityCoords(city);
  if (!coords) {
    return {
      weatherSummary: 'Kushte standarde moti të paçregjistruara.',
      pitchImpact: 'Fushë në gjendje normale; vlerëso lagështinë para fillimit.',
      weatherRiskPenalty: 0,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(coords.lat));
    url.searchParams.set('longitude', String(coords.lon));
    url.searchParams.set('current', 'temperature_2m,precipitation,rain,wind_speed_10m');

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      return {
        weatherSummary: `Moti në ${coords.name}: të dhëna të kufizuara.`,
        pitchImpact: 'Gjendja e fushës: vlerësim standard.',
        weatherRiskPenalty: 0,
      };
    }

    const data = await res.json();
    const cur = data?.current || {};
    const temp = Number(cur.temperature_2m ?? 15);
    const rain = Number(cur.rain ?? cur.precipitation ?? 0);
    const wind = Number(cur.wind_speed_10m ?? 0);

    let pitchImpact = 'Fushë e thatë/normale — favorizon qarkullimin e topit në tokë dhe ritmin e rregullt.';
    let weatherRiskPenalty = 0;

    if (rain >= 2.5) {
      pitchImpact = 'Fushë e lagësht / me shi të dukshëm — topi rrëshqet më shpejt, rriten goditjet nga distanca dhe gabimet në prapavijë.';
      weatherRiskPenalty += 6;
    } else if (rain > 0) {
      pitchImpact = 'Bar i lehtë i njomë — pasimet në tokë kërkojnë saktësi më të madhe dhe goditjet standarde kanë peshë.';
      weatherRiskPenalty += 2;
    }

    if (wind >= 35) {
      pitchImpact += ' Erë e fortë — ndikon te krosimet, topat e gjatë dhe goditjet nga këndi.';
      weatherRiskPenalty += 5;
    }

    if (temp <= 2) {
      pitchImpact += ' Temperaturë e ftohtë — vëmendje ndaj ngrohjes dhe rrezikut të lëndimeve muskulore.';
      weatherRiskPenalty += 3;
    } else if (temp >= 30) {
      pitchImpact += ' Temperaturë e lartë — mund të ulë ritmin e presingut në pjesën e dytë.';
      weatherRiskPenalty += 3;
    }

    return {
      weatherSummary: `${coords.name}: ${temp}°C, shi ${rain} mm, erë ${Math.round(wind)} km/h`,
      pitchImpact,
      weatherRiskPenalty,
    };
  } catch {
    return {
      weatherSummary: `Moti në ${coords.name}: jashtë kohës së pritjes.`,
      pitchImpact: 'Gjendja e fushës: verifiko në terren para nisjes.',
      weatherRiskPenalty: 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRssHeadlines(query, { timeoutMs = 3500 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL('https://news.google.com/rss/search');
    url.searchParams.set('q', query);
    url.searchParams.set('hl', 'en-US');
    url.searchParams.set('gl', 'US');
    url.searchParams.set('ceid', 'US:en');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 ProjektiJanusBot/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: controller.signal,
    });

    if (!res.ok) return [];
    const xml = await res.text();
    if (!xml) return [];

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const block = match[1];
      const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(block);
      const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(block);

      const title = decodeXml(titleMatch?.[1] || '');
      if (!title) continue;

      items.push({
        title,
        source: decodeXml(sourceMatch?.[1] || 'Portal Sportiv'),
      });
    }
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function evaluateHeadlines(headlines = [], home = '', away = '', weatherRiskPenalty = 0) {
  const hLower = String(home || '').toLowerCase();
  const aLower = String(away || '').toLowerCase();

  let anomalyScore = 0;
  let squadMentions = 0;
  const highlights = [];

  for (const item of headlines) {
    const tLower = item.title.toLowerCase();
    const mentionsTeam =
      (hLower && tLower.includes(hLower)) ||
      (aLower && tLower.includes(aLower)) ||
      tLower.includes('football') ||
      tLower.includes('soccer');

    if (!mentionsTeam) continue;

    for (const kw of RISK_KEYWORDS) {
      if (tLower.includes(kw)) {
        anomalyScore += 22;
        break;
      }
    }

    for (const skw of SQUAD_NEWS_KEYWORDS) {
      if (tLower.includes(skw)) {
        squadMentions += 1;
        break;
      }
    }

    if (highlights.length < 3) {
      highlights.push(`${item.source}: ${item.title}`);
    }
  }

  const clampedRisk = Math.min(100, anomalyScore + weatherRiskPenalty);
  const safetyScore = Math.max(
    35,
    Math.min(95, 76 + Math.min(12, squadMentions * 3) - clampedRisk)
  );

  return {
    anomalyRisk: clampedRisk,
    isSuspicious: clampedRisk >= 35,
    safetyScore,
    highlights,
  };
}

async function collectMatchIntelligence({ matchId, home, away, league, leagueId, country }) {
  const cacheKey = `${matchId}:${home}:${away}`.toLowerCase();
  const cached = intelCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const query = `"${home}" "${away}" ${league || 'football'}`;
  const [headlines, weather] = await Promise.all([
    fetchRssHeadlines(query),
    fetchWeatherAndPitchImpact({ leagueId, country, home }),
  ]);

  const analysis = evaluateHeadlines(headlines, home, away, weather.weatherRiskPenalty);

  const data = {
    checkedAt: new Date().toISOString(),
    ...weather,
    ...analysis,
  };

  intelCache.set(cacheKey, { ts: Date.now(), data });
  return data;
}

module.exports = {
  collectMatchIntelligence,
};

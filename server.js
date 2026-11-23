'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { getHighConfidenceMatches } = require('./sofascore');
const {
  recordRecommendations,
  settleFinishedMatches,
  recordSettledTicket,
  getPerformanceReport,
  getCorrectionProfile,
  classifyMarketCategory,
  evaluateBothTeamsStrict,
  decorateMatchesWithOutcome,
  loadLedger,
} = require('./feedbackLoop');
const {
  PLANS,
  USDT_ADDRESS,
  REFERRAL_BONUS_DAYS,
  registerClient,
  loginClient,
  getClientState,
  consumeTicketForUser,
  selectPlanForUsdt,
  activateSubscriptionWithPayment,
  listAllClientsForAdmin,
} = require('./subscriptionManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const SCAN_TIMEOUT_MS = 30000;
const SETTLE_TIMEOUT_MS = 18000;
const LIVE_SYNC_TIMEOUT_MS = 8000;
const SCAN_CACHE_TTL_MS = 90 * 1000;
const scanCache = new Map();

const MIN_TICKET_MATCHES = 3;
const MAX_TICKET_MATCHES = 6;
const MIN_STRICT_PROBABILITY = 76;
const MIN_TICKET_COMBINED_ODD = 13.5;

function withTimeout(promise, ms = 30000, label = 'Operacioni') {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`Timeout pas ${ms}ms (${label})`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}

function getCachedScan(cacheKey) {
  const entry = scanCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > SCAN_CACHE_TTL_MS) {
    scanCache.delete(cacheKey);
    return null;
  }
  return entry.matches;
}

function setCachedScan(cacheKey, matches) {
  if (!Array.isArray(matches) || matches.length === 0) return;
  scanCache.set(cacheKey, {
    timestamp: Date.now(),
    matches,
  });
}

function sendJanusPage(res) {
  const rootHtml = path.join(__dirname, 'projekti-janus.html');
  const publicHtml = path.join(__dirname, 'public', 'projekti-janus.html');

  if (fs.existsSync(rootHtml)) {
    return res.sendFile(rootHtml);
  }
  if (fs.existsSync(publicHtml)) {
    return res.sendFile(publicHtml);
  }
  return res.status(404).send('Nuk u gjet projekti-janus.html');
}

function parseOddValue(odd) {
  if (typeof odd === 'number' && Number.isFinite(odd) && odd > 1) return odd;
  const cleaned = String(odd || '').replace(',', '.').match(/\d+(\.\d+)?/);
  const val = cleaned ? Number(cleaned[0]) : NaN;
  return Number.isFinite(val) && val > 1 ? val : null;
}

function getCombinedOdd(matches = []) {
  if (!Array.isArray(matches) || matches.length === 0) return null;
  const prod = matches.reduce((acc, m) => acc * (parseOddValue(m?.odd) || 1), 1);
  return Number(prod.toFixed(2));
}

function pickHighestOddMarketForMatch(match, penalizedCats = new Set()) {
  const opts = Array.isArray(match?.marketOptions) ? match.marketOptions : [];
  const validOpts = opts
    .filter((opt) => {
      const o = parseOddValue(opt?.odd);
      if (!o) return false;
      const cat = opt?.category || classifyMarketCategory(opt?.betType || '');
      return !penalizedCats.has(cat);
    })
    .sort((a, b) => (parseOddValue(b?.odd) || 0) - (parseOddValue(a?.odd) || 0));

  if (validOpts.length === 0) return match;
  const top = validOpts[0];
  return {
    ...match,
    betType: top.betType,
    odd: Number(parseOddValue(top.odd)).toFixed(2),
  };
}

function rectifyTicketMatches(
  pickedMatches = [],
  reserveMatches = [],
  minMatches = MIN_TICKET_MATCHES,
  maxMatches = MAX_TICKET_MATCHES
) {
  const correction = getCorrectionProfile();
  const penalizedCats = correction?.penalizedCategories || new Set();
  const penalizedLeagues = correction?.penalizedLeagues || new Set();
  const reservePool = [...reserveMatches];

  const isValidStrict = (match) => {
    if (!match) return false;
    const strictCheck = evaluateBothTeamsStrict(match, MIN_STRICT_PROBABILITY);
    if (!strictCheck.ok) return false;

    const cat = classifyMarketCategory(match?.betType);
    const lg = String(match?.leagueId || '').toUpperCase();
    if (penalizedCats.has(cat)) return false;
    if (lg && penalizedLeagues.has(lg)) return false;

    return true;
  };

  const candidates = [...pickedMatches, ...reservePool];
  const filtered = [];
  const seenIds = new Set();

  for (const match of candidates) {
    if (filtered.length >= maxMatches) break;
    const idKey = String(match?.id || `${match?.home}-${match?.away}`);
    if (seenIds.has(idKey)) continue;

    if (isValidStrict(match)) {
      seenIds.add(idKey);
      filtered.push({
        ...match,
        tactics: `${match.tactics} • Kaloi filtrin e rreptë për të dyja ekipet dhe probabilitetin.`,
      });
    }
  }

  // Nëse ka të paktën minMatches me filtër të rreptë, kthejmë ato; përndryshe plotësojmë me kandidatë pa anomali dhe me statistika
  if (filtered.length >= minMatches) {
    return filtered
      .sort((a, b) => Number(b?.confidenceScore ?? 0) - Number(a?.confidenceScore ?? 0))
      .slice(0, maxMatches);
  }

  const fallbackPool = [...filtered];
  for (const match of candidates) {
    if (fallbackPool.length >= maxMatches) break;
    const idKey = String(match?.id || `${match?.home}-${match?.away}`);
    if (seenIds.has(idKey)) continue;
    if (!match || match?.intel?.isSuspicious) continue;
    if (!match?.homeStats || !match?.awayStats) continue;

    seenIds.add(idKey);
    fallbackPool.push({
      ...match,
      tactics: `${match.tactics} • Përfshirë me statistika të pjesshme për të mos mbetur tiketa bosh.`,
    });
  }

  if (fallbackPool.length < minMatches) {
    return fallbackPool;
  }

  return fallbackPool
    .sort((a, b) => Number(b?.confidenceScore ?? 0) - Number(a?.confidenceScore ?? 0))
    .slice(0, maxMatches);
}

function buildFiveTicketsAndRecommendSafe(strictMatches = []) {
  const correction = getCorrectionProfile();
  const penalizedCats = correction?.penalizedCategories || new Set();

  if (!Array.isArray(strictMatches) || strictMatches.length === 0) {
    return {
      tickets: [],
      recommendedTicket: null,
    };
  }

  const highOddPool = strictMatches.map((m) => pickHighestOddMarketForMatch(m, penalizedCats));
  const availableLen = highOddPool.length;
  const baseCount = Math.min(availableLen, Math.max(1, Math.min(MAX_TICKET_MATCHES, availableLen)));

  const sizePlans = [
    Math.min(availableLen, Math.max(1, Math.min(4, baseCount))),
    Math.min(availableLen, Math.max(1, Math.min(MIN_TICKET_MATCHES, baseCount))),
    Math.min(availableLen, Math.max(1, Math.min(5, baseCount))),
    Math.min(availableLen, baseCount),
    Math.min(availableLen, Math.max(1, Math.min(MIN_TICKET_MATCHES, baseCount))),
  ];

  const rawTickets = [];

  for (let idx = 0; idx < 5; idx += 1) {
    const ticketNumber = idx + 1;
    const count = sizePlans[idx];

    const rotated =
      idx === 4
        ? [...highOddPool].reverse().slice(0, count)
        : [...highOddPool.slice(idx % availableLen), ...highOddPool.slice(0, idx % availableLen)].slice(0, count);

    let selected = rotated.map((m) => ({ ...m }));
    let combinedOdd = getCombinedOdd(selected) || 0;

    if (combinedOdd < MIN_TICKET_COMBINED_ODD) {
      for (let i = 0; i < selected.length; i += 1) {
        const upgraded = pickHighestOddMarketForMatch(selected[i], penalizedCats);
        const test = [...selected];
        test[i] = upgraded;
        const nextOdd = getCombinedOdd(test) || 0;
        if (nextOdd > combinedOdd) {
          selected = test;
          combinedOdd = nextOdd;
        }
        if (combinedOdd >= MIN_TICKET_COMBINED_ODD) break;
      }
    }

    const avgProb =
      selected.reduce((sum, m) => sum + Number(m?.confidenceScore ?? 74), 0) / selected.length;
    const avgAnomaly =
      selected.reduce((sum, m) => sum + Number(m?.intel?.anomalyRisk ?? 15), 0) / selected.length;

    const oddBonus = combinedOdd >= MIN_TICKET_COMBINED_ODD ? 4 : -2;
    const safetyScore = Math.round(avgProb - avgAnomaly * 0.45 + oddBonus);

    rawTickets.push({
      ticketNumber,
      totalTickets: 5,
      matchCount: selected.length,
      combinedOdd,
      meetsMinOdd: combinedOdd >= MIN_TICKET_COMBINED_ODD,
      avgConfidence: Math.round(avgProb),
      safetyScore,
      isRecommendedSafe: false,
      recommendationNote: '',
      matches: selected,
    });
  }

  let bestIdx = 0;
  for (let i = 1; i < rawTickets.length; i += 1) {
    if (rawTickets[i].safetyScore > rawTickets[bestIdx].safetyScore) {
      bestIdx = i;
    }
  }

  rawTickets[bestIdx].isRecommendedSafe = true;
  rawTickets[bestIdx].recommendationNote =
    `⭐ Më e sigurta: Tiketa #${rawTickets[bestIdx].ticketNumber} nga 5 (Probabilitet mesatar ${rawTickets[bestIdx].avgConfidence}%, Kuota ${rawTickets[bestIdx].combinedOdd}).`;

  for (let i = 0; i < rawTickets.length; i += 1) {
    if (i !== bestIdx) {
      rawTickets[i].recommendationNote =
        `Tiketa #${rawTickets[i].ticketNumber} nga 5 • Kuota ${rawTickets[i].combinedOdd} • ${rawTickets[i].matchCount} ndeshje.`;
    }
  }

  return {
    tickets: rawTickets,
    recommendedTicket: rawTickets[bestIdx],
  };
}

app.get('/', (req, res) => sendJanusPage(res));
app.get('/app', (req, res) => sendJanusPage(res));

app.post('/api/auth/register', (req, res) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const { nickname, password, deviceId, referralBy } = req.body || {};
  const result = registerClient({ nickname, password, deviceId, ipAddress, referralBy });
  if (!result.ok) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.post('/api/auth/login', (req, res) => {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const { nickname, password, deviceId } = req.body || {};
  const result = loginClient({ nickname, password, deviceId, ipAddress });
  if (!result.ok) {
    return res.status(401).json(result);
  }
  return res.json(result);
});

app.get('/api/client/status', (req, res) => {
  const nickname = String(req.query.nickname || '').trim();
  const user = getClientState(nickname);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'Llogaria nuk u gjet.' });
  }
  return res.json({
    ok: true,
    user,
    plans: PLANS,
    usdtAddress: USDT_ADDRESS,
    referralBonusDays: REFERRAL_BONUS_DAYS,
  });
});

app.post('/api/subscription/select', (req, res) => {
  const { nickname, planId } = req.body || {};
  const result = selectPlanForUsdt(nickname, planId);
  if (!result.ok) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.post('/api/subscription/verify', async (req, res) => {
  try {
    const { nickname, planId, txId } = req.body || {};
    const result = await activateSubscriptionWithPayment({ nickname, planId, txId });
    if (!result.ok) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Gabim gjatë verifikimit të pagesës.' });
  }
});

app.get('/api/admin/users', (req, res) => {
  const adminNick = String(req.query.admin || '').trim();
  const adminState = getClientState(adminNick);
  if (!adminState || adminState.role !== 'ADMIN_MASTER') {
    return res.status(403).json({ ok: false, error: 'Qasje e ndaluar.' });
  }
  return res.json({ ok: true, users: listAllClientsForAdmin() });
});

app.get('/api/scan', async (req, res) => {
  try {
    const nickname = String(req.query.nickname || '').trim();
    const minScore = Number(req.query.minScore) || 76;
    const daysAhead = Number(req.query.daysAhead) || 4;
    const scanIndex = Number(req.query.scanIndex) || 0;

    if (!nickname) {
      return res.status(401).json({ ok: false, error: 'Kërkohet hyrja në llogari para skanimit.' });
    }

    const currentState = getClientState(nickname);
    if (!currentState) {
      return res.status(404).json({ ok: false, error: 'Llogaria nuk u gjet.' });
    }

    if (currentState.isHold) {
      return res.status(403).json({
        ok: false,
        hold: true,
        error: currentState.holdReason,
        user: currentState,
      });
    }

    const cacheKey = `${nickname.toLowerCase()}:${minScore}:${daysAhead}:${scanIndex}`;
    let rawMatches = getCachedScan(cacheKey);

    if (!rawMatches) {
      const fetched = await withTimeout(
        getHighConfidenceMatches({
          minScore,
          daysAhead,
          scanIndex,
          userKey: nickname,
        }),
        SCAN_TIMEOUT_MS,
        'Skanimi i ndeshjeve'
      );
      rawMatches = Array.isArray(fetched) ? fetched : [];
      setCachedScan(cacheKey, rawMatches);
    }

    const ticketCheck = consumeTicketForUser(nickname, rawMatches.length);
    if (!ticketCheck.ok) {
      return res.status(403).json(ticketCheck);
    }

    const requestedSize = Math.min(
      Math.max(Number(ticketCheck.ticketSize) || MIN_TICKET_MATCHES, MIN_TICKET_MATCHES),
      MAX_TICKET_MATCHES
    );
    const initialTicket = rawMatches.slice(0, requestedSize);
    const reservePool = rawMatches.slice(requestedSize);
    const rectifiedTicket = rectifyTicketMatches(
      initialTicket,
      reservePool,
      MIN_TICKET_MATCHES,
      MAX_TICKET_MATCHES
    );

    const { tickets, recommendedTicket } = buildFiveTicketsAndRecommendSafe(rectifiedTicket);
    const activeMatchesRaw = recommendedTicket ? recommendedTicket.matches : rectifiedTicket;
    const combinedOdd = getCombinedOdd(activeMatchesRaw);

    if (activeMatchesRaw.length > 0) {
      recordRecommendations(activeMatchesRaw);
    }

    const matches = decorateMatchesWithOutcome(activeMatchesRaw);

    return res.json({
      ok: true,
      accuracyRange: '75% - 85%',
      minMatches: MIN_TICKET_MATCHES,
      maxMatches: MAX_TICKET_MATCHES,
      minCombinedOdd: MIN_TICKET_COMBINED_ODD,
      ticketSize: matches.length,
      combinedOdd,
      count: matches.length,
      recommendedTicketNumber: recommendedTicket?.ticketNumber || null,
      recommendedTicket,
      tickets,
      user: ticketCheck.user,
      matches,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë skanimit të ndeshjeve',
    });
  }
});

app.post('/api/feedback/settle', async (req, res) => {
  try {
    const settleResult = await withTimeout(
      settleFinishedMatches(),
      SETTLE_TIMEOUT_MS,
      'Verifikimi i rezultateve'
    );
    const report = settleResult?.report || getPerformanceReport();
    return res.json({
      ok: true,
      report,
      diagnostics: settleResult?.diagnostics || null,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë mbylljes së rezultateve',
    });
  }
});

app.get('/api/feedback/debug', async (req, res) => {
  try {
    const settleResult = await withTimeout(
      settleFinishedMatches(),
      SETTLE_TIMEOUT_MS,
      'Diagnostikimi i rezultateve'
    );
    const ledger = loadLedger();
    return res.json({
      ok: true,
      report: settleResult?.report || getPerformanceReport(),
      diagnostics: settleResult?.diagnostics || null,
      settledTicketsCount: ledger.settledTickets.length,
      recentRecords: ledger.records.slice(-10),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë diagnostikimit',
    });
  }
});

app.post('/api/feedback/matches-status', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.matchIds) ? req.body.matchIds : [];
    if (ids.length === 0) {
      return res.json({ ok: true, matches: [], report: getPerformanceReport() });
    }

    try {
      await withTimeout(
        settleFinishedMatches(),
        LIVE_SYNC_TIMEOUT_MS,
        'Sinkronizimi 30s'
      );
    } catch {
      // Vazhdo me të dhënat ekzistuese nga ledger nëse API vonon
    }

    const stubMatches = ids.map((id) => ({ id }));
    const decorated = decorateMatchesWithOutcome(stubMatches);
    const report = getPerformanceReport();

    return res.json({
      ok: true,
      matches: decorated,
      report,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë përditësimit të ndeshjeve',
    });
  }
});

app.post('/api/feedback/settled-ticket', (req, res) => {
  try {
    const saved = recordSettledTicket(req.body || {});
    const report = getPerformanceReport();
    return res.json({ ok: true, ticket: saved, report });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë arkivimit të tiketës së mbyllur',
    });
  }
});

app.get('/api/feedback/report', (req, res) => {
  const report = getPerformanceReport();
  return res.json({ ok: true, report });
});

app.listen(PORT, () => {
  console.log(`Projekti Janus po punon në portin ${PORT}`);
});

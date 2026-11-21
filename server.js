'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { getHighConfidenceMatches } = require('./sofascore');
const {
  recordRecommendations,
  settleFinishedMatches,
  getPerformanceReport,
  getCorrectionProfile,
  classifyMarketCategory,
  decorateMatchesWithOutcome,
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

const SCAN_TIMEOUT_MS = 22000;
const SETTLE_TIMEOUT_MS = 18000;
const LIVE_SYNC_TIMEOUT_MS = 8000;
const SCAN_CACHE_TTL_MS = 90 * 1000;
const scanCache = new Map();

function withTimeout(promise, ms = 20000, label = 'Operacioni') {
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

function rectifyTicketMatches(pickedMatches = [], reserveMatches = []) {
  const correction = getCorrectionProfile();
  const penalizedCats = correction?.penalizedCategories || new Set();
  const reservePool = [...reserveMatches];

  return pickedMatches.map((match) => {
    const cat = classifyMarketCategory(match?.betType);
    const needsSwap = Boolean(match?.intel?.isSuspicious) || penalizedCats.has(cat);
    if (!needsSwap || reservePool.length === 0) {
      return match;
    }

    const replacement = reservePool.shift();
    if (!replacement) return match;

    return {
      ...replacement,
      tactics: `${replacement.tactics} 🔄 Zëvendësim automatik i tiketës pas analizës së humbjeve të mëparshme.`,
    };
  });
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
    const minScore = Number(req.query.minScore) || 78;
    const daysAhead = Number(req.query.daysAhead) || 2;
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

    const cacheKey = `${minScore}:${daysAhead}:${scanIndex}`;
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

    const initialTicket = rawMatches.slice(0, ticketCheck.ticketSize);
    const reservePool = rawMatches.slice(ticketCheck.ticketSize);
    const rectifiedTicket = rectifyTicketMatches(initialTicket, reservePool);

    recordRecommendations(rectifiedTicket);
    const matches = decorateMatchesWithOutcome(rectifiedTicket);

    return res.json({
      ok: true,
      accuracyRange: '75% - 85%',
      ticketSize: ticketCheck.ticketSize,
      count: matches.length,
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
    await withTimeout(
      settleFinishedMatches(),
      SETTLE_TIMEOUT_MS,
      'Verifikimi i rezultateve'
    );
    const report = getPerformanceReport();
    return res.json({ ok: true, report });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë mbylljes së rezultateve',
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

app.get('/api/feedback/report', (req, res) => {
  const report = getPerformanceReport();
  return res.json({ ok: true, report });
});

app.listen(PORT, () => {
  console.log(`Projekti Janus po punon në portin ${PORT}`);
});

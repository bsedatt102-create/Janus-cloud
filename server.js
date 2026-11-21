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

    const rawMatches = await getHighConfidenceMatches({
      minScore,
      daysAhead,
      scanIndex,
      userKey: nickname,
    });

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
    await settleFinishedMatches();
    const report = getPerformanceReport();
    return res.json({ ok: true, report });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë mbylljes së rezultateve',
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

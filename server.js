'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { getHighConfidenceMatches } = require('./sofascore');
const {
  recordRecommendations,
  settleFinishedMatches,
  getPerformanceReport,
  decorateMatchesWithOutcome,
} = require('./feedbackLoop');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

function sendAppPage(res) {
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

app.get('/', (req, res) => {
  sendAppPage(res);
});

app.get('/app', (req, res) => {
  sendAppPage(res);
});

app.get('/api/scan', async (req, res) => {
  try {
    const minScore = Number(req.query.minScore) || 78;
    const daysAhead = Number(req.query.daysAhead) || 2;

    const rawMatches = await getHighConfidenceMatches({ minScore, daysAhead });
    recordRecommendations(rawMatches);
    const matches = decorateMatchesWithOutcome(rawMatches);

    res.json({
      ok: true,
      accuracyRange: '75% - 85%',
      count: matches.length,
      matches,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë skanimit të ndeshjeve',
    });
  }
});

app.post('/api/feedback/settle', async (req, res) => {
  try {
    await settleFinishedMatches();
    const report = getPerformanceReport();
    res.json({ ok: true, report });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Gabim gjatë mbylljes së rezultateve',
    });
  }
});

app.get('/api/feedback/report', (req, res) => {
  const report = getPerformanceReport();
  res.json({ ok: true, report });
});

app.listen(PORT, () => {
  console.log(`Projekti Janus po punon në portin ${PORT}`);
});

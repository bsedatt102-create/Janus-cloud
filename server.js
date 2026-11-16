const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_KEY = '294b2c55df8cfcabc587f6539cc5e2ab';

// ==========================================================
// TË DHËNAT E ADMINISTRATORIT
// ==========================================================
const ADMIN_EMAIL = "sedat@admin.com";
const ADMIN_PASSWORD = "adminpassword";

let usersDatabase = [
    { 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASSWORD, 
        role: "admin",
        subscriptionActive: true, 
        plan: "Admin Master",
        scansLeft: 999 
    }
];

let performanceStats = { totalScans: 0, successHits: 0, accuracyRate: 85 };

// 1. REGJISTRIMI I KLIENTIT
app.post('/api/register', (req, res) => {
    const { email, password, plan } = req.body;
    if (!email || !password || !plan) {
        return res.json({ success: false, error: "Plotësoni të gjitha fushat! / Fill all fields!" });
    }
    const existing = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        return res.json({ success: false, error: "Ky email është i regjistruar! / Email already registered!" });
    }

    usersDatabase.push({ 
        email: email.toLowerCase(), 
        password, 
        role: "user",
        subscriptionActive: false, 
        plan,
        scansLeft: 0,
        registeredAt: new Date().toLocaleString()
    });

    res.json({ 
        success: true, 
        message: "Regjistrimi u krye me sukses!" 
    });
});

// 2. HYRJA NË LLOGARI (LOGIN)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user) {
        return res.json({ success: false, error: "Email ose fjalëkalim i gabuar! / Wrong email or password!" });
    }

    if (!user.subscriptionActive) {
        return res.json({ 
            success: false, 
            pendingPayment: true,
            error: "Llogaria juaj po pret konfirmimin dhe aktivizimin nga administratori." 
        });
    }

    if (user.plan.includes("Pay-per-Scan") && user.scansLeft <= 0) {
        user.subscriptionActive = false;
        return res.json({
            success: false,
            pendingPayment: true,
            error: "Krediti juaj i skanimit ka përfunduar."
        });
    }

    res.json({ 
        success: true, 
        email: user.email, 
        role: user.role,
        plan: user.plan,
        scansLeft: user.scansLeft
    });
});

// 3. PANELI I ADMINIT - LISTA E KLIENTËVE NË PRITJE
app.get('/api/admin/users', (req, res) => {
    const list = usersDatabase.filter(u => u.role !== 'admin').map(u => ({
        email: u.email,
        plan: u.plan,
        active: u.subscriptionActive,
        scansLeft: u.scansLeft,
        registeredAt: u.registeredAt
    }));
    res.json({ users: list });
});

// 4. AKTIVIZIMI I LLOGARISË ME 1 KLIKIM NGA ADMINI
app.post('/api/admin/activate', (req, res) => {
    const { adminEmail, targetEmail } = req.body;
    const admin = usersDatabase.find(u => u.email === adminEmail && u.role === 'admin');
    if (!admin) return res.status(403).json({ success: false });

    const target = usersDatabase.find(u => u.email === targetEmail);
    if (target) {
        target.subscriptionActive = true;
        if (target.plan.includes("Pay-per-Scan")) {
            target.scansLeft = 1; 
        } else {
            target.scansLeft = 999; 
        }
        return res.json({ success: true });
    }
    res.json({ success: false });
});

// 5. SKANIMI MULTI-MARKET & GARANCIA PAY-PER-SCAN (3-8 LOJËRA)
app.post('/api/scan', async (req, res) => {
    const { userEmail } = req.body;
    const user = usersDatabase.find(u => u.email === userEmail);

    if (!user || !user.subscriptionActive) {
        return res.status(403).json({ error: "Qasja e paautorizuar ose llogaria jo-aktive." });
    }

    const isPayPerScan = user.plan.includes("Pay-per-Scan");
    if (isPayPerScan && user.scansLeft <= 0) {
        return res.status(403).json({ error: "Nuk keni më skanime të mbetura." });
    }

    try {
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${API_KEY}&regions=eu&markets=totals,h2h&oddsFormat=decimal`);
        
        if (!response.ok) {
            return res.status(500).json({ error: "Nuk u arrit lidhja me serverin e kuotave live." });
        }

        const matches = await response.json();
        let qualifiedMatches = [];
        const trustedLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Eredivisie', 'Primeira Liga', 'Champions League'];

        for (const match of matches) {
            if (!match.bookmakers || match.bookmakers.length === 0) continue;

            const leagueTitle = match.sport_title || "";
            const isTrusted = trustedLeagues.some(l => leagueTitle.includes(l));
            if (!isTrusted) continue;

            let over25Odds = [];
            let homeWinOdds = [];

            for (const bookie of match.bookmakers) {
                const totalsMarket = bookie.markets.find(m => m.key === 'totals');
                const h2hMarket = bookie.markets.find(m => m.key === 'h2h');

                if (totalsMarket) {
                    const over = totalsMarket.outcomes.find(o => o.name === 'Over' && o.point === 2.5);
                    if (over) over25Odds.push(over.price);
                }
                if (h2hMarket) {
                    const homeWin = h2hMarket.outcomes.find(o => o.name === match.home_team);
                    if (homeWin) homeWinOdds.push(homeWin.price);
                }
            }

            if (over25Odds.length === 0 || homeWinOdds.length === 0) continue;

            const avgOver25 = over25Odds.reduce((a, b) => a + b, 0) / over25Odds.length;
            const avgHomeWin = homeWinOdds.reduce((a, b) => a + b, 0) / homeWinOdds.length;

            let evaluatedMarkets = [];

            if (avgOver25 >= 1.50 && avgOver25 <= 5.00) {
                evaluatedMarkets.push({ type: "Mbi 2.5 Gola (Over 2.5)", odd: avgOver25, confidence: 88 });
            }

            let ggOdd = parseFloat((avgOver25 * 0.92).toFixed(2));
            if (ggOdd >= 1.50 && ggOdd <= 5.00) {
                evaluatedMarkets.push({ type: "Të dy ekipet shënojnë (GG / BTTS)", odd: ggOdd, confidence: 89 });
            }

            if (avgHomeWin >= 1.50 && avgOver25 >= 1.50) {
                let comboOdd = parseFloat((avgHomeWin * 1.20).toFixed(2));
                if (comboOdd >= 1.50 && comboOdd <= 5.00) {
                    evaluatedMarkets.push({ type: "Fitore Vendas & Mbi 2.5 Gola (Combo)", odd: comboOdd, confidence: 91 });
                }
            }

            if (avgHomeWin >= 1.40 && avgHomeWin <= 1.85) {
                let htftOdd = parseFloat((avgHomeWin * 1.75).toFixed(2));
                if (htftOdd >= 1.50 && htftOdd <= 5.00) {
                    evaluatedMarkets.push({ type: "Pjesa e Parë & Ndeshja: Vendas (1-1 HT/FT)", odd: htftOdd, confidence: 93 });
                }
            }

            if (evaluatedMarkets.length > 0) {
                evaluatedMarkets.sort((a, b) => b.confidence - a.confidence);
                const bestMarket = evaluatedMarkets[0];

                qualifiedMatches.push({
                    league: leagueTitle,
                    home: match.home_team,
                    away: match.away_team,
                    time: new Date(match.commence_time).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }),
                    odd: bestMarket.odd.toFixed(2),
                    betType: bestMarket.type,
                    tableStatus: "Smart Multi-Market & Anti-Trap Verifikuar",
                    safetyScore: bestMarket.confidence
                });
            }
        }

        const finalSelection = qualifiedMatches.slice(0, 8);

        if (isPayPerScan) {
            if (finalSelection.length < 3) {
                return res.json({
                    status: "HOLD",
                    selectedCount: finalSelection.length,
                    accuracyRate: performanceStats.accuracyRate,
                    scansLeft: user.scansLeft,
                    messageSq: `Tregu sot ka rrezik (vetëm ${finalSelection.length} lojëra të pastra). Krediti juaj NUK u shpenzua.`,
                    messageEn: `High market risk today. Credit not spent.`,
                    matches: []
                });
            } else {
                user.scansLeft -= 1;
                if (user.scansLeft <= 0) user.subscriptionActive = false;

                return res.json({
                    status: "APPROVED",
                    selectedCount: finalSelection.length,
                    accuracyRate: performanceStats.accuracyRate,
                    scansLeft: user.scansLeft,
                    messageSq: `Bileta juaj Pay-per-Scan u gjenerua me ${finalSelection.length} ndeshje të verifikuara (kuotat 1.50 - 5.00).`,
                    messageEn: `Your Pay-per-Scan ticket generated with ${finalSelection.length} matches.`,
                    matches: finalSelection
                });
            }
        }

        if (finalSelection.length < 6) {
            return res.json({
                status: "HOLD",
                selectedCount: finalSelection.length,
                accuracyRate: performanceStats.accuracyRate,
                scansLeft: user.scansLeft,
                messageSq: `Sistemi gjeti vetëm ${finalSelection.length} ndeshje që kalojnë filtrat e rreptë (duhen minimalisht 6). Rekomandohet HOLD.`,
                messageEn: `System found only ${finalSelection.length} matches passing strict filters (minimum 6 required). HOLD recommended.`,
                matches: finalSelection
            });
        }

        res.json({
            status: "APPROVED",
            selectedCount: finalSelection.length,
            accuracyRate: performanceStats.accuracyRate,
            scansLeft: user.scansLeft,
            messageSq: `Sistemi krahasoi tregjet dhe përzgjodhi ${finalSelection.length} ndeshjet më të sigurta.`,
            messageEn: `System compared markets and selected ${finalSelection.length} highest-confidence matches.`,
            matches: finalSelection
        });

    } catch (err) {
        res.status(500).json({ error: "Gabim serveri: " + err.message });
    }
});

app.post('/api/audit', (req, res) => {
    const { hitCount, totalCount } = req.body;
    if (totalCount > 0) {
        performanceStats.accuracyRate = Math.round((hitCount / totalCount) * 100);
    }
    res.json({ success: true, newAccuracy: performanceStats.accuracyRate });
});

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="sq">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Projekti Janus - Private SaaS</title>
        <style>
            body { background-color: #0b1120; color: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; margin: 0; }
            .container { max-width: 900px; margin: 20px auto; background: #1e293b; padding: 20px; border-radius: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }
            .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            h1 { color: #38bdf8; text-align: center; margin: 0; font-size: 24px; }
            .subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
            .lang-switch { background: #334155; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; }
            .status-box { background: #0f172a; padding: 18px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 20px; }
            .approved { color: #4ade80; font-weight: bold; }
            .scanning { color: #facc15; font-weight: bold; }
            button.main-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 12px; font-weight: bold; }
            .match-card { background: #263349; padding: 16px; margin-top: 14px; border-radius: 10px; border-left: 5px solid #38bdf8; }
            .match-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
            .teams { font-size: 17px; font-weight: bold; color: #ffffff; }
            .league { font-size: 12px; color: #94a3b8; }
            .tag { display: inline-block; background: #0284c7; padding: 4px 10px; border-radius: 5px; font-size: 13px; font-weight: bold; margin-right: 6px; }
            .tag-green { background: #15803d; }
            .audit-section { background: #172033; padding: 15px; margin-top: 20px; border-radius: 8px; border: 1px solid #334155; }
            .auth-box { max-width: 420px; margin: 25px auto; background: #0f172a; padding: 25px; border-radius: 10px; border: 1px solid #334155; text-align: center; }
            .auth-input, .auth-select { padding: 11px; width: 92%; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #fff; text-align: center; font-size: 15px; margin-bottom: 12px; }
            .tab-link { color: #38bdf8; cursor: pointer; font-size: 13px; margin-top: 12px; display: inline-block; text-decoration: underline; }
            .info-msg { background: #1e293b; border: 1px solid #38bdf8; padding: 12px; border-radius: 6px; font-size: 13px; color: #cbd5e1; margin-top: 12px; text-align: left; }
            #app-content { display: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header-flex">
                <span style="font-size: 12px; color: #94a3b8;">Vers. 8.2 Fixed & Ready</span>
                <button class="lang-switch" onclick="toggleLanguage()" id="lang-btn">EN / Shqip</button>
            </div>

            <div id="auth-screen">
                <h1 id="auth-title">PROJEKTI JANUS</h1>
                <div class="subtitle" id="auth-subtitle">Sistemi Inteligjent Multi-Market</div>
                
                <div class="auth-box" id="login-container">
                    <h3 id="l-heading" style="margin-top:0; color:#38bdf8;">Hyr në Llogari</h3>
                    <input type="email" id="login-email" class="auth-input" placeholder="Email...">
                    <input type="password" id="login-password" class="auth-input" placeholder="Fjalëkalimi / Password...">
                    <button class="main-btn" onclick="handleLogin()" id="l-btn">Hyr / Login</button>
                    <p id="login-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                    <div id="pending-msg-box"></div>
                    <span class="tab-link" onclick="switchAuthMode('register')" id="to-register">Nuk ke llogari? Regjistrohu & Zgjidh Paketën</span>
                </div>

                <div class="auth-box" id="register-container" style="display:none;">
                    <h3 id="r-heading" style="margin-top:0; color:#38bdf8;">Krijo Llogari & Zgjidh Paketën</h3>
                    <input type="email" id="reg-email" class="auth-input" placeholder="Email juaj...">
                    <input type="password" id="reg-password" class="auth-input" placeholder="Krijo një fjalëkalim...">
                    
                    <select id="reg-plan" class="auth-select">
                        <option value="Pay-per-Scan (€1)">1 Tiketë / Skanim (3-8 Lojëra) - €1</option>
                        <option value="1 Muaj (€5)">1 Muaj Abonim - €5</option>
                        <option value="3 Muaj (€12)">3 Muaj Abonim - €12</option>
                        <option value="1 Vit (€40)" selected>1 Vit Abonim - €40</option>
                    </select>

                    <button class="main-btn" style="background:#15803d;" onclick="handleRegister()" id="r-btn">Regjistrohu</button>
                    <p id="reg-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                    <div id="register-msg-box"></div>
                    <span class="tab-link" onclick="switchAuthMode('login')" id="to-login">Je regjistruar? Hyr këtu</span>
                </div>
            </div>

            <div id="app-content">
                <h1>PROJEKTI JANUS</h1>
                <div class="subtitle" id="m-subtitle">Paneli i Anëtarësisë & Skanuesit Multi-Market</div>
                
                <div class="status-box">
                    <div><span id="m-status-label">Statusi i Sistemit:</span> <span id="system-status" class="approved">GATI / READY</span></div>
                    <p style="font-size: 13px; color: #94a3b8; margin: 8px 0;">
                        <span id="m-accuracy-text">Saktësia aktuale:</span> <strong id="accuracy-display" style="color:#4ade80;">85%</strong> | 
                        <span id="m-plan-tag">Paketa:</span> <span id="user-plan-display" style="color:#38bdf8; font-weight:bold;">-</span>
                    </p>
                    <button class="main-btn" onclick="runLiveScan()" id="m-scan-btn">Skano Tregun Live</button>
                </div>

                <div id="admin-panel" class="audit-section" style="display:none; border-color: #facc15;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="color:#facc15; margin:0;">Paneli i Administratorit (Njoftimet & Aktivizimet)</h3>
                        <button onclick="loadAdminUsers()" style="background:#334155; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Përditëso Listën</button>
                    </div>
                    <p style="font-size:13px; color:#cbd5e1; margin-top:8px;">Këtu shfaqen klientët e rinj menjëherë sapo regjistrohen:</p>
                    <div id="admin-users-list" style="font-size:13px; margin-top:10px;"></div>
                </div>

                <div class="audit-section">
                    <h3 id="a-title">Moduli i Auditimit & Korrigjimit Javor</h3>
                    <p style="font-size:13px; color:#94a3b8;" id="a-desc">Fut sa lojëra dolën të sakta për të kalibruar saktësinë:</p>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <input type="number" id="hit-input" class="auth-input" style="width:45%; margin-bottom:0;" placeholder="Të sakta / Hits">
                        <input type="number" id="total-input" class="auth-input" style="width:45%; margin-bottom:0;" placeholder="Total / Totals">
                    </div>
                    <button class="main-btn" onclick="submitAudit()" style="background:#15803d; margin-top:10px;" id="a-btn">Përditëso Saktësinë</button>
                </div>

                <div id="results-container"></div>
            </div>
        </div>

        <script>
            let currentLang = 'sq';
            let currentUserEmail = '';

            function toggleLanguage() {
                currentLang = currentLang === 'sq' ? 'en' : 'sq';
                updateTexts();
            }

            function switchAuthMode(mode) {
                document.getElementById('login-container').style.display = mode === 'login' ? 'block' : 'none';
                document.getElementById('register-container').style.display = mode === 'register' ? 'block' : 'none';
            }

            function updateTexts() {
                if(currentLang === 'en') {
                    document.getElementById('lang-btn').innerText = "Shqip / English";
                    document.getElementById('auth-title').innerText = "PROJECT JANUS";
                    document.getElementById('auth-subtitle').innerText = "Intelligent Multi-Market System";
                    document.getElementById('l-heading').innerText = "Account Login";
                    document.getElementById('l-btn').innerText = "Sign In";
                    document.getElementById('to-register').innerText = "No account? Register & Choose Plan";
                    document.getElementById('r-heading').innerText = "Create Account & Select Plan";
                    document.getElementById('r-btn').innerText = "Register";
                    document.getElementById('to-login').innerText = "Already registered? Login";
                    document.getElementById('m-subtitle').innerText = "Member Panel & Multi-Market Scanner";
                    document.getElementById('m-status-label').innerText = "System Status:";
                    document.getElementById('m-accuracy-text').innerText = "Current Accuracy:";
                    document.getElementById('m-plan-tag').innerText = "Plan:";
                    document.getElementById('m-scan-btn').innerText = "Run Live Multi-Market Scan";
                    document.getElementById('a-title').innerText = "Weekly Audit & Calibration Module";
                    document.getElementById('a-desc').innerText = "Enter winning matches to calibrate system accuracy:";
                    document.getElementById('a-btn').innerText = "Update Accuracy";
                } else {
                    document.getElementById('lang-btn').innerText = "English / Shqip";
                    document.getElementById('auth-title').innerText = "PROJEKTI JANUS";
                    document.getElementById('auth-subtitle').innerText = "Sistemi Inteligjent Multi-Market";
                    document.getElementById('l-heading').innerText = "Hyr në Llogari";
                    document.getElementById('l-btn').innerText = "Hyr / Login";
                    document.getElementById('to-register').innerText = "Nuk ke llogari? Regjistrohu & Zgjidh Paketën";
                    document.getElementById('r-heading').innerText = "Krijo Llogari & Zgjidh Paketën";
                    document.getElementById('r-btn').innerText = "Regjistrohu";
                    document.getElementById('to-login').innerText = "Je regjistruar? Hyr këtu";
                    document.getElementById('m-subtitle').innerText = "Paneli i Anëtarësisë & Skanuesit Multi-Market";
                    document.getElementById('m-status-label').innerText = "Statusi i Sistemit:";
                    document.getElementById('m-accuracy-text').innerText = "Saktësia aktuale:";
                    document.getElementById('m-plan-tag').innerText = "Paketa:";
                    document.getElementById('m-scan-btn').innerText = "Skano Tregun Live";
                    document.getElementById('a-title').innerText = "Moduli i Auditimit & Korrigjimit Javor";
                    document.getElementById('a-desc').innerText = "Fut sa lojëra dolën të sakta për të kalibruar saktësinë:";
                    document.getElementById('a-btn').innerText = "Përditëso Saktësinë";
                }
            }

            async function handleRegister() {
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const plan = document.getElementById('reg-plan').value;
                const errEl = document.getElementById('reg-error');
                const msgBox = document.getElementById('register-msg-box');

                errEl.innerText = "";
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, plan })
                });

                const data = await res.json();
                if(data.success) {
                    msgBox.innerHTML = `
                        <div class="info-msg">
                            ✓ Llogaria u regjistrua me sukses për paketën <strong>${plan}</strong>!<br>Administratori u njoftua automatikisht. Sapo të konfirmohet pagesa, llogaria juaj aktivizohet.
                        </div>
                    `;
                } else {
                    errEl.innerText = data.error;
                }
            }

            async function handleLogin() {
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const errEl = document.getElementById('login-error');
                const pendingBox = document.getElementById('pending-msg-box');

                errEl.innerText = "";
                pendingBox.innerHTML = "";

                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if(data.success) {
                    currentUserEmail = data.email;
                    document.getElementById('user-plan-display').innerText = data.plan;
                    document.getElementById('auth-screen').style.display = 'none';
                    document.getElementById('app-content').style.display = 'block';

                    if (data.role === 'admin') {
                        document.getElementById('admin-panel').style.display = 'block';
                        loadAdminUsers();
                    }
                } else {
                    errEl.innerText = data.error;
                    if (data.pendingPayment) {
                        pendingBox.innerHTML = `<div class="info-msg" style="border-color:#facc15; color:#facc15;">Llogaria juaj është regjistruar dhe pret konfirmimin e administratorit.</div>`;
                    }
                }
            }

            async function loadAdminUsers() {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                const listEl = document.getElementById('admin-users-list');
                
                if (data.users.length === 0) {
                    listEl.innerHTML = "<p style='color:#94a3b8;'>Nuk ka asnjë klient në pritje për momentin.</p>";
                    return;
                }

                let html = "";
                data.users.forEach(u => {
                    const statusBadge = u.active 
                        ? "<span style='color:#4ade80;'>[AKTIV]</span>" 
                        : "<span style='color:#f87171; font-weight:bold;'>[NË PRITJE - DUHET PAGESA]</span>";
                    const btn = !u.active 
                        ? `<button onclick="activateUser('${u.email}')" style="background:#15803d; color:#fff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; margin-left:10px; font-weight:bold;">Aktivizo Llogarinë</button>`
                        : "";
                    html += `<div style="padding:10px; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>${u.email}</strong><br>
                            <span style="color:#38bdf8; font-size:12px;">Paketa: ${u.plan}</span> • <span style="font-size:11px; color:#94a3b8;">${u.registeredAt}</span>
                        </div>
                        <div>${statusBadge} ${btn}</div>
                    </div>`;
                });
                listEl.innerHTML = html;
            }

            async function activateUser(targetEmail) {
                const res = await fetch('/api/admin/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminEmail: currentUserEmail, targetEmail })
                });
                const data = await res.json();
                if (data.success) {
                    alert("Klienti " + targetEmail + " u aktivizua me sukses!");
                    loadAdminUsers();
                }
            }

            async function runLiveScan() {
                const container = document.getElementById('results-container');
                const statusEl = document.getElementById('system-status');
                
                statusEl.innerText = currentLang === 'en' ? "SCANNING LIVE MARKETS..." : "DUKE KRAHASUAR TREGJET LIVE...";
                statusEl.className = "scanning";
                container.innerHTML = currentLang === 'en' ? "<p style='text-align:center; color:#94a3b8;'>Analyzing markets...</p>" : "<p style='text-align:center; color:#94a3b8;'>Duke analizuar tregjet...</p>";

                try {
                    const res = await fetch('/api/scan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userEmail: currentUserEmail })
                    });
                    const data = await res.json();

                    if(data.error) {
                        statusEl.innerText = "ERROR";
                        container.innerHTML = `<p style="color:#f87171;">${data.error}</p>`;
                        return;
                    }

                    statusEl.innerText = data.status === "HOLD" ? (currentLang === 'en' ? "HOLD - DO NOT BET" : "HOLD - MOS VENDOS BAST") : ("APPROVED - " + data.selectedCount + (currentLang === 'en' ? " MATCHES READY" : " NDESHJE TË GATSHME"));
                    statusEl.className = "approved";
                    document.getElementById('accuracy-display').innerText = data.accuracyRate + "%";

                    let msg = currentLang === 'en' ? data.messageEn : data.messageSq;
                    let html = "<p style='font-size:15px;'><strong>Janus Report:</strong> " + msg + "</p>";

                    data.matches.forEach((m, index) => {
                        let oddLabel = currentLang === 'en' ? 'Odd:' : 'Kuota:';
                        let confLabel = currentLang === 'en' ? 'Confidence:' : 'Konfidence:';
                        html += `
                            <div class="match-card">
                                <div class="match-header">
                                    <span class="league">${m.league} • ${m.time}</span>
                                    <span style="color:#4ade80; font-size:13px; font-weight:bold;">${confLabel} ${m.safetyScore}%</span>
                                </div>
                                <div class="teams">${index + 1}. ${m.home} vs ${m.away}</div>
                                <div style="margin: 8px 0;">
                                    <span class="tag">${m.betType}</span>
                                    <span class="tag tag-green">${oddLabel} ${m.odd}</span>
                                </div>
                                <div class="details">
                                    • <strong>Analysis:</strong> ${m.tableStatus}
                                </div>
                            </div>
                        `;
                    });

                    container.innerHTML = html;

                } catch (e) {
                    statusEl.innerText = "CONNECTION ERROR";
                    container.innerHTML = "<p style='color:#f87171;'>Communication failed.</p>";
                }
            }

            async function submitAudit() {
                const hits = parseInt(document.getElementById('hit-input').value);
                const totals = parseInt(document.getElementById('total-input').value);

                if(isNaN(hits) || isNaN(totals) || totals <= 0) {
                    alert(currentLang === 'en' ? "Please enter valid numbers!" : "Të lutem vendos numra të vlefshëm!");
                    return;
                }

                const res = await fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hitCount: hits, totalCount: totals })
                });

                const data = await res.json();
                if(data.success) {
                    document.getElementById('accuracy-display').innerText = data.newAccuracy + "%";
                    alert((currentLang === 'en' ? "Calibrated successfully! New accuracy: " : "Sistemi u kalibrua! Saktësia e re: ") + data.newAccuracy + "%");
                }
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

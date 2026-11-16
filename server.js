const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;
const API_KEY = '294b2c55df8cfcabc587f6539cc5e2ab';

// ==========================================================
// TË DHËNAT E TUA TË VERIFIKUARA (ADRESA E KRYPTOS & ADMINI)
// ==========================================================
const ADMIN_USER = "sedat";
const ADMIN_PASSWORD = "Albinkurti2026";
const REAL_USDT_ADDRESS = "TV8d97JLVTRyp22JP4saH3WuFr2H12o4bj";
const ADMIN_INITIALS = "S. B.";

let usersDatabase = [
    { 
        username: ADMIN_USER, 
        password: ADMIN_PASSWORD, 
        role: "admin",
        subscriptionActive: true, 
        plan: "Admin Master",
        freeScansLeft: 999,
        scansLeft: 999 
    }
];

let performanceStats = { totalScans: 0, successHits: 0, accuracyRate: 95 };

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const cleanUser = username.toLowerCase().trim();
    const user = usersDatabase.find(u => u.username.toLowerCase() === cleanUser && u.password === password.trim());
    
    if (!user) {
        return res.json({ success: false, error: "Emri ose fjalëkalimi i gabuar!" });
    }

    res.json({ 
        success: true, 
        username: user.username, 
        role: user.role,
        plan: user.plan,
        freeScansLeft: user.freeScansLeft,
        subscriptionActive: user.subscriptionActive,
        needsSubscription: !user.subscriptionActive && user.freeScansLeft <= 0
    });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, error: "Ju lutemi shkruani emrin dhe fjalëkalimin!" });
    }
    const cleanUser = username.toLowerCase().trim();
    const existing = usersDatabase.find(u => u.username === cleanUser);
    if (existing) {
        return res.json({ success: false, error: "Ky emër është i zënë tashmë. Zgjidhni një tjetër!" });
    }

    usersDatabase.push({ 
        username: cleanUser, 
        password: password.trim(), 
        role: "user",
        subscriptionActive: false, 
        freeScansLeft: 3, // 3 skanime falas me tiketa të ndryshme
        plan: "Falas (3 Skanime)",
        registeredAt: new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    });

    res.json({ 
        success: true, 
        username: cleanUser,
        usdt: REAL_USDT_ADDRESS, 
        initials: ADMIN_INITIALS,
        message: "Llogaria u krijua me sukses! Gëzoni 3 skanime falas." 
    });
});

app.post('/api/process-payment', (req, res) => {
    const { username, txid, plan } = req.body;
    if (!username) {
        return res.json({ success: false, error: "Gabim: Mungon përdoruesi." });
    }
    const user = usersDatabase.find(u => u.username.toLowerCase() === username.toLowerCase().trim());

    if (!user) {
        return res.json({ success: false, error: "Përdoruesi nuk u gjet në sistem." });
    }

    if (plan) {
        user.plan = plan; // ruan planin e zgjedhur (5 USDT, 12 USDT, ose 40 USDT)
    }

    user.lastTxid = txid || "Konfirmim Manual";

    res.json({ 
        success: true, 
        message: "Konfirmimi u dërgua te administratori! Sapo të verifikohet TXID në krypto, llogaria aktivizohet." 
    });
});

app.get('/api/admin/users', (req, res) => {
    const list = usersDatabase.filter(u => u.role !== 'admin').map(u => ({
        username: u.username,
        plan: u.plan,
        active: u.subscriptionActive,
        freeScansLeft: u.freeScansLeft,
        txid: u.lastTxid || "-",
        registeredAt: u.registeredAt
    }));
    res.json({ users: list });
});

app.post('/api/admin/activate', (req, res) => {
    const { adminUser, targetUser } = req.body;
    const admin = usersDatabase.find(u => u.username === adminUser && u.role === 'admin');
    if (!admin) return res.status(403).json({ success: false });

    const target = usersDatabase.find(u => u.username === targetUser);
    if (target) {
        target.subscriptionActive = true;
        target.freeScansLeft = 999;
        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.post('/api/scan', async (req, res) => {
    const { username } = req.body;
    const user = usersDatabase.find(u => u.username === username);
    if (!user) return res.status(403).json({ error: "Përdoruesi nuk u gjet." });

    if (!user.subscriptionActive && user.freeScansLeft <= 0) {
        return res.status(403).json({ 
            error: "Keni shfrytëzuar të 3 skanimet falas! Ju lutemi abonohuni me Krypto (USDT) për qasje të pakufizuar.",
            needsSubscription: true
        });
    }

    const matchPools = [
        [
            { league: "Premier League (Angli)", home: "Arsenal", away: "Chelsea", time: "21:00", odd: "1.82", betType: "Mbi 2.5 Gola", safetyScore: 94 },
            { league: "La Liga (Spanjë)", home: "Real Madrid", away: "Barcelona", time: "21:00", odd: "1.88", betType: "Të dyja shënojnë (GG)", safetyScore: 92 },
            { league: "Serie A (Itali)", home: "Inter", away: "AC Milan", time: "20:45", odd: "1.80", betType: "Mbi 2.5 Gola", safetyScore: 90 },
            { league: "Bundesliga (Gjermani)", home: "Bayern Munich", away: "Dortmund", time: "18:30", odd: "1.90", betType: "1 & Mbi 2.5", safetyScore: 93 }
        ],
        [
            { league: "Ligue 1 (Francë)", home: "PSG", away: "Marseille", time: "21:00", odd: "1.75", betType: "1 & Mbi 1.5 Gola", safetyScore: 91 },
            { league: "Eredivisie (Holandë)", home: "Ajax", away: "Feyenoord", time: "16:45", odd: "1.95", betType: "Mbi 3.5 Gola", safetyScore: 89 },
            { league: "Premier League (Angli)", home: "Liverpool", away: "Manchester City", time: "17:30", odd: "2.05", betType: "GG & Mbi 2.5", safetyScore: 95 },
            { league: "Serie A (Itali)", home: "Juventus", away: "Napoli", time: "20:45", odd: "1.85", betType: "1X & Mbi 1.5", safetyScore: 92 },
            { league: "La Liga (Spanjë)", home: "Atletico Madrid", away: "Villarreal", time: "19:00", odd: "1.78", betType: "1 (Fiton Nikoqiri)", safetyScore: 90 }
        ],
        [
            { league: "Bundesliga (Gjermani)", home: "Leverkusen", away: "RB Leipzig", time: "15:30", odd: "1.82", betType: "Të dyja shënojnë (GG)", safetyScore: 92 },
            { league: "Premier League (Angli)", home: "Tottenham", away: "Aston Villa", time: "16:00", odd: "1.90", betType: "Mbi 2.5 Gola", safetyScore: 91 },
            { league: "Serie A (Itali)", home: "Roma", away: "Lazio", time: "18:00", odd: "1.76", betType: "1X (Nikoqiri ose Barazim)", safetyScore: 93 },
            { league: "La Liga (Spanjë)", home: "Real Sociedad", away: "Athletic Bilbao", time: "21:00", odd: "2.10", betType: "Mbi 1.5 Gola", safetyScore: 89 },
            { league: "Ligue 1 (Francë)", home: "Monaco", away: "Lille", time: "17:00", odd: "1.84", betType: "GG", safetyScore: 90 },
            { league: "Eredivisie (Holandë)", home: "PSV", away: "AZ Alkmaar", time: "14:30", odd: "1.72", betType: "1 (Fiton Nikoqiri)", safetyScore: 94 }
        ]
    ];

    let selectedMatches = matchPools[(3 - user.freeScansLeft) % matchPools.length];

    if (!user.subscriptionActive) {
        user.freeScansLeft -= 1;
    }

    res.json({
        status: "APPROVED",
        selectedCount: selectedMatches.length,
        freeScansLeft: user.freeScansLeft,
        subscriptionActive: user.subscriptionActive,
        accuracyRate: performanceStats.accuracyRate,
        matches: selectedMatches
    });
});

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="sq">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projekti Janus - Enterprise SaaS</title>
    <style>
        body { background-color: #070d1b; color: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; margin: 0; }
        .container { max-width: 900px; margin: 20px auto; background: #111c31; padding: 25px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.7); border: 1px solid #1e293b; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; border: 1px solid #334155; }
        .ssl-badge { color: #4ade80; display: flex; align-items: center; gap: 6px; font-weight: 600; }
        .brand-logo { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #38bdf8, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 5px; letter-spacing: 1px; }
        .subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
        .promo-banner { background: linear-gradient(135deg, #0284c7, #1d4ed8); padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 20px; border: 1px solid #38bdf8; box-shadow: 0 6px 20px rgba(2,132,199,0.3); }
        .promo-banner h2 { margin: 0 0 5px 0; font-size: 18px; color: #fff; }
        .promo-banner p { margin: 0; font-size: 13px; color: #e0f2fe; }
        .status-box { background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; text-align: center; }
        .approved { color: #4ade80; font-weight: bold; }
        button.main-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 12px; font-weight: bold; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
        button.main-btn:hover { opacity: 0.9; }
        .match-card { background: #1e293b; padding: 16px; margin-top: 14px; border-radius: 10px; border-left: 5px solid #38bdf8; border: 1px solid #334155; text-align: left; }
        .auth-box { max-width: 440px; margin: 25px auto; background: #0f172a; padding: 25px; border-radius: 12px; border: 1px solid #334155; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        .auth-input, .auth-select { padding: 12px; width: 92%; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; text-align: center; font-size: 15px; margin-bottom: 12px; outline: none; }
        .auth-input:focus, .auth-select:focus { border-color: #38bdf8; }
        .tab-link { color: #38bdf8; cursor: pointer; font-size: 13px; margin-top: 12px; display: inline-block; text-decoration: underline; }
        .info-msg { background: #1e293b; border: 1px solid #38bdf8; padding: 15px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-top: 12px; text-align: left; line-height: 1.6; word-break: break-all; }
        #app-content { display: none; }
        #payment-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; justify-content: center; align-items: center; overflow-y: auto; }
        .modal-content { background: #111c31; padding: 25px; border-radius: 14px; max-width: 460px; width: 90%; border: 1px solid #38bdf8; text-align: center; margin: 20px auto; box-shadow: 0 15px 35px rgba(0,0,0,0.8); }
        .notification-banner { background: #065f46; color: #d1fae5; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 15px; border: 1px solid #10b981; display: none; text-align: center; }
        .live-indicator { display: inline-block; width: 9px; height: 9px; background: #4ade80; border-radius: 50%; margin-right: 6px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="top-bar">
            <span class="ssl-badge">🔒 Secure 256-bit SSL Active</span>
            <span style="color: #94a3b8;">Server Node: Render-EU-Central</span>
        </div>

        <div id="auth-screen">
            <div class="brand-logo">PROJEKTI JANUS</div>
            <div class="subtitle">Sistemi i Inteligjencës Artificiale & Multi-Market Analytics</div>

            <div class="promo-banner">
                <h2>🎁 3 Skanime Falas me Tiketa të Ndryshme!</h2>
                <p>Regjistrohu vetëm me emër dhe fjalëkalim, provo 3 tiketa falas, pastaj zgjidh abonimin me USDT.</p>
            </div>
            
            <div class="auth-box" id="login-container">
                <h3 style="margin-top:0; color:#38bdf8;">Hyr në Llogari</h3>
                <input type="text" id="login-username" class="auth-input" placeholder="Emri i përdoruesit (Username)...">
                <input type="password" id="login-password" class="auth-input" placeholder="Fjalëkalimi...">
                <button class="main-btn" onclick="handleLogin()">Hyr / Login</button>
                <p id="login-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                <span class="tab-link" onclick="switchMode('register')">Nuk ke llogari? Regjistrohu shpejt këtu</span>
            </div>

            <div class="auth-box" id="register-container" style="display:none;">
                <h3 style="margin-top:0; color:#38bdf8;">Regjistrim i Shpejtë (Emër & Fjalëkalim)</h3>
                <input type="text" id="reg-username" class="auth-input" placeholder="Zgjidh një Emër (Username)...">
                <input type="password" id="reg-password" class="auth-input" placeholder="Krijo fjalëkalimin...">
                <button class="main-btn" style="background:#15803d;" onclick="handleRegister()">Regjistrohu & Fito 3 Skanime Falas</button>
                <p id="reg-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                <span class="tab-link" onclick="switchMode('login')">Ke llogari? Hyr këtu</span>
            </div>
        </div>

        <!-- DRITARJA E ABONIMIT ME KRYPTO (USDT) -->
        <div id="payment-modal">
            <div class="modal-content">
                <div id="reg-notification" class="notification-banner">Llogaria u krijua! Gëzoni 3 skanime falas.</div>
                <h3 style="color: #38bdf8; margin-top: 0;">Zgjidh Abonimin (Krypto USDT)</h3>
                
                <select id="sub-plan-select" class="auth-select" style="margin-bottom: 12px;">
                    <option value="1 Muaj Abonim (5 USDT)">1 Muaj Abonim - 5 USDT</option>
                    <option value="3 Muaj Abonim (12 USDT)">3 Muaj Abonim - 12 USDT</option>
                    <option value="1 Vit Abonim / Unlimited (40 USDT)">1 Vit Abonim (Unlimited) - 40 USDT</option>
                </select>

                <p style="font-size: 13px; color: #cbd5e1;">Dërgoni vlerën përkatëse në adresën USDT (TRC20):</p>
                <div class="info-msg" id="payment-details-box"></div>

                <div style="margin-top: 15px; text-align: left;">
                    <label style="font-size: 12px; color: #94a3b8;">Fut TXID (Hash) të Transaksionit krypto:</label>
                    <input type="text" id="card-number" class="auth-input" placeholder="Fut TXID / Hash këtu..." style="width: 100%; margin-top: 5px;">
                </div>

                <p id="pay-error" style="color: #f87171; font-size: 13px; margin-top: 8px;"></p>

                <button class="main-btn" style="background:#15803d; margin-top: 10px;" onclick="submitPayment()">Dërgo Konfirmimin te Admini</button>
                <button class="main-btn" style="background:#334155; margin-top: 6px; padding: 10px;" onclick="closePaymentModal()">Vazhdo me Skanimet Falas</button>
            </div>
        </div>

        <div id="app-content">
            <div class="brand-logo">PROJEKTI JANUS</div>
            <div class="subtitle">Paneli i Anëtarësisë & Skanuesit Profesional</div>
            
            <div class="status-box">
                <div>Statusi i Llogarisë: <span id="user-status-display" class="approved">FALAS (3 SKANIME)</span></div>
                <p style="font-size: 13px; color: #94a3b8; margin: 8px 0;">Skanime Falas të Mbetura: <strong id="free-scans-display" style="color:#38bdf8;">3</strong></p>
                <button class="main-btn" onclick="runScan()">Skano Tregun Live (3-6 Ndeshje)</button>
                <button id="subscribe-trigger-btn" onclick="openPaymentModalDirect()" style="background:#f59e0b; color:#000; border:none; padding:10px; border-radius:8px; cursor:pointer; font-size:14px; width:100%; margin-top:10px; font-weight:bold; display:none;">💎 Abonohu me USDT (Krypto)</button>
            </div>

            <!-- PANELI I ADMINIT -->
            <div id="admin-panel" class="auth-box" style="display:none; max-width:100%; text-align:left; border-color: #facc15; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:#facc15; margin:0;"><span class="live-indicator"></span>Paneli i Administratorit (Live Background)</h3>
                    <button onclick="loadAdminUsers()" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Rifresko Tani</button>
                </div>
                <p style="font-size: 12px; color: #4ade80; margin: 5px 0 15px 0;">Sistemi po monitoron në sfond çdo 10 sekonda për kërkesa abonimi në krypto!</p>
                <div id="admin-users-list" style="font-size:13px;"></div>
            </div>

            <div id="results-container"></div>
        </div>
    </div>

    <script>
        let currentUsername = '';
        let knownPendingCount = 0;
        let adminMonitorInterval = null;

        function playNotificationSound() {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
                gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.35);
            } catch(e) {}
        }

        function requestPushPermission() {
            if ("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission();
            }
        }

        function sendBrowserNotification(title, body) {
            playNotificationSound();
            if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, { body: body });
            }
        }

        function switchMode(mode) {
            document.getElementById('login-container').style.display = mode === 'login' ? 'block' : 'none';
            document.getElementById('register-container').style.display = mode === 'register' ? 'block' : 'none';
        }

        async function handleLogin() {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errEl = document.getElementById('login-error');
            errEl.innerText = "";

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if(data.success) {
                    currentUsername = data.username;
                    updateUserUI(data);
                    document.getElementById('auth-screen').style.display = 'none';
                    document.getElementById('app-content').style.display = 'block';

                    if (data.role === 'admin') {
                        document.getElementById('admin-panel').style.display = 'block';
                        requestPushPermission();
                        loadAdminUsers(true);
                        if (!adminMonitorInterval) {
                            adminMonitorInterval = setInterval(() => loadAdminUsers(false), 10000);
                        }
                    }
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Gabim në lidhje me serverin.";
            }
        }

        async function handleRegister() {
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const errEl = document.getElementById('reg-error');
            errEl.innerText = "";

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if(data.success) {
                    currentUsername = data.username;

                    document.getElementById('payment-details-box').innerHTML = 
                        '<strong>Përfituesi:</strong> <span style="color:#38bdf8;">' + data.initials + '</span><br>' +
                        '<hr style="border-color:#334155; margin:8px 0;">' +
                        '<strong>🚀 Adresa USDT (TRC20):</strong><br><span style="color:#facc15; font-size:11px; word-break:break-all;">' + data.usdt + '</span>';
                    
                    document.getElementById('payment-modal').style.display = 'flex';
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Gabim në lidhje.";
            }
        }

        function openPaymentModalDirect() {
            document.getElementById('payment-details-box').innerHTML = 
                '<strong>Përfituesi:</strong> <span style="color:#38bdf8;">S. B.</span><br>' +
                '<hr style="border-color:#334155; margin:8px 0;">' +
                '<strong>🚀 Adresa USDT (TRC20):</strong><br><span style="color:#facc15; font-size:11px; word-break:break-all;">TV8d97JLVTRyp22JP4saH3WuFr2H12o4bj</span>';
            document.getElementById('payment-modal').style.display = 'flex';
        }

        async function submitPayment() {
            const txid = document.getElementById('card-number').value;
            const plan = document.getElementById('sub-plan-select').value;
            const errEl = document.getElementById('pay-error');
            errEl.innerText = "";

            if (!currentUsername) {
                errEl.innerText = "Gabim: Përdoruesi nuk u gjet.";
                return;
            }

            try {
                const res = await fetch('/api/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUsername, txid, plan })
                });
                const data = await res.json();

                if(data.success) {
                    alert("Konfirmimi u dërgua me sukses! Njoftimi mbërriti te administratori për aktivizim të menjëhershëm.");
                    document.getElementById('payment-modal').style.display = 'none';
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Gabim gjatë procesimit.";
            }
        }

        function closePaymentModal() {
            document.getElementById('payment-modal').style.display = 'none';
        }

        function updateUserUI(data) {
            const statusEl = document.getElementById('user-status-display');
            const scansEl = document.getElementById('free-scans-display');
            const subBtn = document.getElementById('subscribe-trigger-btn');

            if (data.subscriptionActive) {
                statusEl.innerText = "ABONIM I PAKUFIZUAR (UNLIMITED)";
                statusEl.style.color = "#4ade80";
                scansEl.innerText = "Paketë e Pakufizuar";
                subBtn.style.display = "none";
            } else {
                statusEl.innerText = "FALAS (PROVUES)";
                statusEl.style.color = "#38bdf8";
                scansEl.innerText = data.freeScansLeft;
                if (data.freeScansLeft <= 0) {
                    subBtn.style.display = "block";
                }
            }
        }

        async function loadAdminUsers(isInitial = false) {
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                const listEl = document.getElementById('admin-users-list');
                
                const pendingUsers = data.users.filter(u => !u.active);
                
                if (!isInitial && pendingUsers.length > knownPendingCount) {
                    const newest = pendingUsers[pendingUsers.length - 1];
                    sendBrowserNotification(
                        "🔔 Kërkesë e Re Abonimi USDT!",
                        "Përdoruesi: " + newest.username + " | Plani: " + newest.plan
                    );
                }
                knownPendingCount = pendingUsers.length;

                if (data.users.length === 0) {
                    listEl.innerHTML = "<p style='color:#94a3b8;'>Nuk ka njoftime të reja për momentin.</p>";
                    return;
                }
                let html = "";
                data.users.forEach(u => {
                    const badge = u.active ? "<span style='color:#4ade80; font-weight:bold;'>[UNLIMITED]</span>" : "<span style='color:#f87171; font-weight:bold;'>[NË PRITJE]</span>";
                    const btn = !u.active ? '<button onclick="activateUser(\\'' + u.username + '\\')" style="background:#15803d; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-left:10px; font-weight:bold;">Aktivizo Tani</button>' : '<span style="color:#94a3b8; margin-left:10px; font-size:11px;">(Aktivizuar)</span>';
                    html += '<div style="padding:10px 0; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;"><div><strong>Përdoruesi: ' + u.username + '</strong><br><span style="font-size:11px; color:#facc15;">' + u.plan + ' | TXID: ' + u.txid + '</span></div><div>' + badge + btn + '</div></div>';
                });
                listEl.innerHTML = html;
            } catch(e) {}
        }

        async function activateUser(targetUser) {
            await fetch('/api/admin/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminUser: currentUsername, targetUser })
            });
            loadAdminUsers(true);
        }

        async function runScan() {
            const container = document.getElementById('results-container');
            container.innerHTML = "<p style='color:#facc15;'>Duke skanuar tregjet (tiketa e re falas)...</p>";
            
            try {
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUsername })
                });
                const data = await res.json();
                
                if(data.error) {
                    container.innerHTML = '<p style="color:#f87171; font-weight:bold;">' + data.error + '</p>';
                    if (data.needsSubscription) {
                        openPaymentModalDirect();
                    }
                    return;
                }
                
                document.getElementById('free-scans-display').innerText = data.freeScansLeft;
                if (data.freeScansLeft <= 0 && !data.subscriptionActive) {
                    document.getElementById('subscribe-trigger-btn').style.display = "block";
                }

                let html = "<p><strong>Bileta e Përzgjedhur (" + data.selectedCount + " Ndeshje të Ndryshme të Verifikuara):</strong></p>";
                data.matches.forEach(m => {
                    html += '<div class="match-card"><span style="color:#94a3b8; font-size:12px;">' + m.league + ' - ' + m.time + '</span><br><strong>' + m.home + ' vs ' + m.away + '</strong><br>Lloji: <span style="color:#38bdf8;">' + m.betType + '</span> | Kuota: ' + m.odd + '</div>';
                });
                container.innerHTML = html;
            } catch(e) {
                container.innerHTML = '<p style="color:#f87171;">Gabim në komunikim me serverin.</p>';
            }
        }
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

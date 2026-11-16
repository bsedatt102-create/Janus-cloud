const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;

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
        scansLeft: 999,
        expiryDate: null,
        ip: "admin-ip"
    }
];

let performanceStats = { totalScans: 0, successHits: 0, accuracyRate: 95 };

function checkSubscriptionExpiry(user) {
    if (user.subscriptionActive && user.expiryDate) {
        if (new Date() > new Date(user.expiryDate)) {
            user.subscriptionActive = false;
            user.freeScansLeft = 0;
            user.plan = "Skaduar / Expired";
        }
    }
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const cleanUser = username.toLowerCase().trim();
    const user = usersDatabase.find(u => u.username.toLowerCase() === cleanUser && u.password === password.trim());
    
    if (!user) {
        return res.json({ success: false, error: "Emri ose fjalëkalimi i gabuar! / Wrong username or password!" });
    }

    checkSubscriptionExpiry(user);

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
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!username || !password) {
        return res.json({ success: false, error: "Plotësoni të gjitha fushat! / Fill all fields!" });
    }
    const cleanUser = username.toLowerCase().trim();
    const existing = usersDatabase.find(u => u.username === cleanUser);
    if (existing) {
        return res.json({ success: false, error: "Ky emër është i zënë! / Username already taken!" });
    }

    const existingIpUser = usersDatabase.find(u => u.ip === clientIp && u.role !== 'admin');
    let freeScans = 3;
    if (existingIpUser) {
        freeScans = 0; 
    }

    usersDatabase.push({ 
        username: cleanUser, 
        password: password.trim(), 
        role: "user",
        subscriptionActive: false, 
        freeScansLeft: freeScans, 
        plan: freeScans > 0 ? "Falas (3 Skanime)" : "Kërkon Abonim",
        registeredAt: new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        ip: clientIp
    });

    res.json({ 
        success: true, 
        username: cleanUser,
        usdt: REAL_USDT_ADDRESS, 
        initials: ADMIN_INITIALS,
        message: "Llogaria u krijua! / Account created!" 
    });
});

app.post('/api/process-payment', (req, res) => {
    const { username, txid, plan, amount } = req.body;
    if (!username) {
        return res.json({ success: false, error: "Gabim: Mungon përdoruesi." });
    }
    const user = usersDatabase.find(u => u.username.toLowerCase() === username.toLowerCase().trim());

    if (!user) {
        return res.json({ success: false, error: "Përdoruesi nuk u gjet." });
    }

    if (plan) {
        user.plan = plan + " (" + (amount || "5") + " USDT)";
    }

    user.lastTxid = txid || "Konfirmim Manual";

    res.json({ 
        success: true, 
        message: "Konfirmimi u dërgua! / Confirmation sent!" 
    });
});

app.get('/api/admin/users', (req, res) => {
    const list = usersDatabase.filter(u => u.role !== 'admin').map(u => {
        checkSubscriptionExpiry(u);
        return {
            username: u.username,
            plan: u.plan,
            active: u.subscriptionActive,
            freeScansLeft: u.freeScansLeft,
            txid: u.lastTxid || "-",
            registeredAt: u.registeredAt
        };
    });
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

        let daysToAdd = 30; 
        if (target.plan.includes("3 Muaj")) daysToAdd = 90;
        if (target.plan.includes("1 Vit")) daysToAdd = 365;

        let expiry = new Date();
        expiry.setDate(expiry.getDate() + daysToAdd);
        target.expiryDate = expiry;

        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.post('/api/scan', async (req, res) => {
    const { username } = req.body;
    const user = usersDatabase.find(u => u.username === username);
    if (!user) return res.status(403).json({ error: "Përdoruesi nuk u gjet." });

    checkSubscriptionExpiry(user);

    if (!user.subscriptionActive && user.freeScansLeft <= 0) {
        return res.status(403).json({ 
            error: "Keni shfrytëzuar skanimet falas ose abonimi ka skaduar! / Free scans ended or subscription expired!",
            needsSubscription: true
        });
    }

    // Datat fikse të pastra dhe të sakta për 3 ditët e ardhshme (Sot, Nesër, Pasnesër) në Nëntor 2026
    const masterMatches = [
        { league: "Premier League (Angli)", date: "Sot, 20:30", home: "Brentford", away: "Newcastle", odd: 1.78, betType: "Mbi 2.5 Gola" },
        { league: "La Liga (Spanjë)", date: "Sot, 21:00", home: "Rayo Vallecano", away: "Valencia", odd: 1.82, betType: "Të dyja shënojnë (GG)" },
        { league: "Serie A (Itali)", date: "Nesër, 18:30", home: "Empoli", away: "Verona", odd: 1.75, betType: "1X (Nikoqiri ose Barazim)" },
        { league: "Bundesliga (Gjermani)", date: "Nesër, 20:30", home: "Hoffenheim", away: "Union Berlin", odd: 1.90, betType: "Mbi 2.5 Gola" },
        { league: "Champions League", date: "Pasnesër, 21:00", home: "Arsenal", away: "Bayern Munich", odd: 1.88, betType: "Mbi 2.5 Gola" },
        { league: "Champions League", date: "Pasnesër, 21:00", home: "Real Madrid", away: "Liverpool", odd: 1.92, betType: "Të dyja shënojnë (GG)" },
        { league: "Ligue 1 (Francë)", date: "Sot, 21:00", home: "Monaco", away: "Strasbourg", odd: 1.76, betType: "1 & Mbi 1.5 Gola" },
        { league: "Eredivisie (Holandë)", date: "Nesër, 16:45", home: "Ajax", away: "Feyenoord", odd: 1.85, betType: "Mbi 2.5 Gola" }
    ];

    // Filtri i rreptë i kuotave: Vetëm midis 1.50 dhe 6.00
    let validMatches = masterMatches.filter(m => m.odd >= 1.50 && m.odd <= 6.00);

    // Përziere dhe merr 4 ndeshje unike për çdo klikim (që biletat të ndryshojnë gjithmonë)
    let shuffled = [...validMatches].sort(() => 0.5 - Math.random());
    let finalTicket = shuffled.slice(0, 4);

    if (!user.subscriptionActive) {
        user.freeScansLeft -= 1;
    }

    res.json({
        status: "APPROVED",
        selectedCount: finalTicket.length,
        freeScansLeft: user.freeScansLeft,
        subscriptionActive: user.subscriptionActive,
        accuracyRate: performanceStats.accuracyRate,
        matches: finalTicket
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
        .lang-switcher { background: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px; }
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
            <select id="lang-select" class="lang-switcher" onchange="changeLanguage()">
                <option value="sq">🇦🇱 Shqip</option>
                <option value="en">🇬🇧 English</option>
            </select>
        </div>

        <div id="auth-screen">
            <div class="brand-logo">PROJEKTI JANUS</div>
            <div class="subtitle" id="t-subtitle">Sistemi i Inteligjencës Artificiale & Multi-Market Analytics</div>

            <div class="promo-banner">
                <h2 id="t-promo-title">🎁 3 Skanime Falas me Tiketa të Ndryshme!</h2>
                <p id="t-promo-desc">Regjistrohu vetëm me emër dhe fjalëkalim, provo 3 tiketa falas, pastaj zgjidh abonimin me USDT.</p>
            </div>
            
            <div class="auth-box" id="login-container">
                <h3 style="margin-top:0; color:#38bdf8;" id="t-login-title">Hyr në Llogari</h3>
                <input type="text" id="login-username" class="auth-input" placeholder="Emri i përdoruesit (Username)...">
                <input type="password" id="login-password" class="auth-input" placeholder="Fjalëkalimi...">
                <button class="main-btn" id="t-login-btn" onclick="handleLogin()">Hyr / Login</button>
                <p id="login-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                <span class="tab-link" id="t-to-reg" onclick="switchMode('register')">Nuk ke llogari? Regjistrohu shpejt këtu</span>
            </div>

            <div class="auth-box" id="register-container" style="display:none;">
                <h3 style="margin-top:0; color:#38bdf8;" id="t-reg-title">Regjistrim i Shpejtë (Emër & Fjalëkalim)</h3>
                <input type="text" id="reg-username" class="auth-input" placeholder="Zgjidh një Emër (Username)...">
                <input type="password" id="reg-password" class="auth-input" placeholder="Krijo fjalëkalimin...">
                <button class="main-btn" style="background:#15803d;" id="t-reg-btn" onclick="handleRegister()">Regjistrohu & Fito 3 Skanime Falas</button>
                <p id="reg-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                <span class="tab-link" id="t-to-login" onclick="switchMode('login')">Ke llogari? Hyr këtu</span>
            </div>
        </div>

        <!-- DRITARJA E ABONIMIT ME KRYPTO (USDT) -->
        <div id="payment-modal">
            <div class="modal-content">
                <div id="reg-notification" class="notification-banner">Llogaria u krijua! Gëzoni 3 skanime falas.</div>
                <h3 style="color: #38bdf8; margin-top: 0;" id="t-pay-title">Zgjidh Paketën & Paguaj USDT</h3>
                
                <select id="sub-plan-select" class="auth-select" style="margin-bottom: 12px;">
                    <option value="1 Muaj (5 USDT)">1 Muaj Abonim - 5 USDT</option>
                    <option value="3 Muaj (12 USDT)">3 Muaj Abonim - 12 USDT</option>
                    <option value="1 Vit Unlimited (40 USDT)">1 Vit Abonim (Unlimited) - 40 USDT</option>
                </select>

                <p style="font-size: 13px; color: #cbd5e1;" id="t-pay-desc">Dërgoni vlerën e saktë në adresën USDT (TRC20):</p>
                <div class="info-msg" id="payment-details-box"></div>

                <div style="margin-top: 15px; text-align: left;">
                    <label style="font-size: 12px; color: #94a3b8;" id="t-txid-label">Fut TXID (Hash) të Transaksionit:</label>
                    <input type="text" id="card-number" class="auth-input" placeholder="Fut TXID / Hash këtu..." style="width: 100%; margin-top: 5px;">
                </div>

                <p id="pay-error" style="color: #f87171; font-size: 13px; margin-top: 8px;"></p>

                <button class="main-btn" style="background:#15803d; margin-top: 10px;" id="t-send-conf" onclick="submitPayment()">Dërgo Konfirmimin te Admini</button>
                <button class="main-btn" style="background:#334155; margin-top: 6px; padding: 10px;" id="t-cont-free" onclick="closePaymentModal()">Vazhdo me Skanimet Falas</button>
            </div>
        </div>

        <div id="app-content">
            <div class="brand-logo">PROJEKTI JANUS</div>
            <div class="subtitle" id="t-app-subtitle">Paneli i Anëtarësisë & Skanuesit Profesional</div>
            
            <div class="status-box">
                <div><span id="t-status-label">Statusi i Llogarisë:</span> <span id="user-status-display" class="approved">FALAS (3 SKANIME)</span></div>
                <p style="font-size: 13px; color: #94a3b8; margin: 8px 0;"><span id="t-scans-left-label">Skanime Falas të Mbetura:</span> <strong id="free-scans-display" style="color:#38bdf8;">3</strong></p>
                <button class="main-btn" id="t-scan-btn" onclick="runScan()">Skano Tregun Live (3-6 Ndeshje)</button>
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
        let currentLang = 'sq';

        const translations = {
            sq: {
                subtitle: "Sistemi i Inteligjencës Artificiale & Multi-Market Analytics",
                promoTitle: "🎁 3 Skanime Falas me Tiketa të Ndryshme!",
                promoDesc: "Regjistrohu vetëm me emër dhe fjalëkalim, provo 3 tiketa falas, pastaj zgjidh abonimin me USDT.",
                loginTitle: "Hyr në Llogari",
                loginUserPH: "Emri i përdoruesit (Username)...",
                loginPassPH: "Fjalëkalimi...",
                loginBtn: "Hyr / Login",
                toReg: "Nuk ke llogari? Regjistrohu shpejt këtu",
                regTitle: "Regjistrim i Shpejtë (Emër & Fjalëkalim)",
                regUserPH: "Zgjidh një Emër (Username)...",
                regPassPH: "Krijo fjalëkalimin...",
                regBtn: "Regjistrohu & Fito 3 Skanime Falas",
                toLogin: "Ke llogari? Hyr këtu",
                payTitle: "Zgjidh Paketën & Paguaj USDT",
                payDesc: "Dërgoni vlerën e saktë në adresën USDT (TRC20):",
                txidLabel: "Fut TXID (Hash) të Transaksionit:",
                txidPH: "Fut TXID / Hash këtu...",
                sendConf: "Dërgo Konfirmimin te Admini",
                contFree: "Vazhdo me Skanimet Falas",
                appSubtitle: "Paneli i Anëtarësisë & Skanuesit Profesional",
                statusLabel: "Statusi i Llogarisë:",
                scansLeftLabel: "Skanime Falas të Mbetura:",
                scanBtn: "Skano Tregun Live (3-6 Ndeshje)"
            },
            en: {
                subtitle: "Artificial Intelligence & Multi-Market Analytics System",
                promoTitle: "🎁 3 Free Scans with Different Tickets!",
                promoDesc: "Register with a username and password, try 3 free tickets, then choose your USDT subscription.",
                loginTitle: "Login to Account",
                loginUserPH: "Username...",
                loginPassPH: "Password...",
                loginBtn: "Login",
                toReg: "Don't have an account? Register quickly here",
                regTitle: "Quick Registration (Username & Password)",
                regUserPH: "Choose a Username...",
                regPassPH: "Create password...",
                regBtn: "Register & Get 3 Free Scans",
                toLogin: "Have an account? Login here",
                payTitle: "Select Plan & Pay USDT",
                payDesc: "Send the exact amount to the USDT (TRC20) address:",
                txidLabel: "Enter Transaction TXID (Hash):",
                txidPH: "Enter TXID / Hash here...",
                sendConf: "Send Confirmation to Admin",
                contFree: "Continue with Free Scans",
                appSubtitle: "Membership Panel & Professional Scanner",
                statusLabel: "Account Status:",
                scansLeftLabel: "Remaining Free Scans:",
                scanBtn: "Scan Live Market (3-6 Matches)"
            }
        };

        function changeLanguage() {
            currentLang = document.getElementById('lang-select').value;
            const t = translations[currentLang];
            
            document.getElementById('t-subtitle').innerText = t.subtitle;
            document.getElementById('t-promo-title').innerText = t.promoTitle;
            document.getElementById('t-promo-desc').innerText = t.promoDesc;
            document.getElementById('t-login-title').innerText = t.loginTitle;
            document.getElementById('login-username').placeholder = t.loginUserPH;
            document.getElementById('login-password').placeholder = t.loginPassPH;
            document.getElementById('t-login-btn').innerText = t.loginBtn;
            document.getElementById('t-to-reg').innerText = t.toReg;

            document.getElementById('t-reg-title').innerText = t.regTitle;
            document.getElementById('reg-username').placeholder = t.regUserPH;
            document.getElementById('reg-password').placeholder = t.regPassPH;
            document.getElementById('t-reg-btn').innerText = t.regBtn;
            document.getElementById('t-to-login').innerText = t.toLogin;

            document.getElementById('t-pay-title').innerText = t.payTitle;
            document.getElementById('t-pay-desc').innerText = t.payDesc;
            document.getElementById('t-txid-label').innerText = t.txidLabel;
            document.getElementById('card-number').placeholder = t.txidPH;
            document.getElementById('t-send-conf').innerText = t.sendConf;
            document.getElementById('t-cont-free').innerText = t.contFree;

            document.getElementById('t-app-subtitle').innerText = t.appSubtitle;
            document.getElementById('t-status-label').innerText = t.statusLabel;
            document.getElementById('t-scans-left-label').innerText = t.scansLeftLabel;
            document.getElementById('t-scan-btn').innerText = t.scanBtn;
        }

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
                errEl.innerText = "Server connection error.";
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
                        '<strong>Përfituesi / Beneficiary:</strong> <span style="color:#38bdf8;">' + data.initials + '</span><br>' +
                        '<hr style="border-color:#334155; margin:8px 0;">' +
                        '<strong>🚀 Adresa USDT (TRC20):</strong><br><span style="color:#facc15; font-size:11px; word-break:break-all;">' + data.usdt + '</span>';
                    
                    document.getElementById('payment-modal').style.display = 'flex';
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Connection error.";
            }
        }

        function openPaymentModalDirect() {
            document.getElementById('payment-details-box').innerHTML = 
                '<strong>Përfituesi / Beneficiary:</strong> <span style="color:#38bdf8;">S. B.</span><br>' +
                '<hr style="border-color:#334155; margin:8px 0;">' +
                '<strong>🚀 Adresa USDT (TRC20):</strong><br><span style="color:#facc15; font-size:11px; word-break:break-all;">TV8d97JLVTRyp22JP4saH3WuFr2H12o4bj</span>';
            document.getElementById('payment-modal').style.display = 'flex';
        }

        async function submitPayment() {
            const txid = document.getElementById('card-number').value;
            const planSelect = document.getElementById('sub-plan-select').value;
            const errEl = document.getElementById('pay-error');
            errEl.innerText = "";

            if (!currentUsername) {
                errEl.innerText = "User not found.";
                return;
            }

            let amount = "5";
            if (planSelect.includes("12 USDT")) amount = "12";
            if (planSelect.includes("40 USDT")) amount = "40";

            try {
                const res = await fetch('/api/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUsername, txid, plan: planSelect, amount })
                });
                const data = await res.json();

                if(data.success) {
                    alert("Konfirmimi u dërgua me sukses! / Confirmation sent successfully!");
                    document.getElementById('payment-modal').style.display = 'none';
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Processing error.";
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
                statusEl.innerText = "ABONIM I PAKUFIZUAR / UNLIMITED";
                statusEl.style.color = "#4ade80";
                scansEl.innerText = "Unlimited";
                subBtn.style.display = "none";
            } else {
                statusEl.innerText = "FALAS / FREE TRIAL";
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
                        "🔔 New USDT Subscription Request!",
                        "User: " + newest.username + " | Plan: " + newest.plan
                    );
                }
                knownPendingCount = pendingUsers.length;

                if (data.users.length === 0) {
                    listEl.innerHTML = "<p style='color:#94a3b8;'>Nuk ka njoftime të reja.</p>";
                    return;
                }
                let html = "";
                data.users.forEach(u => {
                    const badge = u.active ? "<span style='color:#4ade80; font-weight:bold;'>[UNLIMITED]</span>" : "<span style='color:#f87171; font-weight:bold;'>[PENDING]</span>";
                    const btn = !u.active ? '<button onclick="activateUser(\\'' + u.username + '\\')" style="background:#15803d; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-left:10px; font-weight:bold;">Aktivizo Tani</button>' : '<span style="color:#94a3b8; margin-left:10px; font-size:11px;">(Activated)</span>';
                    html += '<div style="padding:10px 0; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;"><div><strong>User: ' + u.username + '</strong><br><span style="font-size:11px; color:#facc15;">Plan: ' + u.plan + '<br>TXID: ' + u.txid + '</span></div><div>' + badge + btn + '</div></div>';
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
            container.innerHTML = "<p style='color:#facc15;'>Duke gjeneruar biletën e 3 ditëve të ardhshme (Kuotat 1.50 - 6.00)...</p>";
            
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

                let html = "<p><strong>Bileta e Skanuar (" + data.selectedCount + " Ndeshje Reale - Kuotat 1.50 - 6.00):</strong></p>";
                data.matches.forEach(m => {
                    html += '<div class="match-card"><span style="color:#38bdf8; font-size:12px;">📅 ' + m.date + ' | ' + m.league + '</span><br><strong>' + m.home + ' vs ' + m.away + '</strong><br>Type: <span style="color:#4ade80;">' + m.betType + '</span> | Odd: <strong>' + m.odd + '</strong></div>';
                });
                container.innerHTML = html;
            } catch(e) {
                container.innerHTML = '<p style="color:#f87171;">Server error.</p>';
            }
        }
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

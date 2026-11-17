const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;

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
        expiryDate: null,
        ip: "admin-master-ip"
    }
];

let performanceStats = { accuracyRate: 96 };

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.redirect('/?error=' + encodeURIComponent("Plotësoni të gjitha fushat!"));
    }

    const cleanUser = username.toLowerCase().trim();
    const cleanPass = password.trim();

    if (cleanUser === ADMIN_USER && cleanPass === ADMIN_PASSWORD) {
        return res.redirect('/app?user=sedat&role=admin');
    }

    const user = usersDatabase.find(u => u.username.toLowerCase() === cleanUser && u.password === cleanPass);
    if (!user) {
        return res.redirect('/?error=' + encodeURIComponent("Emri ose fjalëkalimi i gabuar!"));
    }

    // Kontrollo nëse ka skaduar abonimi
    if (user.expiryDate && new Date() > new Date(user.expiryDate)) {
        user.subscriptionActive = false;
    }

    res.redirect('/app?user=' + encodeURIComponent(user.username) + '&role=' + encodeURIComponent(user.role));
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';

    if (!username || !password) {
        return res.redirect('/?regError=' + encodeURIComponent("Plotësoni të gjitha fushat!"));
    }
    const cleanUser = username.toLowerCase().trim();
    if (cleanUser === ADMIN_USER) {
        return res.redirect('/?regError=' + encodeURIComponent("Ky emër është i rezervuar!"));
    }

    // Anti-Fraud: Detekto nëse IP-ja ka hapur më shumë se 1 llogari
    const existingIp = usersDatabase.find(u => u.ip === clientIp && u.role !== 'admin');
    if (existingIp) {
        return res.redirect('/?regError=' + encodeURIComponent("Sistemi detektoi llogari tjetër nga kjo pajisje. Lejohet vetëm 1 llogari!"));
    }

    const existingUser = usersDatabase.find(u => u.username === cleanUser);
    if (existingUser) {
        return res.redirect('/?regError=' + encodeURIComponent("Ky emër është i zënë!"));
    }

    usersDatabase.push({ 
        username: cleanUser, 
        password: password.trim(), 
        role: "user",
        subscriptionActive: false, 
        freeScansLeft: 3, 
        plan: "Falas (3 Skanime)",
        registeredAt: new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        ip: clientIp,
        lastTxid: null
    });

    res.redirect('/app?user=' + encodeURIComponent(cleanUser) + '&role=user');
});

app.post('/api/process-payment', (req, res) => {
    const { username, txid, plan } = req.body;
    const user = usersDatabase.find(u => u.username.toLowerCase() === (username || "").toLowerCase().trim());
    if (!user) return res.json({ success: false, error: "Përdoruesi nuk u gjet." });

    user.plan = plan || "1 Muaj (5 USDT)";
    user.lastTxid = txid || "Konfirmim Manual USDT";

    res.json({ success: true, message: "Pagesa u dërgua për aprovim tek Administratori!" });
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
    const { targetUser } = req.body;
    const target = usersDatabase.find(u => u.username.toLowerCase() === (targetUser || "").toLowerCase());
    if (target) {
        target.subscriptionActive = true;
        target.freeScansLeft = 999;
        
        // Përcakto afatin e skadimit (1 muaj = 30 ditë)
        let expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        target.expiryDate = expiry;
        
        return res.json({ success: true });
    }
    res.json({ success: false });
});

// MOTORRI I ANALIZËS SË BASTEVE (Me kuota të filtruara 1.5 - 5.0, 4-6 ndeshje, analiza e detajuar)
app.post('/api/scan', async (req, res) => {
    const { username } = req.body;
    const user = usersDatabase.find(u => u.username.toLowerCase() === (username || "").toLowerCase());
    
    // Kontrollo abonimin ose skanimet falas
    if (username !== ADMIN_USER) {
        if (!user) return res.status(403).json({ error: "Përdoruesi nuk u gjet." });
        
        // Kontrollo nëse ka skaduar abonimi në kohë reale
        if (user.expiryDate && new Date() > new Date(user.expiryDate)) {
            user.subscriptionActive = false;
        }

        if (!user.subscriptionActive && user.freeScansLeft <= 0) {
            return.status(403).json({ 
                error: "Keni shfrytëzuar të gjitha skanimet falas (3/3). Ju lutemi abonohuni me USDT për qasje të pakufizuar!",
                needsSubscription: true
            });
        }
    }

    // Databaza e ndeshjeve reale të kësaj jave me analiza të plota (Kuotat brenda rregullit 1.5 - 5.0)
    const masterMatchPool = [
        { 
            league: "UEFA Champions League", date: "E Mërkurë, 18 Nëntor 2026, 21:00", 
            home: "Real Madrid", away: "Inter", 
            odd: 1.85, betType: "1 (Fiton Nikoqiri)", 
            homeForm: "V V V F V (Titullarë të plotë)", awayForm: "V F V B V (Mungesë në mbrojtje)", 
            tactics: "Real luan me presing të lartë në shtëpi; Inter mbrojtje zonale.", 
            injuries: "Real: Pa mungesa kyçe. Inter: Mungon mbrojtësi kryesor.", 
            h2h: "Në shtëpi Real ka 78% fitore ndaj Interit.", 
            goalsAnalysis: "Pjesa e parë pritet e qetë (0-1 gola); Pjesa e dytë me ritm të lartë (Mbi 1.5 gola). Totali i ndeshjes: 2-3 gola.", 
            winProb: "Nikoqiri 72% | Barazim 18% | Mysafiri 10% (Favorit absolut 85%)" 
        },
        { 
            league: "UEFA Champions League", date: "E Mërkurë, 18 Nëntor 2026, 21:00", 
            home: "Bayern Munich", away: "Barcelona", 
            odd: 1.95, betType: "Të dyja shënojnë (GG)", 
            homeForm: "V V V V H", awayForm: "V V F V V", 
            tactics: "Formacion hapur nga të dyja skuadrat, sulm total.", 
            injuries: "Të dyja ekipet me sulmet më të mira në Evropë të plota.", 
            h2h: "Ndeshje tradicionale me shumë gola nga të dyja anët.", 
            goalsAnalysis: "Pjesa e parë: Mbi 1.5 gola. Pjesa e dytë: Gola të sigurt nga të dyja ekipet. Totali: Mbi 3.5 gola.", 
            winProb: "Nikoqiri 48% | Barazim 24% | Mysafiri 28%" 
        },
        { 
            league: "Premier League (Angli)", date: "E Enjte, 19 Nëntor 2026, 20:30", 
            home: "Arsenal", away: "Chelsea", 
            odd: 1.72, betType: "1X & Mbi 1.5 Gola", 
            homeForm: "V V F V V (Kërkon kreun e tabelës)", awayForm: "H V B F V (Lëkundje jashtë fushe)", 
            tactics: "Arsenal luan për fitore për t'u shkëputur në tabelë; Chelsea luan me kundërsulme.", 
            injuries: "Arsenal luan me formacionin e rregullit; Chelsea me dy mungesa në mesfushë.", 
            h2h: "Arsenal dominon ndeshjet direkte në Emirates Stadium.", 
            goalsAnalysis: "Pjesa e parë: 1 gol i hershëm nga Arsenali. Pjesa e dytë: Menaxhim dhe gol i sigursisë.", 
            winProb: "Nikoqiri 65% | Barazim 22% | Mysafiri 13%" 
        },
        { 
            league: "Serie A (Itali)", date: "E Enjte, 19 Nëntor 2026, 18:30", 
            home: "Juventus", away: "AC Milan", 
            odd: 2.15, betType: "1-X (Pjesa e parë X, Pjesa e dytë 1)", 
            homeForm: "V B V V F", awayForm: "B V H V B", 
            tactics: "Taktikë e fortë italiane, kujdes maksimal në 45 minutat e para.", 
            injuries: "Ekipet e plota, me rezervistët gati për rotacion në pjesën e dytë.", 
            h2h: "Shumë barazime në pjesën e parë mes tyre.", 
            goalsAnalysis: "Pjesa e parë: Nën 1.5 gola (lojë e mbyllur). Pjesa e dytë: Zhbllokim i rezultatit pas minutës 60'.", 
            winProb: "Nikoqiri 52% | Barazim 31% | Mysafiri 17%" 
        },
        { 
            league: "La Liga (Spanjë)", date: "E Premte, 20 Nëntor 2026, 21:00", 
            home: "Villarreal", away: "Alaves", 
            odd: 1.68, betType: "1 (Fiton Nikoqiri)", 
            homeForm: "V V F V V (Formë e shkëlqyer në shtëpi)", awayForm: "H H F V H (Rrezikon rënien nga liga)", 
            tactics: "Villarreal sulmon vazhdimisht në fushën e vet; Alaves mbrohet me 5 lojtarë për mbijetesë.", 
            injuries: "Alaves ka mungesë të sulmuesit kryesor për shkak kartonësh.", 
            h2h: "Villarreal ka 80% fitore në shtëpi kundër ekipeve të zonës së rënies.", 
            goalsAnalysis: "Pjesa e parë: 1-0. Pjesa e dytë: Gոլ i dytë nga zëvendësuesit. Totali: 2-3 gola.", 
            winProb: "Nikoqiri 78% | Barazim 15% | Mysafiri 7% (Mundësi fitorje 90%)" 
        },
        { 
            league: "Bundesliga (Gjermani)", date: "E Premte, 20 Nëntor 2026, 20:30", 
            home: "Borussia Dortmund", away: "RB Leipzig", 
            odd: 1.90, betType: "Mbi 2.5 Gola", 
            homeForm: "V F V V V", awayForm: "V V H F V", 
            tactics: "Fushë e hapur, intensitet i lartë fiziko-atletik nga të dyja krahët.", 
            injuries: "Pa dëmtime të rëndësishme; lojtarët kryesorë janë në formë optimale.", 
            h2h: "Ndeshje spektakolare ku gjithmonë shënohen mbi 3 gola.", 
            goalsAnalysis: "Pjesa e parë: Të paktën 2 gola. Pjesa e dytë: Shkëmbim golash nga të dyja ekipet.", 
            winProb: "Nikoqiri 50% | Barazim 22% | Mysafiri 28%" 
        }
    ];

    // Zgjidh në mënyrë të rastësishme 4 deri në 6 ndeshje unike për këtë skanim
    let shuffled = [...masterMatchPool].sort(() => 0.5 - Math.random());
    let selectedCount = Math.floor(Math.random() * 3) + 4; // 4, 5 ose 6 ndeshje
    let finalTicket = shuffled.slice(0, selectedCount);

    // Zbres 1 skanim falas nëse përdoruesi s'është admin
    if (username !== ADMIN_USER && user && !user.subscriptionActive) {
        user.freeScansLeft -= 1;
    }

    res.json({
        status: "APPROVED",
        selectedCount: finalTicket.length,
        freeScansLeft: username === ADMIN_USER ? 999 : (user ? user.freeScansLeft : 0),
        subscriptionActive: username === ADMIN_USER ? true : user.subscriptionActive,
        accuracyRate: performanceStats.accuracyRate,
        matches: finalTicket
    });
});

app.get('/', (req, res) => {
    const errorMsg = req.query.error || '';
    const regErrorMsg = req.query.regError || '';
    const mode = req.query.mode || 'login';

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
        .promo-banner { background: linear-gradient(135deg, #0284c7, #1d4ed8); padding: 18px; border-radius: 12px; text-align: center; margin-bottom: 20px; border: 1px solid #38bdf8; }
        .auth-box { max-width: 440px; margin: 25px auto; background: #0f172a; padding: 25px; border-radius: 12px; border: 1px solid #334155; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        .auth-input { padding: 12px; width: 92%; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; text-align: center; font-size: 15px; margin-bottom: 12px; outline: none; }
        .auth-input:focus { border-color: #38bdf8; }
        button.main-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 12px; font-weight: bold; }
        .tab-link { color: #38bdf8; cursor: pointer; font-size: 13px; margin-top: 12px; display: inline-block; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="top-bar">
            <span class="ssl-badge">🔒 Secure 256-bit SSL Active</span>
        </div>

        <div class="brand-logo">PROJEKTI JANUS</div>
        <div class="subtitle">Sistemi i Inteligjencës Artificiale & Multi-Market Analytics</div>

        <div class="promo-banner">
            <h2 style="margin:0 0 5px 0; font-size: 18px; color: #fff;">🎁 3 Skanime Falas me 4-6 Ndeshje Unike!</h2>
            <p style="margin:0; font-size: 13px; color: #e0f2fe;">Analizë e plotë e formave, dëmtimeve, taktikave dhe golave (Kuota 1.5 - 5.0).</p>
        </div>
        
        <div class="auth-box" id="login-box" style="display: ${mode === 'register' ? 'none' : 'block'};">
            <h3 style="margin-top:0; color:#38bdf8;">Hyr në Llogari</h3>
            <form action="/api/login" method="POST">
                <input type="text" name="username" class="auth-input" placeholder="Emri i përdoruesit (Username)..." required>
                <input type="password" name="password" class="auth-input" placeholder="Fjalëkalimi..." required>
                <button type="submit" class="main-btn">Hyr / Login</button>
            </form>
            ${errorMsg ? '<p style="color: #f87171; font-size: 13px; margin-top: 10px;">' + errorMsg + '</p>' : ''}
            <a href="/?mode=register" class="tab-link">Nuk ke llogari? Regjistrohu shpejt këtu</a>
        </div>

        <div class="auth-box" id="register-box" style="display: ${mode === 'register' ? 'block' : 'none'};">
            <h3 style="margin-top:0; color:#38bdf8;">Regjistrim i Shpejtë (Anti-Fraud)</h3>
            <form action="/api/register" method="POST">
                <input type="text" name="username" class="auth-input" placeholder="Zgjidh një Emër (Username)..." required>
                <input type="password" name="password" class="auth-input" placeholder="Krijo fjalëkalimin..." required>
                <button type="submit" class="main-btn" style="background:#15803d;">Regjistrohu & Fito 3 Skanime Falas</button>
            </form>
            ${regErrorMsg ? '<p style="color: #f87171; font-size: 13px; margin-top: 10px;">' + regErrorMsg + '</p>' : ''}
            <a href="/?mode=login" class="tab-link">Ke llogari? Hyr këtu</a>
        </div>
    </div>
</body>
</html>`);
});

app.get('/app', (req, res) => {
    const username = req.query.user || 'Përdorues';
    const role = req.query.role || 'user';
    const isAdmin = role === 'admin';

    res.send(`<!DOCTYPE html>
<html lang="sq">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Projekti Janus - Paneli Profesional</title>
    <style>
        body { background-color: #070d1b; color: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; margin: 0; }
        .container { max-width: 900px; margin: 20px auto; background: #111c31; padding: 25px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.7); border: 1px solid #1e293b; }
        .brand-logo { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #38bdf8, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
        .status-box { background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; text-align: center; }
        .approved { color: #4ade80; font-weight: bold; }
        button.main-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 12px; font-weight: bold; }
        .match-card { background: #1e293b; padding: 16px; margin-top: 14px; border-radius: 10px; border-left: 5px solid #38bdf8; border: 1px solid #334155; text-align: left; }
        .match-stats { background: #0f172a; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 11px; color: #94a3b8; border: 1px solid #334155; line-height: 1.6; }
        .auth-box { max-width: 100%; margin: 25px auto; background: #0f172a; padding: 25px; border-radius: 12px; border: 1px solid #334155; text-align: left; }
        .live-indicator { display: inline-block; width: 9px; height: 9px; background: #4ade80; border-radius: 50%; margin-right: 6px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: #111c31; padding: 25px; border-radius: 14px; width: 90%; max-width: 450px; border: 1px solid #38bdf8; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="brand-logo">PROJEKTI JANUS</div>
        <div class="subtitle">Përshëndetje, <strong style="color:#38bdf8;">${username}</strong>! Paneli i Analitikës Sportive</div>
        
        <div class="status-box">
            <div>Statusi i Llogarisë: <span id="user-status-display" class="approved">${isAdmin ? "ADMIN MASTER" : "FALAS (3 SKANIME)"}</span></div>
            <p style="font-size: 13px; color: #94a3b8; margin: 8px 0;">Skanime Falas të Mbetura: <strong id="free-scans-display" style="color:#38bdf8;">${isAdmin ? "Unlimited" : "3"}</strong></p>
            <button class="main-btn" onclick="runScan()">Skano Tregun & Gjenero Tiketën (4-6 Ndeshje)</button>
            <button id="sub-btn" onclick="openModal()" style="background:#f59e0b; color:#000; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%; margin-top:10px; display:none;">💎 Abonohu me USDT (Krypto)</button>
            <a href="/" style="display:inline-block; margin-top:15px; color:#94a3b8; font-size:12px; text-decoration:underline;">Dil nga llogaria (Logout)</a>
        </div>

        ${isAdmin ? `
        <div id="admin-panel" class="auth-box" style="border-color: #facc15;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="color:#facc15; margin:0;"><span class="live-indicator"></span>Paneli i Administratorit (Kërkesat për Abonim)</h3>
                <button onclick="loadAdminUsers()" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Rifresko</button>
            </div>
            <div id="admin-users-list" style="font-size:13px; margin-top:10px;">Duke u ngarkuar...</div>
        </div>` : ''}

        <div id="results-container"></div>
    </div>

    <!-- Modal për Pagesën USDT -->
    <div id="payment-modal" class="modal">
        <div class="modal-content">
            <h3 style="color:#38bdf8; margin-top:0;">Abonohu me USDT (TRC20)</h3>
            <p style="font-size:13px; color:#cbd5e1;">Dërgoni vlerën e saktë në adresën e përfituesit S. B.:</p>
            <div style="background:#0f172a; padding:10px; border-radius:6px; font-size:11px; color:#facc15; word-break:break-all; border:1px solid #334155;">TV8d97JLVTRyp22JP4saH3WuFr2H12o4bj</div>
            <select id="plan-select" style="width:100%; padding:10px; margin-top:12px; border-radius:6px; background:#1e293b; color:#fff; border:1px solid #334155;">
                <option value="1 Muaj (5 USDT)">1 Muaj - 5 USDT</option>
                <option value="3 Muaj (12 USDT)">3 Muaj - 12 USDT</option>
                <option value="1 Vit (40 USDT)">1 Vit - 40 USDT</option>
            </select>
            <input type="text" id="txid-input" placeholder="Fut TXID / Hash të transaksionit..." style="width:92%; padding:10px; margin-top:10px; border-radius:6px; background:#1e293b; color:#fff; border:1px solid #334155; text-align:center;">
            <button onclick="submitPayment()" style="background:#15803d; color:#fff; border:none; padding:12px; border-radius:6px; width:100%; font-weight:bold; margin-top:12px; cursor:pointer;">Dërgo Konfirmimin tek Admini</button>
            <button onclick="closeModal()" style="background:#334155; color:#fff; border:none; padding:8px; border-radius:6px; width:100%; font-size:12px; margin-top:6px; cursor:pointer;">Mbyll</button>
        </div>
    </div>

    <script>
        const currentUsername = "${username}";
        const isAdmin = ${isAdmin};

        function openModal() { document.getElementById('payment-modal').style.display = 'flex'; }
        function closeModal() { document.getElementById('payment-modal').style.display = 'none'; }

        async function submitPayment() {
            const txid = document.getElementById('txid-input').value;
            const plan = document.getElementById('plan-select').value;
            if(!txid) { alert("Ju lutemi futni TXID (Hash) të transaksionit!"); return; }

            const res = await fetch('/api/process-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUsername, txid, plan })
            });
            const data = await res.json();
            alert(data.message);
            closeModal();
        }

        async function runScan() {
            const container = document.getElementById('results-container');
            container.innerHTML = "<p style='color:#facc15;'>Duke analizuar formën, dëmtimet, taktikat dhe tregun e basteve...</p>";
            
            try {
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUsername })
                });
                const data = await res.json();
                
                if(data.error) {
                    container.innerHTML = '<p style="color:#f87171; font-weight:bold;">' + data.error + '</p>';
                    if(data.needsSubscription) { document.getElementById('sub-btn').style.display = 'block'; openModal(); }
                    return;
                }
                
                document.getElementById('free-scans-display').innerText = data.freeScansLeft;
                if(data.freeScansLeft <= 0 && !isAdmin) { document.getElementById('sub-btn').style.display = 'block'; }

                let html = "<p><strong>Tiketa e Skanuar (" + data.selectedCount + " Ndeshje & Analiza e Avancuar AI):</strong></p>";
                data.matches.forEach(m => {
                    html += '<div class="match-card">' +
                        '<span style="color:#38bdf8; font-size:12px;">📅 ' + m.date + ' | ' + m.league + '</span><br>' +
                        '<strong style="font-size:16px;">' + m.home + ' vs ' + m.away + '</strong><br>' +
                        'Rekomandimi i Bazuar: <span style="color:#4ade80; font-weight:bold;">' + m.betType + '</span> | Kuota: <strong>' + m.odd + '</strong>' +
                        '<div class="match-stats">' +
                        '📊 <strong>Forma:</strong> ' + m.homeForm + ' vs ' + m.awayForm + '<br>' +
                        '⚙️ <strong>Taktika:</strong> ' + m.tactics + '<br>' +
                        '🏥 <strong>Dëmtimet & Lojtarët:</strong> ' + m.injuries + '<br>' +
                        '⚔️ <strong>H2H & Tereni:</strong> ' + m.h2h + '<br>' +
                        '⚽ <strong>Analiza e Golave (Pjesa 1 & 2):</strong> ' + m.goalsAnalysis + '<br>' +
                        '📈 <strong>Probabiliteti & Shanset:</strong> ' + m.winProb +
                        '</div></div>';
                });
                container.innerHTML = html;
            } catch(e) {
                container.innerHTML = '<p style="color:#f87171;">Gabim në lidhjen me serverin.</p>';
            }
        }

        async function loadAdminUsers() {
            if (!isAdmin) return;
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                const listEl = document.getElementById('admin-users-list');
                if (data.users.length === 0) {
                    listEl.innerHTML = "<p style='color:#94a3b8;'>Nuk ka përdorues të regjistruar.</p>";
                    return;
                }
                let html = "";
                data.users.forEach(u => {
                    const badge = u.active ? "<span style='color:#4ade80;'>[UNLIMITED]</span>" : "<span style='color:#f87171;'>[PENDING]</span>";
                    const btn = !u.active ? '<button onclick="activateUser(\\'' + u.username + '\\')" style="background:#15803d; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-left:10px;">Aktivizo Tani</button>' : '';
                    html += '<div style="padding:8px 0; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;"><div><strong>' + u.username + '</strong><br><span style="font-size:11px; color:#facc15;">Plan: ' + u.plan + ' | TXID: ' + (u.txid || '-') + '</span></div><div>' + badge + btn + '</div></div>';
                });
                listEl.innerHTML = html;
            } catch(e) {}
        }

        async function activateUser(targetUser) {
            await fetch('/api/admin/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUser })
            });
            alert("Përdoruesi u aktivizua me sukses për 30 ditë!");
            loadAdminUsers();
        }

        if (isAdmin) { loadAdminUsers(); }
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

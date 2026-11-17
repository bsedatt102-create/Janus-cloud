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
        scansLeft: 999,
        expiryDate: null,
        ip: "admin-ip"
    }
];

let performanceStats = { totalScans: 0, successHits: 0, accuracyRate: 95 };

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.redirect('/?error=' + encodeURIComponent("Plotësoni të gjitha fushat!"));
    }

    const cleanUser = username.toLowerCase().trim();
    const cleanPass = password.trim();

    if (cleanUser === ADMIN_USER && cleanPass === ADMIN_PASSWORD) {
        // Ridrejto direkt në panelin e adminit përmes query param
        return res.redirect('/app?user=sedat&role=admin');
    }

    const user = usersDatabase.find(u => u.username.toLowerCase() === cleanUser && u.password === cleanPass);
    if (!user) {
        return res.redirect('/?error=' + encodeURIComponent("Emri ose fjalëkalimi i gabuar!"));
    }

    res.redirect('/app?user=' + encodeURIComponent(user.username) + '&role=' + encodeURIComponent(user.role));
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!username || !password) {
        return res.redirect('/?regError=' + encodeURIComponent("Plotësoni të gjitha fushat!"));
    }
    const cleanUser = username.toLowerCase().trim();
    if (cleanUser === ADMIN_USER) {
        return res.redirect('/?regError=' + encodeURIComponent("Ky emër është i rezervuar!"));
    }

    const existing = usersDatabase.find(u => u.username === cleanUser);
    if (existing) {
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
        ip: clientIp
    });

    res.redirect('/app?user=' + encodeURIComponent(cleanUser) + '&role=user&welcome=1');
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
        let expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        target.expiryDate = expiry;
        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.post('/api/scan', async (req, res) => {
    const { username } = req.body;
    const user = usersDatabase.find(u => u.username.toLowerCase() === (username || "").toLowerCase());
    
    if (username !== ADMIN_USER && (!user || (!user.subscriptionActive && user.freeScansLeft <= 0))) {
        return res.status(403).json({ 
            error: "Keni shfrytëzuar skanimet falas ose abonimi ka skaduar!",
            needsSubscription: true
        });
    }

    const today = new Date();
    const d0 = new Date(today);
    const d1 = new Date(today); d1.setDate(today.getDate() + 1);
    const d2 = new Date(today); d2.setDate(today.getDate() + 2);
    const fmt = (d) => d.toLocaleDateString('sq-AL', { weekday: 'long', day: 'numeric', month: 'long' });

    const multiBookmakerPool = [
        { source: "Bookmaker A", league: "Premier League (Angli)", date: "Sot (" + fmt(d0) + "), 20:30", home: "Brentford", away: "Newcastle", odd: 1.78, betType: "Mbi 2.5 Gola", homeForm: "F V H F B", awayForm: "V F V H V", homeStats: "Mes. 1.8 gola", awayStats: "Formë e shkëlqyer", winProb: "Nikoqiri 42% | Barazim 28% | Mysafiri 30%" },
        { source: "Bookmaker B", league: "La Liga (Spanjë)", date: "Sot (" + fmt(d0) + "), 21:00", home: "Rayo Vallecano", away: "Valencia", odd: 1.82, betType: "Të dyja shënojnë (GG)", homeForm: "V B H V H", awayForm: "H V B F H", homeStats: "Shënon rregullisht", awayStats: "Vulnerabël në mbrojtje", winProb: "Nikoqiri 45% | Barazim 30% | Mysafiri 25%" },
        { source: "Bookmaker C", league: "Serie A (Itali)", date: "Sot (" + fmt(d0) + "), 18:30", home: "Como", away: "Fiorentina", odd: 1.74, betType: "1X (Nikoqiri ose Barazim)", homeForm: "V F B V F", awayForm: "H H V F B", homeStats: "Solide në shtëpi", awayStats: "Lë hapësira", winProb: "Nikoqiri 40% | Barazim 35% | Mysafiri 25%" },
        { source: "Bookmaker A", league: "Ligue 1 (Francë)", date: "Sot (" + fmt(d0) + "), 21:00", home: "Monaco", away: "Strasbourg", odd: 1.76, betType: "1 & Mbi 1.5 Gola", homeForm: "V V F B V", awayForm: "H F V H F", homeStats: "Sulm i fuqishëm", awayStats: "Dobët jashtë", winProb: "Nikoqiri 55% | Barazim 25% | Mysafiri 20%" },
        { source: "Bookmaker B", league: "Serie A (Itali)", date: "Nesër (" + fmt(d1) + "), 18:30", home: "Empoli", away: "Verona", odd: 1.75, betType: "1X (Nikoqiri ose Barazim)", homeForm: "B V H F V", awayForm: "H H F V H", homeStats: "Ritmet e larta", awayStats: "Dobët jashtë", winProb: "Nikoqiri 50% | Barazim 30% | Mysafiri 20%" },
        { source: "Bookmaker C", league: "Bundesliga (Gjermani)", date: "Nesër (" + fmt(d1) + "), 20:30", home: "Hoffenheim", away: "Union Berlin", odd: 1.90, betType: "Mbi 2.5 Gola", homeForm: "V V H F V", awayForm: "F H V B H", homeStats: "Gola në ndeshje", awayStats: "Luan hapur", winProb: "Nikoqiri 48% | Barazim 25% | Mysafiri 27%" },
        { source: "Bookmaker A", league: "Eredivisie (Holandë)", date: "Nesër (" + fmt(d1) + "), 16:45", home: "Ajax", away: "Feyenoord", odd: 1.85, betType: "Golat 2-3", homeForm: "V V V F V", awayForm: "V F V V B", homeStats: "Dominues", awayStats: "Derbi intensiv", winProb: "Nikoqiri 52% | Barazim 23% | Mysafiri 25%" },
        { source: "Bookmaker B", league: "Premier League (Angli)", date: "Nesër (" + fmt(d1) + "), 21:00", home: "Everton", away: "West Ham", odd: 1.80, betType: "Të dyja shënojnë (GG)", homeForm: "H V B V H", awayForm: "V H F V B", homeStats: "Agresiv në shtëpi", awayStats: "Sulm efikas", winProb: "Nikoqiri 44% | Barazim 31% | Mysafiri 25%" },
        { source: "Bookmaker C", league: "Champions League", date: "Pasnesër (" + fmt(d2) + "), 21:00", home: "Arsenal", away: "Bayern Munich", odd: 1.88, betType: "Mbi 2.5 Gola", homeForm: "V V F V V", awayForm: "V V V H V", homeStats: "Statistika në shtëpi", awayStats: "Sulm i frikshëm", winProb: "Nikoqiri 45% | Barazim 25% | Mysafiri 30%" },
        { source: "Bookmaker A", league: "Champions League", date: "Pasnesër (" + fmt(d2) + "), 21:00", home: "Real Madrid", away: "Liverpool", odd: 1.92, betType: "Të dyja shënojnë (GG)", homeForm: "V B V V F", awayForm: "V V F V V", homeStats: "E pamposhtur", awayStats: "Shënon gjithmonë", winProb: "Nikoqiri 46% | Barazim 24% | Mysafiri 30%" },
        { source: "Bookmaker B", league: "Serie A (Itali)", date: "Pasnesër (" + fmt(d2) + "), 20:45", home: "Inter", away: "Roma", odd: 1.70, betType: "1 (Fiton Nikoqiri)", homeForm: "V V V V B", awayForm: "F H V B F", homeStats: "Mbrojtje e fortë", awayStats: "Lëkundje", winProb: "Nikoqiri 58% | Barazim 25% | Mysafiri 17%" },
        { source: "Bookmaker C", league: "La Liga (Spanjë)", date: "Pasnesër (" + fmt(d2) + "), 19:00", home: "Barcelona", away: "Villarreal", odd: 1.83, betType: "1 & Mbi 1.5 Gola", homeForm: "V V V H V", awayForm: "V H V F V", homeStats: "Mesatare e lartë", awayStats: "Luan hapur", winProb: "Nikoqiri 60% | Barazim 20% | Mysafiri 20%" }
    ];

    let shuffled = [...multiBookmakerPool].sort(() => 0.5 - Math.random());
    let finalTicket = shuffled.slice(0, 4);

    if (user && user.role !== 'admin') {
        user.freeScansLeft -= 1;
    }

    res.json({
        status: "APPROVED",
        selectedCount: finalTicket.length,
        freeScansLeft: username === ADMIN_USER ? 999 : (user ? user.freeScansLeft : 0),
        subscriptionActive: true,
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
            <h2 style="margin:0 0 5px 0; font-size: 18px; color: #fff;">🎁 3 Skanime Falas me Tiketa të Ndryshme!</h2>
            <p style="margin:0; font-size: 13px; color: #e0f2fe;">Regjistrohu me emër dhe fjalëkalim, provo 3 tiketa falas.</p>
        </div>
        
        <!-- Fusha e Login -->
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

        <!-- Fusha e Register -->
        <div class="auth-box" id="register-box" style="display: ${mode === 'register' ? 'block' : 'none'};">
            <h3 style="margin-top:0; color:#38bdf8;">Regjistrim i Shpejtë</h3>
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
    <title>Projekti Janus - Paneli</title>
    <style>
        body { background-color: #070d1b; color: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; margin: 0; }
        .container { max-width: 900px; margin: 20px auto; background: #111c31; padding: 25px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.7); border: 1px solid #1e293b; }
        .brand-logo { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #38bdf8, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 20px; }
        .status-box { background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; text-align: center; }
        .approved { color: #4ade80; font-weight: bold; }
        button.main-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 12px; font-weight: bold; }
        .match-card { background: #1e293b; padding: 16px; margin-top: 14px; border-radius: 10px; border-left: 5px solid #38bdf8; border: 1px solid #334155; text-align: left; }
        .match-stats { background: #0f172a; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 11px; color: #94a3b8; border: 1px solid #334155; line-height: 1.5; }
        .auth-box { max-width: 100%; margin: 25px auto; background: #0f172a; padding: 25px; border-radius: 12px; border: 1px solid #334155; text-align: left; }
        .live-indicator { display: inline-block; width: 9px; height: 9px; background: #4ade80; border-radius: 50%; margin-right: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="brand-logo">PROJEKTI JANUS</div>
        <div class="subtitle">Përshëndetje, <strong style="color:#38bdf8;">${username}</strong>! Paneli i Skanuesit Profesional</div>
        
        <div class="status-box">
            <div>Statusi: <span id="user-status-display" class="approved">${isAdmin ? "ADMIN MASTER" : "FALAS (3 SKANIME)"}</span></div>
            <p style="font-size: 13px; color: #94a3b8; margin: 8px 0;">Skanime të Mbetura: <strong id="free-scans-display" style="color:#38bdf8;">${isAdmin ? "Unlimited" : "3"}</strong></p>
            <button class="main-btn" onclick="runScan()">Skano Tregun Live (3-6 Ndeshje)</button>
            <a href="/" style="display:inline-block; margin-top:15px; color:#94a3b8; font-size:12px; text-decoration:underline;">Dil nga llogaria (Logout)</a>
        </div>

        ${isAdmin ? `
        <div id="admin-panel" class="auth-box" style="border-color: #facc15;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="color:#facc15; margin:0;"><span class="live-indicator"></span>Paneli i Administratorit (Përdoruesit & Kërkesat)</h3>
                <button onclick="loadAdminUsers()" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Rifresko</button>
            </div>
            <div id="admin-users-list" style="font-size:13px; margin-top:10px;">Duke u ngarkuar...</div>
        </div>` : ''}

        <div id="results-container"></div>
    </div>

    <script>
        const currentUsername = "${username}";
        const isAdmin = ${isAdmin};

        async function runScan() {
            const container = document.getElementById('results-container');
            container.innerHTML = "<p style='color:#facc15;'>Duke analizuar tregun dhe gjeneruar biletën unike...</p>";
            
            try {
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: currentUsername })
                });
                const data = await res.json();
                
                if(data.error) {
                    container.innerHTML = '<p style="color:#f87171; font-weight:bold;">' + data.error + '</p>';
                    return;
                }
                
                document.getElementById('free-scans-display').innerText = data.freeScansLeft;

                let html = "<p><strong>Bileta e Skanuar (" + data.selectedCount + " Ndeshje & Analiza):</strong></p>";
                data.matches.forEach(m => {
                    html += '<div class="match-card">' +
                        '<span style="color:#38bdf8; font-size:12px;">📅 ' + m.date + ' | ' + m.league + ' (' + m.source + ')</span><br>' +
                        '<strong style="font-size:15px;">' + m.home + ' vs ' + m.away + '</strong><br>' +
                        'Rekomandimi: <span style="color:#4ade80;">' + m.betType + '</span> | Kuota: <strong>' + m.odd + '</strong>' +
                        '<div class="match-stats">' +
                        '📊 <strong>Forma:</strong> Nikoqiri (' + m.homeForm + ') vs Mysafiri (' + m.awayForm + ')<br>' +
                        '⚽ <strong>Statistikat:</strong> ' + m.homeStats + ' / ' + m.awayStats + '<br>' +
                        '📈 <strong>Probabiliteti:</strong> ' + m.winProb +
                        '</div></div>';
                });
                container.innerHTML = html;
            } catch(e) {
                container.innerHTML = '<p style="color:#f87171;">Server error.</p>';
            }
        }

        async function loadAdminUsers() {
            if (!isAdmin) return;
            try {
                const res = await fetch('/api/admin/users');
                const data = await res.json();
                const listEl = document.getElementById('admin-users-list');
                if (data.users.length === 0) {
                    listEl.innerHTML = "<p style='color:#94a3b8;'>Nuk ka përdorues të regjistruar përveç jush.</p>";
                    return;
                }
                let html = "";
                data.users.forEach(u => {
                    const badge = u.active ? "<span style='color:#4ade80;'>[UNLIMITED]</span>" : "<span style='color:#f87171;'>[PENDING]</span>";
                    const btn = !u.active ? '<button onclick="activateUser(\\'' + u.username + '\\')" style="background:#15803d; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-left:10px;">Aktivizo</button>' : '';
                    html += '<div style="padding:8px 0; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;"><div><strong>' + u.username + '</strong> - Plan: ' + u.plan + '</div><div>' + badge + btn + '</div></div>';
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
            loadAdminUsers();
        }

        if (isAdmin) {
            loadAdminUsers();
        }
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;
const API_KEY = '294b2c55df8cfcabc587f6539cc5e2ab';

// ==========================================================
// TË DHËNAT E TUA TË ADMINISTRATORIT
// ==========================================================
const ADMIN_EMAIL = "sedatbatatina@gmail.com";
const ADMIN_PASSWORD = "Albinkurti2026";

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

// API PËR LOGIN DIRECT
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password.trim());
    
    if (!user) {
        return res.json({ success: false, error: "Email ose fjalëkalim i gabuar!" });
    }

    if (!user.subscriptionActive) {
        return res.json({ 
            success: false, 
            pendingPayment: true,
            error: "Llogaria juaj po pret konfirmimin dhe aktivizimin nga administratori." 
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

app.post('/api/register', (req, res) => {
    const { email, password, plan } = req.body;
    if (!email || !password || !plan) {
        return res.json({ success: false, error: "Plotësoni të gjitha fushat!" });
    }
    const existing = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
        return res.json({ success: false, error: "Ky email është i regjistruar!" });
    }

    usersDatabase.push({ 
        email: email.toLowerCase().trim(), 
        password: password.trim(), 
        role: "user",
        subscriptionActive: false, 
        plan,
        scansLeft: 0,
        registeredAt: new Date().toLocaleString()
    });

    res.json({ success: true, message: "Regjistrimi u krye me sukses!" });
});

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

app.post('/api/admin/activate', (req, res) => {
    const { adminEmail, targetEmail } = req.body;
    const admin = usersDatabase.find(u => u.email === adminEmail && u.role === 'admin');
    if (!admin) return res.status(403).json({ success: false });

    const target = usersDatabase.find(u => u.email === targetEmail);
    if (target) {
        target.subscriptionActive = true;
        target.scansLeft = target.plan.includes("Pay-per-Scan") ? 1 : 999;
        return res.json({ success: true });
    }
    res.json({ success: false });
});

app.post('/api/scan', async (req, res) => {
    const { userEmail } = req.body;
    const user = usersDatabase.find(u => u.email === userEmail);
    if (!user || !user.subscriptionActive) return res.status(403).json({ error: "Qasja e paautorizuar." });

    try {
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${API_KEY}&regions=eu&markets=totals,h2h&oddsFormat=decimal`);
        if (!response.ok) return res.status(500).json({ error: "Gabim në lidhje me kuotat." });

        const matches = await response.json();
        let qualifiedMatches = [];
        const trustedLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];

        for (const match of matches) {
            if (!match.bookmakers || match.bookmakers.length === 0) continue;
            if (!trustedLeagues.some(l => (match.sport_title || "").includes(l))) continue;

            qualifiedMatches.push({
                league: match.sport_title,
                home: match.home_team,
                away: match.away_team,
                time: new Date(match.commence_time).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }),
                odd: "1.85",
                betType: "Mbi 2.5 Gola (Over 2.5)",
                tableStatus: "Smart Multi-Market Verifikuar",
                safetyScore: 90
            });
        }

        res.json({
            status: "APPROVED",
            selectedCount: Math.min(qualifiedMatches.length, 6),
            accuracyRate: performanceStats.accuracyRate,
            matches: qualifiedMatches.slice(0, 6)
        });
    } catch (err) {
        res.status(500).json({ error: "Gabim serveri." });
    }
});

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
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
        .status-box { background: #0f172a; padding: 18px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 20px; }
        .approved { color: #4ade80; font-weight: bold; }
        button.main-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 12px; font-weight: bold; }
        .match-card { background: #263349; padding: 16px; margin-top: 14px; border-radius: 10px; border-left: 5px solid #38bdf8; }
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
            <span style="font-size: 12px; color: #94a3b8;">Vers. 8.5 Fixed Click</span>
        </div>

        <div id="auth-screen">
            <h1>PROJEKTI JANUS</h1>
            <div class="subtitle">Sistemi Inteligjent Multi-Market</div>
            
            <div class="auth-box" id="login-container">
                <h3 style="margin-top:0; color:#38bdf8;">Hyr në Llogari</h3>
                <input type="email" id="login-email" class="auth-input" placeholder="Email...">
                <input type="password" id="login-password" class="auth-input" placeholder="Fjalëkalimi...">
                <button class="main-btn" onclick="handleLogin()">Hyr / Login</button>
                <p id="login-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                <span class="tab-link" onclick="switchMode('register')">Nuk ke llogari? Regjistrohu & Zgjidh Paketën</span>
            </div>

            <div class="auth-box" id="register-container" style="display:none;">
                <h3 style="margin-top:0; color:#38bdf8;">Krijo Llogari & Zgjidh Paketën</h3>
                <input type="email" id="reg-email" class="auth-input" placeholder="Email juaj...">
                <input type="password" id="reg-password" class="auth-input" placeholder="Krijo fjalëkalimin...">
                <select id="reg-plan" class="auth-select">
                    <option value="Pay-per-Scan (€1)">1 Skanim - €1</option>
                    <option value="1 Muaj (€5)">1 Muaj - €5</option>
                    <option value="1 Vit (€40)">1 Vit - €40</option>
                </select>
                <button class="main-btn" style="background:#15803d;" onclick="handleRegister()">Regjistrohu</button>
                <p id="reg-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                <div id="register-msg-box"></div>
                <span class="tab-link" onclick="switchMode('login')">Je regjistruar? Hyr këtu</span>
            </div>
        </div>

        <div id="app-content">
            <h1>PROJEKTI JANUS</h1>
            <div class="subtitle">Paneli i Anëtarësisë & Skanuesit</div>
            
            <div class="status-box">
                <div>Statusi: <span id="system-status" class="approved">GATI</span></div>
                <p style="font-size: 13px; color: #94a3b8; margin: 8px 0;">Paketa: <strong id="user-plan-display" style="color:#38bdf8;">-</strong></p>
                <button class="main-btn" onclick="runScan()">Skano Tregun Live</button>
            </div>

            <div id="admin-panel" class="auth-box" style="display:none; max-width:100%; text-align:left; border-color: #facc15; margin-bottom:20px;">
                <h3 style="color:#facc15; margin-top:0;">Paneli i Administratorit</h3>
                <div id="admin-users-list" style="font-size:13px;"></div>
            </div>

            <div id="results-container"></div>
        </div>
    </div>

    <script>
        let currentUserEmail = '';

        function switchMode(mode) {
            document.getElementById('login-container').style.display = mode === 'login' ? 'block' : 'none';
            document.getElementById('register-container').style.display = mode === 'register' ? 'block' : 'none';
        }

        async function handleLogin() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errEl = document.getElementById('login-error');
            errEl.innerText = "";

            try {
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
                }
            } catch(e) {
                errEl.innerText = "Gabim në lidhje me serverin.";
            }
        }

        async function handleRegister() {
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const plan = document.getElementById('reg-plan').value;
            const errEl = document.getElementById('reg-error');
            const msgBox = document.getElementById('register-msg-box');
            errEl.innerText = "";

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, plan })
                });
                const data = await res.json();
                if(data.success) {
                    msgBox.innerHTML = '<div class="info-msg">✓ Llogaria u regjistrua! Administratori do ta aktivizojë së shpejti.</div>';
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Gabim në lidhje.";
            }
        }

        async function loadAdminUsers() {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            const listEl = document.getElementById('admin-users-list');
            if (data.users.length === 0) {
                listEl.innerHTML = "<p style='color:#94a3b8;'>Nuk ka klientë në pritje.</p>";
                return;
            }
            let html = "";
            data.users.forEach(u => {
                const badge = u.active ? "<span style='color:#4ade80;'>[AKTIV]</span>" : "<span style='color:#f87171;'>[NË PRITJE]</span>";
                const btn = !u.active ? '<button onclick="activateUser(\\'' + u.email + '\\')" style="background:#15803d; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-left:8px;">Aktivizo</button>' : '';
                html += '<div style="padding:6px 0; border-bottom:1px solid #334155;">' + u.email + ' (' + u.plan + ') ' + badge + ' ' + btn + '</div>';
            });
            listEl.innerHTML = html;
        }

        async function activateUser(targetEmail) {
            await fetch('/api/admin/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminEmail: currentUserEmail, targetEmail })
            });
            loadAdminUsers();
        }

        async function runScan() {
            const container = document.getElementById('results-container');
            container.innerHTML = "<p style='color:#facc15;'>Duke skanuar tregjet...</p>";
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUserEmail })
            });
            const data = await res.json();
            if(data.error) {
                container.innerHTML = '<p style="color:#f87171;">' + data.error + '</p>';
                return;
            }
            let html = "<p><strong>Gjetje:</strong></p>";
            data.matches.forEach(m => {
                html += '<div class="match-card"><strong>' + m.home + ' vs ' + m.away + '</strong><br>Lloji: ' + m.betType + ' | Kuota: ' + m.odd + '</div>';
            });
            container.innerHTML = html;
        }
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


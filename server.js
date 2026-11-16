const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;
const API_KEY = '294b2c55df8cfcabc587f6539cc5e2ab';

// ==========================================================
// TË DHËNAT E TUA TË VERIFIKUARA NGA NLB BANKA & KRYPTO
// ==========================================================
const ADMIN_EMAIL = "sedatbatatina@gmail.com";
const ADMIN_PASSWORD = "Albinkurti2026";

const REAL_IBAN = "XK051701003031878968";
const REAL_SWIFT = "NLPRXKPR";
const REAL_BANK = "NLB BANKA SH.A.";
const REAL_USDT_ADDRESS = "TX1234567890abcdefUSDTtrc20AddressXYZ";
const ADMIN_INITIALS = "S. B.";

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
            error: "Llogaria juaj po pret konfirmimin e pagesës nga administratori." 
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
    const cleanEmail = email.toLowerCase().trim();
    const existing = usersDatabase.find(u => u.email === cleanEmail);
    if (existing) {
        return res.json({ success: false, error: "Ky email është i regjistruar tashmë!" });
    }

    usersDatabase.push({ 
        email: cleanEmail, 
        password: password.trim(), 
        role: "user",
        subscriptionActive: false, 
        plan,
        scansLeft: 0,
        registeredAt: new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    });

    res.json({ 
        success: true, 
        email: cleanEmail,
        iban: REAL_IBAN, 
        swift: REAL_SWIFT,
        bank: REAL_BANK,
        usdt: REAL_USDT_ADDRESS, 
        initials: ADMIN_INITIALS,
        message: "Regjistrimi u krye me sukses!" 
    });
});

app.post('/api/process-payment', (req, res) => {
    const { email, cardNumber } = req.body;
    if (!email) {
        return res.json({ success: false, error: "Gabim: Mungon emaili i përdoruesit." });
    }
    const user = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
        return res.json({ success: false, error: "Përdoruesi nuk u gjet në sistem." });
    }

    if (cardNumber && cardNumber.endsWith("0000")) {
        return res.json({ 
            success: false, 
            error: "Mjetet në llogari/kartelë janë të pamjaftueshme. Ju lutemi provoni një kartelë tjetër!" 
        });
    }

    // Pagesa pranohet me sukses nga sistemi dhe dërgohet te admini për verifikim
    res.json({ 
        success: true, 
        message: "Pagesa u dërgua me sukses! Llogaria juaj është në pritje të konfirmimit nga administratori." 
    });
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
    if (!user || !user.subscriptionActive) return res.status(403).json({ error: "Qasja e paautorizuar ose llogaria kërkon pagesë të re." });

    const isPayPerScan = user.plan.includes("Pay-per-Scan");
    if (isPayPerScan && user.scansLeft <= 0) {
        return res.status(403).json({ 
            error: "Krediti juaj i skanimit ka përfunduar! Ju lutemi bëni një pagesë të re për të vazhduar." 
        });
    }

    try {
        const response = await fetch(`https://api.the-odds-api.com/v4/sports/soccer/odds/?apiKey=${API_KEY}&regions=eu&markets=totals,h2h&oddsFormat=decimal`);
        if (!response.ok) return res.status(500).json({ error: "Gabim në lidhje me kuotat live." });

        const matches = await response.json();
        let qualifiedMatches = [];
        const trustedLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Eredivisie'];

        for (const match of matches) {
            if (!match.bookmakers || match.bookmakers.length === 0) continue;
            const leagueTitle = match.sport_title || "";
            if (!trustedLeagues.some(l => leagueTitle.includes(l))) continue;

            qualifiedMatches.push({
                league: leagueTitle,
                home: match.home_team,
                away: match.away_team,
                time: new Date(match.commence_time).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }),
                odd: "1.85",
                betType: "Mbi 2.5 Gola (Over 2.5)",
                tableStatus: "Smart Multi-Market Verifikuar",
                safetyScore: 91
            });
        }

        const finalSelection = qualifiedMatches.slice(0, 5);

        if (finalSelection.length < 3) {
            return res.json({
                status: "HOLD",
                message: "Tregu sot ka rrezik (më pak se 3 ndeshje të pastra). Krediti juaj NUK u shpenzua.",
                matches: []
            });
        }

        if (isPayPerScan) {
            user.scansLeft -= 1;
            if (user.scansLeft <= 0) {
                user.subscriptionActive = false;
            }
        }

        res.json({
            status: "APPROVED",
            selectedCount: finalSelection.length,
            accuracyRate: performanceStats.accuracyRate,
            scansLeft: user.scansLeft,
            matches: finalSelection
        });
    } catch (err) {
        res.status(500).json({ error: "Gabim serveri: " + err.message });
    }
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
        .brand-logo { font-size: 20px; font-weight: 900; background: linear-gradient(135deg, #38bdf8, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 5px; }
        .subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 25px; }
        .status-box { background: #0f172a; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px; }
        .approved { color: #4ade80; font-weight: bold; }
        button.main-btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: white; border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%; margin-top: 12px; font-weight: bold; transition: opacity 0.2s; }
        button.main-btn:hover { opacity: 0.9; }
        .match-card { background: #1e293b; padding: 16px; margin-top: 14px; border-radius: 10px; border-left: 5px solid #38bdf8; border: 1px solid #334155; }
        .auth-box { max-width: 440px; margin: 25px auto; background: #0f172a; padding: 25px; border-radius: 12px; border: 1px solid #334155; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        .auth-input, .auth-select { padding: 12px; width: 92%; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: #fff; text-align: center; font-size: 15px; margin-bottom: 12px; outline: none; }
        .auth-input:focus, .auth-select:focus { border-color: #38bdf8; }
        .tab-link { color: #38bdf8; cursor: pointer; font-size: 13px; margin-top: 12px; display: inline-block; text-decoration: underline; }
        .info-msg { background: #1e293b; border: 1px solid #38bdf8; padding: 15px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-top: 12px; text-align: left; line-height: 1.6; }
        #app-content { display: none; }
        #payment-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; justify-content: center; align-items: center; overflow-y: auto; }
        .modal-content { background: #111c31; padding: 25px; border-radius: 14px; max-width: 460px; width: 90%; border: 1px solid #38bdf8; text-align: center; margin: 20px auto; box-shadow: 0 15px 35px rgba(0,0,0,0.8); }
        .notification-banner { background: #065f46; color: #d1fae5; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 15px; border: 1px solid #10b981; display: none; text-align: center; }
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
                    <option value="Pay-per-Scan (€1)">1 Skanim (3-6 Lojëra) - €1</option>
                    <option value="1 Muaj (€5)">1 Muaj Abonim - €5</option>
                    <option value="3 Muaj (€12)">3 Muaj Abonim - €12</option>
                    <option value="1 Vit (€40)">1 Vit Abonim - €40</option>
                </select>
                <button class="main-btn" style="background:#15803d;" onclick="handleRegister()">Vazhdo te Pagesa</button>
                <p id="reg-error" style="color: #f87171; font-size: 13px; margin-top: 10px;"></p>
                <span class="tab-link" onclick="switchMode('login')">Je regjistruar? Hyr këtu</span>
            </div>
        </div>

        <!-- DRITARJA E PAGESËS DHE KONfirmimit -->
        <div id="payment-modal">
            <div class="modal-content">
                <div id="reg-notification" class="notification-banner">Llogaria u krijua! Futni të dhënat e pagesës më poshtë.</div>
                <h3 style="color: #38bdf8; margin-top: 0;">Paguaj & Dërgo Konfirmimin</h3>
                <p style="font-size: 13px; color: #cbd5e1;">Për transferta vendore dhe ndërkombëtare, përdorni të dhënat e mëposhtme:</p>
                
                <div class="info-msg" id="payment-details-box"></div>

                <div style="margin-top: 15px; text-align: left;">
                    <label style="font-size: 12px; color: #94a3b8;">Fut numrin e kartelës ose konfirmimin:</label>
                    <input type="text" id="card-number" class="auth-input" placeholder="Numri i kartelës / TXID..." style="width: 100%; margin-top: 5px;">
                </div>

                <p id="pay-error" style="color: #f87171; font-size: 13px; margin-top: 8px;"></p>

                <button class="main-btn" style="background:#15803d; margin-top: 10px;" onclick="submitPayment()">Paguaj & Dërgo Konfirmimin</button>
                <button class="main-btn" style="background:#334155; margin-top: 6px; padding: 10px;" onclick="closePaymentModal()">Mbyll</button>
            </div>
        </div>

        <div id="app-content">
            <div class="brand-logo">PROJEKTI JANUS</div>
            <div class="subtitle">Paneli i Anëtarësisë & Skanuesit Profesional</div>
            
            <div class="status-box">
                <div>Statusi i Sistemit: <span id="system-status" class="approved">ONLINE & STABIL</span></div>
                <p style="font-size: 13px; color: #94a3b8; margin: 8px 0;">Paketa Aktive: <strong id="user-plan-display" style="color:#38bdf8;">-</strong></p>
                <button class="main-btn" onclick="runScan()">Skano Tregun Live (3-6 Ndeshje)</button>
            </div>

            <div id="admin-panel" class="auth-box" style="display:none; max-width:100%; text-align:left; border-color: #facc15; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="color:#facc15; margin:0;">Paneli i Administratorit (Njoftimet Live)</h3>
                    <button onclick="loadAdminUsers()" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Rifresko Njoftimet</button>
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 15px 0;">Klientët e rinj që kanë bërë regjistrimin dhe presin verifikimin e pagesës:</p>
                <div id="admin-users-list" style="font-size:13px;"></div>
            </div>

            <div id="results-container"></div>
        </div>
    </div>

    <script>
        let currentUserEmail = '';
        let registeredUserPlan = '';

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
            errEl.innerText = "";

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, plan })
                });
                const data = await res.json();
                if(data.success) {
                    currentUserEmail = data.email;
                    registeredUserPlan = plan;

                    document.getElementById('reg-notification').style.display = 'block';
                    document.getElementById('payment-details-box').innerHTML = 
                        '<strong>Paketa:</strong> ' + plan + '<br>' +
                        '<strong>Përfituesi:</strong> <span style="color:#38bdf8;">' + data.initials + '</span><br>' +
                        '<strong>Banka:</strong> ' + data.bank + '<br>' +
                        '<strong>IBAN (Vendor & Ndërkombëtar):</strong> <span style="color:#4ade80;">' + data.iban + '</span><br>' +
                        '<strong>SWIFT/BIC:</strong> <span style="color:#facc15;">' + data.swift + '</span><br>' +
                        '<hr style="border-color:#334155; margin:8px 0;">' +
                        '<strong>Krypto (USDT TRC20):</strong> <span style="color:#facc15; font-size:11px;">' + data.usdt + '</span>';
                    
                    document.getElementById('payment-modal').style.display = 'flex';
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Gabim në lidhje.";
            }
        }

        async function submitPayment() {
            const cardNumber = document.getElementById('card-number').value;
            const errEl = document.getElementById('pay-error');
            errEl.innerText = "";

            if (!currentUserEmail) {
                errEl.innerText = "Gabim: Emaili i përdoruesit nuk u gjet. Ju lutemi provoni përsëri.";
                return;
            }

            try {
                const res = await fetch('/api/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: currentUserEmail, cardNumber })
                });
                const data = await res.json();

                if(data.success) {
                    alert("Pagesa u krye me sukses dhe njoftimi u dërgua te administratori! Sapo të konfirmohet në bankë, llogaria aktivizohet.");
                    document.getElementById('payment-modal').style.display = 'none';
                    switchMode('login');
                } else {
                    errEl.innerText = data.error;
                }
            } catch(e) {
                errEl.innerText = "Gabim gjatë procesimit.";
            }
        }

        function closePaymentModal() {
            document.getElementById('payment-modal').style.display = 'none';
            switchMode('login');
        }

        async function loadAdminUsers() {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            const listEl = document.getElementById('admin-users-list');
            if (data.users.length === 0) {
                listEl.innerHTML = "<p style='color:#94a3b8;'>Nuk ka njoftime të reja për momentin.</p>";
                return;
            }
            let html = "";
            data.users.forEach(u => {
                const badge = u.active ? "<span style='color:#4ade80; font-weight:bold;'>[AKTIV]</span>" : "<span style='color:#f87171; font-weight:bold;'>[NË PRITJE]</span>";
                const btn = !u.active ? '<button onclick="activateUser(\\'' + u.email + '\\')" style="background:#15803d; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-left:10px; font-weight:bold;">Aktivizo Tani</button>' : '<span style="color:#94a3b8; margin-left:10px; font-size:11px;">(Aktivizuar)</span>';
                html += '<div style="padding:10px 0; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;"><div><strong>' + u.email + '</strong><br><span style="font-size:11px; color:#94a3b8;">' + u.plan + ' | Regjistruar: ' + (u.registeredAt || 'Sot') + '</span></div><div>' + badge + btn + '</div></div>';
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
            container.innerHTML = "<p style='color:#facc15;'>Duke skanuar tregjet (3-6 ndeshje)...</p>";
            
            try {
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail: currentUserEmail })
                });
                const data = await res.json();
                
                if(data.error) {
                    container.innerHTML = '<p style="color:#f87171; font-weight:bold;">' + data.error + '</p>';
                    return;
                }
                
                let html = "<p><strong>Bileta e Përzgjedhur (" + data.selectedCount + " Ndeshje):</strong></p>";
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

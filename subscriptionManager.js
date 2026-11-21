'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_PATH = path.join(__dirname, 'users-ledger.json');
const USDT_ADDRESS = process.env.JANUS_USDT_ADDRESS || 'TUEKvgmjmk4jMGZtPqr3uJqH9bTudHQUtm';
const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const REFERRAL_BONUS_DAYS = 10;

const PLANS = {
  '1m': { id: '1m', label: '1 muaj - 10 USDT', priceUsdt: 10, days: 30 },
  '3m': { id: '3m', label: '3 muaj - 25 USDT', priceUsdt: 25, days: 90 },
  '1y': { id: '1y', label: '1 vit - 75 USDT', priceUsdt: 75, days: 365 },
};

function loadStore() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
      return { users: [], usedTxIds: [] };
    }
    const raw = fs.readFileSync(USERS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      usedTxIds: Array.isArray(parsed?.usedTxIds) ? parsed.usedTxIds : [],
    };
  } catch {
    return { users: [], usedTxIds: [] };
  }
}

function saveStore(store) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function isAdminNickname(nickname) {
  return String(nickname || '').trim().toLowerCase() === 'sedat';
}

function buildReferralCode(nickname) {
  return String(nickname || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
}

function evaluateAccountState(user, nowMs = Date.now()) {
  if (!user) return null;

  const refCode = user.referralCode || buildReferralCode(user.nickname);

  if (isAdminNickname(user.nickname)) {
    return {
      ...user,
      referralCode: refCode,
      role: 'ADMIN_MASTER',
      accountStatus: 'ACTIVE',
      isHold: false,
      holdReason: null,
      freeTicketsRemaining: 999999,
      paidTicketsRemaining: 999999,
      referralDaysRemaining: 999,
      minMatchesPerTicket: 3,
      maxMatchesPerTicket: 6,
    };
  }

  const subExpiresMs = user.subscriptionExpiresAt ? Date.parse(user.subscriptionExpiresAt) : 0;
  const hasActivePaidSub = Number.isFinite(subExpiresMs) && subExpiresMs > nowMs;

  const refExpiresMs = user.referralBonusExpiresAt ? Date.parse(user.referralBonusExpiresAt) : 0;
  const hasActiveReferralWindow = Number.isFinite(refExpiresMs) && refExpiresMs > nowMs;
  const referralDaysRemaining = hasActiveReferralWindow
    ? Math.max(1, Math.ceil((refExpiresMs - nowMs) / (24 * 60 * 60 * 1000)))
    : 0;

  if (hasActivePaidSub) {
    const paidRemaining = Math.max(0, Number(user.paidTicketsRemaining ?? 10));
    if (paidRemaining <= 0) {
      return {
        ...user,
        referralCode: refCode,
        referralDaysRemaining,
        role: 'SUBSCRIBER',
        accountStatus: 'HOLD',
        isHold: true,
        holdReason: 'Keni arritur limitin prej 10 tiketash për ciklin aktual të abonimit.',
        freeTicketsRemaining: Math.max(0, Number(user.freeTicketsRemaining ?? 0)),
        paidTicketsRemaining: 0,
        minMatchesPerTicket: 4,
        maxMatchesPerTicket: 6,
      };
    }

    return {
      ...user,
      referralCode: refCode,
      referralDaysRemaining,
      role: 'SUBSCRIBER',
      accountStatus: 'ACTIVE',
      isHold: false,
      holdReason: null,
      freeTicketsRemaining: Math.max(0, Number(user.freeTicketsRemaining ?? 0)),
      paidTicketsRemaining: paidRemaining,
      minMatchesPerTicket: 4,
      maxMatchesPerTicket: 6,
    };
  }

  // Pa abonim me pagesë: lejohet qasje falas nëse ka akoma ditë nga shpërndarja (10 ditë) ose tiketa falas (deri në 3)
  const freeRemaining = Math.max(0, Number(user.freeTicketsRemaining ?? 3));
  const hadReferralBefore = refExpiresMs > 0;

  if (hasActiveReferralWindow || freeRemaining > 0) {
    return {
      ...user,
      referralCode: refCode,
      referralDaysRemaining,
      role: hasActiveReferralWindow ? 'REFERRAL_FREE' : 'FREE_TRIAL',
      accountStatus: 'FREE',
      isHold: false,
      holdReason: null,
      freeTicketsRemaining: hasActiveReferralWindow ? Math.max(freeRemaining, 3) : freeRemaining,
      paidTicketsRemaining: 0,
      minMatchesPerTicket: 3,
      maxMatchesPerTicket: 6,
    };
  }

  return {
    ...user,
    referralCode: refCode,
    referralDaysRemaining: 0,
    role: subExpiresMs > 0 ? 'EXPIRED' : 'HOLD_EXPIRED',
    accountStatus: 'HOLD',
    isHold: true,
    holdReason: hadReferralBefore
      ? 'Kanë kaluar 10 ditët falas nga shpërndarja. Llogaria është në HOLD — shpërndaj linkun tek klientë të tjerë ose abonohet me USDT për të vazhduar.'
      : 'Periudha falas / 3 tiketat falas kanë mbaruar. Llogaria është në HOLD — shpërndaj linkun tek klientë të tjerë ose abonohet me USDT.',
    freeTicketsRemaining: 0,
    paidTicketsRemaining: 0,
    minMatchesPerTicket: 4,
    maxMatchesPerTicket: 6,
  };
}

function sanitizeUserForClient(user) {
  const state = evaluateAccountState(user);
  if (!state) return null;
  const { passwordHash, ...safe } = state;
  return safe;
}

function registerClient({ nickname, password, deviceId, ipAddress, referralBy }) {
  const cleanNick = String(nickname || '').trim();
  const cleanPass = String(password || '').trim();
  const cleanDevice = String(deviceId || '').trim();
  const cleanRefBy = buildReferralCode(referralBy);

  if (cleanNick.length < 2 || cleanPass.length < 4) {
    return { ok: false, error: 'Nickname duhet të ketë të paktën 2 karaktere dhe fjalëkalimi 4.' };
  }
  if (!cleanDevice) {
    return { ok: false, error: 'Mungon identifikuesi i pajisjes (deviceId).' };
  }

  const store = loadStore();

  if (isAdminNickname(cleanNick)) {
    return { ok: false, error: 'Ky nickname është i rezervuar për administratorin.' };
  }

  const nickExists = store.users.some((u) => u.nickname.toLowerCase() === cleanNick.toLowerCase());
  if (nickExists) {
    return { ok: false, error: 'Ky nickname ekziston tashmë. Përdorni Hyrje / Login.' };
  }

  const deviceOwner = store.users.find((u) => u.deviceId === cleanDevice);
  if (deviceOwner) {
    return {
      ok: false,
      error: `Nga kjo pajisje është regjistruar tashmë llogaria "${deviceOwner.nickname}". Lejohet vetëm një llogari për pajisje për të shmangur keqpërdorimin e tiketave falas.`,
    };
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const refCode = buildReferralCode(cleanNick);

  // Nëse regjistrohet përmes linkut të një shpërndarësi, i japim +10 ditë falas shpërndarësit
  let referrerAwarded = null;
  if (cleanRefBy && cleanRefBy !== refCode) {
    const refIdx = store.users.findIndex(
      (u) => buildReferralCode(u.nickname) === cleanRefBy || String(u.referralCode || '').toLowerCase() === cleanRefBy
    );
    if (refIdx !== -1) {
      const referrer = store.users[refIdx];
      const existingRefExp = referrer.referralBonusExpiresAt ? Date.parse(referrer.referralBonusExpiresAt) : 0;
      const baseMs = Number.isFinite(existingRefExp) && existingRefExp > nowMs ? existingRefExp : nowMs;
      referrer.referralBonusExpiresAt = new Date(baseMs + REFERRAL_BONUS_DAYS * 24 * 60 * 60 * 1000).toISOString();
      referrer.referralCount = Number(referrer.referralCount || 0) + 1;
      referrer.freeTicketsRemaining = Math.max(Number(referrer.freeTicketsRemaining || 0), 3);
      referrer.updatedAt = nowIso;
      store.users[refIdx] = referrer;
      referrerAwarded = referrer.nickname;
    }
  }

  const newUser = {
    id: crypto.randomUUID(),
    nickname: cleanNick,
    referralCode: refCode,
    referredBy: referrerAwarded,
    referralCount: 0,
    referralBonusExpiresAt: null,
    passwordHash: hashPassword(cleanPass),
    deviceId: cleanDevice,
    lastIp: ipAddress || null,
    createdAt: nowIso,
    updatedAt: nowIso,
    freeTicketsRemaining: 3,
    freeTicketsUsed: 0,
    subscriptionPlan: null,
    subscriptionStartedAt: null,
    subscriptionExpiresAt: null,
    paidTicketsRemaining: 0,
    paidTicketsUsed: 0,
    lastTxId: null,
  };

  store.users.push(newUser);
  saveStore(store);

  return {
    ok: true,
    referrerAwarded,
    user: sanitizeUserForClient(newUser),
  };
}

function loginClient({ nickname, password, deviceId, ipAddress }) {
  const cleanNick = String(nickname || '').trim();
  const cleanPass = String(password || '').trim();
  const cleanDevice = String(deviceId || '').trim();

  if (!cleanNick || !cleanPass) {
    return { ok: false, error: 'Shkruani nickname dhe fjalëkalimin.' };
  }

  if (isAdminNickname(cleanNick)) {
    return {
      ok: true,
      user: sanitizeUserForClient({
        id: 'admin-master',
        nickname: 'sedat',
        freeTicketsRemaining: 999999,
        paidTicketsRemaining: 999999,
      }),
    };
  }

  const store = loadStore();
  const idx = store.users.findIndex((u) => u.nickname.toLowerCase() === cleanNick.toLowerCase());
  if (idx === -1) {
    return { ok: false, error: 'Llogaria nuk u gjet. Regjistrohuni fillimisht.' };
  }

  const user = store.users[idx];
  if (user.passwordHash !== hashPassword(cleanPass)) {
    return { ok: false, error: 'Fjalëkalimi është i pasaktë.' };
  }

  if (user.deviceId && cleanDevice && user.deviceId !== cleanDevice) {
    return {
      ok: false,
      error: 'Kjo llogari është e lidhur me një pajisje tjetër. Qasja lejohet vetëm nga pajisja e regjistruar.',
    };
  }

  user.lastIp = ipAddress || user.lastIp;
  user.updatedAt = new Date().toISOString();
  store.users[idx] = user;
  saveStore(store);

  return { ok: true, user: sanitizeUserForClient(user) };
}

function getClientState(nickname) {
  if (!nickname) return null;
  if (isAdminNickname(nickname)) {
    return sanitizeUserForClient({ id: 'admin-master', nickname: 'sedat' });
  }
  const store = loadStore();
  const user = store.users.find((u) => u.nickname.toLowerCase() === String(nickname).trim().toLowerCase());
  return user ? sanitizeUserForClient(user) : null;
}

function consumeTicketForUser(nickname, totalAvailableMatches = 0) {
  if (isAdminNickname(nickname)) {
    const count = Math.min(6, Math.max(3, totalAvailableMatches || 4));
    return {
      ok: true,
      ticketSize: count,
      user: sanitizeUserForClient({ id: 'admin-master', nickname: 'sedat' }),
    };
  }

  const store = loadStore();
  const idx = store.users.findIndex((u) => u.nickname.toLowerCase() === String(nickname).trim().toLowerCase());
  if (idx === -1) {
    return { ok: false, error: 'Përdoruesi nuk u gjet.' };
  }

  const state = evaluateAccountState(store.users[idx]);
  if (state.isHold) {
    return {
      ok: false,
      hold: true,
      error: state.holdReason,
      user: sanitizeUserForClient(store.users[idx]),
    };
  }

  const user = store.users[idx];
  const nowIso = new Date().toISOString();

  if (state.accountStatus === 'ACTIVE') {
    const desiredSize = Math.min(6, Math.max(4, totalAvailableMatches || 4));
    user.paidTicketsRemaining = Math.max(0, Number(user.paidTicketsRemaining ?? 10) - 1);
    user.paidTicketsUsed = Number(user.paidTicketsUsed ?? 0) + 1;
    user.updatedAt = nowIso;
    store.users[idx] = user;
    saveStore(store);

    return {
      ok: true,
      ticketSize: desiredSize,
      user: sanitizeUserForClient(user),
    };
  }

  const desiredSize = Math.min(6, Math.max(3, totalAvailableMatches || 3));
  if (!state.referralDaysRemaining || state.referralDaysRemaining <= 0) {
    user.freeTicketsRemaining = Math.max(0, Number(user.freeTicketsRemaining ?? 3) - 1);
  }
  user.freeTicketsUsed = Number(user.freeTicketsUsed ?? 0) + 1;
  user.updatedAt = nowIso;
  store.users[idx] = user;
  saveStore(store);

  return {
    ok: true,
    ticketSize: desiredSize,
    user: sanitizeUserForClient(user),
  };
}

function selectPlanForUsdt(nickname, planId) {
  const plan = PLANS[planId];
  if (!plan) {
    return { ok: false, error: 'Paketa e zgjedhur nuk është e vlefshme.' };
  }
  const state = getClientState(nickname);
  if (!state) {
    return { ok: false, error: 'Llogaria nuk u gjet.' };
  }

  return {
    ok: true,
    plan,
    payment: {
      network: 'TRON (TRC20)',
      wallet: 'Binance',
      address: USDT_ADDRESS,
      amountUsdt: plan.priceUsdt,
      durationDays: plan.days,
      ticketsIncluded: 10,
      matchesPerTicket: '4 - 6 ndeshje',
    },
  };
}

async function verifyUsdtDepositOnChain(txId, expectedAmountUsdt) {
  const cleanTx = String(txId || '').trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(cleanTx)) {
    return { ok: false, error: 'TxID / Hash nuk është në formatin e vlefshëm TRC20 (64 karaktere hex).' };
  }

  try {
    const endpoint = `https://api.trongrid.io/v1/transactions/${cleanTx}/events`;
    const res = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) {
      return { ok: false, error: `Nuk u verifikua transaksioni në rrjetin TRON (HTTP ${res.status}).` };
    }

    const payload = await res.json();
    const events = Array.isArray(payload?.data) ? payload.data : [];

    const matchedTransfer = events.find((ev) => {
      const contractAddr = String(ev?.contract_address || '').trim();
      const eventName = String(ev?.event_name || '').toUpperCase();
      const toAddr = String(ev?.result?.to || ev?.result?._to || '').trim();
      const rawValue = Number(ev?.result?.value || ev?.result?._value || 0);
      const usdtAmount = rawValue / 1e6;

      return (
        eventName === 'TRANSFER' &&
        contractAddr === USDT_TRC20_CONTRACT &&
        toAddr === USDT_ADDRESS &&
        usdtAmount + 1e-6 >= Number(expectedAmountUsdt)
      );
    });

    if (!matchedTransfer) {
      return {
        ok: false,
        error: `Nuk u gjet transferim i konfirmuar USDT (TRC20) me vlerë ≥ ${expectedAmountUsdt} USDT drejt adresës ${USDT_ADDRESS}.`,
      };
    }

    const receivedAmount = Number(matchedTransfer.result.value || matchedTransfer.result._value || 0) / 1e6;
    return { ok: true, txId: cleanTx, amountUsdt: receivedAmount };
  } catch {
    return { ok: false, error: 'Gabim gjatë lidhjes me rrjetin TRON për verifikimin e pagesës.' };
  }
}

async function activateSubscriptionWithPayment({ nickname, planId, txId }) {
  const plan = PLANS[planId];
  if (!plan) {
    return { ok: false, error: 'Zgjidhni paketën: 1 muaj (10 USDT), 3 muaj (25 USDT) ose 1 vit (75 USDT).' };
  }

  const store = loadStore();
  const idx = store.users.findIndex((u) => u.nickname.toLowerCase() === String(nickname || '').trim().toLowerCase());
  if (idx === -1) {
    return { ok: false, error: 'Llogaria nuk u gjet.' };
  }

  const cleanTx = String(txId || '').trim().toLowerCase();
  if (store.usedTxIds.includes(cleanTx)) {
    return { ok: false, error: 'Ky TxID është përdorur tashmë për aktivizim abonimi.' };
  }

  const verification = await verifyUsdtDepositOnChain(cleanTx, plan.priceUsdt);
  if (!verification.ok) {
    return verification;
  }

  const now = new Date();
  const currentUser = store.users[idx];
  const existingExpMs = currentUser.subscriptionExpiresAt ? Date.parse(currentUser.subscriptionExpiresAt) : 0;
  const baseMs = Number.isFinite(existingExpMs) && existingExpMs > now.getTime() ? existingExpMs : now.getTime();
  const newExpiresAt = new Date(baseMs + plan.days * 24 * 60 * 60 * 1000).toISOString();

  currentUser.subscriptionPlan = plan.id;
  currentUser.subscriptionStartedAt = now.toISOString();
  currentUser.subscriptionExpiresAt = newExpiresAt;
  currentUser.paidTicketsRemaining = 10;
  currentUser.lastTxId = cleanTx;
  currentUser.updatedAt = now.toISOString();

  store.users[idx] = currentUser;
  store.usedTxIds.push(cleanTx);
  saveStore(store);

  return {
    ok: true,
    message: `Abonimi (${plan.label}) u aktivizua për ${plan.days} ditë me 10 tiketa (4-6 ndeshje/tiketë).`,
    user: sanitizeUserForClient(currentUser),
  };
}

function listAllClientsForAdmin() {
  const store = loadStore();
  return store.users.map((u) => sanitizeUserForClient(u));
}

module.exports = {
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
  evaluateAccountState,
};

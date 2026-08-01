/* ================================================================
   SPARKCLEAN — FULL POS PORTAL
   Features: Plate entry, receipts, discounts, cash tracking,
   offline IndexedDB, hardware support, analytics, history, customers
   ================================================================ */

const CURRENCY = '\u20A6';
const BANK_ACCOUNT = {
  number: '8055573394',
  bank: 'OPay',
  name: 'Dada Michael Temitayo',
};
const PROD_BACKEND = 'https://carwash-api-ahl3.onrender.com';
let PAY_SERVER = localStorage.getItem('pay_server_url') || (
  location.port === '3000' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.endsWith('.onrender.com')
    ? ''
    : PROD_BACKEND
);
const DB_NAME = 'SparkCleanDB';
const DB_VERSION = 5;

// roundRect polyfill for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

const SERVICES = [
  { id: 'basic', name: 'Basic Wash', price: 2000, additional: 700, icon: 'droplet', desc: 'Exterior wash & dry' },
  { id: 'radiator', name: 'Radiator Wash', price: 1000, additional: 100, icon: 'thermometer', desc: 'Radiator cleaning' },
  { id: 'engine', name: 'Engine Wash', price: 1500, additional: 500, icon: 'settings', desc: 'Engine bay cleaning' },
  { id: 'vacuum', name: 'Vacuum', price: 1500, additional: 300, icon: 'wind', desc: 'Interior vacuum' },
  { id: 'polishing', name: 'Polishing', price: 1000, additional: 100, icon: 'sparkles', desc: 'Paint polishing' },
  { id: 'interior', name: 'Interior Wash', price: 4000, additional: 1000, icon: 'sofa', desc: 'Full interior detail' },
];

const ICONS = {
  droplet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  thermometer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  wind: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
  sparkles: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>',
  sofa: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M4 18v2M20 18v2"/></svg>',
};

/* ============ STATE ============ */
let state = {
  plateNumber: '',
  selectedServices: [],
  attendance: 'drive',
  vehicleType: 'sedan',
  operator: '',
  paymentMethod: null,
  discountType: 'none',
  discountValue: 0,
  discountReason: '',
  orders: [],
  receipts: [],
  customers: {},
  cashDrawer: { id: 'drawer-active', balance: 0, movements: [], shiftStart: null, shiftId: null },
  shiftHistory: [],
  staff: [],
  currentFilter: 'new',
  analyticsPeriod: 'week',
  historyPage: 1,
  lastReceipt: null,
  isOnline: navigator.onLine,
  pendingSync: [],
};

/* ============ AUTHENTICATION ============ */
const AUTH_SESSION_KEY = 'sparkclean_session';
const AUTH_HASH_KEY = 'sparkclean_auth_hash';

// SHA-256 hash via SubtleCrypto
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize default credentials if none stored
async function initAuthCredentials() {
  if (!localStorage.getItem(AUTH_HASH_KEY)) {
    const hash = await hashPassword('admin123');
    localStorage.setItem(AUTH_HASH_KEY, JSON.stringify({ username: 'admin', hash }));
  }
}

function isAuthenticated() {
  const session = localStorage.getItem(AUTH_SESSION_KEY);
  if (!session) return false;
  try {
    const data = JSON.parse(session);
    // Session expires after 24 hours
    if (Date.now() - data.loginTime > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setSession(username) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
    username,
    loginTime: Date.now(),
    lastActivity: Date.now(),
  }));
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function getLoggedInUsername() {
  const session = localStorage.getItem(AUTH_SESSION_KEY);
  if (!session) return null;
  try { return JSON.parse(session).username || null; } catch { return null; }
}

function resolveOperatorFromSession() {
  const username = getLoggedInUsername();
  if (!username) return;
  const match = state.staff.find(s => s.active && s.name.toLowerCase() === username.toLowerCase());
  state.operator = match ? match.name : username.charAt(0).toUpperCase() + username.slice(1);
  const avatar = document.getElementById('sidebarAvatar');
  const nameEl = document.getElementById('sidebarOperatorName');
  const roleEl = document.getElementById('sidebarOperatorRole');
  if (avatar) avatar.textContent = state.operator.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (nameEl) nameEl.textContent = state.operator;
  if (roleEl) roleEl.textContent = match ? (match.role || 'Staff') : 'Staff';
  renderOperatorDropdown();
}

async function authenticateUser(username, password) {
  const stored = JSON.parse(localStorage.getItem(AUTH_HASH_KEY) || '{}');
  if (!stored.username || !stored.hash) return false;
  const inputHash = await hashPassword(password);
  return username === stored.username && inputHash === stored.hash;
}

function showLoginScreen() {
  document.getElementById('loginScreen')?.classList.remove('hidden');
  document.getElementById('topnav')?.classList.add('hidden');
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  setTimeout(() => document.getElementById('loginUsername')?.focus(), 200);
}

function hideLoginScreen() {
  document.getElementById('loginScreen')?.classList.add('hidden');
  document.getElementById('topnav')?.classList.remove('hidden');
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById('view-landing')?.classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername')?.value?.trim() || '';
  const password = document.getElementById('loginPassword')?.value || '';
  const errorEl = document.getElementById('loginError');
  const btnText = document.getElementById('loginBtnText');
  const spinner = document.getElementById('loginSpinner');
  const btn = document.getElementById('loginBtn');

  if (!username || !password) {
    errorEl?.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btnText.textContent = 'Signing in...';
  spinner?.classList.remove('hidden');
  errorEl?.classList.add('hidden');

  // Simulate brief delay for UX
  await new Promise(r => setTimeout(r, 400));

  const valid = await authenticateUser(username, password);
  if (valid) {
    setSession(username);
    hideLoginScreen();
    await initApp();
    startActivityTracking();
  } else {
    errorEl?.classList.remove('hidden');
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
  }

  btn.disabled = false;
  btnText.textContent = 'Sign in';
  spinner?.classList.add('hidden');
}

function handleLogout() {
  if (!confirm('Are you sure you want to log out?')) return;
  clearTimeout(inactivityTimer);
  clearSession();
  cancelPendingPayment();
  location.reload();
}

function toggleLoginPassword() {
  const input = document.getElementById('loginPassword');
  const icon = document.getElementById('eyeIcon');
  if (!input || !icon) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

/* ============ INACTIVITY TIMEOUT (5 min) ============ */
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
let inactivityTimer = null;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(onInactivityTimeout, INACTIVITY_TIMEOUT);
  const session = localStorage.getItem(AUTH_SESSION_KEY);
  if (session) {
    try {
      const data = JSON.parse(session);
      data.lastActivity = Date.now();
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data));
    } catch {}
  }
}

function onInactivityTimeout() {
  if (!isAuthenticated()) return;
  clearSession();
  cancelPendingPayment?.();
  alert('Session expired due to 5 minutes of inactivity.');
  location.reload();
}

function startActivityTracking() {
  const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach(evt => document.addEventListener(evt, resetInactivityTimer, { passive: true }));
  resetInactivityTimer();
}

/* ============ IndexedDB ============ */
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('receipts')) d.createObjectStore('receipts', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('orders')) d.createObjectStore('orders', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('customers')) d.createObjectStore('customers', { keyPath: 'plate' });
      if (!d.objectStoreNames.contains('cashDrawer')) d.createObjectStore('cashDrawer', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('pendingSync')) d.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
      if (!d.objectStoreNames.contains('staff')) d.createObjectStore('staff', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('shiftHistory')) d.createObjectStore('shiftHistory', { keyPath: 'id' });
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e);
  });
}

function dbPut(store, data) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not open');
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

function dbGetAll(store) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not open');
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

function dbDelete(store, key) {
  return new Promise((resolve, reject) => {
    if (!db) return reject('DB not open');
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

function escapeJS(str) {
  if (str == null) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

/* ============ SERVER SYNC ============ */
async function apiGet(path) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const resp = await fetch(`${PAY_SERVER}${path}`, { signal: ctrl.signal });
    if (!resp.ok) throw new Error(`GET ${path} -> ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

async function apiPost(path, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const resp = await fetch(`${PAY_SERVER}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!resp.ok) throw new Error(`POST ${path} -> ${resp.status}`);
    return await resp.json();
  } finally {
    clearTimeout(timer);
  }
}

function docKeyFor(docType, payload) {
  if (docType === 'customers') return payload.plate;
  return payload.id;
}

async function serverPut(docType, payload) {
  await apiPost('/api/pos/sync', {
    docs: [{ doc_type: docType, doc_key: docKeyFor(docType, payload), payload }],
  });
}

function serverUrlReachable() {
  return PAY_SERVER !== null && PAY_SERVER !== undefined;
}

async function loadAllData() {
  let serverLoaded = false;
  if (serverUrlReachable()) {
    try {
      const snap = await apiGet('/api/pos/snapshot');
      if (snap) {
        state.receipts = (snap.receipts || []).filter(x => !x._deleted);
        state.orders = (snap.orders || []).filter(x => !x._deleted);
        state.customers = {};
        (snap.customers || []).filter(c => !c._deleted).forEach(c => { state.customers[c.plate] = c; });
        const drawers = (snap.cashDrawer || []).filter(x => !x._deleted);
        if (drawers.length > 0) {
          const loaded = drawers.find(d => d.id === 'drawer-active') || drawers[drawers.length - 1];
          state.cashDrawer = {
            id: loaded.id || 'drawer-active',
            balance: loaded.balance || 0,
            movements: loaded.movements || [],
            shiftStart: loaded.shiftStart || null,
            shiftId: loaded.shiftId || null,
            staffInCharge: loaded.staffInCharge || null,
          };
        }
        state.staff = (snap.staff || []).filter(x => !x._deleted);
        if (state.staff.length === 0) {
          const defaults = [
            { id: 'staff-1', name: 'Admin', role: 'Supervisor', active: true },
            { id: 'staff-2', name: 'Sarah Ahmad', role: 'Washer', active: true },
            { id: 'staff-3', name: 'Mike Obi', role: 'Washer', active: true },
            { id: 'staff-4', name: 'Grace Bello', role: 'Washer', active: true },
          ];
          for (const s of defaults) await saveStaff(s);
          state.staff = defaults;
        }
        const history = (snap.shiftHistory || []).filter(x => !x._deleted);
        state.shiftHistory = history.sort((a, b) => new Date(b.shiftEnd || b.shiftStart) - new Date(a.shiftEnd || a.shiftStart));
        serverLoaded = true;
        await mirrorToLocal();
        await backfillFromLocal();
      }
    } catch (e) {
      console.warn('Server load failed, using local cache:', e);
    }
  }

  if (!serverLoaded) {
    try {
      state.receipts = await dbGetAll('receipts');
      state.orders = await dbGetAll('orders');
      const customers = await dbGetAll('customers');
      state.customers = {};
      customers.forEach(c => { state.customers[c.plate] = c; });
      const drawers = await dbGetAll('cashDrawer');
      if (drawers.length > 0) {
        const loaded = drawers.find(d => d.id === 'drawer-active') || drawers[drawers.length - 1];
        state.cashDrawer = {
          id: loaded.id || 'drawer-active',
          balance: loaded.balance || 0,
          movements: loaded.movements || [],
          shiftStart: loaded.shiftStart || null,
          shiftId: loaded.shiftId || null,
          staffInCharge: loaded.staffInCharge || null,
        };
      }
      state.staff = await dbGetAll('staff');
      if (state.staff.length === 0) {
        const defaults = [
          { id: 'staff-1', name: 'Admin', role: 'Supervisor', active: true },
          { id: 'staff-2', name: 'Sarah Ahmad', role: 'Washer', active: true },
          { id: 'staff-3', name: 'Mike Obi', role: 'Washer', active: true },
          { id: 'staff-4', name: 'Grace Bello', role: 'Washer', active: true },
        ];
        for (const s of defaults) await dbPut('staff', s);
        state.staff = defaults;
      }
      const history = await dbGetAll('shiftHistory');
      state.shiftHistory = history.sort((a, b) => new Date(b.shiftEnd || b.shiftStart) - new Date(a.shiftEnd || a.shiftStart));
    } catch (e) { console.warn('DB load error:', e); }
  }
}

async function mirrorToLocal() {
  try {
    for (const r of state.receipts) await dbPut('receipts', r);
    for (const o of state.orders) await dbPut('orders', o);
    for (const c of Object.values(state.customers)) await dbPut('customers', c);
    if (state.cashDrawer) await dbPut('cashDrawer', state.cashDrawer);
    for (const s of state.staff) await dbPut('staff', s);
    for (const h of state.shiftHistory) await dbPut('shiftHistory', h);
  } catch (e) { console.warn('mirror to local failed:', e); }
}

async function backfillFromLocal() {
  try {
    const localReceipts = await dbGetAll('receipts');
    for (const r of localReceipts) {
      if (!state.receipts.some(x => x.id === r.id)) { state.receipts.push(r); await saveReceipt(r); }
    }
    const localOrders = await dbGetAll('orders');
    for (const o of localOrders) {
      if (!state.orders.some(x => x.id === o.id)) { state.orders.push(o); await saveOrder(o); }
    }
    const localCustomers = await dbGetAll('customers');
    for (const c of localCustomers) {
      if (!state.customers[c.plate]) { state.customers[c.plate] = c; await saveCustomer(c); }
    }
    const localStaff = await dbGetAll('staff');
    for (const s of localStaff) {
      if (!state.staff.some(x => x.id === s.id)) { state.staff.push(s); await saveStaff(s); }
    }
    const localHistory = await dbGetAll('shiftHistory');
    for (const h of localHistory) {
      if (!state.shiftHistory.some(x => x.id === h.id)) { state.shiftHistory.push(h); await saveShiftHistory(h); }
    }
  } catch (e) { console.warn('backfill from local failed:', e); }
}

async function saveReceipt(r) {
  await dbPut('receipts', r);
  if (serverUrlReachable()) { try { await serverPut('receipts', r); return; } catch (e) { console.warn('receipt sync failed', e); } }
  await addPendingSync({ doc_type: 'receipts', doc_key: r.id, payload: r });
}
async function saveOrder(o) {
  await dbPut('orders', o);
  if (serverUrlReachable()) { try { await serverPut('orders', o); return; } catch (e) { console.warn('order sync failed', e); } }
  await addPendingSync({ doc_type: 'orders', doc_key: o.id, payload: o });
}
async function saveCustomer(c) {
  await dbPut('customers', c);
  if (serverUrlReachable()) { try { await serverPut('customers', c); return; } catch (e) { console.warn('customer sync failed', e); } }
  await addPendingSync({ doc_type: 'customers', doc_key: c.plate, payload: c });
}
async function saveCashDrawer(cd) {
  await dbPut('cashDrawer', cd);
  if (serverUrlReachable()) { try { await serverPut('cashDrawer', cd); return; } catch (e) { console.warn('drawer sync failed', e); } }
  await addPendingSync({ doc_type: 'cashDrawer', doc_key: cd.id, payload: cd });
}
async function saveShiftHistory(sh) {
  await dbPut('shiftHistory', sh);
  if (serverUrlReachable()) { try { await serverPut('shiftHistory', sh); return; } catch (e) { console.warn('shiftHistory sync failed', e); } }
  await addPendingSync({ doc_type: 'shiftHistory', doc_key: sh.id, payload: sh });
}
async function saveStaff(s) {
  await dbPut('staff', s);
  if (serverUrlReachable()) { try { await serverPut('staff', s); return; } catch (e) { console.warn('staff sync failed', e); } }
  await addPendingSync({ doc_type: 'staff', doc_key: s.id, payload: s });
}
async function deleteStaffMember(id) {
  await dbDelete('staff', id);
  const tombstone = { id, _deleted: true };
  if (serverUrlReachable()) {
    try { await serverPut('staff', tombstone); return; }
    catch (e) { console.warn('staff delete sync failed', e); }
  }
  await addPendingSync({ doc_type: 'staff', doc_key: id, payload: tombstone });
}

/* ============ OFFLINE / SYNC ============ */
function setupOffline() {
  window.addEventListener('online', () => {
    state.isOnline = true;
    document.getElementById('offlineBanner')?.classList.add('hidden');
    syncPendingData();
  });
  window.addEventListener('offline', () => {
    state.isOnline = false;
    document.getElementById('offlineBanner')?.classList.remove('hidden');
  });
  if (!state.isOnline) {
    document.getElementById('offlineBanner')?.classList.remove('hidden');
  }
}

async function syncPendingData() {
  const syncEl = document.getElementById('syncStatus');
  if (syncEl) syncEl.textContent = 'Syncing...';
  try {
    const pending = await dbGetAll('pendingSync');
    if (pending.length === 0) {
      if (syncEl) syncEl.textContent = 'All caught up';
      setTimeout(() => { if (syncEl) syncEl.textContent = ''; }, 2000);
      return;
    }
    let sent = 0;
    const failed = [];
    for (const item of pending) {
      try {
        await serverPut(item.doc_type, item.payload);
        await dbDelete('pendingSync', item.id);
        sent++;
      } catch (e) {
        failed.push(item);
      }
    }
    if (syncEl) syncEl.textContent = failed.length === 0 ? `Synced ${sent} items` : `${sent} synced, ${failed.length} waiting`;
    setTimeout(() => { if (syncEl) syncEl.textContent = ''; }, 3000);
  } catch (e) {
    if (syncEl) syncEl.textContent = 'Sync failed, will retry';
  }
}

async function addPendingSync(data) {
  if (!serverUrlReachable()) return;
  await dbPut('pendingSync', { ...data, timestamp: Date.now() });
}

/* ============ NAVIGATION ============ */
function switchPortal(portal) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  if (portal !== 'customer') {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  }
  const btn = document.querySelector(`.nav-btn[data-view="${portal}"]`);
  if (btn) btn.classList.add('active');
  const view = document.getElementById(`view-${portal}`);
  if (view) view.classList.remove('hidden');
  updateBadges();
  if (portal === 'customer') { resetBooking(); }
  if (portal === 'operator') renderOrders();
  if (portal === 'analytics') renderDashboard();
  if (portal === 'history') renderReceiptHistory();
  if (portal === 'customers') renderCustomers();
  if (portal === 'cash') renderCashDrawer();
  if (portal === 'staff') renderStaffManagement();
  window.scrollTo({ top: 0 });
}

function toggleMobileNav() {
  const links = document.getElementById('topnavLinks');
  if (links) links.classList.toggle('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function navigateTo(view) {
  if (view === 'landing') {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-landing')?.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  } else {
    switchPortal(view);
  }
}

function goTo(step) {
  if (step === 'summary') buildSummary();
  document.querySelectorAll('#view-customer .step').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`step-${step}`);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goBack(step) { goTo(step); }

/* ============ PLATE ENTRY ============ */
document.addEventListener('DOMContentLoaded', () => {
  const plateInput = document.getElementById('plateNumber');
  if (plateInput) {
    plateInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
      e.target.value = val;
      state.plateNumber = val;
      checkExistingCustomer(val);
    });
  }
  initDiscountListeners();
});

function checkExistingCustomer(plate) {
  const hint = document.getElementById('existingCustomerHint');
  const fields = document.getElementById('customerFields');
  if (plate && plate.length >= 3 && state.customers[plate]) {
    const c = state.customers[plate];
    if (hint) hint.classList.remove('hidden');
    if (hint) hint.innerHTML = `<strong>Welcome back!</strong> ${escapeHtml(c.name || plate)} — ${c.visits} visit${c.visits !== 1 ? 's' : ''}, ${CURRENCY}${c.totalSpent.toLocaleString()} total spent`;
    if (fields) {
      fields.style.display = 'block';
      const nameInput = document.getElementById('customerNameInput');
      const emailInput = document.getElementById('customerEmailInput');
      const phoneInput = document.getElementById('customerPhoneInput');
      if (nameInput) nameInput.value = c.name || '';
      if (emailInput) emailInput.value = c.email || '';
      if (phoneInput) phoneInput.value = c.phone || '';
    }
  } else if (plate && plate.length >= 3) {
    if (hint) hint.classList.add('hidden');
    if (fields) fields.style.display = 'block';
  } else {
    hint.classList.add('hidden');
    if (fields) fields.style.display = 'none';
  }
}

/* ============ SERVICES ============ */
function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-card" data-id="${s.id}" onclick="toggleService('${s.id}')">
      <div class="sc-check">&#10003;</div>
      <div class="sc-icon">${ICONS[s.icon]}</div>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <div class="sc-price">${CURRENCY}${s.price.toLocaleString()} <span>/ base</span></div>
      <div class="sc-additional">+${CURRENCY}${s.additional.toLocaleString()} per additional</div>
    </div>
  `).join('');
  updateServiceSelection();
}

function toggleService(id) {
  const idx = state.selectedServices.indexOf(id);
  if (idx === -1) state.selectedServices.push(id);
  else state.selectedServices.splice(idx, 1);
  updateServiceSelection();
}

function updateServiceSelection() {
  document.querySelectorAll('.service-card').forEach(card => {
    card.classList.toggle('selected', state.selectedServices.includes(card.dataset.id));
  });
  recalcTotal();
}

function recalcTotal() {
  const count = state.selectedServices.length;
  const subtotal = state.selectedServices.reduce((sum, id) => {
    const s = SERVICES.find(x => x.id === id);
    return sum + (s ? s.price : 0);
  }, 0);

  const discType = document.getElementById('discountType')?.value || 'none';
  const discVal = parseFloat(document.getElementById('discountValue')?.value) || 0;
  state.discountType = discType;
  state.discountValue = discVal;
  state.discountReason = document.getElementById('discountReason')?.value || '';

  let discount = 0;
  if (discType === 'percent') discount = subtotal * (discVal / 100);
  else if (discType === 'fixed') discount = discVal;
  discount = Math.min(discount, subtotal);

  const total = subtotal - discount;
  document.getElementById('selectedSummary').textContent =
    count > 0 ? `${count} service${count > 1 ? 's' : ''} — Total: ${CURRENCY}${total.toLocaleString()}` : 'No services selected';
  document.getElementById('btnToPreferences').disabled = count === 0;
}

function initDiscountListeners() {
  const dt = document.getElementById('discountType');
  const dv = document.getElementById('discountValue');
  if (dt) {
    dt.addEventListener('change', () => {
      dv.disabled = dt.value === 'none';
      if (dt.value === 'none') dv.value = '0';
      recalcTotal();
    });
  }
}

/* ============ PREFERENCES ============ */
function selectAttendance(radio) { state.attendance = radio.value; }

function updateContinueBtn() {
  const btn = document.getElementById('btnToSummary');
  const val = document.getElementById('operatorName')?.value || '';
  if (btn) btn.disabled = !val;
}

/* ============ SUMMARY ============ */
function buildSummary() {
  state.vehicleType = document.getElementById('vehicleType')?.value || 'sedan';
  state.operator = document.getElementById('operatorName')?.value || '';
  const servicesList = state.selectedServices.map(id => SERVICES.find(s => s.id === id)).filter(Boolean);
  const subtotal = servicesList.reduce((sum, s) => sum + s.price, 0);

  let discount = 0;
  if (state.discountType === 'percent') discount = subtotal * (state.discountValue / 100);
  else if (state.discountType === 'fixed') discount = state.discountValue;
  discount = Math.min(discount, subtotal);
  const total = subtotal - discount;

  const discHTML = discount > 0 ? `<div class="sc-discount-row">Discount (${state.discountType === 'percent' ? state.discountValue + '%' : CURRENCY + state.discountValue.toLocaleString()}): -${CURRENCY}${discount.toLocaleString()}</div>` : '';

  document.getElementById('summaryCard').innerHTML = `
    <div class="sc-header"><h3>Order Summary</h3><p>Plate: ${state.plateNumber ? state.plateNumber.toUpperCase() : 'N/A'}</p></div>
    <div class="sc-services">
      ${servicesList.map(s => `<div class="sc-service-row"><span class="sc-service-name">${s.name}</span><span class="sc-service-price">${CURRENCY}${s.price.toLocaleString()}</span></div>`).join('')}
    </div>
    ${discHTML}
    <div class="sc-details">
      <div class="sc-detail-item"><label>Vehicle</label><span>${state.vehicleType.charAt(0).toUpperCase() + state.vehicleType.slice(1)}</span></div>
      <div class="sc-detail-item"><label>Service</label><span>${state.attendance === 'drive' ? 'Walk-In' : 'Pick-Up'}</span></div>
      <div class="sc-detail-item"><label>Staff</label><span>${state.operator}</span></div>
      <div class="sc-detail-item"><label>Plate No.</label><span>${state.plateNumber ? state.plateNumber.toUpperCase() : 'N/A'}</span></div>
    </div>
    <div class="sc-total"><span>Total</span><span class="total-amount">${CURRENCY}${total.toLocaleString()}</span></div>
  `;
}

/* ============ PAYMENT ============ */
function selectPayment(method) {
  state.paymentMethod = method;
  document.getElementById('payOnline').classList.toggle('selected', method === 'online');
  document.getElementById('payCash').classList.toggle('selected', method === 'cash');
  document.getElementById('cashAmountSection').classList.toggle('hidden', method !== 'cash');
  document.getElementById('transferSection').classList.toggle('hidden', method !== 'online');
  document.getElementById('btnPay').disabled = false;

  const servicesList = state.selectedServices.map(id => SERVICES.find(s => s.id === id)).filter(Boolean);
  const subtotal = servicesList.reduce((sum, s) => sum + s.price, 0);
  let discount = 0;
  if (state.discountType === 'percent') discount = subtotal * (state.discountValue / 100);
  else if (state.discountType === 'fixed') discount = state.discountValue;
  const total = subtotal - Math.min(discount, subtotal);

  document.getElementById('btnPay').textContent = method === 'cash' ? `Confirm ${CURRENCY}${total.toLocaleString()} Cash` : `Confirm ${CURRENCY}${total.toLocaleString()}`;

  if (method === 'online') {
    document.getElementById('transferBank').textContent = BANK_ACCOUNT.bank;
    document.getElementById('transferName').textContent = BANK_ACCOUNT.name;
    document.getElementById('transferNumber').textContent = BANK_ACCOUNT.number;
    document.getElementById('transferAmount').textContent = `${CURRENCY}${total.toLocaleString()}`;
  }
}

function calcChange() {
  const servicesList = state.selectedServices.map(id => SERVICES.find(s => s.id === id)).filter(Boolean);
  const subtotal = servicesList.reduce((sum, s) => sum + s.price, 0);
  let discount = 0;
  if (state.discountType === 'percent') discount = subtotal * (state.discountValue / 100);
  else if (state.discountType === 'fixed') discount = state.discountValue;
  const total = subtotal - Math.min(discount, subtotal);
  const received = parseFloat(document.getElementById('cashReceived').value) || 0;
  const change = received - total;
  const changeEl = document.getElementById('changeDisplay');
  const changeAmt = document.getElementById('changeAmount');
  if (received > 0) {
    changeEl.classList.remove('hidden');
    changeAmt.textContent = `${CURRENCY}${Math.abs(change).toLocaleString()}`;
    changeAmt.style.color = change >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('btnPay').disabled = change < 0;
  } else {
    changeEl.classList.add('hidden');
    document.getElementById('btnPay').disabled = true;
  }
}

function processPayment() {
  const btn = document.getElementById('btnPay');
  btn.textContent = 'Processing...';
  btn.disabled = true;

  setTimeout(async () => {
    try {
    const servicesList = state.selectedServices.map(id => SERVICES.find(s => s.id === id)).filter(Boolean);
    const subtotal = servicesList.reduce((sum, s) => sum + s.price, 0);
    let discount = 0;
    if (state.discountType === 'percent') discount = subtotal * (state.discountValue / 100);
    else if (state.discountType === 'fixed') discount = state.discountValue;
    discount = Math.min(discount, subtotal);
    const total = subtotal - discount;

    const receiptNum = 'RC-' + Date.now().toString(36).toUpperCase().slice(-6);
    const now = new Date();

    const receipt = {
      id: receiptNum,
      plateNumber: state.plateNumber ? state.plateNumber.toUpperCase() : 'WALK-IN',
      services: servicesList.map(s => ({ id: s.id, name: s.name, price: s.price })),
      subtotal,
      discountType: state.discountType,
      discountValue: state.discountValue,
      discountAmount: discount,
      discountReason: document.getElementById('discountReason')?.value || '',
      total,
      paymentMethod: state.paymentMethod,
      cashReceived: state.paymentMethod === 'cash' ? parseFloat(document.getElementById('cashReceived')?.value || 0) : 0,
      change: state.paymentMethod === 'cash' ? (parseFloat(document.getElementById('cashReceived')?.value || 0) - total) : 0,
      vehicleType: state.vehicleType,
      attendance: state.attendance,
      operator: state.operator,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      status: state.paymentMethod === 'online' ? 'pending-payment' : 'completed',
      synced: state.isOnline,
    };

    const order = {
      ...receipt,
      id: 'ORD-' + Date.now().toString(36).toUpperCase().slice(-6),
      receiptId: receiptNum,
      status: state.paymentMethod === 'cash' ? 'new' : 'pending-payment',
      orderStatus: state.paymentMethod === 'cash' ? 'cash' : 'pending-payment',
    };

    state.receipts.push(receipt);
    state.orders.push(order);
    state.lastReceipt = receipt;

    // Update customer (skip for walk-ins)
    const plate = receipt.plateNumber;
    if (plate && plate !== 'WALK-IN') {
      const custName = document.getElementById('customerNameInput')?.value?.trim() || '';
      const custEmail = document.getElementById('customerEmailInput')?.value?.trim() || '';
      const custPhone = document.getElementById('customerPhoneInput')?.value?.trim() || '';
      if (state.customers[plate]) {
        state.customers[plate].visits++;
        state.customers[plate].totalSpent += total;
        state.customers[plate].lastVisit = now.toISOString();
        state.customers[plate].recentServices = servicesList.map(s => s.name);
        if (custName) state.customers[plate].name = custName;
        if (custEmail) state.customers[plate].email = custEmail;
        if (custPhone) state.customers[plate].phone = custPhone;
        updateCustomerTier(state.customers[plate]);
      } else {
        state.customers[plate] = {
          plate,
          name: custName,
          email: custEmail,
          phone: custPhone,
          visits: 1,
          totalSpent: total,
          firstVisit: now.toISOString(),
          lastVisit: now.toISOString(),
          recentServices: servicesList.map(s => s.name),
        };
        updateCustomerTier(state.customers[plate]);
      }
    }

    // Cash drawer
    if (state.paymentMethod === 'cash') {
      state.cashDrawer.balance += total;
      state.cashDrawer.movements.push({
        type: 'sale',
        amount: total,
        note: `Sale — ${receiptNum} — ${plate}`,
        timestamp: now.toISOString(),
        receiptId: receiptNum,
        operator: state.operator,
      });
      await saveCashDrawer(state.cashDrawer);
    }

    // Save to IndexedDB
    await saveReceipt(receipt);
    await saveOrder(order);
    if (plate && plate !== 'WALK-IN') await saveCustomer(state.customers[plate]);

    updateBadges();

    if (state.paymentMethod === 'online') {
      await createOpayPayment(receipt, order, total, receiptNum, servicesList, plate);
    } else {
      goTo('confirmation');
      document.getElementById('confSubtitle').textContent = `Receipt ${receiptNum} — ${CURRENCY}${total.toLocaleString()}`;
      document.getElementById('confDetails').innerHTML = `
        <div class="conf-detail"><label>Receipt</label><span>${receiptNum}</span></div>
        <div class="conf-detail"><label>Plate</label><span>${plate}</span></div>
        <div class="conf-detail"><label>Services</label><span>${servicesList.length}</span></div>
        <div class="conf-detail"><label>Total</label><span>${CURRENCY}${total.toLocaleString()}</span></div>
      `;
      launchConfetti();
    }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment processing failed. Please try again.');
    } finally {
      btn.textContent = 'Confirm Payment';
      btn.disabled = false;
    }
  }, 800);
}

/* ─── OPay Payment Integration ─── */
async function createOpayPayment(receipt, order, total, receiptNum, servicesList, plate) {
  goTo('confirmation');
  document.getElementById('confSubtitle').textContent = `Awaiting Payment — ${receiptNum} — ${CURRENCY}${total.toLocaleString()}`;
  document.querySelector('.conf-actions')?.style.setProperty('display', 'none');
  document.getElementById('btnNewSale')?.style.setProperty('display', 'none');
  document.getElementById('confDetails').innerHTML = `
    <div class="conf-detail"><label>Receipt</label><span>${receiptNum}</span></div>
    <div class="conf-detail"><label>Plate</label><span>${plate}</span></div>
    <div class="conf-detail"><label>Services</label><span>${servicesList.length}</span></div>
    <div class="conf-detail"><label>Total</label><span>${CURRENCY}${total.toLocaleString()}</span></div>
    <div id="paymentStatusBox" style="margin-top:12px;padding:14px;background:rgba(99,102,241,0.08);border-radius:8px;text-align:center">
      <div id="paymentSpinner" style="margin-bottom:8px;font-size:1.2rem">⏳</div>
      <div id="paymentStatusText" style="font-size:0.85rem;color:var(--text-secondary)">Creating payment link...</div>
      <div id="paymentLink" style="display:none;margin-top:10px"></div>
      <div id="paymentFallback" style="display:none;margin-top:10px;padding:10px;background:var(--surface);border-radius:6px;text-align:left;font-size:0.8rem">
        <strong>Transfer to:</strong><br/>${BANK_ACCOUNT.bank} — ${BANK_ACCOUNT.name}<br/>Account: <strong>${BANK_ACCOUNT.number}</strong><br/>Amount: <strong>${CURRENCY}${total.toLocaleString()}</strong><br/>Reference: <strong>${receiptNum}</strong>
      </div>
    </div>
  `;

  try {
    const resp = await fetch(`${PAY_SERVER}/api/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: receiptNum,
        amount: total,
        description: `SparkClean — ${receipt.services.map(s => s.name).join(', ')}`,
      }),
    });
    const data = await resp.json();

    if (data.success && data.cashierUrl) {
      document.getElementById('paymentSpinner').textContent = '📱';
      document.getElementById('paymentStatusText').textContent = 'Scan QR or click link to pay';
      document.getElementById('paymentLink').innerHTML = `
        <a href="${data.cashierUrl}" target="_blank" style="display:inline-block;padding:10px 20px;background:var(--primary);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.85rem">Open Payment Link</a>
        <div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted)">Opens OPay checkout in a new tab</div>
      `;
      document.getElementById('paymentLink').style.display = 'block';
      startPaymentPolling(receiptNum, order, receipt);
    } else {
      document.getElementById('paymentSpinner').textContent = '⚠️';
      document.getElementById('paymentStatusText').textContent = 'Could not create payment link. Pay using details below:';
      document.getElementById('paymentFallback').style.display = 'block';
      startPaymentPolling(receiptNum, order, receipt);
    }
  } catch (err) {
    document.getElementById('paymentSpinner').textContent = '⚠️';
    document.getElementById('paymentStatusText').textContent = 'Server offline. Pay using details below:';
    document.getElementById('paymentFallback').style.display = 'block';
    startPaymentPolling(receiptNum, order, receipt);
  }
}

let paymentPollTimer = null;

function startPaymentPolling(reference, order, receipt) {
  if (paymentPollTimer) clearInterval(paymentPollTimer);
  let attempts = 0;
  const maxAttempts = 200;

  paymentPollTimer = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(paymentPollTimer);
      document.getElementById('paymentStatusText').textContent = 'Payment timeout — please confirm manually or try again';
      document.getElementById('paymentSpinner').textContent = '⏰';
      return;
    }
    try {
      const resp = await fetch(`${PAY_SERVER}/api/payment-status/${reference}`);
      const data = await resp.json();

      if (data.status === 'SUCCESS') {
        clearInterval(paymentPollTimer);
        await confirmOnlinePayment(order, receipt);
      } else if (data.status === 'FAILED') {
        clearInterval(paymentPollTimer);
        document.getElementById('paymentStatusText').textContent = 'Payment failed — please try again';
        document.getElementById('paymentSpinner').textContent = '❌';
        document.getElementById('paymentSpinner').style.color = 'var(--danger)';
      }
    } catch (err) {
      // Server might be offline, keep polling
    }
  }, 5000);
}

async function confirmOnlinePayment(order, receipt) {
  cancelPendingPayment();
  order.status = 'new';
  order.orderStatus = 'new';
  receipt.status = 'completed';
  await saveOrder(order);
  await saveReceipt(receipt);

  document.getElementById('confSubtitle').textContent = `Payment Confirmed — ${receipt.id} — ${CURRENCY}${receipt.total.toLocaleString()}`;
  const box = document.getElementById('paymentStatusBox');
  if (box) {
    box.innerHTML = `<div style="font-size:1.5rem;margin-bottom:8px">✅</div><div style="font-size:0.9rem;font-weight:600;color:var(--success)">Payment confirmed!</div>`;
  }
  launchConfetti();

  document.querySelector('.conf-actions')?.style.setProperty('display', '');
  document.getElementById('btnNewSale')?.style.setProperty('display', '');
  updateBadges();
}

function cancelPendingPayment() {
  if (paymentPollTimer) {
    clearInterval(paymentPollTimer);
    paymentPollTimer = null;
  }
}

function resetBooking() {
  cancelPendingPayment();
  document.querySelector('.conf-actions')?.style.setProperty('display', '');
  state.selectedServices = [];
  state.paymentMethod = null;
  state.discountType = 'none';
  state.discountValue = 0;
  state.discountReason = '';
  const dt = document.getElementById('discountType');
  const dv = document.getElementById('discountValue');
  const dr = document.getElementById('discountReason');
  if (dt) dt.value = 'none';
  if (dv) { dv.value = '0'; dv.disabled = true; }
  if (dr) dr.value = '';
  state.plateNumber = '';
  const pi = document.getElementById('plateNumber');
  if (pi) { pi.value = ''; }
  document.getElementById('existingCustomerHint')?.classList.add('hidden');
  const cf = document.getElementById('customerFields');
  if (cf) cf.style.display = 'none';
  const ci = document.getElementById('customerNameInput');
  const ce = document.getElementById('customerEmailInput');
  const cp = document.getElementById('customerPhoneInput');
  if (ci) ci.value = '';
  if (ce) ce.value = '';
  if (cp) cp.value = '';
  document.getElementById('cashAmountSection')?.classList.add('hidden');
  document.getElementById('changeDisplay')?.classList.add('hidden');
  document.getElementById('transferSection')?.classList.add('hidden');
  const cashInput = document.getElementById('cashReceived');
  if (cashInput) cashInput.value = '';
  const changeEl = document.getElementById('changeAmount');
  if (changeEl) changeEl.textContent = '';
  goTo('plate');
  renderServices();
  renderOperatorDropdown();
  setTimeout(() => document.getElementById('plateNumber')?.focus(), 100);
}

/* ============ RECEIPT PRINTING ============ */
function printReceipt() {
  const r = state.lastReceipt;
  if (!r) return;
  if (r.paymentMethod === 'cash') openCashDrawer();
  doPrint(r);
}

function printSpecificReceipt(id) {
  const r = state.receipts.find(x => x.id === id);
  if (!r) return;
  doPrint(r);
}

function doPrint(r) {
  const printArea = document.getElementById('receiptPrintArea');
  printArea.innerHTML = `
    <div style="font-family:monospace;width:72mm;padding:2mm;color:#000;background:#fff;font-size:8px;line-height:1.2">
      <div style="text-align:center;margin-bottom:2mm">
        <div style="font-size:12px;font-weight:bold">SparkClean</div>
        <div style="font-size:7px">Premium Car Wash</div>
        <div style="font-size:7px">-------------------------------</div>
      </div>
      <div style="font-size:7px;margin-bottom:2mm">
        <div>${r.id} &nbsp; ${new Date(r.timestamp).toLocaleString()}</div>
        <div>Plate: ${r.plateNumber} &nbsp; Staff: ${r.operator}</div>
        <div>Vehicle: ${r.vehicleType || 'N/A'}</div>
      </div>
      <div style="border-top:1px dashed #000;margin:1mm 0"></div>
      ${(r.services || []).map(s => `<div style="display:flex;justify-content:space-between;font-size:7px"><span>${s.name}</span><span>${CURRENCY}${(s.price || 0).toLocaleString()}</span></div>`).join('')}
      <div style="border-top:1px dashed #000;margin:1mm 0"></div>
      <div style="font-size:7px"><div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${CURRENCY}${r.subtotal.toLocaleString()}</span></div></div>
      ${r.discountAmount > 0 ? `<div style="font-size:7px"><div style="display:flex;justify-content:space-between"><span>Discount</span><span>-${CURRENCY}${r.discountAmount.toLocaleString()}</span></div></div>` : ''}
      <div style="font-size:10px;font-weight:bold;margin-top:1mm"><div style="display:flex;justify-content:space-between"><span>TOTAL</span><span>${CURRENCY}${r.total.toLocaleString()}</span></div></div>
      <div style="border-top:1px dashed #000;margin:1mm 0"></div>
      <div style="font-size:7px">
        <div>${r.paymentMethod === 'cash' ? 'CASH' : 'CARD/POS'}${r.paymentMethod === 'cash' ? ` | Received: ${CURRENCY}${(r.cashReceived || 0).toLocaleString()} | Change: ${CURRENCY}${(r.change || 0).toLocaleString()}` : ''}</div>
        ${r.paymentMethod === 'online' ? `<div style="margin-top:2px"><strong>Transfer to:</strong> ${BANK_ACCOUNT.bank} | ${BANK_ACCOUNT.name} | ${BANK_ACCOUNT.number}</div>` : ''}
      </div>
      <div style="text-align:center;margin-top:2mm;font-size:6px;color:#666">Thank you for your patronage!</div>
    </div>
  `;
  window.print();
}

async function openCashDrawer() {
  try {
    const resp = await fetch('http://localhost:8121/open', { method: 'POST', signal: AbortSignal.timeout(1000) });
    if (resp.ok) return true;
  } catch (e) { /* drawer not connected */ }
  console.log('Cash drawer: hardware not detected (normal in browser)');
  return false;
}

/* ============ CONFETTI ============ */
function launchConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.width = (Math.random() * 8 + 5) + 'px';
    p.style.height = (Math.random() * 8 + 5) + 'px';
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 3500);
}

/* ============ OPERATOR / ORDERS ============ */
function renderOrders() {
  updateBadges();
  const search = document.getElementById('searchOrders')?.value?.toLowerCase() || '';
  let filtered = state.orders;
  if (state.currentFilter !== 'all') {
    if (state.currentFilter === 'cash') {
      filtered = filtered.filter(o => o.orderStatus === 'cash' || o.orderStatus === 'pending-payment');
    } else {
      filtered = filtered.filter(o => o.orderStatus === state.currentFilter);
    }
  }
  if (search) {
    filtered = filtered.filter(o =>
      (o.id || '').toLowerCase().includes(search) ||
      (o.plateNumber || '').toLowerCase().includes(search) ||
      (o.operator || '').toLowerCase().includes(search)
    );
  }
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const grid = document.getElementById('ordersGrid');
  if (!grid) return;
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".4"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg><h3>No orders found</h3><p>Start a new sale from the POS terminal</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(order => {
    const status = order.orderStatus || order.status;
    const statusLabels = { new: 'New', accepted: 'Accepted', 'in-progress': 'In Progress', completed: 'Completed', ready: 'Ready', cash: 'Cash Pending', 'pending-payment': 'Awaiting Payment', delivered: 'Delivered' };
    return `
    <div class="order-card" data-id="${order.id}">
      <div class="order-top">
        <div>
          <div class="order-id">${order.id}</div>
          <div class="order-plate">${order.plateNumber || 'N/A'}</div>
        </div>
        <span class="order-status status-${status}">${statusLabels[status] || status}</span>
      </div>
      <div class="order-services">${(order.services || []).map(s => `<span class="order-service-tag">${s.name || s}</span>`).join('')}</div>
      <div class="order-meta">
        <div class="order-meta-item"><label>Staff</label><span>${escapeHtml(order.operator || 'N/A')}</span></div>
        <div class="order-meta-item"><label>Payment</label><span>${order.paymentMethod === 'cash' ? 'Cash' : 'Card'}</span></div>
        <div class="order-meta-item"><label>Vehicle</label><span>${(order.vehicleType || 'N/A').charAt(0).toUpperCase() + (order.vehicleType || '').slice(1)}</span></div>
        <div class="order-meta-item"><label>Model</label><span>${order.attendance === 'drive' ? 'Walk-In' : 'Pick-Up'}</span></div>
      </div>
      <div class="order-amount"><span class="order-amount-label">Total</span><span class="order-amount-value">${CURRENCY}${(order.total || 0).toLocaleString()}</span></div>
      <div class="order-actions">${getOrderActions(status, order.id, state.currentFilter)}</div>
    </div>`;
  }).join('');
  updateBadges();
}

function getOrderActions(status, orderId, filter) {
  const disabled = filter === 'all';
  const disAttr = disabled ? ' disabled style="opacity:0.4;cursor:not-allowed"' : '';
  const actions = {
    'new': `<button class="btn btn-primary"${disAttr} onclick="updateOrderStatus('${orderId}','in-progress')">Start Service</button>`,
    'in-progress': `<button class="btn btn-success"${disAttr} onclick="updateOrderStatus('${orderId}','completed')">Complete</button>`,
    'completed': `<button class="btn btn-primary"${disAttr} onclick="updateOrderStatus('${orderId}','ready')">Ready</button>`,
    'ready': `<button class="btn btn-outline"${disAttr} onclick="deliverOrder('${orderId}')" style="border-color:var(--success);color:var(--success)">Delivered</button>`,
    'cash': `<button class="btn btn-success"${disAttr} onclick="confirmCashOrder('${orderId}')">Confirm Cash</button>`,
    'pending-payment': `<button class="btn btn-success"${disAttr} onclick="confirmOnlinePaymentManually('${orderId}')">Confirm Payment</button>`,
    'delivered': `<span style="color:var(--success);font-size:0.75rem;font-weight:600">✓ Delivered</span>`,
  };
  return actions[status] || '';
}

async function updateOrderStatus(id, newStatus) {
  const order = state.orders.find(o => o.id === id);
  if (order) { order.orderStatus = newStatus; await saveOrder(order); renderOrders(); }
}

async function confirmCashOrder(id) {
  const order = state.orders.find(o => o.id === id);
  if (order) { order.orderStatus = 'new'; order.status = 'new'; await saveOrder(order); renderOrders(); }
}

async function confirmOnlinePaymentManually(id) {
  const order = state.orders.find(o => o.id === id);
  if (!order) return;
  order.orderStatus = 'new';
  order.status = 'new';
  const receipt = state.receipts.find(r => r.id === order.receiptId);
  if (receipt) { receipt.status = 'completed'; await saveReceipt(receipt); }
  await saveOrder(order);
  cancelPendingPayment();
  renderOrders();
}

async function deliverOrder(id) {
  const order = state.orders.find(o => o.id === id);
  if (order) {
    order.orderStatus = 'delivered';
    order.status = 'delivered';
    await saveOrder(order);
  }
  updateBadges();
  renderOrders();
}

function filterOrders(filter, btn) {
  state.currentFilter = filter;
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  btn.classList.add('active');
  const titles = { all: ['All Orders', ''], new: ['New Orders', 'Awaiting action'], 'in-progress': ['In Progress', 'Currently servicing'], completed: ['Completed', 'Finished services'], ready: ['Ready', 'Awaiting pickup'], cash: ['Cash Pending', 'Awaiting confirmation'] };
  const [t, s] = titles[filter] || ['All Orders', ''];
  document.getElementById('dashboardTitle').textContent = t;
  document.getElementById('dashboardSubtitle').textContent = s;
  renderOrders();
}

function updateBadges() {
  const counts = { all: state.orders.length, new: 0, 'in-progress': 0, completed: 0, ready: 0, cash: 0, delivered: 0 };
  state.orders.forEach(o => {
    const s = o.orderStatus || o.status;
    if (s === 'cash' || s === 'pending-payment') counts.cash++;
    else if (counts[s] !== undefined) counts[s]++;
  });
  const el = (id) => document.getElementById(id);
  if (el('badgeAll')) el('badgeAll').textContent = counts.all;
  if (el('badgeNew')) el('badgeNew').textContent = counts.new;
  if (el('badgeInProgress')) el('badgeInProgress').textContent = counts['in-progress'];
  if (el('badgeCompleted')) el('badgeCompleted').textContent = counts.completed;
  if (el('badgeReady')) el('badgeReady').textContent = counts.ready;
  if (el('badgeCash')) el('badgeCash').textContent = counts.cash;
}

/* ============ DASHBOARD ============ */
function setAnalyticsPeriod(period, btn) {
  state.analyticsPeriod = period;
  document.querySelectorAll('.analytics-period .btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDashboard();
}

function filterPeriod(receipts, period, now) {
  let periodReceipts, prevReceipts, periodLabel;
  if (period === 'today') {
    const today = now.toISOString().split('T')[0];
    periodReceipts = receipts.filter(r => r.date === today);
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    prevReceipts = receipts.filter(r => r.date === yesterday.toISOString().split('T')[0]);
    periodLabel = 'vs yesterday';
  } else if (period === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    periodReceipts = receipts.filter(r => new Date(r.timestamp) >= weekAgo);
    prevReceipts = receipts.filter(r => { const d = new Date(r.timestamp); return d >= twoWeeksAgo && d < weekAgo; });
    periodLabel = 'vs prev week';
  } else if (period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    periodReceipts = receipts.filter(r => new Date(r.timestamp) >= monthStart);
    prevReceipts = receipts.filter(r => { const d = new Date(r.timestamp); return d >= prevMonthStart && d < monthStart; });
    periodLabel = 'vs prev month';
  } else {
    periodReceipts = [...receipts];
    prevReceipts = [];
    periodLabel = '';
  }
  return { periodReceipts, prevReceipts, periodLabel };
}

function pctChange(curr, prev) {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev * 100);
}

function renderDashboard() {
  const now = new Date();
  const receipts = state.receipts;
  const period = state.analyticsPeriod;
  const { periodReceipts, prevReceipts, periodLabel } = filterPeriod(receipts, period, now);

  const totalSales = periodReceipts.reduce((s, r) => s + r.total, 0);
  const prevSales = prevReceipts.reduce((s, r) => s + r.total, 0);
  const salesDelta = pctChange(totalSales, prevSales);

  const cashSales = periodReceipts.filter(r => r.paymentMethod === 'cash' && r.status !== 'refunded').reduce((s, r) => s + r.total, 0);
  const cardSales = periodReceipts.filter(r => r.paymentMethod === 'online' && r.status !== 'refunded').reduce((s, r) => s + r.total, 0);
  const refundedTotal = periodReceipts.filter(r => r.status === 'refunded').reduce((s, r) => s + r.total, 0);
  const transferSales = totalSales - cashSales - cardSales - refundedTotal;
  const uniquePlates = new Set(periodReceipts.map(r => r.plateNumber)).size;
  const avgTicket = periodReceipts.length > 0 ? Math.round(totalSales / periodReceipts.length) : 0;
  const prevAvg = prevReceipts.length > 0 ? Math.round(prevSales / prevReceipts.length) : 0;
  const avgDelta = pctChange(avgTicket, prevAvg);

  const customers = state.customers || {};
  const loyaltyCounts = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  Object.values(customers).forEach(c => {
    const tier = c.loyaltyTier || computeLoyaltyTier(c.totalSpent, c.visits);
    const key = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
    if (loyaltyCounts[key] !== undefined) loyaltyCounts[key]++;
  });

  document.getElementById('kpiGrid').innerHTML = [
    kpiCard('Revenue', `${CURRENCY}${totalSales.toLocaleString()}`, salesDelta, periodLabel),
    kpiCard('Transactions', periodReceipts.length.toLocaleString(), pctChange(periodReceipts.length, prevReceipts.length), periodLabel),
    kpiCard('Avg Ticket', `${CURRENCY}${avgTicket.toLocaleString()}`, avgDelta, periodLabel),
    kpiCard('Unique Vehicles', uniquePlates.toLocaleString(), null, ''),
    kpiCard('Cash Sales', `${CURRENCY}${cashSales.toLocaleString()}`, null, ''),
    kpiCard('Card Sales', `${CURRENCY}${cardSales.toLocaleString()}`, null, ''),
  ].join('');

  drawRevenueChart(periodReceipts);
  drawPaymentDonut(cashSales, cardSales, transferSales);
  renderServicePopularity(periodReceipts);
  renderLoyaltyBreakdown(loyaltyCounts);
  drawPeakHoursChart(periodReceipts);
  renderTopCustomers();
  renderStaffLeaderboard(periodReceipts);
  renderCashReconciliation(cashSales);
  renderRecentTransactions();
}

function kpiCard(label, value, delta, deltaLabel) {
  let deltaHtml = '';
  if (delta !== null && delta !== undefined) {
    const up = delta >= 0;
    deltaHtml = `<div class="kpi-change ${up ? 'up' : 'down'}">${up ? '\u2191' : '\u2193'} ${Math.abs(delta).toFixed(1)}% ${deltaLabel}</div>`;
  }
  return `<div class="kpi-card"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div>${deltaHtml}</div>`;
}

function drawRevenueChart(receipts) {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth - 40;
  const h = 250;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const dayMap = {};
  receipts.forEach(r => { dayMap[r.date] = (dayMap[r.date] || 0) + r.total; });
  const entries = Object.entries(dayMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  if (entries.length === 0) {
    ctx.fillStyle = '#55556a'; ctx.font = '14px Inter'; ctx.textAlign = 'center';
    ctx.fillText('No revenue data', w / 2, h / 2); return;
  }
  const maxVal = Math.max(...entries.map(e => e[1]), 1);
  const barW = Math.min(40, (w - 60) / entries.length - 8);
  const startX = 40;

  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(startX, 10); ctx.lineTo(startX, h - 30); ctx.lineTo(w - 10, h - 30); ctx.stroke();

  entries.forEach((entry, i) => {
    const x = startX + 10 + i * (barW + 8);
    const barH = (entry[1] / maxVal) * (h - 60);
    const gradient = ctx.createLinearGradient(x, h - 30 - barH, x, h - 30);
    gradient.addColorStop(0, '#818cf8'); gradient.addColorStop(1, '#4f46e5');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.roundRect(x, h - 30 - barH, barW, barH, 4); ctx.fill();
    ctx.fillStyle = '#8888a0'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
    ctx.fillText(entry[0].slice(5), x + barW / 2, h - 14);
    ctx.fillStyle = '#f0f0f5'; ctx.font = 'bold 9px Inter';
    ctx.fillText(CURRENCY + (entry[1] / 1000).toFixed(0) + 'k', x + barW / 2, h - 34 - barH);
  });
}

function drawPaymentDonut(cash, card, transfer) {
  const canvas = document.getElementById('servicesChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = 300, h = 250;
  canvas.width = w; canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const total = cash + card + transfer;
  if (total === 0) {
    ctx.fillStyle = '#55556a'; ctx.font = '14px Inter'; ctx.textAlign = 'center';
    ctx.fillText('No payment data', w / 2, h / 2); return;
  }

  const data = [
    { label: 'Cash', value: cash, color: '#22c55e' },
    { label: 'Card/Online', value: card, color: '#6366f1' },
    { label: 'Transfer', value: transfer, color: '#06b6d4' },
  ].filter(d => d.value > 0);

  const cx = w / 2, cy = 110, r = 80, inner = 48;
  let startAngle = -Math.PI / 2;
  data.forEach(d => {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + slice); ctx.closePath();
    ctx.fillStyle = d.color; ctx.fill();
    startAngle += slice;
  });
  ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#0f0f18'; ctx.fill();
  ctx.fillStyle = '#f0f0f5'; ctx.font = 'bold 16px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(CURRENCY + (total / 1000).toFixed(0) + 'k', cx, cy - 6);
  ctx.fillStyle = '#8888a0'; ctx.font = '10px Inter';
  ctx.fillText('Total', cx, cy + 10);

  const legendY = h - 30;
  data.forEach((d, i) => {
    const lx = 30 + i * 95;
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.roundRect(lx, legendY, 10, 10, 2); ctx.fill();
    ctx.fillStyle = '#ccc'; ctx.font = '10px Inter'; ctx.textAlign = 'left';
    ctx.fillText(`${d.label} (${Math.round(d.value / total * 100)}%)`, lx + 14, legendY + 9);
  });
}

function renderServicePopularity(receipts) {
  const el = document.getElementById('servicePopularity');
  if (!el) return;
  const svcMap = {};
  receipts.forEach(r => {
    (r.services || []).forEach(s => {
      const name = s.name || s;
      svcMap[name] = (svcMap[name] || 0) + 1;
    });
  });
  const entries = Object.entries(svcMap).sort((a, b) => b[1] - a[1]);
  const maxVal = Math.max(...entries.map(e => e[1]), 1);
  const total = entries.reduce((s, e) => s + e[1], 0) || 1;
  const colors = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

  el.innerHTML = entries.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:2rem">No data</p>'
    : entries.map(([name, count], i) => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="width:120px;color:var(--text-secondary);font-size:0.8rem;text-align:right">${name.length > 16 ? name.slice(0, 16) + '...' : name}</span>
        <div style="flex:1;height:20px;background:#1a1a2e;border-radius:4px;overflow:hidden">
          <div style="width:${count / maxVal * 100}%;height:100%;background:${colors[i % colors.length]};border-radius:4px;transition:width 0.4s"></div>
        </div>
        <span style="color:var(--text-secondary);font-size:0.8rem;width:70px">${count} (${Math.round(count / total * 100)}%)</span>
      </div>
    `).join('');
}

function renderLoyaltyBreakdown(counts) {
  const el = document.getElementById('loyaltyBreakdown');
  if (!el) return;
  const tiers = [
    { name: 'Platinum', color: '#a855f7', icon: '\u2B50' },
    { name: 'Gold', color: '#f59e0b', icon: '\uD83D\uDD36' },
    { name: 'Silver', color: '#94a3b8', icon: '\u26AA' },
    { name: 'Bronze', color: '#cd7f32', icon: '\uD83D\uDFE3' },
  ];
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;

  el.innerHTML = tiers.map(t => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="width:24px;text-align:center;font-size:1.1rem">${t.icon}</span>
      <span style="width:70px;color:var(--text-secondary);font-size:0.85rem">${t.name}</span>
      <div style="flex:1;height:22px;background:#1a1a2e;border-radius:4px;overflow:hidden">
        <div style="width:${counts[t.name] / total * 100}%;height:100%;background:${t.color};border-radius:4px;transition:width 0.4s"></div>
      </div>
      <span style="color:var(--text-secondary);font-size:0.85rem;width:80px;text-align:right">${counts[t.name]} customer${counts[t.name] !== 1 ? 's' : ''}</span>
    </div>
  `).join('') + `<p style="color:var(--text-muted);font-size:0.75rem;margin-top:8px;text-align:center">${total} total customers</p>`;
}

function drawPeakHoursChart(receipts) {
  const canvas = document.getElementById('peakHoursChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.parentElement.clientWidth - 40;
  const h = 220;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const hourMap = new Array(24).fill(0);
  receipts.forEach(r => {
    if (r.timestamp) { const hr = new Date(r.timestamp).getHours(); hourMap[hr]++; }
  });
  const maxVal = Math.max(...hourMap, 1);
  const barW = Math.min(28, (w - 80) / 24 - 4);
  const startX = 50;

  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(startX, 10); ctx.lineTo(startX, h - 30); ctx.lineTo(w - 10, h - 30); ctx.stroke();

  for (let hr = 0; hr < 24; hr++) {
    const x = startX + 10 + hr * (barW + 4);
    const barH = (hourMap[hr] / maxVal) * (h - 60);
    const isPeak = hourMap[hr] === maxVal && maxVal > 0;
    const gradient = ctx.createLinearGradient(x, h - 30 - barH, x, h - 30);
    gradient.addColorStop(0, isPeak ? '#f59e0b' : '#06b6d4');
    gradient.addColorStop(1, isPeak ? '#d97706' : '#0891b2');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.roundRect(x, h - 30 - barH, barW, barH, 3); ctx.fill();
    if (hr % 3 === 0) {
      ctx.fillStyle = '#8888a0'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
      ctx.fillText(hr + ':00', x + barW / 2, h - 14);
    }
    if (hourMap[hr] > 0) {
      ctx.fillStyle = '#f0f0f5'; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center';
      ctx.fillText(hourMap[hr], x + barW / 2, h - 34 - barH);
    }
  }
}

function renderTopCustomers() {
  const el = document.getElementById('topCustomers');
  if (!el) return;
  const customers = Object.values(state.customers || {})
    .filter(c => c.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8);
  const tierColors = { platinum: '#a855f7', gold: '#f59e0b', silver: '#94a3b8', bronze: '#cd7f32' };
  el.innerHTML = customers.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:2rem">No customer data yet</p>'
    : '<table class="staff-table"><thead><tr><th>#</th><th>Customer</th><th>Visits</th><th>Spent</th><th>Tier</th></tr></thead><tbody>'
    + customers.map((c, i) => `<tr>
      <td>${i + 1}</td>
      <td>${escapeHtml(c.plate || 'N/A')}${c.name ? ' (' + escapeHtml(c.name) + ')' : ''}</td>
      <td>${c.visits || 0}</td>
      <td>${CURRENCY}${(c.totalSpent || 0).toLocaleString()}</td>
      <td><span style="color:${tierColors[c.loyaltyTier] || '#888'};font-weight:600">${c.loyaltyTier || '-'}</span></td>
    </tr>`).join('')
    + '</tbody></table>';
}

function renderStaffLeaderboard(receipts) {
  const el = document.getElementById('staffTable');
  if (!el) return;
  const staffMap = {};
  receipts.forEach(r => {
    if (!staffMap[r.operator]) staffMap[r.operator] = { count: 0, total: 0, cash: 0, card: 0 };
    staffMap[r.operator].count++;
    staffMap[r.operator].total += r.total;
    if (r.paymentMethod === 'cash') staffMap[r.operator].cash += r.total;
    else staffMap[r.operator].card += r.total;
  });
  const sorted = Object.entries(staffMap).sort((a, b) => b[1].total - a[1].total);
  el.innerHTML = sorted.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:2rem">No staff data</p>'
    : '<table class="staff-table"><thead><tr><th>Staff</th><th>Orders</th><th>Sales</th><th>Avg</th></tr></thead><tbody>'
    + sorted.map(([name, d]) => `<tr>
      <td>${escapeHtml(name)}</td><td>${d.count}</td>
      <td>${CURRENCY}${d.total.toLocaleString()}</td>
      <td>${CURRENCY}${Math.round(d.total / d.count).toLocaleString()}</td>
    </tr>`).join('') + '</tbody></table>';
}

function renderCashReconciliation(cashSales) {
  const el = document.getElementById('cashReconciliation');
  if (!el) return;
  const now = new Date();
  const period = state.analyticsPeriod;
  const cd = state.cashDrawer;
  const periodMovements = cd.movements.filter(m => {
    if (period === 'today') return m.timestamp.slice(0, 10) === now.toISOString().slice(0, 10);
    if (period === 'week') { const wa = new Date(now); wa.setDate(wa.getDate() - 7); return new Date(m.timestamp) >= wa; }
    if (period === 'month') return new Date(m.timestamp) >= new Date(now.getFullYear(), now.getMonth(), 1);
    return true;
  });
  const cashIns = periodMovements.filter(m => m.type === 'cash-in').reduce((s, m) => s + m.amount, 0);
  const cashOuts = periodMovements.filter(m => m.type === 'cash-out').reduce((s, m) => s + m.amount, 0);
  const allCashSales = cd.movements.filter(m => m.type === 'sale').reduce((s, m) => s + m.amount, 0);
  const allCashIns = cd.movements.filter(m => m.type === 'cash-in').reduce((s, m) => s + m.amount, 0);
  const allCashOuts = cd.movements.filter(m => m.type === 'cash-out').reduce((s, m) => s + m.amount, 0);
  const expected = allCashSales + allCashIns - allCashOuts;
  const variance = cd.balance - expected;

  el.innerHTML = `
    <div class="recon-row"><span class="recon-label">Float Added</span><span class="recon-value">${CURRENCY}${cashIns.toLocaleString()}</span></div>
    <div class="recon-row"><span class="recon-label">Cash Sales</span><span class="recon-value">${CURRENCY}${cashSales.toLocaleString()}</span></div>
    <div class="recon-row"><span class="recon-label">Cash Out</span><span class="recon-value cs-negative">-${CURRENCY}${cashOuts.toLocaleString()}</span></div>
    <div class="recon-row recon-total"><span class="recon-label">Expected</span><span class="recon-value">${CURRENCY}${expected.toLocaleString()}</span></div>
    <div class="recon-row recon-total"><span class="recon-label">Actual</span><span class="recon-value ${Math.abs(variance) < 1 ? 'cs-positive' : 'cs-negative'}">${CURRENCY}${cd.balance.toLocaleString()}</span></div>
    <div class="recon-row"><span class="recon-label">Variance</span><span class="recon-value ${variance >= 0 ? 'cs-positive' : 'cs-negative'}">${variance >= 0 ? '+' : ''}${CURRENCY}${Math.abs(variance).toLocaleString()}</span></div>
  `;
}

function renderRecentTransactions() {
  const el = document.getElementById('recentTransactions');
  if (!el) return;
  const recent = [...state.receipts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
  el.innerHTML = recent.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:2rem">No transactions yet</p>'
    : '<table class="staff-table"><thead><tr><th>Time</th><th>Plate</th><th>Amount</th><th>Method</th></tr></thead><tbody>'
    + recent.map(r => {
      const t = new Date(r.timestamp);
      const timeStr = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const method = r.paymentMethod === 'cash' ? 'Cash' : r.paymentMethod === 'online' ? 'Card' : 'Other';
      return `<tr><td>${timeStr}</td><td>${r.plateNumber || 'WALK-IN'}</td><td>${CURRENCY}${r.total.toLocaleString()}</td><td>${method}</td></tr>`;
    }).join('') + '</tbody></table>';
}

/* ============ STAFF MANAGEMENT ============ */
function renderStaffManagement() {
  const staff = state.staff;
  const active = staff.filter(s => s.active);
  const inactive = staff.filter(s => !s.active);

  // KPIs
  const totalStaff = staff.length;
  const activeCount = active.length;
  const receipts = state.receipts;
  const staffSales = {};
  receipts.forEach(r => {
    if (!staffSales[r.operator]) staffSales[r.operator] = { count: 0, total: 0 };
    staffSales[r.operator].count++;
    staffSales[r.operator].total += r.total;
  });
  const topPerformer = Object.entries(staffSales).sort((a, b) => b[1].total - a[1].total)[0];

  document.getElementById('staffKpis').innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Total Staff</div><div class="kpi-value">${totalStaff}</div></div>
    <div class="kpi-card"><div class="kpi-label">Active</div><div class="kpi-value">${activeCount}</div></div>
    <div class="kpi-card"><div class="kpi-label">Inactive</div><div class="kpi-value">${totalStaff - activeCount}</div></div>
    <div class="kpi-card"><div class="kpi-label">Top Performer</div><div class="kpi-value" style="font-size:1rem">${topPerformer ? topPerformer[0] : '—'}</div>${topPerformer ? `<div class="kpi-change up">${CURRENCY}${topPerformer[1].total.toLocaleString()}</div>` : ''}</div>
  `;

  const tbody = document.getElementById('staffListBody');
  if (!tbody) return;
  if (staff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No staff members</td></tr>`;
    return;
  }
  tbody.innerHTML = staff.map((s, i) => {
    const data = staffSales[s.name] || { count: 0, total: 0 };
    return `<tr>
      <td>${i + 1}</td>
      <td style="font-weight:600">${escapeHtml(s.name)}</td>
      <td>${s.role}</td>
      <td><span class="customer-loyalty ${s.active ? 'loyalty-gold' : 'loyalty-bronze'}" style="font-size:0.65rem">${s.active ? 'Active' : 'Inactive'}</span></td>
      <td>${data.count}</td>
      <td style="font-weight:600">${CURRENCY}${data.total.toLocaleString()}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="openEditStaffModal('${escapeJS(s.id)}')" title="Edit">✎</button>
        <button class="btn btn-sm btn-ghost" onclick="toggleStaffActive('${escapeJS(s.id)}')" title="${s.active ? 'Deactivate' : 'Activate'}">
          ${s.active ? '⏸' : '▶'}
        </button>
        <button class="btn btn-sm btn-ghost" onclick="confirmDeleteStaff('${escapeJS(s.id)}', '${escapeJS(s.name)}')" title="Delete" style="color:var(--danger)">✕</button>
      </td>
    </tr>`;
  }).join('');
}

function openAddStaffModal() {
  openModal('Add Staff Member', `
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" id="newStaffName" class="form-input" placeholder="e.g. Ahmed Musa" />
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="newStaffRole" class="form-select">
        <option value="Washer">Washer</option>
        <option value="Supervisor">Supervisor</option>
        <option value="Manager">Manager</option>
      </select>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="addNewStaff()">Add Staff</button>
  `);
  setTimeout(() => document.getElementById('newStaffName')?.focus(), 100);
}

async function addNewStaff() {
  const name = (document.getElementById('newStaffName')?.value || '').trim();
  const role = document.getElementById('newStaffRole')?.value || 'Washer';
  if (!name) return alert('Please enter a name');
  if (state.staff.some(s => s.name.toLowerCase() === name.toLowerCase())) return alert('A staff member with this name already exists');

  const member = { id: 'staff-' + Date.now(), name, role, active: true };
  await saveStaff(member);
  state.staff.push(member);
  closeModal();
  renderStaffManagement();
  renderOperatorDropdown();
}

function openEditStaffModal(id) {
  const s = state.staff.find(m => m.id === id);
  if (!s) return;
  openModal('Edit Staff', `
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" id="editStaffName" class="form-input" value="${escapeHtml(s.name)}" />
    </div>
    <div class="form-group">
      <label>Role</label>
      <select id="editStaffRole" class="form-select">
        <option value="Washer" ${s.role === 'Washer' ? 'selected' : ''}>Washer</option>
        <option value="Supervisor" ${s.role === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
        <option value="Manager" ${s.role === 'Manager' ? 'selected' : ''}>Manager</option>
      </select>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="saveEditStaff('${escapeJS(s.id)}')">Save Changes</button>
  `);
  setTimeout(() => document.getElementById('editStaffName')?.focus(), 100);
}

async function saveEditStaff(id) {
  const name = (document.getElementById('editStaffName')?.value || '').trim();
  const role = document.getElementById('editStaffRole')?.value || 'Washer';
  if (!name) return alert('Please enter a name');
  const existing = state.staff.find(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== id);
  if (existing) return alert('A staff member with this name already exists');

  const member = state.staff.find(s => s.id === id);
  if (!member) return;

  const oldName = member.name;
  member.name = name;
  member.role = role;
  await saveStaff(member);

  // Update operator references in receipts/orders if name changed
  if (oldName !== name) {
    state.receipts.forEach(r => { if (r.operator === oldName) r.operator = name; });
    state.orders.forEach(o => { if (o.operator === oldName) o.operator = name; });
  }

  closeModal();
  renderStaffManagement();
  renderOperatorDropdown();
}

async function confirmDeleteStaff(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  await deleteStaffMember(id);
  state.staff = state.staff.filter(s => s.id !== id);
  renderStaffManagement();
  renderOperatorDropdown();
}

async function toggleStaffActive(id) {
  const member = state.staff.find(s => s.id === id);
  if (!member) return;
  member.active = !member.active;
  await saveStaff(member);
  renderStaffManagement();
  renderOperatorDropdown();
}

function renderOperatorDropdown() {
  const select = document.getElementById('operatorName');
  if (!select) return;
  const activeStaff = state.staff.filter(s => s.active);
  const current = select.value || state.operator || '';
  select.innerHTML = '<option value="">Select washer...</option>' +
    activeStaff.map(s => `<option value="${escapeHtml(s.name)}" ${s.name === current ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
  updateContinueBtn();
}

/* ============ RECEIPT HISTORY ============ */
function renderReceiptHistory() {
  const search = document.getElementById('searchReceipts')?.value?.toLowerCase() || '';
  const filter = document.getElementById('historyFilter')?.value || 'all';
  const dateFrom = document.getElementById('historyDateFrom')?.value;
  const dateTo = document.getElementById('historyDateTo')?.value;
  let filtered = [...state.receipts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (search) {
    filtered = filtered.filter(r =>
      r.id.toLowerCase().includes(search) ||
      r.plateNumber.toLowerCase().includes(search) ||
      (r.operator || '').toLowerCase().includes(search)
    );
  }
  if (filter === 'refunds') filtered = filtered.filter(r => r.status === 'refunded');
  if (filter === 'discounts') filtered = filtered.filter(r => r.discountAmount > 0);
  if (filter === 'sales') filtered = filtered.filter(r => r.status === 'completed');
  if (dateFrom) filtered = filtered.filter(r => r.date >= dateFrom);
  if (dateTo) filtered = filtered.filter(r => r.date <= dateTo);

  const perPage = 15;
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  if (state.historyPage > totalPages) state.historyPage = totalPages;
  const start = (state.historyPage - 1) * perPage;
  const pageData = filtered.slice(start, start + perPage);

  const tbody = document.getElementById('historyBody');
  if (!tbody) return;
  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted)">No receipts found</td></tr>`;
  } else {
    tbody.innerHTML = pageData.map(r => `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${new Date(r.timestamp).toLocaleDateString()}</td>
        <td>${r.plateNumber}</td>
        <td>${(r.services || []).map(s => s.name || s).join(', ')}</td>
        <td>${CURRENCY}${r.subtotal.toLocaleString()}</td>
        <td>${r.discountAmount > 0 ? `<span class="discount-badge">-${CURRENCY}${r.discountAmount.toLocaleString()}</span>` : '—'}</td>
        <td><strong>${CURRENCY}${r.total.toLocaleString()}</strong></td>
        <td>${r.paymentMethod === 'cash' ? 'Cash' : 'Card'}</td>
        <td>${escapeHtml(r.operator || '—')}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-receipt-view" onclick="viewReceipt('${r.id}')" title="View">👁 View</button>
          ${r.status === 'completed' ? `<button class="btn btn-receipt-refund" onclick="refundReceipt('${r.id}')" title="Refund">↩ Refund</button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  // Pagination
  const pag = document.getElementById('historyPagination');
  if (pag) {
    pag.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === state.historyPage ? 'active' : '';
      btn.onclick = () => { state.historyPage = i; renderReceiptHistory(); };
      pag.appendChild(btn);
    }
  }
}

function viewReceipt(id) {
  const r = state.receipts.find(x => x.id === id);
  if (!r) return;
  openModal('Receipt ' + r.id, `
    <div style="font-family:monospace;font-size:13px;line-height:1.8">
      <div style="text-align:center;margin-bottom:12px"><strong>SparkClean</strong><br/>Premium Car Wash</div>
      <hr style="border:none;border-top:1px dashed #555;margin:8px 0"/>
      <div><strong>Receipt:</strong> ${r.id}</div>
      <div><strong>Date:</strong> ${new Date(r.timestamp).toLocaleString()}</div>
      <div><strong>Plate:</strong> ${escapeHtml(r.plateNumber)}</div>
      <div><strong>Staff:</strong> ${escapeHtml(r.operator)}</div>
      <div><strong>Vehicle:</strong> ${escapeHtml(r.vehicleType)}</div>
      <hr style="border:none;border-top:1px dashed #555;margin:8px 0"/>
      ${(r.services || []).map(s => `<div style="display:flex;justify-content:space-between"><span>${s.name}</span><span>${CURRENCY}${(s.price || 0).toLocaleString()}</span></div>`).join('')}
      <hr style="border:none;border-top:1px dashed #555;margin:8px 0"/>
      <div style="display:flex;justify-content:space-between"><span>Subtotal</span><span>${CURRENCY}${r.subtotal.toLocaleString()}</span></div>
      ${r.discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;color:var(--warning)"><span>Discount</span><span>-${CURRENCY}${r.discountAmount.toLocaleString()}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:15px;margin-top:4px"><span>Total</span><span>${CURRENCY}${r.total.toLocaleString()}</span></div>
      <hr style="border:none;border-top:1px dashed #555;margin:8px 0"/>
      <div><strong>Payment:</strong> ${r.paymentMethod === 'cash' ? 'Cash' : 'Card/POS'}</div>
      ${r.paymentMethod === 'online' ? `<div style="margin-top:6px;padding:8px;background:var(--surface);border-radius:6px;font-size:0.8rem"><strong>Transfer to:</strong><br/>${BANK_ACCOUNT.bank} — ${BANK_ACCOUNT.name}<br/>Account: ${BANK_ACCOUNT.number}</div>` : ''}
      <div><strong>Status:</strong> ${r.status}</div>
      <div style="margin-top:12px;display:flex;gap:6px">
        <button class="btn" style="flex:1;padding:6px 4px;font-size:0.7rem;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff" onclick="closeModal();printSpecificReceipt('${r.id}')">🖨️ Print</button>
        <button class="btn" style="flex:1;padding:6px 4px;font-size:0.7rem;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff" onclick="closeModal();emailCustomerReceipt('${r.id}')">✉️ Email</button>
        <button class="btn" style="flex:1;padding:6px 4px;font-size:0.7rem;background:linear-gradient(135deg,#25d366,#16a34a);color:#fff" onclick="closeModal();whatsappCustomerReceipt('${r.id}')">💬 WA</button>
      </div>
    </div>
  `);
}

async function refundReceipt(id) {
  const r = state.receipts.find(x => x.id === id);
  if (!r || r.status === 'refunded') return;
  if (!confirm(`Refund ${CURRENCY}${r.total.toLocaleString()} for receipt ${r.id}?`)) return;
  r.status = 'refunded';
  await saveReceipt(r);

  // Reverse customer stats
  const plate = r.plateNumber;
  if (state.customers[plate]) {
    state.customers[plate].totalSpent = Math.max(0, state.customers[plate].totalSpent - r.total);
    state.customers[plate].visits = Math.max(0, state.customers[plate].visits - 1);
    updateCustomerTier(state.customers[plate]);
    await saveCustomer(state.customers[plate]);
  }

  if (r.paymentMethod === 'cash') {
    state.cashDrawer.balance -= r.total;
    state.cashDrawer.movements.push({
      type: 'cash-out', amount: r.total,
      note: `Refund — ${r.id} — ${r.plateNumber}`,
      timestamp: new Date().toISOString(), receiptId: r.id, operator: r.operator,
    });
    await saveCashDrawer(state.cashDrawer);
  }
  renderReceiptHistory();
}

/* ============ CUSTOMERS ============ */
function renderCustomers() {
  const search = (document.getElementById('searchCustomers')?.value || '').toLowerCase();
  const sort = document.getElementById('customerSort')?.value || 'recent';
  const dateFrom = document.getElementById('customerDateFrom')?.value;
  const dateTo = document.getElementById('customerDateTo')?.value;
  let customers = Object.values(state.customers);

  if (search) {
    customers = customers.filter(c => c.plate.toLowerCase().includes(search) || (c.name || '').toLowerCase().includes(search));
  }
  if (dateFrom) customers = customers.filter(c => c.lastVisit && c.lastVisit.split('T')[0] >= dateFrom);
  if (dateTo) customers = customers.filter(c => c.lastVisit && c.lastVisit.split('T')[0] <= dateTo);
  customers.sort((a, b) => {
    if (sort === 'visits') return b.visits - a.visits;
    if (sort === 'spent') return b.totalSpent - a.totalSpent;
    if (sort === 'name') return (a.name || 'Guest').localeCompare(b.name || 'Guest');
    return new Date(b.lastVisit) - new Date(a.lastVisit);
  });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgVisits = totalCustomers > 0 ? (customers.reduce((s, c) => s + c.visits, 0) / totalCustomers).toFixed(1) : 0;
  const avgSpend = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
  const platinumCount = customers.filter(c => c.totalSpent >= 50000 || c.visits >= 10).length;
  const goldCount = customers.filter(c => (c.totalSpent >= 20000 || c.visits >= 5) && !(c.totalSpent >= 50000 || c.visits >= 10)).length;

  document.getElementById('customerStats').innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Total Customers</div><div class="kpi-value">${totalCustomers}</div></div>
    <div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value">${CURRENCY}${totalRevenue.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="kpi-label">Avg Visits</div><div class="kpi-value">${avgVisits}</div></div>
    <div class="kpi-card"><div class="kpi-label">Avg Spend</div><div class="kpi-value">${CURRENCY}${avgSpend.toLocaleString()}</div></div>
    <div class="kpi-card"><div class="kpi-label">Platinum Members</div><div class="kpi-value">${platinumCount}</div></div>
    <div class="kpi-card"><div class="kpi-label">Gold Members</div><div class="kpi-value">${goldCount}</div></div>
  `;

  const tbody = document.getElementById('customersBody');
  if (!tbody) return;
  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state"><h3>No customers yet</h3><p>Customers will appear after the first sale</p></td></tr>`;
    return;
  }
  tbody.innerHTML = customers.map((c, i) => {
    const tier = c.loyaltyTier || computeLoyaltyTier(c.totalSpent, c.visits);
    const services = (c.recentServices || []).join(', ') || '—';
    return `<tr>
      <td>${i + 1}</td>
      <td style="font-weight:600">${escapeHtml(c.name || 'Guest')}</td>
      <td style="color:var(--accent);font-weight:600">${c.plate}</td>
      <td style="font-size:0.78rem;color:var(--text-secondary)">${c.phone || '—'}</td>
      <td>${c.visits}</td>
      <td style="font-weight:600">${CURRENCY}${c.totalSpent.toLocaleString()}</td>
      <td>${new Date(c.firstVisit).toLocaleString()}</td>
      <td>${new Date(c.lastVisit).toLocaleString()}</td>
      <td><span class="customer-loyalty loyalty-${tier}" style="font-size:0.65rem">${tier}</span></td>
      <td style="font-size:0.75rem;color:var(--text-secondary)">${services}</td>
    </tr>`;
  }).join('');
}

function editCustomer(plate) {
  const c = state.customers[plate];
  if (!c) return;
  openModal('Edit Customer', `
    <div class="form-group"><label>Plate Number</label><input type="text" class="form-input" value="${escapeHtml(c.plate)}" disabled /></div>
    <div class="form-group"><label>Name</label><input type="text" id="editCustName" class="form-input" value="${escapeHtml(c.name || '')}" placeholder="Customer name" /></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="editCustPhone" class="form-input" value="${escapeHtml(c.phone || '')}" placeholder="08012345678" /></div>
    <div class="form-group"><label>Email</label><input type="email" id="editCustEmail" class="form-input" value="${escapeHtml(c.email || '')}" placeholder="customer@email.com" /></div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="saveCustomerEdit('${escapeJS(plate)}')">Save Changes</button>
  `);
}

async function saveCustomerEdit(plate) {
  const c = state.customers[plate];
  if (!c) return;
  c.name = document.getElementById('editCustName')?.value?.trim() || c.name;
  c.phone = document.getElementById('editCustPhone')?.value?.trim() || '';
  c.email = document.getElementById('editCustEmail')?.value?.trim() || '';
  await saveCustomer(c);
  closeModal();
  renderCustomers();
}

function exportCustomerReport(format) {
  const customers = Object.values(state.customers);
  if (customers.length === 0) {
    alert('No customer data to export.');
    return;
  }
  customers.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));

  const rows = customers.map((c, i) => {
    const tier = c.loyaltyTier || computeLoyaltyTier(c.totalSpent, c.visits);
    return {
      '#': i + 1,
      'Name': c.name || 'Guest',
      'Plate Number': c.plate,
      'Phone': c.phone || '',
      'Email': c.email || '',
      'Visits': c.visits,
      'Total Spent (₦)': c.totalSpent,
      'Avg per Visit (₦)': c.visits > 0 ? Math.round(c.totalSpent / c.visits) : 0,
      'First Visit': new Date(c.firstVisit).toLocaleString(),
      'Last Visit': new Date(c.lastVisit).toLocaleString(),
      'Loyalty Tier': tier.charAt(0).toUpperCase() + tier.slice(1),
      'Last Services': (c.recentServices || []).join('; '),
    };
  });

  if (format === 'csv') {
    exportToCSV(rows, 'customer_report');
  } else {
    exportToExcel(rows, 'customer_report');
  }
}

function exportToCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [];
  lines.push(headers.join(','));
  rows.forEach(row => {
    lines.push(headers.map(h => {
      let val = String(row[h]);
      if (val.includes(',') || val.includes('"') || val.includes('\r') || val.includes('\n')) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(','));
  });

  const csvContent = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, filename + '.csv');
}

function exportToExcel(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\r\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\r\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\r\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\r\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\r\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\r\n';
  xml += '<Styles>\r\n';
  xml += '  <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11"/></Style>\r\n';
  xml += '  <Style ss:ID="header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#6366f1" ss:Pattern="Solid"/></Style>\r\n';
  xml += '  <Style ss:ID="currency"><NumberFormat ss:Format="#,##0"/></Style>\r\n';
  xml += '  <Style ss:ID="text"><NumberFormat ss:Format="@"/></Style>\r\n';
  xml += '</Styles>\r\n';
  xml += '<Worksheet ss:Name="Customer Report">\r\n<Table>\r\n';

  headers.forEach(h => {
    xml += '  <Column ss:Width="130"/>\r\n';
  });

  xml += '  <Row>\r\n';
  headers.forEach(h => {
    xml += '    <Cell ss:StyleID="header"><Data ss:Type="String">' + escapeXml(h) + '</Data></Cell>\r\n';
  });
  xml += '  </Row>\r\n';

  rows.forEach(row => {
    xml += '  <Row>\r\n';
    headers.forEach(h => {
      const val = row[h];
      const isNum = typeof val === 'number';
      const cellStyle = h.includes('Spent') || h.includes('Avg') ? ' ss:StyleID="currency"' : '';
      xml += '    <Cell' + cellStyle + '><Data ss:Type="' + (isNum ? 'Number' : 'String') + '">' + escapeXml(String(val)) + '</Data></Cell>\r\n';
    });
    xml += '  </Row>\r\n';
  });

  xml += '</Table>\r\n</Worksheet>\r\n</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, filename + '.xls');
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============ CASH DRAWER ============ */
function renderCashDrawer() {
  const cd = state.cashDrawer;
  const salesIn = cd.movements.filter(m => m.type === 'sale').reduce((s, m) => s + m.amount, 0);
  const cashIns = cd.movements.filter(m => m.type === 'cash-in').reduce((s, m) => s + m.amount, 0);
  const cashOuts = cd.movements.filter(m => m.type === 'cash-out').reduce((s, m) => s + m.amount, 0);

  document.getElementById('cashShiftInfo').innerHTML = cd.shiftId ? `Shift ${cd.shiftId} — Started ${cd.shiftStart ? new Date(cd.shiftStart).toLocaleString() : 'N/A'} — Staff: ${cd.staffInCharge || state.operator}` : `No active shift — Logged in: ${state.operator}`;

  document.getElementById('cashSummaryGrid').innerHTML = `
    <div class="cash-summary-card"><div class="cs-label">Cash in Drawer</div><div class="cs-value cs-neutral">${CURRENCY}${cd.balance.toLocaleString()}</div></div>
    <div class="cash-summary-card"><div class="cs-label">Cash In (Float)</div><div class="cs-value cs-positive">${CURRENCY}${cashIns.toLocaleString()}</div></div>
    <div class="cash-summary-card"><div class="cs-label">Cash Sales</div><div class="cs-value cs-positive">${CURRENCY}${salesIn.toLocaleString()}</div></div>
    <div class="cash-summary-card"><div class="cs-label">Cash Out (Expenses)</div><div class="cs-value cs-negative">-${CURRENCY}${cashOuts.toLocaleString()}</div></div>
  `;

  const movEl = document.getElementById('cashMovements');
  const movements = [...cd.movements].reverse();
  if (movements.length === 0) {
    movEl.innerHTML = `<div class="empty-state" style="padding:30px"><h3>No cash movements</h3><p>Start a shift to begin tracking</p></div>`;
  } else {
    movEl.innerHTML = movements.map(m => {
      const icons = { sale: '💰 Sale', 'cash-in': '📥 Cash In', 'cash-out': '📤 Cash Out', 'shift-start': '🟢 Shift Start', 'shift-end': '🔴 Shift End' };
      const labels = { sale: 'Sale', 'cash-in': 'Cash In', 'cash-out': 'Cash Out', 'shift-start': 'Shift Started', 'shift-end': 'Shift Ended' };
      return `
      <div class="movement-item movement-${m.type}">
        <div class="movement-left">
          <div class="movement-type">${icons[m.type] || m.type}</div>
          <div class="movement-note">${m.note || ''}</div>
          ${m.operator ? `<div class="movement-time" style="color:var(--primary-light)">${escapeHtml(m.operator)}</div>` : ''}
        </div>
        <div class="movement-right">
          <div class="movement-amount">${m.type === 'cash-out' ? '-' : m.amount > 0 ? '+' : ''}${m.amount > 0 ? CURRENCY + m.amount.toLocaleString() : '—'}</div>
          <div class="movement-time">${new Date(m.timestamp).toLocaleString()}</div>
        </div>
      </div>`;
    }).join('');
  }

  const histEl = document.getElementById('shiftHistoryList');
  if (histEl) {
    if (state.shiftHistory.length === 0) {
      histEl.innerHTML = `<div class="empty-state" style="padding:20px"><p>No previous shifts recorded</p></div>`;
    } else {
      histEl.innerHTML = state.shiftHistory.map(s => {
        const sales = (s.movements || []).filter(m => m.type === 'sale').reduce((sum, m) => sum + m.amount, 0);
        const ins = (s.movements || []).filter(m => m.type === 'cash-in').reduce((sum, m) => sum + m.amount, 0);
        const outs = (s.movements || []).filter(m => m.type === 'cash-out').reduce((sum, m) => sum + m.amount, 0);
        return `
        <div class="movement-item" style="border-left:3px solid var(--primary)">
          <div class="movement-left">
            <div class="movement-type" style="font-weight:700">${s.shiftId}</div>
            <div class="movement-note">Staff: ${s.staffInCharge || 'N/A'}</div>
            <div class="movement-note" style="font-size:0.75rem;color:var(--text-secondary)">
              Start: ${s.shiftStart ? new Date(s.shiftStart).toLocaleString() : 'N/A'} &nbsp;|&nbsp; End: ${s.shiftEnd ? new Date(s.shiftEnd).toLocaleString() : 'N/A'}
            </div>
          </div>
          <div class="movement-right" style="text-align:right">
            <div class="movement-amount">Sales: ${CURRENCY}${sales.toLocaleString()}</div>
            <div class="movement-time" style="font-size:0.75rem">In: ${CURRENCY}${ins.toLocaleString()} | Out: ${CURRENCY}${outs.toLocaleString()}</div>
          </div>
        </div>`;
      }).join('');
    }
  }
}

function exportCashDrawer(format) {
  const cd = state.cashDrawer;
  if (!cd.movements || cd.movements.length === 0) {
    alert('No cash movements to export.');
    return;
  }
  const rows = cd.movements.map((m, i) => ({
    '#': i + 1,
    'Type': m.type.charAt(0).toUpperCase() + m.type.slice(1).replace('-', ' '),
    'Amount': m.amount,
    'Note': m.note || '',
    'Staff': m.operator || '',
    'Timestamp': new Date(m.timestamp).toLocaleString(),
  }));
  if (format === 'csv') exportToCSV(rows, `cash_drawer_${cd.shiftId || 'export'}`);
  else exportToExcel(rows, `cash_drawer_${cd.shiftId || 'export'}`);
}

function openCashDrawerModal(type) {
  const titles = { 'cash-in': 'Add Cash (Float)', 'cash-out': 'Cash Out (Expense)', 'new-shift': 'Start New Shift' };
  let body = '';
  if (type === 'new-shift') {
    body = `
      <div class="form-group"><label>Starting Float Amount *</label><input type="number" id="modalAmount" class="form-input" placeholder="0.00" min="0" required /></div>
      <div class="form-group"><label>Notes *</label><input type="text" id="modalNote" class="form-input" placeholder="Shift start notes" required /></div>
      <button class="btn btn-primary" style="width:100%" onclick="startNewShift()">Start Shift</button>
    `;
  } else {
    body = `
      <div class="form-group"><label>Amount *</label><input type="number" id="modalAmount" class="form-input" placeholder="0.00" min="0" required /></div>
      <div class="form-group"><label>Note / Reason *</label><input type="text" id="modalNote" class="form-input" placeholder="Description" required /></div>
      <button class="btn ${type === 'cash-in' ? 'btn-primary' : 'btn-danger'}" style="width:100%" onclick="processCashMovement('${type}')">Confirm</button>
    `;
  }
  openModal(titles[type], body);
}

async function startNewShift() {
  const amount = parseFloat(document.getElementById('modalAmount').value);
  const note = document.getElementById('modalNote').value;
  if (isNaN(amount) || amount < 0) return alert('Enter a valid starting float amount');
  if (!note.trim()) return alert('Notes are required');

  if (state.cashDrawer.shiftId) {
    state.cashDrawer.shiftEnd = new Date().toISOString();
    state.cashDrawer.movements.push({ type: 'shift-end', amount: 0, note: 'Previous shift ended — new shift started', timestamp: new Date().toISOString(), operator: state.operator });
    await saveCashDrawer(state.cashDrawer);
    const archived = { ...state.cashDrawer, id: state.cashDrawer.shiftId };
    await saveShiftHistory(archived);
    state.shiftHistory.unshift(archived);
  }

  const shiftId = 'SHIFT-' + Date.now().toString(36).toUpperCase().slice(-4).toUpperCase();
  state.cashDrawer = {
    id: 'drawer-active',
    balance: amount,
    movements: [
      { type: 'shift-start', amount: 0, note: `Shift started by ${state.operator}`, timestamp: new Date().toISOString(), operator: state.operator },
      { type: 'cash-in', amount, note: note.trim() || 'Shift opening float', timestamp: new Date().toISOString(), operator: state.operator },
    ],
    shiftStart: new Date().toISOString(),
    shiftId,
    staffInCharge: state.operator,
  };
  await saveCashDrawer(state.cashDrawer);
  closeModal();
  renderCashDrawer();
}

async function processCashMovement(type) {
  const amount = parseFloat(document.getElementById('modalAmount').value);
  const note = document.getElementById('modalNote').value;
  if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
  if (!note.trim()) return alert('Notes are required');
  if (type === 'cash-out' && amount > state.cashDrawer.balance) return alert('Insufficient cash in drawer');

  state.cashDrawer.balance += type === 'cash-in' ? amount : -amount;
  state.cashDrawer.movements.push({
    type, amount, note: note.trim(),
    timestamp: new Date().toISOString(), operator: state.operator,
  });
  await saveCashDrawer(state.cashDrawer);
  closeModal();
  renderCashDrawer();
}

function openReconciliation() {
  const cd = state.cashDrawer;
  openModal('End Shift & Reconcile', `
    <div class="form-group"><label>Physical Count (Amount in drawer)</label><input type="number" id="physicalCount" class="form-input" placeholder="0.00" min="0" oninput="updateVariance()" /></div>
    <div class="recon-row"><span class="recon-label">System Balance</span><span class="recon-value">${CURRENCY}${cd.balance.toLocaleString()}</span></div>
    <div class="recon-row" id="varianceRow"><span class="recon-label">Variance</span><span class="recon-value" id="varianceValue">—</span></div>
    <div style="margin-top:16px"><button class="btn btn-success" style="width:100%" onclick="closeShift()">Confirm & Close Shift</button></div>
  `);
}

function updateVariance() {
  const physical = parseFloat(document.getElementById('physicalCount').value) || 0;
  const variance = physical - state.cashDrawer.balance;
  const el = document.getElementById('varianceValue');
  el.textContent = `${variance >= 0 ? '+' : ''}${CURRENCY}${Math.abs(variance).toLocaleString()}`;
  el.className = 'recon-value ' + (variance === 0 ? 'recon-diff-pos' : variance > 0 ? 'recon-diff-pos' : 'recon-diff-neg');
}

async function closeShift() {
  const physical = parseFloat(document.getElementById('physicalCount').value) || 0;
  const variance = physical - state.cashDrawer.balance;
  state.cashDrawer.movements.push({
    type: variance < 0 ? 'cash-out' : 'cash-in',
    amount: Math.abs(variance),
    note: `Shift close — Variance: ${variance >= 0 ? '+' : ''}${CURRENCY}${Math.abs(variance).toLocaleString()}`,
    timestamp: new Date().toISOString(), operator: state.operator,
  });
  state.cashDrawer.movements.push({
    type: 'shift-end', amount: 0, note: `Shift closed by ${state.operator}`, timestamp: new Date().toISOString(), operator: state.operator,
  });
  state.cashDrawer.balance = physical;
  state.cashDrawer.shiftEnd = new Date().toISOString();
  await saveCashDrawer(state.cashDrawer);

  const archived = { ...state.cashDrawer, id: state.cashDrawer.shiftId };
  await saveShiftHistory(archived);
  state.shiftHistory.unshift(archived);

  closeModal();
  alert(`Shift closed. Final balance: ${CURRENCY}${physical.toLocaleString()}\nVariance: ${variance >= 0 ? '+' : ''}${CURRENCY}${Math.abs(variance).toLocaleString()}`);
  state.cashDrawer = { id: 'drawer-active', balance: 0, movements: [], shiftStart: null, shiftId: null };
  await saveCashDrawer(state.cashDrawer);
  renderCashDrawer();
}

/* ============ HTML ESCAPE ============ */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function computeLoyaltyTier(totalSpent, visits) {
  if (totalSpent >= 50000 || visits >= 10) return 'platinum';
  if (totalSpent >= 20000 || visits >= 5) return 'gold';
  if (totalSpent >= 10000 || visits >= 3) return 'silver';
  return 'bronze';
}

function updateCustomerTier(c) {
  c.loyaltyTier = computeLoyaltyTier(c.totalSpent, c.visits);
}

/* ============ MODAL ============ */
function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

/* ============ PARTICLES ============ */
(function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = Math.random() * 100 + 40;
    p.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-duration:${Math.random()*6+5}s;animation-delay:${Math.random()*4}s`;
    c.appendChild(p);
  }
})();
(function initLoginParticles() {
  const c = document.getElementById('loginParticles');
  if (!c) return;
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const sz = Math.random() * 80 + 30;
    p.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-duration:${Math.random()*6+5}s;animation-delay:${Math.random()*4}s`;
    c.appendChild(p);
  }
})();

/* ============ INIT ============ */
async function initApp() {
  await openDB();
  await loadAllData();
  resolveOperatorFromSession();
  setupOffline();
  syncPendingData();
  renderServices();
  if (typeof emailjs !== 'undefined') {
    const emailCfg = getEmailConfig();
    if (emailCfg.publicKey) emailjs.init({ publicKey: emailCfg.publicKey });
  }
}

(async function boot() {
  await initAuthCredentials();
  if (isAuthenticated()) {
    hideLoginScreen();
    await initApp();
    startActivityTracking();
  } else {
    showLoginScreen();
  }
})();

const EMAIL_CONFIG_KEY = 'sparkclean_email_config';
function getEmailConfig() {
  try { return JSON.parse(localStorage.getItem(EMAIL_CONFIG_KEY) || '{}'); } catch { return {}; }
}
function saveEmailConfig(cfg) { localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(cfg)); }

function openEmailSettings() {
  const cfg = getEmailConfig();
  openModal('Settings', `
    <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:12px">Configure EmailJS and OPay payment server.</p>
    <h4 style="margin:12px 0 6px;font-size:0.85rem;color:var(--accent)">Email (EmailJS)</h4>
    <p style="color:var(--text-muted);font-size:0.75rem;margin-bottom:8px">Get your keys at <a href="https://www.emailjs.com/" target="_blank" style="color:var(--accent)">emailjs.com</a></p>
    <div class="form-group"><label>Public Key</label><input type="text" id="emailPubKey" class="form-input" value="${cfg.publicKey || ''}" placeholder="your_public_key" /></div>
    <div class="form-group"><label>Service ID</label><input type="text" id="emailServiceId" class="form-input" value="${cfg.serviceId || ''}" placeholder="service_xxxxxxx" /></div>
    <div class="form-group"><label>Template ID</label><input type="text" id="emailTemplateId" class="form-input" value="${cfg.templateId || ''}" placeholder="template_xxxxxxx" /></div>
    <div class="form-group"><label>From Name</label><input type="text" id="emailFromName" class="form-input" value="${cfg.fromName || 'SparkClean'}" placeholder="SparkClean" /></div>
    <button class="btn btn-outline" style="width:100%;margin-top:4px;margin-bottom:16px" onclick="testEmail()">Send Test Email</button>
    <h4 style="margin:12px 0 6px;font-size:0.85rem;color:var(--accent)">OPay Payment Server</h4>
    <p style="color:var(--text-muted);font-size:0.75rem;margin-bottom:8px">URL of the Node.js backend for auto-confirming card/POS payments</p>
    <div class="form-group"><label>Server URL</label><input type="text" id="payServerUrl" class="form-input" value="${localStorage.getItem('pay_server_url') || 'http://localhost:3000'}" placeholder="http://localhost:3000" /></div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="saveEmailSettings()">Save All Settings</button>
  `);
}

function saveEmailSettings() {
  const cfg = {
    publicKey: document.getElementById('emailPubKey').value.trim(),
    serviceId: document.getElementById('emailServiceId').value.trim(),
    templateId: document.getElementById('emailTemplateId').value.trim(),
    fromName: document.getElementById('emailFromName').value.trim() || 'SparkClean',
  };
  saveEmailConfig(cfg);
  const serverUrl = document.getElementById('payServerUrl')?.value?.trim();
  if (serverUrl) {
    localStorage.setItem('pay_server_url', serverUrl);
    PAY_SERVER = serverUrl;
  }
  if (typeof emailjs !== 'undefined' && cfg.publicKey) {
    emailjs.init({ publicKey: cfg.publicKey });
  }
  closeModal();
  alert('Settings saved.');
}

function isEmailConfigured() {
  const cfg = getEmailConfig();
  return cfg.publicKey && cfg.serviceId && cfg.templateId;
}

async function sendEmail(toEmail, subject, body) {
  if (!isEmailConfigured()) {
    openEmailSettings();
    return false;
  }
  const cfg = getEmailConfig();
  try {
    await emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email: toEmail,
      from_name: cfg.fromName,
      subject,
      message: body,
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    alert('Failed to send email. Check your EmailJS settings.');
    return false;
  }
}

async function testEmail() {
  const cfg = getEmailConfig();
  if (!cfg.publicKey || !cfg.serviceId || !cfg.templateId) {
    alert('Please fill in all EmailJS fields first.');
    return;
  }
  saveEmailSettings();
  const ok = await sendEmail(cfg.testEmail || 'test@example.com', 'SparkClean Test', 'This is a test email from SparkClean.');
  if (ok) alert('Test email sent!');
}

function emailReceipt() {
  const r = state.lastReceipt;
  if (!r) return;
  const customer = state.customers[r.plateNumber];
  const email = customer?.email || '';
  const servicesList = (r.services || []).map(s => `${s.name}: ${CURRENCY}${(s.price || 0).toLocaleString()}`).join('\n');
  const body = `Receipt: ${r.id}\nDate: ${new Date(r.timestamp).toLocaleString()}\nPlate: ${r.plateNumber}\nStaff: ${r.operator}\n\nServices:\n${servicesList}\n\nSubtotal: ${CURRENCY}${r.subtotal.toLocaleString()}${r.discountAmount > 0 ? `\nDiscount: -${CURRENCY}${r.discountAmount.toLocaleString()}` : ''}\nTotal: ${CURRENCY}${r.total.toLocaleString()}\nPayment: ${r.paymentMethod === 'cash' ? 'Cash' : 'Card/POS'}\n\nThank you for your patronage! — SparkClean`;

  if (!email) {
    openModal('Email Receipt', `
      <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:12px">No email on file for plate <strong>${r.plateNumber}</strong>. Enter an email address to send this receipt.</p>
      <div class="form-group"><label>Customer Email</label><input type="email" id="receiptEmailInput" class="form-input" placeholder="customer@email.com" value="${email}" /></div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn btn-primary" style="flex:1" onclick="sendReceiptEmail('${r.id}','receiptEmailInput')">Send Email</button>
        <button class="btn btn-outline" style="flex:1" onclick="emailReceiptMailto('${r.id}','receiptEmailInput')">Open Mail App</button>
      </div>
    `);
    return;
  }
  openModal('Email Receipt', `
    <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:12px">Send receipt <strong>${r.id}</strong> to <strong>${email}</strong>?</p>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" style="flex:1" onclick="sendReceiptEmail('${r.id}')">Send Email</button>
      <button class="btn btn-outline" style="flex:1" onclick="emailReceiptMailto('${r.id}')">Open Mail App</button>
    </div>
  `);
}

async function sendReceiptEmail(receiptId, inputId) {
  const r = state.receipts.find(x => x.id === receiptId) || state.lastReceipt;
  if (!r) return;
  let email = '';
  if (inputId) {
    email = document.getElementById(inputId)?.value?.trim();
    if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
    if (state.customers[r.plateNumber]) {
      state.customers[r.plateNumber].email = email;
      await saveCustomer(state.customers[r.plateNumber]);
    }
  } else {
    email = state.customers[r.plateNumber]?.email;
    if (!email) { alert('No email on file.'); return; }
  }
  const servicesList = (r.services || []).map(s => `${s.name}: ${CURRENCY}${(s.price || 0).toLocaleString()}`).join('\n');
  const body = `Receipt: ${r.id}\nDate: ${new Date(r.timestamp).toLocaleString()}\nPlate: ${r.plateNumber}\nStaff: ${r.operator}\n\nServices:\n${servicesList}\n\nSubtotal: ${CURRENCY}${r.subtotal.toLocaleString()}${r.discountAmount > 0 ? `\nDiscount: -${CURRENCY}${r.discountAmount.toLocaleString()}` : ''}\nTotal: ${CURRENCY}${r.total.toLocaleString()}\nPayment: ${r.paymentMethod === 'cash' ? 'Cash' : 'Card/POS'}${r.paymentMethod === 'online' ? `\nTransfer to: ${BANK_ACCOUNT.bank}\nName: ${BANK_ACCOUNT.name}\nNumber: ${BANK_ACCOUNT.number}` : ''}\n\nThank you for your patronage! — SparkClean`;
  const ok = await sendEmail(email, `SparkClean Receipt ${r.id}`, body);
  if (ok) { alert('Receipt emailed successfully!'); closeModal(); }
}

function emailReceiptMailto(receiptId, inputId) {
  const r = state.receipts.find(x => x.id === receiptId) || state.lastReceipt;
  if (!r) return;
  let email = '';
  if (inputId) email = document.getElementById(inputId)?.value?.trim() || '';
  else email = state.customers[r.plateNumber]?.email || '';
  const servicesList = (r.services || []).map(s => `${s.name}: ${CURRENCY}${(s.price || 0).toLocaleString()}`).join('%0A');
  const body = `Receipt: ${r.id}%0APlate: ${r.plateNumber}%0ATotal: ${CURRENCY}${r.total.toLocaleString()}%0APayment: ${r.paymentMethod === 'cash' ? 'Cash' : 'Card'}${r.paymentMethod === 'online' ? `%0ATransfer to: ${BANK_ACCOUNT.bank}%0ANumber: ${BANK_ACCOUNT.number}` : ''}%0A%0AThank you! — SparkClean`;
  window.open(`mailto:${email}?subject=SparkClean Receipt ${r.id}&body=${body}`, '_blank');
  closeModal();
}

function emailCustomerReceipt(receiptId) {
  const savedReceipt = state.lastReceipt;
  state.lastReceipt = state.receipts.find(x => x.id === receiptId);
  if (state.lastReceipt) emailReceipt();
  state.lastReceipt = savedReceipt;
}

function emailCustomer(plate) {
  const c = state.customers[plate];
  if (!c) return;
  const email = c.email || '';
  openModal(`Email ${c.name || c.plate}`, `
    <div class="form-group"><label>Recipient Email</label><input type="email" id="bulkEmailInput" class="form-input" value="${email}" placeholder="customer@email.com" /></div>
    <div class="form-group"><label>Subject</label><input type="text" id="bulkSubject" class="form-input" value="SparkClean — Thank you for your visit!" /></div>
    <div class="form-group"><label>Message</label><textarea id="bulkMessage" class="form-input" rows="4" style="resize:vertical">Hi ${c.name || 'there'},\n\nThank you for choosing SparkClean! You've visited us ${c.visits} time${c.visits !== 1 ? 's' : ''} and spent ${CURRENCY}${c.totalSpent.toLocaleString()} total.\n\nAs a ${(c.loyaltyTier || 'bronze').charAt(0).toUpperCase() + (c.loyaltyTier || 'bronze').slice(1)} member, we appreciate your loyalty. See you next time!\n\n— SparkClean Team</textarea></div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="sendCustomerEmail('${plate}')">Send Email</button>
  `);
}

async function sendCustomerEmail(plate) {
  const c = state.customers[plate];
  if (!c) return;
  const email = document.getElementById('bulkEmailInput')?.value?.trim();
  if (!email || !email.includes('@')) { alert('Please enter a valid email address.'); return; }
  const subject = document.getElementById('bulkSubject')?.value?.trim() || 'SparkClean';
  const message = document.getElementById('bulkMessage')?.value?.trim() || '';
  c.email = email;
  await saveCustomer(c);
  const ok = await sendEmail(email, subject, message);
  if (ok) { alert(`Email sent to ${email}`); closeModal(); }
}

function emailBulkCustomers() {
  const customers = Object.values(state.customers).filter(c => c.email && c.email.includes('@'));
  if (customers.length === 0) {
    alert('No customers with email addresses found. Add emails to customer profiles first.');
    return;
  }
  openModal('Bulk Email Customers', `
    <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:12px">Send to ${customers.length} customer${customers.length !== 1 ? 's' : ''} with email addresses on file.</p>
    <div class="form-group"><label>Subject</label><input type="text" id="bulkSubject" class="form-input" value="SparkClean — Special Offer!" /></div>
    <div class="form-group"><label>Message</label><textarea id="bulkMessage" class="form-input" rows="5" style="resize:vertical">Dear valued customer,\n\nThank you for being a loyal SparkClean member! We have a special offer just for you.\n\nVisit us this week and enjoy 10% off your next wash.\n\nSee you soon!\n— SparkClean Team</textarea></div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="sendBulkEmails()">Send to All (${customers.length})</button>
  `);
}

async function sendBulkEmails() {
  const customers = Object.values(state.customers).filter(c => c.email && c.email.includes('@'));
  const subject = document.getElementById('bulkSubject')?.value?.trim() || 'SparkClean';
  const message = document.getElementById('bulkMessage')?.value?.trim() || '';
  if (!isEmailConfigured()) { openEmailSettings(); return; }
  let sent = 0, failed = 0;
  for (const c of customers) {
    const ok = await sendEmail(c.email, subject, message.replace(/\{name\}/g, c.name || 'Valued Customer').replace(/\{visits\}/g, c.visits).replace(/\{spent\}/g, c.totalSpent.toLocaleString()));
    if (ok) sent++; else failed++;
  }
  alert(`Bulk email complete: ${sent} sent, ${failed} failed.`);
  closeModal();
}

/* ============ WHATSAPP ============ */
function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  let p = phone.replace(/[\s\-\(\)]/g, '');
  if (p.startsWith('0')) p = '234' + p.slice(1);
  if (!p.startsWith('234') && !p.startsWith('+')) p = '234' + p;
  p = p.replace(/^\+/, '');
  return p;
}

function openWhatsApp(phone, message) {
  const num = formatWhatsAppPhone(phone);
  if (!num) { alert('No phone number available for this customer.'); return; }
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function getReceiptWhatsAppText(r) {
  const servicesList = (r.services || []).map(s => `  ${s.name}: ${CURRENCY}${(s.price || 0).toLocaleString()}`).join('\n');
  return `Hello! Here's your SparkClean receipt:\n\n` +
    `Receipt: ${r.id}\n` +
    `Date: ${new Date(r.timestamp).toLocaleString()}\n` +
    `Plate: ${r.plateNumber}\n` +
    `Staff: ${r.operator}\n\n` +
    `Services:\n${servicesList}\n\n` +
    `Subtotal: ${CURRENCY}${r.subtotal.toLocaleString()}\n` +
    (r.discountAmount > 0 ? `Discount: -${CURRENCY}${r.discountAmount.toLocaleString()}\n` : '') +
    `Total: ${CURRENCY}${r.total.toLocaleString()}\n` +
    `Payment: ${r.paymentMethod === 'cash' ? 'Cash' : 'Card/POS'}\n` +
    (r.paymentMethod === 'online' ? `Transfer to: ${BANK_ACCOUNT.bank}\nName: ${BANK_ACCOUNT.name}\nNumber: ${BANK_ACCOUNT.number}\n\n` : '\n') +
    `Thank you for your patronage! — SparkClean`;
}

function whatsappReceipt() {
  const r = state.lastReceipt;
  if (!r) return;
  const c = state.customers[r.plateNumber];
  const phone = c?.phone || '';
  const msg = getReceiptWhatsAppText(r);
  if (!phone) {
    openModal('WhatsApp Receipt', `
      <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:12px">No phone on file for plate <strong>${r.plateNumber}</strong>. Enter a phone number to send via WhatsApp.</p>
      <div class="form-group"><label>Customer Phone</label><input type="tel" id="receiptPhoneInput" class="form-input" placeholder="08012345678" value="${phone}" /></div>
      <button class="btn btn-primary" style="width:100%;margin-top:8px;background:#25d366;border-color:#25d366" onclick="sendReceiptWhatsApp('${r.id}','receiptPhoneInput')">Send via WhatsApp</button>
    `);
    return;
  }
  openModal('WhatsApp Receipt', `
    <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:12px">Send receipt <strong>${r.id}</strong> to <strong>${phone}</strong> via WhatsApp?</p>
    <button class="btn btn-primary" style="width:100%;margin-top:8px;background:#25d366;border-color:#25d366" onclick="sendReceiptWhatsApp('${r.id}')">Send via WhatsApp</button>
  `);
}

async function sendReceiptWhatsApp(receiptId, inputId) {
  const r = state.receipts.find(x => x.id === receiptId) || state.lastReceipt;
  if (!r) return;
  let phone = '';
  if (inputId) {
    phone = document.getElementById(inputId)?.value?.trim();
    if (!phone) { alert('Please enter a phone number.'); return; }
    if (state.customers[r.plateNumber]) {
      state.customers[r.plateNumber].phone = phone;
      await saveCustomer(state.customers[r.plateNumber]);
    }
  } else {
    phone = state.customers[r.plateNumber]?.phone;
    if (!phone) { alert('No phone number on file.'); return; }
  }
  openWhatsApp(phone, getReceiptWhatsAppText(r));
  closeModal();
}

function whatsappCustomerReceipt(receiptId) {
  const savedReceipt = state.lastReceipt;
  state.lastReceipt = state.receipts.find(x => x.id === receiptId);
  if (state.lastReceipt) whatsappReceipt();
  state.lastReceipt = savedReceipt;
}

function whatsappCustomer(plate) {
  const c = state.customers[plate];
  if (!c) return;
  const phone = c.phone || '';
  openModal(`WhatsApp ${c.name || c.plate}`, `
    <div class="form-group"><label>Phone Number</label><input type="tel" id="waPhoneInput" class="form-input" value="${phone}" placeholder="08012345678" /></div>
    <div class="form-group"><label>Message</label><textarea id="waMessageInput" class="form-input" rows="4" style="resize:vertical">Hi ${c.name || 'there'},\n\nThank you for choosing SparkClean! You've visited us ${c.visits} time${c.visits !== 1 ? 's' : ''} and spent ${CURRENCY}${c.totalSpent.toLocaleString()} total.\n\nAs a ${(c.loyaltyTier || 'bronze').charAt(0).toUpperCase() + (c.loyaltyTier || 'bronze').slice(1)} member, we appreciate your loyalty. See you next time!\n\n— SparkClean Team</textarea></div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px;background:#25d366;border-color:#25d366" onclick="sendCustomerWhatsApp('${plate}')">Send via WhatsApp</button>
  `);
}

async function sendCustomerWhatsApp(plate) {
  const c = state.customers[plate];
  if (!c) return;
  const phone = document.getElementById('waPhoneInput')?.value?.trim();
  if (!phone) { alert('Please enter a phone number.'); return; }
  const message = document.getElementById('waMessageInput')?.value?.trim() || '';
  c.phone = phone;
  await saveCustomer(c);
  openWhatsApp(phone, message);
  closeModal();
}

function whatsappBulkCustomers() {
  const customers = Object.values(state.customers).filter(c => c.phone);
  if (customers.length === 0) {
    alert('No customers with phone numbers found. Add phone numbers to customer profiles first.');
    return;
  }
  openModal('Bulk WhatsApp', `
    <p style="color:var(--text-secondary);font-size:0.82rem;margin-bottom:12px">This will open WhatsApp for ${customers.length} customer${customers.length !== 1 ? 's' : ''} with phone numbers. Each will open in a new tab.</p>
    <div class="form-group"><label>Message Template</label><textarea id="bulkWaMessage" class="form-input" rows="5" style="resize:vertical">Dear valued customer,\n\nThank you for being a loyal SparkClean member! We have a special offer just for you.\n\nVisit us this week and enjoy 10% off your next wash.\n\nSee you soon!\n— SparkClean Team</textarea></div>
    <p style="color:var(--text-muted);font-size:0.75rem;margin-top:4px">Use {name}, {visits}, {spent} as placeholders</p>
    <button class="btn btn-primary" style="width:100%;margin-top:8px;background:#25d366;border-color:#25d366" onclick="sendBulkWhatsApp()">Send to All (${customers.length})</button>
  `);
}

function sendBulkWhatsApp() {
  const customers = Object.values(state.customers).filter(c => c.phone);
  const template = document.getElementById('bulkWaMessage')?.value?.trim() || '';
  if (customers.length === 0) return;
  const first = customers[0];
  const msg = template
    .replace(/\{name\}/g, first.name || 'Valued Customer')
    .replace(/\{visits\}/g, first.visits)
    .replace(/\{spent\}/g, first.totalSpent.toLocaleString());
  openWhatsApp(first.phone, msg);
  if (customers.length > 1) {
    const remaining = customers.slice(1);
    let idx = 0;
    function openNext() {
      if (idx >= remaining.length) return;
      const c = remaining[idx];
      const m = template
        .replace(/\{name\}/g, c.name || 'Valued Customer')
        .replace(/\{visits\}/g, c.visits)
        .replace(/\{spent\}/g, c.totalSpent.toLocaleString());
      if (confirm(`Open WhatsApp for ${c.name || c.plate}? (${idx + 2}/${customers.length})`)) {
        openWhatsApp(c.phone, m);
      }
      idx++;
      setTimeout(openNext, 800);
    }
    openNext();
  }
  closeModal();
}

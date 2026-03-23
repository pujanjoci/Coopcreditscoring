/**
 * admin/js/auth.js
 * Authentication, session management, and inactivity timeout for the Admin Panel.
 *
 * HOW PASSWORD HASHING WORKS:
 *   1. User types plain-text password in the form.
 *   2. hashPassword() runs SHA-256 on it in the browser (Web Crypto API).
 *   3. The resulting hex string is sent to GAS as payload.password.
 *   4. GAS stores this same SHA-256 hex in the Users sheet "Password" column.
 *   5. GAS compares the incoming hash directly — it does NOT hash again.
 *
 * To set up a user in the sheet:
 *   - Run this in the browser console to get the hash for any password:
 *       async function h(p){const b=new TextEncoder().encode(p);const d=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,'0')).join('');}
 *       h('yourpassword').then(console.log)
 *   - Paste that hex string into the Password column of the Users sheet.
 *
 * Session data stored in sessionStorage under key 'adminSession':
 * {
 *   token:      string  — unique per-login token
 *   email:      string
 *   role:       string
 *   loginAt:    number  — ms timestamp
 *   lastActive: number  — ms timestamp, updated on every user interaction
 * }
 */

// ── GAS Backend URL ──────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUJid9Q7bePYbSwnmNsbuUohAIDGeCfCz31V6j7pOLr2C8PnjwaDFW2l47VstJfv56Kw/exec';

// ── Session Config ────────────────────────────────────────────────────────────
const SESSION_KEY        = 'adminSession';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;  // 30 minutes
const WARNING_BEFORE     =  2 * 60 * 1000;  // warn 2 min before expiry
const CHECK_INTERVAL     = 30 * 1000;        // check every 30 seconds

// ── Internal state ────────────────────────────────────────────────────────────
let _inactivityInterval = null;
let _warningShown       = false;

// ── Utilities ─────────────────────────────────────────────────────────────────

function generateSessionToken() {
    try {
        if (crypto && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID().replace(/-/g, '');
        }
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
}

function getSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch { return null; }
}

function setSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function refreshSession() {
    const s = getSession();
    if (s) {
        s.lastActive = Date.now();
        setSession(s);
        if (_warningShown) {
            _warningShown = false;
            _dismissSessionWarning();
        }
    }
}

// ── Password Hashing ──────────────────────────────────────────────────────────

/**
 * Hash a plain-text password using SHA-256 (Web Crypto API).
 * The resulting hex string is what gets stored in the Users sheet
 * and what gets sent to GAS for comparison.
 */
async function hashPassword(password) {
    const msgBuffer  = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function login(email, password) {
    const errorEl   = document.getElementById('login_error');
    const btnSubmit = document.getElementById('btn_submit');
    const btnLabel  = document.getElementById('btn_label');
    const btnIcon   = document.getElementById('btn_icon');

    errorEl.style.display = 'none';
    btnSubmit.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Signing in…';
    if (btnIcon)  btnIcon.style.display = 'none';

    try {
        // Hash the plain-text password before sending
        const passwordHash = await hashPassword(password);

        const res = await fetch(SCRIPT_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body:    JSON.stringify({
                action:   'login',
                email:    email.trim().toLowerCase(),
                password: passwordHash    // GAS receives the hash and compares directly
            }),
            redirect: 'follow'
        });

        const data = await res.json();

        if (data.success) {
            const session = {
                token:      generateSessionToken(),
                email:      email.trim().toLowerCase(),
                username:   data.username || '',
                role:       data.role || 'admin',
                loginAt:    Date.now(),
                lastActive: Date.now()
            };
            setSession(session);
            window.location.href = 'admin.html';
        } else {
            showLoginError(data.error || 'Invalid email or password. Please try again.');
        }
    } catch (err) {
        showLoginError('Network error. Please check your connection and try again.');
    }

    function showLoginError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        errorEl.style.animation = 'none';
        errorEl.offsetHeight;
        errorEl.style.animation = '';
        btnSubmit.disabled = false;
        if (btnLabel) btnLabel.textContent = 'Sign In';
        if (btnIcon)  btnIcon.style.display = '';
        if (window.lucide) lucide.createIcons();
    }
}

// ── Logout ────────────────────────────────────────────────────────────────────

function logout(reason) {
    if (_inactivityInterval) {
        clearInterval(_inactivityInterval);
        _inactivityInterval = null;
    }

    const s = getSession();
    if (s && s.email) {
        fetch(SCRIPT_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body:    JSON.stringify({ action: 'logout', email: s.email }),
            redirect: 'follow'
        }).catch(() => {});
    }

    sessionStorage.removeItem(SESSION_KEY);

    // Clear submissions cache so next login always fetches fresh data
    localStorage.removeItem('admin_submissions_cache');

    const dest = reason ? `login.html?reason=${encodeURIComponent(reason)}` : 'login.html';
    window.location.href = dest;
}

// ── Auth Guard ────────────────────────────────────────────────────────────────

function checkAuth() {
    const s = getSession();
    if (!s || !s.token) {
        window.location.replace('login.html');
        return;
    }
    const idle = Date.now() - (s.lastActive || s.loginAt);
    if (idle >= INACTIVITY_TIMEOUT) {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace('login.html?reason=timeout');
    }
}

// ── Inactivity Watcher ────────────────────────────────────────────────────────

function startInactivityWatcher() {
    const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    let _refreshThrottle = null;
    function onActivity() {
        if (_refreshThrottle) return;
        _refreshThrottle = setTimeout(() => {
            refreshSession();
            _refreshThrottle = null;
        }, 5000);
    }

    ACTIVITY_EVENTS.forEach(evName => {
        document.addEventListener(evName, onActivity, { passive: true });
    });

    if (_inactivityInterval) clearInterval(_inactivityInterval);

    _inactivityInterval = setInterval(() => {
        const s = getSession();
        if (!s) {
            clearInterval(_inactivityInterval);
            window.location.replace('login.html?reason=timeout');
            return;
        }

        const idle     = Date.now() - (s.lastActive || s.loginAt);
        const timeLeft = INACTIVITY_TIMEOUT - idle;

        if (timeLeft <= 0) {
            clearInterval(_inactivityInterval);
            logout('timeout');
        } else if (timeLeft <= WARNING_BEFORE && !_warningShown) {
            _warningShown = true;
            const minsLeft = Math.ceil(timeLeft / 60000);
            _showSessionWarning(minsLeft);
        }
    }, CHECK_INTERVAL);
}

// ── Session Warning UI ────────────────────────────────────────────────────────

let _warningToastEl = null;

function _showSessionWarning(minsLeft) {
    _dismissSessionWarning();

    const el = document.createElement('div');
    el.id = '_session_warning_toast';
    el.style.cssText = [
        'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
        'z-index:99999', 'background:#7c3aed', 'color:#fff', 'padding:13px 22px',
        'border-radius:10px', 'font-size:13px', 'font-weight:600',
        'font-family:DM Sans,system-ui,sans-serif', 'display:flex',
        'align-items:center', 'gap:12px', 'box-shadow:0 4px 24px rgba(124,58,237,0.4)',
        'max-width:480px', 'animation:slideUp_session .3s ease'
    ].join(';');

    el.innerHTML = `
        <span style="font-size:18px">⏱</span>
        <span>Your session will expire in <strong>${minsLeft} minute${minsLeft !== 1 ? 's' : ''}</strong> due to inactivity.</span>
        <button onclick="refreshSession()" style="
            background:rgba(255,255,255,0.2);border:none;border-radius:6px;
            color:#fff;font-size:12px;font-weight:700;padding:5px 12px;
            cursor:pointer;font-family:inherit;white-space:nowrap;">
            Stay Logged In
        </button>
    `;

    if (!document.getElementById('_session_warning_style')) {
        const style = document.createElement('style');
        style.id = '_session_warning_style';
        style.textContent = `@keyframes slideUp_session { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(el);
    _warningToastEl = el;
}

function _dismissSessionWarning() {
    if (_warningToastEl) { _warningToastEl.remove(); _warningToastEl = null; }
    const existing = document.getElementById('_session_warning_toast');
    if (existing) existing.remove();
}

// ── Legacy compatibility shims ────────────────────────────────────────────────
(function patchLegacySessionKeys() {
    const s = typeof sessionStorage !== 'undefined' ? getSession() : null;
    if (!s) return;
    if (!sessionStorage.getItem('adminAuth'))  sessionStorage.setItem('adminAuth',  s.token);
    if (!sessionStorage.getItem('adminRole'))  sessionStorage.setItem('adminRole',  s.role);
    if (!sessionStorage.getItem('adminEmail')) sessionStorage.setItem('adminEmail', s.email);
    if (!sessionStorage.getItem('adminUsername')) sessionStorage.setItem('adminUsername', s.username || '');
})();
/**
 * admin/js/auth.js
 * Authentication, session management, and inactivity timeout for the Admin Panel.
 *
 * Session data is stored as a single JSON object in sessionStorage under the
 * key 'adminSession'. This replaces the old individual keys (adminAuth, adminRole,
 * adminEmail) and adds a unique token, loginAt, and lastActive timestamps.
 *
 * Session structure:
 * {
 *   token:      string  — cryptographically unique per-login token
 *   email:      string
 *   role:       string
 *   loginAt:    number  — ms timestamp
 *   lastActive: number  — ms timestamp, updated on every user interaction
 * }
 */

// ── GAS Backend URL ──────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwz32R6I3hNTZo3sRYZcKNcxLqtMiEoMoDOUOpnkYNHNYHcMMCmZUsHNh7wo4-AZBv-kQ/exec';

// ── Session Config ────────────────────────────────────────────────────────────
const SESSION_KEY         = 'adminSession';
const INACTIVITY_TIMEOUT  = 30 * 60 * 1000;  // 30 minutes in ms
const WARNING_BEFORE      =  2 * 60 * 1000;  // warn 2 minutes before expiry
const CHECK_INTERVAL      = 30 * 1000;        // check every 30 seconds

// ── Internal state ────────────────────────────────────────────────────────────
let _inactivityInterval = null;
let _warningShown       = false;

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Generate a cryptographically random unique session token (hex string, 32 bytes). */
function generateSessionToken() {
    try {
        // Modern: crypto.randomUUID (Chrome 92+, Firefox 95+, Edge 92+)
        if (crypto && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID().replace(/-/g, '');
        }
        // Fallback: crypto.getRandomValues
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        // Last resort: not cryptographically secure but better than nothing
        return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
}

/** Read the current session object from sessionStorage, or null. */
function getSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch { return null; }
}

/** Write a session object to sessionStorage. */
function setSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Update only the lastActive field in the current session. */
function refreshSession() {
    const s = getSession();
    if (s) {
        s.lastActive = Date.now();
        setSession(s);
        // If a warning was shown, dismiss it since the user is active
        if (_warningShown) {
            _warningShown = false;
            _dismissSessionWarning();
        }
    }
}

// ── Password Hashing ──────────────────────────────────────────────────────────

/**
 * Hash a plain-text password using SHA-256 (Web Crypto API).
 * This must match the hash stored in the Users sheet.
 */
async function hashPassword(password) {
    const msgBuffer  = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray  = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Login ─────────────────────────────────────────────────────────────────────

/**
 * Login — hash password first, then validate against GAS backend.
 * On success, stores a full session object with a unique token.
 */
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
        const passwordHash = await hashPassword(password);

        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            body:   JSON.stringify({ action: 'login', email: email.trim().toLowerCase(), password: passwordHash })
        });

        const data = await res.json();

        if (data.success) {
            const session = {
                token:      generateSessionToken(),
                email:      email.trim().toLowerCase(),
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
        // Re-trigger CSS shake animation
        errorEl.style.animation = 'none';
        errorEl.offsetHeight; // reflow
        errorEl.style.animation = '';
        btnSubmit.disabled = false;
        if (btnLabel) btnLabel.textContent = 'Sign In';
        if (btnIcon)  btnIcon.style.display = '';
        if (window.lucide) lucide.createIcons();
    }
}

// ── Logout ────────────────────────────────────────────────────────────────────

/**
 * Logout — fire-and-forget logout timestamp to GAS, clear session, redirect.
 * @param {string} [reason] — optional reason ('timeout' | undefined)
 */
function logout(reason) {
    // Stop watching for inactivity
    if (_inactivityInterval) {
        clearInterval(_inactivityInterval);
        _inactivityInterval = null;
    }

    const s = getSession();
    if (s && s.email) {
        fetch(SCRIPT_URL, {
            method: 'POST',
            body:   JSON.stringify({ action: 'logout', email: s.email })
        }).catch(() => {});
    }

    sessionStorage.removeItem(SESSION_KEY);

    // Redirect with optional reason code for the login page to display a message
    const dest = reason ? `login.html?reason=${encodeURIComponent(reason)}` : 'login.html';
    window.location.href = dest;
}

// ── Auth Guard ────────────────────────────────────────────────────────────────

/**
 * Auth guard — call at top of every admin page (synchronous).
 * Validates token presence and checks that the session hasn't timed out.
 */
function checkAuth() {
    const s = getSession();
    if (!s || !s.token) {
        window.location.replace('login.html');
        return;
    }

    // Check if session has already expired
    const idle = Date.now() - (s.lastActive || s.loginAt);
    if (idle >= INACTIVITY_TIMEOUT) {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace('login.html?reason=timeout');
    }
}

// ── Inactivity Watcher ────────────────────────────────────────────────────────

/**
 * Start the inactivity watcher on the admin page.
 * - Registers user-activity events to reset the lastActive timer.
 * - Polls every CHECK_INTERVAL ms to detect inactivity and show warnings/logout.
 */
function startInactivityWatcher() {
    const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Throttle refreshSession to at most once per 5 seconds to avoid excessive writes
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

    // Clear any existing interval
    if (_inactivityInterval) clearInterval(_inactivityInterval);

    _inactivityInterval = setInterval(() => {
        const s = getSession();
        if (!s) {
            // Session already gone — stop watching and redirect
            clearInterval(_inactivityInterval);
            window.location.replace('login.html?reason=timeout');
            return;
        }

        const idle        = Date.now() - (s.lastActive || s.loginAt);
        const timeLeft    = INACTIVITY_TIMEOUT - idle;

        if (timeLeft <= 0) {
            // Session expired
            clearInterval(_inactivityInterval);
            logout('timeout');
        } else if (timeLeft <= WARNING_BEFORE && !_warningShown) {
            // Show warning toast
            _warningShown = true;
            const minsLeft = Math.ceil(timeLeft / 60000);
            _showSessionWarning(minsLeft);
        }
    }, CHECK_INTERVAL);
}

// ── Session Warning UI ────────────────────────────────────────────────────────

let _warningToastEl = null;

function _showSessionWarning(minsLeft) {
    // Remove any existing warning
    _dismissSessionWarning();

    const el = document.createElement('div');
    el.id = '_session_warning_toast';
    el.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:99999',
        'background:#7c3aed',
        'color:#fff',
        'padding:13px 22px',
        'border-radius:10px',
        'font-size:13px',
        'font-weight:600',
        'font-family:DM Sans,system-ui,sans-serif',
        'display:flex',
        'align-items:center',
        'gap:12px',
        'box-shadow:0 4px 24px rgba(124,58,237,0.4)',
        'max-width:480px',
        'animation:slideUp_session .3s ease'
    ].join(';');

    el.innerHTML = `
        <span style="font-size:18px">⏱</span>
        <span>Your session will expire in <strong>${minsLeft} minute${minsLeft !== 1 ? 's' : ''}</strong> due to inactivity.</span>
        <button onclick="refreshSession()" style="
            background:rgba(255,255,255,0.2);
            border:none;
            border-radius:6px;
            color:#fff;
            font-size:12px;
            font-weight:700;
            padding:5px 12px;
            cursor:pointer;
            font-family:inherit;
            white-space:nowrap;
        ">Stay Logged In</button>
    `;

    // Add keyframe if not already in the document
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
    if (_warningToastEl) {
        _warningToastEl.remove();
        _warningToastEl = null;
    }
    const existing = document.getElementById('_session_warning_toast');
    if (existing) existing.remove();
}

// ── Compatibility shims (for old code that reads the individual keys) ──────────
// These allow any legacy code still referencing sessionStorage.getItem('adminEmail')
// etc. to work transparently.
(function patchLegacySessionKeys() {
    const s = typeof sessionStorage !== 'undefined' ? getSession() : null;
    if (!s) return;
    // Provide backward-compat individual keys if they're missing
    if (!sessionStorage.getItem('adminAuth'))  sessionStorage.setItem('adminAuth',  s.token);
    if (!sessionStorage.getItem('adminRole'))  sessionStorage.setItem('adminRole',  s.role);
    if (!sessionStorage.getItem('adminEmail')) sessionStorage.setItem('adminEmail', s.email);
})();

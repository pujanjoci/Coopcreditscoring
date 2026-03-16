const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwz32R6I3hNTZo3sRYZcKNcxLqtMiEoMoDOUOpnkYNHNYHcMMCmZUsHNh7wo4-AZBv-kQ/exec';

/**
 * Hash a plain-text password using SHA-256 (Web Crypto API).
 * This must match the hash stored in the Users sheet.
 */
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Login — hash password first, then validate against GAS backend.
 */
async function login(email, password) {
    const errorEl  = document.getElementById('login_error');
    const btnSubmit = document.getElementById('btn_submit');
    const btnLabel  = document.getElementById('btn_label');
    const btnIcon   = document.getElementById('btn_icon');

    errorEl.style.display = 'none';
    btnSubmit.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Signing in…';
    if (btnIcon)  btnIcon.style.display = 'none';

    try {
        const passwordHash = await hashPassword(password);

        const res  = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'login', email: email.trim().toLowerCase(), password: passwordHash })
        });

        const data = await res.json();

        if (data.success) {
            sessionStorage.setItem('adminAuth',  data.token || 'true');
            sessionStorage.setItem('adminRole',  data.role  || 'admin');
            sessionStorage.setItem('adminEmail', email.trim().toLowerCase());
            window.location.href = 'admin.html';
        } else {
            showError(data.error || 'Invalid email or password. Please try again.');
        }
    } catch (err) {
        showError('Network error. Please check your connection and try again.');
    }

    function showError(msg) {
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

/**
 * Logout — fire-and-forget logout timestamp to GAS, then clear session.
 */
function logout() {
    const userEmail = sessionStorage.getItem('adminEmail');

    if (userEmail) {
        fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'logout', email: userEmail })
        }).catch(() => {});
    }

    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminEmail');
    window.location.href = 'login.html';
}

/**
 * Auth guard — call at top of every admin page.
 */
function checkAuth() {
    const token = sessionStorage.getItem('adminAuth');
    if (!token) {
        window.location.replace('login.html');
    }
}

/**
 * admin/js/admin.js
 * Main admin panel orchestrator.
 *
 * Changes:
 *  - navigateAdmin() now syncs mobile bottom nav active state
 *  - Navigating to 'result' without a selected submission redirects + shows toast
 *  - Mobile bottom nav active class is applied correctly on every navigation
 *  - Removed mobile sidebar toggle (sidebar is hidden via CSS on mobile)
 */

// ── Config ────────────────────────────────────────────────────────────────────
const ADMIN_GAS_URL = 'https://script.google.com/macros/s/AKfycbzUJid9Q7bePYbSwnmNsbuUohAIDGeCfCz31V6j7pOLr2C8PnjwaDFW2l47VstJfv56Kw/exec';

// ── State ─────────────────────────────────────────────────────────────────────
let _currentAdminView = 'dashboard';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) lucide.createIcons();

    // Unhide 'Add Admin' button if superadmin
    const s = typeof getSession === 'function' ? getSession() : null;
    if (s && s.role === 'superadmin') {
        const addBtn = document.getElementById('btn_add_admin');
        if (addBtn) addBtn.style.display = 'flex';
    }

    // Fetch submissions before routing
    await fetchSubmissions();

    // Route from URL hash
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigateAdmin(hash);

    window.addEventListener('hashchange', () => {
        const h = location.hash.replace('#', '') || 'dashboard';
        navigateAdmin(h, false);
    });
});

// ── Navigation ────────────────────────────────────────────────────────────────
function navigateAdmin(view, pushHash = true) {
    const validViews = ['dashboard', 'submissions', 'result'];
    if (!validViews.includes(view)) view = 'dashboard';

    // Guard: result view requires a submission to be selected
    if (view === 'result' && !window._adminCurrentSubmission) {
        showAdminToast('Select a submission first to open the Approver view.', 'warning');
        // Bounce to submissions so the user can pick one
        view = 'submissions';
    }

    _currentAdminView = view;

    // Update URL hash
    if (pushHash && location.hash !== '#' + view) {
        history.pushState(null, '', '#' + view);
    }

    // Show / hide view panels
    document.querySelectorAll('.admin-view').forEach(el => {
        el.classList.toggle('active', el.id === 'view_' + view);
    });

    // Update sidebar active state (desktop)
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update page title
    const titles = {
        dashboard:   'Dashboard',
        submissions: 'Submissions',
        result:      'Result & Approver Review'
    };
    const titleEl = document.getElementById('admin_page_title');
    if (titleEl) titleEl.textContent = titles[view] || 'Admin Panel';

    // Sync mobile bottom nav active state
    _syncMobileNav(view);

    // Init view-specific logic
    if (view === 'dashboard')   loadDashboard();
    if (view === 'submissions') initSubmissionsView();

    if (window.lucide) lucide.createIcons();
}

/**
 * Sync the mobile bottom nav active state to the current view.
 * The "result" view maps to the mob_nav_result button.
 */
function _syncMobileNav(view) {
    const map = {
        dashboard:   'mob_nav_dashboard',
        submissions: 'mob_nav_submissions',
        result:      'mob_nav_result'
    };

    Object.keys(map).forEach(v => {
        const btn = document.getElementById(map[v]);
        if (btn) btn.classList.toggle('active', v === view);
    });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function loadDashboard() {
    const all = loadSubmissionsData();

    _setDash('dash_total',     all.length);
    _setDash('dash_pending',   all.filter(s => !s.approverStatus || s.approverStatus === 'pending').length);
    _setDash('dash_approved',  all.filter(s => s.approverStatus === 'approved').length);
    _setDash('dash_avg_score', all.length
        ? Math.round(all.reduce((a, s) => a + (s.score || 0), 0) / all.length)
        : '—');

    // Risk breakdown
    const tierCounts = { a: 0, b: 0, c: 0, d: 0 };
    all.forEach(s => {
        const t = (s.riskTier || '').toLowerCase();
        if      (t.startsWith('a')) tierCounts.a++;
        else if (t.startsWith('b')) tierCounts.b++;
        else if (t.startsWith('c')) tierCounts.c++;
        else if (t.startsWith('d')) tierCounts.d++;
    });
    _setDash('dash_a_count', tierCounts.a);
    _setDash('dash_b_count', tierCounts.b);
    _setDash('dash_c_count', tierCounts.c);
    _setDash('dash_d_count', tierCounts.d);

    // Recent 5
    renderRecentTable(all.slice().reverse().slice(0, 5));

    // Charts — delegated to charts.js
    if (typeof initDashboardCharts === 'function') {
        initDashboardCharts({ all, tierCounts });
    }
}

function _setDash(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderRecentTable(rows) {
    const tbody = document.getElementById('dash_recent_tbody');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `
            <tr><td colspan="5">
                <div class="empty-state" style="padding:24px 0">
                    <div class="empty-state-icon"><i data-lucide="inbox"></i></div>
                    <h3>No submissions yet</h3>
                    <p>Complete the questionnaire in the user portal.</p>
                </div>
            </td></tr>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = rows.map(sub => {
        const tier   = getRiskTierClass(sub.riskTier || '');
        const status = sub.approverStatus || 'pending';
        const date   = sub.submittedAt
            ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : '—';
        const scoreColor = getScoreColor(sub.score || 0);
        return `
            <tr onclick="openSubmission('${sub.id}')" style="cursor:pointer">
                <td><span style="font-weight:600;color:var(--ink-2)">${sub.coopName || '—'}</span></td>
                <td style="font-size:11px;color:var(--ink-5)">${date}</td>
                <td>
                    <span style="font-weight:800;font-size:13px;color:${scoreColor}">${sub.score ?? '—'}</span>
                    <span style="font-size:10px;color:var(--ink-5)">/1000</span>
                </td>
                <td><span class="risk-pill ${tier}">${sub.riskTier || '—'}</span></td>
                <td>
                    <span class="status-pill ${status}">
                        <span class="status-dot"></span>${_cap(status)}
                    </span>
                </td>
            </tr>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// ── Toast Utility ─────────────────────────────────────────────────────────────
function showAdminToast(message, type = '') {
    const area = document.getElementById('admin_toast_area');
    if (!area) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;

    // Icon per type
    const icons = {
        success: '✓',
        error:   '✕',
        warning: '⚠',
        info:    'ℹ'
    };
    const icon = icons[type] || '';

    toast.innerHTML = icon
        ? `<span style="font-size:14px;flex-shrink:0">${icon}</span><span>${message}</span>`
        : `<span>${message}</span>`;

    area.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// ── Super Admin: Add Admin ────────────────────────────────────────────────────
function openAddAdminModal() {
    const modal = document.getElementById('add_admin_modal');
    if (modal) modal.classList.add('active');
    document.getElementById('addAdminForm').reset();
    document.getElementById('new_admin_password').value = _generateSecurePassword();
}

function closeAddAdminModal() {
    const modal = document.getElementById('add_admin_modal');
    if (modal) modal.classList.remove('active');
}

function _generateSecurePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
}

async function submitNewAdmin(e) {
    e.preventDefault();
    const btn       = document.getElementById('btn_submit_new_admin');
    const btnLbl    = document.getElementById('btn_submit_new_admin_lbl');
    const email     = document.getElementById('new_admin_email').value.trim();
    const username  = document.getElementById('new_admin_username').value.trim();
    const role      = document.getElementById('new_admin_role').value;
    const password  = document.getElementById('new_admin_password').value;

    if (!email || !username || !password) return;

    btn.disabled = true;
    btn.style.opacity = '0.7';
    btnLbl.textContent = 'Creating...';

    try {
        const s = typeof getSession === 'function' ? getSession() : null;
        if (!s || s.role !== 'superadmin') throw new Error("Unauthorized");

        const hashedPw = typeof hashPassword === 'function' 
            ? await hashPassword(password) 
            : password;

        const res = await fetch(ADMIN_GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'addAdmin',
                requesterEmail: s.email,
                newEmail: email,
                newUsername: username,
                newRole: role,
                newPassword: hashedPw
            }),
            redirect: 'follow'
        });

        const data = await res.json();
        if (data.success) {
            showAdminToast(`Successfully created ${role} account for ${email}`, 'success');
            closeAddAdminModal();
            prompt("User created successfully. Copy the temporary password below to share with them:", password);
        } else {
            showAdminToast(data.error || 'Failed to create user', 'error');
        }
    } catch (err) {
        showAdminToast('Network error while adding admin', 'error');
    } finally {
        btn.disabled = false;
        btn.style.opacity = '1';
        btnLbl.textContent = 'Create Admin';
    }
}
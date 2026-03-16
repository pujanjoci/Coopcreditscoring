/**
 * admin/js/admin.js
 * Main admin panel orchestrator:
 *   - Sidebar navigation + routing
 *   - Dashboard stats
 *   - Toast utility
 *   - Mobile sidebar toggle
 */

// ── Config ──────────────────────────────────────────────────────────────────
/** Set this to the deployed GAS URL if needed for approver decision saving */
const ADMIN_GAS_URL = '';

// ── State ────────────────────────────────────────────────────────────────────
let _currentAdminView = 'dashboard';

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    // Route from URL hash
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigateAdmin(hash);

    window.addEventListener('hashchange', () => {
        const h = location.hash.replace('#', '') || 'dashboard';
        navigateAdmin(h, false);
    });

    // Mobile sidebar
    const menuBtn = document.getElementById('admin_mobile_menu');
    const overlay = document.getElementById('admin_sidebar_overlay');
    if (menuBtn) menuBtn.addEventListener('click', toggleAdminSidebar);
    if (overlay) overlay.addEventListener('click', closeAdminSidebar);
});

// ── Navigation ───────────────────────────────────────────────────────────────
function navigateAdmin(view, pushHash = true) {
    const validViews = ['dashboard', 'submissions', 'result'];
    if (!validViews.includes(view)) view = 'dashboard';

    _currentAdminView = view;

    // Update URL hash
    if (pushHash && location.hash !== '#' + view) {
        history.pushState(null, '', '#' + view);
    }

    // Show/hide view panels
    document.querySelectorAll('.admin-view').forEach(el => {
        el.classList.toggle('active', el.id === 'view_' + view);
    });

    // Update sidebar active state
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
        const target = btn.dataset.view;
        btn.classList.toggle('active', target === view);
    });

    // Update page title
    const titles = {
        dashboard:   'Dashboard',
        submissions: 'Submissions',
        result:      'Result & Approver Review'
    };
    const titleEl = document.getElementById('admin_page_title');
    if (titleEl) titleEl.textContent = titles[view] || 'Admin Panel';

    // Initialise view-specific logic
    if (view === 'dashboard')   loadDashboard();
    if (view === 'submissions') initSubmissionsView();
    if (view === 'result' && !window._adminCurrentSubmission) {
        // If navigated directly to result with no selection, go to submissions
        navigateAdmin('submissions');
    }

    closeAdminSidebar();

    // Notify mobile bottom nav to update its active state
    document.dispatchEvent(new CustomEvent('adminViewChanged', { detail: view }));
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function loadDashboard() {
    const all = loadSubmissionsData();

    _setDash('dash_total',       all.length);
    _setDash('dash_pending',     all.filter(s => !s.approverStatus || s.approverStatus === 'pending').length);
    _setDash('dash_approved',    all.filter(s => s.approverStatus === 'approved').length);
    _setDash('dash_avg_score',   all.length ? Math.round(all.reduce((a, s) => a + (s.score || 0), 0) / all.length) : '—');

    // Risk breakdown
    _setDash('dash_a_count', all.filter(s => (s.riskTier || '').startsWith('A')).length);
    _setDash('dash_b_count', all.filter(s => (s.riskTier || '').startsWith('B')).length);
    _setDash('dash_c_count', all.filter(s => (s.riskTier || '').startsWith('C')).length);
    _setDash('dash_d_count', all.filter(s => (s.riskTier || '').startsWith('D')).length);

    // Recent submissions preview (last 5)
    renderRecentTable(all.slice().reverse().slice(0, 5));
}

function _setDash(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderRecentTable(rows) {
    const tbody = document.getElementById('dash_recent_tbody');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:24px 0">
            <div class="empty-state-icon"><i data-lucide="inbox"></i></div>
            <h3>No submissions yet</h3>
            <p>Complete the questionnaire in the user portal.</p>
        </div></td></tr>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = rows.map(sub => {
        const tier   = getRiskTierClass(sub.riskTier || '');
        const status = sub.approverStatus || 'pending';
        const date   = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
        const scoreColor = getScoreColor(sub.score || 0);
        return `
            <tr onclick="openSubmission('${sub.id}')" style="cursor:pointer">
                <td><span style="font-weight:600;color:var(--ink-2)">${sub.coopName || '—'}</span></td>
                <td style="font-size:11px;color:var(--ink-5)">${date}</td>
                <td><span style="font-weight:800;font-size:13px;color:${scoreColor}">${sub.score ?? '—'}</span><span style="font-size:10px;color:var(--ink-5)">/1000</span></td>
                <td><span class="risk-pill ${tier}">${sub.riskTier || '—'}</span></td>
                <td><span class="status-pill ${status}"><span class="status-dot"></span>${_cap(status)}</span></td>
            </tr>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

// ── Mobile Sidebar ────────────────────────────────────────────────────────────
function toggleAdminSidebar() {
    document.getElementById('admin_sidebar')?.classList.toggle('open');
    document.getElementById('admin_sidebar_overlay')?.classList.toggle('show');
}

function closeAdminSidebar() {
    document.getElementById('admin_sidebar')?.classList.remove('open');
    document.getElementById('admin_sidebar_overlay')?.classList.remove('show');
}

// ── Toast Utility ─────────────────────────────────────────────────────────────
function showAdminToast(message, type = '') {
    const area = document.getElementById('admin_toast_area');
    if (!area) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.textContent = message;
    area.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

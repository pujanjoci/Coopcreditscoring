/**
 * admin/js/admin.js
 * Main admin panel orchestrator.
 *
 * Changes from original:
 *  - loadDashboard() now renders all 4 charts:
 *      • Score Distribution donut  (#dash_score_donut)
 *      • Review Status donut       (#dash_status_donut)
 *      • Risk Tier bar             (#dash_risk_bar)
 *      • Credit Score Trend line   (#dash_score_trend)
 *  - Chart instances stored so they are destroyed before re-render
 *  - _showChart / _showEmpty helpers control canvas vs placeholder visibility
 *  - navigateAdmin() syncs mobile bottom nav active state
 *  - Navigating to 'result' without a selected submission redirects + shows toast
 */

// ── Config ────────────────────────────────────────────────────────────────────
const ADMIN_GAS_URL = 'https://script.google.com/macros/s/AKfycbz9PodwguDEr4EWEMKlN-Lu566k13970kXXQlMp9rwEsgpni7gQz-dALRlnB9q5Fht22g/exec';

// ── State ─────────────────────────────────────────────────────────────────────
let _currentAdminView = 'dashboard';

// Chart instances — kept so we can destroy before re-drawing
let _chartScoreDonut  = null;
let _chartStatusDonut = null;
let _chartRiskBar     = null;
let _chartScoreTrend  = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) lucide.createIcons();

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

    // Sync mobile bottom nav
    _syncMobileNav(view);

    // Init view-specific logic
    if (view === 'dashboard')   loadDashboard();
    if (view === 'submissions') initSubmissionsView();

    if (window.lucide) lucide.createIcons();
}

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

    // KPI cards
    _setDash('dash_total',     all.length);
    _setDash('dash_pending',   all.filter(s => !s.approverStatus || s.approverStatus === 'pending').length);
    _setDash('dash_approved',  all.filter(s => s.approverStatus === 'approved').length);
    _setDash('dash_avg_score', all.length
        ? Math.round(all.reduce((a, s) => a + (s.score || 0), 0) / all.length)
        : '—');

    // Risk tier counts
    const tierCounts = { a: 0, b: 0, c: 0, d: 0 };
    all.forEach(s => {
        const t = (s.riskTier || '').toLowerCase();
        if      (t.startsWith('a')) tierCounts.a++;
        else if (t.startsWith('b')) tierCounts.b++;
        else if (t.startsWith('c')) tierCounts.c++;
        else                        tierCounts.d++;
    });
    _setDash('dash_a_count', tierCounts.a);
    _setDash('dash_b_count', tierCounts.b);
    _setDash('dash_c_count', tierCounts.c);
    _setDash('dash_d_count', tierCounts.d);

    // Recent 5
    renderRecentTable(all.slice().reverse().slice(0, 5));

    // Charts
    _renderScoreDonut(tierCounts, all.length);
    _renderStatusDonut(all);
    _renderRiskBar(tierCounts);
    _renderScoreTrend(all);
}

function _setDash(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Chart helpers ─────────────────────────────────────────────────────────────

/**
 * Show the canvas: remove .is-empty from the parent chart-body.
 * CSS rule `.dash-chart-body.is-empty canvas { display:none }` handles the rest.
 */
function _showChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const body = canvas.closest('.dash-chart-body');
    if (body) body.classList.remove('is-empty');
}

/**
 * Hide the canvas, show placeholder: add .is-empty to the parent chart-body.
 */
function _showEmpty(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const body = canvas.closest('.dash-chart-body');
    if (body) body.classList.add('is-empty');
}

function _destroyChart(instance) {
    if (instance) {
        try { instance.destroy(); } catch (e) { /* ignore */ }
    }
    return null;
}

// ── Score Distribution Donut ──────────────────────────────────────────────────
function _renderScoreDonut(tierCounts, total) {
    _chartScoreDonut = _destroyChart(_chartScoreDonut);

    if (!total) {
        _showEmpty('dash_score_donut');
        return;
    }
    _showChart('dash_score_donut');

    const ctx = document.getElementById('dash_score_donut');
    if (!ctx) return;

    _chartScoreDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['A Risk', 'B Risk', 'C Risk', 'D Risk'],
            datasets: [{
                data: [tierCounts.a, tierCounts.b, tierCounts.c, tierCounts.d],
                backgroundColor: ['#16a34a', '#2563eb', '#d97706', '#dc2626'],
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 10, family: 'DM Sans' },
                        padding: 10,
                        boxWidth: 10,
                        color: '#4a4a4a'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,15,18,0.92)',
                    titleFont: { size: 11, family: 'DM Sans', weight: '700' },
                    bodyFont:  { size: 11, family: 'DM Sans' },
                    padding: 10,
                    callbacks: {
                        label: ctx => {
                            const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                            return `  ${ctx.raw} submissions  (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ── Review Status Donut ───────────────────────────────────────────────────────
function _renderStatusDonut(all) {
    _chartStatusDonut = _destroyChart(_chartStatusDonut);

    if (!all.length) {
        _showEmpty('dash_status_donut');
        return;
    }
    _showChart('dash_status_donut');

    const ctx = document.getElementById('dash_status_donut');
    if (!ctx) return;

    const counts = {
        pending:     all.filter(s => !s.approverStatus || s.approverStatus === 'pending').length,
        approved:    all.filter(s => s.approverStatus === 'approved').length,
        conditional: all.filter(s => s.approverStatus === 'conditional').length,
        rejected:    all.filter(s => s.approverStatus === 'rejected').length
    };

    _chartStatusDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Approved', 'Conditional', 'Rejected'],
            datasets: [{
                data: [counts.pending, counts.approved, counts.conditional, counts.rejected],
                backgroundColor: ['#9ca3af', '#16a34a', '#d97706', '#dc2626'],
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 10, family: 'DM Sans' },
                        padding: 10,
                        boxWidth: 10,
                        color: '#4a4a4a'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,15,18,0.92)',
                    titleFont: { size: 11, family: 'DM Sans', weight: '700' },
                    bodyFont:  { size: 11, family: 'DM Sans' },
                    padding: 10,
                    callbacks: {
                        label: ctx => {
                            const pct = all.length > 0 ? Math.round((ctx.raw / all.length) * 100) : 0;
                            return `  ${ctx.raw} submissions  (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ── Risk Tier Bar ─────────────────────────────────────────────────────────────
function _renderRiskBar(tierCounts) {
    _chartRiskBar = _destroyChart(_chartRiskBar);

    const total = tierCounts.a + tierCounts.b + tierCounts.c + tierCounts.d;
    if (!total) {
        _showEmpty('dash_risk_bar');
        return;
    }
    _showChart('dash_risk_bar');

    const ctx = document.getElementById('dash_risk_bar');
    if (!ctx) return;

    _chartRiskBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['A Risk', 'B Risk', 'C Risk', 'D Risk'],
            datasets: [{
                label: 'Submissions',
                data: [tierCounts.a, tierCounts.b, tierCounts.c, tierCounts.d],
                backgroundColor: ['#16a34a', '#2563eb', '#d97706', '#dc2626'],
                borderRadius: 5,
                borderSkipped: false,
                maxBarThickness: 36
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,15,18,0.92)',
                    titleFont: { size: 11, family: 'DM Sans', weight: '700' },
                    bodyFont:  { size: 11, family: 'DM Sans' },
                    padding: 10,
                    callbacks: {
                        label: ctx => `  ${ctx.raw} submission${ctx.raw !== 1 ? 's' : ''}`
                    }
                }
            },
            scales: {
                x: {
                    grid:  { display: false },
                    ticks: { font: { size: 10, family: 'DM Sans' }, color: '#6b6b6b' }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 10, family: 'DM Sans' },
                        color: '#6b6b6b'
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

// ── Credit Score Trend Line ───────────────────────────────────────────────────
function _renderScoreTrend(all) {
    _chartScoreTrend = _destroyChart(_chartScoreTrend);

    // Last 20 submissions in chronological order
    const sorted = all
        .filter(s => s.score != null && s.submittedAt)
        .slice()
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        .slice(-20);

    if (!sorted.length) {
        _showEmpty('dash_score_trend');
        return;
    }
    _showChart('dash_score_trend');

    const ctx = document.getElementById('dash_score_trend');
    if (!ctx) return;

    const labels = sorted.map(s =>
        new Date(s.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    );
    const scores = sorted.map(s => s.score || 0);

    // Per-point colours based on risk tier
    const pointColors = scores.map(sc => {
        if (sc >= 850) return '#16a34a';
        if (sc >= 700) return '#2563eb';
        if (sc >= 500) return '#d97706';
        return '#dc2626';
    });
    const pointBorders = scores.map(sc => {
        if (sc >= 850) return '#14532d';
        if (sc >= 700) return '#1e3a8a';
        if (sc >= 500) return '#92400e';
        return '#7f1d1d';
    });

    // Moving average overlay (window = 3)
    const maScores = scores.map((_, i, arr) => {
        const w = arr.slice(Math.max(0, i - 2), i + 1);
        return Math.round(w.reduce((a, b) => a + b, 0) / w.length);
    });

    _chartScoreTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    // Invisible connecting line; points are the visual
                    label: 'Score',
                    data: scores,
                    borderColor: 'rgba(100,116,139,0.25)',
                    borderWidth: 1.5,
                    borderDash: [],
                    pointBackgroundColor: pointColors,
                    pointBorderColor: pointBorders,
                    pointBorderWidth: 1.5,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.35,
                    fill: false
                },
                {
                    label: '3-pt Avg',
                    data: maScores,
                    borderColor: 'rgba(37,99,235,0.55)',
                    borderWidth: 2,
                    borderDash: [5, 3],
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 10, family: 'DM Sans' },
                        padding: 12,
                        boxWidth: 20,
                        color: '#6b6b6b',
                        usePointStyle: true,
                        pointStyle: 'line'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,15,18,0.92)',
                    titleFont: { size: 11, family: 'DM Sans', weight: '700' },
                    bodyFont:  { size: 11, family: 'DM Sans' },
                    padding: 10,
                    callbacks: {
                        afterLabel: (ctx) => {
                            if (ctx.datasetIndex !== 0) return '';
                            const sc = ctx.raw;
                            let tier = 'D Risk';
                            if (sc >= 850) tier = 'A Risk';
                            else if (sc >= 700) tier = 'B Risk';
                            else if (sc >= 500) tier = 'C Risk';
                            return '  → ' + tier;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid:  { display: false },
                    ticks: { font: { size: 9, family: 'DM Sans' }, color: '#6b6b6b', maxRotation: 0 }
                },
                y: {
                    min: 0,
                    max: 1000,
                    ticks: {
                        stepSize: 200,
                        font: { size: 9, family: 'DM Sans' },
                        color: '#6b6b6b'
                    },
                    grid: { color: 'rgba(0,0,0,0.04)' }
                }
            }
        }
    });
}

// ── Recent submissions table ───────────────────────────────────────────────────
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

    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const icon  = icons[type] || '';

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
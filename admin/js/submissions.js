/**
 * admin/js/submissions.js
 * Manages the submissions list view — reads from localStorage,
 * renders searchable/filterable table, handles "View Details" click.
 */

const SUBMISSIONS_KEY = 'coop_submissions';

/** Load all submissions from localStorage */
function loadSubmissionsData() {
    try {
        return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
    } catch { return []; }
}

/** Render the submissions table into #sub_table_body */
function renderSubmissionsTable(filter = '', riskFilter = '') {
    const all  = loadSubmissionsData();
    const tbody = document.getElementById('sub_table_body');
    const count = document.getElementById('sub_count_badge');
    if (!tbody) return;

    let rows = all.slice().reverse(); // newest first

    // Text filter
    if (filter.trim()) {
        const q = filter.toLowerCase();
        rows = rows.filter(r =>
            (r.coopName || '').toLowerCase().includes(q) ||
            (r.id || '').toLowerCase().includes(q)
        );
    }

    // Risk filter
    if (riskFilter && riskFilter !== 'all') {
        rows = rows.filter(r => (r.riskTier || '').toLowerCase().startsWith(riskFilter));
    }

    if (count) count.textContent = all.length;

    if (!rows.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="inbox"></i></div>
                        <h3>${all.length ? 'No results match your filters' : 'No submissions yet'}</h3>
                        <p>${all.length ? 'Try clearing the search or filter.' : 'Complete the questionnaire in the user portal to create a submission.'}</p>
                    </div>
                </td>
            </tr>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = rows.map((sub, i) => {
        const tier     = getRiskTierClass(sub.riskTier || sub.tier || '');
        const status   = sub.approverStatus || 'pending';
        const date     = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
        const score    = sub.score ?? '—';
        const scoreColor = getScoreColor(score);
        const shortId  = (sub.id || '').toString().slice(-6);

        return `
            <tr onclick="openSubmission('${sub.id}')">
                <td><span class="sub-id">#${shortId}</span></td>
                <td><span class="sub-coop-name">${_escHtml(sub.coopName || '—')}</span></td>
                <td><span style="font-size:11px;color:var(--ink-5)">${date}</span></td>
                <td><span class="sub-score" style="color:${scoreColor}">${score}</span><span style="font-size:10px;color:var(--ink-5)">/1000</span></td>
                <td><span class="risk-pill ${tier}">${_escHtml(sub.riskTier || '—')}</span></td>
                <td><span class="status-pill ${status}"><span class="status-dot"></span>${_cap(status)}</span></td>
                <td style="font-size:11px;color:var(--ink-5)">${_escHtml(sub.modelType === 'collection' ? 'Collection' : 'Processing')}</td>
                <td><button class="btn-view" onclick="event.stopPropagation();openSubmission('${sub.id}')"><i data-lucide="eye" style="width:12px;height:12px;stroke-width:2;vertical-align:middle;"></i> View</button></td>
            </tr>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function getRiskTierClass(tier) {
    const t = (tier || '').toLowerCase();
    if (t.startsWith('a')) return 'a';
    if (t.startsWith('b')) return 'b';
    if (t.startsWith('c')) return 'c';
    return 'd';
}

function getScoreColor(score) {
    if (score >= 850) return '#16a34a';
    if (score >= 700) return '#2563eb';
    if (score >= 500) return '#d97706';
    return '#b91c1c';
}

function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function _escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/** Open a submission — navigate to result+approver view */
function openSubmission(id) {
    const all = loadSubmissionsData();
    const sub = all.find(s => s.id === id || String(s.id) === String(id));
    if (!sub) { showAdminToast('Submission not found.', 'error'); return; }

    // Store in module-level state for result + approver views
    window._adminCurrentSubmission = sub;

    navigateAdmin('result');
    renderResultViewer(sub);
    renderApproverPanel(sub);
}

/** Initialise submissions view — wire search + filter */
function initSubmissionsView() {
    renderSubmissionsTable();

    const searchInput = document.getElementById('sub_search');
    const riskSelect  = document.getElementById('sub_risk_filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderSubmissionsTable(searchInput.value, riskSelect?.value || '');
        });
    }
    if (riskSelect) {
        riskSelect.addEventListener('change', () => {
            renderSubmissionsTable(searchInput?.value || '', riskSelect.value);
        });
    }
}

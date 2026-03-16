/**
 * admin/js/submissions.js
 * Manages the submissions list view.
 *
 * FIX: mapSubmissionFromGAS now maps exact column names produced by Code.gs:
 *   'Submission Timestamp' | 'Server Timestamp' | 'Total Score' | 'Risk Tier' |
 *   'Coop Name' | 'Answers JSON' | 'Approver Status' | 'Approver Notes' | 'Approver Decided At'
 */

window._adminSubmissions = [];

// ── Fetch from GAS ────────────────────────────────────────────────────────────

async function fetchSubmissions() {
    const url = typeof ADMIN_GAS_URL !== 'undefined' ? ADMIN_GAS_URL : '';
    if (!url) {
        console.warn('ADMIN_GAS_URL not defined — skipping server fetch.');
        return [];
    }

    // Show loading indicator in submissions table
    const tbody = document.getElementById('sub_table_body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;">
                    <div style="display:inline-flex;align-items:center;gap:10px;color:var(--ink-5);font-size:13px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                             fill="none" stroke="var(--brand,#2563eb)" stroke-width="2"
                             style="animation:spin 1s linear infinite;flex-shrink:0">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Fetching submissions from server…
                    </div>
                </td>
            </tr>`;
        // Inject spin keyframe once
        if (!document.getElementById('_spin_style')) {
            const s = document.createElement('style');
            s.id = '_spin_style';
            s.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
            document.head.appendChild(s);
        }
    }

    try {
        const res = await fetch(url + '?action=getSubmissions', { redirect: 'follow' });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();

        // Log the raw response so you can diagnose GAS deployment issues
        // console.log('[fetchSubmissions] server response:', data);

        // GAS may return { error: '...' } on failure
        if (data && data.error) throw new Error('GAS error: ' + data.error);

        // If GAS still returns the debug object (old deployment), detect it clearly
        if (data && data.spreadsheetName !== undefined) {
            throw new Error(
                'GAS is still running the OLD deployment. ' +
                'In Apps Script: click Deploy → Manage deployments → edit the active deployment → ' +
                'set "Version" to "New version" → Deploy. Then hard-refresh this page.'
            );
        }

        // data should be an array of row objects
        if (!Array.isArray(data)) {
            throw new Error(
                'Unexpected response format from server. Got: ' +
                JSON.stringify(data).slice(0, 200)
            );
        }

        window._adminSubmissions = data.map(mapSubmissionFromGAS);

        // Refresh dashboard stats if already rendered
        if (typeof loadDashboard === 'function') loadDashboard();

        return window._adminSubmissions;
    } catch (err) {
        console.error('fetchSubmissions error:', err);
        if (typeof showAdminToast === 'function') {
            showAdminToast('Failed to load submissions: ' + err.message, 'error');
        }
        if (tbody) {
            tbody.innerHTML = `
                <tr><td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="wifi-off"></i></div>
                        <h3>Could not load submissions</h3>
                        <p>${err.message}</p>
                    </div>
                </td></tr>`;
            if (window.lucide) lucide.createIcons();
        }
        return [];
    }
}

// ── Map GAS row → submission object ─────────────────────────────────────────
/**
 * FIX: Uses exact column names from Code.gs submitAnswers():
 *   'Submission Timestamp', 'Server Timestamp', 'Total Score', 'Risk Tier',
 *   'Coop Name', 'Answers JSON', 'Approver Status', 'Approver Notes', 'Approver Decided At'
 */
function mapSubmissionFromGAS(raw) {
    // Parse Answers JSON safely
    const answersStr = raw['Answers JSON'] || '{}';
    const answers = (function() {
        try {
            if (typeof answersStr === 'string' && answersStr.trim().startsWith('{')) {
                return JSON.parse(answersStr);
            }
        } catch (e) { /* fall through */ }
        return {};
    })();

    // Build a stable synthetic ID from timestamp + coop name
    const tsRaw   = raw['Submission Timestamp'] || raw['Server Timestamp'] || '';
    const coopRaw = raw['Coop Name'] || answers.coop_name || '';
    const syntheticId = (String(tsRaw) + String(coopRaw))
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase()
        || ('sub_' + Math.random().toString(36).slice(2));

    // Approver status — normalise to lowercase, default to 'pending'
    let approverStatus = String(raw['Approver Status'] || '').trim().toLowerCase();
    if (!approverStatus || approverStatus === '') approverStatus = 'pending';

    // Score — ensure it's a number
    const score = raw['Total Score'] !== '' && raw['Total Score'] != null
        ? Number(raw['Total Score'])
        : 0;

    return {
        id:                syntheticId,
        coopName:          raw['Coop Name']          || answers.coop_name || 'Unknown',
        submittedAt:       raw['Submission Timestamp'] || raw['Server Timestamp'] || new Date().toISOString(),
        score:             isNaN(score) ? 0 : score,
        riskTier:          raw['Risk Tier']           || '—',
        approverStatus:    approverStatus,
        approverNotes:     raw['Approver Notes']      || '',
        approverDecidedAt: raw['Approver Decided At'] || null,
        modelType:         answers.modelType          || 'collection',
        customerType:      answers.customerType       || 'new',
        answers:           answers,
        result:            {},   // result is computed client-side; not stored in sheet
        _raw:              raw
    };
}

// ── In-memory accessor ────────────────────────────────────────────────────────

function loadSubmissionsData() {
    return window._adminSubmissions || [];
}

// ── Render table ──────────────────────────────────────────────────────────────

function renderSubmissionsTable(filter, riskFilter) {
    filter     = filter     || '';
    riskFilter = riskFilter || '';

    const all   = loadSubmissionsData();
    const tbody = document.getElementById('sub_table_body');
    const count = document.getElementById('sub_count_badge');
    if (!tbody) return;

    let rows = all.slice().reverse(); // newest first

    if (filter.trim()) {
        const q = filter.toLowerCase();
        rows = rows.filter(r =>
            (r.coopName || '').toLowerCase().includes(q) ||
            (r.id       || '').toLowerCase().includes(q)
        );
    }

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
                        <p>${all.length ? 'Try clearing the search or filter.' : 'Complete the questionnaire in the user portal.'}</p>
                    </div>
                </td>
            </tr>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = rows.map(function(sub) {
        const tier       = getRiskTierClass(sub.riskTier || '');
        const status     = sub.approverStatus || 'pending';
        const date       = sub.submittedAt
            ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—';
        const score      = sub.score != null ? sub.score : '—';
        const scoreColor = getScoreColor(sub.score || 0);
        const shortId    = (sub.id || '').toString().slice(-6);
        const modelLabel = sub.modelType === 'collection' ? 'Collection' : 'Processing';

        return `
            <tr onclick="openSubmission('${sub.id}')">
                <td><span class="sub-id">#${shortId}</span></td>
                <td><span class="sub-coop-name">${_escHtml(sub.coopName || '—')}</span></td>
                <td><span style="font-size:11px;color:var(--ink-5)">${date}</span></td>
                <td>
                    <span class="sub-score" style="color:${scoreColor}">${score}</span>
                    <span style="font-size:10px;color:var(--ink-5)">/1000</span>
                </td>
                <td><span class="risk-pill ${tier}">${_escHtml(sub.riskTier || '—')}</span></td>
                <td>
                    <span class="status-pill ${status}">
                        <span class="status-dot"></span>${_cap(status)}
                    </span>
                </td>
                <td style="font-size:11px;color:var(--ink-5)">${_escHtml(modelLabel)}</td>
                <td>
                    <button class="btn-view" onclick="event.stopPropagation();openSubmission('${sub.id}')">
                        <i data-lucide="eye" style="width:12px;height:12px;stroke-width:2;vertical-align:middle;"></i> View
                    </button>
                </td>
            </tr>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function _cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function _escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── Open submission ───────────────────────────────────────────────────────────

function openSubmission(id) {
    const all = loadSubmissionsData();
    const sub = all.find(function(s) {
        return s.id === id || String(s.id) === String(id);
    });
    if (!sub) {
        if (typeof showAdminToast === 'function') showAdminToast('Submission not found.', 'error');
        return;
    }

    window._adminCurrentSubmission = sub;
    navigateAdmin('result');
    renderResultViewer(sub);
    renderApproverPanel(sub);
}

// ── Init submissions view ─────────────────────────────────────────────────────

function initSubmissionsView() {
    renderSubmissionsTable();

    const searchInput = document.getElementById('sub_search');
    const riskSelect  = document.getElementById('sub_risk_filter');

    if (searchInput) {
        // Remove old listeners by cloning
        const newSearch = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearch, searchInput);
        newSearch.addEventListener('input', function() {
            renderSubmissionsTable(newSearch.value, riskSelect ? riskSelect.value : '');
        });
    }

    if (riskSelect) {
        const newSelect = riskSelect.cloneNode(true);
        riskSelect.parentNode.replaceChild(newSelect, riskSelect);
        newSelect.addEventListener('change', function() {
            const search = document.getElementById('sub_search');
            renderSubmissionsTable(search ? search.value : '', newSelect.value);
        });
    }
}
/**
 * admin/js/approverPanel.js
 * Renders the approver review interface for a selected submission.
 * Allows adding recommendation notes and setting a decision.
 */

/** Render the approver panel for a given submission */
function renderApproverPanel(sub) {
    const result  = sub.result || {};
    const score   = result.totalScore ?? sub.score ?? 0;
    const tier    = getAdminTier(score);

    // Score summary row
    _setAp('ap_score_num', score);
    _setAp('ap_risk_category', result.riskCategory || tier.label);
    const scoreNumEl = document.getElementById('ap_score_num');
    if (scoreNumEl) scoreNumEl.style.color = '#fff';

    // Key metrics table
    renderApproverMetrics(sub);

    // Recommendation text + existing decision
    const textarea = document.getElementById('ap_recommendation');
    if (textarea) textarea.value = sub.approverNotes || '';

    // Decision buttons
    const status = sub.approverStatus || 'pending';
    _renderDecisionState(status, sub.approverDecidedBy, sub.approverDecidedAt);

    // Wire decision buttons
    _wireDecisionButton('ap_btn_approve',      'approved');
    _wireDecisionButton('ap_btn_conditional',  'conditional');
    _wireDecisionButton('ap_btn_reject',       'rejected');

    if (window.lucide) lucide.createIcons();
}

function _setAp(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderApproverMetrics(sub) {
    const result  = sub.result || {};
    const answers = sub.answers || {};
    const metrics = result.metrics || {};
    const data    = result.data    || {};

    const rows = [
        ['Proposed Loan',          _fmtNPR(answers.proposed_loan)],
        ['Total Loan',             _fmtNPR(answers.total_loan || data.total_loan)],
        ['Total Revenue',          _fmtNPR(data.total_revenue || answers.total_revenue)],
        ['Total Assets',           _fmtNPR(data.total_assets  || answers.total_assets)],
        ['Total Liabilities',      _fmtNPR(data.total_liabilities || answers.total_liabilities)],
        ['Net Worth / Equity',     _fmtNPR(data.net_worth || answers.net_worth)],
        ['DSCR',                   metrics.dscr      != null ? metrics.dscr.toFixed(2)  : '—'],
        ['Current Ratio',          metrics.current_ratio != null ? metrics.current_ratio.toFixed(2) : '—'],
        ['Debt / Equity',          metrics.debt_equity != null ? metrics.debt_equity.toFixed(2) : '—'],
        ['GNPA %',                 metrics.gnpa_pct  != null ? metrics.gnpa_pct.toFixed(1) + '%'  : '—'],
        ['Milk Loss %',            metrics.milk_loss_pct != null ? metrics.milk_loss_pct.toFixed(1) + '%' : '—'],
        ['Collateral Coverage',    metrics.collateral_cover != null ? metrics.collateral_cover.toFixed(2) + 'x' : '—'],
    ].filter(([, v]) => v && v !== '—');

    const table = document.getElementById('ap_metrics_table');
    if (!table) return;

    table.innerHTML = rows.map(([k, v]) => `
        <tr>
            <td>${k}</td>
            <td>${v}</td>
        </tr>`).join('');
}

function _fmtNPR(val) {
    const n = Number(val);
    if (!val || isNaN(n)) return '—';
    if (n >= 1e7) return 'NPR ' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return 'NPR ' + (n / 1e5).toFixed(2) + ' L';
    return 'NPR ' + n.toLocaleString('en-IN');
}

function _wireDecisionButton(btnId, decision) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.onclick = () => saveApproverDecision(decision);
}

/** Save approver decision to localStorage */
function saveApproverDecision(decision) {
    const sub = window._adminCurrentSubmission;
    if (!sub) { showAdminToast('No submission selected.', 'error'); return; }

    const textarea = document.getElementById('ap_recommendation');
    const notes    = textarea ? textarea.value.trim() : '';

    if (!notes && decision !== 'pending') {
        showAdminToast('Please add a recommendation note before deciding.', 'error');
        return;
    }

    // Update in localStorage
    try {
        const all = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
        const idx = all.findIndex(s => String(s.id) === String(sub.id));
        if (idx !== -1) {
            all[idx].approverStatus    = decision;
            all[idx].approverNotes     = notes;
            all[idx].approverDecidedAt = new Date().toISOString();
            localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(all));

            // Update in-memory reference
            window._adminCurrentSubmission = all[idx];

            _renderDecisionState(decision, 'Admin', all[idx].approverDecidedAt);
            showAdminToast(`Decision saved: ${_cap(decision)}`, 'success');

            // Optionally post to GAS
            submitApproverDecisionToGAS(all[idx]);

            // Refresh submissions table if it's rendered
            renderSubmissionsTable();
        } else {
            showAdminToast('Could not find submission in storage.', 'error');
        }
    } catch (err) {
        showAdminToast('Failed to save: ' + err.message, 'error');
    }
}

function _renderDecisionState(status, by, at) {
    const btnsEl   = document.getElementById('ap_decision_buttons');
    const bannerEl = document.getElementById('ap_decision_banner');
    const bannerTxt= document.getElementById('ap_decision_banner_text');

    if (!btnsEl || !bannerEl) return;

    if (status === 'pending' || !status) {
        btnsEl.classList.remove('hidden');
        bannerEl.classList.add('hidden');
        return;
    }

    // Hide buttons, show banner
    btnsEl.classList.add('hidden');
    bannerEl.className = `approver-decision-banner ${status}`;
    bannerEl.classList.remove('hidden');

    const dateStr = at ? new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const icons   = { approved: 'check-circle', conditional: 'alert-circle', rejected: 'x-circle' };
    const labels  = { approved: 'Approved',     conditional: 'Conditional Approval', rejected: 'Rejected' };

    bannerEl.innerHTML = `
        <i data-lucide="${icons[status] || 'info'}" style="width:16px;height:16px;flex-shrink:0;stroke-width:2"></i>
        <span>${labels[status] || _cap(status)} ${dateStr ? '· ' + dateStr : ''}</span>
        <button style="margin-left:auto;padding:4px 10px;border-radius:5px;background:rgba(0,0,0,0.1);border:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;" onclick="resetApproverDecision()">Change</button>
    `;
    if (window.lucide) lucide.createIcons();
}

/** Allow re-decision after approval */
function resetApproverDecision() {
    const btnsEl   = document.getElementById('ap_decision_buttons');
    const bannerEl = document.getElementById('ap_decision_banner');
    if (btnsEl)   btnsEl.classList.remove('hidden');
    if (bannerEl) bannerEl.classList.add('hidden');
}

/** Fire-and-forget POST to GAS (optional) */
async function submitApproverDecisionToGAS(sub) {
    const url = typeof ADMIN_GAS_URL !== 'undefined' ? ADMIN_GAS_URL : '';
    if (!url) return;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action:           'saveApproverDecision',
                submissionId:     sub.id,
                approverStatus:   sub.approverStatus,
                approverNotes:    sub.approverNotes,
                approverDecidedAt:sub.approverDecidedAt,
                score:            sub.score,
                coopName:         sub.coopName
            }),
            redirect: 'follow'
        });
    } catch (_) { /* silent fail */ }
}

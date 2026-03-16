/**
 * admin/js/approverPanel.js
 * Renders the approver review interface for a selected submission.
 *
 * FIX: _renderDecisionState was referencing a non-existent #ap_decision_banner_text
 *      element — the banner innerHTML is set directly on #ap_decision_banner.
 * FIX: submitApproverDecisionToGAS uses correct Content-Type for GAS POST.
 */

function renderApproverPanel(sub) {
    const result = sub.result  || {};
    const score  = result.totalScore != null ? result.totalScore : (sub.score != null ? sub.score : 0);
    const tier   = getAdminTier(score);

    // Score summary
    _setAp('ap_score_num',      score);
    _setAp('ap_risk_category',  result.riskCategory || tier.label);

    // Key metrics table
    renderApproverMetrics(sub);

    // Pre-fill recommendation if previously saved
    const textarea = document.getElementById('ap_recommendation');
    if (textarea) textarea.value = sub.approverNotes || '';

    // Show current decision state
    const status = sub.approverStatus || 'pending';
    _renderDecisionState(status, sub.approverDecidedBy, sub.approverDecidedAt);

    // Wire decision buttons
    _wireDecisionButton('ap_btn_approve',     'approved');
    _wireDecisionButton('ap_btn_conditional', 'conditional');
    _wireDecisionButton('ap_btn_reject',      'rejected');

    if (window.lucide) lucide.createIcons();
}

function _setAp(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Metrics table ─────────────────────────────────────────────────────────────

function renderApproverMetrics(sub) {
    const result  = sub.result  || {};
    const answers = sub.answers || {};
    const metrics = result.metrics || {};
    const data    = result.data    || {};

    const rows = [
        ['Proposed Loan',       _fmtNPR(answers.proposed_loan)],
        ['Total Loan',          _fmtNPR(answers.total_loan          || data.total_loan)],
        ['Total Revenue',       _fmtNPR(data.total_revenue          || answers.total_revenue)],
        ['Total Assets',        _fmtNPR(data.total_assets           || answers.total_assets)],
        ['Total Liabilities',   _fmtNPR(data.total_liabilities      || answers.total_liabilities)],
        ['Net Worth / Equity',  _fmtNPR(data.net_worth              || answers.net_worth)],
        ['DSCR',                metrics.dscr           != null ? metrics.dscr.toFixed(2)           : '—'],
        ['Current Ratio',       metrics.current_ratio  != null ? metrics.current_ratio.toFixed(2)  : '—'],
        ['Debt / Equity',       metrics.debt_equity    != null ? metrics.debt_equity.toFixed(2)    : '—'],
        ['GNPA %',              metrics.gnpa_pct       != null ? metrics.gnpa_pct.toFixed(1)  + '%': '—'],
        ['Milk Loss %',         metrics.milk_loss_pct  != null ? metrics.milk_loss_pct.toFixed(1) + '%' : '—'],
        ['Collateral Coverage', metrics.collateral_cover != null ? metrics.collateral_cover.toFixed(2) + 'x' : '—'],
    ].filter(function(r) { return r[1] && r[1] !== '—'; });

    const table = document.getElementById('ap_metrics_table');
    if (!table) return;

    if (!rows.length) {
        table.innerHTML = `<tr><td colspan="2" style="padding:16px;text-align:center;color:var(--ink-5);font-size:12px;">No financial metrics available for this submission.</td></tr>`;
        return;
    }

    table.innerHTML = rows.map(function(r) {
        return `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`;
    }).join('');
}

function _fmtNPR(val) {
    const n = Number(val);
    if (!val || isNaN(n) || n === 0) return '—';
    if (n >= 1e7) return 'NPR ' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return 'NPR ' + (n / 1e5).toFixed(2) + ' L';
    return 'NPR ' + n.toLocaleString('en-IN');
}

// ── Decision buttons ──────────────────────────────────────────────────────────

function _wireDecisionButton(btnId, decision) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    // Clone to remove any previous onclick listeners
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', function() { saveApproverDecision(decision); });
}

async function saveApproverDecision(decision) {
    const sub = window._adminCurrentSubmission;
    if (!sub) {
        if (typeof showAdminToast === 'function') showAdminToast('No submission selected.', 'error');
        return;
    }

    const textarea = document.getElementById('ap_recommendation');
    const notes    = textarea ? textarea.value.trim() : '';

    if (!notes) {
        if (typeof showAdminToast === 'function') showAdminToast('Please add a recommendation note before deciding.', 'error');
        return;
    }

    // Optimistic update in memory
    sub.approverStatus    = decision;
    sub.approverNotes     = notes;
    sub.approverDecidedAt = new Date().toISOString();

    _renderDecisionState(decision, 'Admin', sub.approverDecidedAt);
    if (typeof showAdminToast === 'function') showAdminToast('Saving decision…', 'info');

    try {
        await _postApproverDecisionToGAS(sub);

        // Update the submissions array in memory so table/dashboard reflect change
        const all = window._adminSubmissions || [];
        const idx = all.findIndex(function(s) { return String(s.id) === String(sub.id); });
        if (idx !== -1) all[idx] = sub;
        window._adminCurrentSubmission = sub;

        if (typeof showAdminToast === 'function') showAdminToast('Decision saved: ' + _cap(decision), 'success');
        if (typeof renderSubmissionsTable === 'function') renderSubmissionsTable();
        if (typeof loadDashboard         === 'function') loadDashboard();
    } catch (err) {
        if (typeof showAdminToast === 'function') showAdminToast('Failed to save: ' + err.message, 'error');
    }
}

// ── Decision state rendering ──────────────────────────────────────────────────
/**
 * FIX: Removed reference to non-existent #ap_decision_banner_text.
 *      innerHTML is written directly to #ap_decision_banner.
 */
function _renderDecisionState(status, by, at) {
    const btnsEl   = document.getElementById('ap_decision_buttons');
    const bannerEl = document.getElementById('ap_decision_banner');
    if (!btnsEl || !bannerEl) return;

    if (!status || status === 'pending') {
        btnsEl.classList.remove('hidden');
        bannerEl.classList.add('hidden');
        bannerEl.className = 'approver-decision-banner hidden';
        return;
    }

    // Hide buttons, show banner
    btnsEl.classList.add('hidden');
    bannerEl.className = 'approver-decision-banner ' + status;

    const dateStr = at
        ? new Date(at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        : '';

    const icons  = { approved: 'check-circle', conditional: 'alert-circle', rejected: 'x-circle' };
    const labels = { approved: 'Approved',     conditional: 'Conditional Approval', rejected: 'Rejected' };

    bannerEl.innerHTML = `
        <i data-lucide="${icons[status] || 'info'}" style="width:16px;height:16px;flex-shrink:0;stroke-width:2"></i>
        <span>${labels[status] || _cap(status)}${dateStr ? ' · ' + dateStr : ''}</span>
        <button
            style="margin-left:auto;padding:4px 10px;border-radius:5px;background:rgba(0,0,0,0.1);
                   border:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;"
            onclick="resetApproverDecision()">
            Change
        </button>
    `;

    if (window.lucide) lucide.createIcons();
}

function resetApproverDecision() {
    const btnsEl   = document.getElementById('ap_decision_buttons');
    const bannerEl = document.getElementById('ap_decision_banner');
    if (btnsEl)   btnsEl.classList.remove('hidden');
    if (bannerEl) {
        bannerEl.classList.add('hidden');
        bannerEl.className = 'approver-decision-banner hidden';
    }
}

// ── POST to GAS ───────────────────────────────────────────────────────────────
/**
 * FIX: Uses 'Content-Type': 'text/plain;charset=utf-8' which is required
 *      for GAS doPost() to receive the body without a CORS preflight rejection.
 */
async function _postApproverDecisionToGAS(sub) {
    const url = typeof ADMIN_GAS_URL !== 'undefined' ? ADMIN_GAS_URL : '';
    if (!url) throw new Error('ADMIN_GAS_URL not configured.');

    const res = await fetch(url, {
        method:   'POST',
        headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({
            action:            'saveApproverDecision',
            submissionId:      sub.id,
            approverStatus:    sub.approverStatus,
            approverNotes:     sub.approverNotes,
            approverDecidedAt: sub.approverDecidedAt,
            score:             sub.score,
            coopName:          sub.coopName
        })
    });

    if (!res.ok) throw new Error('Network response not OK (' + res.status + ')');

    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    return data;
}

// ── Shared helper ─────────────────────────────────────────────────────────────
function _cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
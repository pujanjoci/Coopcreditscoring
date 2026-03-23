/**
 * admin/js/submissions.js
 *
 * CACHE LAYER ADDED:
 *   - On first load, submissions are fetched from GAS and cached in localStorage
 *   - On subsequent logins, cached data is loaded instantly (no network wait)
 *   - Cache is invalidated after 30 minutes (CACHE_TTL_MS)
 *   - Cache is force-refreshed when admin clicks the refresh button
 *   - Cache is updated in-memory when an approver decision is saved
 *   - Cache key: 'admin_submissions_cache'
 *   - Cache structure: { ts: <unix ms>, data: [ ...raw rows ] }
 */

window._adminSubmissions = [];

const CACHE_KEY    = 'admin_submissions_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── Cache helpers ─────────────────────────────────────────────────────────────

function _readCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.ts || !Array.isArray(parsed.data)) return null;
        return parsed;
    } catch (e) { return null; }
}

function _writeCache(rawRows) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            ts:   Date.now(),
            data: rawRows
        }));
    } catch (e) {
        console.warn('[submissions] Could not write cache:', e.message);
    }
}

function _clearCache() {
    localStorage.removeItem(CACHE_KEY);
}

function _isCacheValid(cache) {
    if (!cache) return false;
    return (Date.now() - cache.ts) < CACHE_TTL_MS;
}

function _cacheAgeLabel(cache) {
    if (!cache) return '';
    const mins = Math.round((Date.now() - cache.ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    return mins + ' mins ago';
}

// ── Fetch from GAS (or cache) ─────────────────────────────────────────────────

/**
 * Lightweight server ping — fetches only the submission count + latest
 * submission timestamp from GAS (action=getSubmissionMeta).
 * Returns { count, latestTs } or null on failure.
 *
 * GAS must handle:  ?action=getSubmissionMeta  →  { count: N, latestTs: "ISO" }
 */
async function _fetchSubmissionMeta(url) {
    try {
        const res = await fetch(url + '?action=getSubmissionMeta', { redirect: 'follow' });
        if (!res.ok) return null;
        const data = await res.json();
        if (data && typeof data.count === 'number') return data;
        return null;
    } catch (e) {
        console.warn('[submissions] meta ping failed:', e.message);
        return null;
    }
}

/**
 * Check whether cached data is still in sync with the server.
 * Returns true  → cache is fresh AND matches server count.
 * Returns false → cache is stale by TTL, or count/latestTs differs.
 */
async function _isCacheStillValid(cache, url) {
    if (!_isCacheValid(cache)) return false;          // expired by TTL

    const meta = await _fetchSubmissionMeta(url);
    if (!meta) return true;                           // meta ping failed → keep cache, don't hammer server

    const cachedCount = cache.data.length;
    if (meta.count !== cachedCount) {
        console.log('[submissions] Server count (' + meta.count + ') ≠ cache (' + cachedCount + ') — invalidating cache.');
        return false;
    }

    // If server provides latestTs, check it against the newest cached timestamp
    if (meta.latestTs) {
        const serverTs  = new Date(meta.latestTs).getTime();
        const cachedTs  = cache.data.reduce(function(max, row) {
            const t = new Date(row['Submission Timestamp'] || row['Server Timestamp'] || 0).getTime();
            return t > max ? t : max;
        }, 0);
        if (serverTs > cachedTs) {
            console.log('[submissions] Newer submission detected on server — invalidating cache.');
            return false;
        }
    }

    return true;  // count matches and no newer ts → cache is good
}

async function fetchSubmissions(forceRefresh) {
    const url = typeof ADMIN_GAS_URL !== 'undefined' ? ADMIN_GAS_URL : '';
    if (!url) {
        console.warn('ADMIN_GAS_URL not defined — skipping server fetch.');
        return [];
    }

    // Try serving from cache first (unless force-refreshed).
    // Smart check: even if TTL hasn't expired, ping server for count/latestTs.
    if (!forceRefresh) {
        const cache = _readCache();
        if (cache && cache.data && cache.data.length > 0) {
            const stillValid = await _isCacheStillValid(cache, url);
            if (stillValid) {
                console.log('[submissions] Serving from cache (' + _cacheAgeLabel(cache) + ')');
                window._adminSubmissions = cache.data.map(mapSubmissionFromGAS);
                _renderCacheBanner(_cacheAgeLabel(cache), false);
                return window._adminSubmissions;
            }
            // Cache invalidated — fall through to full fetch
            _clearCache();
            console.log('[submissions] Cache invalidated — fetching fresh data.');
        }
    }

    // Show loading state in table
    const tbody = document.getElementById('sub_table_body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;padding:40px;">
                    <div style="display:inline-flex;align-items:center;gap:10px;color:var(--ink-5);font-size:13px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                             fill="none" stroke="var(--info,#2563eb)" stroke-width="2"
                             style="animation:spin 1s linear infinite;flex-shrink:0">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Fetching submissions from server…
                    </div>
                </td>
            </tr>`;
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
        console.log('[fetchSubmissions] server response:', data);

        if (data && data.error) throw new Error('GAS error: ' + data.error);

        if (data && data.spreadsheetName !== undefined) {
            throw new Error(
                'GAS is still running the OLD deployment. ' +
                'In Apps Script → Deploy → Manage deployments → edit → Version = "New version" → Deploy.'
            );
        }

        if (!Array.isArray(data)) {
            throw new Error('Unexpected response format. Got: ' + JSON.stringify(data).slice(0, 200));
        }

        // Write raw rows to cache before mapping
        _writeCache(data);

        window._adminSubmissions = data.map(mapSubmissionFromGAS);

        _renderCacheBanner('just now', true);
        return window._adminSubmissions;

    } catch (err) {
        console.error('fetchSubmissions error:', err);

        // If network fails, fall back to stale cache rather than showing nothing
        const staleCache = _readCache();
        if (staleCache && staleCache.data.length > 0) {
            console.warn('[submissions] Network failed — using stale cache (' + _cacheAgeLabel(staleCache) + ')');
            window._adminSubmissions = staleCache.data.map(mapSubmissionFromGAS);
            _renderCacheBanner(_cacheAgeLabel(staleCache), false, true);
            if (typeof showAdminToast === 'function') {
                showAdminToast('Showing cached data — could not reach server.', 'warning');
            }
            return window._adminSubmissions;
        }

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

// ── Cache banner ──────────────────────────────────────────────────────────────

/**
 * Renders a small banner above the submissions toolbar showing cache status
 * and a Refresh button to force a fresh fetch from GAS.
 */
function _renderCacheBanner(ageLabel, isLive, isStale) {
    const view = document.getElementById('view_submissions');
    if (!view) return;

    // Remove existing banner
    const existing = document.getElementById('_sub_cache_banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = '_sub_cache_banner';

    const color  = isStale ? '#92400e' : isLive ? '#14532d' : '#1e3a6e';
    const bg     = isStale ? '#fffbeb' : isLive ? '#f0fdf4' : '#eff6ff';
    const border = isStale ? '#fde68a' : isLive ? '#bbf7d0' : '#bfdbfe';
    const icon   = isStale ? '⚠' : isLive ? '✓' : '💾';
    const label  = isStale
        ? 'Cached data (' + ageLabel + ') — server unreachable'
        : isLive
            ? 'Loaded from server — ' + ageLabel
            : 'If no new data found, click refresh — Refreshed ' + ageLabel ;

    banner.style.cssText = [
        'display:flex', 'align-items:center', 'gap:10px',
        'padding:8px 14px', 'margin-bottom:10px',
        'border-radius:8px', 'border:1px solid ' + border,
        'background:' + bg, 'color:' + color,
        'font-size:12px', 'font-weight:500',
        'font-family:DM Sans,system-ui,sans-serif'
    ].join(';');

    banner.innerHTML = `
        <span style="flex-shrink:0">${icon}</span>
        <span style="flex:1">${label}</span>
        <button onclick="refreshSubmissions()" style="
            padding:4px 12px; border-radius:5px; border:1px solid ${border};
            background:transparent; cursor:pointer; font-family:inherit;
            font-size:11px; font-weight:700; color:${color};
            display:inline-flex; align-items:center; gap:5px;
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            Refresh
        </button>
    `;

    // Insert before the toolbar
    const toolbar = view.querySelector('.sub-toolbar');
    if (toolbar) {
        view.insertBefore(banner, toolbar);
    } else {
        view.prepend(banner);
    }
}

/**
 * Force-refresh submissions from GAS, bypassing the cache.
 * Called by the Refresh button in the cache banner.
 */
async function refreshSubmissions() {
    _clearCache();
    await fetchSubmissions(true);
    if (typeof initSubmissionsView === 'function') initSubmissionsView();
    if (typeof showAdminToast === 'function') showAdminToast('Submissions refreshed from server.', 'success');
}

// ── Map GAS row → submission object ──────────────────────────────────────────

function mapSubmissionFromGAS(raw) {
    const answersStr = raw['Answers JSON'] || '{}';
    const answers = (function () {
        try {
            if (typeof answersStr === 'string' && answersStr.trim().startsWith('{')) {
                return JSON.parse(answersStr);
            }
        } catch (e) { /* fall through */ }
        return {};
    })();

    const tsRaw   = raw['Submission Timestamp'] || raw['Server Timestamp'] || '';
    const coopRaw = raw['Coop Name'] || answers.coop_name || '';

    // Use Submission ID from sheet if present (guaranteed unique)
    // Fall back to timestamp+coop+random suffix to avoid collisions
    const sheetId = raw['Submission ID'] ? String(raw['Submission ID']).trim() : '';
    const syntheticId = sheetId
        || ((String(tsRaw) + String(coopRaw)).replace(/[^a-z0-9]/gi, '').toLowerCase()
            + '_' + Math.random().toString(36).slice(2, 7))
        || ('sub_' + Math.random().toString(36).slice(2));

    let approverStatus = String(raw['Approver Status'] || '').trim().toLowerCase();
    if (!approverStatus) approverStatus = 'pending';

    const sheetScore = raw['Total Score'] !== '' && raw['Total Score'] != null
        ? Number(raw['Total Score']) : null;

    // ── Result: prefer stored Result JSON (submitted at time of scoring) ─────────
    // The sheet now stores the full result breakdown in "Result JSON" so the score
    // in the admin table always matches what the user saw — even if engine formulas change.
    // Fall back to re-running the engine only for old submissions without Result JSON.
    let result = {};

    const storedResultStr = raw['Result JSON'] || '';
    if (storedResultStr && typeof storedResultStr === 'string' && storedResultStr.trim().startsWith('{')) {
        try {
            result = JSON.parse(storedResultStr);
        } catch (e) {
            console.warn('[mapSubmissionFromGAS] Could not parse Result JSON for "' + coopRaw + '" — will re-run engine.');
        }
    }

    // Fall back: re-run engine for legacy submissions without stored Result JSON
    if (!result.totalScore && typeof runScoringEngine === 'function' && answers && Object.keys(answers).length > 0) {
        try {
            result = runScoringEngine(answers);
            console.info('[mapSubmissionFromGAS] Re-ran engine for "' + coopRaw + '" (no stored Result JSON).');
        } catch (e) {
            console.warn('[mapSubmissionFromGAS] Engine error for "' + coopRaw + '":', e.message);
        }
    }

    // Always prefer the freshly re-calculated engine score over the stale sheet value.
    // The engine may produce a different result if formulas have been updated since submission.
    // Fall back to sheet score only if the engine failed (result is empty).
    const engineScore = result.totalScore != null ? result.totalScore : null;
    const finalScore  = engineScore !== null ? engineScore
        : (sheetScore !== null && !isNaN(sheetScore) ? sheetScore : 0);

    const finalRiskTier = result.riskCategory || raw['Risk Tier'] || '—';

    const modelType = (function () {
        // Check the dedicated sheet column first (called 'Modal' due to original typo)
        const sheetModal = String(raw['Modal'] || raw['Model'] || '').toLowerCase();
        if (sheetModal.includes('processing') || sheetModal.includes('model b')) return 'processing';
        if (sheetModal.includes('collection') || sheetModal.includes('model a')) return 'collection';
        // Fall back to the model_type field inside answers JSON
        const mt = String(answers.model_type || '').toLowerCase();
        if (mt.includes('processing') || mt.includes('model b')) return 'processing';
        return 'collection';
    })();

    return {
        id:                syntheticId,
        submissionId:      sheetId || syntheticId,   // the exact Submission ID from sheet
        coopName:          raw['Coop Name']            || answers.coop_name || 'Unknown',
        submittedAt:       raw['Submission Timestamp'] || raw['Server Timestamp'] || new Date().toISOString(),
        score:             finalScore,
        riskTier:          finalRiskTier,
        approverStatus:    approverStatus,
        approverNotes:     raw['Approver Notes']       || '',
        approverDecidedAt: raw['Approver Decided At']  || null,
        modelType:         modelType,
        customerType:      answers.customer_type       || 'new',
        answers:           answers,
        result:            result,
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

    let rows = all.slice().reverse();

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
            <tr><td colspan="8">
                <div class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="inbox"></i></div>
                    <h3>${all.length ? 'No results match your filters' : 'No submissions yet'}</h3>
                    <p>${all.length ? 'Try clearing the search or filter.' : 'Complete the questionnaire in the user portal.'}</p>
                </div>
            </td></tr>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    tbody.innerHTML = rows.map(function (sub) {
        const tier       = getRiskTierClass(sub.riskTier || '');
        const status     = sub.approverStatus || 'pending';
        const date       = sub.submittedAt
            ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—';
        const score      = sub.score != null ? sub.score : '—';
        const scoreColor = getScoreColor(sub.score || 0);
        const shortId    = sub.submissionId || (sub.id || '').toString().slice(-8);
        const modelLabel = sub.modelType === 'processing' ? 'Processing' : 'Collection';

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
                <td class="action-btns-cell">
                    <button class="btn-view" onclick="event.stopPropagation();openSubmission('${sub.id}')" title="View Analytics & Result">
                        <i data-lucide="bar-chart-2" style="width:12px;height:12px;stroke-width:2;vertical-align:middle;"></i> View Analytics
                    </button>
                    <button class="btn-view btn-responses" onclick="event.stopPropagation();openResponsesModal('${sub.id}')" title="View Question Responses">
                        <i data-lucide="list" style="width:12px;height:12px;stroke-width:2;vertical-align:middle;"></i> View Responses
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

function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function _escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Open submission ───────────────────────────────────────────────────────────

function openSubmission(id) {
    const all = loadSubmissionsData();
    const sub = all.find(function (s) {
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

    // Re-render the cache banner if cache exists
    const cache = _readCache();
    if (cache) _renderCacheBanner(_cacheAgeLabel(cache), false, !_isCacheValid(cache));

    const searchInput = document.getElementById('sub_search');
    const riskSelect  = document.getElementById('sub_risk_filter');

    if (searchInput) {
        const newSearch = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearch, searchInput);
        newSearch.addEventListener('input', function () {
            renderSubmissionsTable(newSearch.value, riskSelect ? riskSelect.value : '');
        });
    }

    if (riskSelect) {
        const newSelect = riskSelect.cloneNode(true);
        riskSelect.parentNode.replaceChild(newSelect, riskSelect);
        newSelect.addEventListener('change', function () {
            const search = document.getElementById('sub_search');
            renderSubmissionsTable(search ? search.value : '', newSelect.value);
        });
    }
}

// ── Questionnaire Definition (mirrors questions.js exactly) ──────────────────
/**
 * RESPONSE_CATEGORIES matches the 15 sections of QUESTIONNAIRE in questions.js.
 * Section titles, icons, and field order are identical to what users see in the portal.
 */
var RESPONSE_CATEGORIES = [
    // Section 1: Identity & Classification (S.N 1–5)
    {
        title: 'Identity & Classification',
        icon:  'info',
        color: '#6366f1',
        keys:  ['coop_name', 'model_type', 'is_existing', 'years_operation', 'office_location', 'customer_type']
    },
    // Section 2: Loan Information (S.N 6–11)
    {
        title: 'Loan Information',
        icon:  'landmark',
        color: '#0891b2',
        keys:  [
            'existing_loan_amt', 'proposed_loan_amt', 'total_loan',
            'interest_rate', 'loan_tenure_months', 'repayment_frequency'
        ]
    },
    // Section 3: Revenue & Sales (S.N 12–18)
    {
        title: 'Revenue & Sales',
        icon:  'trending-up',
        color: '#16a34a',
        keys:  [
            'milk_sales', 'product_sales', 'other_sales', 'total_sales',
            'grant_income', 'total_revenue', 'bank_sales'
        ]
    },
    // Section 4: Buyer Analysis (S.N 19–32)
    {
        title: 'Buyer Analysis',
        icon:  'users',
        color: '#0e7490',
        keys:  [
            'total_number_of_buyers', 'top5_buyers_sales', 'largest_buyer_sales',
            'gov_buyer_sales', 'no_govt_buyers',
            'large_private_buyer_sales', 'no_private_sector_buyer',
            'small_buyer_sales', 'no_small_buyer_sales',
            'avg_payment_days_buyers',
            'top5_buyer_share_percent', 'largest_buyer_share_percent',
            'contract_coverage'
        ]
    },
    // Section 5: Operating Costs (S.N 29, 33–47)
    {
        title: 'Operating Costs',
        icon:  'receipt',
        color: '#d97706',
        keys:  [
            'raw_milk_purchase_cost',
            'processing_cost', 'packaging_cost', 'transport_cost', 'other_processing_cost',
            'salary_expense', 'admin_expense', 'electricity_expense',
            'fuel_expense', 'maintenance_expense', 'rent_expense',
            'other_operating_expense', 'total_opex',
            'depreciation', 'amortization'
        ]
    },
    // Section 6: Assets (S.N 48–63)
    {
        title: 'Assets',
        icon:  'package',
        color: '#2563eb',
        keys:  [
            'cash_on_hand', 'bank_balance', 'total_cash',
            'accounts_receivable', 'inventory', 'prepaid_expense',
            'other_current_assets', 'current_assets',
            'land_value', 'building_value', 'plant_machinery_value',
            'vehicle_value', 'furniture_value', 'other_fixed_assets',
            'non_current_assets', 'total_assets'
        ]
    },
    // Section 7: Liabilities (S.N 64–72)
    {
        title: 'Liabilities',
        icon:  'credit-card',
        color: '#dc2626',
        keys:  [
            'accounts_payable', 'short_term_loan', 'accrued_expense',
            'current_portion_long_term_debt', 'current_liabilities',
            'long_term_loan', 'other_long_term_liabilities',
            'non_current_liabilities', 'total_liabilities'
        ]
    },
    // Section 8: Net Worth & Equity (S.N 73–76)
    {
        title: 'Net Worth & Equity',
        icon:  'trending-up',
        color: '#7c3aed',
        keys:  ['paid_up_capital', 'retained_earnings', 'reserves', 'total_networth']
    },
    // Section 9: Milk Collection & Supply (S.N 77–91)
    {
        title: 'Milk Collection & Supply',
        icon:  'droplets',
        color: '#059669',
        keys:  [
            'total_milk_collected_liters', 'milk_loss_liters_during_collection',
            'loss_during_process', 'produced_milk_model_b_liters',
            'avg_monthly_milk_liters', 'lowest_monthly_milk_liters',
            'highest_monthly_milk_liters', 'average_inventory',
            'credit_period_given_days', 'top5_farmer_collection_liters',
            'highest_farmer_quantity_liters', 'lowest_farmer_quantity_liters',
            'total_number_of_farmers', 'avg_farmer_quantity_liters',
            'collection_days_positive'
        ]
    },
    // Section 10: Loan Recovery & NPA (S.N 92–97)
    {
        title: 'Loan Recovery & NPA',
        icon:  'alert-circle',
        color: '#b45309',
        keys:  [
            'total_member_loans', 'npa_member_loans', 'overdue_member_loans',
            'restructured_loans_past3yrs', 'max_dpd_days', 'credit_history_flag'
        ]
    },
    // Section 11: Financial Performance (S.N 98–99, 102)
    {
        title: 'Financial Performance',
        icon:  'bar-chart-2',
        color: '#0f766e',
        keys:  [
            'cash_bank_balance_last_year', 'cash_bank_balance_previous_year',
            'audit_findings_count'
        ]
    },
    // Section 12: Governance & Management (S.N 100–104)
    {
        title: 'Governance & Management',
        icon:  'shield',
        color: '#065f46',
        keys:  [
            'key_mgmt_avg_experience_years', 'internal_control_score',
            'lending_policy_compliance_flag', 'fleet_availability_percent'
        ]
    },
    // Section 13: Logistics & Infrastructure (S.N 105–110)
    {
        title: 'Logistics & Infrastructure',
        icon:  'truck',
        color: '#1e3a5f',
        keys:  [
            'storage_availability_flag', 'quality_sop_score_model_b',
            'insurance_coverage_flag', 'digital_mis_flag',
            'regulatory_compliance_flag', 'climatic_risk_score'
        ]
    },
    // Section 14: Credit History — BFI (S.N 111–112)
    {
        title: 'Credit History — BFI',
        icon:  'globe',
        color: '#4338ca',
        keys:  ['credit_history_banks', 'dpd_days_banks']
    },
    // Section 15: Behavioral & Community (S.N 113–120)
    {
        title: 'Behavioral & Community',
        icon:  'heart',
        color: '#9d174d',
        keys:  [
            'meeting_frequency', 'member_info_transparency', 'fund_usage',
            'kyc_aml', 'income_expense_checked', 'right_to_information',
            'community_support_level', 'emergency_response'
        ]
    }
];

/**
 * Question labels taken verbatim from questions.js labelEng.
 * Auto-calc fields carry a "— Auto" suffix so admins know they are computed.
 */
var QUESTION_LABELS = {
    // Section 1
    coop_name:                          'What is the name of the cooperative?',
    model_type:                         'Which model does the cooperative operate under? (A / B)',
    is_existing:                        'Is the loan new or existing?',
    customer_type:                      'Customer Type',
    years_operation:                    'How many years has the cooperative been operating?',
    office_location:                    'Where is the cooperative office located?',
    // Section 2
    existing_loan_amt:                  'What is the outstanding amount of the existing loan?',
    proposed_loan_amt:                  'What is the proposed new loan amount?',
    total_loan:                         'Total Loan (existing + new) — Auto',
    interest_rate:                      'What is the interest rate (%)?',
    loan_tenure_months:                 'What is the loan tenure (in months)?',
    repayment_frequency:                'What is the installment frequency?',
    // Section 3
    milk_sales:                         'Income from milk sales?',
    product_sales:                      'Income from other product sales?',
    other_sales:                        'Other income amount?',
    total_sales:                        'Total Sales — Auto',
    grant_income:                       'Income from grants / subsidies?',
    total_revenue:                      'Total Revenue — Auto',
    bank_sales:                         'Sales received through bank?',
    // Section 4
    total_number_of_buyers:             'Total number of buyers?',
    top5_buyers_sales:                  'Sales from top 5 buyers?',
    largest_buyer_sales:                'Sales from largest single buyer?',
    gov_buyer_sales:                    'Sales to government entities?',
    no_govt_buyers:                     'Number of government entity buyers?',
    large_private_buyer_sales:          'Sales to large private dairies?',
    no_private_sector_buyer:            'Number of large / private sector buyers?',
    small_buyer_sales:                  'Sales to small / unreliable buyers?',
    no_small_buyer_sales:               'Number of small / unreliable buyers?',
    avg_payment_days_buyers:            'Average collection period (days)?',
    top5_buyer_share_percent:           '% share of top 5 buyers — Auto',
    largest_buyer_share_percent:        '% share of largest buyer — Auto',
    contract_coverage:                  'Number of buyers under contract?',
    // Section 5
    raw_milk_purchase_cost:             'Cost of raw milk purchase?',
    processing_cost:                    'Processing cost?',
    packaging_cost:                     'Packaging cost?',
    transport_cost:                     'Transportation cost?',
    other_processing_cost:              'Other processing cost?',
    salary_expense:                     'Salary expense?',
    admin_expense:                      'Administrative expense?',
    electricity_expense:                'Electricity expense?',
    fuel_expense:                       'Fuel expense?',
    maintenance_expense:                'Repair & maintenance expense?',
    rent_expense:                       'Rent expense?',
    other_operating_expense:            'Other operating expenses?',
    total_opex:                         'Total operating expenses — Auto',
    depreciation:                       'Annual depreciation?',
    amortization:                       'Amortization amount?',
    // Section 6
    cash_on_hand:                       'Cash in hand?',
    bank_balance:                       'Bank balance?',
    total_cash:                         'Total cash (hand + bank) — Auto',
    accounts_receivable:                'Accounts receivable amount?',
    inventory:                          'Inventory value?',
    prepaid_expense:                    'Prepaid expenses?',
    other_current_assets:               'Other current assets?',
    current_assets:                     'Total current assets — Auto',
    land_value:                         'Land value?',
    building_value:                     'Building value?',
    plant_machinery_value:              'Machinery value?',
    vehicle_value:                      'Vehicle value?',
    furniture_value:                    'Furniture value?',
    other_fixed_assets:                 'Other fixed assets?',
    non_current_assets:                 'Total fixed assets — Auto',
    total_assets:                       'Total assets — Auto',
    // Section 7
    accounts_payable:                   'Accounts payable?',
    short_term_loan:                    'Short-term loan?',
    accrued_expense:                    'Accrued expenses?',
    current_portion_long_term_debt:     'Current portion of long-term debt?',
    current_liabilities:                'Total current liabilities — Auto',
    long_term_loan:                     'Long-term loan?',
    other_long_term_liabilities:        'Other long-term liabilities?',
    non_current_liabilities:            'Total long-term liabilities — Auto',
    total_liabilities:                  'Total liabilities — Auto',
    // Section 8
    paid_up_capital:                    'Paid-up capital?',
    retained_earnings:                  'Retained earnings?',
    reserves:                           'Reserve fund?',
    total_networth:                     'Total Net Worth — Auto',
    // Section 9
    total_milk_collected_liters:        'Total milk collected (litres)?',
    milk_loss_liters_during_collection: 'Milk loss during collection (litres)?',
    loss_during_process:                'Processing loss (litres)?',
    produced_milk_model_b_liters:       'Total milk sold / dispatched — Auto',
    avg_monthly_milk_liters:            'Average monthly milk collection (litres)?',
    lowest_monthly_milk_liters:         'Lowest monthly milk (litres)?',
    highest_monthly_milk_liters:        'Highest monthly milk (litres)?',
    average_inventory:                  'Average inventory value?',
    credit_period_given_days:           'Credit period given to farmers (days)?',
    top5_farmer_collection_liters:      'Milk from top 5 farmers (litres)?',
    highest_farmer_quantity_liters:     'Highest supplying farmer (litres)?',
    lowest_farmer_quantity_liters:      'Lowest supplying farmer (litres)?',
    total_number_of_farmers:            'Total number of farmers?',
    avg_farmer_quantity_liters:         'Average milk per farmer (litres) — Auto',
    collection_days_positive:           'Total milk collection days in a year?',
    // Section 10
    total_member_loans:                 'Total member loans?',
    npa_member_loans:                   'NPA member loans?',
    overdue_member_loans:               'Overdue member loans?',
    restructured_loans_past3yrs:        'Restructured loans in past 3 years?',
    max_dpd_days:                       'Maximum DPD days by members?',
    credit_history_flag:                'Credit history of members?',
    // Section 11
    cash_bank_balance_last_year:        'Last year cash / bank balance?',
    cash_bank_balance_previous_year:    'Previous year cash / bank balance?',
    audit_findings_count:               'Number of audit observations / issues?',
    // Section 12
    key_mgmt_avg_experience_years:      'Average management experience (years)?',
    internal_control_score:             'Internal control score?',
    lending_policy_compliance_flag:     'Loan policy compliance?',
    fleet_availability_percent:         'Vehicle availability (%)?',
    // Section 13
    storage_availability_flag:          'Storage / cold facility available?',
    quality_sop_score_model_b:          'Are there standards for milk collection, handling and storage? Are written documents available?',
    insurance_coverage_flag:            'Insurance available?',
    digital_mis_flag:                   'Digital MIS / POS / QR used?',
    regulatory_compliance_flag:         'Regulatory compliance?',
    climatic_risk_score:                'Climatic risk score?',
    // Section 14
    credit_history_banks:               'Credit History BFIs — cooperative credit history?',
    dpd_days_banks:                     'Maximum DPD days in bank loan?',
    // Section 15
    meeting_frequency:                  'How often does the committee usually hold meetings?',
    member_info_transparency:           'When a new plan or spending comes up, are members informed or decided among a few?',
    fund_usage:                         'Last year, where did the cooperative spend most of its money?',
    kyc_aml:                            'Are all member records (name, address, amount) kept securely?',
    income_expense_checked:             "Did anyone check the cooperative's income and expenses last year?",
    right_to_information:               'When any new plan or rule is implemented, are members informed beforehand?',
    community_support_level:            'What did the cooperative help with in the village last year?',
    emergency_response:                 'When milk is low or emergencies happen, what does the cooperative usually do?'
};

function _questionLabel(key) {
    return QUESTION_LABELS[key]
        || key.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

// ── View Responses Modal ──────────────────────────────────────────────────────

function openResponsesModal(id) {
    const all = loadSubmissionsData();
    const sub = all.find(function (s) {
        return s.id === id || String(s.id) === String(id);
    });
    if (!sub) {
        if (typeof showAdminToast === 'function') showAdminToast('Submission not found.', 'error');
        return;
    }

    const answers  = sub.answers || {};
    const allKeys  = Object.keys(answers);

    if (!allKeys.length) {
        var emptyHtml = '<div class="resp-empty"><i data-lucide="inbox"></i><p>No answer data available for this submission.</p></div>';
        _populateResponseModal(sub, emptyHtml, 0);
        return;
    }

    // Track which keys have been placed in a category
    var placed = {};
    var html   = '';

    RESPONSE_CATEGORIES.forEach(function (cat) {
        // Find keys in this category that exist in the submission
        var catKeys = cat.keys.filter(function (k) {
            return k in answers && !placed[k];
        });
        if (!catKeys.length) return;

        // Mark as placed
        catKeys.forEach(function (k) { placed[k] = true; });

        html += _renderCategorySection(cat.title, cat.icon, cat.color, catKeys, answers);
    });

    // Uncategorised keys — any left over
    var leftover = allKeys.filter(function (k) { return !placed[k]; });
    if (leftover.length) {
        html += _renderCategorySection('Other Fields', 'box', '#64748b', leftover, answers);
    }

    _populateResponseModal(sub, html, allKeys.length);
}

function _renderCategorySection(title, icon, color, keys, answers) {
    var sectionId = 'resp_sec_' + title.replace(/\W/g, '_');

    var rows = keys.map(function (key, idx) {
        var label = _questionLabel(key);
        var raw   = answers[key];
        var val   = (raw === null || raw === undefined || raw === '') ? '—' : String(raw);
        if (typeof raw === 'number') val = raw.toLocaleString();
        if (raw === true)  val = 'Yes';
        if (raw === false) val = 'No';
        var isAlt = (idx % 2 !== 0);
        return '<div class="resp-item' + (isAlt ? ' resp-item-alt' : '') + '">'
            + '<div class="resp-label"><span class="resp-q-num">' + (idx + 1) + '</span>' + _escHtml(label) + '</div>'
            + '<div class="resp-answer">' + _escHtml(val) + '</div>'
            + '</div>';
    }).join('');

    return '<div class="resp-section">'
        + '<div class="resp-section-header" onclick="_toggleRespSection(\'' + sectionId + '\')" style="border-left:3px solid ' + color + '">'
        + '<span class="resp-section-icon" style="color:' + color + '"><i data-lucide="' + icon + '"></i></span>'
        + '<span class="resp-section-title">' + _escHtml(title) + '</span>'
        + '<span class="resp-section-count">' + keys.length + ' field' + (keys.length !== 1 ? 's' : '') + '</span>'
        + '<span class="resp-section-chevron"><i data-lucide="chevron-down"></i></span>'
        + '</div>'
        + '<div class="resp-section-body" id="' + sectionId + '">'
        + rows
        + '</div>'
        + '</div>';
}

function _toggleRespSection(sectionId) {
    var body = document.getElementById(sectionId);
    if (!body) return;
    var isOpen = !body.classList.contains('collapsed');
    body.classList.toggle('collapsed', isOpen);
    // rotate chevron
    var header = body.previousElementSibling;
    if (header) {
        var chev = header.querySelector('.resp-section-chevron');
        if (chev) chev.style.transform = isOpen ? 'rotate(-90deg)' : '';
    }
}

function _populateResponseModal(sub, bodyHtml, totalCount) {
    var modal = document.getElementById('responses_modal');
    if (!modal) return;

    var coopName = _escHtml(sub.coopName || 'Unknown Cooperative');
    var dateStr  = sub.submittedAt
        ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    document.getElementById('resp_modal_title').textContent = coopName;
    document.getElementById('resp_modal_meta').textContent  =
        dateStr + (totalCount ? '  ·  ' + totalCount + ' fields' : '');
    document.getElementById('resp_modal_body').innerHTML    = bodyHtml;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (window.lucide) lucide.createIcons();
}

function closeResponsesModal() {
    var modal = document.getElementById('responses_modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}
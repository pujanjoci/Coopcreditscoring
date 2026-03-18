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

    const score = raw['Total Score'] !== '' && raw['Total Score'] != null
        ? Number(raw['Total Score']) : 0;

    let result = {};
    if (typeof runScoringEngine === 'function' && answers && Object.keys(answers).length > 0) {
        try {
            result = runScoringEngine(answers);
        } catch (e) {
            console.warn('[mapSubmissionFromGAS] Engine error for "' + coopRaw + '":', e.message);
        }
    } else if (typeof runScoringEngine !== 'function') {
        console.error('[mapSubmissionFromGAS] runScoringEngine not found — is engine.js loaded before submissions.js?');
    }

    const modelType = (function () {
        const mt = String(answers.model_type || '').toLowerCase();
        if (mt.includes('processing') || mt.includes('model b')) return 'processing';
        return 'collection';
    })();

    return {
        id:                syntheticId,
        submissionId:      sheetId || syntheticId,   // the exact Submission ID from sheet
        coopName:          raw['Coop Name']            || answers.coop_name || 'Unknown',
        submittedAt:       raw['Submission Timestamp'] || raw['Server Timestamp'] || new Date().toISOString(),
        score:             isNaN(score) ? (result.totalScore || 0) : score,
        riskTier:          raw['Risk Tier']            || result.riskCategory || '—',
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
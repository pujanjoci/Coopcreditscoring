/**
 * admin/js/resultViewer.js
 * Renders the credit score result for a given submission object.
 * Reuses the same visual structure as the user portal result page.
 */

let _rvRadarChart = null;
let _rvBarChart   = null;

/**
 * Main entry point — render the result viewer for a submission.
 * @param {Object} sub — submission object from localStorage
 */
function renderResultViewer(sub) {
    const result = sub.result || {};
    const score  = result.totalScore ?? sub.score ?? 0;
    const tier   = getAdminTier(score);

    // ── Breadcrumb ──
    const bc = document.getElementById('rv_coop_breadcrumb');
    if (bc) bc.textContent = sub.coopName || '—';

    // ── Hero ──
    const scoreEl = document.getElementById('rv_score');
    if (scoreEl) { scoreEl.textContent = score; scoreEl.style.color = '#fff'; }

    const rlEl = document.getElementById('rv_risk_label');
    if (rlEl) { rlEl.textContent = result.riskCategory || tier.label; rlEl.style.color = tier.color; }

    // Meta grid
    _setRv('rv_meta_coop', sub.coopName || '—');
    _setRv('rv_meta_model', sub.modelType === 'collection' ? 'Collection Only' : 'Coll. & Processing');
    _setRv('rv_meta_cust', sub.customerType === 'new' ? 'New Customer' : 'Existing Customer');
    _setRv('rv_meta_date', sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

    // ── Category Cards ──
    renderRVCategoryCards(result);

    // ── Analysis ──
    renderRVAnalysis('rv_strengths', result.strengths  || []);
    renderRVAnalysis('rv_concerns',  result.weaknesses || []);
    renderRVAnalysis('rv_focus',     result.focus      || []);

    // ── Charts ──
    setTimeout(() => renderRVCharts(result), 150);

    if (window.lucide) lucide.createIcons();
}

function _setRv(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderRVCategoryCards(result) {
    const container = document.getElementById('rv_cat_grid');
    if (!container) return;
    const cats = result.categories || [];
    if (!cats.length) { container.innerHTML = '<p style="color:var(--ink-5);font-size:12px">No category data.</p>'; return; }

    container.innerHTML = cats.map(cat => {
        const p   = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
        const cls = p >= 70 ? 'cat-green' : p >= 40 ? 'cat-amber' : 'cat-red';
        const bc  = p >= 70 ? '#2d6a2d'  : p >= 40 ? '#b48200'  : '#8b1a1a';
        return `
            <div class="rv-cat-card ${cls}">
                <div class="rv-cat-header">
                    <span class="rv-cat-name">${cat.name}</span>
                    <div>
                        <span class="rv-cat-score">${cat.score}</span>
                        <span class="rv-cat-max"> / ${cat.max}</span>
                    </div>
                </div>
                <div class="rv-bar-bg"><div class="rv-bar-fill" style="width:${p}%;background:${bc}"></div></div>
                <span style="font-size:10px;color:${bc};font-weight:700">${p}%</span>
            </div>`;
    }).join('');
}

function renderRVAnalysis(id, items) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = items.length
        ? items.filter(Boolean).map(i => `<li>${i}</li>`).join('')
        : '<li>None identified</li>';
}

function renderRVCharts(result) {
    const cats   = result.categories || [];
    const labels = cats.map(c => c.name);
    const scores = cats.map(c => c.score);
    const maxes  = cats.map(c => c.max);

    // Radar
    const radarCtx = document.getElementById('rv_radar_chart');
    if (radarCtx) {
        if (_rvRadarChart) { _rvRadarChart.destroy(); _rvRadarChart = null; }
        _rvRadarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label: 'Score',
                    data: scores.map((s, i) => maxes[i] > 0 ? Math.round((s / maxes[i]) * 100) : 0),
                    backgroundColor: 'rgba(30,30,30,0.08)',
                    borderColor: '#1a1a1a',
                    borderWidth: 2,
                    pointBackgroundColor: '#1a1a1a',
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        min: 0, max: 100,
                        ticks: { stepSize: 25, font: { size: 9 } },
                        pointLabels: { font: { size: 9 } },
                        grid: { color: 'rgba(0,0,0,0.07)' }
                    }
                }
            }
        });
    }

    // Bar
    const barCtx = document.getElementById('rv_bar_chart');
    if (barCtx) {
        if (_rvBarChart) { _rvBarChart.destroy(); _rvBarChart = null; }
        const barColors = scores.map((s, i) => {
            const p = maxes[i] > 0 ? (s / maxes[i]) * 100 : 0;
            return p >= 70 ? '#2d6a2d' : p >= 40 ? '#b48200' : '#8b1a1a';
        });
        _rvBarChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Score',
                    data: scores,
                    backgroundColor: barColors,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { font: { size: 9 } }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { font: { size: 9 } }, grid: { color: 'rgba(0,0,0,0.06)' } }
                }
            }
        });
    }
}

function getAdminTier(score) {
    const tiers = [
        { min: 0,   max: 499,  label: 'D Risk', color: '#b91c1c', bg: '#fee2e2' },
        { min: 500, max: 699,  label: 'C Risk', color: '#d97706', bg: '#fef3c7' },
        { min: 700, max: 849,  label: 'B Risk', color: '#2563eb', bg: '#dbeafe' },
        { min: 850, max: 1000, label: 'A Risk', color: '#16a34a', bg: '#dcfce7' }
    ];
    return tiers.find(t => score >= t.min && score <= t.max) || tiers[0];
}

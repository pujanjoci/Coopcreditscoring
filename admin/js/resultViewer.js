/**
 * admin/js/resultViewer.js
 * Renders the credit score result for a given submission object.
 * Radar chart: color-coded zones (red < 40%, amber 40–70%, green > 70%)
 */

let _rvRadarChart = null;
let _rvBarChart   = null;

function renderResultViewer(sub) {
    const result = sub.result  || {};
    const score  = result.totalScore != null ? result.totalScore : (sub.score != null ? sub.score : 0);
    const tier   = getAdminTier(score);

    const bc = document.getElementById('rv_coop_breadcrumb');
    if (bc) bc.textContent = sub.coopName || '—';

    const scoreEl = document.getElementById('rv_score');
    if (scoreEl) scoreEl.textContent = score;

    const rlEl = document.getElementById('rv_risk_label');
    if (rlEl) {
        rlEl.textContent = result.riskCategory || sub.riskTier || tier.label;
        rlEl.style.color = 'rgba(255,255,255,0.9)';
    }

    _setRv('rv_meta_coop',  sub.coopName || '—');
    _setRv('rv_meta_model', sub.modelType === 'processing' ? 'Coll. & Processing' : 'Collection Only');
    _setRv('rv_meta_cust',  sub.customerType === 'existing' ? 'Existing Customer' : 'New Customer');
    _setRv('rv_meta_date',  sub.submittedAt
        ? new Date(sub.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—');

    renderRVCategoryCards(result);
    renderRVAnalysis('rv_strengths', result.strengths  || []);
    renderRVAnalysis('rv_concerns',  result.weaknesses || []);
    renderRVAnalysis('rv_focus',     result.focus      || []);

    setTimeout(function() { renderRVCharts(result); }, 150);

    if (window.lucide) lucide.createIcons();
}

function _setRv(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ── Category Cards ────────────────────────────────────────────────────────────

function renderRVCategoryCards(result) {
    const container = document.getElementById('rv_cat_grid');
    if (!container) return;

    const cats = result.categories || [];
    if (!cats.length) {
        container.innerHTML = '<p style="color:var(--ink-5);font-size:12px;padding:12px 0;">No category data available for this submission.</p>';
        return;
    }

    container.innerHTML = cats.map(function(cat) {
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
                <div class="rv-bar-bg">
                    <div class="rv-bar-fill" style="width:${p}%;background:${bc}"></div>
                </div>
                <span style="font-size:10px;color:${bc};font-weight:700">${p}%</span>
            </div>`;
    }).join('');
}

// ── Analysis Lists ────────────────────────────────────────────────────────────

function renderRVAnalysis(id, items) {
    const el = document.getElementById(id);
    if (!el) return;
    const filtered = (items || []).filter(Boolean);
    el.innerHTML = filtered.length
        ? filtered.map(function(i) { return '<li>' + i + '</li>'; }).join('')
        : '<li>None identified</li>';
}

// ── Charts ────────────────────────────────────────────────────────────────────

function renderRVCharts(result) {
    const cats   = result.categories || [];
    const labels = cats.map(function(c) { return c.name; });
    const scores = cats.map(function(c) { return c.score; });
    const maxes  = cats.map(function(c) { return c.max; });

    // ── Radar — color-coded zones ─────────────────────────────────────────────
    const radarCtx = document.getElementById('rv_radar_chart');
    if (radarCtx) {
        if (_rvRadarChart) { _rvRadarChart.destroy(); _rvRadarChart = null; }

        if (cats.length) {
            // Convert to percentages
            const pcts = scores.map(function(s, i) {
                return maxes[i] > 0 ? Math.round((s / maxes[i]) * 100) : 0;
            });

            // Per-point colors: green good, amber fair, red weak
            const pointColors = pcts.map(function(p) {
                return p >= 70 ? '#16a34a' : p >= 40 ? '#d97706' : '#dc2626';
            });
            const pointBorders = pcts.map(function(p) {
                return p >= 70 ? '#14532d' : p >= 40 ? '#92400e' : '#7f1d1d';
            });

            // Overall fill color based on average
            const avgPct = pcts.reduce(function(a, b) { return a + b; }, 0) / (pcts.length || 1);
            const fillColor   = avgPct >= 70 ? 'rgba(22,163,74,0.15)'  : avgPct >= 40 ? 'rgba(217,119,6,0.15)'  : 'rgba(220,38,38,0.15)';
            const borderColor = avgPct >= 70 ? 'rgba(22,163,74,0.85)'  : avgPct >= 40 ? 'rgba(217,119,6,0.85)'  : 'rgba(220,38,38,0.85)';

            // Zone band plugin — draws colored background rings
            const zoneBandPlugin = {
                id: 'radarZoneBands',
                beforeDraw: function(chart) {
                    const ctx2   = chart.ctx;
                    const scale  = chart.scales.r;
                    if (!scale) return;

                    const cx = scale.xCenter;
                    const cy = scale.yCenter;

                    function radiusAt(val) {
                        return scale.getDistanceFromCenterForValue(val);
                    }

                    // Zone fills — outermost to innermost
                    var bands = [
                        { from: 100, to: 70, color: 'rgba(22,163,74,0.07)'  },  // green zone
                        { from: 70,  to: 40, color: 'rgba(217,119,6,0.09)'  },  // amber zone
                        { from: 40,  to: 0,  color: 'rgba(220,38,38,0.11)'  }   // red zone
                    ];

                    bands.forEach(function(band) {
                        var rOuter = radiusAt(band.from);
                        var rInner = radiusAt(band.to);
                        ctx2.save();
                        ctx2.beginPath();
                        ctx2.arc(cx, cy, rOuter, 0, Math.PI * 2);
                        ctx2.arc(cx, cy, rInner, 0, Math.PI * 2, true);
                        ctx2.fillStyle = band.color;
                        ctx2.fill();
                        ctx2.restore();
                    });

                    // Dashed threshold ring lines at 40% and 70%
                    [{ val: 40, color: 'rgba(220,38,38,0.3)' }, { val: 70, color: 'rgba(22,163,74,0.35)' }].forEach(function(ring) {
                        var r = radiusAt(ring.val);
                        ctx2.save();
                        ctx2.beginPath();
                        ctx2.arc(cx, cy, r, 0, Math.PI * 2);
                        ctx2.strokeStyle  = ring.color;
                        ctx2.lineWidth    = 1;
                        ctx2.setLineDash([3, 4]);
                        ctx2.stroke();
                        ctx2.restore();
                    });
                }
            };

            _rvRadarChart = new Chart(radarCtx, {
                type: 'radar',
                plugins: [zoneBandPlugin],
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Score %',
                        data:  pcts,
                        backgroundColor:      fillColor,
                        borderColor:          borderColor,
                        borderWidth:          2,
                        pointBackgroundColor: pointColors,
                        pointBorderColor:     pointBorders,
                        pointBorderWidth:     1.5,
                        pointRadius:          5,
                        pointHoverRadius:     7,
                        tension:              0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15,15,18,0.92)',
                            titleFont: { size: 11, weight: '600' },
                            bodyFont:  { size: 11 },
                            padding:   10,
                            callbacks: {
                                label: function(ctx) {
                                    var p = ctx.raw;
                                    var status = p >= 70 ? '✓ Good' : p >= 40 ? '~ Fair' : '✕ Weak';
                                    return '  ' + p + '%  —  ' + status;
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            min: 0, max: 100,
                            ticks: {
                                stepSize: 25,
                                font:     { size: 8.5 },
                                color:    '#9ca3af',
                                backdropColor: 'transparent',
                                callback: function(v) { return v + '%'; }
                            },
                            pointLabels: {
                                font:  { size: 9, weight: '600' },
                                color: '#4a4a4a'
                            },
                            grid:       { color: 'rgba(0,0,0,0.06)' },
                            angleLines: { color: 'rgba(0,0,0,0.06)' }
                        }
                    }
                }
            });

        } else {
            const ctx2d = radarCtx.getContext('2d');
            ctx2d.fillStyle = '#9ca3af';
            ctx2d.font = '12px DM Sans, sans-serif';
            ctx2d.textAlign = 'center';
            ctx2d.fillText('No category data', radarCtx.width / 2, radarCtx.height / 2);
        }
    }

    // ── Bar chart ─────────────────────────────────────────────────────────────
    const barCtx = document.getElementById('rv_bar_chart');
    if (barCtx) {
        if (_rvBarChart) { _rvBarChart.destroy(); _rvBarChart = null; }

        if (cats.length) {
            const barColors = scores.map(function(s, i) {
                const p = maxes[i] > 0 ? (s / maxes[i]) * 100 : 0;
                return p >= 70 ? '#16a34a' : p >= 40 ? '#d97706' : '#dc2626';
            });
            const barBorders = scores.map(function(s, i) {
                const p = maxes[i] > 0 ? (s / maxes[i]) * 100 : 0;
                return p >= 70 ? '#14532d' : p >= 40 ? '#92400e' : '#7f1d1d';
            });

            _rvBarChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label:           'Score',
                        data:            scores,
                        backgroundColor: barColors,
                        borderColor:     barBorders,
                        borderWidth:     1,
                        borderRadius:    4,
                        borderSkipped:   false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15,15,18,0.92)',
                            titleFont: { size: 11, weight: '600' },
                            bodyFont:  { size: 11 },
                            padding:   10,
                            callbacks: {
                                label: function(ctx) {
                                    var idx = ctx.dataIndex;
                                    var max = maxes[idx] || 1;
                                    var p   = Math.round((ctx.raw / max) * 100);
                                    return '  ' + ctx.raw + ' / ' + max + ' pts  (' + p + '%)';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { font: { size: 9 }, color: '#6b6b6b' },
                            grid:  { display: false }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { font: { size: 9 }, color: '#6b6b6b' },
                            grid:  { color: 'rgba(0,0,0,0.05)' }
                        }
                    }
                }
            });
        }
    }
}

// ── Tier helper ───────────────────────────────────────────────────────────────

function getAdminTier(score) {
    const tiers = [
        { min: 0,   max: 499,  label: 'D Risk — High',       color: '#b91c1c', bg: '#fee2e2' },
        { min: 500, max: 699,  label: 'C Risk — Elevated',   color: '#d97706', bg: '#fef3c7' },
        { min: 700, max: 849,  label: 'B Risk — Moderate',   color: '#2563eb', bg: '#dbeafe' },
        { min: 850, max: 1000, label: 'A Risk — Acceptable', color: '#16a34a', bg: '#dcfce7' }
    ];
    return tiers.find(function(t) { return score >= t.min && score <= t.max; }) || tiers[0];
}
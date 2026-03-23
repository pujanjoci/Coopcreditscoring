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
    renderRVSubIndicators(result);
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

// ── Sub-Indicators Section ────────────────────────────────────────────────────

function renderRVSubIndicators(result) {
    const container = document.getElementById('rv_subcat_section');
    if (!container) return;

    const cats = result.categories || [];
    if (!cats.length) {
        container.innerHTML = '';
        return;
    }

    // Inject styles once
    if (!document.getElementById('_rv_sub_style')) {
        const s = document.createElement('style');
        s.id = '_rv_sub_style';
        s.textContent = `
            .rv-sub-panel {
                border: 1px solid var(--rule-light, #e8e8e8);
                border-radius: 9px;
                margin-bottom: 8px;
                overflow: hidden;
                background: var(--surface-0, #fff);
            }
            .rv-sub-header {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 11px 14px;
                cursor: pointer;
                user-select: none;
                transition: background 0.15s;
            }
            .rv-sub-header:hover { background: var(--surface-1, #f7f7f7); }
            .rv-sub-cat-name {
                flex: 1;
                font-size: 12.5px;
                font-weight: 700;
                color: var(--ink-2, #1a1a1a);
            }
            .rv-sub-score-pill {
                font-size: 11px;
                font-weight: 700;
                padding: 2px 9px;
                border-radius: 99px;
                border: 1.5px solid currentColor;
            }
            .rv-sub-pct-label {
                font-size: 10.5px;
                font-weight: 600;
                min-width: 34px;
                text-align: right;
            }
            .rv-sub-chevron {
                width: 14px; height: 14px;
                flex-shrink: 0;
                color: var(--ink-5, #6b6b6b);
                transition: transform 0.2s;
            }
            .rv-sub-header.open .rv-sub-chevron { transform: rotate(180deg); }
            .rv-sub-progress-wrap {
                flex: 1;
                max-width: 90px;
            }
            .rv-sub-progress-bg {
                height: 5px;
                border-radius: 3px;
                background: rgba(0,0,0,0.07);
                overflow: hidden;
            }
            .rv-sub-progress-fill { height: 100%; border-radius: 3px; }

            .rv-sub-body {
                display: none;
                border-top: 1px solid var(--rule-light, #e8e8e8);
            }
            .rv-sub-body.open { display: block; }

            .rv-sub-row {
                display: grid;
                grid-template-columns: 1fr auto 70px auto;
                align-items: center;
                gap: 10px;
                padding: 9px 16px;
                border-bottom: 1px solid var(--rule-light, #e8e8e8);
            }
            .rv-sub-row:last-child { border-bottom: none; }
            .rv-sub-row:hover { background: var(--surface-1, #f7f7f7); }

            .rv-sub-ind-name {
                font-size: 11.5px;
                font-weight: 600;
                color: var(--ink-2, #1a1a1a);
            }
            .rv-sub-ind-formula {
                font-size: 9.5px;
                color: var(--ink-5, #6b6b6b);
                margin-top: 1px;
                font-style: italic;
            }
            .rv-sub-ind-val {
                font-size: 11px;
                font-weight: 600;
                color: var(--ink-3, #2e2e2e);
                text-align: right;
                white-space: nowrap;
            }
            .rv-sub-bar-col {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .rv-sub-bar-bg2 {
                flex: 1;
                height: 5px;
                border-radius: 3px;
                background: rgba(0,0,0,0.07);
                overflow: hidden;
                min-width: 40px;
            }
            .rv-sub-bar-fill2 { height: 100%; border-radius: 3px; }
            .rv-sub-pts {
                font-size: 11px;
                font-weight: 800;
                white-space: nowrap;
                text-align: right;
            }
            .rv-sub-pts span { font-weight: 400; opacity: 0.55; }

            @media (max-width: 600px) {
                .rv-sub-row { grid-template-columns: 1fr auto; gap: 6px; }
                .rv-sub-bar-col { display: none; }
            }
        `;
        document.head.appendChild(s);
    }

    const chevronSvg = `<svg class="rv-sub-chevron" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M6 9l6 6 6-6"/>
    </svg>`;

    container.innerHTML = cats.map(function(cat, idx) {
        const p    = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
        const col  = p >= 70 ? '#16a34a' : p >= 40 ? '#d97706' : '#dc2626';
        const subs = cat.logs || [];
        const panelId = 'rvsp_' + idx;

        const rows = subs.map(function(ind) {
            const ip   = ind.max > 0 ? Math.round((ind.score / ind.max) * 100) : 0;
            const ic   = ip >= 70 ? '#16a34a' : ip >= 40 ? '#d97706' : '#dc2626';
            const fill = Math.min(100, ind.max > 0 ? (ind.score / ind.max) * 100 : 0);
            return `
            <div class="rv-sub-row">
                <div>
                    <div class="rv-sub-ind-name">${ind.name}</div>
                    <div class="rv-sub-ind-formula">${ind.formula || ''}</div>
                </div>
                <div class="rv-sub-ind-val">${ind.value || '—'}</div>
                <div class="rv-sub-bar-col">
                    <div class="rv-sub-bar-bg2">
                        <div class="rv-sub-bar-fill2" style="width:${fill}%;background:${ic}"></div>
                    </div>
                </div>
                <div class="rv-sub-pts" style="color:${ic}">
                    ${ind.score}<span>/${ind.max}</span>
                </div>
            </div>`;
        }).join('');

        return `
        <div class="rv-sub-panel">
            <div class="rv-sub-header" id="${panelId}_hdr" onclick="toggleRVSubPanel('${panelId}')">
                <div class="rv-sub-cat-name">${cat.name}</div>
                <div class="rv-sub-progress-wrap">
                    <div class="rv-sub-progress-bg">
                        <div class="rv-sub-progress-fill" style="width:${p}%;background:${col}"></div>
                    </div>
                </div>
                <span class="rv-sub-score-pill" style="color:${col}">${cat.score}/${cat.max}</span>
                <span class="rv-sub-pct-label" style="color:${col}">${p}%</span>
                ${chevronSvg}
            </div>
            <div class="rv-sub-body" id="${panelId}_body">
                ${rows}
            </div>
        </div>`;
    }).join('');
}

function toggleRVSubPanel(panelId) {
    const hdr  = document.getElementById(panelId + '_hdr');
    const body = document.getElementById(panelId + '_body');
    if (!hdr || !body) return;
    const isOpen = body.classList.toggle('open');
    hdr.classList.toggle('open', isOpen);
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
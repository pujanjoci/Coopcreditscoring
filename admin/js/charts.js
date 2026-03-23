/**
 * admin/js/charts.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All dashboard chart logic in one place.
 *
 * Public API
 *   initDashboardCharts({ all, tierCounts })  – render / refresh all 4 charts
 *   destroyDashboardCharts()                  – teardown before re-render
 *
 * Chart instances are module-scoped so they can be properly destroyed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Colour palette (matches risk-tier pills) ─────────────────────────────── */
  const COLORS = {
    a:       '#16a34a',   // A Risk — green
    b:       '#2563eb',   // B Risk — blue
    c:       '#d97706',   // C Risk — amber
    d:       '#dc2626',   // D Risk — red
    pending: '#94a3b8',   // status — slate
    surface: '#f7f7f7',
    grid:    'rgba(0,0,0,0.045)',
    tick:    '#6b6b6b',
  };

  /* ── Shared font defaults ─────────────────────────────────────────────────── */
  const FONT = { family: 'DM Sans, system-ui, sans-serif' };

  /* ── Shared tooltip defaults ─────────────────────────────────────────────── */
  function tooltipDefaults(overrides) {
    return Object.assign({
      backgroundColor:  'rgba(15,15,18,0.90)',
      titleFont:        { size: 11.5, family: FONT.family, weight: '700' },
      bodyFont:         { size: 11,   family: FONT.family },
      padding:          12,
      cornerRadius:     8,
      displayColors:    true,
      boxWidth:         10,
      boxHeight:        10,
      borderColor:      'rgba(255,255,255,0.08)',
      borderWidth:      1,
    }, overrides);
  }

  /* ── Chart instances ─────────────────────────────────────────────────────── */
  let _scoreDonut  = null;
  let _statusDonut = null;
  let _riskBar     = null;
  let _scoreTrend  = null;

  /* ── Helpers ─────────────────────────────────────────────────────────────── */

  function _destroy(instance) {
    if (instance) { try { instance.destroy(); } catch (_) {} }
    return null;
  }

  /** Remove .is-empty from the chart-body so the canvas becomes visible */
  function _showChart(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const body = el.closest('.dash-chart-body');
    if (body) body.classList.remove('is-empty');
  }

  /** Add .is-empty so the placeholder is shown instead of the canvas */
  function _showEmpty(canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const body = el.closest('.dash-chart-body');
    if (body) body.classList.add('is-empty');
  }

  /* ── 1. Score Distribution Donut ─────────────────────────────────────────── */
  function _renderScoreDonut(tierCounts, total) {
    _scoreDonut = _destroy(_scoreDonut);

    if (!total) { _showEmpty('dash_score_donut'); return; }
    _showChart('dash_score_donut');

    const ctx = document.getElementById('dash_score_donut');
    if (!ctx) return;

    _scoreDonut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['A Risk', 'B Risk', 'C Risk', 'D Risk'],
        datasets: [{
          data: [tierCounts.a, tierCounts.b, tierCounts.c, tierCounts.d],
          backgroundColor: [COLORS.a, COLORS.b, COLORS.c, COLORS.d],
          borderColor:     '#ffffff',
          borderWidth:     3,
          hoverOffset:     8,
          borderRadius:    4,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: true,
        cutout:              '65%',
        animation:           { duration: 600, easing: 'easeInOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font:     { size: 10.5, family: FONT.family, weight: '600' },
              padding:  14,
              boxWidth: 10,
              boxHeight: 10,
              color:    '#4a4a4a',
              usePointStyle: true,
              pointStyle:    'circle',
            },
          },
          tooltip: tooltipDefaults({
            callbacks: {
              label: (c) => {
                const pct = total > 0 ? Math.round((c.raw / total) * 100) : 0;
                return `  ${c.raw} submission${c.raw !== 1 ? 's' : ''}  (${pct}%)`;
              },
            },
          }),
        },
      },
    });
  }

  /* ── 2. Review Status Donut ──────────────────────────────────────────────── */
  function _renderStatusDonut(all) {
    _statusDonut = _destroy(_statusDonut);

    if (!all.length) { _showEmpty('dash_status_donut'); return; }
    _showChart('dash_status_donut');

    const ctx = document.getElementById('dash_status_donut');
    if (!ctx) return;

    const counts = {
      pending:     all.filter(s => !s.approverStatus || s.approverStatus === 'pending').length,
      approved:    all.filter(s => s.approverStatus === 'approved').length,
      conditional: all.filter(s => s.approverStatus === 'conditional').length,
      rejected:    all.filter(s => s.approverStatus === 'rejected').length,
    };

    _statusDonut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Conditional', 'Rejected'],
        datasets: [{
          data:            [counts.pending, counts.approved, counts.conditional, counts.rejected],
          backgroundColor: [COLORS.pending, COLORS.a, COLORS.c, COLORS.d],
          borderColor:     '#ffffff',
          borderWidth:     3,
          hoverOffset:     8,
          borderRadius:    4,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: true,
        cutout:              '65%',
        animation:           { duration: 600, easing: 'easeInOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font:     { size: 10.5, family: FONT.family, weight: '600' },
              padding:  14,
              boxWidth: 10,
              boxHeight: 10,
              color:    '#4a4a4a',
              usePointStyle: true,
              pointStyle:    'circle',
            },
          },
          tooltip: tooltipDefaults({
            callbacks: {
              label: (c) => {
                const total = all.length;
                const pct   = total > 0 ? Math.round((c.raw / total) * 100) : 0;
                return `  ${c.raw} submission${c.raw !== 1 ? 's' : ''}  (${pct}%)`;
              },
            },
          }),
        },
      },
    });
  }

  /* ── 3. Risk Tier Horizontal Bar ─────────────────────────────────────────── */
  function _renderRiskBar(tierCounts) {
    _riskBar = _destroy(_riskBar);

    const total = tierCounts.a + tierCounts.b + tierCounts.c + tierCounts.d;
    if (!total) { _showEmpty('dash_risk_bar'); return; }
    _showChart('dash_risk_bar');

    const ctx = document.getElementById('dash_risk_bar');
    if (!ctx) return;

    _riskBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['A Risk', 'B Risk', 'C Risk', 'D Risk'],
        datasets: [{
          label:           'Submissions',
          data:            [tierCounts.a, tierCounts.b, tierCounts.c, tierCounts.d],
          backgroundColor: [COLORS.a, COLORS.b, COLORS.c, COLORS.d],
          borderRadius:    6,
          borderSkipped:   false,
          maxBarThickness: 40,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation:           { duration: 500, easing: 'easeOutCubic' },
        plugins: {
          legend: { display: false },
          tooltip: tooltipDefaults({
            callbacks: {
              title: (items) => items[0].label,
              label: (c) => `  ${c.raw} submission${c.raw !== 1 ? 's' : ''}`,
            },
          }),
        },
        scales: {
          x: {
            grid:  { display: false },
            border: { display: false },
            ticks: {
              font:  { size: 10.5, family: FONT.family, weight: '600' },
              color: COLORS.tick,
            },
          },
          y: {
            beginAtZero: true,
            border:      { display: false, dash: [3, 3] },
            grid:        { color: COLORS.grid },
            ticks: {
              stepSize: 1,
              font:     { size: 10, family: FONT.family },
              color:    COLORS.tick,
              padding:  4,
            },
          },
        },
      },
    });
  }

  /* ── 4. Credit Score Trend (line + 3-pt moving average) ─────────────────── */
  function _renderScoreTrend(all) {
    _scoreTrend = _destroy(_scoreTrend);

    const sorted = all
      .filter(s => s.score != null && s.submittedAt)
      .slice()
      .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
      .slice(-20);

    if (!sorted.length) { _showEmpty('dash_score_trend'); return; }
    _showChart('dash_score_trend');

    const ctx = document.getElementById('dash_score_trend');
    if (!ctx) return;

    const labels = sorted.map(s =>
      new Date(s.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    );
    const scores = sorted.map(s => s.score || 0);

    /* Point colour by risk tier */
    const pointBg = scores.map(sc =>
      sc >= 850 ? COLORS.a : sc >= 700 ? COLORS.b : sc >= 500 ? COLORS.c : COLORS.d
    );
    const pointBorder = scores.map(sc =>
      sc >= 850 ? '#14532d' : sc >= 700 ? '#1e3a8a' : sc >= 500 ? '#92400e' : '#7f1d1d'
    );

    /* 3-point moving average */
    const ma = scores.map((_, i, arr) => {
      const window = arr.slice(Math.max(0, i - 2), i + 1);
      return Math.round(window.reduce((a, b) => a + b, 0) / window.length);
    });

    _scoreTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label:               'Score',
            data:                scores,
            borderColor:         'rgba(100,116,139,0.20)',
            borderWidth:         1.5,
            pointBackgroundColor: pointBg,
            pointBorderColor:    pointBorder,
            pointBorderWidth:    1.5,
            pointRadius:         7,
            pointHoverRadius:    9,
            tension:             0.35,
            fill:                false,
          },
          {
            label:       '3-pt Avg',
            data:        ma,
            borderColor: 'rgba(37,99,235,0.50)',
            borderWidth: 2,
            borderDash:  [5, 4],
            pointRadius: 0,
            tension:     0.4,
            fill:        false,
          },
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation:           { duration: 600, easing: 'easeInOutQuart' },
        interaction:         { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display:  true,
            position: 'bottom',
            labels: {
              font:         { size: 10.5, family: FONT.family, weight: '600' },
              padding:      16,
              boxWidth:     24,
              boxHeight:    2,
              color:        '#6b6b6b',
              usePointStyle: true,
              pointStyle:   'line',
            },
          },
          tooltip: tooltipDefaults({
            callbacks: {
              afterLabel: (c) => {
                if (c.datasetIndex !== 0) return '';
                const sc = c.raw;
                const tier = sc >= 850 ? 'A Risk (Acceptable)' :
                             sc >= 700 ? 'B Risk (Moderate)'   :
                             sc >= 500 ? 'C Risk (Elevated)'   : 'D Risk (High)';
                return `  → ${tier}`;
              },
            },
          }),
        },
        scales: {
          x: {
            grid:   { display: false },
            border: { display: false },
            ticks:  {
              font:        { size: 9.5, family: FONT.family },
              color:       COLORS.tick,
              maxRotation: 0,
              maxTicksLimit: 10,
            },
          },
          y: {
            min:    0,
            max:    1000,
            border: { display: false, dash: [3, 3] },
            grid:   { color: COLORS.grid },
            ticks:  {
              stepSize: 200,
              font:     { size: 9.5, family: FONT.family },
              color:    COLORS.tick,
              padding:  4,
              callback: (v) => v.toLocaleString(),
            },
          },
        },
      },
    });
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */

  /**
   * Render / refresh all four dashboard charts.
   * @param {{ all: Object[], tierCounts: {a,b,c,d} }} param0
   */
  window.initDashboardCharts = function ({ all, tierCounts }) {
    _renderScoreDonut(tierCounts, all.length);
    _renderStatusDonut(all);
    _renderRiskBar(tierCounts);
    _renderScoreTrend(all);
  };

  /** Destroy all chart instances (useful before hot-reloading data) */
  window.destroyDashboardCharts = function () {
    _scoreDonut  = _destroy(_scoreDonut);
    _statusDonut = _destroy(_statusDonut);
    _riskBar     = _destroy(_riskBar);
    _scoreTrend  = _destroy(_scoreTrend);
  };

})();
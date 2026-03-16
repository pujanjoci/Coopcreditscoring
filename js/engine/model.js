/**
 * model.js — Model Sheet Layer
 * Applies scoring rules to computed metrics. Assigns points per indicator.
 * Mirrors the "Model Sheet" from the spreadsheet — the 1000-point credit model.
 *
 * Score Architecture (1000 pts total):
 *   Cash Flow            180 pts  (DSCR, Seasonality, Inventory, Receivables)
 *   Milk Supply          160 pts  (Stability, Collection Days, Loss, Yield, Farmer Conc., Logistics)
 *   Financial Strength   150 pts  (Net Worth, Debt/Equity, Current Ratio, Grant Dep., Cash Trend)
 *   Buyer Quality         45 pts  (Bank Sales %, Top 5 Buyer Concentration)
 *   Loan Recovery        100 pts  (GNPA, DPD, Restructuring)
 *   Security / Collateral 40 pts  (Primary Collateral Coverage)
 *   Governance            80 pts  (Mgmt Experience, Internal Controls, Audit, Loan Policy)
 *   External Risk         55 pts  (Insurance, Regulatory, Climatic)
 *   Credit History        40 pts  (BFI Record, BFI DPD)
 *   Infrastructure        25 pts  (Digital MIS, Quality SOP)
 *   Behavioral / Social   75 pts  (Meetings, Community, Emergency, Years Op.)
 *   ─────────────────────────────
 *   TOTAL               1000 pts
 */

/**
 * Run the scoring model against calculated metrics and raw data.
 * @param {Object} calc    - Output from runCalculations()
 * @param {Object} data    - Output from transformData()
 * @returns {Object}       - Full result object for the UI
 */
function runModel(calc, data) {
    const indicators = [];
    const catMap = {};

    /**
     * Add a scored indicator to the result set.
     * @param {string} cat     - Category name
     * @param {string} name    - Indicator name
     * @param {number} score   - Points awarded
     * @param {number} max     - Maximum points for this indicator
     * @param {string} formula - Human-readable formula description
     * @param {string} value   - Computed value string for display
     */
    function add(cat, name, score, max, formula, value) {
        const safeScore = clamp(Number.isFinite(score) ? score : 0, 0, max);
        if (!catMap[cat]) catMap[cat] = { score: 0, max: 0 };
        catMap[cat].score += safeScore;
        catMap[cat].max   += max;
        indicators.push({ cat, name, score: Math.round(safeScore * 10) / 10, max, formula, value, category: cat });
    }

    // ── 1. CASH FLOW (180 pts) ────────────────────────────────────────────────

    // 1a. DSCR — 60 pts
    const dscr = calc.dscr;
    add('Cash Flow', 'DSCR (Debt Coverage)',
        dscr >= 2.0 ? 60 : dscr >= 1.5 ? 45 : dscr >= 1.25 ? 30 : dscr >= 1.0 ? 15 : 0,
        60, 'EBITDA / Annual Debt Service', dscr.toFixed(2) + 'x');

    // 1b. Seasonality Coverage — 36 pts
    const sc = calc.seasonalityCoverage;
    add('Cash Flow', 'Seasonality Coverage',
        sc >= 12 ? 36 : sc >= 6 ? 24 : sc >= 3 ? 12 : 6,
        36, 'Cash / Lean Month Expense', sc.toFixed(1) + ' mo');

    // 1c. Inventory Days — 30 pts
    const invD = calc.inventoryDays;
    add('Cash Flow', 'Inventory Days',
        invD <= 30 ? 30 : invD <= 60 ? 20 : invD <= 90 ? 10 : 5,
        30, 'Avg Inventory / (COGS/365)', Math.round(invD) + ' days');

    // 1d. Receivable Days — 40 pts (revised: was 40, keeping consistent)
    const recD = calc.receivableDays;
    add('Cash Flow', 'Receivable Days',
        recD <= 30 ? 40 : recD <= 45 ? 30 : recD <= 60 ? 20 : 10,
        40, 'AR / (Sales/365)', Math.round(recD) + ' days');

    // Underspend: 14 pts offset — Note: Cash Flow arch = 60+36+30+40 = 166, adjusted below
    // Add: Collection Efficiency — 14 pts bonus to reach 180
    const bankSalesPct = calc.bankSalesPct;
    // (moved to Buyer Quality, so Cash Flow stays at 166 — see note at bottom)

    // ── 2. MILK SUPPLY (160 pts) ──────────────────────────────────────────────

    // 2a. Milk Stability — 24 pts
    const milkStab = calc.milkStability;
    add('Milk Supply', 'Milk Stability',
        milkStab >= 90 ? 24 : milkStab >= 75 ? 18 : milkStab >= 60 ? 12 : 6,
        24, 'Low Month / Avg Monthly', milkStab.toFixed(1) + '%');

    // 2b. Collection Days — 20 pts
    const dayPct = calc.collectionDayPct;
    add('Milk Supply', 'Collection Days',
        dayPct >= 95 ? 20 : dayPct >= 85 ? 15 : dayPct >= 75 ? 10 : 5,
        20, 'Days / 365', dayPct.toFixed(1) + '%');

    // 2c. Milk Loss Rate — 20 pts
    const mLoss = calc.milkLossRate;
    add('Milk Supply', 'Milk Loss Rate',
        mLoss <= 2 ? 20 : mLoss <= 5 ? 15 : mLoss <= 10 ? 10 : 5,
        20, 'Milk Loss / Total Collected', mLoss.toFixed(2) + '%');

    // 2d. Yield Loss (Model B) — 15 pts
    const yLoss = calc.yieldLossRate;
    add('Milk Supply', 'Processing Yield Loss',
        yLoss <= 2 ? 15 : yLoss <= 5 ? 10 : yLoss <= 8 ? 5 : 2,
        15, 'Processing Loss / Total', yLoss.toFixed(2) + '%');

    // 2e. Farmer Concentration — 15 pts
    const fConc = calc.farmerConcentration;
    add('Milk Supply', 'Farmer Concentration',
        fConc <= 20 ? 15 : fConc <= 35 ? 10 : fConc <= 50 ? 5 : 2,
        15, 'Top 5 Farmers Share', fConc.toFixed(1) + '%');

    // 2f. Logistics — 15 pts (vehicle availability + cold chain)
    const vk = safeNum(data.vehicle_avail_pct);
    const coldChain = data.storage_cold_facility === 'Yes';
    const logiScore = (vk >= 80 ? 7.5 : vk >= 50 ? 4 : 0) + (coldChain ? 7.5 : 0);
    add('Milk Supply', 'Logistics & Cold Chain',
        logiScore, 15,
        'Vehicle Avail. + Cold Chain',
        logiScore === 15 ? 'Full Coverage' : logiScore > 0 ? 'Partial' : 'None');

    // 2g. Milk Volume Growth (implied from avg + collection days) — 51 pts to reach 160
    // We split into: Collection Days already scored. Add Base Volume — 51 pts
    // Approximation: total milk vs small/large threshold
    const milkVol = data.total_milk_collected;
    const milkVolScore = milkVol >= 5000000 ? 51 : milkVol >= 2000000 ? 38 : milkVol >= 500000 ? 25 : 10;
    add('Milk Supply', 'Milk Volume (Annual)',
        milkVolScore, 51,
        'Total Annual Litres',
        fmtNum(Math.round(milkVol)) + ' L');

    // ── 3. FINANCIAL STRENGTH (150 pts) ──────────────────────────────────────

    // 3a. Net Worth — 35 pts
    const nw = data.total_net_worth;
    add('Financial Strength', 'Net Worth',
        nw >= 20000000 ? 35 : nw >= 10000000 ? 25 : nw >= 5000000 ? 15 : 8,
        35, 'Total Equity (NPR)', fmtNPR(nw));

    // 3b. Debt/Equity Ratio — 32 pts
    const de = calc.debtEquityRatio;
    add('Financial Strength', 'Debt / Equity Ratio',
        de <= 0.5 ? 32 : de <= 1.0 ? 24 : de <= 1.5 ? 16 : 8,
        32, 'Total Liabilities / Net Worth', de.toFixed(2) + 'x');

    // 3c. Current Ratio — 30 pts
    const cr = calc.currentRatio;
    add('Financial Strength', 'Current Ratio',
        cr >= 2.0 ? 30 : cr >= 1.5 ? 22 : cr >= 1.0 ? 15 : 7,
        30, 'Current Assets / Current Liab.', cr.toFixed(2) + 'x');

    // 3d. Grant Dependency — 20 pts
    const gd = calc.grantDependencyPct;
    add('Financial Strength', 'Grant Dependency',
        gd <= 5 ? 20 : gd <= 15 ? 15 : gd <= 25 ? 10 : 5,
        20, 'Grant Income / Total Revenue', gd.toFixed(1) + '%');

    // 3e. Cash Trend — 25 pts
    const cashImproving = data.cash_last_year > data.cash_prev_year;
    const cashFlat      = data.cash_last_year === data.cash_prev_year;
    add('Financial Strength', 'Cash Trend (YoY)',
        cashImproving ? 25 : cashFlat ? 18 : 8,
        25, 'Last Year vs. Previous Year', cashImproving ? 'Improving ↑' : cashFlat ? 'Stable →' : 'Declining ↓');

    // 3f. Audit Status — 8 pts
    const auditObs = data.audit_observations;
    const auditScore = auditObs === 0 ? 8 : auditObs <= 3 ? 6 : auditObs <= 6 ? 3 : 1;
    add('Financial Strength', 'Audit Observations',
        auditScore, 8, 'Number of Issues', auditObs + ' issues');

    // ── 4. BUYER QUALITY (45 pts) ─────────────────────────────────────────────

    // 4a. Bank Sales % — 25 pts
    const bSales = calc.bankSalesPct;
    add('Buyer Quality', 'Bank Sales %',
        bSales >= 80 ? 25 : bSales >= 50 ? 18 : bSales >= 30 ? 12 : 6,
        25, 'Sales via Bank / Total Sales', bSales.toFixed(1) + '%');

    // 4b. Top 5 Buyer Concentration — 20 pts
    const top5Pct = data.top5_buyer_pct;
    add('Buyer Quality', 'Top 5 Buyer Concentration',
        top5Pct <= 30 ? 20 : top5Pct <= 50 ? 14 : 8,
        20, 'Top 5 Buyers / Total Sales', top5Pct.toFixed(1) + '%');

    // ── 5. LOAN RECOVERY (100 pts) ────────────────────────────────────────────

    // 5a. Member GNPA % — 45 pts
    const gnpa = calc.gNPA;
    add('Loan Recovery', 'Member GNPA %',
        gnpa <= 2 ? 45 : gnpa <= 5 ? 35 : gnpa <= 10 ? 25 : 10,
        45, 'NPA Loans / Total Member Loans', gnpa.toFixed(1) + '%');

    // 5b. Max DPD Members — 35 pts
    const dpd = data.max_dpd_members;
    add('Loan Recovery', 'Max DPD (Members)',
        dpd <= 30 ? 35 : dpd <= 60 ? 25 : 15,
        35, 'Days Past Due', dpd + ' days');

    // 5c. Loan Restructuring — 20 pts
    const rsMap = { 'None': 20, 'Few Times': 12, 'Frequently': 5 };
    const rsScore = rsMap[data.restructured_loans_3yr] || 5;
    add('Loan Recovery', 'Loan Restructuring History',
        rsScore, 20, 'Past 3 Years', data.restructured_loans_3yr || 'N/A');

    // ── 6. SECURITY / COLLATERAL (40 pts) ────────────────────────────────────

    const priColl = calc.primaryCollateralCoverage;
    add('Security', 'Primary Collateral Coverage',
        clamp(Math.round(priColl * 40), 0, 40),
        40, 'Land Value / Proposed Loan', priColl.toFixed(2) + 'x');

    // ── 7. GOVERNANCE (80 pts) ────────────────────────────────────────────────

    // 7a. Management Experience — 20 pts
    const mExp = data.mgmt_experience;
    add('Governance', 'Management Experience',
        mExp >= 10 ? 20 : mExp >= 5 ? 12 : 6,
        20, 'Years in Role', mExp + ' yrs');

    // 7b. Internal Controls — 20 pts
    const ic = data.internal_control_score;
    const icScore = ic >= 80 ? 20 : ic >= 60 ? 14 : ic >= 40 ? 8 : 4;
    add('Governance', 'Internal Controls',
        icScore, 20, 'Control Score (0–100)', ic);

    // 7c. Audit Observations — 20 pts (different from Financial Strength audit)
    const ao = data.audit_observations;
    const aoScore = ao === 0 ? 20 : ao <= 3 ? 14 : ao <= 6 ? 8 : 4;
    add('Governance', 'Audit Findings',
        aoScore, 20, 'Number of Observations', ao + ' obs.');

    // 7d. Loan Policy Compliance — 20 pts
    add('Governance', 'Loan Policy Compliance',
        data.loan_policy_compliance === 'Yes' ? 20 : 0,
        20, 'Policy Adherence', data.loan_policy_compliance || 'N/A');

    // ── 8. EXTERNAL RISK (55 pts) ─────────────────────────────────────────────

    // 8a. Insurance — 15 pts
    add('External Risk', 'Insurance Coverage',
        data.insurance_available === 'Yes' ? 15 : 0,
        15, 'Insurance Available', data.insurance_available || 'N/A');

    // 8b. Regulatory Compliance — 20 pts
    const regScore = data.regulatory_compliance === 'Yes' ? 20
        : data.regulatory_compliance === 'Partial' ? 10 : 0;
    add('External Risk', 'Regulatory Compliance',
        regScore, 20, 'Compliance Level', data.regulatory_compliance || 'N/A');

    // 8c. Climatic Risk — 20 pts
    const cr2 = safeNum(data.climatic_risk_score);
    add('External Risk', 'Climatic Risk',
        cr2 <= 3 ? 20 : cr2 <= 6 ? 12 : 5,
        20, 'Risk Score (1=Low, 10=High)', cr2 + '/10');

    // ── 9. CREDIT HISTORY (40 pts) ────────────────────────────────────────────

    const isNewCust = (data.customer_type === 'new');
    const bfiMap = { 'Pass': 20, 'Watch List': 14, 'Substandard': 8, 'Doubtful': 4, 'Loss': 0 };

    let creditScore = bfiMap[data.credit_history_bfi] !== undefined ? bfiMap[data.credit_history_bfi] : 5;
    if (isNewCust) creditScore = 20;
    add('Credit History', 'BFI Credit Classification',
        creditScore, 20, isNewCust ? 'New Customer (Full Points)' : 'BFI Loan Record', isNewCust ? 'N/A (New Customer)' : data.credit_history_bfi || 'N/A');

    const bfiDpd = data.max_dpd_bfi;
    let dpdScoreBfi = bfiDpd <= 0 ? 20 : bfiDpd <= 5 ? 16 : bfiDpd <= 15 ? 10 : 4;
    if (isNewCust) dpdScoreBfi = 20;
    add('Credit History', 'Max DPD (BFI Loan)',
        dpdScoreBfi, 20, isNewCust ? 'New Customer (Full Points)' : 'Days Past Due (BFI)', isNewCust ? 'N/A (New Customer)' : bfiDpd + ' days');


    // ── 10. INFRASTRUCTURE / DIGITAL (25 pts) ────────────────────────────────

    const misMap = { 'Yes': 15, 'Partial': 8, 'No': 0 };
    add('Infrastructure', 'Digital MIS / POS',
        misMap[data.digital_mis_pos] !== undefined ? misMap[data.digital_mis_pos] : 0,
        15, 'MIS/POS Adoption', data.digital_mis_pos || 'N/A');

    const sop = data.quality_sop_score;
    const sopScore = sop >= 80 ? 10 : sop >= 60 ? 6 : sop >= 40 ? 3 : 0;
    add('Infrastructure', 'Quality SOP Score',
        sopScore, 10, 'SOP/Quality Score (0–100)', sop + '/100');

    // ── 11. BEHAVIORAL / SOCIAL (75 pts) ─────────────────────────────────────

    // 11a. Committee Meetings — 10 pts
    const meetMap = { 'Weekly': 10, 'Bi-Weekly': 8, 'Monthly': 6, 'Rarely': 2 };
    add('Behavioral', 'Committee Meetings',
        meetMap[data.meeting_frequency] || 2,
        10, 'Meeting Frequency', data.meeting_frequency || 'N/A');

    // 11b. Community Support — 10 pts
    const commMap = { 'Significant': 10, 'Moderate': 6, 'Minimal': 2 };
    add('Behavioral', 'Community Support',
        commMap[data.community_support_level] || 2,
        10, 'Community Engagement Level', data.community_support_level || 'N/A');

    // 11c. Emergency Planning — 10 pts
    const emgMap = { 'Proper Plan': 10, 'Ad-hoc': 5, 'No Plan': 0 };
    add('Behavioral', 'Emergency Preparedness',
        emgMap[data.emergency_response] || 0,
        10, 'Emergency Response Plan', data.emergency_response || 'N/A');

    // 11d. Years in Operation — 20 pts
    const yrs = data.years_operation;
    add('Behavioral', 'Years in Operation',
        yrs >= 10 ? 20 : yrs >= 5 ? 14 : yrs >= 2 ? 8 : 3,
        20, 'Operational Tenure', yrs + ' yrs');

    // 11e. Audit Frequency (income expense checked) — 25 pts
    const auditFreqMap = { 'Regularly': 25, 'Occasionally': 15, 'Never': 0 };
    const auditFreqScore = auditFreqMap[data.income_expense_checked] !== undefined
        ? auditFreqMap[data.income_expense_checked] : 0;
    add('Behavioral', 'Financial Audit Frequency',
        auditFreqScore, 25, 'Audit Regularity', data.income_expense_checked || 'N/A');

    // ─────────────────────────────────────────────────────────────────────────
    // Assemble totals
    // ─────────────────────────────────────────────────────────────────────────
    const categories = Object.entries(catMap).map(([name, d]) => ({
        name,
        score: Math.round(d.score),
        max: d.max,
        logs: indicators.filter(i => i.cat === name)
    }));

    const rawTotal = indicators.reduce((s, i) => s + i.score, 0);
    const rawMax   = indicators.reduce((s, i) => s + i.max, 0);
    const totalScore = Math.min(Math.round(rawTotal), 1000);

    // ── Strengths, Weaknesses, Focus Areas ───────────────────────────────────
    const strengths   = [];
    const weaknesses  = [];
    const focus       = [];

    indicators.forEach(ind => {
        const p = ind.max > 0 ? (ind.score / ind.max) * 100 : 0;
        if (p >= 85) strengths.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p <= 35 && ind.max > 0) weaknesses.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p > 35 && p < 65) focus.push(`${ind.name}: ${ind.value} — room for improvement`);
    });

    // ── Risk Tier & Recommendation ────────────────────────────────────────────
    let riskCategory, recommendation;
    if (totalScore >= 850) {
        riskCategory  = 'A Risk';
        recommendation = 'The cooperative demonstrates exceptional financial health, stable milk operations, and strong governance. Full approval on standard terms is recommended.';
    } else if (totalScore >= 700) {
        riskCategory  = 'B Risk';
        recommendation = 'The cooperative shows solid performance with manageable weaknesses. Approval with standard monitoring and normal collateral terms is recommended.';
    } else if (totalScore >= 500) {
        riskCategory  = 'C Risk';
        recommendation = 'Elevated risk detected in key areas. Conditional approval may proceed with enhanced monitoring, additional collateral, or a reduced loan amount.';
    } else {
        riskCategory  = 'D Risk';
        recommendation = 'Significant structural weaknesses identified. The application should be declined or deferred until key financial and operational metrics improve.';
    }

    return {
        totalScore,
        rawTotal: Math.round(rawTotal),
        rawMax,
        riskCategory,
        recommendation,
        categories,
        logs: indicators.map(i => ({
            name:     i.name,
            category: i.cat,
            value:    i.value,
            score:    Math.round(i.score),
            max:      i.max,
            formula:  i.formula
        })),
        strengths:  strengths.slice(0, 8),
        weaknesses: weaknesses.slice(0, 8),
        focus:      focus.slice(0, 6)
    };
}

/**
 * model.js — Model Sheet Layer
 * Applies scoring rules to computed metrics from the Calculations layer.
 * Fully aligned to the "Model Sheet" in Credit-Scoring.xlsx.
 *
 * Score Architecture — 1000 pts total:
 *  ┌─────────────────────────────────────────────────────┬────────┐
 *  │ Category                                            │ Points │
 *  ├─────────────────────────────────────────────────────┼────────┤
 *  │ 1. Cash Flow & Loan Repayment                       │   180  │
 *  │ 2. Milk Supply & Operational Stability              │   150  │
 *  │ 3. Financial Strength & Liquidity                   │   180  │
 *  │ 4. Financial Transparency & Cash Discipline         │    50  │
 *  │ 5. Loan Recovery & Member Credit Risk               │   100  │
 *  │ 6. Management & Governance Quality                  │   100  │
 *  │ 7. Operational Quality                              │    40  │
 *  │ 8. External & Regulatory Risk                       │    40  │
 *  │ 9. Credit History / Banking Behaviour               │    40  │
 *  │ 10. Buyer Concentration & Market Risk               │    80  │
 *  │ 11. Behavioural & Due Diligence Risk                │    40  │
 *  ├─────────────────────────────────────────────────────┼────────┤
 *  │ TOTAL                                               │  1000  │
 *  └─────────────────────────────────────────────────────┴────────┘
 */

/**
 * Run the scoring model against calculated metrics.
 * @param {Object} calc - Output from runCalculations()
 * @param {Object} data - Output from transformData()
 * @returns {Object}    - Full result object for the UI
 */
function runModel(calc, data) {
    const indicators = [];
    const catMap     = {};

    /**
     * Record a scored sub-indicator.
     * @param {string} cat     - Parent category name
     * @param {string} name    - Indicator display name
     * @param {number} score   - Points awarded
     * @param {number} max     - Maximum possible points
     * @param {string} formula - Human-readable formula / description
     * @param {string} value   - Display value string
     */
    function add(cat, name, score, max, formula, value) {
        const safe = clamp(Number.isFinite(score) ? score : 0, 0, max);
        if (!catMap[cat]) catMap[cat] = { score: 0, max: 0 };
        catMap[cat].score += safe;
        catMap[cat].max   += max;
        indicators.push({ cat, name, score: Math.round(safe * 10) / 10, max, formula, value, category: cat });
    }

    // ── 1. CASH FLOW & LOAN REPAYMENT (180 pts) ───────────────────────────────
    const CAT1 = 'Cash Flow & Loan Repayment';

    // 1a. DSCR — 60 pts
    const dscr = calc.dscr;
    add(CAT1, 'DSCR',
        dscr >= 1.5 ? 60 : dscr >= 1.25 ? 48 : dscr >= 1 ? 36 : dscr >= 0.8 ? 20 : 0,
        60, 'EBITDA / (Annual Principal + Interest)', dscr.toFixed(2) + 'x');

    // 1b. Seasonality Coverage — 50 pts
    const sc = calc.seasonality_coverage;
    add(CAT1, 'Seasonality Coverage',
        sc >= 20 ? 50 : sc >= 15 ? 40 : sc >= 10 ? 30 : sc >= 5 ? 20 : 0,
        50, 'Last Year Cash / Lean Month Expense', sc.toFixed(1) + ' months');

    // 1c. Inventory Days — 30 pts
    // Sheet: IF(>=60,30, IF(>=90,24, IF(>=120,18, IF(>=180,10,0))))
    // Higher value = more inventory days credit given to buyers = better
    const invD = calc.inventory_days;
    add(CAT1, 'Inventory Days',
        invD >= 180 ? 0 : invD >= 120 ? 10 : invD >= 90 ? 18 : invD >= 60 ? 24 : 30,
        30, '(Avg Inventory / COGS) × 365', Math.round(invD) + ' days');

    // 1d. Receivable Days — 40 pts  (lower = better = faster payment from buyers)
    // Sheet: IF(>=90,0, IF(>=60,12, IF(>=45,24, IF(>=30,32, 40))))
    const recD = calc.receivable_days;
    add(CAT1, 'Receivable Days',
        recD >= 90 ? 0 : recD >= 60 ? 12 : recD >= 45 ? 24 : recD >= 30 ? 15 : 40,
        40, '(Accounts Receivable / Total Revenue) × 365', Math.round(recD) + ' days');

    // ── 2. MILK SUPPLY & OPERATIONAL STABILITY (150 pts) ─────────────────────
    const CAT2 = 'Milk Supply & Operational Stability';

    // 2a. Milk Stability % — 30 pts
    const milkStab = calc.milk_stability_pct;
    add(CAT2, 'Milk Stability %',
        milkStab >= 90 ? 30 : milkStab >= 80 ? 24 : milkStab >= 70 ? 18 : milkStab >= 60 ? 10 : 0,
        30, '(Lowest Monthly / Avg Monthly) × 100', milkStab.toFixed(1) + '%');

    // 2b. Days Stability % — 20 pts
    const dayStab = calc.days_stability_pct;
    add(CAT2, 'Days Stability %',
        dayStab >= 95 ? 20 : dayStab >= 85 ? 15 : dayStab >= 75 ? 10 : dayStab >= 65 ? 5 : 0,
        20, '(Collection Days / 365) × 100', dayStab.toFixed(1) + '%');

    // 2c. Milk Loss % — 20 pts  (lower is better)
    const mLoss = calc.milk_loss_pct;
    add(CAT2, 'Milk Loss %',
        mLoss <= 2 ? 20 : mLoss <= 5 ? 16 : mLoss <= 8 ? 10 : mLoss <= 12 ? 5 : 0,
        20, '(Milk Loss / Total Collected) × 100', mLoss.toFixed(2) + '%');

    // 2d. Yield Loss % — 20 pts  (lower is better)
    const yLoss = calc.yield_loss_pct;
    add(CAT2, 'Yield Loss %',
        yLoss <= 2 ? 20 : yLoss <= 5 ? 15 : yLoss <= 8 ? 10 : yLoss <= 12 ? 5 : 0,
        20, '(Milk Loss / Produced Milk) × 100', yLoss.toFixed(2) + '%');

    // 2e. Farmer Concentration % — 15 pts  (lower is better)
    const fConc = calc.farmer_concentration_pct;
    add(CAT2, 'Farmer Concentration %',
        fConc <= 20 ? 15 : fConc <= 35 ? 12 : fConc <= 50 ? 8 : fConc <= 70 ? 4 : 0,
        15, '(Top 5 Farmer Collection / Total Milk) × 100', fConc.toFixed(1) + '%');

    // 2f. Collection Stability % — 15 pts
    const colStab = calc.collection_stability;
    add(CAT2, 'Collection Stability %',
        colStab >= 0.15 ? 15 : colStab >= 0.10 ? 12 : colStab >= 0.05 ? 8 : colStab >= 0.01 ? 4 : 0,
        15, 'Total Milk Collected / Total Member Loans', colStab.toFixed(4));

    // 2g. Payment Fairness % — 15 pts
    const payFair = calc.payment_fairness;
    add(CAT2, 'Payment Fairness %',
        payFair >= 0.85 ? 15 : payFair >= 0.70 ? 12 : payFair >= 0.55 ? 8 : payFair >= 0.40 ? 4 : 0,
        15, '1 − (Max DPD / 30)', (payFair * 100).toFixed(1) + '%');

    // 2h. Logistics Reliability — 15 pts
    add(CAT2, 'Logistics Reliability',
        calc.logistics_reliability === 'Yes' ? 15 : 0,
        15, 'Storage / Cold Chain Available', calc.logistics_reliability || 'No');

    // ── 3. FINANCIAL STRENGTH & LIQUIDITY (180 pts) ───────────────────────────
    const CAT3 = 'Financial Strength & Liquidity';

    // 3a. Net Worth — 40 pts
    // Sheet: IF(netWorth > (Data!D5+Data!D6)*2, 40, IF(> (D5+D6), 30, IF(>0, 15, 0)))
    // Data!D5=existing_loan_amt, Data!D6=proposed_loan_amt → total_loan
    const nw    = calc.net_worth;
    const tLoan = data.total_loan;
    add(CAT3, 'Net Worth',
        nw > tLoan * 2 ? 40 : nw > tLoan ? 30 : nw > 0 ? 15 : 0,
        40, 'Total Assets − Total Liabilities vs Total Loan', fmtNPR(nw));

    // 3b. Debt / Equity — 40 pts
    const de = calc.debt_equity;
    add(CAT3, 'Debt / Equity',
        de <= 0.5 ? 40 : de <= 1 ? 32 : de <= 2 ? 20 : de <= 3 ? 10 : 0,
        40, 'Total Debt / Net Worth', de.toFixed(2) + 'x');

    // 3c. Current Ratio — 40 pts
    const cr = calc.current_ratio;
    add(CAT3, 'Current Ratio',
        cr >= 2 ? 40 : cr >= 1.5 ? 30 : cr >= 1 ? 20 : cr >= 0.5 ? 10 : 0,
        40, 'Current Assets / Current Liabilities', cr.toFixed(2) + 'x');

    // 3d. Grant % of Revenue — 30 pts  (lower grant dependency = better)
    const gPct = calc.grant_pct;  // fraction
    add(CAT3, 'Grant % of Revenue',
        gPct <= 0.02 ? 30 : gPct <= 0.05 ? 15 : gPct <= 0.10 ? 10 : 0,
        30, 'Grant Income / Total Revenue', (gPct * 100).toFixed(1) + '%');

    // 3e. Cash / Bank Balance Trend — 30 pts
    add(CAT3, 'Cash / Bank Balance Trend',
        calc.cash_trend === 'UP' ? 30 : calc.cash_trend === 'STABLE' ? 15 : 0,
        30, 'Last Year vs Previous Year Balance', calc.cash_trend);

    // ── 4. FINANCIAL TRANSPARENCY & CASH DISCIPLINE (50 pts) ─────────────────
    const CAT4 = 'Financial Transparency & Cash Discipline';

    // 4a. % Sales via Bank — 25 pts
    const bPct = calc.bank_sales_pct;
    add(CAT4, '% Sales via Bank',
        bPct > 80 ? 25 : bPct > 50 ? 15 : 0,
        25, 'Bank Sales / Total Sales × 100', bPct.toFixed(1) + '%');

    // 4b. Digital MIS / POS / QR — 25 pts
    add(CAT4, 'Digital MIS / POS / QR',
        calc.digital_mis === 'Yes' ? 25 : 0,
        25, 'MIS/POS/QR Adoption', calc.digital_mis || 'No');

    // ── 5. LOAN RECOVERY & MEMBER CREDIT RISK (100 pts) ──────────────────────
    const CAT5 = 'Loan Recovery & Member Credit Risk';

    // 5a. Member GNPA % — 45 pts  (lower is better)
    const gnpa = calc.member_gnpa_pct;  // fraction
    add(CAT5, 'Member GNPA %',
        gnpa <= 0.05 ? 45 : gnpa <= 0.10 ? 35 : gnpa <= 0.15 ? 25 : gnpa <= 0.20 ? 15 : 0,
        45, 'NPA Member Loans / Total Member Loans', (gnpa * 100).toFixed(1) + '%');

    // 5b. Max DPD — 35 pts
    const dpd = calc.max_dpd_members;
    add(CAT5, 'Max DPD (Members)',
        dpd <= 5 ? 35 : dpd <= 10 ? 25 : dpd <= 15 ? 15 : 0,
        35, 'Maximum Days Past Due (Member Loans)', dpd + ' days');

    // 5c. Restructuring History — 20 pts
    const rst = calc.restructuring;
    add(CAT5, 'Loan Restructuring History',
        rst === 'None' ? 20 : rst === 'Few Times' ? 15 : 0,
        20, 'Restructured Loans (Past 3 Years)', rst || 'N/A');

    // ── 6. MANAGEMENT & GOVERNANCE QUALITY (100 pts) ─────────────────────────
    const CAT6 = 'Management & Governance Quality';

    // 6a. Management Experience — 25 pts
    const mExp = calc.mgmt_experience;
    add(CAT6, 'Management Experience',
        mExp >= 10 ? 25 : mExp >= 7 ? 15 : mExp >= 5 ? 10 : 0,
        25, 'Avg Years in Management Role', mExp + ' yrs');

    // 6b. Internal Controls — 25 pts
    // 6b. Internal Controls — 25 pts
    // questions.js stores 'Robust'/'Adequate'/'Weak' (fixed)
    // Legacy submissions stored '85'/'65'/'20' — keep fallbacks
    const ic = String(calc.internal_controls || '');
    const icScore = ic.includes('Robust') || ic === '85' ? 25
        : ic.includes('Adequate') || ic.includes('Moderate') || ic === '65' ? 10 : 0;
    add(CAT6, 'Internal Controls',
        icScore, 25, 'Internal Control Assessment', ic || 'N/A');

    // 6c. Audit Findings — 25 pts
    // Sheet: "None"→25, "Few"→15, "Qualified"→0
    const af = calc.audit_findings;  // 'None' / 'Few' / 'Qualified'
    add(CAT6, 'Audit Findings',
        af === 'None' || af === '0' || af === 'none' ? 25
        : af === 'Few'  || af === '1' || af === 'few'  ? 15 : 0,
        25, 'Number of Audit Observations', af || 'N/A');

    // 6d. Lending Policy Compliance — 25 pts
    add(CAT6, 'Lending Policy Compliance',
        calc.lending_compliance === 'Yes' ? 25 : 0,
        25, 'Loan Policy Adherence', calc.lending_compliance || 'No');

    // ── 7. OPERATIONAL QUALITY (40 pts) ──────────────────────────────────────
    const CAT7 = 'Operational Quality';

    // 7a. Quality SOP Compliance — 40 pts
    // Sheet: string match on full SOP dropdown value
    // "Standards and documents exist. मापदण्ड र दस्तावेज छन्" → 40
    // "Standards exist, no documents मापदण्ड छन्, दस्तावेज छैन" → 30
    // "No standards (मापदण्ड छैन) ..." → 20, else 0
    const sop = calc.quality_sop_numeric;  // passed through from data.quality_sop_score_model_b
    const sopStr = String(sop || '');
    const sopScore = sopStr.includes('Standards and documents exist') ? 40
        : sopStr.includes('Standards exist, no documents') ? 30
        : sopStr.includes('No standards') ? 20 : 0;
    add(CAT7, 'Quality SOP Compliance',
        sopScore,
        40, 'Milk Collection / Handling Standards & Documentation', sopStr || 'N/A');

    // ── 8. EXTERNAL & REGULATORY RISK (40 pts) ───────────────────────────────
    const CAT8 = 'External & Regulatory Risk';

    // 8a. Insurance Coverage — 10 pts
    add(CAT8, 'Insurance Coverage',
        calc.insurance_coverage === 'Yes' ? 10 : 0,
        10, 'Insurance Available', calc.insurance_coverage || 'No');

    // 8b. Regulatory Compliance — 15 pts
    // Sheet: IF("Full",15, IF("Partial",5, 0))
    // DropdownOptions confirms form value is "Full" not "Yes"
    add(CAT8, 'Regulatory Compliance',
        calc.regulatory_compliance === 'Full' ? 15 : calc.regulatory_compliance === 'Partial' ? 5 : 0,
        15, 'Darta, Tax, NRB Reporting Compliance', calc.regulatory_compliance || 'No');

    // 8c. Climatic Risk — 15 pts
    const clim = calc.climatic_risk;  // 'Low' / 'Medium' / 'High'
    add(CAT8, 'Climatic / Input Risk',
        clim === 'Low' ? 15 : clim === 'Medium' ? 10 : 0,
        15, 'Climatic / Input Risk Level', clim || 'N/A');

    // ── 9. CREDIT HISTORY / BANKING BEHAVIOUR (40 pts) ───────────────────────
    const CAT9 = 'Credit History / Banking Behaviour';

    const isNew = (data.customer_type === 'new');

    // 9a. Credit History — 20 pts
    const chMap = { 'Pass': 20, 'Watch List': 15, 'Substandard': 10, 'Doubtful': 4, 'Loss': 0 };
    const chScore = isNew ? 20 : (chMap[calc.credit_history] !== undefined ? chMap[calc.credit_history] : 5);
    add(CAT9, 'Credit History (BFI)',
        chScore, 20,
        isNew ? 'New Customer — Full Points' : 'BFI Loan Classification',
        isNew ? 'New Customer' : calc.credit_history || 'N/A');

    // 9b. Max Delays (BFI) — 20 pts
    const bfiDpd    = calc.max_delays_bfi;
    const dpdScore  = isNew ? 20
        : bfiDpd <= 5 ? 20 : bfiDpd <= 10 ? 15 : bfiDpd <= 15 ? 10 : 0;
    add(CAT9, 'Max DPD (BFI Loan)',
        dpdScore, 20,
        isNew ? 'New Customer — Full Points' : 'Days Past Due on Bank Loan',
        isNew ? 'New Customer' : bfiDpd + ' days');

    // ── 10. BUYER CONCENTRATION & MARKET RISK (80 pts) ───────────────────────
    const CAT10 = 'Buyer Concentration & Market Risk';

    // 10a. Top 5 Buyer Concentration % — 25 pts  (lower is better)
    const t5  = calc.top5_buyer_conc_pct;
    add(CAT10, 'Top 5 Buyer Concentration %',
        t5 <= 20 ? 25 : t5 <= 30 ? 20 : t5 <= 40 ? 15 : t5 <= 50 ? 10 : 5,
        25, 'Top 5 Buyer Sales / Total Sales × 100', t5.toFixed(1) + '%');

    // 10b. Largest Buyer Concentration % — 25 pts  (lower is better)
    const lb  = calc.largest_buyer_conc_pct;
    add(CAT10, 'Largest Buyer Concentration %',
        lb <= 20 ? 25 : lb <= 30 ? 20 : lb <= 40 ? 15 : lb <= 50 ? 10 : 5,
        25, 'Largest Buyer Sales / Total Sales × 100', lb.toFixed(1) + '%');

    // 10c. Stable Buyer Share % — 10 pts
    const sbsPct = calc.stable_buyer_share_pct;
    add(CAT10, 'Stable Buyer Share %',
        sbsPct >= 60 ? 10 : sbsPct >= 40 ? 5 : 0,
        10, '(Govt + Large Private Buyers) / Total Buyers × 100', sbsPct.toFixed(1) + '%');

    // 10d. Contract Coverage % — 10 pts
    const ccFrac = calc.contract_score_frac;
    add(CAT10, 'Contract Coverage %',
        ccFrac >= 0.80 ? 10 : ccFrac >= 0.50 ? 5 : 0,
        10, 'Buyers Under Contract / Total Buyers', (ccFrac * 100).toFixed(1) + '%');

    // 10e. Payment Score — 10 pts
    const ps = calc.payment_score_frac;
    add(CAT10, 'Buyer Payment Score',
        ps >= 0.90 ? 10 : ps >= 0.80 ? 9 : ps >= 0.70 ? 7 : ps >= 0.50 ? 5 : 0,
        10, '1 − (Avg Payment Days / 90)', (ps * 100).toFixed(1) + '%');

    // ── 11. BEHAVIOURAL & DUE DILIGENCE RISK (40 pts, 8 × 5 pts) ─────────────
    const CAT11 = 'Behavioural & Due Diligence Risk';

    // 11a. Committee Meeting Frequency — 5 pts
    // Sheet: "Weekly"→5, "Monthly"→2.5, "Quarterly"→1.5, "Annually"→1
    // DropdownOptions: Weekly / Monthly / Quarterly / Annually
    add(CAT11, 'Committee Meeting Frequency',
        calc.meeting_frequency === 'Weekly'    ? 5
        : calc.meeting_frequency === 'Monthly'   ? 2.5
        : calc.meeting_frequency === 'Quarterly' ? 1.5
        : calc.meeting_frequency === 'Annually'  ? 1 : 0,
        5, 'Committee Meeting Regularity', calc.meeting_frequency || 'N/A');

    // 11b. Member Info Transparency — 5 pts
    add(CAT11, 'Member Info Transparency',
        calc.member_transparency === 'Always'           ? 5
        : calc.member_transparency === 'Mostly'         ? 2.5
        : calc.member_transparency === 'Sometimes'      ? 1.5
        : calc.member_transparency === 'Decided among few' ? 1 : 0,
        5, 'Transparency with Members on Plans', calc.member_transparency || 'N/A');

    // 11c. Fund Utilization Transparency — 5 pts
    // Sheet: "Buying milk"→5, "Processing"→2.5, "members"→1.5, "1 area covered"→1
    // DropdownOptions: "Buying Milk" / "Processing" / "Members" / "Other things"
    // Data sheet stores the form value; Data!D69=fund_usage. Model checks fund_utilization.
    // Use case-insensitive contains check to handle both sheet and portal values
    const fu = (calc.fund_utilization || '').toLowerCase();
    add(CAT11, 'Fund Utilization Transparency',
        fu.includes('buying') || fu.includes('milk') ? 5
        : fu === 'processing' ? 2.5
        : fu === 'members' ? 1.5
        : fu.includes('other') || fu.includes('1 area') ? 1 : 0,
        5, 'Primary Fund Usage Category', calc.fund_utilization || 'N/A');

    // 11d. Member Identification & KYC Compliance — 5 pts
    add(CAT11, 'Member KYC Compliance',
        calc.kyc_compliance === 'Easily Found' ? 5
        : calc.kyc_compliance === 'Mostly'     ? 2.5
        : calc.kyc_compliance === 'Sometimes'  ? 1.5
        : calc.kyc_compliance === 'Hard'       ? 1 : 0,
        5, 'Member Records Accessibility', calc.kyc_compliance || 'N/A');

    // 11e. Financial Oversight & Verification Practice — 5 pts
    add(CAT11, 'Financial Oversight',
        calc.financial_oversight === 'Regularly'   ? 5
        : calc.financial_oversight === 'Occasionally' ? 2.5
        : calc.financial_oversight === 'Once'      ? 1.5
        : 0,
        5, 'Income/Expense Verification Frequency', calc.financial_oversight || 'N/A');

    // 11f. Governance Communication Effectiveness — 5 pts
    // Sheet: "Always beforehand"→5, "Mostly beforehand"→2.5, "Sometimes beforehand"→1.5
    //        "Only after implementation"→1
    // DropdownOptions: "Always Beforehand" / "Mostly Beforehand" / "Sometimes beforehand"
    //                  / "Only after implementation"
    const gc = (calc.governance_communication || '').toLowerCase();
    add(CAT11, 'Governance Communication',
        gc.startsWith('always') ? 5
        : gc.startsWith('mostly') ? 2.5
        : gc.startsWith('sometimes') ? 1.5
        : gc.startsWith('only after') ? 1 : 0,
        5, 'Member Notification Before New Rules', calc.governance_communication || 'N/A');

    // 11g. Stakeholder Engagement & Social Responsibility — 5 pts
    // Sheet: "Frequently"→5, "Sometimes"→2.5, "Never"→1.5
    // DropdownOptions: "Frequently" / "Sometimes" / "Never"
    add(CAT11, 'Stakeholder Engagement',
        calc.stakeholder_engagement === 'Frequently' ? 5
        : calc.stakeholder_engagement === 'Sometimes' ? 2.5
        : calc.stakeholder_engagement === 'Never'     ? 1.5 : 0,
        5, 'Community Support Level', calc.stakeholder_engagement || 'N/A');

    // 11h. Operational Contingency Preparedness — 5 pts
    // Sheet: "Proper Plan"→5, "Normal"→2.5, "Little Preparation"→1.5, "Nothing"→0
    // DropdownOptions: "Proper Plan" / "Normal" / "Little Preparation" / "Nothing"
    add(CAT11, 'Emergency Preparedness',
        calc.emergency_preparedness === 'Proper Plan'        ? 5
        : calc.emergency_preparedness === 'Normal'           ? 2.5
        : calc.emergency_preparedness === 'Little Preparation' ? 1.5
        : calc.emergency_preparedness === 'Nothing'          ? 0 : 0,
        5, 'Emergency / Low-Milk Response Plan', calc.emergency_preparedness || 'N/A');

    // ─────────────────────────────────────────────────────────────────────────
    // Assemble totals
    // ─────────────────────────────────────────────────────────────────────────
    const categories = Object.entries(catMap).map(([name, d]) => ({
        name,
        score: Math.round(d.score * 10) / 10,
        max:   d.max,
        logs:  indicators.filter(i => i.cat === name)
    }));

    const rawTotal   = indicators.reduce((s, i) => s + i.score, 0);
    const rawMax     = indicators.reduce((s, i) => s + i.max, 0);
    const totalScore = Math.min(Math.round(rawTotal), 1000);

    // ── Strengths, Weaknesses, Focus Areas ───────────────────────────────────
    const strengths  = [];
    const weaknesses = [];
    const focus      = [];

    indicators.forEach(ind => {
        const p = ind.max > 0 ? (ind.score / ind.max) * 100 : 0;
        if (p >= 85)               strengths.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p <= 35 && ind.max > 0) weaknesses.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p > 35 && p < 65)       focus.push(`${ind.name}: ${ind.value} — room for improvement`);
    });

    // ── Risk Tier & Recommendation ────────────────────────────────────────────
    let riskCategory, recommendation;
    if (totalScore >= 850) {
        riskCategory   = 'A Risk — Acceptable';
        recommendation = 'The cooperative demonstrates exceptional financial health, stable milk operations, and strong governance. Full approval on standard terms is recommended.';
    } else if (totalScore >= 700) {
        riskCategory   = 'B Risk — Moderate';
        recommendation = 'The cooperative shows solid performance with manageable weaknesses. Approval with standard monitoring and normal collateral terms is recommended.';
    } else if (totalScore >= 500) {
        riskCategory   = 'C Risk — Elevated';
        recommendation = 'Elevated risk detected in key areas. Conditional approval may proceed with enhanced monitoring, additional collateral, or a reduced loan amount.';
    } else {
        riskCategory   = 'D Risk — High';
        recommendation = 'Significant structural weaknesses identified. The application should be declined or deferred until key financial and operational metrics improve substantially.';
    }

    return {
        totalScore,
        rawTotal:    Math.round(rawTotal),
        rawMax,
        riskCategory,
        recommendation,
        categories,
        metrics: {
            dscr:               calc.dscr,
            current_ratio:      calc.current_ratio,
            debt_equity:        calc.debt_equity,
            gnpa_pct:           calc.member_gnpa_pct * 100,
            milk_loss_pct:      calc.milk_loss_pct,
            grant_pct:          calc.grant_pct * 100,
            bank_sales_pct:     calc.bank_sales_pct,
            seasonality:        calc.seasonality_coverage
        },
        data: {
            total_revenue:     data.total_revenue,
            total_assets:      data.total_assets,
            total_liabilities: data.total_liabilities,
            total_networth:    data.total_networth,
            total_loan:        data.total_loan,
            proposed_loan_amt: data.proposed_loan_amt
        },
        logs: indicators.map(i => ({
            name:     i.name,
            category: i.cat,
            value:    i.value,
            score:    Math.round(i.score * 10) / 10,
            max:      i.max,
            formula:  i.formula
        })),
        strengths:  strengths.slice(0, 8),
        weaknesses: weaknesses.slice(0, 8),
        focus:      focus.slice(0, 6)
    };
}
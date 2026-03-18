/**
 * admin/js/engine.js
 * Self-contained scoring engine bundle for the Admin Panel.
 * Copied from js/engine/* — keeps admin panel independent of the user portal.
 *
 * Exposes one function: runScoringEngine(formInputs) → result
 * Called by resultViewer.js when opening a submission to rebuild
 * categories, strengths, weaknesses, focus areas, and metrics.
 */

// ── Utilities ─────────────────────────────────────────────────────────────────

function safeNum(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

function safeDivide(a, b) {
    return b !== 0 ? a / b : 0;
}

function pct(part, total) {
    return total > 0 ? (part / total) * 100 : 0;
}

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function fmtNum(n) {
    return Number(n).toLocaleString('en-IN');
}

function fmtNPR(val) {
    const n = Number(val);
    if (!val || isNaN(n) || n === 0) return '—';
    if (n >= 1e7) return 'NPR ' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return 'NPR ' + (n / 1e5).toFixed(2) + ' L';
    return 'NPR ' + n.toLocaleString('en-IN');
}

// ── Step 1: dataTransform.js ──────────────────────────────────────────────────

function transformData(rawInputs) {
    const inp = {};
    for (const [key, val] of Object.entries(rawInputs)) { inp[key] = val; }
    const n = key => safeNum(inp[key]);

    const existing_loan  = n('existing_loan');
    const proposed_loan  = n('proposed_loan');
    const total_loan     = existing_loan + proposed_loan;
    const interest_rate  = n('interest_rate');
    const loan_tenure    = n('loan_tenure');

    const milk_sales          = n('milk_sales');
    const other_product_sales = n('other_product_sales');
    const other_income        = n('other_income');
    const grant_income        = n('grant_income');
    const total_sales         = milk_sales + other_product_sales + other_income;
    const total_revenue       = total_sales + grant_income;
    const bank_sales          = n('bank_sales');

    const top5_buyers_sales   = n('top5_buyers_sales');
    const largest_buyer_sales = n('largest_buyer_sales');
    const top5_buyer_pct      = total_sales > 0 ? (top5_buyers_sales / total_sales) * 100 : 0;
    const largest_buyer_pct   = total_sales > 0 ? (largest_buyer_sales / total_sales) * 100 : 0;

    const raw_milk_cost         = n('raw_milk_cost');
    const processing_cost       = n('processing_cost');
    const packaging_cost        = n('packaging_cost');
    const transport_cost        = n('transport_cost');
    const other_processing_cost = n('other_processing_cost');
    const salary_expense        = n('salary_expense');
    const admin_expense         = n('admin_expense');
    const electricity_expense   = n('electricity_expense');
    const fuel_expense          = n('fuel_expense');
    const repair_expense        = n('repair_expense');
    const rent_expense          = n('rent_expense');
    const other_opex            = n('other_opex');
    const annual_depreciation   = n('annual_depreciation');
    const amortization_amount   = n('amortization_amount');

    const total_opex = raw_milk_cost + processing_cost + packaging_cost +
                       transport_cost + other_processing_cost + salary_expense +
                       admin_expense + electricity_expense + fuel_expense +
                       repair_expense + rent_expense + other_opex;

    const cash_hand              = n('cash_hand');
    const bank_balance           = n('bank_balance');
    const total_cash             = cash_hand + bank_balance;
    const cash_last_year         = n('cash_last_year');
    const cash_prev_year         = n('cash_prev_year');
    const lowest_monthly_expense = n('lowest_monthly_expense');
    const avg_inventory_value    = n('avg_inventory_value');
    const audit_observations     = n('audit_observations');

    const accounts_receivable  = n('accounts_receivable');
    const inventory_value      = n('inventory_value');
    const prepaid_expenses     = n('prepaid_expenses');
    const other_current_assets = n('other_current_assets');
    const total_current_assets = total_cash + accounts_receivable + inventory_value +
                                 prepaid_expenses + other_current_assets;

    const land_value         = n('land_value');
    const building_value     = n('building_value');
    const machinery_value    = n('machinery_value');
    const vehicle_value      = n('vehicle_value');
    const furniture_value    = n('furniture_value');
    const other_fixed_assets = n('other_fixed_assets');
    const total_fixed_assets = land_value + building_value + machinery_value +
                               vehicle_value + furniture_value + other_fixed_assets;
    const total_assets       = total_current_assets + total_fixed_assets;

    const accounts_payable  = n('accounts_payable');
    const short_term_loan   = n('short_term_loan');
    const accrued_expenses  = n('accrued_expenses');
    const current_ltd       = n('current_ltd');
    const long_term_loan    = n('long_term_loan');
    const other_ltl         = n('other_ltl');

    const total_current_liabilities  = accounts_payable + short_term_loan + accrued_expenses + current_ltd;
    const total_long_term_liabilities = long_term_loan + other_ltl;
    const total_liabilities           = total_current_liabilities + total_long_term_liabilities;

    const paid_up_capital   = n('paid_up_capital');
    const retained_earnings = n('retained_earnings');
    const reserve_fund      = n('reserve_fund');
    const total_net_worth   = paid_up_capital + retained_earnings + reserve_fund;

    const primary_land_value    = n('primary_land_value');
    const total_milk_collected  = n('total_milk_collected');
    const milk_loss             = n('milk_loss');
    const processing_loss       = n('processing_loss');
    const total_milk_sold       = Math.max(0, total_milk_collected - milk_loss - processing_loss);
    const avg_monthly_milk      = n('avg_monthly_milk') || (total_milk_collected / 12);
    const lowest_monthly_milk   = n('lowest_monthly_milk');
    const collection_days       = n('collection_days');
    const total_farmers         = n('total_farmers');
    const avg_milk_per_farmer   = total_farmers > 0 ? total_milk_collected / total_farmers : 0;
    const top5_farmers_milk     = n('top5_farmers_milk');

    const vehicle_avail_pct      = n('vehicle_avail_pct');
    const storage_cold_facility  = inp['storage_cold_facility'] || '';
    const digital_mis_pos        = inp['digital_mis_pos'] || '';
    const quality_sop_score      = n('quality_sop_score');

    const total_member_loans      = n('total_member_loans');
    const npa_member_loans        = n('npa_member_loans');
    const max_dpd_members         = n('max_dpd_members');
    const restructured_loans_3yr  = inp['restructured_loans_3yr'] || 'None';

    const mgmt_experience         = n('mgmt_experience');
    const internal_control_score  = n('internal_control_score');
    const loan_policy_compliance  = inp['loan_policy_compliance'] || '';
    const meeting_frequency       = inp['meeting_frequency'] || '';
    const income_expense_checked  = inp['income_expense_checked'] || '';

    const insurance_available    = inp['insurance_available'] || '';
    const regulatory_compliance  = inp['regulatory_compliance'] || '';
    const climatic_risk_score    = n('climatic_risk_score');

    const credit_history_bfi     = inp['credit_history_bfi'] || '';
    const max_dpd_bfi            = n('max_dpd_bfi');

    const community_support_level = inp['community_support_level'] || '';
    const emergency_response      = inp['emergency_response'] || '';
    const years_operation         = n('years_operation');

    return {
        coop_name: inp['coop_name'] || '', model_type: inp['model_type'] || '',
        loan_type: inp['loan_type'] || '', customer_type: inp['customer_type'] || '',
        years_operation,
        existing_loan, proposed_loan, total_loan, interest_rate, loan_tenure, primary_land_value,
        milk_sales, other_product_sales, other_income, grant_income,
        total_sales, total_revenue, bank_sales,
        top5_buyers_sales, largest_buyer_sales, top5_buyer_pct, largest_buyer_pct,
        raw_milk_cost, processing_cost, packaging_cost, transport_cost,
        other_processing_cost, salary_expense, admin_expense,
        electricity_expense, fuel_expense, repair_expense, rent_expense,
        other_opex, total_opex, annual_depreciation, amortization_amount,
        cash_hand, bank_balance, total_cash, cash_last_year, cash_prev_year,
        lowest_monthly_expense, avg_inventory_value, audit_observations,
        accounts_receivable, inventory_value, prepaid_expenses, other_current_assets,
        total_current_assets,
        land_value, building_value, machinery_value, vehicle_value, furniture_value, other_fixed_assets,
        total_fixed_assets, total_assets,
        accounts_payable, short_term_loan, accrued_expenses, current_ltd, total_current_liabilities,
        long_term_loan, other_ltl, total_long_term_liabilities, total_liabilities,
        paid_up_capital, retained_earnings, reserve_fund, total_net_worth,
        total_milk_collected, milk_loss, processing_loss, total_milk_sold,
        avg_monthly_milk, lowest_monthly_milk, collection_days,
        total_farmers, avg_milk_per_farmer, top5_farmers_milk,
        vehicle_avail_pct, storage_cold_facility, digital_mis_pos, quality_sop_score,
        total_member_loans, npa_member_loans, max_dpd_members, restructured_loans_3yr,
        mgmt_experience, internal_control_score, loan_policy_compliance,
        meeting_frequency, income_expense_checked,
        insurance_available, regulatory_compliance, climatic_risk_score,
        credit_history_bfi, max_dpd_bfi,
        community_support_level, emergency_response
    };
}

// ── Step 2: calculations.js ───────────────────────────────────────────────────

function runCalculations(data) {
    const ebitda = data.total_revenue - data.total_opex +
                   data.annual_depreciation + data.amortization_amount;

    const annualInterest  = data.proposed_loan * (data.interest_rate / 100);
    const annualPrincipal = data.loan_tenure > 0
        ? data.proposed_loan / (data.loan_tenure / 12) : 0;
    const debtService = annualPrincipal + annualInterest;

    const dscr = debtService > 0
        ? safeDivide(ebitda, debtService)
        : (ebitda > 0 ? 2.5 : 0);

    const leanMonthExp = data.lowest_monthly_expense > 0
        ? data.lowest_monthly_expense : (data.total_opex / 12);
    const seasonalityCoverage = leanMonthExp > 0
        ? safeDivide(data.total_cash, leanMonthExp) : 0;

    const receivableDays = data.total_sales > 0
        ? (data.accounts_receivable / (data.total_sales / 365)) : 0;

    const invVal = data.avg_inventory_value > 0
        ? data.avg_inventory_value : data.inventory_value;
    const inventoryDays = data.raw_milk_cost > 0
        ? (invVal / (data.raw_milk_cost / 365)) : 0;

    const milkStability    = data.avg_monthly_milk > 0
        ? pct(data.lowest_monthly_milk, data.avg_monthly_milk) : 0;
    const collectionDayPct = (data.collection_days / 365) * 100;
    const milkLossRate     = data.total_milk_collected > 0
        ? pct(data.milk_loss, data.total_milk_collected) : 0;
    const yieldLossRate    = data.total_milk_collected > 0
        ? pct(data.processing_loss, data.total_milk_collected) : 0;
    const farmerConcentration = data.total_milk_collected > 0
        ? pct(data.top5_farmers_milk, data.total_milk_collected) : 0;

    const currentRatio = data.total_current_liabilities > 0
        ? safeDivide(data.total_current_assets, data.total_current_liabilities)
        : (data.total_current_assets > 0 ? 5.0 : 0);

    const debtEquityRatio = data.total_net_worth > 0
        ? safeDivide(data.total_liabilities, data.total_net_worth)
        : (data.total_liabilities > 0 ? 5.0 : 0);

    const grantDependencyPct = data.total_revenue > 0
        ? pct(data.grant_income, data.total_revenue) : 0;
    const bankSalesPct = data.total_sales > 0
        ? pct(data.bank_sales, data.total_sales) : 0;

    const primaryCollateralCoverage = data.proposed_loan > 0
        ? safeDivide(data.primary_land_value, data.proposed_loan)
        : (data.primary_land_value > 0 ? 2.0 : 0);

    const gNPA = data.total_member_loans > 0
        ? pct(data.npa_member_loans, data.total_member_loans) : 0;

    return {
        ebitda, debtService, dscr, seasonalityCoverage,
        receivableDays, inventoryDays,
        milkStability, collectionDayPct, milkLossRate, yieldLossRate,
        farmerConcentration, currentRatio, debtEquityRatio,
        grantDependencyPct, bankSalesPct, primaryCollateralCoverage, gNPA,
        // Expose raw computed values for the approver metrics panel
        dscr_raw: dscr,
        current_ratio: currentRatio,
        debt_equity: debtEquityRatio,
        gnpa_pct: gNPA,
        milk_loss_pct: milkLossRate,
        collateral_cover: primaryCollateralCoverage
    };
}

// ── Step 3: model.js ──────────────────────────────────────────────────────────

function runModel(calc, data) {
    const indicators = [];
    const catMap = {};

    function add(cat, name, score, max, formula, value) {
        const safeScore = clamp(Number.isFinite(score) ? score : 0, 0, max);
        if (!catMap[cat]) catMap[cat] = { score: 0, max: 0 };
        catMap[cat].score += safeScore;
        catMap[cat].max   += max;
        indicators.push({ cat, name, score: Math.round(safeScore * 10) / 10, max, formula, value, category: cat });
    }

    // 1. Cash Flow (180 pts)
    const dscr = calc.dscr;
    add('Cash Flow','DSCR (Debt Coverage)',
        dscr>=2.0?60:dscr>=1.5?45:dscr>=1.25?30:dscr>=1.0?15:0,
        60,'EBITDA / Annual Debt Service',dscr.toFixed(2)+'x');
    const sc = calc.seasonalityCoverage;
    add('Cash Flow','Seasonality Coverage',
        sc>=12?36:sc>=6?24:sc>=3?12:6,
        36,'Cash / Lean Month Expense',sc.toFixed(1)+' mo');
    const invD = calc.inventoryDays;
    add('Cash Flow','Inventory Days',
        invD<=30?30:invD<=60?20:invD<=90?10:5,
        30,'Avg Inventory / (COGS/365)',Math.round(invD)+' days');
    const recD = calc.receivableDays;
    add('Cash Flow','Receivable Days',
        recD<=30?40:recD<=45?30:recD<=60?20:10,
        40,'AR / (Sales/365)',Math.round(recD)+' days');

    // 2. Milk Supply (160 pts)
    const milkStab = calc.milkStability;
    add('Milk Supply','Milk Stability',
        milkStab>=90?24:milkStab>=75?18:milkStab>=60?12:6,
        24,'Low Month / Avg Monthly',milkStab.toFixed(1)+'%');
    const dayPct = calc.collectionDayPct;
    add('Milk Supply','Collection Days',
        dayPct>=95?20:dayPct>=85?15:dayPct>=75?10:5,
        20,'Days / 365',dayPct.toFixed(1)+'%');
    const mLoss = calc.milkLossRate;
    add('Milk Supply','Milk Loss Rate',
        mLoss<=2?20:mLoss<=5?15:mLoss<=10?10:5,
        20,'Milk Loss / Total Collected',mLoss.toFixed(2)+'%');
    const yLoss = calc.yieldLossRate;
    add('Milk Supply','Processing Yield Loss',
        yLoss<=2?15:yLoss<=5?10:yLoss<=8?5:2,
        15,'Processing Loss / Total',yLoss.toFixed(2)+'%');
    const fConc = calc.farmerConcentration;
    add('Milk Supply','Farmer Concentration',
        fConc<=20?15:fConc<=35?10:fConc<=50?5:2,
        15,'Top 5 Farmers Share',fConc.toFixed(1)+'%');
    const vk = safeNum(data.vehicle_avail_pct);
    const coldChain = data.storage_cold_facility === 'Yes';
    const logiScore = (vk>=80?7.5:vk>=50?4:0)+(coldChain?7.5:0);
    add('Milk Supply','Logistics & Cold Chain',
        logiScore,15,'Vehicle Avail. + Cold Chain',
        logiScore===15?'Full Coverage':logiScore>0?'Partial':'None');
    const milkVol = data.total_milk_collected;
    const milkVolScore = milkVol>=5000000?51:milkVol>=2000000?38:milkVol>=500000?25:10;
    add('Milk Supply','Milk Volume (Annual)',
        milkVolScore,51,'Total Annual Litres',fmtNum(Math.round(milkVol))+' L');

    // 3. Financial Strength (150 pts)
    const nw = data.total_net_worth;
    add('Financial Strength','Net Worth',
        nw>=20000000?35:nw>=10000000?25:nw>=5000000?15:8,
        35,'Total Equity (NPR)',fmtNPR(nw));
    const de = calc.debtEquityRatio;
    add('Financial Strength','Debt / Equity Ratio',
        de<=0.5?32:de<=1.0?24:de<=1.5?16:8,
        32,'Total Liabilities / Net Worth',de.toFixed(2)+'x');
    const cr = calc.currentRatio;
    add('Financial Strength','Current Ratio',
        cr>=2.0?30:cr>=1.5?22:cr>=1.0?15:7,
        30,'Current Assets / Current Liab.',cr.toFixed(2)+'x');
    const gd = calc.grantDependencyPct;
    add('Financial Strength','Grant Dependency',
        gd<=5?20:gd<=15?15:gd<=25?10:5,
        20,'Grant Income / Total Revenue',gd.toFixed(1)+'%');
    const cashImproving = data.cash_last_year > data.cash_prev_year;
    const cashFlat      = data.cash_last_year === data.cash_prev_year;
    add('Financial Strength','Cash Trend (YoY)',
        cashImproving?25:cashFlat?18:8,
        25,'Last Year vs. Previous Year',
        cashImproving?'Improving ↑':cashFlat?'Stable →':'Declining ↓');
    const auditObs = data.audit_observations;
    add('Financial Strength','Audit Observations',
        auditObs===0?8:auditObs<=3?6:auditObs<=6?3:1,
        8,'Number of Issues',auditObs+' issues');

    // 4. Buyer Quality (45 pts)
    const bSales = calc.bankSalesPct;
    add('Buyer Quality','Bank Sales %',
        bSales>=80?25:bSales>=50?18:bSales>=30?12:6,
        25,'Sales via Bank / Total Sales',bSales.toFixed(1)+'%');
    const top5Pct = data.top5_buyer_pct;
    add('Buyer Quality','Top 5 Buyer Concentration',
        top5Pct<=30?20:top5Pct<=50?14:8,
        20,'Top 5 Buyers / Total Sales',top5Pct.toFixed(1)+'%');

    // 5. Loan Recovery (100 pts)
    const gnpa = calc.gNPA;
    add('Loan Recovery','Member GNPA %',
        gnpa<=2?45:gnpa<=5?35:gnpa<=10?25:10,
        45,'NPA Loans / Total Member Loans',gnpa.toFixed(1)+'%');
    const dpd = data.max_dpd_members;
    add('Loan Recovery','Max DPD (Members)',
        dpd<=30?35:dpd<=60?25:15,
        35,'Days Past Due',dpd+' days');
    const rsMap = {'None':20,'Few Times':12,'Frequently':5};
    add('Loan Recovery','Loan Restructuring History',
        rsMap[data.restructured_loans_3yr]||5,
        20,'Past 3 Years',data.restructured_loans_3yr||'N/A');

    // 6. Security (40 pts)
    const priColl = calc.primaryCollateralCoverage;
    add('Security','Primary Collateral Coverage',
        clamp(Math.round(priColl*40),0,40),
        40,'Land Value / Proposed Loan',priColl.toFixed(2)+'x');

    // 7. Governance (80 pts)
    const mExp = data.mgmt_experience;
    add('Governance','Management Experience',
        mExp>=10?20:mExp>=5?12:6,
        20,'Years in Role',mExp+' yrs');
    const ic = data.internal_control_score;
    add('Governance','Internal Controls',
        ic>=80?20:ic>=60?14:ic>=40?8:4,
        20,'Control Score (0–100)',ic);
    const ao = data.audit_observations;
    add('Governance','Audit Findings',
        ao===0?20:ao<=3?14:ao<=6?8:4,
        20,'Number of Observations',ao+' obs.');
    add('Governance','Loan Policy Compliance',
        data.loan_policy_compliance==='Yes'?20:0,
        20,'Policy Adherence',data.loan_policy_compliance||'N/A');

    // 8. External Risk (55 pts)
    add('External Risk','Insurance Coverage',
        data.insurance_available==='Yes'?15:0,
        15,'Insurance Available',data.insurance_available||'N/A');
    const regScore = data.regulatory_compliance==='Yes'?20
        :data.regulatory_compliance==='Partial'?10:0;
    add('External Risk','Regulatory Compliance',
        regScore,20,'Compliance Level',data.regulatory_compliance||'N/A');
    const cr2 = safeNum(data.climatic_risk_score);
    add('External Risk','Climatic Risk',
        cr2<=3?20:cr2<=6?12:5,
        20,'Risk Score (1=Low, 10=High)',cr2+'/10');

    // 9. Credit History (40 pts)
    const isNewCust = (data.customer_type==='new');
    const bfiMap = {'Pass':20,'Watch List':14,'Substandard':8,'Doubtful':4,'Loss':0};
    let creditScore = bfiMap[data.credit_history_bfi]!==undefined?bfiMap[data.credit_history_bfi]:5;
    if (isNewCust) creditScore = 20;
    add('Credit History','BFI Credit Classification',
        creditScore,20,
        isNewCust?'New Customer (Full Points)':'BFI Loan Record',
        isNewCust?'N/A (New Customer)':data.credit_history_bfi||'N/A');
    let dpdScoreBfi = data.max_dpd_bfi<=0?20:data.max_dpd_bfi<=5?16:data.max_dpd_bfi<=15?10:4;
    if (isNewCust) dpdScoreBfi = 20;
    add('Credit History','Max DPD (BFI Loan)',
        dpdScoreBfi,20,
        isNewCust?'New Customer (Full Points)':'Days Past Due (BFI)',
        isNewCust?'N/A (New Customer)':data.max_dpd_bfi+' days');

    // 10. Infrastructure (25 pts)
    const misMap = {'Yes':15,'Partial':8,'No':0};
    add('Infrastructure','Digital MIS / POS',
        misMap[data.digital_mis_pos]!==undefined?misMap[data.digital_mis_pos]:0,
        15,'MIS/POS Adoption',data.digital_mis_pos||'N/A');
    const sop = data.quality_sop_score;
    add('Infrastructure','Quality SOP Score',
        sop>=80?10:sop>=60?6:sop>=40?3:0,
        10,'SOP/Quality Score (0–100)',sop+'/100');

    // 11. Behavioral (75 pts)
    const meetMap = {'Weekly':10,'Bi-Weekly':8,'Monthly':6,'Rarely':2};
    add('Behavioral','Committee Meetings',
        meetMap[data.meeting_frequency]||2,
        10,'Meeting Frequency',data.meeting_frequency||'N/A');
    const commMap = {'Significant':10,'Moderate':6,'Minimal':2};
    add('Behavioral','Community Support',
        commMap[data.community_support_level]||2,
        10,'Community Engagement Level',data.community_support_level||'N/A');
    const emgMap = {'Proper Plan':10,'Ad-hoc':5,'No Plan':0};
    add('Behavioral','Emergency Preparedness',
        emgMap[data.emergency_response]||0,
        10,'Emergency Response Plan',data.emergency_response||'N/A');
    const yrs = data.years_operation;
    add('Behavioral','Years in Operation',
        yrs>=10?20:yrs>=5?14:yrs>=2?8:3,
        20,'Operational Tenure',yrs+' yrs');
    const auditFreqMap = {'Regularly':25,'Occasionally':15,'Never':0};
    add('Behavioral','Financial Audit Frequency',
        auditFreqMap[data.income_expense_checked]!==undefined?auditFreqMap[data.income_expense_checked]:0,
        25,'Audit Regularity',data.income_expense_checked||'N/A');

    // Assemble — exclude 'Security' from displayed categories
    // Collateral score still contributes to totalScore but not shown as a category card
    const HIDDEN_CATEGORIES = new Set(['Security']);
    const categories = Object.entries(catMap)
        .filter(([name]) => !HIDDEN_CATEGORIES.has(name))
        .map(([name, d]) => ({
        name,
        score: Math.round(d.score),
        max: d.max,
        logs: indicators.filter(i => i.cat === name)
    }));

    const rawTotal   = indicators.reduce((s, i) => s + i.score, 0);
    const rawMax     = indicators.reduce((s, i) => s + i.max, 0);
    const totalScore = Math.min(Math.round(rawTotal), 1000);

    const strengths  = [];
    const weaknesses = [];
    const focus      = [];

    indicators.forEach(ind => {
        const p = ind.max > 0 ? (ind.score / ind.max) * 100 : 0;
        if (p >= 85) strengths.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p <= 35 && ind.max > 0) weaknesses.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p > 35 && p < 65) focus.push(`${ind.name}: ${ind.value} — room for improvement`);
    });

    let riskCategory, recommendation;
    if (totalScore >= 850) {
        riskCategory   = 'A Risk';
        recommendation = 'Exceptional financial health, stable milk operations, and strong governance. Full approval on standard terms recommended.';
    } else if (totalScore >= 700) {
        riskCategory   = 'B Risk';
        recommendation = 'Solid performance with manageable weaknesses. Approval with standard monitoring and normal collateral terms recommended.';
    } else if (totalScore >= 500) {
        riskCategory   = 'C Risk';
        recommendation = 'Elevated risk in key areas. Conditional approval may proceed with enhanced monitoring, additional collateral, or a reduced loan amount.';
    } else {
        riskCategory   = 'D Risk';
        recommendation = 'Significant structural weaknesses identified. Decline or defer until key financial and operational metrics improve.';
    }

    return {
        totalScore, rawTotal: Math.round(rawTotal), rawMax,
        riskCategory, recommendation,
        categories,
        logs: indicators.map(i => ({
            name: i.name, category: i.cat, value: i.value,
            score: Math.round(i.score), max: i.max, formula: i.formula
        })),
        strengths:  strengths.slice(0, 8),
        weaknesses: weaknesses.slice(0, 8),
        focus:      focus.slice(0, 6),
        // Expose metrics for approver panel
        metrics: {
            dscr:             calc.dscr_raw,
            current_ratio:    calc.current_ratio,
            debt_equity:      calc.debt_equity,
            gnpa_pct:         calc.gnpa_pct,
            milk_loss_pct:    calc.milk_loss_pct,
            collateral_cover: calc.collateral_cover
        },
        data: {
            total_revenue:      data.total_revenue,
            total_assets:       data.total_assets,
            total_liabilities:  data.total_liabilities,
            net_worth:          data.total_net_worth
        }
    };
}

// ── Pipeline Orchestrator ─────────────────────────────────────────────────────

/**
 * Re-run the full scoring engine from saved answers JSON.
 * Called by the admin panel when opening a submission.
 * @param {Object} answers - The parsed answers object from the sheet
 * @returns {Object} - Full result with categories, strengths, weaknesses, metrics
 */
function runScoringEngine(answers) {
    const data    = transformData(answers);
    const metrics = runCalculations(data);
    return runModel(metrics, data);
}
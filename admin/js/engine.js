/**
 * admin/js/engine.js
 * Self-contained scoring engine bundle for the Admin Panel.
 *
 * UPDATED: Dual-read fallbacks for every renamed field so answers saved
 * with either old IDs (e.g. existing_loan) or new IDs (existing_loan_amt)
 * both work correctly.
 *
 * Model updated to match Credit-Scoring.xlsx (11 categories, 1000 pts):
 *   1. Cash Flow & Loan Repayment         180 pts
 *   2. Milk Supply & Operational Stability 150 pts
 *   3. Financial Strength & Liquidity     180 pts
 *   4. Financial Transparency              50 pts
 *   5. Loan Recovery & Member Credit Risk 100 pts
 *   6. Management & Governance Quality    100 pts
 *   7. Operational Quality                 40 pts
 *   8. External & Regulatory Risk          40 pts
 *   9. Credit History / Banking            40 pts
 *  10. Buyer Concentration & Market Risk   80 pts
 *  11. Behavioural & Due Diligence Risk    40 pts
 *  ─────────────────────────────────────  ────────
 *  TOTAL                                 1000 pts
 *
 * Removed: Security / Collateral (primary_land_value deleted from questionnaire)
 * Removed: Milk Volume (Annual), Years in Operation, Financial Audit Frequency
 *          (replaced by Behavioural sub-indicators)
 *
 * Exposes: runScoringEngine(formInputs) → result
 */

// ── Utilities ─────────────────────────────────────────────────────────────────

function safeNum(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}
function safeDivide(a, b) { return b !== 0 ? a / b : 0; }
function pct(part, total) { return total > 0 ? (part / total) * 100 : 0; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fmtNum(n)         { return Number(n).toLocaleString('en-IN'); }
function fmtNPR(val) {
    const n = Number(val);
    if (!val || isNaN(n) || n === 0) return '—';
    if (n >= 1e7) return 'NPR ' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return 'NPR ' + (n / 1e5).toFixed(2) + ' L';
    return 'NPR ' + n.toLocaleString('en-IN');
}

// ── Step 1: Data Transform ────────────────────────────────────────────────────
// Dual-read: new field ID first, old field ID as fallback.

function transformData(rawInputs) {
    const inp = rawInputs;

    // Helper: read a number — tries newId first, falls back to oldId
    function n2(newId, oldId) {
        const v = safeNum(inp[newId]);
        return v !== 0 ? v : safeNum(inp[oldId] || 0);
    }
    // Helper: read a string — tries newId first, falls back to oldId
    function s2(newId, oldId) {
        const v = String(inp[newId] || '').trim();
        return v || String(inp[oldId] || '').trim();
    }
    const n = id => safeNum(inp[id]);
    const s = id => String(inp[id] || '').trim();

    // ── Identity ──────────────────────────────────────────────────────────────
    const coop_name       = s('coop_name');
    const model_type      = s('model_type');
    const is_existing     = s2('is_existing', 'loan_type');
    const years_operation = n('years_operation');
    const customer_type   = s('customer_type') || (is_existing === 'Existing Loan' ? 'existing' : 'new');

    // ── Loan ──────────────────────────────────────────────────────────────────
    const existing_loan_amt  = n2('existing_loan_amt',  'existing_loan');
    const proposed_loan_amt  = n2('proposed_loan_amt',  'proposed_loan');
    const total_loan         = existing_loan_amt + proposed_loan_amt;
    const interest_rate      = n('interest_rate');
    const loan_tenure_months = n2('loan_tenure_months', 'loan_tenure');
    const repayment_frequency= s2('repayment_frequency','installment_freq');

    // ── Revenue ───────────────────────────────────────────────────────────────
    const milk_sales    = n('milk_sales');
    const product_sales = n2('product_sales', 'other_product_sales');
    const other_sales   = n2('other_sales',   'other_income');
    const grant_income  = n('grant_income');
    const total_sales   = milk_sales + product_sales + other_sales;
    const total_revenue = total_sales + grant_income;
    const bank_sales    = n('bank_sales');

    // ── Buyer Analysis ────────────────────────────────────────────────────────
    const total_number_of_buyers    = n2('total_number_of_buyers',   'total_buyers');
    const top5_buyers_sales         = n('top5_buyers_sales');
    const largest_buyer_sales       = n('largest_buyer_sales');
    const gov_buyer_sales           = n('gov_buyer_sales');
    const no_govt_buyers            = n('no_govt_buyers');
    const large_private_buyer_sales = n('large_private_buyer_sales');
    const no_private_sector_buyer   = n('no_private_sector_buyer');
    const small_buyer_sales         = n('small_buyer_sales');
    const no_small_buyer_sales      = n('no_small_buyer_sales');
    const avg_payment_days_buyers   = n2('avg_payment_days_buyers',  'avg_collection_days');
    const contract_coverage         = n('contract_coverage');

    const top5_buyer_share_percent    = total_sales > 0 ? (top5_buyers_sales    / total_sales) * 100 : 0;
    const largest_buyer_share_percent = total_sales > 0 ? (largest_buyer_sales  / total_sales) * 100 : 0;

    // Buyer concentration fractions for model
    const top5_buyer_conc_pct    = top5_buyer_share_percent;
    const largest_buyer_conc_pct = largest_buyer_share_percent;
    const stable_buyer_share_pct = total_number_of_buyers > 0
        ? ((no_govt_buyers + no_private_sector_buyer) / total_number_of_buyers) * 100 : 0;
    const contract_score_frac = total_number_of_buyers > 0
        ? contract_coverage / total_number_of_buyers : 0;
    const payment_score_frac = Math.max(0, 1 - (avg_payment_days_buyers / 90));

    // ── Operating Costs ───────────────────────────────────────────────────────
    const raw_milk_purchase_cost  = n2('raw_milk_purchase_cost',  'raw_milk_cost');
    const processing_cost         = n('processing_cost');
    const packaging_cost          = n('packaging_cost');
    const transport_cost          = n('transport_cost');
    const other_processing_cost   = n('other_processing_cost');
    const salary_expense          = n('salary_expense');
    const admin_expense           = n('admin_expense');
    const electricity_expense     = n('electricity_expense');
    const fuel_expense            = n('fuel_expense');
    const maintenance_expense     = n2('maintenance_expense',    'repair_expense');
    const rent_expense            = n('rent_expense');
    const other_operating_expense = n2('other_operating_expense','other_opex');
    const depreciation            = n2('depreciation',           'annual_depreciation');
    const amortization            = n2('amortization',           'amortization_amount');

    // total_opex = overhead only (sheet SN44 = salary+admin+elec+fuel+maint+rent+other)
    const total_opex = salary_expense + admin_expense + electricity_expense +
                       fuel_expense + maintenance_expense + rent_expense +
                       other_operating_expense;

    // COGS = processing costs (sheet Data!D19 = processing+packaging+transport+other_proc)
    const cogs = processing_cost + packaging_cost + transport_cost + other_processing_cost;

    // Lean month expense = total_opex / 12
    const lean_month_expense = total_opex / 12;

    // EBITDA = total_revenue - COGS - total_opex (sheet: D18-SUM(D34:D37)-D45, no depr/amort)
    const ebitda = total_revenue - cogs - total_opex;

    // ── Assets ────────────────────────────────────────────────────────────────
    const cash_on_hand         = n2('cash_on_hand',   'cash_hand');
    const bank_balance         = n('bank_balance');
    const total_cash           = cash_on_hand + bank_balance;
    const accounts_receivable  = n('accounts_receivable');
    const inventory            = n2('inventory',      'inventory_value');
    const prepaid_expense      = n2('prepaid_expense','prepaid_expenses');
    const other_current_assets = n('other_current_assets');
    const current_assets       = total_cash + accounts_receivable + inventory +
                                 prepaid_expense + other_current_assets;

    const land_value            = n('land_value');
    const building_value        = n('building_value');
    const plant_machinery_value = n2('plant_machinery_value','machinery_value');
    const vehicle_value         = n('vehicle_value');
    const furniture_value       = n('furniture_value');
    const other_fixed_assets    = n('other_fixed_assets');
    const non_current_assets    = land_value + building_value + plant_machinery_value +
                                  vehicle_value + furniture_value + other_fixed_assets;
    const total_assets          = current_assets + non_current_assets;

    // Average inventory for calculations
    const average_inventory = n2('average_inventory','avg_inventory_value') || inventory;

    // ── Liabilities ───────────────────────────────────────────────────────────
    const accounts_payable               = n('accounts_payable');
    const short_term_loan                = n('short_term_loan');
    const accrued_expense                = n2('accrued_expense',    'accrued_expenses');
    const current_portion_long_term_debt = n2('current_portion_long_term_debt','current_ltd');
    const long_term_loan                 = n('long_term_loan');
    const other_long_term_liabilities    = n2('other_long_term_liabilities','other_ltl');
    const current_liabilities  = accounts_payable + short_term_loan + accrued_expense + current_portion_long_term_debt;
    const non_current_liabilities = long_term_loan + other_long_term_liabilities;
    const total_liabilities    = current_liabilities + non_current_liabilities;
    const total_debt           = short_term_loan + current_portion_long_term_debt +
                                 long_term_loan + other_long_term_liabilities;

    // ── Net Worth ─────────────────────────────────────────────────────────────
    const paid_up_capital   = n('paid_up_capital');
    const retained_earnings = n('retained_earnings');
    const reserves          = n2('reserves','reserve_fund');
    const total_networth    = paid_up_capital + retained_earnings + reserves;

    // ── Milk ──────────────────────────────────────────────────────────────────
    const total_milk_collected_liters        = n2('total_milk_collected_liters',       'total_milk_collected');
    const milk_loss_liters_during_collection = n2('milk_loss_liters_during_collection','milk_loss');
    const loss_during_process                = n2('loss_during_process',               'processing_loss');

    // Total milk loss = collection loss + process loss (sheet Data!D24 = D79+D80)
    const total_milk_loss = milk_loss_liters_during_collection + loss_during_process;

    // Produced milk = total - collection loss only (sheet Data!D25 = D78-D79)
    const produced_milk_model_b_liters = Math.max(0,
        total_milk_collected_liters - milk_loss_liters_during_collection);

    // avg_monthly_milk = total / 12 (always auto-calc, sheet =E81/12)
    const avg_monthly_milk_liters = total_milk_collected_liters / 12;

    const lowest_monthly_milk_liters= n2('lowest_monthly_milk_liters','lowest_monthly_milk');
    const collection_days_positive  = n2('collection_days_positive',  'collection_days');
    const total_number_of_farmers   = n2('total_number_of_farmers',   'total_farmers');
    const top5_farmer_collection_liters = n2('top5_farmer_collection_liters','top5_farmers_milk');

    // Collection Days Category (sheet Data!D36: IF(days>325,"High",IF(>300,"Medium","Low")))
    const collection_days_category = collection_days_positive > 325 ? 'High'
        : collection_days_positive > 300 ? 'Medium' : 'Low';

    // ── Loan Recovery ─────────────────────────────────────────────────────────
    const total_member_loans          = n('total_member_loans');
    const npa_member_loans            = n('npa_member_loans');
    const max_dpd_days                = n2('max_dpd_days',         'max_dpd_members');
    const restructured_loans_past3yrs = s2('restructured_loans_past3yrs','restructured_loans_3yr');

    // ── Financial Performance ─────────────────────────────────────────────────
    const cash_bank_balance_last_year     = n2('cash_bank_balance_last_year',    'cash_last_year');
    const cash_bank_balance_previous_year = n2('cash_bank_balance_previous_year','cash_prev_year');
    const cash_trend = cash_bank_balance_last_year > cash_bank_balance_previous_year ? 'UP'
        : cash_bank_balance_last_year < cash_bank_balance_previous_year ? 'DOWN' : 'STABLE';

    // ── Governance ────────────────────────────────────────────────────────────
    const key_mgmt_avg_experience_years = n2('key_mgmt_avg_experience_years','mgmt_experience');
    // internal_control_score: new=string ('Robust'/'Adequate'/'Weak'), old=number
    const internal_control_score_raw   = inp['internal_control_score'];
    const internal_control_str = String(internal_control_score_raw || '').trim();
    // audit_findings_count: new=string dropdown ('0','1','3','6'), old=number
    const audit_findings_raw   = inp['audit_findings_count'] || inp['audit_observations'];
    const audit_findings_str   = String(audit_findings_raw || '').trim();
    const lending_policy_compliance_flag = s2('lending_policy_compliance_flag','loan_policy_compliance');
    const fleet_availability_percent     = s2('fleet_availability_percent',    'vehicle_avail_pct');

    // ── Logistics ─────────────────────────────────────────────────────────────
    const storage_availability_flag  = s2('storage_availability_flag', 'storage_cold_facility');
    const quality_sop_score_model_b  = s2('quality_sop_score_model_b', 'quality_sop_score');
    const insurance_coverage_flag    = s2('insurance_coverage_flag',   'insurance_available');
    const digital_mis_flag           = s2('digital_mis_flag',          'digital_mis_pos');
    const regulatory_compliance_flag = s2('regulatory_compliance_flag','regulatory_compliance');
    // climatic_risk_score: new=string ('Low'/'Medium'/'High'), old=number (2/5/8)
    const climatic_risk_raw = inp['climatic_risk_score'];
    const climatic_risk_str = String(climatic_risk_raw || '').trim();

    // Pass raw dropdown string — runModel() uses .includes() string matching.
    // Never convert to numeric; that turns the string into 9/6/1.5 which breaks matching.
    const quality_sop_numeric = quality_sop_score_model_b;

    // ── Credit History ────────────────────────────────────────────────────────
    const credit_history_banks = s2('credit_history_banks','credit_history_bfi');
    const dpd_days_banks       = n2('dpd_days_banks',       'max_dpd_bfi');

    // ── Behavioral ────────────────────────────────────────────────────────────
    const meeting_frequency        = s('meeting_frequency');
    const member_info_transparency = s('member_info_transparency');
    const fund_usage               = s('fund_usage');
    const kyc_aml                  = s('kyc_aml');
    const income_expense_checked   = s('income_expense_checked');
    const right_to_information     = s('right_to_information');
    const community_support_level  = s('community_support_level');
    const emergency_response       = s('emergency_response');

    // Loan repayment (sheet: Principal=current_portion_ltd, Interest=rate*tenure)
    const annual_principal = current_portion_long_term_debt;
    const annual_interest  = interest_rate * loan_tenure_months;

    return {
        coop_name, model_type, is_existing, customer_type, years_operation,
        existing_loan_amt, proposed_loan_amt, total_loan,
        interest_rate, loan_tenure_months, repayment_frequency,
        annual_principal, annual_interest, ebitda,
        milk_sales, product_sales, other_sales, total_sales,
        grant_income, total_revenue, bank_sales,
        total_number_of_buyers, top5_buyers_sales, largest_buyer_sales,
        gov_buyer_sales, no_govt_buyers, large_private_buyer_sales, no_private_sector_buyer,
        small_buyer_sales, no_small_buyer_sales, avg_payment_days_buyers, contract_coverage,
        top5_buyer_share_percent, largest_buyer_share_percent,
        top5_buyer_conc_pct, largest_buyer_conc_pct,
        stable_buyer_share_pct, contract_score_frac, payment_score_frac,
        raw_milk_purchase_cost, processing_cost, packaging_cost, transport_cost,
        other_processing_cost, salary_expense, admin_expense, electricity_expense,
        fuel_expense, maintenance_expense, rent_expense, other_operating_expense,
        total_opex, cogs, lean_month_expense, depreciation, amortization, ebitda,
        cash_on_hand, bank_balance, total_cash,
        accounts_receivable, inventory, prepaid_expense, other_current_assets,
        current_assets, average_inventory,
        land_value, building_value, plant_machinery_value, vehicle_value,
        furniture_value, other_fixed_assets, non_current_assets, total_assets,
        accounts_payable, short_term_loan, accrued_expense, current_portion_long_term_debt,
        current_liabilities,
        long_term_loan, other_long_term_liabilities, non_current_liabilities,
        total_liabilities, total_debt,
        paid_up_capital, retained_earnings, reserves, total_networth,
        total_milk_collected_liters, milk_loss_liters_during_collection, loss_during_process,
        total_milk_loss, produced_milk_model_b_liters,
        avg_monthly_milk_liters, lowest_monthly_milk_liters, collection_days_positive,
        collection_days_category,
        total_number_of_farmers, top5_farmer_collection_liters,
        total_member_loans, npa_member_loans, max_dpd_days, restructured_loans_past3yrs,
        cash_bank_balance_last_year, cash_bank_balance_previous_year, cash_trend,
        key_mgmt_avg_experience_years, internal_control_str, audit_findings_str,
        lending_policy_compliance_flag, fleet_availability_percent,
        storage_availability_flag, quality_sop_numeric,
        insurance_coverage_flag, digital_mis_flag,
        regulatory_compliance_flag, climatic_risk_str,
        credit_history_banks, dpd_days_banks,
        meeting_frequency, member_info_transparency, fund_usage,
        kyc_aml, income_expense_checked, right_to_information,
        community_support_level, emergency_response
    };
}

// ── Step 2: Calculations ──────────────────────────────────────────────────────

function runCalculations(data) {
    // DSCR
    const debtService = data.annual_principal + data.annual_interest;
    const dscr = debtService > 0
        ? safeDivide(data.ebitda, debtService)
        : (data.ebitda > 0 ? 2.5 : 0);

    // Seasonality Coverage — last year cash / lean month expense
    const seasonality_coverage = data.lean_month_expense > 0
        ? safeDivide(data.cash_bank_balance_last_year, data.lean_month_expense) : 0;

    // Inventory Days (sheet C4: avg_inventory / COGS × 365; COGS = proc+pkg+transport+other_proc)
    const inventory_days = data.cogs > 0
        ? (data.average_inventory / data.cogs) * 365 : 0;

    // Receivable Days
    const receivable_days = data.total_revenue > 0
        ? (data.accounts_receivable / data.total_revenue) * 365 : 0;

    // Milk Supply
    const milk_stability_pct = data.avg_monthly_milk_liters > 0
        ? (data.lowest_monthly_milk_liters / data.avg_monthly_milk_liters) * 100 : 0;
    const days_stability_pct = (data.collection_days_positive / 365) * 100;

    // Milk Loss % (sheet C8: total_milk_loss / total_collected; total_milk_loss = coll+proc loss)
    const milk_loss_pct = data.total_milk_collected_liters > 0
        ? (data.total_milk_loss / data.total_milk_collected_liters) * 100 : 0;

    // Yield Loss % (sheet C9: total_milk_loss / produced_milk)
    const yield_loss_pct = data.produced_milk_model_b_liters > 0
        ? (data.total_milk_loss / data.produced_milk_model_b_liters) * 100 : 0;

    const farmer_concentration_pct = data.total_milk_collected_liters > 0
        ? (data.top5_farmer_collection_liters / data.total_milk_collected_liters) * 100 : 0;
    const collection_stability = data.total_member_loans > 0
        ? safeDivide(data.total_milk_collected_liters, data.total_member_loans) : 0;
    const payment_fairness = Math.max(0, 1 - (data.max_dpd_days / 30));

    // Logistics Reliability (sheet C13: fleet_availability_percent, not storage)
    const logistics_reliability = data.fleet_availability_percent || data.storage_availability_flag;

    // Financial
    const net_worth = data.total_assets - data.total_liabilities;
    const debt_equity = data.total_networth > 0
        ? safeDivide(data.total_debt, data.total_networth)
        : (data.total_debt > 0 ? 5.0 : 0);
    const current_ratio = data.current_liabilities > 0
        ? safeDivide(data.current_assets, data.current_liabilities)
        : (data.current_assets > 0 ? 5.0 : 0);
    const grant_pct = data.total_revenue > 0
        ? safeDivide(data.grant_income, data.total_revenue) : 0;

    // Bank sales % (sheet C27: bank_sales / total_revenue, not total_sales)
    const bank_sales_pct = data.total_revenue > 0
        ? (data.bank_sales / data.total_revenue) * 100 : 0;

    // GNPA (fraction)
    const member_gnpa_pct = data.total_member_loans > 0
        ? safeDivide(data.npa_member_loans, data.total_member_loans) : 0;

    return {
        dscr, seasonality_coverage, inventory_days, receivable_days,
        milk_stability_pct, days_stability_pct, milk_loss_pct, yield_loss_pct,
        farmer_concentration_pct, collection_stability, payment_fairness,
        logistics_reliability,
        net_worth, debt_equity, current_ratio, grant_pct,
        bank_sales_pct, member_gnpa_pct,
        // approver panel metrics
        current_ratio_raw: current_ratio,
        debt_equity_raw:   debt_equity,
        gnpa_pct_raw:      member_gnpa_pct * 100,
        milk_loss_pct_raw: milk_loss_pct,
        bank_sales_pct_raw: bank_sales_pct,
        seasonality_raw:   seasonality_coverage
    };
}

// ── Step 3: Model ─────────────────────────────────────────────────────────────

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

    // ── 1. Cash Flow & Loan Repayment (180 pts) ───────────────────────────────
    const CAT1 = 'Cash Flow & Loan Repayment';
    const dscr = calc.dscr;
    add(CAT1, 'DSCR',
        dscr >= 1.5 ? 60 : dscr >= 1.25 ? 48 : dscr >= 1 ? 36 : dscr >= 0.8 ? 20 : 0,
        60, 'EBITDA / (Annual Principal + Interest)', dscr.toFixed(2) + 'x');
    const sc = calc.seasonality_coverage;
    add(CAT1, 'Seasonality Coverage',
        sc >= 20 ? 50 : sc >= 15 ? 40 : sc >= 10 ? 30 : sc >= 5 ? 20 : 0,
        50, 'Last Year Cash / Lean Month Expense', sc.toFixed(1) + ' months');
    const invD = calc.inventory_days;
    add(CAT1, 'Inventory Days',
        invD >= 180 ? 0 : invD >= 120 ? 10 : invD >= 90 ? 18 : invD >= 60 ? 24 : 30,
        30, '(Avg Inventory / COGS) × 365', Math.round(invD) + ' days');
    // Receivable Days: lower = better (faster buyer payment)
    // Sheet: IF(>=90,0, IF(>=60,12, IF(>=45,24, IF(>=30,32, 40))))
    const recD = calc.receivable_days;
    add(CAT1, 'Receivable Days',
        recD >= 90 ? 0 : recD >= 60 ? 12 : recD >= 45 ? 24 : recD >= 30 ? 15 : 40,
        40, '(Accounts Receivable / Total Revenue) × 365', Math.round(recD) + ' days');

    // ── 2. Milk Supply & Operational Stability (150 pts) ──────────────────────
    const CAT2 = 'Milk Supply & Operational Stability';
    const milkStab = calc.milk_stability_pct;
    add(CAT2, 'Milk Stability %',
        milkStab >= 90 ? 30 : milkStab >= 80 ? 24 : milkStab >= 70 ? 18 : milkStab >= 60 ? 10 : 0,
        30, '(Lowest Monthly / Avg Monthly) × 100', milkStab.toFixed(1) + '%');
    const dayStab = calc.days_stability_pct;
    add(CAT2, 'Days Stability %',
        dayStab >= 95 ? 20 : dayStab >= 85 ? 15 : dayStab >= 75 ? 10 : dayStab >= 65 ? 5 : 0,
        20, '(Collection Days / 365) × 100', dayStab.toFixed(1) + '%');
    const mLoss = calc.milk_loss_pct;
    add(CAT2, 'Milk Loss %',
        mLoss <= 2 ? 20 : mLoss <= 5 ? 16 : mLoss <= 8 ? 10 : mLoss <= 12 ? 5 : 0,
        20, '(Total Milk Loss / Total Collected) × 100', mLoss.toFixed(2) + '%');
    const yLoss = calc.yield_loss_pct;
    add(CAT2, 'Yield Loss %',
        yLoss <= 2 ? 20 : yLoss <= 5 ? 15 : yLoss <= 8 ? 10 : yLoss <= 12 ? 5 : 0,
        20, '(Total Milk Loss / Produced Milk) × 100', yLoss.toFixed(2) + '%');
    const fConc = calc.farmer_concentration_pct;
    add(CAT2, 'Farmer Concentration %',
        fConc <= 20 ? 15 : fConc <= 35 ? 12 : fConc <= 50 ? 8 : fConc <= 70 ? 4 : 0,
        15, '(Top 5 Farmer Collection / Total Milk) × 100', fConc.toFixed(1) + '%');
    const colStab = calc.collection_stability;
    add(CAT2, 'Collection Stability',
        colStab >= 0.15 ? 15 : colStab >= 0.10 ? 12 : colStab >= 0.05 ? 8 : colStab >= 0.01 ? 4 : 0,
        15, 'Total Milk Collected / Total Member Loans', colStab.toFixed(4));
    const payFair = calc.payment_fairness;
    add(CAT2, 'Payment Fairness',
        payFair >= 0.85 ? 15 : payFair >= 0.70 ? 12 : payFair >= 0.55 ? 8 : payFair >= 0.40 ? 4 : 0,
        15, '1 − (Max DPD / 30)', (payFair * 100).toFixed(1) + '%');
    // Logistics: sheet C13 = Data!D38 = fleet_availability_percent
    add(CAT2, 'Logistics Reliability',
        calc.logistics_reliability === 'Yes' ? 15 : 0,
        15, 'Fleet / Vehicle Availability', calc.logistics_reliability || 'No');

    // ── 3. Financial Strength & Liquidity (180 pts) ───────────────────────────
    const CAT3 = 'Financial Strength & Liquidity';
    // Net Worth: sheet IF(nw > total_loan*2, 40, IF(nw > total_loan, 30, IF(nw>0, 15, 0)))
    const nw = calc.net_worth;
    add(CAT3, 'Net Worth',
        nw > data.total_loan * 2 ? 40 : nw > data.total_loan ? 30 : nw > 0 ? 15 : 0,
        40, 'Total Assets − Total Liabilities vs Total Loan', fmtNPR(nw));
    const de = calc.debt_equity;
    add(CAT3, 'Debt / Equity',
        de <= 0.5 ? 40 : de <= 1 ? 32 : de <= 2 ? 20 : de <= 3 ? 10 : 0,
        40, 'Total Debt / Net Worth', de.toFixed(2) + 'x');
    const cr = calc.current_ratio;
    add(CAT3, 'Current Ratio',
        cr >= 2 ? 40 : cr >= 1.5 ? 30 : cr >= 1 ? 20 : cr >= 0.5 ? 10 : 0,
        40, 'Current Assets / Current Liabilities', cr.toFixed(2) + 'x');
    const gPct = calc.grant_pct;
    add(CAT3, 'Grant % of Revenue',
        gPct <= 0.02 ? 30 : gPct <= 0.05 ? 15 : gPct <= 0.10 ? 10 : 0,
        30, 'Grant Income / Total Revenue', (gPct * 100).toFixed(1) + '%');
    add(CAT3, 'Cash / Bank Balance Trend',
        data.cash_trend === 'UP' ? 30 : data.cash_trend === 'STABLE' ? 15 : 0,
        30, 'Last Year vs Previous Year Balance', data.cash_trend || 'STABLE');

    // ── 4. Financial Transparency & Cash Discipline (50 pts) ──────────────────
    const CAT4 = 'Financial Transparency & Cash Discipline';
    const bPct = calc.bank_sales_pct;
    add(CAT4, '% Sales via Bank',
        bPct > 80 ? 25 : bPct > 50 ? 15 : 0,
        25, 'Bank Sales / Total Revenue × 100', bPct.toFixed(1) + '%');
    add(CAT4, 'Digital MIS / POS / QR',
        data.digital_mis_flag === 'Yes' ? 25 : 0,
        25, 'MIS/POS/QR Adoption', data.digital_mis_flag || 'No');

    // ── 5. Loan Recovery & Member Credit Risk (100 pts) ───────────────────────
    const CAT5 = 'Loan Recovery & Member Credit Risk';
    const gnpa = calc.member_gnpa_pct;
    add(CAT5, 'Member GNPA %',
        gnpa <= 0.05 ? 45 : gnpa <= 0.10 ? 35 : gnpa <= 0.15 ? 25 : gnpa <= 0.20 ? 15 : 0,
        45, 'NPA Member Loans / Total Member Loans', (gnpa * 100).toFixed(1) + '%');
    const dpd = data.max_dpd_days;
    add(CAT5, 'Max DPD (Members)',
        dpd <= 5 ? 35 : dpd <= 10 ? 25 : dpd <= 15 ? 15 : 0,
        35, 'Maximum Days Past Due (Member Loans)', dpd + ' days');
    const rst = data.restructured_loans_past3yrs;
    add(CAT5, 'Loan Restructuring History',
        rst === 'None' || rst === 'Never' ? 20 : rst === 'Few Times' ? 15 : 0,
        20, 'Restructured Loans (Past 3 Years)', rst || 'N/A');

    // ── 6. Management & Governance Quality (100 pts) ──────────────────────────
    const CAT6 = 'Management & Governance Quality';
    const mExp = data.key_mgmt_avg_experience_years;
    add(CAT6, 'Management Experience',
        mExp >= 10 ? 25 : mExp >= 7 ? 15 : mExp >= 5 ? 10 : 0,
        25, 'Avg Years in Management Role', mExp + ' yrs');
    // internal_control_score: new=string ('Robust'/'Adequate'/'Weak'), old=numeric
    const icStr = data.internal_control_str || data.internal_control_score || '';
    const icScore = String(icStr).includes('Robust') || icStr === '85' ? 25
        : String(icStr).includes('Adequate') || String(icStr).includes('Moderate') || icStr === '65' ? 10 : 0;
    add(CAT6, 'Internal Controls',
        icScore, 25, 'Internal Control Assessment', icStr || 'N/A');
    // audit_findings_count: new=string dropdown ('None'/'Few'/'Qualified'), old=numeric
    const afStr = data.audit_findings_str || data.audit_findings_count || '';
    const afScore = afStr === 'None' || afStr === '0' || afStr === 'none' ? 25
        : afStr === 'Few' || afStr === '1' || afStr === 'few' ? 15 : 0;
    add(CAT6, 'Audit Findings',
        afScore, 25, 'Number of Audit Observations', afStr || 'N/A');
    add(CAT6, 'Lending Policy Compliance',
        data.lending_policy_compliance_flag === 'Yes' ? 25 : 0,
        25, 'Loan Policy Adherence', data.lending_policy_compliance_flag || 'No');

    // ── 7. Operational Quality (40 pts) ───────────────────────────────────────
    const CAT7 = 'Operational Quality';
    // Quality SOP: sheet string match on full dropdown value
    const sopRaw = String(data.quality_sop_numeric || data.quality_sop_score_model_b || '');
    const sopScore = sopRaw.includes('Standards and documents exist') ? 40
        : sopRaw.includes('Standards exist, no documents') ? 30
        : sopRaw.includes('No standards') ? 20 : 0;
    add(CAT7, 'Quality SOP Compliance',
        sopScore, 40, 'Milk Collection / Handling Standards & Documentation', sopRaw || 'N/A');

    // ── 8. External & Regulatory Risk (40 pts) ────────────────────────────────
    const CAT8 = 'External & Regulatory Risk';
    add(CAT8, 'Insurance Coverage',
        data.insurance_coverage_flag === 'Yes' ? 10 : 0,
        10, 'Insurance Available', data.insurance_coverage_flag || 'No');
    // Regulatory: DropdownOptions values are "Full"/"Partial"/"None"
    const reg = data.regulatory_compliance_flag;
    add(CAT8, 'Regulatory Compliance',
        reg === 'Full' || reg === 'Yes' ? 15 : reg === 'Partial' ? 5 : 0,
        15, 'Darta, Tax, NRB Reporting Compliance', reg || 'No');
    // Climatic: handle string ('Low'/'Medium'/'High') and old numeric (2/5/8)
    const climRaw = data.climatic_risk_str || data.climatic_risk_score || '';
    const climScore = climRaw === 'Low'    || climRaw === '2' ? 15
        : climRaw === 'Medium' || climRaw === '5' ? 10 : 0;
    add(CAT8, 'Climatic / Input Risk',
        climScore, 15, 'Climatic / Input Risk Level', climRaw || 'N/A');

    // ── 9. Credit History / Banking Behaviour (40 pts) ────────────────────────
    const CAT9 = 'Credit History / Banking Behaviour';
    const isNew = (data.customer_type === 'new');
    const chMap = { 'Pass': 20, 'Watch List': 15, 'Watchlist': 15, 'Substandard': 10, 'Doubtful': 4, 'Loss': 0 };
    const chScore = isNew ? 20 : (chMap[data.credit_history_banks] !== undefined ? chMap[data.credit_history_banks] : 5);
    add(CAT9, 'Credit History (BFI)',
        chScore, 20,
        isNew ? 'New Customer — Full Points' : 'BFI Loan Classification',
        isNew ? 'New Customer' : data.credit_history_banks || 'N/A');
    const bfiDpd   = data.dpd_days_banks;
    const dpdScore = isNew ? 20 : bfiDpd <= 5 ? 20 : bfiDpd <= 10 ? 15 : bfiDpd <= 15 ? 10 : 0;
    add(CAT9, 'Max DPD (BFI Loan)',
        dpdScore, 20,
        isNew ? 'New Customer — Full Points' : 'Days Past Due on Bank Loan',
        isNew ? 'New Customer' : bfiDpd + ' days');

    // ── 10. Buyer Concentration & Market Risk (80 pts) ────────────────────────
    const CAT10 = 'Buyer Concentration & Market Risk';
    const t5 = data.top5_buyer_conc_pct || data.top5_buyer_share_percent || 0;
    add(CAT10, 'Top 5 Buyer Concentration %',
        t5 <= 20 ? 25 : t5 <= 30 ? 20 : t5 <= 40 ? 15 : t5 <= 50 ? 10 : 5,
        25, 'Top 5 Buyer Sales / Total Revenue × 100', Number(t5).toFixed(1) + '%');
    const lb = data.largest_buyer_conc_pct || data.largest_buyer_share_percent || 0;
    add(CAT10, 'Largest Buyer Concentration %',
        lb <= 20 ? 25 : lb <= 30 ? 20 : lb <= 40 ? 15 : lb <= 50 ? 10 : 5,
        25, 'Largest Buyer Sales / Total Revenue × 100', Number(lb).toFixed(1) + '%');
    const sbsPct = data.stable_buyer_share_pct !== undefined
        ? data.stable_buyer_share_pct
        : (data.stable_buyer_share_frac !== undefined ? data.stable_buyer_share_frac * 100 : 0);
    add(CAT10, 'Stable Buyer Share %',
        sbsPct >= 60 ? 10 : sbsPct >= 40 ? 5 : 0,
        10, '(Govt + Large Private Buyers) / Total Buyers × 100', Number(sbsPct).toFixed(1) + '%');
    const ccFrac = data.contract_score_frac || 0;
    add(CAT10, 'Contract Coverage %',
        ccFrac >= 0.80 ? 10 : ccFrac >= 0.50 ? 5 : 0,
        10, 'Buyers Under Contract / Total Buyers', (ccFrac * 100).toFixed(1) + '%');
    const ps = data.payment_score_frac || 0;
    add(CAT10, 'Buyer Payment Score',
        ps >= 0.90 ? 10 : ps >= 0.80 ? 9 : ps >= 0.70 ? 7 : ps >= 0.50 ? 5 : 0,
        10, '1 − (Avg Payment Days / 90)', (ps * 100).toFixed(1) + '%');

    // ── 11. Behavioural & Due Diligence Risk (40 pts, 8 × 5 pts) ─────────────
    const CAT11 = 'Behavioural & Due Diligence Risk';

    // Committee: "Weekly"→5, "Monthly"→2.5, "Quarterly"→1.5, "Annually"→1
    const meetFreq = data.meeting_frequency || '';
    add(CAT11, 'Committee Meeting Frequency',
        meetFreq === 'Weekly'    ? 5
        : meetFreq === 'Monthly'   ? 2.5
        : meetFreq === 'Quarterly' ? 1.5
        : meetFreq === 'Annually'  ? 1 : 0,
        5, 'Committee Meeting Regularity', meetFreq || 'N/A');

    // Member Info Transparency
    const transMap = { 'Always': 5, 'Mostly': 2.5, 'Sometimes': 1.5, 'Decided among few': 1 };
    const mitVal = data.member_info_transparency || '';
    add(CAT11, 'Member Info Transparency',
        transMap[mitVal] !== undefined ? transMap[mitVal] : 0,
        5, 'Transparency with Members on Plans', mitVal || 'N/A');

    // Fund Utilization: case-insensitive to handle "Buying Milk"/"Buying milk"/"members"/"Members"
    const fu = (data.fund_usage || '').toLowerCase();
    add(CAT11, 'Fund Utilization Transparency',
        fu.includes('buying') ? 5
        : fu === 'processing' ? 2.5
        : fu === 'members'    ? 1.5
        : fu.includes('other') || fu.includes('1 area') ? 1 : 0,
        5, 'Primary Fund Usage Category', data.fund_usage || 'N/A');

    // KYC/AML
    const kycMap = { 'Easily Found': 5, 'Mostly': 2.5, 'Sometimes': 1.5, 'Hard': 1 };
    const kycVal = data.kyc_aml || '';
    add(CAT11, 'Member KYC Compliance',
        kycMap[kycVal] !== undefined ? kycMap[kycVal] : 0,
        5, 'Member Records Accessibility', kycVal || 'N/A');

    // Financial Oversight
    const fovMap = { 'Regularly': 5, 'Occasionally': 2.5, 'Once': 1.5, 'Never': 0 };
    const fovVal = data.income_expense_checked || '';
    add(CAT11, 'Financial Oversight',
        fovMap[fovVal] !== undefined ? fovMap[fovVal] : 0,
        5, 'Income/Expense Verification Frequency', fovVal || 'N/A');

    // Governance Communication: case-insensitive (sheet "Always beforehand", portal "Always Beforehand")
    const gc = (data.right_to_information || '').toLowerCase();
    add(CAT11, 'Governance Communication',
        gc.startsWith('always')       ? 5
        : gc.startsWith('mostly')      ? 2.5
        : gc.startsWith('sometimes')   ? 1.5
        : gc.startsWith('only after')  ? 1 : 0,
        5, 'Member Notification Before New Rules', data.right_to_information || 'N/A');

    // Stakeholder Engagement: "Frequently"/"Sometimes"/"Never"
    const stakVal = data.community_support_level || '';
    add(CAT11, 'Stakeholder Engagement',
        stakVal === 'Frequently' ? 5
        : stakVal === 'Sometimes'  ? 2.5
        : stakVal === 'Never'      ? 1.5 : 0,
        5, 'Community Support Level', stakVal || 'N/A');

    // Emergency Preparedness: "Proper Plan"/"Normal"/"Little Preparation"/"Nothing"
    const emgVal = data.emergency_response || '';
    add(CAT11, 'Emergency Preparedness',
        emgVal === 'Proper Plan'         ? 5
        : emgVal === 'Normal'              ? 2.5
        : emgVal === 'Little Preparation' ? 1.5
        : emgVal === 'Nothing'            ? 0 : 0,
        5, 'Emergency / Low-Milk Response Plan', emgVal || 'N/A');

    // ── Assemble ──────────────────────────────────────────────────────────────
    const categories = Object.entries(catMap).map(([name, d]) => ({
        name,
        score: Math.round(d.score * 10) / 10,
        max:   d.max,
        logs:  indicators.filter(i => i.cat === name)
    }));

    const rawTotal   = indicators.reduce((s, i) => s + i.score, 0);
    const rawMax     = indicators.reduce((s, i) => s + i.max,   0);
    const totalScore = Math.min(Math.round(rawTotal), 1000);

    const strengths  = [];
    const weaknesses = [];
    const focus      = [];
    indicators.forEach(ind => {
        const p = ind.max > 0 ? (ind.score / ind.max) * 100 : 0;
        if (p >= 85)               strengths.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p <= 35 && ind.max > 0) weaknesses.push(`${ind.name}: ${ind.value} (${ind.score}/${ind.max} pts)`);
        if (p > 35 && p < 65)       focus.push(`${ind.name}: ${ind.value} — room for improvement`);
    });

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
        totalScore, rawTotal: Math.round(rawTotal), rawMax,
        riskCategory, recommendation, categories,
        metrics: {
            dscr:           calc.dscr,
            current_ratio:  calc.current_ratio_raw,
            debt_equity:    calc.debt_equity_raw,
            gnpa_pct:       calc.gnpa_pct_raw,          // already a percentage
            milk_loss_pct:  calc.milk_loss_pct_raw,
            bank_sales_pct: calc.bank_sales_pct_raw,
            seasonality:    calc.seasonality_raw
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
            name: i.name, category: i.cat, value: i.value,
            score: Math.round(i.score * 10) / 10, max: i.max, formula: i.formula
        })),
        strengths:  strengths.slice(0, 8),
        weaknesses: weaknesses.slice(0, 8),
        focus:      focus.slice(0, 6)
    };
}

// ── Pipeline Orchestrator ─────────────────────────────────────────────────────

/**
 * Run the full scoring engine from saved answers JSON.
 * @param {Object} answers - Flat key-value answers object (old or new field IDs)
 * @returns {Object}       - Full result with categories, strengths, weaknesses, metrics
 */
function runScoringEngine(answers) {
    const data    = transformData(answers);
    const calc    = runCalculations(data);
    return runModel(calc, data);
}
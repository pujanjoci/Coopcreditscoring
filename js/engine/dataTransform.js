/**
 * dataTransform.js — Data Sheet Layer
 * Transforms raw questionnaire inputs into derived/calculated fields.
 * Mirrors the "Data Sheet" from the spreadsheet model.
 *
 * Field IDs match the questions.js Bifurcation column exactly.
 * Auto-calculated totals are derived here (not read from form fields).
 */

/**
 * Transform raw form inputs into a fully-derived data object.
 * @param {Object} rawInputs - Flat key-value map from form fields (id → value)
 * @returns {Object}         - Extended data object with all derived fields
 */
function transformData(rawInputs) {
    const inp = rawInputs;
    const n   = key => safeNum(inp[key]);
    const s   = key => String(inp[key] || '').trim();

    // ── S.N 1–5: Identity & Classification ───────────────────────────────────
    const coop_name      = s('coop_name');
    const model_type     = s('model_type');
    const is_existing    = s('is_existing');
    const years_operation= n('years_operation');
    const office_location= s('office_location');
    // customer_type is set externally by config (same as is_existing logic)
    const customer_type  = s('customer_type') || (is_existing === 'Existing Loan' ? 'existing' : 'new');

    // ── S.N 6–11: Loan ────────────────────────────────────────────────────────
    const existing_loan_amt  = n('existing_loan_amt');
    const proposed_loan_amt  = n('proposed_loan_amt');
    const total_loan         = existing_loan_amt + proposed_loan_amt;   // S.N 8 auto
    const interest_rate      = n('interest_rate');
    const loan_tenure_months = n('loan_tenure_months');
    const repayment_frequency= s('repayment_frequency');

    // ── S.N 12–18: Revenue & Sales ────────────────────────────────────────────
    const milk_sales     = n('milk_sales');
    const product_sales  = n('product_sales');
    const other_sales    = n('other_sales');
    const total_sales    = milk_sales + product_sales + other_sales;    // S.N 15 auto
    const grant_income   = n('grant_income');
    const total_revenue  = total_sales + grant_income;                   // S.N 17 auto
    const bank_sales     = n('bank_sales');

    // ── S.N 19–32: Buyer Analysis ─────────────────────────────────────────────
    const total_number_of_buyers    = n('total_number_of_buyers');
    const top5_buyers_sales         = n('top5_buyers_sales');
    const largest_buyer_sales       = n('largest_buyer_sales');
    const gov_buyer_sales           = n('gov_buyer_sales');
    const no_govt_buyers            = n('no_govt_buyers');
    const large_private_buyer_sales = n('large_private_buyer_sales');
    const no_private_sector_buyer   = n('no_private_sector_buyer');
    const small_buyer_sales         = n('small_buyer_sales');
    const no_small_buyer_sales      = n('no_small_buyer_sales');
    const avg_payment_days_buyers   = n('avg_payment_days_buyers');
    const contract_coverage         = n('contract_coverage');

    // S.N 30–31: auto-calculated buyer share percentages
    const top5_buyer_share_percent    = total_sales > 0 ? (top5_buyers_sales    / total_sales) * 100 : 0;
    const largest_buyer_share_percent = total_sales > 0 ? (largest_buyer_sales  / total_sales) * 100 : 0;

    // Contract score as fraction of total buyers
    const contract_score_frac = total_number_of_buyers > 0
        ? contract_coverage / total_number_of_buyers : 0;

    // Stable buyer share = (govt buyers count + large private count) / total buyers
    const stable_buyer_share_frac = total_number_of_buyers > 0
        ? (no_govt_buyers + no_private_sector_buyer) / total_number_of_buyers : 0;

    // Payment score = 1 - (avgPaymentDays / 90)  [from Calculations sheet]
    const payment_score_frac = Math.max(0, 1 - (avg_payment_days_buyers / 90));

    // ── S.N 29, 33–47: Operating Costs ───────────────────────────────────────
    const raw_milk_purchase_cost  = n('raw_milk_purchase_cost');
    const processing_cost         = n('processing_cost');
    const packaging_cost          = n('packaging_cost');
    const transport_cost          = n('transport_cost');
    const other_processing_cost   = n('other_processing_cost');
    const salary_expense          = n('salary_expense');
    const admin_expense           = n('admin_expense');
    const electricity_expense     = n('electricity_expense');
    const fuel_expense            = n('fuel_expense');
    const maintenance_expense     = n('maintenance_expense');
    const rent_expense            = n('rent_expense');
    const other_operating_expense = n('other_operating_expense');

    // S.N 44: auto-calculated total operating expenses (overhead only)
    // Sheet formula: =E38+E39+E40+E41+E42+E43+E44
    // = salary + admin + electricity + fuel + maintenance + rent + other_operating
    // Does NOT include: raw_milk_purchase_cost, processing_cost, packaging_cost,
    //                   transport_cost, other_processing_cost
    const total_opex = salary_expense + admin_expense + electricity_expense +
                       fuel_expense + maintenance_expense + rent_expense +
                       other_operating_expense;

    // COGS depends on model type:
    //   Collection Only (Model A)        : raw milk purchase cost only
    //   Collection & Processing (Model B) : raw milk + processing + packaging + transport + other processing
    const isModelB = model_type.toLowerCase().includes('processing');
    const cogs = isModelB
        ? raw_milk_purchase_cost + processing_cost + packaging_cost + transport_cost + other_processing_cost
        : raw_milk_purchase_cost;

    // S.N 45: lean month expense = total_opex / 12  (auto, no user input)
    const lean_month_expense = total_opex / 12;

    const depreciation = n('depreciation');
    const amortization = n('amortization');

    // EBITDA = total_revenue - COGS - total_opex
    // Sheet formula: =Questions!D18 - SUM(Questions!D34:D37) - Questions!D45
    // = total_revenue - (processing+packaging+transport+other_proc) - overhead_opex
    // No depreciation/amortization addback per sheet
    const ebitda = total_revenue - cogs - total_opex;

    // ── S.N 48–63: Assets ─────────────────────────────────────────────────────
    const cash_on_hand        = n('cash_on_hand');
    const bank_balance        = n('bank_balance');
    const total_cash          = cash_on_hand + bank_balance;            // S.N 50 auto
    const accounts_receivable = n('accounts_receivable');
    const inventory           = n('inventory');
    const prepaid_expense     = n('prepaid_expense');
    const other_current_assets= n('other_current_assets');

    // S.N 55 auto: total current assets
    const current_assets = total_cash + accounts_receivable + inventory +
                           prepaid_expense + other_current_assets;

    const land_value          = n('land_value');
    const building_value      = n('building_value');
    const plant_machinery_value = n('plant_machinery_value');
    const vehicle_value       = n('vehicle_value');
    const furniture_value     = n('furniture_value');
    const other_fixed_assets  = n('other_fixed_assets');

    // S.N 62 auto: total fixed (non-current) assets
    const non_current_assets  = land_value + building_value + plant_machinery_value +
                                vehicle_value + furniture_value + other_fixed_assets;

    // S.N 63 auto: total assets
    const total_assets = current_assets + non_current_assets;

    // ── S.N 64–72: Liabilities ────────────────────────────────────────────────
    const accounts_payable              = n('accounts_payable');
    const short_term_loan               = n('short_term_loan');
    const accrued_expense               = n('accrued_expense');
    const current_portion_long_term_debt= n('current_portion_long_term_debt');
    const long_term_loan                = n('long_term_loan');
    const other_long_term_liabilities   = n('other_long_term_liabilities');

    // S.N 68 auto: total current liabilities
    const current_liabilities = accounts_payable + short_term_loan +
                                accrued_expense + current_portion_long_term_debt;

    // S.N 71 auto: total non-current liabilities
    const non_current_liabilities = long_term_loan + other_long_term_liabilities;

    // S.N 72 auto: total liabilities
    const total_liabilities = current_liabilities + non_current_liabilities;

    // ── S.N 73–76: Net Worth ──────────────────────────────────────────────────
    const paid_up_capital   = n('paid_up_capital');
    const retained_earnings = n('retained_earnings');
    const reserves          = n('reserves');

    // S.N 76 auto: total net worth
    const total_networth = paid_up_capital + retained_earnings + reserves;

    // Total debt (short + long) for debt/equity ratio
    const total_debt = short_term_loan + current_portion_long_term_debt + long_term_loan + other_long_term_liabilities;

    // ── S.N 77–91: Milk Collection & Supply ──────────────────────────────────
    const total_milk_collected_liters        = n('total_milk_collected_liters');
    const milk_loss_liters_during_collection = n('milk_loss_liters_during_collection');
    const loss_during_process                = n('loss_during_process');

    // Total milk loss = collection loss + processing loss (sheet Data!D24 = D79+D80)
    const total_milk_loss = milk_loss_liters_during_collection + loss_during_process;

    // S.N 80 auto: produced milk = total collected - collection loss ONLY
    // Sheet Data!D25 = Questions!D78 - Questions!D79 (NOT minus process loss)
    const produced_milk_model_b_liters = Math.max(
        0,
        total_milk_collected_liters - milk_loss_liters_during_collection
    );

    // S.N 81 auto: avg monthly milk = total / 12 (always auto-calculated, sheet =E81/12)
    const avg_monthly_milk_liters = total_milk_collected_liters / 12;

    const lowest_monthly_milk_liters  = n('lowest_monthly_milk_liters');
    const highest_monthly_milk_liters = n('highest_monthly_milk_liters');
    // Fallback to current inventory if average_inventory field is blank
    const average_inventory = n('average_inventory') || n('inventory');
    const credit_period_given_days    = n('credit_period_given_days');
    const top5_farmer_collection_liters   = n('top5_farmer_collection_liters');
    const highest_farmer_quantity_liters  = n('highest_farmer_quantity_liters');
    const lowest_farmer_quantity_liters   = n('lowest_farmer_quantity_liters');
    const total_number_of_farmers         = n('total_number_of_farmers');
    const collection_days_positive        = n('collection_days_positive');

    // S.N 90 auto: average milk per farmer
    const avg_farmer_quantity_liters = total_number_of_farmers > 0
        ? total_milk_collected_liters / total_number_of_farmers : 0;

    // Collection Days Category (sheet Data!D36): IF(days>325,"High",IF(>300,"Medium","Low"))
    const collection_days_category = collection_days_positive > 325 ? 'High'
        : collection_days_positive > 300 ? 'Medium' : 'Low';

    // ── S.N 92–97: Loan Recovery & NPA ───────────────────────────────────────
    const total_member_loans      = n('total_member_loans');
    const npa_member_loans        = n('npa_member_loans');
    const overdue_member_loans    = n('overdue_member_loans');
    const restructured_loans_past3yrs = s('restructured_loans_past3yrs');
    const max_dpd_days            = n('max_dpd_days');
    const credit_history_flag     = s('credit_history_flag');

    // ── S.N 98–99: Financial Performance ─────────────────────────────────────
    const cash_bank_balance_last_year     = n('cash_bank_balance_last_year');
    const cash_bank_balance_previous_year = n('cash_bank_balance_previous_year');

    // Cash trend
    const cash_trend = cash_bank_balance_last_year > cash_bank_balance_previous_year ? 'UP'
        : cash_bank_balance_last_year < cash_bank_balance_previous_year ? 'DOWN'
        : 'STABLE';

    // ── S.N 100–104: Governance & Management ─────────────────────────────────
    const key_mgmt_avg_experience_years = n('key_mgmt_avg_experience_years');
    const internal_control_score        = s('internal_control_score');  // 'Robust'/'Adequate'/'Weak'
    const audit_findings_count          = s('audit_findings_count');    // 'None'/'Few' (dropdown)
    const lending_policy_compliance_flag= s('lending_policy_compliance_flag');
    const fleet_availability_percent    = s('fleet_availability_percent'); // 'Yes'/'No'

    // ── S.N 105–110: Logistics & Infrastructure ──────────────────────────────
    const storage_availability_flag  = s('storage_availability_flag');
    const quality_sop_score_model_b  = s('quality_sop_score_model_b');
    const insurance_coverage_flag    = s('insurance_coverage_flag');
    const digital_mis_flag           = s('digital_mis_flag');
    const regulatory_compliance_flag = s('regulatory_compliance_flag');
    const climatic_risk_score        = s('climatic_risk_score');         // 'Low'/'Medium'/'High'

    // Pass raw dropdown string — model.js uses .includes() string matching.
    // Never convert to numeric here; that breaks the string match entirely.
    const quality_sop_numeric = quality_sop_score_model_b;

    // ── S.N 111–112: Credit History — BFI ────────────────────────────────────
    const credit_history_banks = s('credit_history_banks');
    const dpd_days_banks       = n('dpd_days_banks');

    // ── S.N 113–120: Behavioral & Community ──────────────────────────────────
    const meeting_frequency         = s('meeting_frequency');
    const member_info_transparency  = s('member_info_transparency');
    const fund_usage                = s('fund_usage');
    const kyc_aml                   = s('kyc_aml');
    const income_expense_checked    = s('income_expense_checked');
    const right_to_information      = s('right_to_information');
    const community_support_level   = s('community_support_level');
    const emergency_response        = s('emergency_response');

    // ── Loan repayment computation (for DSCR) ────────────────────────────────
    // Sheet Data!D8 Principal = Questions!D68 = current_portion_long_term_debt
    const annual_principal = current_portion_long_term_debt;
    // Sheet Data!D9 Interest = Questions!D9 * Questions!D10 = interest_rate * loan_tenure_months
    const annual_interest  = interest_rate * loan_tenure_months;

    return {
        // Identity
        coop_name, model_type, is_existing, customer_type, years_operation, office_location,

        // Loan
        existing_loan_amt, proposed_loan_amt, total_loan,
        interest_rate, loan_tenure_months, repayment_frequency,
        annual_principal, annual_interest,

        // Revenue (with auto-calc totals)
        milk_sales, product_sales, other_sales, total_sales,
        grant_income, total_revenue, bank_sales,

        // Buyer
        total_number_of_buyers, top5_buyers_sales, largest_buyer_sales,
        gov_buyer_sales, no_govt_buyers, large_private_buyer_sales, no_private_sector_buyer,
        small_buyer_sales, no_small_buyer_sales, avg_payment_days_buyers, contract_coverage,
        top5_buyer_share_percent, largest_buyer_share_percent,
        contract_score_frac, stable_buyer_share_frac, payment_score_frac,

        // Expenses (with auto-calc total)
        raw_milk_purchase_cost, processing_cost, packaging_cost, transport_cost,
        other_processing_cost, salary_expense, admin_expense, electricity_expense,
        fuel_expense, maintenance_expense, rent_expense, other_operating_expense,
        total_opex, cogs, lean_month_expense, depreciation, amortization, ebitda,

        // Assets (with auto-calc totals)
        cash_on_hand, bank_balance, total_cash,
        accounts_receivable, inventory, prepaid_expense, other_current_assets,
        current_assets,
        land_value, building_value, plant_machinery_value, vehicle_value,
        furniture_value, other_fixed_assets, non_current_assets, total_assets,

        // Liabilities (with auto-calc totals)
        accounts_payable, short_term_loan, accrued_expense, current_portion_long_term_debt,
        current_liabilities,
        long_term_loan, other_long_term_liabilities,
        non_current_liabilities, total_liabilities,
        total_debt,

        // Net Worth (with auto-calc total)
        paid_up_capital, retained_earnings, reserves, total_networth,

        // Milk (with auto-calc totals)
        total_milk_collected_liters, milk_loss_liters_during_collection, loss_during_process,
        total_milk_loss, produced_milk_model_b_liters,
        avg_monthly_milk_liters, lowest_monthly_milk_liters, highest_monthly_milk_liters,
        average_inventory, credit_period_given_days,
        top5_farmer_collection_liters, highest_farmer_quantity_liters, lowest_farmer_quantity_liters,
        total_number_of_farmers, avg_farmer_quantity_liters, collection_days_positive,
        collection_days_category,

        // Loan Recovery
        total_member_loans, npa_member_loans, overdue_member_loans,
        restructured_loans_past3yrs, max_dpd_days, credit_history_flag,

        // Financial Performance
        cash_bank_balance_last_year, cash_bank_balance_previous_year, cash_trend,

        // Governance
        key_mgmt_avg_experience_years, internal_control_score,
        audit_findings_count, lending_policy_compliance_flag, fleet_availability_percent,

        // Logistics
        storage_availability_flag, quality_sop_score_model_b, quality_sop_numeric,
        insurance_coverage_flag, digital_mis_flag,
        regulatory_compliance_flag, climatic_risk_score,

        // Credit
        credit_history_banks, dpd_days_banks,

        // Behavioral
        meeting_frequency, member_info_transparency, fund_usage,
        kyc_aml, income_expense_checked, right_to_information,
        community_support_level, emergency_response
    };
}
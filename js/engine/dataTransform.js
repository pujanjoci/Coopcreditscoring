/**
 * dataTransform.js — Data Sheet Layer
 * Transforms raw questionnaire inputs into derived/calculated fields.
 * Mirrors the "Data Sheet" calculations from the spreadsheet model.
 */

/**
 * Transform raw form inputs into a fully-derived data object.
 * All auto-calculated fields are computed here.
 * @param {Object} rawInputs - Flat key-value map from form fields
 * @returns {Object} - Extended data object with all derived fields
 */
function transformData(rawInputs) {
    const inp = {};
    // Normalize all inputs to numbers or strings for consistency
    for (const [key, val] of Object.entries(rawInputs)) {
        inp[key] = val;
    }

    const n = key => safeNum(inp[key]);

    // ── Loan ─────────────────────────────────────────────────────────────────
    const existing_loan  = n('existing_loan');
    const proposed_loan  = n('proposed_loan');
    const total_loan     = existing_loan + proposed_loan;
    const interest_rate  = n('interest_rate');
    const loan_tenure    = n('loan_tenure');   // months

    // ── Revenue ───────────────────────────────────────────────────────────────
    const milk_sales          = n('milk_sales');
    const other_product_sales = n('other_product_sales');
    const other_income        = n('other_income');
    const grant_income        = n('grant_income');
    const total_sales         = milk_sales + other_product_sales + other_income;
    const total_revenue       = total_sales + grant_income;
    const bank_sales          = n('bank_sales');

    // ── Buyer Analysis ────────────────────────────────────────────────────────
    const top5_buyers_sales    = n('top5_buyers_sales');
    const largest_buyer_sales  = n('largest_buyer_sales');
    const top5_buyer_pct       = total_sales > 0 ? (top5_buyers_sales / total_sales) * 100 : 0;
    const largest_buyer_pct    = total_sales > 0 ? (largest_buyer_sales / total_sales) * 100 : 0;

    // ── Operating Expenses ────────────────────────────────────────────────────
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

    // ── Cash & Financial Performance ──────────────────────────────────────────
    const cash_hand        = n('cash_hand');
    const bank_balance     = n('bank_balance');
    const total_cash       = cash_hand + bank_balance;
    const cash_last_year   = n('cash_last_year');
    const cash_prev_year   = n('cash_prev_year');
    const lowest_monthly_expense = n('lowest_monthly_expense');
    const avg_inventory_value    = n('avg_inventory_value');
    const audit_observations     = n('audit_observations');

    // ── Current Assets ────────────────────────────────────────────────────────
    const accounts_receivable  = n('accounts_receivable');
    const inventory_value      = n('inventory_value');
    const prepaid_expenses     = n('prepaid_expenses');
    const other_current_assets = n('other_current_assets');
    const total_current_assets = total_cash + accounts_receivable + inventory_value +
                                 prepaid_expenses + other_current_assets;

    // ── Fixed Assets ──────────────────────────────────────────────────────────
    const land_value        = n('land_value');
    const building_value    = n('building_value');
    const machinery_value   = n('machinery_value');
    const vehicle_value     = n('vehicle_value');
    const furniture_value   = n('furniture_value');
    const other_fixed_assets= n('other_fixed_assets');
    const total_fixed_assets = land_value + building_value + machinery_value +
                               vehicle_value + furniture_value + other_fixed_assets;
    const total_assets       = total_current_assets + total_fixed_assets;

    // ── Liabilities ───────────────────────────────────────────────────────────
    const accounts_payable    = n('accounts_payable');
    const short_term_loan     = n('short_term_loan');
    const accrued_expenses    = n('accrued_expenses');
    const current_ltd         = n('current_ltd');
    const long_term_loan      = n('long_term_loan');
    const other_ltl           = n('other_ltl');

    const total_current_liabilities   = accounts_payable + short_term_loan + accrued_expenses + current_ltd;
    const total_long_term_liabilities  = long_term_loan + other_ltl;
    const total_liabilities            = total_current_liabilities + total_long_term_liabilities;

    // ── Net Worth ─────────────────────────────────────────────────────────────
    const paid_up_capital   = n('paid_up_capital');
    const retained_earnings = n('retained_earnings');
    const reserve_fund      = n('reserve_fund');
    const total_net_worth   = paid_up_capital + retained_earnings + reserve_fund;

    // ── Collateral ────────────────────────────────────────────────────────────
    const primary_land_value = n('primary_land_value');

    // ── Milk Metrics ──────────────────────────────────────────────────────────
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

    // ── Logistics & Governance ────────────────────────────────────────────────
    const vehicle_avail_pct      = n('vehicle_avail_pct');
    const storage_cold_facility  = inp['storage_cold_facility'] || '';
    const digital_mis_pos        = inp['digital_mis_pos'] || '';
    const quality_sop_score      = n('quality_sop_score');

    // ── Loan Recovery ─────────────────────────────────────────────────────────
    const total_member_loans     = n('total_member_loans');
    const npa_member_loans       = n('npa_member_loans');
    const max_dpd_members        = n('max_dpd_members');
    const restructured_loans_3yr  = inp['restructured_loans_3yr'] || 'None';

    // ── Governance ────────────────────────────────────────────────────────────
    const mgmt_experience        = n('mgmt_experience');
    const internal_control_score = n('internal_control_score');
    const loan_policy_compliance  = inp['loan_policy_compliance'] || '';
    const meeting_frequency       = inp['meeting_frequency'] || '';
    const income_expense_checked  = inp['income_expense_checked'] || '';

    // ── External Risk ─────────────────────────────────────────────────────────
    const insurance_available    = inp['insurance_available'] || '';
    const regulatory_compliance  = inp['regulatory_compliance'] || '';
    const climatic_risk_score    = n('climatic_risk_score');

    // ── Credit History ────────────────────────────────────────────────────────
    const credit_history_bfi     = inp['credit_history_bfi'] || '';
    const max_dpd_bfi            = n('max_dpd_bfi');

    // ── Behavioral ────────────────────────────────────────────────────────────
    const community_support_level = inp['community_support_level'] || '';
    const emergency_response      = inp['emergency_response'] || '';
    const years_operation         = n('years_operation');

    return {
        // Identity
        coop_name: inp['coop_name'] || '',
        model_type: inp['model_type'] || '',
        loan_type: inp['loan_type'] || '',
        customer_type: inp['customer_type'] || '',
        years_operation,

        // Loan
        existing_loan, proposed_loan, total_loan,
        interest_rate, loan_tenure,
        primary_land_value,

        // Revenue
        milk_sales, other_product_sales, other_income, grant_income,
        total_sales, total_revenue, bank_sales,

        // Buyer
        top5_buyers_sales, largest_buyer_sales,
        top5_buyer_pct, largest_buyer_pct,

        // Expenses
        raw_milk_cost, processing_cost, packaging_cost, transport_cost,
        other_processing_cost, salary_expense, admin_expense,
        electricity_expense, fuel_expense, repair_expense, rent_expense,
        other_opex, total_opex,
        annual_depreciation, amortization_amount,

        // Cash & Performance
        cash_hand, bank_balance, total_cash,
        cash_last_year, cash_prev_year,
        lowest_monthly_expense, avg_inventory_value, audit_observations,

        // Assets
        accounts_receivable, inventory_value, prepaid_expenses, other_current_assets,
        total_current_assets,
        land_value, building_value, machinery_value, vehicle_value, furniture_value, other_fixed_assets,
        total_fixed_assets, total_assets,

        // Liabilities
        accounts_payable, short_term_loan, accrued_expenses, current_ltd,
        total_current_liabilities,
        long_term_loan, other_ltl,
        total_long_term_liabilities, total_liabilities,

        // Net Worth
        paid_up_capital, retained_earnings, reserve_fund, total_net_worth,

        // Milk
        total_milk_collected, milk_loss, processing_loss, total_milk_sold,
        avg_monthly_milk, lowest_monthly_milk, collection_days,
        total_farmers, avg_milk_per_farmer, top5_farmers_milk,

        // Logistics
        vehicle_avail_pct, storage_cold_facility, digital_mis_pos, quality_sop_score,

        // Recovery
        total_member_loans, npa_member_loans, max_dpd_members, restructured_loans_3yr,

        // Governance
        mgmt_experience, internal_control_score, loan_policy_compliance,
        meeting_frequency, income_expense_checked, audit_observations,

        // External
        insurance_available, regulatory_compliance, climatic_risk_score,

        // Credit
        credit_history_bfi, max_dpd_bfi,

        // Behavioral
        community_support_level, emergency_response
    };
}

/**
 * calculations.js — Calculations Sheet Layer
 * Derives financial ratios and intermediate metrics from the data layer.
 * Mirrors the "Calculations Sheet" from the spreadsheet model.
 */

/**
 * Run all intermediate financial metric calculations.
 * @param {Object} data - Output from transformData()
 * @returns {Object} - All computed metrics ready for the model layer
 */
function runCalculations(data) {
    // ── EBITDA & Debt Service ─────────────────────────────────────────────────
    const ebitda = data.total_revenue - data.total_opex +
                   data.annual_depreciation + data.amortization_amount;

    // Annual debt service = annual principal repayment + annual interest
    const annualInterest   = data.proposed_loan * (data.interest_rate / 100);
    const annualPrincipal  = data.loan_tenure > 0
        ? data.proposed_loan / (data.loan_tenure / 12)
        : 0;
    const debtService = annualPrincipal + annualInterest;

    // DSCR — Debt Service Coverage Ratio
    const dscr = debtService > 0
        ? safeDivide(ebitda, debtService)
        : (ebitda > 0 ? 2.5 : 0);

    // ── Seasonality Coverage ──────────────────────────────────────────────────
    // Months of expenses covereable by cash on hand (lean month basis)
    const leanMonthExp = data.lowest_monthly_expense > 0
        ? data.lowest_monthly_expense
        : (data.total_opex / 12);  // fallback to monthly average
    const seasonalityCoverage = leanMonthExp > 0
        ? safeDivide(data.total_cash, leanMonthExp)
        : 0;

    // ── Receivable Days ───────────────────────────────────────────────────────
    const receivableDays = data.total_sales > 0
        ? (data.accounts_receivable / (data.total_sales / 365))
        : 0;

    // ── Inventory Days ────────────────────────────────────────────────────────
    const invVal = data.avg_inventory_value > 0
        ? data.avg_inventory_value
        : data.inventory_value;
    const inventoryDays = data.raw_milk_cost > 0
        ? (invVal / (data.raw_milk_cost / 365))
        : 0;

    // ── Milk Supply Metrics ───────────────────────────────────────────────────
    // Milk stability: lowest month / average monthly
    const milkStability = data.avg_monthly_milk > 0
        ? pct(data.lowest_monthly_milk, data.avg_monthly_milk)
        : 0;

    // Collection day utilization %
    const collectionDayPct = (data.collection_days / 365) * 100;

    // Milk loss rate %
    const milkLossRate = data.total_milk_collected > 0
        ? pct(data.milk_loss, data.total_milk_collected)
        : 0;

    // Processing/yield loss rate %
    const yieldLossRate = data.total_milk_collected > 0
        ? pct(data.processing_loss, data.total_milk_collected)
        : 0;

    // Farmer concentration — top 5 farmers share %
    const farmerConcentration = data.total_milk_collected > 0
        ? pct(data.top5_farmers_milk, data.total_milk_collected)
        : 0;

    // ── Financial Ratios ──────────────────────────────────────────────────────
    // Current Ratio
    const currentRatio = data.total_current_liabilities > 0
        ? safeDivide(data.total_current_assets, data.total_current_liabilities)
        : (data.total_current_assets > 0 ? 5.0 : 0);

    // Debt-to-Equity Ratio
    const debtEquityRatio = data.total_net_worth > 0
        ? safeDivide(data.total_liabilities, data.total_net_worth)
        : (data.total_liabilities > 0 ? 5.0 : 0);

    // Grant dependency %
    const grantDependencyPct = data.total_revenue > 0
        ? pct(data.grant_income, data.total_revenue)
        : 0;

    // Bank sales %
    const bankSalesPct = data.total_sales > 0
        ? pct(data.bank_sales, data.total_sales)
        : 0;

    // ── Collateral ────────────────────────────────────────────────────────────
    // Primary collateral coverage ratio
    const primaryCollateralCoverage = data.proposed_loan > 0
        ? safeDivide(data.primary_land_value, data.proposed_loan)
        : (data.primary_land_value > 0 ? 2.0 : 0);

    // ── Loan Recovery ─────────────────────────────────────────────────────────
    // Gross NPA %
    const gNPA = data.total_member_loans > 0
        ? pct(data.npa_member_loans, data.total_member_loans)
        : 0;

    return {
        ebitda,
        debtService,
        dscr,
        seasonalityCoverage,
        receivableDays,
        inventoryDays,
        milkStability,
        collectionDayPct,
        milkLossRate,
        yieldLossRate,
        farmerConcentration,
        currentRatio,
        debtEquityRatio,
        grantDependencyPct,
        bankSalesPct,
        primaryCollateralCoverage,
        gNPA
    };
}

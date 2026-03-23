/**
 * calculations.js — Calculations Sheet Layer
 * Derives financial ratios and intermediate metrics from the data layer.
 * Mirrors the "Calculations Sheet" from Credit-Scoring.xlsx exactly.
 *
 * Row references for traceability (Calculations!C column):
 *   C2  DSCR
 *   C3  Seasonality Coverage
 *   C4  Inventory Days
 *   C5  Receivable Days
 *   C6  Milk Stability %
 *   C7  Days Stability %
 *   C8  Milk Loss %
 *   C9  Yield Loss %
 *   C10 Farmer Concentration %
 *   C11 Collection Stability %
 *   C12 Payment Fairness %
 *   C13 Logistics Reliability
 *   C14 Net Worth
 *   C15 Debt/Equity
 *   C16 Current Ratio
 *   C17 Grant %
 *   C18 Cash/Bank Balance Trend
 *   C19 Member GNPA %
 *   C20 Max DPD (members)
 *   C21 Restructuring
 *   C22 Mgmt Experience
 *   C23 Internal Controls
 *   C24 Audit Findings
 *   C25 Lending Policy Compliance
 *   C26 Quality SOP (numeric)
 *   C27 % Sales via Bank
 *   C28 Insurance Coverage
 *   C29 Digital MIS
 *   C30 Regulatory Compliance
 *   C31 Climatic Risk
 *   C32 Credit History (BFI)
 *   C33 Max Delays (BFI DPD)
 *   C34 Top 5 Buyer Concentration %
 *   C35 Largest Buyer Concentration %
 *   C36 Stable Buyer Share %
 *   C37 Contract Score
 *   C38 (not used)
 *   C39 Committee Meeting Frequency
 *   C40 Member Info Transparency
 *   C41 Fund Utilization Transparency
 *   C42 Member Identification & KYC
 *   C43 Financial Oversight
 *   C44 Governance Communication
 *   C45 Stakeholder Engagement
 *   C46 Operational Contingency
 */

/**
 * Run all intermediate financial metric calculations.
 * @param {Object} data - Output from transformData()
 * @returns {Object}    - All computed metrics ready for the model layer
 */
function runCalculations(data) {
    // ── C2: DSCR — EBITDA / (Principal + Interest) ────────────────────────────
    const debtService = data.annual_principal + data.annual_interest;
    const dscr = debtService > 0
        ? safeDivide(data.ebitda, debtService)
        : (data.ebitda > 0 ? 2.5 : 0);

    // ── C3: Seasonality Coverage — CashBankLastYear / LeanMonthExpense ─────────
    // (mirrors Data!D41 / Data!D28 = lastYearCash / leanMonthExp)
    const seasonality_coverage = data.lean_month_expense > 0
        ? safeDivide(data.cash_bank_balance_last_year, data.lean_month_expense)
        : 0;

    // ── C4: Inventory Days — (AvgInventory / COGS) * 365 ──────────────────────
    // Sheet: =(Data!D19/Data!D20)*365
    // Data!D19 = avg_inventory, Data!D20 = COGS = processing+packaging+transport+other_proc
    const inventory_days = data.cogs > 0
        ? (data.average_inventory / data.cogs) * 365
        : 0;

    // ── C5: Receivable Days — (AccountsReceivable / TotalRevenue) * 365 ────────
    const receivable_days = data.total_revenue > 0
        ? (data.accounts_receivable / data.total_revenue) * 365
        : 0;

    // ── C6: Milk Stability % — (LowestMonthly / AvgMonthly) * 100 ──────────────
    const milk_stability_pct = data.avg_monthly_milk_liters > 0
        ? (data.lowest_monthly_milk_liters / data.avg_monthly_milk_liters) * 100
        : 0;

    // ── C7: Days Stability % — (CollectionDays / 365) * 100 ────────────────────
    const days_stability_pct = (data.collection_days_positive / 365) * 100;

    // ── C8: Milk Loss % — (TotalMilkLoss / TotalMilkCollected) * 100 ──────────
    // Sheet: =(Data!D25/Data!D24)*100
    // Data!D24 = total_milk_collected, Data!D25 = milk_loss = collection_loss + process_loss
    const milk_loss_pct = data.total_milk_collected_liters > 0
        ? (data.total_milk_loss / data.total_milk_collected_liters) * 100
        : 0;

    // ── C9: Yield Loss % — (TotalMilkLoss / ProducedMilk) * 100 ───────────────
    // Sheet: =(Data!D25/Data!D26)*100
    // Data!D25 = total milk loss, Data!D26 = produced_milk (total-collection_loss)
    const yield_loss_pct = data.produced_milk_model_b_liters > 0
        ? (data.total_milk_loss / data.produced_milk_model_b_liters) * 100
        : 0;

    // ── C10: Farmer Concentration % — (Top5Farmers / TotalMilkCollected) * 100 ─
    const farmer_concentration_pct = data.total_milk_collected_liters > 0
        ? (data.top5_farmer_collection_liters / data.total_milk_collected_liters) * 100
        : 0;

    // ── C11: Collection Stability % — TotalMilkCollected / TotalMemberLoans ────
    const collection_stability = data.total_member_loans > 0
        ? safeDivide(data.total_milk_collected_liters, data.total_member_loans)
        : 0;

    // ── C12: Payment Fairness % — 1 - (MaxDPD / 45) ────────────────────────────
    const payment_fairness = Math.max(0, 1 - (data.max_dpd_days / 45));

    // ── C13: Logistics Reliability — fleet_availability_percent ─────────────────
    // Sheet: =Data!D38 → Data SN37 = fleet_availability_percent (Questions!D105)
    const logistics_reliability = data.fleet_availability_percent;

    // ── C14: Net Worth — TotalAssets - TotalLiabilities ─────────────────────────
    const net_worth = data.total_assets - data.total_liabilities;

    // ── C15: Debt/Equity — TotalDebt / TotalNetworth ─────────────────────────────
    const debt_equity = data.total_networth > 0
        ? safeDivide(data.total_debt, data.total_networth)
        : (data.total_debt > 0 ? 5.0 : 0);

    // ── C16: Current Ratio — CurrentAssets / CurrentLiabilities ─────────────────
    const current_ratio = data.current_liabilities > 0
        ? safeDivide(data.current_assets, data.current_liabilities)
        : (data.current_assets > 0 ? 5.0 : 0);

    // ── C17: Grant % — GrantIncome / TotalRevenue (as fraction) ─────────────────
    const grant_pct = data.total_revenue > 0
        ? safeDivide(data.grant_income, data.total_revenue)
        : 0;

    // ── C18: Cash/Bank Balance Trend — derived in dataTransform ─────────────────
    const cash_trend = data.cash_trend;  // 'UP' / 'DOWN' / 'STABLE'

    // ── C19: Member GNPA % — NPA / TotalMemberLoans (as fraction) ───────────────
    const member_gnpa_pct = data.total_member_loans > 0
        ? safeDivide(data.npa_member_loans, data.total_member_loans)
        : 0;

    // ── C20–C25: Pass-through governance values ──────────────────────────────────
    const max_dpd_members    = data.max_dpd_days;
    const restructuring      = data.restructured_loans_past3yrs;
    const mgmt_experience    = data.key_mgmt_avg_experience_years;
    const internal_controls  = data.internal_control_score;
    const audit_findings     = data.audit_findings_count;
    const lending_compliance = data.lending_policy_compliance_flag;

    // ── C26: Quality SOP — pass raw string for model string matching ─────────────
    // Sheet C26 = Data!D40 = Questions!D107 = quality_sop_score_model_b (full string)
    const quality_sop_numeric = data.quality_sop_score_model_b;  // raw string from dropdown

    // ── C27: % Sales via Bank — BankSales / TotalRevenue * 100 ─────────────────
    // Sheet: =(Data!D31/Data!D32)*100
    // Data!D31 = bank_sales, Data!D32 = Questions!D18 = Total_Revenue (NOT just total_sales)
    const bank_sales_pct = data.total_revenue > 0
        ? (data.bank_sales / data.total_revenue) * 100
        : 0;

    // ── C28–C33: Pass-through logistics/risk/credit values ───────────────────────
    const insurance_coverage     = data.insurance_coverage_flag;
    const digital_mis            = data.digital_mis_flag;
    const regulatory_compliance  = data.regulatory_compliance_flag;
    const climatic_risk          = data.climatic_risk_score;
    const credit_history         = data.credit_history_banks;
    const max_delays_bfi         = data.dpd_days_banks;

    // ── C34: Top 5 Buyer Concentration % — Top5Sales / TotalSales * 100 ─────────
    const top5_buyer_conc_pct = data.total_sales > 0
        ? (data.top5_buyers_sales / data.total_sales) * 100
        : 0;

    // ── C35: Largest Buyer Concentration % ───────────────────────────────────────
    const largest_buyer_conc_pct = data.total_sales > 0
        ? (data.largest_buyer_sales / data.total_sales) * 100
        : 0;

    // ── C36: Stable Buyer Share % — (GovtCount + LargePrivateCount) / TotalBuyers ─
    const stable_buyer_share_pct = data.total_number_of_buyers > 0
        ? ((data.no_govt_buyers + data.no_private_sector_buyer) / data.total_number_of_buyers) * 100
        : 0;

    // ── C37: Contract Score — ContractCoverage / TotalBuyers (fraction) ──────────
    const contract_score_frac = data.total_number_of_buyers > 0
        ? data.contract_coverage / data.total_number_of_buyers
        : 0;

    // ── C37 (also): Payment Score — 1 - (AvgPaymentDays / 90) ───────────────────
    const payment_score_frac = Math.max(0, 1 - (data.avg_payment_days_buyers / 90));

    // ── C39–C46: Behavioral pass-through values ───────────────────────────────────
    const meeting_frequency        = data.meeting_frequency;
    const member_transparency      = data.member_info_transparency;
    const fund_utilization         = data.fund_usage;
    const kyc_compliance           = data.kyc_aml;
    const financial_oversight      = data.income_expense_checked;
    const governance_communication = data.right_to_information;
    const stakeholder_engagement   = data.community_support_level;
    const emergency_preparedness   = data.emergency_response;

    return {
        // Cash Flow
        dscr,
        seasonality_coverage,
        inventory_days,
        receivable_days,

        // Milk Supply
        milk_stability_pct,
        days_stability_pct,
        milk_loss_pct,
        yield_loss_pct,
        farmer_concentration_pct,
        collection_stability,
        payment_fairness,
        logistics_reliability,

        // Financial Strength
        net_worth,
        debt_equity,
        current_ratio,
        grant_pct,
        cash_trend,

        // Governance
        max_dpd_members,
        restructuring,
        mgmt_experience,
        internal_controls,
        audit_findings,
        lending_compliance,

        // Operational
        quality_sop_numeric,

        // Transparency
        bank_sales_pct,

        // External
        insurance_coverage,
        digital_mis,
        regulatory_compliance,
        climatic_risk,

        // Credit
        credit_history,
        max_delays_bfi,

        // Buyer
        top5_buyer_conc_pct,
        largest_buyer_conc_pct,
        stable_buyer_share_pct,
        contract_score_frac,
        payment_score_frac,

        // Loan Recovery (pass-through for model)
        member_gnpa_pct,

        // Behavioral
        meeting_frequency,
        member_transparency,
        fund_utilization,
        kyc_compliance,
        financial_oversight,
        governance_communication,
        stakeholder_engagement,
        emergency_preparedness
    };
}/**
 * calculations.js — Calculations Sheet Layer
 * Derives financial ratios and intermediate metrics from the data layer.
 * Mirrors the "Calculations Sheet" from Credit-Scoring.xlsx exactly.
 *
 * Row references for traceability (Calculations!C column):
 *   C2  DSCR
 *   C3  Seasonality Coverage
 *   C4  Inventory Days
 *   C5  Receivable Days
 *   C6  Milk Stability %
 *   C7  Days Stability %
 *   C8  Milk Loss %
 *   C9  Yield Loss %
 *   C10 Farmer Concentration %
 *   C11 Collection Stability %
 *   C12 Payment Fairness %
 *   C13 Logistics Reliability
 *   C14 Net Worth
 *   C15 Debt/Equity
 *   C16 Current Ratio
 *   C17 Grant %
 *   C18 Cash/Bank Balance Trend
 *   C19 Member GNPA %
 *   C20 Max DPD (members)
 *   C21 Restructuring
 *   C22 Mgmt Experience
 *   C23 Internal Controls
 *   C24 Audit Findings
 *   C25 Lending Policy Compliance
 *   C26 Quality SOP (numeric)
 *   C27 % Sales via Bank
 *   C28 Insurance Coverage
 *   C29 Digital MIS
 *   C30 Regulatory Compliance
 *   C31 Climatic Risk
 *   C32 Credit History (BFI)
 *   C33 Max Delays (BFI DPD)
 *   C34 Top 5 Buyer Concentration %
 *   C35 Largest Buyer Concentration %
 *   C36 Stable Buyer Share %
 *   C37 Contract Score
 *   C38 (not used)
 *   C39 Committee Meeting Frequency
 *   C40 Member Info Transparency
 *   C41 Fund Utilization Transparency
 *   C42 Member Identification & KYC
 *   C43 Financial Oversight
 *   C44 Governance Communication
 *   C45 Stakeholder Engagement
 *   C46 Operational Contingency
 */

/**
 * Run all intermediate financial metric calculations.
 * @param {Object} data - Output from transformData()
 * @returns {Object}    - All computed metrics ready for the model layer
 */
function runCalculations(data) {
    // ── C2: DSCR — EBITDA / (Principal + Interest) ────────────────────────────
    const debtService = data.annual_principal + data.annual_interest;
    const dscr = debtService > 0
        ? safeDivide(data.ebitda, debtService)
        : (data.ebitda > 0 ? 2.5 : 0);

    // ── C3: Seasonality Coverage — CashBankLastYear / LeanMonthExpense ─────────
    // (mirrors Data!D41 / Data!D28 = lastYearCash / leanMonthExp)
    const seasonality_coverage = data.lean_month_expense > 0
        ? safeDivide(data.cash_bank_balance_last_year, data.lean_month_expense)
        : 0;

    // ── C4: Inventory Days — (AvgInventory / COGS) * 365 ──────────────────────
    // Sheet: =(Data!D19/Data!D20)*365
    // Data!D19 = avg_inventory, Data!D20 = COGS = processing+packaging+transport+other_proc
    const inventory_days = data.cogs > 0
        ? (data.average_inventory / data.cogs) * 365
        : 0;

    // ── C5: Receivable Days — (AccountsReceivable / TotalRevenue) * 365 ────────
    const receivable_days = data.total_revenue > 0
        ? (data.accounts_receivable / data.total_revenue) * 365
        : 0;

    // ── C6: Milk Stability % — (LowestMonthly / AvgMonthly) * 100 ──────────────
    const milk_stability_pct = data.avg_monthly_milk_liters > 0
        ? (data.lowest_monthly_milk_liters / data.avg_monthly_milk_liters) * 100
        : 0;

    // ── C7: Days Stability % — (CollectionDays / 365) * 100 ────────────────────
    const days_stability_pct = (data.collection_days_positive / 365) * 100;

    // ── C8: Milk Loss % — (TotalMilkLoss / TotalMilkCollected) * 100 ──────────
    // Sheet: =(Data!D25/Data!D24)*100
    // Data!D24 = total_milk_collected, Data!D25 = milk_loss = collection_loss + process_loss
    const milk_loss_pct = data.total_milk_collected_liters > 0
        ? (data.total_milk_loss / data.total_milk_collected_liters) * 100
        : 0;

    // ── C9: Yield Loss % — (TotalMilkLoss / ProducedMilk) * 100 ───────────────
    // Sheet: =(Data!D25/Data!D26)*100
    // Data!D25 = total milk loss, Data!D26 = produced_milk (total-collection_loss)
    const yield_loss_pct = data.produced_milk_model_b_liters > 0
        ? (data.total_milk_loss / data.produced_milk_model_b_liters) * 100
        : 0;

    // ── C10: Farmer Concentration % — (Top5Farmers / TotalMilkCollected) * 100 ─
    const farmer_concentration_pct = data.total_milk_collected_liters > 0
        ? (data.top5_farmer_collection_liters / data.total_milk_collected_liters) * 100
        : 0;

    // ── C11: Collection Stability % — TotalMilkCollected / TotalMemberLoans ────
    const collection_stability = data.total_member_loans > 0
        ? safeDivide(data.total_milk_collected_liters, data.total_member_loans)
        : 0;

    // ── C12: Payment Fairness % — 1 - (MaxDPD / 45) ────────────────────────────
    const payment_fairness = Math.max(0, 1 - (data.max_dpd_days / 45));

    // ── C13: Logistics Reliability — fleet_availability_percent ─────────────────
    // Sheet: =Data!D38 → Data SN37 = fleet_availability_percent (Questions!D105)
    const logistics_reliability = data.fleet_availability_percent;

    // ── C14: Net Worth — TotalAssets - TotalLiabilities ─────────────────────────
    const net_worth = data.total_assets - data.total_liabilities;

    // ── C15: Debt/Equity — TotalDebt / TotalNetworth ─────────────────────────────
    const debt_equity = data.total_networth > 0
        ? safeDivide(data.total_debt, data.total_networth)
        : (data.total_debt > 0 ? 5.0 : 0);

    // ── C16: Current Ratio — CurrentAssets / CurrentLiabilities ─────────────────
    const current_ratio = data.current_liabilities > 0
        ? safeDivide(data.current_assets, data.current_liabilities)
        : (data.current_assets > 0 ? 5.0 : 0);

    // ── C17: Grant % — GrantIncome / TotalRevenue (as fraction) ─────────────────
    const grant_pct = data.total_revenue > 0
        ? safeDivide(data.grant_income, data.total_revenue)
        : 0;

    // ── C18: Cash/Bank Balance Trend — derived in dataTransform ─────────────────
    const cash_trend = data.cash_trend;  // 'UP' / 'DOWN' / 'STABLE'

    // ── C19: Member GNPA % — NPA / TotalMemberLoans (as fraction) ───────────────
    const member_gnpa_pct = data.total_member_loans > 0
        ? safeDivide(data.npa_member_loans, data.total_member_loans)
        : 0;

    // ── C20–C25: Pass-through governance values ──────────────────────────────────
    const max_dpd_members    = data.max_dpd_days;
    const restructuring      = data.restructured_loans_past3yrs;
    const mgmt_experience    = data.key_mgmt_avg_experience_years;
    const internal_controls  = data.internal_control_score;
    const audit_findings     = data.audit_findings_count;
    const lending_compliance = data.lending_policy_compliance_flag;

    // ── C26: Quality SOP — pass raw string for model string matching ─────────────
    // Sheet C26 = Data!D40 = Questions!D107 = quality_sop_score_model_b (full string)
    const quality_sop_numeric = data.quality_sop_score_model_b;  // raw string from dropdown

    // ── C27: % Sales via Bank — BankSales / TotalRevenue * 100 ─────────────────
    // Sheet: =(Data!D31/Data!D32)*100
    // Data!D31 = bank_sales, Data!D32 = Questions!D18 = Total_Revenue (NOT just total_sales)
    const bank_sales_pct = data.total_revenue > 0
        ? (data.bank_sales / data.total_revenue) * 100
        : 0;

    // ── C28–C33: Pass-through logistics/risk/credit values ───────────────────────
    const insurance_coverage     = data.insurance_coverage_flag;
    const digital_mis            = data.digital_mis_flag;
    const regulatory_compliance  = data.regulatory_compliance_flag;
    const climatic_risk          = data.climatic_risk_score;
    const credit_history         = data.credit_history_banks;
    const max_delays_bfi         = data.dpd_days_banks;

    // ── C34: Top 5 Buyer Concentration % — Top5Sales / TotalSales * 100 ─────────
    const top5_buyer_conc_pct = data.total_sales > 0
        ? (data.top5_buyers_sales / data.total_sales) * 100
        : 0;

    // ── C35: Largest Buyer Concentration % ───────────────────────────────────────
    const largest_buyer_conc_pct = data.total_sales > 0
        ? (data.largest_buyer_sales / data.total_sales) * 100
        : 0;

    // ── C36: Stable Buyer Share % — (GovtCount + LargePrivateCount) / TotalBuyers ─
    const stable_buyer_share_pct = data.total_number_of_buyers > 0
        ? ((data.no_govt_buyers + data.no_private_sector_buyer) / data.total_number_of_buyers) * 100
        : 0;

    // ── C37: Contract Score — ContractCoverage / TotalBuyers (fraction) ──────────
    const contract_score_frac = data.total_number_of_buyers > 0
        ? data.contract_coverage / data.total_number_of_buyers
        : 0;

    // ── C37 (also): Payment Score — 1 - (AvgPaymentDays / 90) ───────────────────
    const payment_score_frac = Math.max(0, 1 - (data.avg_payment_days_buyers / 90));

    // ── C39–C46: Behavioral pass-through values ───────────────────────────────────
    const meeting_frequency        = data.meeting_frequency;
    const member_transparency      = data.member_info_transparency;
    const fund_utilization         = data.fund_usage;
    const kyc_compliance           = data.kyc_aml;
    const financial_oversight      = data.income_expense_checked;
    const governance_communication = data.right_to_information;
    const stakeholder_engagement   = data.community_support_level;
    const emergency_preparedness   = data.emergency_response;

    return {
        // Cash Flow
        dscr,
        seasonality_coverage,
        inventory_days,
        receivable_days,

        // Milk Supply
        milk_stability_pct,
        days_stability_pct,
        milk_loss_pct,
        yield_loss_pct,
        farmer_concentration_pct,
        collection_stability,
        payment_fairness,
        logistics_reliability,

        // Financial Strength
        net_worth,
        debt_equity,
        current_ratio,
        grant_pct,
        cash_trend,

        // Governance
        max_dpd_members,
        restructuring,
        mgmt_experience,
        internal_controls,
        audit_findings,
        lending_compliance,

        // Operational
        quality_sop_numeric,

        // Transparency
        bank_sales_pct,

        // External
        insurance_coverage,
        digital_mis,
        regulatory_compliance,
        climatic_risk,

        // Credit
        credit_history,
        max_delays_bfi,

        // Buyer
        top5_buyer_conc_pct,
        largest_buyer_conc_pct,
        stable_buyer_share_pct,
        contract_score_frac,
        payment_score_frac,

        // Loan Recovery (pass-through for model)
        member_gnpa_pct,

        // Behavioral
        meeting_frequency,
        member_transparency,
        fund_utilization,
        kyc_compliance,
        financial_oversight,
        governance_communication,
        stakeholder_engagement,
        emergency_preparedness
    };
}
/**
 * scoringEngine.js — Pipeline Orchestrator + Shared Utilities
 *
 * FIX: collectFormInputs() now reads ALL inputs including type="hidden"
 *      so model_type and other auto-filled fields are included in the
 *      answers object. Previously hidden inputs were silently skipped,
 *      causing model_type to be blank ("") in the submitted JSON.
 *
 * Orchestrates the full local scoring pipeline:
 *   Raw Inputs → transformData() → runCalculations() → runModel() → Result
 *
 * Load order in HTML:
 *   1. scoringEngine.js   (utilities + orchestrator)
 *   2. dataTransform.js   (Data Sheet layer)
 *   3. calculations.js    (Calculations Sheet layer)
 *   4. model.js           (Model Sheet layer)
 */

// ═══════════════════════════════════════════════════════════════════════════
// Shared Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function safeNum(v) {
    const n = Number(v);
    return (Number.isFinite(n) ? n : 0);
}

function safeDivide(a, b) {
    return (b && Number.isFinite(b) && b !== 0) ? a / b : 0;
}

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function fmtNum(n) {
    return Number(n).toLocaleString('en-IN');
}

function fmtNPR(val) {
    const n = Number(val);
    if (!val || isNaN(n) || n === 0) return 'NPR 0';
    if (n >= 1e7)  return 'NPR ' + (n / 1e7).toFixed(2)  + ' Cr';
    if (n >= 1e5)  return 'NPR ' + (n / 1e5).toFixed(2)  + ' L';
    return 'NPR ' + n.toLocaleString('en-IN');
}

// ═══════════════════════════════════════════════════════════════════════════
// Form Auto-Calculation Trigger Functions
// ═══════════════════════════════════════════════════════════════════════════

function calculateTotalLoan() {
    const el = document.getElementById('total_loan');
    if (!el) return;
    el.value = safeNum(document.getElementById('existing_loan_amt')?.value) +
               safeNum(document.getElementById('proposed_loan_amt')?.value);
}

function calculateRevenue() {
    const milk    = safeNum(document.getElementById('milk_sales')?.value);
    const product = safeNum(document.getElementById('product_sales')?.value);
    const other   = safeNum(document.getElementById('other_sales')?.value);
    const grant   = safeNum(document.getElementById('grant_income')?.value);

    const totalSales = milk + product + other;
    const el15 = document.getElementById('total_sales');
    if (el15) el15.value = totalSales;

    const el17 = document.getElementById('total_revenue');
    if (el17) el17.value = totalSales + grant;
}

function calculateBuyerShares() {
    const totalSales  = safeNum(document.getElementById('total_sales')?.value)
        || (safeNum(document.getElementById('milk_sales')?.value)
          + safeNum(document.getElementById('product_sales')?.value)
          + safeNum(document.getElementById('other_sales')?.value));
    const top5        = safeNum(document.getElementById('top5_buyers_sales')?.value);
    const largest     = safeNum(document.getElementById('largest_buyer_sales')?.value);

    const el30 = document.getElementById('top5_buyer_share_percent');
    if (el30) el30.value = totalSales > 0 ? ((top5 / totalSales) * 100).toFixed(4) : 0;

    const el31 = document.getElementById('largest_buyer_share_percent');
    if (el31) el31.value = totalSales > 0 ? ((largest / totalSales) * 100).toFixed(4) : 0;
}

function calculateExpenses() {
    const overheadIds = [
        'salary_expense', 'admin_expense', 'electricity_expense',
        'fuel_expense', 'maintenance_expense', 'rent_expense', 'other_operating_expense'
    ];
    const total = overheadIds.reduce((sum, id) => sum + safeNum(document.getElementById(id)?.value), 0);
    const el = document.getElementById('total_opex');
    if (el) el.value = total;
}

function calculateAssets() {
    const cashHand   = safeNum(document.getElementById('cash_on_hand')?.value);
    const bankBal    = safeNum(document.getElementById('bank_balance')?.value);
    const totalCash  = cashHand + bankBal;
    const elCash     = document.getElementById('total_cash');
    if (elCash) elCash.value = totalCash;

    const ar      = safeNum(document.getElementById('accounts_receivable')?.value);
    const inv     = safeNum(document.getElementById('inventory')?.value);
    const prepaid = safeNum(document.getElementById('prepaid_expense')?.value);
    const oca     = safeNum(document.getElementById('other_current_assets')?.value);
    const totalCA = totalCash + ar + inv + prepaid + oca;
    const elCA    = document.getElementById('current_assets');
    if (elCA) elCA.value = totalCA;

    const fixedIds = ['land_value', 'building_value', 'plant_machinery_value',
                      'vehicle_value', 'furniture_value', 'other_fixed_assets'];
    const totalFA  = fixedIds.reduce((s, id) => s + safeNum(document.getElementById(id)?.value), 0);
    const elFA     = document.getElementById('non_current_assets');
    if (elFA) elFA.value = totalFA;

    const elTA = document.getElementById('total_assets');
    if (elTA) elTA.value = totalCA + totalFA;
}

function calculateLiabilities() {
    const ap     = safeNum(document.getElementById('accounts_payable')?.value);
    const stl    = safeNum(document.getElementById('short_term_loan')?.value);
    const acc    = safeNum(document.getElementById('accrued_expense')?.value);
    const cltd   = safeNum(document.getElementById('current_portion_long_term_debt')?.value);
    const totalCL= ap + stl + acc + cltd;
    const elCL   = document.getElementById('current_liabilities');
    if (elCL) elCL.value = totalCL;

    const ltl    = safeNum(document.getElementById('long_term_loan')?.value);
    const oltl   = safeNum(document.getElementById('other_long_term_liabilities')?.value);
    const totalLTL = ltl + oltl;
    const elLTL  = document.getElementById('non_current_liabilities');
    if (elLTL) elLTL.value = totalLTL;

    const elTL   = document.getElementById('total_liabilities');
    if (elTL) elTL.value = totalCL + totalLTL;
}

function calculateNetWorth() {
    const puc  = safeNum(document.getElementById('paid_up_capital')?.value);
    const re   = safeNum(document.getElementById('retained_earnings')?.value);
    const res  = safeNum(document.getElementById('reserves')?.value);
    const el   = document.getElementById('total_networth');
    if (el) el.value = puc + re + res;
}

function calculateMilkMetrics() {
    const collected  = safeNum(document.getElementById('total_milk_collected_liters')?.value);
    const collLoss   = safeNum(document.getElementById('milk_loss_liters_during_collection')?.value);
    const procLoss   = safeNum(document.getElementById('loss_during_process')?.value);

    const produced = Math.max(0, collected - collLoss - procLoss);
    const el80 = document.getElementById('produced_milk_model_b_liters');
    if (el80) el80.value = produced;

    const el81 = document.getElementById('avg_monthly_milk_liters');
    if (el81) el81.value = collected > 0 ? (collected / 12).toFixed(2) : 0;

    const farmers = safeNum(document.getElementById('total_number_of_farmers')?.value);
    const el90 = document.getElementById('avg_farmer_quantity_liters');
    if (el90) el90.value = farmers > 0 ? (collected / farmers).toFixed(2) : 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Orchestrator
// ═══════════════════════════════════════════════════════════════════════════

function runScoringEngine(formInputs) {
    const startTime = performance.now();

    if (typeof transformData   !== 'function') throw new Error('scoringEngine: dataTransform.js not loaded');
    if (typeof runCalculations !== 'function') throw new Error('scoringEngine: calculations.js not loaded');
    if (typeof runModel        !== 'function') throw new Error('scoringEngine: model.js not loaded');

    const data   = transformData(formInputs);
    const calc   = runCalculations(data);
    const result = runModel(calc, data);

    const elapsed = Math.round(performance.now() - startTime);
    console.info(`[ScoringEngine] Complete in ${elapsed}ms | Score: ${result.totalScore}/1000 (${result.riskCategory})`);

    result._meta = {
        elapsedMs: elapsed,
        timestamp: new Date().toISOString()
    };

    return result;
}

/**
 * Collect all current form values from the DOM into a flat object.
 *
 * FIX: Previously this only collected inputs with visible type attributes,
 *      silently skipping type="hidden". Hidden inputs hold critical auto-filled
 *      values (model_type, loan_type, total_loan, total_revenue, etc.) that the
 *      scoring engine and GAS submission both need.
 *
 *      Now ALL inputs — including hidden — are collected. script.js then
 *      overwrites model_type and customer_type with the authoritative values
 *      from `state` to guarantee they are always correct.
 */
function collectFormInputs() {
    const inputs = {};
    // Include all inputs: text, number, select, hidden
    document.querySelectorAll(
        '#questions_container input[id], ' +
        '#questions_container select[id], ' +
        '#questions_container textarea[id]'
    ).forEach(el => {
        if (!el.id) return;
        // Parse number inputs as numbers; everything else as string
        if (el.type === 'number' || el.getAttribute('type') === 'number') {
            inputs[el.id] = parseFloat(el.value) || 0;
        } else {
            inputs[el.id] = el.value || '';
        }
    });
    return inputs;
}
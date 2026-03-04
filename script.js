/* =====================================================
   DAIRY COOPERATIVE CREDIT SCORING PORTAL — script.js
   Modular JS: Routing | State | Scoring | Charts
   ===================================================== */

// =====================================================
// MODULE 1: STATE MANAGEMENT
// =====================================================

const state = {
    coopType: null,       // 'collection' | 'processing'
    customerType: null,   // 'new' | 'existing'
    currentSection: 'config',
    completedSections: new Set(),
    categoryScores: {},
    finalResults: [],
    charts: {}
};

// Route order (excluding 'config' and 'result')
function getSectionOrder() {
    const base = ['section-1','section-2','section-3','section-4','section-5','section-6','section-7','section-8'];
    if (state.customerType === 'existing') base.push('section-9');
    return base;
}

function getTotalSections() { return getSectionOrder().length; }

function getSectionIndex(sectionId) { return getSectionOrder().indexOf(sectionId); }

// =====================================================
// MODULE 2: ROUTING (Hash-based)
// =====================================================

function router() {
    const hash = window.location.hash.replace('#', '') || 'config';
    navigateTo(hash, false);
}

function navigateTo(sectionId, pushHistory = true) {
    if (sectionId !== 'config' && sectionId !== 'result' && !state.coopType) {
        sectionId = 'config';
    }
    state.currentSection = sectionId;
    if (pushHistory && window.location.hash !== '#' + sectionId) {
        history.pushState({ section: sectionId }, '', '#' + sectionId);
    }
    showSection(sectionId);
    updateSidebar(sectionId);
    updateProgress(sectionId);
    updatePagination(sectionId);
    updateHeaderStep(sectionId);
}

window.addEventListener('hashchange', router);
window.addEventListener('popstate', router);

// =====================================================
// MODULE 3: SECTION DISPLAY
// =====================================================

function showSection(sectionId) {
    // Hide all form sections and result
    document.querySelectorAll('.form-section, .result-section').forEach(el => {
        el.classList.remove('active');
    });
    // Show config always
    document.getElementById('section_config').style.display = '';

    if (sectionId === 'config') {
        document.getElementById('pagination_bar').style.display = 'none';
        return;
    }

    if (sectionId === 'result') {
        document.getElementById('section_result').classList.add('active');
        document.getElementById('pagination_bar').style.display = 'none';
        return;
    }

    // Map section-N to DOM id section_N
    const domId = sectionId.replace('section-', 'section_');
    const el = document.getElementById(domId);
    if (el) el.classList.add('active');
    document.getElementById('pagination_bar').style.display = 'flex';
}

// =====================================================
// MODULE 4: SIDEBAR & PROGRESS
// =====================================================

function updateSidebar(sectionId) {
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        btn.classList.remove('active');
        const s = btn.dataset.section;
        if (s === sectionId) btn.classList.add('active');
        if (state.completedSections.has(s)) btn.classList.add('completed');
        else btn.classList.remove('completed');
    });
}

function unlockSidebarItems() {
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        btn.classList.remove('disabled');
    });
}

function updateProgress(sectionId) {
    const total = getTotalSections();
    const idx = getSectionIndex(sectionId);
    let pct = 0;
    if (sectionId === 'result') pct = 100;
    else if (idx >= 0) pct = Math.round(((idx) / total) * 100);

    document.getElementById('global_progress_fill').style.width = pct + '%';
    document.getElementById('sidebar_progress_fill').style.width = pct + '%';
    document.getElementById('sidebar_progress_text').textContent =
        sectionId === 'result' ? 'Assessment complete' :
        idx >= 0 ? `Section ${idx + 1} of ${total}` : 'Configure to begin';

    // Dots
    const dotsContainer = document.getElementById('section_dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        getSectionOrder().forEach((s, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            if (state.completedSections.has(s)) dot.classList.add('completed');
            if (s === sectionId) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        });
    }
}

function updateHeaderStep(sectionId) {
    const el = document.getElementById('header_step');
    const idx = getSectionIndex(sectionId);
    const total = getTotalSections();
    if (sectionId === 'config') {
        el.innerHTML = '<span>Configure to start</span>';
    } else if (sectionId === 'result') {
        el.innerHTML = '<span class="step-pill">Result</span>';
    } else {
        el.innerHTML = `<span class="step-pill">Section ${idx + 1} / ${total}</span>`;
    }
}

// =====================================================
// MODULE 5: PAGINATION (Next / Prev)
// =====================================================

function updatePagination(sectionId) {
    const bar = document.getElementById('pagination_bar');
    const btnPrev = document.getElementById('btn_prev');
    const btnNext = document.getElementById('btn_next');
    const btnCalc = document.getElementById('btn_calculate');
    const label = document.getElementById('pagination_label');

    if (sectionId === 'config' || sectionId === 'result') {
        bar.style.display = 'none';
        return;
    }
    bar.style.display = 'flex';

    const order = getSectionOrder();
    const idx = getSectionIndex(sectionId);
    const total = order.length;

    label.textContent = `Section ${idx + 1} of ${total}`;
    btnPrev.disabled = (idx === 0);

    const isLast = (idx === total - 1);
    btnNext.classList.toggle('hidden', isLast);
    btnCalc.classList.toggle('hidden', !isLast);

    if (!isLast) {
        btnNext.disabled = false; // will be re-evaluated on validate
    }
}

// =====================================================
// MODULE 5b: VALIDATION
// =====================================================

/**
 * Required fields per section. Each entry is:
 *   { id, type: 'number'|'select'|'text' }
 * Only truly critical fields are listed — enough to
 * ensure meaningful data exists before advancing.
 */
const SECTION_REQUIRED = {
    'section-2': [
        { id: 'revenue_total',        type: 'number' },
        { id: 'ebitda',               type: 'number' },
        { id: 'repayment_principal',   type: 'number' },
        { id: 'repayment_interest',    type: 'number' },
        { id: 'assets_total',          type: 'number' },
        { id: 'liabilities_total',     type: 'number' },
        { id: 'loan_proposed',         type: 'number' }
    ],
    'section-3': [
        { id: 'milk_monthly_avg',  type: 'number' },
        { id: 'milk_monthly_low',  type: 'number' },
        { id: 'milk_total',        type: 'number' }
    ],
    'section-4': [
        { id: 'loans_members_total',   type: 'number' },
        { id: 'collateral_primary',    type: 'number' },
        { id: 'sales_total',           type: 'number' }
    ],
    'section-5': [
        { id: 'buyer_total_count',     type: 'number' },
        { id: 'buyer_top3_sales',      type: 'number' },
        { id: 'buyer_default_history', type: 'select' }
    ],
    'section-6': [
        { id: 'mgmt_experience',   type: 'number' },
        { id: 'internal_controls', type: 'select' },
        { id: 'audit_findings',    type: 'select' },
        { id: 'lending_compliance',type: 'select' }
    ],
    'section-7': [
        { id: 'cash_last_year',            type: 'number' },
        { id: 'farmers_total_collection',  type: 'number' },
        { id: 'farmers_count',             type: 'number' },
        { id: 'days_collection',           type: 'number' }
    ]
};

/**
 * Validate required fields for the current section.
 * Returns true if valid, false + highlights empties if invalid.
 */
function validateSection(sectionId) {
    const required = SECTION_REQUIRED[sectionId];
    if (!required) return true; // no rules for this section

    let valid = true;
    required.forEach(({ id, type }) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Skip fields hidden by conditional logic
        if (el.closest('.hidden') || el.closest('[class*="hidden"]') ||
            el.offsetParent === null) return;

        const isEmpty = type === 'number'
            ? (el.value === '' || el.value === null)
            : (el.value === '' || el.value === null);

        if (isEmpty) {
            valid = false;
            el.classList.add('field-error');
            el.addEventListener('input', () => el.classList.remove('field-error'), { once: true });
            el.addEventListener('change', () => el.classList.remove('field-error'), { once: true });
        }
    });

    if (!valid) {
        // Shake the Next button
        const btn = document.getElementById('btn_next');
        btn.classList.add('shake');
        btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });

        // Scroll to first empty field
        const firstError = document.querySelector('.field-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
}

function navigateNext() {
    // Validate before advancing
    if (!validateSection(state.currentSection)) return;

    const order = getSectionOrder();
    const idx = getSectionIndex(state.currentSection);
    if (idx < order.length - 1) {
        state.completedSections.add(state.currentSection);
        navigateTo(order[idx + 1]);
    }
}

function navigatePrev() {
    const order = getSectionOrder();
    const idx = getSectionIndex(state.currentSection);
    if (idx > 0) navigateTo(order[idx - 1]);
}

function handleCalculate() {
    // Also validate last section before calculating
    if (!validateSection(state.currentSection)) return;
    state.completedSections.add(state.currentSection);
    calculateScores();
}

// =====================================================
// MODULE 6: SIDEBAR CLICK & MOBILE
// =====================================================

function handleSidebarClick(sectionId) {
    if (!state.coopType && sectionId !== 'config') return;
    navigateTo(sectionId);
    if (window.innerWidth <= 768) closeSidebar();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar_overlay').classList.toggle('show');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar_overlay').classList.remove('show');
}

// =====================================================
// MODULE 7: CONFIGURATION PANEL
// =====================================================

function setCoopType(type) {
    state.coopType = type;
    document.querySelectorAll('input[name="coop_type"]').forEach(el => {
        el.closest('.radio-card').classList.remove('selected');
    });
    document.getElementById(type === 'collection' ? 'type_collection' : 'type_processing')
        .closest('.radio-card').classList.add('selected');
    // Clear error on this group
    const grp = document.getElementById('config_group_coop');
    if (grp) grp.classList.remove('has-error');
    onConfigChange();
}

function setCustomerType(type) {
    state.customerType = type;
    document.querySelectorAll('input[name="customer_type"]').forEach(el => {
        el.closest('.radio-card').classList.remove('selected');
    });
    document.getElementById(type === 'new' ? 'cust_new' : 'cust_existing')
        .closest('.radio-card').classList.add('selected');
    // Clear error on this group
    const grp = document.getElementById('config_group_cust');
    if (grp) grp.classList.remove('has-error');
    onConfigChange();
}

function onConfigChange() {
    const alert = document.getElementById('config_alert');
    const coopGrp = document.getElementById('config_group_coop');
    const custGrp = document.getElementById('config_group_cust');

    if (!state.coopType || !state.customerType) {
        alert.classList.remove('hidden');
        // Highlight missing groups
        if (coopGrp) coopGrp.classList.toggle('has-error', !state.coopType);
        if (custGrp) custGrp.classList.toggle('has-error', !state.customerType);
        return;
    }
    alert.classList.add('hidden');
    if (coopGrp) coopGrp.classList.remove('has-error');
    if (custGrp) custGrp.classList.remove('has-error');

    applyFieldVisibility();
    unlockSidebarItems();
    updateSection9Nav();
    document.getElementById('model_type').value =
        state.coopType === 'processing' ? 'Processing' : 'Collection';
    document.getElementById('result_coop_type').textContent =
        state.coopType === 'processing' ? 'Collection & Processing' : 'Collection Only';
    document.getElementById('result_cust_type').textContent =
        state.customerType === 'existing' ? 'Existing Customer' : 'New Customer';

    // Auto-navigate to section 1 if on config
    if (state.currentSection === 'config') {
        navigateTo('section-1');
    }
}

function applyFieldVisibility() {
    // Model B fields
    document.querySelectorAll('.model-b-field').forEach(el => {
        el.classList.toggle('hidden', state.coopType !== 'processing');
    });
    // Existing customer fields
    document.querySelectorAll('.existing-field').forEach(el => {
        el.classList.toggle('hidden', state.customerType !== 'existing');
    });
}

function updateSection9Nav() {
    const btn = document.getElementById('nav_section9');
    if (btn) btn.classList.toggle('hidden', state.customerType !== 'existing');
}

// =====================================================
// MODULE 8: RESULT TAB SWITCHING
// =====================================================

function showResultTab(tabName, btn) {
    document.querySelectorAll('.result-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.result-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab_' + tabName).classList.add('active');
    if (btn) btn.classList.add('active');
    if (tabName === 'charts') renderCharts();
}

// =====================================================
// MODULE 9: SCORING WEIGHTS & ENGINE
// =====================================================

const weights = {
    dscr:               { weight: 5,    maxScore: 5,  name: 'DSCR',                        category: 'Cash Flow & Loan Repayment' },
    seasonality:        { weight: 5,    maxScore: 5,  name: 'Seasonality Coverage',         category: 'Cash Flow & Loan Repayment' },
    inventory_days:     { weight: 5,    maxScore: 5,  name: 'Inventory Days',               category: 'Cash Flow & Loan Repayment' },
    receivable_days:    { weight: 5,    maxScore: 5,  name: 'Receivable Days',              category: 'Cash Flow & Loan Repayment' },
    milk_stability:     { weight: 3,    maxScore: 5,  name: 'Milk Stability %',             category: 'Milk Supply & Operational Stability' },
    days_stability:     { weight: 3,    maxScore: 5,  name: 'Days Stability %',             category: 'Milk Supply & Operational Stability' },
    milk_loss:          { weight: 2,    maxScore: 5,  name: 'Milk Loss %',                  category: 'Milk Supply & Operational Stability' },
    yield_loss:         { weight: 2,    maxScore: 5,  name: 'Yield Loss % [Model B]',       category: 'Milk Supply & Operational Stability' },
    farmer_concentration:{ weight:1.25, maxScore: 5,  name: 'Farmer Concentration %',       category: 'Milk Supply & Operational Stability' },
    collection_stability:{ weight:1.25, maxScore: 5,  name: 'Collection Stability %',       category: 'Milk Supply & Operational Stability' },
    payment_fairness:   { weight: 1.25, maxScore: 5,  name: 'Payment Fairness %',           category: 'Milk Supply & Operational Stability' },
    logistics:          { weight: 1.25, maxScore: 10, name: 'Logistics Reliability',        category: 'Milk Supply & Operational Stability' },
    net_worth:          { weight: 4,    maxScore: 5,  name: 'Net Worth',                    category: 'Financial Strength' },
    debt_equity:        { weight: 4,    maxScore: 5,  name: 'Debt/Equity Ratio',            category: 'Financial Strength' },
    current_ratio:      { weight: 3,    maxScore: 5,  name: 'Current Ratio',               category: 'Financial Strength' },
    grant_dependence:   { weight: 2,    maxScore: 5,  name: 'Grant Dependence %',           category: 'Financial Strength' },
    cash_trend:         { weight: 2,    maxScore: 5,  name: 'Cash/Bank Trend',              category: 'Financial Strength' },
    member_gnpa:        { weight: 5,    maxScore: 5,  name: 'Member GNPA %',               category: 'Loan Recovery & Member Credit Risk' },
    recovery_rate:      { weight: 5,    maxScore: 5,  name: 'Recovery % via Milk',         category: 'Loan Recovery & Member Credit Risk' },
    max_dpd:            { weight: 2.5,  maxScore: 5,  name: 'Max DPD (Days)',              category: 'Loan Recovery & Member Credit Risk' },
    restructuring:      { weight: 2.5,  maxScore: 5,  name: 'Restructuring Count',         category: 'Loan Recovery & Member Credit Risk' },
    buyer_concentration:{ weight: 4,    maxScore: 5,  name: 'Buyer Concentration %',       category: 'Buyer Concentration Risk' },
    buyer_quality_score:{ weight: 4,    maxScore: 5,  name: 'Buyer Quality Score',         category: 'Buyer Concentration Risk' },
    buyer_payment_behavior:{weight:2,   maxScore: 5,  name: 'Buyer Payment Behavior',      category: 'Buyer Concentration Risk' },
    mgmt_exp:           { weight: 2.5,  maxScore: 5,  name: 'Management Experience',       category: 'Management & Governance' },
    internal_controls:  { weight: 2.5,  maxScore: 5,  name: 'Internal Controls',           category: 'Management & Governance' },
    audit_findings:     { weight: 2.5,  maxScore: 5,  name: 'Audit Findings',              category: 'Management & Governance' },
    lending_compliance: { weight: 2.5,  maxScore: 5,  name: 'Lending Policy Compliance',  category: 'Management & Governance' },
    quality_sop:        { weight: 3.5,  maxScore: 5,  name: 'Quality SOP Score',           category: 'Operational Quality' },
    bank_sales_pct:     { weight: 1.5,  maxScore: 5,  name: '% Sales via Bank',            category: 'Operational Quality' },
    primary_collateral: { weight: 5,    maxScore: 5,  name: 'Primary Collateral %',        category: 'Collateral & Security' },
    secondary_collateral:{ weight: 2,   maxScore: 5,  name: 'Secondary Collateral %',      category: 'Collateral & Security' },
    insurance:          { weight: 1.25, maxScore: 5,  name: 'Insurance Coverage',          category: 'Risk Factors' },
    digital_mis:        { weight: 1.25, maxScore: 5,  name: 'Digital MIS Adoption',        category: 'Risk Factors' },
    regulatory:         { weight: 1.25, maxScore: 5,  name: 'Regulatory Compliance',       category: 'Risk Factors' },
    climate_risk:       { weight: 1.25, maxScore: 5,  name: 'Climatic Risk',               category: 'Risk Factors' },
    credit_history:     { weight: 2.5,  maxScore: 5,  name: 'Credit History',              category: 'Credit History' },
    max_delays:         { weight: 2.5,  maxScore: 5,  name: 'Max Delays (BFI)',            category: 'Credit History' }
};

const categoryWeights = {
    'Cash Flow & Loan Repayment': 20,
    'Milk Supply & Operational Stability': 15,
    'Financial Strength': 15,
    'Loan Recovery & Member Credit Risk': 15,
    'Buyer Concentration Risk': 10,
    'Management & Governance': 10,
    'Operational Quality': 5,
    'Collateral & Security': 5,
    'Risk Factors': 5,
    'Credit History': 5
};

const categoryDescriptions = {
    'Cash Flow & Loan Repayment': 'Ability to service debt from operating cash flows and manage seasonal variations',
    'Milk Supply & Operational Stability': 'Consistency of milk collection, operational continuity, and supply chain efficiency',
    'Financial Strength': 'Balance sheet health, liquidity position, and capital adequacy',
    'Loan Recovery & Member Credit Risk': 'Effectiveness of internal lending operations and recovery mechanisms',
    'Buyer Concentration Risk': 'Diversification and reliability of dairy buyers, payment behavior, and contract coverage',
    'Management & Governance': 'Quality of leadership, internal controls, and compliance culture',
    'Operational Quality': 'Adherence to SOPs, quality standards, and financial transparency',
    'Collateral & Security': 'Asset coverage and security strength for the proposed facility',
    'Risk Factors': 'Insurance coverage, digital adoption, regulatory compliance, and external risks',
    'Credit History': 'Historical repayment behavior and banking track record'
};

function gv(id) {
    const el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
}
function gi(id) {
    const el = document.getElementById(id);
    return el ? (parseInt(el.value) || 0) : 0;
}
function gs(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function calculateBuyerConcentrationRisk(inp) {
    const scores = {}, calcs = {};
    calcs.buyer_concentration = inp.totalSales > 0 ? (inp.buyerTop3Sales / inp.totalSales) * 100 : 0;
    scores.buyer_concentration = calcs.buyer_concentration <= 30 ? 5 : calcs.buyer_concentration <= 45 ? 4 : calcs.buyer_concentration <= 60 ? 3 : calcs.buyer_concentration <= 75 ? 2 : 1;

    const govtB = inp.buyerGovtCount || 0, largeP = inp.buyerLargePrivate || 0, smallU = inp.buyerSmallUncertain || 0, totalB = inp.buyerTotalCount || 1;
    const wScore = govtB * 5 + largeP * 4 + smallU * 1;
    calcs.buyer_quality_raw = (wScore / (totalB * 5)) * 100;
    scores.buyer_quality_score = calcs.buyer_quality_raw >= 80 ? 5 : calcs.buyer_quality_raw >= 65 ? 4 : calcs.buyer_quality_raw >= 50 ? 3 : calcs.buyer_quality_raw >= 35 ? 2 : 1;

    const pd = inp.buyerPaymentDays || 0;
    let ps = pd <= 15 ? 5 : pd <= 30 ? 4 : pd <= 45 ? 3 : pd <= 60 ? 2 : 1;
    const dp = { none: 0, minor: -0.5, moderate: -1.5, severe: -3 };
    calcs.buyer_payment_score = Math.max(0, ps + (dp[inp.buyerDefaultHistory] || 0));
    scores.buyer_payment_behavior = Math.round(calcs.buyer_payment_score);
    return { scores, calcs };
}

function calculateScores() {
    if (!state.coopType || !state.customerType) { alert('Please configure cooperative type and customer status first.'); return; }

    const inp = {
        revenue: gv('revenue_total'), ebitda: gv('ebitda'), principal: gv('repayment_principal'),
        interest: gv('repayment_interest'), assets: gv('assets_total'), liabilities: gv('liabilities_total'),
        currentAssets: gv('assets_current'), currentLiabilities: gv('liabilities_current'),
        totalDebt: gv('debt_total'), equity: gv('equity'), grantIncome: gv('income_grant'),
        cogs: gv('cogs'), inventory: gv('inventory_avg'), ar: gv('ar_total'),
        cashLast: gv('cash_last_year'), cashPrev: gv('cash_prev_year'), leanExpenses: gv('expenses_lean'),
        proposedLoan: gv('loan_proposed'), milkAvg: gv('milk_monthly_avg'), milkLow: gv('milk_monthly_low'),
        milkTotal: gv('milk_total'), milkLoss: gv('milk_loss'), milkProduced: gv('milk_produced'),
        daysCollection: gi('days_collection'), top5Farmers: gv('farmers_top5'),
        totalFarmerCollection: gv('farmers_total_collection'), highestFarmer: gv('farmer_highest'),
        farmerCount: gi('farmers_count') || 1, memberLoans: gv('loans_members_total'),
        npaLoans: gv('loans_npa'), recoveryMilk: gv('recovery_milk'),
        collateralPrimary: gv('collateral_primary'), collateralSecondary: gv('collateral_secondary'),
        bankSales: gv('sales_bank'), totalSales: gv('sales_total'),
        buyerTotalCount: gi('buyer_total_count') || 1, buyerTop3Sales: gv('buyer_top3_sales'),
        buyerSingleMax: gv('buyer_single_max'), buyerGovtCount: gi('buyer_govt_count'),
        buyerLargePrivate: gi('buyer_large_private'), buyerSmallUncertain: gi('buyer_small_uncertain'),
        buyerPaymentDays: gi('buyer_payment_days'), buyerDefaultHistory: gs('buyer_default_history'),
        buyerContractCoverage: gv('buyer_contract_coverage'),
        mgmtExp: gi('mgmt_experience'), internalControls: gs('internal_controls'),
        auditFindings: gs('audit_findings'), lendingCompliance: gs('lending_compliance'),
        fleet: gs('fleet_available'), storage: gs('storage_available'), qualitySop: gs('quality_sop'),
        maxDpd: gi('max_dpd_days'), restructures: gi('restructures'), creditHistory: gs('credit_history'),
        insurance: gs('insurance'), digital: gs('digital_mis'), regulatory: gs('regulatory'), climate: gs('climate_risk')
    };

    const calcs = {}, scores = {};

    // === Cash Flow ===
    const totalDS = inp.principal + inp.interest;
    calcs.dscr = totalDS > 0 ? inp.ebitda / totalDS : 0;
    scores.dscr = calcs.dscr >= 2.0 ? 5 : calcs.dscr >= 1.75 ? 4 : calcs.dscr >= 1.5 ? 3 : calcs.dscr >= 1.25 ? 2 : calcs.dscr >= 1.0 ? 1 : 0;

    calcs.seasonality = inp.leanExpenses > 0 ? inp.cashLast / inp.leanExpenses : 0;
    scores.seasonality = calcs.seasonality >= 3 ? 5 : calcs.seasonality >= 2 ? 4 : calcs.seasonality >= 1.5 ? 3 : calcs.seasonality >= 1 ? 2 : calcs.seasonality >= 0.5 ? 1 : 0;

    calcs.inventory_days = inp.cogs > 0 ? (inp.inventory / inp.cogs) * 365 : 0;
    scores.inventory_days = calcs.inventory_days <= 15 ? 5 : calcs.inventory_days <= 30 ? 4 : calcs.inventory_days <= 45 ? 3 : calcs.inventory_days <= 60 ? 2 : 1;

    calcs.receivable_days = inp.revenue > 0 ? (inp.ar / inp.revenue) * 365 : 0;
    scores.receivable_days = calcs.receivable_days <= 15 ? 5 : calcs.receivable_days <= 30 ? 4 : calcs.receivable_days <= 45 ? 3 : calcs.receivable_days <= 60 ? 2 : 0;

    // === Milk ===
    calcs.milk_stability = inp.milkAvg > 0 ? (inp.milkLow / inp.milkAvg) * 100 : 0;
    scores.milk_stability = calcs.milk_stability >= 90 ? 5 : calcs.milk_stability >= 80 ? 4 : calcs.milk_stability >= 70 ? 3 : calcs.milk_stability >= 60 ? 2 : 1;

    calcs.days_stability = (inp.daysCollection / 365) * 100;
    scores.days_stability = calcs.days_stability >= 95 ? 5 : calcs.days_stability >= 90 ? 4 : calcs.days_stability >= 85 ? 3 : calcs.days_stability >= 80 ? 2 : 1;

    calcs.milk_loss = inp.milkTotal > 0 ? (inp.milkLoss / inp.milkTotal) * 100 : 0;
    scores.milk_loss = calcs.milk_loss <= 2 ? 5 : calcs.milk_loss <= 5 ? 4 : calcs.milk_loss <= 8 ? 3 : calcs.milk_loss <= 12 ? 2 : 1;

    if (state.coopType === 'processing' && inp.milkProduced > 0) {
        calcs.yield_loss = (inp.milkLoss / inp.milkProduced) * 100;
        scores.yield_loss = calcs.yield_loss <= 2 ? 5 : calcs.yield_loss <= 5 ? 4 : calcs.yield_loss <= 8 ? 3 : calcs.yield_loss <= 12 ? 2 : 1;
    } else { calcs.yield_loss = 0; scores.yield_loss = 0; }

    calcs.farmer_concentration = inp.totalFarmerCollection > 0 ? (inp.top5Farmers / inp.totalFarmerCollection) * 100 : 0;
    scores.farmer_concentration = calcs.farmer_concentration <= 10 ? 5 : calcs.farmer_concentration <= 20 ? 4 : calcs.farmer_concentration <= 30 ? 3 : calcs.farmer_concentration <= 40 ? 2 : 1;

    calcs.collection_stability = inp.memberLoans > 0 ? (inp.totalFarmerCollection / inp.memberLoans) * 100 : 0;
    scores.collection_stability = calcs.collection_stability >= 200 ? 5 : calcs.collection_stability >= 150 ? 4 : calcs.collection_stability >= 100 ? 3 : calcs.collection_stability >= 50 ? 2 : 1;

    const avgFarmer = inp.farmerCount > 0 ? inp.totalFarmerCollection / inp.farmerCount : 0;
    calcs.payment_fairness = inp.highestFarmer > 0 ? (avgFarmer / inp.highestFarmer) * 100 : 0;
    scores.payment_fairness = calcs.payment_fairness >= 80 ? 5 : calcs.payment_fairness >= 60 ? 4 : calcs.payment_fairness >= 40 ? 3 : calcs.payment_fairness >= 20 ? 2 : 1;

    calcs.logistics = (inp.fleet === 'yes' ? 5 : 0) + (inp.storage === 'yes' ? 5 : 0);
    scores.logistics = calcs.logistics;

    // === Financial ===
    calcs.net_worth = inp.assets - inp.liabilities;
    const wc = inp.proposedLoan > 0 ? calcs.net_worth / inp.proposedLoan : 0;
    scores.net_worth = wc >= 5 ? 5 : wc >= 3 ? 4 : wc >= 2 ? 3 : wc >= 1 ? 2 : calcs.net_worth > 0 ? 1 : 0;

    calcs.debt_equity = inp.equity > 0 ? inp.totalDebt / inp.equity : 999;
    scores.debt_equity = calcs.debt_equity <= 0.5 ? 5 : calcs.debt_equity <= 1.0 ? 4 : calcs.debt_equity <= 1.5 ? 3 : calcs.debt_equity <= 2.0 ? 2 : 1;

    calcs.current_ratio = inp.currentLiabilities > 0 ? inp.currentAssets / inp.currentLiabilities : 0;
    scores.current_ratio = calcs.current_ratio >= 2.0 ? 5 : calcs.current_ratio >= 1.5 ? 4 : calcs.current_ratio >= 1.25 ? 3 : calcs.current_ratio >= 1.0 ? 2 : 0;

    calcs.grant_pct = inp.revenue > 0 ? (inp.grantIncome / inp.revenue) * 100 : 0;
    scores.grant_dependence = calcs.grant_pct <= 5 ? 5 : calcs.grant_pct <= 10 ? 4 : calcs.grant_pct <= 20 ? 3 : calcs.grant_pct <= 30 ? 2 : 1;

    calcs.cash_trend = inp.cashPrev > 0 ? ((inp.cashLast - inp.cashPrev) / inp.cashPrev) * 100 : 0;
    scores.cash_trend = calcs.cash_trend > 10 ? 5 : calcs.cash_trend >= 0 ? 3 : calcs.cash_trend > -10 ? 2 : 1;

    // === Loan Recovery ===
    calcs.gnpa_pct = inp.memberLoans > 0 ? (inp.npaLoans / inp.memberLoans) * 100 : 0;
    scores.member_gnpa = calcs.gnpa_pct <= 2 ? 5 : calcs.gnpa_pct <= 5 ? 4 : calcs.gnpa_pct <= 10 ? 3 : calcs.gnpa_pct <= 15 ? 2 : 0;

    calcs.recovery_pct = inp.memberLoans > 0 ? (inp.recoveryMilk / inp.memberLoans) * 100 : 0;
    scores.recovery_rate = calcs.recovery_pct >= 95 ? 5 : calcs.recovery_pct >= 90 ? 4 : calcs.recovery_pct >= 85 ? 3 : calcs.recovery_pct >= 80 ? 2 : 1;

    scores.max_dpd = inp.maxDpd === 0 ? 5 : inp.maxDpd <= 5 ? 4 : inp.maxDpd <= 15 ? 3 : inp.maxDpd <= 30 ? 2 : 0;
    scores.restructuring = inp.restructures === 0 ? 5 : inp.restructures === 1 ? 3 : 0;

    // === Buyer Risk ===
    const buyerRisk = calculateBuyerConcentrationRisk(inp);
    Object.assign(scores, buyerRisk.scores);
    Object.assign(calcs, buyerRisk.calcs);

    // === Management ===
    scores.mgmt_exp = inp.mgmtExp >= 10 ? 5 : inp.mgmtExp >= 8 ? 4 : inp.mgmtExp >= 5 ? 3 : inp.mgmtExp >= 2 ? 2 : 1;
    scores.internal_controls = inp.internalControls === 'robust' ? 5 : inp.internalControls === 'adequate' ? 3 : 1;
    scores.audit_findings = inp.auditFindings === 'none' ? 5 : inp.auditFindings === 'few' ? 4 : inp.auditFindings === 'some' ? 2 : 1;
    scores.lending_compliance = inp.lendingCompliance === 'yes' ? 5 : inp.lendingCompliance === 'partial' ? 3 : 0;

    // === Operational ===
    if (state.coopType === 'processing') {
        const sopMap = { consistent: 5, few_gaps: 3, large_gaps: 1 };
        scores.quality_sop = sopMap[inp.qualitySop] || 0;
    } else { scores.quality_sop = 0; }

    calcs.bank_sales_pct = inp.totalSales > 0 ? (inp.bankSales / inp.totalSales) * 100 : 0;
    scores.bank_sales_pct = calcs.bank_sales_pct >= 90 ? 5 : calcs.bank_sales_pct >= 75 ? 4 : calcs.bank_sales_pct >= 50 ? 3 : calcs.bank_sales_pct >= 25 ? 2 : 1;

    // === Collateral ===
    calcs.primary_collateral = inp.proposedLoan > 0 ? (inp.collateralPrimary / inp.proposedLoan) * 100 : 0;
    scores.primary_collateral = calcs.primary_collateral >= 200 ? 5 : calcs.primary_collateral >= 150 ? 4 : calcs.primary_collateral >= 125 ? 3 : calcs.primary_collateral >= 100 ? 2 : 0;

    calcs.secondary_collateral = inp.proposedLoan > 0 ? (inp.collateralSecondary / inp.proposedLoan) * 100 : 0;
    scores.secondary_collateral = calcs.secondary_collateral >= 200 ? 5 : calcs.secondary_collateral >= 150 ? 4 : calcs.secondary_collateral >= 100 ? 3 : calcs.secondary_collateral >= 50 ? 2 : 0;

    // === Risk Factors ===
    scores.insurance = inp.insurance === 'yes' ? 5 : 0;
    scores.digital_mis = inp.digital === 'yes' ? 5 : inp.digital === 'partial' ? 3 : 1;
    scores.regulatory = inp.regulatory === 'full' ? 5 : inp.regulatory === 'partial' ? 3 : 0;
    scores.climate_risk = inp.climate === 'low' ? 5 : inp.climate === 'medium' ? 3 : 1;

    // === Credit History (existing only) ===
    if (state.customerType === 'existing') {
        scores.credit_history = inp.creditHistory === 'excellent' ? 5 : inp.creditHistory === 'good' ? 4 : inp.creditHistory === 'satisfactory' ? 3 : inp.creditHistory === 'fair' ? 2 : 0;
        const mdBfi = gs('max_dpd_bfi');
        scores.max_delays = mdBfi === 'timely' ? 5 : mdBfi === 'delay_30' ? 3 : mdBfi === 'delay_60' ? 1 : 0;
    } else { scores.credit_history = 0; scores.max_delays = 0; }

    // === Aggregate ===
    let totalWeighted = 0;
    let maxPossible = 0;
    const results = [];
    state.categoryScores = {};
    for (const cat of Object.keys(categoryWeights)) {
        state.categoryScores[cat] = { score: 0, max: 0, weight: categoryWeights[cat] };
    }

    const unitMap = { dscr:'ratio', seasonality:'months', inventory_days:'days', receivable_days:'days', milk_stability:'%', days_stability:'%', milk_loss:'%', yield_loss:'%', farmer_concentration:'%', collection_stability:'%', payment_fairness:'%', logistics:'score', net_worth:'NPR', debt_equity:'ratio', current_ratio:'ratio', grant_dependence:'%', cash_trend:'% change', member_gnpa:'%', recovery_rate:'%', primary_collateral:'%', secondary_collateral:'%', bank_sales_pct:'%', buyer_concentration:'%', buyer_quality_score:'score', buyer_payment_behavior:'score' };

    for (const [key, cfg] of Object.entries(weights)) {
        if ((key === 'yield_loss' || key === 'quality_sop') && state.coopType !== 'processing') continue;
        if ((key === 'credit_history' || key === 'max_delays') && state.customerType !== 'existing') continue;
        const score = scores[key] || 0;
        const weighted = (score / cfg.maxScore) * cfg.weight;
        totalWeighted += weighted;
        maxPossible += cfg.weight;
        if (state.categoryScores[cfg.category]) {
            state.categoryScores[cfg.category].score += weighted;
            state.categoryScores[cfg.category].max += cfg.weight;
        }
        results.push({ key, name: cfg.name, category: cfg.category, weight: cfg.weight, rawScore: score, maxScore: cfg.maxScore, weightedScore: weighted, calculation: calcs[key] !== undefined ? Number(calcs[key]).toFixed(2) : null, unit: unitMap[key] || '' });
    }

    state.finalResults = results;
    displayResults(totalWeighted, results);
}

// =====================================================
// MODULE 10: DISPLAY RESULTS
// =====================================================

function getRating(score) {
    if (score >= 75) return { label:'EXCELLENT', cssClass:'excellent', color:'var(--success)', badge:'score-excellent' };
    if (score >= 60) return { label:'GOOD',      cssClass:'good',      color:'#2563eb',        badge:'score-good' };
    if (score >= 45) return { label:'MODERATE',  cssClass:'moderate',  color:'var(--warning)',  badge:'score-average' };
    return               { label:'HIGH RISK',  cssClass:'high-risk', color:'var(--danger)',   badge:'score-poor' };
}

function displayResults(totalScore, results) {
    const rating = getRating(totalScore);

    // Hero
    document.getElementById('result_score_number').textContent = totalScore.toFixed(2);
    document.getElementById('result_risk_label').textContent = rating.label;
    const badge = document.getElementById('result_risk_badge');
    badge.className = 'risk-badge ' + rating.cssClass;
    document.getElementById('result_coop_name').textContent = document.getElementById('coop_name').value || '—';

    // Benchmark
    setTimeout(() => {
        const fill = document.getElementById('benchmark_fill');
        fill.style.width = totalScore + '%';
        fill.style.background = rating.color;
        fill.textContent = totalScore.toFixed(1) + '%';
    }, 150);

    const bText = document.getElementById('benchmark_text');
    bText.textContent = totalScore >= 75 ? 'Significantly Above Average' : totalScore >= 60 ? 'Above Average' : totalScore >= 45 ? 'Average – Caution Advised' : 'Below Average – High Risk';
    bText.style.color = rating.color;

    // Category Analysis Cards
    const analysisEl = document.getElementById('category_analysis');
    analysisEl.innerHTML = '';
    for (const [cat, data] of Object.entries(state.categoryScores)) {
        if (data.max === 0) continue;
        const pct = (data.score / data.weight) * 100;
        let status, statusClass, cardClass;
        if (pct >= 80) { status = 'Strong';           statusClass = 'status-excellent'; cardClass = 'card-good'; }
        else if (pct >= 60) { status = 'Adequate';    statusClass = 'status-good';      cardClass = 'card-good'; }
        else if (pct >= 40) { status = 'Needs Attention'; statusClass = 'status-moderate'; cardClass = 'card-warning'; }
        else               { status = 'Critical';     statusClass = 'status-poor';      cardClass = 'card-critical'; }
        const scoreColor = pct >= 60 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
        const card = document.createElement('div');
        card.className = `analysis-card ${cardClass}`;
        card.innerHTML = `
            <div class="analysis-header">
                <div class="analysis-category">${cat}</div>
                <div class="analysis-score" style="color:${scoreColor}">${data.score.toFixed(1)}/${data.weight}</div>
            </div>
            <span class="analysis-status ${statusClass}">${status}</span>
            <div class="score-bar"><div class="score-fill" style="width:${pct}%;background:${scoreColor}"></div></div>
            <div class="analysis-details">${categoryDescriptions[cat] || ''}</div>`;
        analysisEl.appendChild(card);
    }

    // Decision Matrix
    const decisions = [
        { label: 'Risk Assessment',    value: rating.label },
        { label: 'Overall Score',      value: totalScore.toFixed(2) + '/100' },
        { label: 'Primary Risk Area',  value: getPrimaryRiskCategory() },
        { label: 'Recommended Action', value: getRecommendedAction(totalScore) },
        { label: 'Monitoring Level',   value: totalScore >= 75 ? 'Standard' : totalScore >= 60 ? 'Enhanced' : 'Intensive' },
        { label: 'Review Frequency',   value: totalScore >= 75 ? 'Annual' : totalScore >= 60 ? 'Semi-Annual' : 'Quarterly' }
    ];
    const dGrid = document.getElementById('decision_grid');
    dGrid.innerHTML = '';
    decisions.forEach(d => {
        const item = document.createElement('div');
        item.className = 'decision-item';
        item.innerHTML = `<div class="decision-label">${d.label}</div><div class="decision-value" style="color:${rating.color}">${d.value}</div>`;
        dGrid.appendChild(item);
    });

    // Strengths & Weaknesses
    const strengths = [], weaknesses = [];
    results.forEach(r => {
        const pct = (r.rawScore / r.maxScore) * 100;
        if (pct >= 80 && r.weight >= 2) strengths.push(`${r.name}: Strong performance (${r.rawScore}/${r.maxScore})`);
        else if (pct <= 40 && r.weight >= 2) weaknesses.push(`${r.name}: Needs attention (${r.rawScore}/${r.maxScore})`);
    });
    for (const [cat, data] of Object.entries(state.categoryScores)) {
        if (data.max === 0) continue;
        const pct = (data.score / data.weight) * 100;
        if (pct >= 80) strengths.push(`${cat}: Exceptional category performance (${pct.toFixed(0)}%)`);
        else if (pct <= 40) weaknesses.push(`${cat}: Critical risk area requiring mitigation (${pct.toFixed(0)}%)`);
    }
    if (!strengths.length) strengths.push('No outstanding strengths identified — recommend close monitoring');
    if (!weaknesses.length) weaknesses.push('No critical weaknesses identified — standard monitoring sufficient');

    const sl = document.getElementById('strengths_list');
    const wl = document.getElementById('weaknesses_list');
    sl.innerHTML = ''; wl.innerHTML = '';
    strengths.forEach(s => { const li = document.createElement('li'); li.textContent = s; sl.appendChild(li); });
    weaknesses.forEach(w => { const li = document.createElement('li'); li.textContent = w; wl.appendChild(li); });

    // Recommendation
    document.getElementById('final_recommendation').innerHTML = getAssessmentSummary(totalScore);

    // Detailed Metrics (Accordion)
    buildDetailedMetrics(results);

    // Methodology Breakdown
    buildBreakdown(results);

    // Navigate to result
    navigateTo('result');
    state.completedSections.add('result');
    updateSidebar('result');

    // Render charts after short delay (canvas must be visible)
    setTimeout(() => {
        renderCharts();
        if (window.lucide) {
            lucide.createIcons();
        }
    }, 200);
}

function getPrimaryRiskCategory() {
    let lowest = 100, cat = 'None';
    for (const [c, d] of Object.entries(state.categoryScores)) {
        if (d.max === 0) continue;
        const pct = (d.score / d.weight) * 100;
        if (pct < lowest) { lowest = pct; cat = c; }
    }
    return cat;
}

function getRecommendedAction(score) {
    if (score >= 75) return 'Standard Approval';
    if (score >= 60) return 'Approve with Monitoring';
    if (score >= 45) return 'Conditional Approval';
    return 'Decline / Restructure';
}

function getAssessmentSummary(score) {
    if (score >= 75) return `<strong>Strong Credit Profile:</strong> This cooperative demonstrates exceptional creditworthiness across all key metrics. The strong DSCR, stable milk supply, robust governance, healthy financial ratios, and diversified buyer base indicate capacity to service debt obligations comfortably.<br><br><strong>Assessment:</strong> Credit risk is low. Standard monitoring protocols recommended.`;
    if (score >= 60) return `<strong>Acceptable Credit Profile:</strong> The cooperative meets minimum credit standards with adequate buffers. While financial performance is satisfactory, identified gaps in operational efficiency or risk management require attention.<br><br><strong>Assessment:</strong> Credit risk is moderate. Enhanced monitoring recommended.`;
    if (score >= 45) return `<strong>Moderate Risk Profile:</strong> Credit application shows moderate risk with specific vulnerabilities in cash flow stability, governance, or buyer concentration. Enhanced due diligence required.<br><br><strong>Assessment:</strong> Credit risk is elevated. Conditional approval with intensive monitoring recommended.`;
    return `<strong>High Risk Profile:</strong> Significant credit risks identified including inadequate debt service capacity, high leverage, poor governance, or excessive buyer concentration. Immediate attention to risk factors required.<br><br><strong>Assessment:</strong> Credit risk is high. Decline or substantial restructuring recommended.`;
}

// =====================================================
// MODULE 11: DETAILED METRICS (ACCORDION)
// =====================================================

function buildDetailedMetrics(results) {
    const container = document.getElementById('detailed_metrics_container');
    container.innerHTML = '';

    const byCategory = {};
    results.forEach(r => {
        if (!byCategory[r.category]) byCategory[r.category] = [];
        byCategory[r.category].push(r);
    });

    for (const [cat, items] of Object.entries(byCategory)) {
        const catData = state.categoryScores[cat];
        if (!catData || catData.max === 0) continue;
        const catPct = (catData.score / catData.weight) * 100;
        const color = catPct >= 60 ? 'var(--success)' : catPct >= 40 ? 'var(--warning)' : 'var(--danger)';
        const sectionId = `acc_${cat.replace(/[^a-z0-9]/gi,'_')}`;

        const header = document.createElement('button');
        header.className = 'metric-section-header';
        header.innerHTML = `
            <span class="metric-section-title">${cat}</span>
            <span class="metric-section-meta" style="color:${color}">
                ${catData.score.toFixed(1)} / ${catData.weight} pts &nbsp;
                <span style="font-size:1.1em">${catData.score / catData.weight * 100 >= 60 ? '▼' : '▼'}</span>
            </span>`;
        header.onclick = () => {
            const body = document.getElementById(sectionId);
            body.classList.toggle('collapsed');
        };

        const body = document.createElement('div');
        body.className = 'metric-section-body';
        body.id = sectionId;

        items.forEach(metric => {
            const pct = (metric.rawScore / metric.maxScore) * 100;
            const mc = document.createElement('div');
            mc.className = 'metric-card';
            mc.innerHTML = `
                <div class="metric-header">
                    <div class="metric-name">${metric.name}</div>
                    <div class="metric-value" style="color:${pct >= 60 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)'}">${metric.rawScore}/${metric.maxScore}</div>
                </div>
                <div class="weight-info">Weight: ${metric.weight} pts | Value: ${metric.calculation !== null ? metric.calculation + ' ' + metric.unit : 'N/A'}</div>
                <div class="score-bar"><div class="score-fill" style="width:${pct}%;background:${pct >= 60 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)'}"></div></div>
                <div style="text-align:right;font-size:0.8em;color:var(--text-muted);margin-top:4px">Weighted: ${metric.weightedScore.toFixed(2)}</div>`;
            body.appendChild(mc);
        });

        container.appendChild(header);
        container.appendChild(body);
    }
}

function buildBreakdown(results) {
    const el = document.getElementById('methodology_breakdown');
    let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;">';
    results.forEach(r => {
        const pct = (r.rawScore / r.maxScore) * 100;
        const color = pct >= 60 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
        html += `<div class="metric-card">
            <div class="metric-header">
                <div class="metric-name">${r.name}</div>
                <div class="metric-value" style="color:${color}">${r.rawScore}/${r.maxScore}</div>
            </div>
            <div class="weight-info">Category: ${r.category} | Weight: ${r.weight}</div>
            <div class="weight-info">Calculated: ${r.calculation !== null ? r.calculation + ' ' + r.unit : 'N/A'}</div>
            <div class="score-bar"><div class="score-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
}

// =====================================================
// MODULE 12: CHART.JS CHARTS
// =====================================================

function renderCharts() {
    if (!window.Chart || !state.finalResults.length) return;

    const activeCats = Object.entries(state.categoryScores).filter(([,d]) => d.max > 0);
    const labels = activeCats.map(([c]) => c.split(' & ')[0].split(' ').slice(0,3).join(' '));
    const pcts   = activeCats.map(([,d]) => parseFloat(((d.score/d.weight)*100).toFixed(1)));
    const scores = activeCats.map(([,d]) => parseFloat(d.score.toFixed(2)));
    const colors = pcts.map(p => p >= 75 ? '#059669' : p >= 60 ? '#2563eb' : p >= 40 ? '#d97706' : '#dc2626');
    const alphaColors = colors.map(c => c + 'aa');

    // Destroy existing
    ['pieChart','barChart','radarChart'].forEach(id => {
        if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
    });

    // PIE CHART
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        state.charts.pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: scores, backgroundColor: colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 6 }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(2)} pts` } }
                }
            }
        });
    }

    // BAR CHART
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        state.charts.barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Score %',
                    data: pcts,
                    backgroundColor: alphaColors,
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } }, grid: { color: '#f0f0f0' } },
                    x: { ticks: { font: { size: 10 } }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(1)}%` } }
                }
            }
        });
    }

    // RADAR (horizontal bar styled as heatmap)
    const radarCtx = document.getElementById('radarChart');
    if (radarCtx) {
        state.charts.radarChart = new Chart(radarCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Performance %',
                    data: pcts,
                    backgroundColor: alphaColors,
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } }, grid: { color: '#f0f0f0' } },
                    y: { ticks: { font: { size: 11 } }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)}%` } }
                }
            }
        });
    }
}

// =====================================================
// MODULE 13: INITIALISE
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    // Start at config (no hash)
    if (!window.location.hash || window.location.hash === '#') {
        navigateTo('config', false);
    } else {
        router();
    }
    
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

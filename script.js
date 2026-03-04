/**
 * Credit Scoring Portal — script.js
 * Routing, state management, scoring engine, and result rendering.
 */

// =====================================================
// GLOBAL STATE
// =====================================================
const state = {
    modelType: null,      // 'collection' | 'processing'
    customerType: null,   // 'new' | 'existing'
    currentSection: 'config',
    completedSections: new Set(),
    charts: {},
    results: {}
};

const SECTION_KEYS = [
    'section_1', 'section_2', 'section_3', 'section_4', 'section_5',
    'section_6', 'section_7', 'section_8', 'section_9', 'section_10',
    'section_11', 'section_12', 'section_13'
];

const STORAGE_KEY = 'coop_portal_config';

// =====================================================
// HELPERS
// =====================================================
const gv = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const val = parseFloat(el.value);
    return isNaN(val) ? 0 : val;
};

const sv = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (typeof val === 'number' && !Number.isInteger(val)) ? val.toFixed(2) : val;
};

const gs = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
};

// =====================================================
// PERSIST / RESTORE STATE
// =====================================================
function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        modelType: state.modelType,
        customerType: state.customerType,
        completedSections: [...state.completedSections]
    }));
}

function restoreConfig() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (!saved) return false;
        if (saved.modelType) state.modelType = saved.modelType;
        if (saved.customerType) state.customerType = saved.customerType;
        if (saved.completedSections) state.completedSections = new Set(saved.completedSections);
        return !!(state.modelType && state.customerType);
    } catch (e) {
        return false;
    }
}

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const isRestored = restoreConfig();

    if (isRestored) {
        // Restore visual state for config cards
        applyRestoredConfigUI();
        applyFieldVisibility();
        unlockSidebar();
    }

    // Lucide icons
    if (window.lucide) lucide.createIcons();

    // Hash routing
    router();
    window.addEventListener('hashchange', router);
});

function applyRestoredConfigUI() {
    if (state.modelType) {
        document.querySelectorAll('input[name="coop_type"]').forEach(el => {
            el.closest('.radio-card').classList.toggle('selected', el.value === state.modelType);
        });
        const modelEl = document.getElementById('model_type');
        if (modelEl) {
            modelEl.disabled = false;
            modelEl.value = state.modelType === 'collection'
                ? 'Milk Collection Only (Model A)'
                : 'Collection & Processing (Model B)';
        }
    }
    if (state.customerType) {
        document.querySelectorAll('input[name="customer_type"]').forEach(el => {
            el.closest('.radio-card').classList.toggle('selected', el.value === state.customerType);
        });
        const loanEl = document.getElementById('loan_type');
        if (loanEl) loanEl.value = state.customerType === 'new' ? 'New Loan' : 'Existing Loan';
    }
}

function unlockSidebar() {
    document.querySelectorAll('.sidebar-nav-item.disabled').forEach(it => it.classList.remove('disabled'));
}

// =====================================================
// ROUTING
// =====================================================
function router() {
    const hash = window.location.hash.replace('#', '') || 'config';
    const validSection = hash === 'config' || hash === 'result' || SECTION_KEYS.includes(hash);
    const target = validSection ? hash : 'config';

    // If no config set yet and trying to access a section, redirect to config
    if (!state.modelType && target !== 'config') {
        navigateTo('config', false);
        return;
    }

    navigateTo(target, false);
}

// =====================================================
// NAVIGATION CORE
// =====================================================
function navigateTo(sectionId, pushHash = true) {
    // Hide all panels
    document.querySelectorAll('.config-panel, .form-section, .result-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        if (target.classList.contains('form-section') || target.classList.contains('result-section')) {
            target.classList.add('active');
        }
    }

    state.currentSection = sectionId;
    updateSidebar(sectionId);
    updatePaginationUI();

    if (pushHash) {
        history.pushState({ section: sectionId }, '', '#' + sectionId);
    }
    window.scrollTo(0, 0);
}

function updateSidebar(activeId) {
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        const sid = btn.getAttribute('data-section');
        btn.classList.toggle('active', sid === activeId);
        if (state.completedSections.has(sid)) btn.classList.add('completed');
    });

    const headerLabel = document.getElementById('header_step');
    if (headerLabel) {
        if (activeId === 'config') headerLabel.innerHTML = '<span>Configuration</span>';
        else if (activeId === 'result') headerLabel.innerHTML = '<span>Results Dashboard</span>';
        else {
            const idx = SECTION_KEYS.indexOf(activeId);
            headerLabel.innerHTML = `<span class="step-pill">Section ${idx + 1} / ${SECTION_KEYS.length}</span>`;
        }
    }

    const sidebarPct = state.completedSections.size / SECTION_KEYS.length * 100;
    const fill = document.getElementById('sidebar_progress_fill');
    const text = document.getElementById('sidebar_progress_text');
    if (fill) fill.style.width = sidebarPct + '%';
    if (text) text.textContent = state.completedSections.size === 0
        ? 'Configure to begin'
        : `${state.completedSections.size} / ${SECTION_KEYS.length} sections done`;
}

function updatePaginationUI() {
    const bar = document.getElementById('pagination_bar');
    if (state.currentSection === 'config' || state.currentSection === 'result' || !state.modelType) {
        if (bar) bar.style.display = 'none';
        return;
    }

    if (bar) bar.style.display = 'flex';

    const idx = SECTION_KEYS.indexOf(state.currentSection);
    const label = document.getElementById('pagination_label');
    if (label) label.textContent = `Section ${idx + 1} of ${SECTION_KEYS.length}`;

    const prevBtn = document.getElementById('btn_prev');
    const nextBtn = document.getElementById('btn_next');
    const calcBtn = document.getElementById('btn_calculate');

    if (prevBtn) prevBtn.disabled = idx === 0;

    const isLast = idx === SECTION_KEYS.length - 1;
    if (nextBtn) nextBtn.classList.toggle('hidden', isLast);
    if (calcBtn) calcBtn.classList.toggle('hidden', !isLast);

    // Section dots
    const dotsContainer = document.getElementById('section_dots');
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        SECTION_KEYS.forEach((key, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot' +
                (i === idx ? ' active' : '') +
                (state.completedSections.has(key) ? ' completed' : '');
            dotsContainer.appendChild(dot);
        });
    }
}

function navigateNext() {
    // Validate required fields for current section
    if (!validateCurrentSection()) return;

    const idx = SECTION_KEYS.indexOf(state.currentSection);
    if (idx < SECTION_KEYS.length - 1) {
        state.completedSections.add(state.currentSection);
        saveConfig();
        navigateTo(SECTION_KEYS[idx + 1]);
    }
}

function navigatePrev() {
    const idx = SECTION_KEYS.indexOf(state.currentSection);
    if (idx > 0) navigateTo(SECTION_KEYS[idx - 1]);
}

function handleSidebarClick(sid) {
    if (window.innerWidth <= 768) {
        closeSidebar();
    }
    if (!state.modelType && sid !== 'config') {
        navigateTo('config');
        return;
    }
    navigateTo(sid);
}

// =====================================================
// VALIDATION
// =====================================================
function validateCurrentSection() {
    if (state.currentSection === 'section_1') {
        const name = document.getElementById('coop_name');
        if (!name || !name.value.trim()) {
            name.style.borderColor = 'var(--danger)';
            name.focus();
            showToast('Cooperative Name is required.', 'error');
            return false;
        }
        name.style.borderColor = '';
    }
    return true;
}

function showToast(msg, type = 'info') {
    let toast = document.getElementById('portal_toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'portal_toast';
        toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:0.9em;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'error' ? '#fee2e2' : '#dcfce7';
    toast.style.color = type === 'error' ? '#dc2626' : '#16a34a';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// =====================================================
// CONFIGURATION LOGIC
// =====================================================
function setCoopType(type) {
    state.modelType = type;
    document.querySelectorAll('input[name="coop_type"]').forEach(el => {
        el.closest('.radio-card').classList.toggle('selected', el.value === type);
    });
    const modelEl = document.getElementById('model_type');
    if (modelEl) {
        modelEl.disabled = false;
        modelEl.value = type === 'collection' ? 'Milk Collection Only (Model A)' : 'Collection & Processing (Model B)';
    }
    checkConfigComplete();
}

function setCustomerType(type) {
    state.customerType = type;
    document.querySelectorAll('input[name="customer_type"]').forEach(el => {
        el.closest('.radio-card').classList.toggle('selected', el.value === type);
    });
    const loanEl = document.getElementById('loan_type');
    if (loanEl) loanEl.value = type === 'new' ? 'New Loan' : 'Existing Loan';
    checkConfigComplete();
}

function checkConfigComplete() {
    const alertBox = document.getElementById('config_alert');
    if (state.modelType && state.customerType) {
        if (alertBox) alertBox.classList.add('hidden');
        applyFieldVisibility();
        unlockSidebar();
        saveConfig();
        // Only auto-navigate on first-time config setup (not on restore)
        if (state.currentSection === 'config') {
            navigateTo('section_1');
        }
    } else {
        if (alertBox) alertBox.classList.remove('hidden');
    }
}

function applyFieldVisibility() {
    const isModelB = state.modelType === 'processing';
    document.querySelectorAll('.model-b-field').forEach(el => {
        el.classList.toggle('hidden', !isModelB);
    });
}

// =====================================================
// AUTO-CALCULATIONS
// =====================================================
function calculateTotalLoan() {
    sv('total_loan', gv('existing_loan') + gv('proposed_loan'));
}

function calculateRevenue() {
    const milk = gv('milk_sales'), other = gv('other_product_sales'),
          otherInc = gv('other_income'), grant = gv('grant_income');
    sv('total_sales', milk + other + otherInc);
    sv('total_revenue', milk + other + otherInc + grant);
}

function calculateExpenses() {
    const ids = ['cogs', 'processing_cost', 'packaging_cost', 'transport_cost', 'other_processing',
                 'salary_expense', 'admin_expense', 'electricity', 'fuel_expense', 'repair_expense',
                 'rent_expense', 'other_opex'];
    sv('total_opex', ids.reduce((sum, id) => sum + gv(id), 0));
}

function calculateAssets() {
    const cash = gv('cash_hand') + gv('bank_balance');
    sv('total_cash', cash);
    const current = cash + gv('accounts_receivable') + gv('inventory_value') + gv('prepaid_expenses') + gv('other_current_assets');
    sv('total_current_assets', current);
    const fixed = gv('land_value') + gv('building_value') + gv('machinery_value') + gv('vehicle_value') + gv('furniture_value') + gv('other_fixed_assets');
    sv('total_fixed_assets', fixed);
    sv('total_assets', current + fixed);
}

function calculateLiabilities() {
    const current = gv('accounts_payable') + gv('short_term_loan') + gv('accrued_expenses') + gv('current_ltd');
    sv('total_current_liabilities', current);
    const ltl = gv('long_term_loan') + gv('other_ltl');
    sv('total_long_term_liabilities', ltl);
    sv('total_liabilities', current + ltl);
}

function calculateEquity() {
    sv('total_net_worth', gv('paid_up_capital') + gv('retained_earnings') + gv('reserve_fund'));
}

function calculateCollateral() {
    sv('total_primary_collateral', gv('primary_land') + gv('primary_building') + gv('primary_machinery'));
}

function calculateMilkMetrics() {
    const collected = gv('total_milk_collected'), loss = gv('milk_loss');
    const pLoss = state.modelType === 'processing' ? gv('processing_loss') : 0;
    sv('total_milk_sold', Math.max(0, collected - loss - pLoss));
}

// =====================================================
// SCORING ENGINE (1000 POINTS)
// =====================================================
function handleCalculate() {
    const inputs = {};
    document.querySelectorAll('input, select').forEach(el => {
        if (el.id) inputs[el.id] = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
    });
    const results = performScoring(inputs);
    state.results = results;
    renderResults(results);
}

function performScoring(inp) {
    const res = { totalScore: 0, categories: {}, indicators: [], strengths: [], weaknesses: [] };

    const add = (cat, name, score, max, formula, val) => {
        if (!res.categories[cat]) res.categories[cat] = { score: 0, max: 0 };
        res.categories[cat].score += score;
        res.categories[cat].max += max;
        res.totalScore += score;
        res.indicators.push({ cat, name, score: Math.round(score * 10) / 10, max, formula, val });
    };

    // ── 1. CASH FLOW (180) ────────────────────────────────────────────────
    const ebitda = inp.total_revenue - inp.total_opex - inp.cogs + inp.depreciation + inp.amortization;
    const debtSvc = inp.principal_repayment + inp.interest_amount;
    const dscr = debtSvc > 0 ? ebitda / debtSvc : (ebitda > 0 ? 2.5 : 0);
    add('Cash Flow', 'DSCR (Debt Coverage)', dscr >= 2.0 ? 60 : dscr >= 1.5 ? 45 : dscr >= 1.25 ? 30 : dscr >= 1.0 ? 15 : 0, 60, 'EBITDA / Debt Service', dscr.toFixed(2) + 'x');

    const season = inp.lean_month_expense > 0 && inp.total_cash > 0 ? inp.total_cash / inp.lean_month_expense : 0;
    add('Cash Flow', 'Seasonality Coverage', season >= 12 ? 36 : season >= 6 ? 24 : season >= 3 ? 12 : 6, 36, 'Cash / Lean Month Exp', season.toFixed(1) + ' mo');

    const invDays = inp.cogs > 0 ? (inp.avg_inventory / (inp.cogs / 365)) : 0;
    add('Cash Flow', 'Inventory Days', invDays <= 30 ? 30 : invDays <= 60 ? 20 : invDays <= 90 ? 10 : 5, 30, 'Avg Inv / (COGS/365)', Math.round(invDays) + ' days');

    const recDays = inp.total_sales > 0 ? (inp.accounts_receivable / (inp.total_sales / 365)) : 0;
    add('Cash Flow', 'Receivable Days', recDays <= 30 ? 40 : recDays <= 45 ? 30 : recDays <= 60 ? 20 : 10, 40, 'AR / (Sales/365)', Math.round(recDays) + ' days');

    // ── 2. MILK SUPPLY (160) ──────────────────────────────────────────────
    const milkStab = inp.avg_monthly_milk > 0 ? (inp.lowest_monthly_milk / inp.avg_monthly_milk) * 100 : 0;
    add('Supply', 'Milk Stability', milkStab >= 90 ? 24 : milkStab >= 75 ? 18 : milkStab >= 60 ? 12 : 6, 24, 'Low / Avg Monthly', milkStab.toFixed(1) + '%');

    const dayStab = (inp.collection_days / 365) * 100;
    add('Supply', 'Collection Days', dayStab >= 95 ? 20 : dayStab >= 85 ? 15 : dayStab >= 75 ? 10 : 5, 20, 'Days / 365', dayStab.toFixed(1) + '%');

    const mLoss = inp.total_milk_collected > 0 ? (inp.milk_loss / inp.total_milk_collected) * 100 : 0;
    add('Supply', 'Milk Loss Rate', mLoss <= 2 ? 20 : mLoss <= 5 ? 15 : mLoss <= 10 ? 10 : 5, 20, 'Milk Loss / Total', mLoss.toFixed(2) + '%');

    const yLoss = inp.total_milk_collected > 0 ? (inp.processing_loss / inp.total_milk_collected) * 100 : 0;
    add('Supply', 'Yield Loss', yLoss <= 2 ? 15 : yLoss <= 5 ? 10 : yLoss <= 8 ? 5 : 2, 15, 'Proc. Loss / Total', yLoss.toFixed(2) + '%');

    const fConc = inp.total_milk_collected > 0 ? (inp.top5_farmers / inp.total_milk_collected) * 100 : 0;
    add('Supply', 'Farmer Concentration', fConc <= 20 ? 15 : fConc <= 35 ? 10 : fConc <= 50 ? 5 : 2, 15, 'Top 5 Farmers Share', fConc.toFixed(1) + '%');

    const logiScore = (inp.vehicle_avail === 'Yes' ? 7.5 : 0) + (inp.storage_avail === 'Yes' ? 7.5 : 0);
    add('Supply', 'Logistics', logiScore, 15, 'Vehicle + Cold Chain', logiScore === 15 ? 'Full' : logiScore > 0 ? 'Partial' : 'None');

    // ── 3. FINANCIAL STRENGTH (150) ───────────────────────────────────────
    const nw = inp.total_net_worth;
    add('Financials', 'Net Worth', nw >= 20000000 ? 35 : nw >= 10000000 ? 25 : nw >= 5000000 ? 15 : 8, 35, 'Total Equity', 'NPR ' + (nw / 1e6).toFixed(1) + 'M');

    const de = nw > 0 ? inp.total_liabilities / nw : 5;
    add('Financials', 'Debt/Equity Ratio', de <= 0.5 ? 32 : de <= 1.0 ? 24 : de <= 1.5 ? 16 : 8, 32, 'Liabilities / Equity', de.toFixed(2));

    const cr = inp.total_current_liabilities > 0 ? inp.total_current_assets / inp.total_current_liabilities : 0;
    add('Financials', 'Current Ratio', cr >= 2.0 ? 30 : cr >= 1.5 ? 22 : cr >= 1.0 ? 15 : 7, 30, 'CA / CL', cr.toFixed(2));

    const gPct = inp.total_revenue > 0 ? (inp.grant_income / inp.total_revenue) * 100 : 0;
    add('Financials', 'Grant Dependency', gPct <= 5 ? 20 : gPct <= 15 ? 15 : gPct <= 25 ? 10 : 5, 20, 'Grants / Revenue', gPct.toFixed(1) + '%');

    add('Financials', 'Cash Trend', inp.cash_last_year > inp.cash_prev_year ? 25 : inp.cash_last_year === inp.cash_prev_year ? 18 : 8, 25, 'YoY Cash', inp.cash_last_year > inp.cash_prev_year ? 'Improving' : 'Declining');

    // ── 4. GOVERNANCE (45) ────────────────────────────────────────────────
    const bSales = inp.total_sales > 0 ? (inp.bank_sales / inp.total_sales) * 100 : 0;
    add('Governance', 'Bank Sales %', bSales >= 80 ? 25 : bSales >= 50 ? 18 : bSales >= 30 ? 12 : 6, 25, 'Via Bank / Total Sales', bSales.toFixed(1) + '%');

    const misScore = inp.digital_mis === 'Yes' ? 20 : inp.digital_mis === 'Partial' ? 10 : 0;
    add('Governance', 'Digital MIS', misScore, 20, 'MIS/POS Adoption', inp.digital_mis || 'N/A');

    // ── 5. LOAN RECOVERY (100) ────────────────────────────────────────────
    const gnpa = inp.total_member_loans > 0 ? (inp.npa_loans / inp.total_member_loans) * 100 : 0;
    add('Recovery', 'Member GNPA', gnpa <= 2 ? 45 : gnpa <= 5 ? 35 : gnpa <= 10 ? 25 : 10, 45, 'NPA / Total Loans', gnpa.toFixed(1) + '%');

    add('Recovery', 'Max DPD Members', inp.max_dpd_members <= 30 ? 35 : inp.max_dpd_members <= 60 ? 25 : 15, 35, 'Days Past Due', inp.max_dpd_members + ' days');

    const rsScore = inp.restructured_loans === 'None' ? 20 : inp.restructured_loans === 'Few Times' ? 12 : 5;
    add('Recovery', 'Loan Restructuring', rsScore, 20, 'Past 3 Years', inp.restructured_loans || 'N/A');

    // ── 6. SECURITY (60) ─────────────────────────────────────────────────
    const priColl = inp.proposed_loan > 0 ? (inp.total_primary_collateral / inp.proposed_loan) : 0;
    add('Security', 'Primary Collateral', Math.min(priColl * 40, 40), 40, 'Coll. / Loan Amt', priColl.toFixed(2) + 'x');

    const secColl = inp.proposed_loan > 0 ? (inp.secondary_collateral / inp.proposed_loan) : 0;
    add('Security', 'Secondary Collateral', Math.min(secColl * 20, 20), 20, '2nd Coll. / Loan', secColl.toFixed(2) + 'x');

    // ── 7. GOVERNANCE QUALITY (80) ────────────────────────────────────────
    [
        { id: 'mgmt_experience', cat: 'Governance', name: 'Mgmt Experience', max: 20, score: inp.mgmt_experience >= 10 ? 20 : 10 },
        { id: 'internal_controls', cat: 'Governance', name: 'Internal Controls', max: 20, score: inp.internal_controls === 'Robust' ? 20 : 10 },
        { id: 'audit_findings', cat: 'Governance', name: 'Audit Findings', max: 20, score: inp.audit_findings === 'None' ? 20 : 10 },
        { id: 'loan_policy', cat: 'Governance', name: 'Loan Policy', max: 20, score: inp.loan_policy === 'Yes' ? 20 : 0 },
    ].forEach(m => add(m.cat, m.name, m.score, m.max, 'Direct', inp[m.id] || 'N/A'));

    // ── 8. EXTERNAL (40) ─────────────────────────────────────────────────
    add('External', 'Insurance Coverage', inp.insurance === 'Yes' ? 10 : 0, 10, 'Has Insurance', inp.insurance || 'N/A');
    add('External', 'Regulatory Compliance', inp.regulatory === 'Full' ? 15 : 7, 15, 'Compliance Level', inp.regulatory || 'N/A');
    add('External', 'Climatic Risk', inp.climatic_risk === 'Low' ? 15 : 7, 15, 'Risk Level', inp.climatic_risk || 'N/A');

    // ── 9. CREDIT HISTORY (40) ───────────────────────────────────────────
    add('Credit History', 'BFI Credit History', inp.credit_history_bfi === 'Pass' ? 20 : 5, 20, 'BFI Record', inp.credit_history_bfi || 'N/A');
    add('Credit History', 'Max DPD (BFI)', inp.max_dpd_bfi <= 5 ? 20 : 5, 20, 'Days Past Due', inp.max_dpd_bfi + ' days');

    // ── 10. BEHAVIORAL (30) ──────────────────────────────────────────────
    add('Behavior', 'Committee Meetings', inp.meeting_freq === 'Weekly' ? 10 : inp.meeting_freq === 'Monthly' ? 6 : 2, 10, 'Freq', inp.meeting_freq || 'N/A');
    add('Behavior', 'Community Support', inp.community_support === 'Frequently' ? 10 : inp.community_support === 'Sometimes' ? 6 : 2, 10, 'Engagement', inp.community_support || 'N/A');
    add('Behavior', 'Emergency Plan', inp.emergency_prep === 'Proper Plan' ? 10 : inp.emergency_prep === 'Ad-hoc' ? 5 : 0, 10, 'Preparedness', inp.emergency_prep || 'N/A');

    // ── Years in Operation (base credit) ─────────────────────────────────
    const yrs = gv('years_operation');
    add('Behavior', 'Years in Operation', yrs >= 10 ? 15 : yrs >= 5 ? 10 : yrs >= 2 ? 5 : 2, 15, 'Years Operating', yrs + ' yrs');

    // Strengths / Weaknesses
    res.indicators.forEach(ind => {
        const pct = (ind.score / ind.max) * 100;
        if (pct >= 85) res.strengths.push({ name: ind.name, val: ind.val, pct });
        if (pct <= 35) res.weaknesses.push({ name: ind.name, val: ind.val, pct });
    });

    res.totalScore = Math.min(Math.round(res.totalScore), 1000);
    return res;
}

// =====================================================
// RESULTS RENDERING
// =====================================================
function renderResults(res) {
    const scoreVal = res.totalScore;

    // Risk classification
    let riskClass = 'low', riskLabel = 'High Risk', riskColor = '#dc2626', riskBg = '#fee2e2';
    if (scoreVal >= 800) { riskClass = 'excellent'; riskLabel = 'Excellent'; riskColor = '#16a34a'; riskBg = '#dcfce7'; }
    else if (scoreVal >= 650) { riskClass = 'good'; riskLabel = 'Good'; riskColor = '#2563eb'; riskBg = '#dbeafe'; }
    else if (scoreVal >= 500) { riskClass = 'moderate'; riskLabel = 'Moderate Risk'; riskColor = '#d97706'; riskBg = '#fef3c7'; }
    else if (scoreVal >= 350) { riskClass = 'caution'; riskLabel = 'Caution'; riskColor = '#ea580c'; riskBg = '#ffedd5'; }

    // Hero Score
    const scoreNum = document.getElementById('result_score_number');
    if (scoreNum) {
        scoreNum.textContent = scoreVal;
        scoreNum.style.color = riskColor;
    }

    const badge = document.getElementById('result_risk_badge');
    const badgeLabel = document.getElementById('result_risk_label');
    if (badge) {
        badge.className = 'risk-badge ' + riskClass;
        badge.style.background = riskBg;
        badge.style.color = riskColor;
        badge.style.borderColor = riskColor;
    }
    if (badgeLabel) badgeLabel.textContent = riskLabel;

    // Cooperative name in result
    const nameEl = document.getElementById('result_coop_name');
    if (nameEl) nameEl.textContent = gs('coop_name') || '—';

    const ctEl = document.getElementById('result_coop_type');
    if (ctEl) ctEl.textContent = state.modelType === 'collection' ? 'Collection Only' : 'Collection & Processing';

    const custEl = document.getElementById('result_cust_type');
    if (custEl) custEl.textContent = state.customerType === 'new' ? 'New Customer' : 'Existing Customer';

    // Score percentage bar
    const pctBarFill = document.getElementById('score_pct_fill');
    const pctText = document.getElementById('score_pct_text');
    if (pctBarFill) { pctBarFill.style.width = (scoreVal / 10) + '%'; pctBarFill.style.background = riskColor; }
    if (pctText) pctText.textContent = (scoreVal / 10).toFixed(1) + '%';

    // Category cards
    renderCategoryCards(res, riskColor);

    // Calculation log table
    renderCalcTable(res);

    // Strengths & Weaknesses
    const sl = document.getElementById('strengths_list');
    const wl = document.getElementById('weaknesses_list');
    if (sl) sl.innerHTML = res.strengths.slice(0, 6).map(s =>
        `<li><span class="sw-name">${s.name}</span> <span class="sw-val">${s.val}</span></li>`
    ).join('') || '<li>No strong areas identified yet.</li>';
    if (wl) wl.innerHTML = res.weaknesses.slice(0, 6).map(w =>
        `<li><span class="sw-name">${w.name}</span> <span class="sw-val">${w.val}</span></li>`
    ).join('') || '<li>No risk factors identified.</li>';

    // Recommendation
    const rec = document.getElementById('final_recommendation');
    if (rec) {
        const tier = scoreVal >= 800 ? ['Highly Recommended', '#16a34a', 'The cooperative demonstrates exceptional financial health, strong governance, and stable operations. Loan approval is strongly recommended.']
            : scoreVal >= 650 ? ['Recommended', '#2563eb', 'The cooperative shows positive indicators across key metrics with manageable risks. Approval recommended with standard monitoring.']
            : scoreVal >= 500 ? ['Conditional Approval', '#d97706', 'The cooperative presents moderate risk. Approval may proceed with enhanced monitoring, additional collateral, or reduced loan amount.']
            : scoreVal >= 350 ? ['High Risk — Further Review', '#ea580c', 'Significant concerns exist. The application requires senior review, stress testing, and possible restructuring before approval.']
            : ['Not Recommended', '#dc2626', 'The cooperative does not meet minimum credit thresholds. Loan application should be declined or deferred pending substantial improvement.'];
        rec.innerHTML = `
            <div class="rec-verdict" style="color:${tier[1]}">${tier[0]}</div>
            <p style="color:var(--text-secondary); line-height:1.7; margin-top:8px;">${tier[2]}</p>
        `;
    }

    navigateTo('result');
    setTimeout(() => renderCharts(res), 350);
}

function renderCategoryCards(res, riskColor) {
    const container = document.getElementById('category_analysis');
    if (!container) return;
    container.innerHTML = '';
    Object.entries(res.categories).forEach(([name, data]) => {
        const pct = data.max > 0 ? (data.score / data.max) * 100 : 0;
        const color = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
        const card = document.createElement('div');
        card.className = 'cat-card';
        card.innerHTML = `
            <div class="cat-card-header">
                <span class="cat-name">${name}</span>
                <span class="cat-score" style="color:${color}">${Math.round(data.score)} / ${data.max}</span>
            </div>
            <div class="cat-bar-bg">
                <div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <div class="cat-pct" style="color:${color}">${pct.toFixed(0)}%</div>
        `;
        container.appendChild(card);
    });
}

function renderCalcTable(res) {
    const tbody = document.getElementById('calculation-log');
    if (!tbody) return;
    tbody.innerHTML = '';
    let lastCat = '';
    res.indicators.forEach(ind => {
        const pct = ind.max > 0 ? (ind.score / ind.max) * 100 : 0;
        const color = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
        if (ind.cat !== lastCat) {
            lastCat = ind.cat;
            const catRow = document.createElement('tr');
            catRow.className = 'calc-cat-row';
            catRow.innerHTML = `<td colspan="5" class="calc-cat-label">${ind.cat}</td>`;
            tbody.appendChild(catRow);
        }
        const tr = document.createElement('tr');
        tr.className = 'calc-data-row';
        tr.innerHTML = `
            <td class="calc-indicator">${ind.name}</td>
            <td class="calc-formula">${ind.formula}</td>
            <td class="calc-value">${ind.val}</td>
            <td class="calc-score" style="color:${color};font-weight:700">${ind.score}</td>
            <td class="calc-max">/ ${ind.max}</td>
        `;
        tbody.appendChild(tr);
    });
}

// =====================================================
// CHARTS
// =====================================================
function renderCharts(res) {
    if (!res || !res.categories) return;
    const cats = Object.keys(res.categories);
    const pcts = Object.values(res.categories).map(c => c.max > 0 ? Math.round((c.score / c.max) * 100) : 0);
    const actuals = Object.values(res.categories).map(c => Math.round(c.score));

    const ctxRadar = document.getElementById('radarChart');
    if (ctxRadar) {
        if (state.charts.radar) state.charts.radar.destroy();
        state.charts.radar = new Chart(ctxRadar, {
            type: 'radar',
            data: {
                labels: cats,
                datasets: [{
                    label: 'Score %', data: pcts,
                    backgroundColor: 'rgba(37,99,235,0.12)',
                    borderColor: '#2563eb', pointBackgroundColor: '#2563eb',
                    pointRadius: 4, borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } } },
                plugins: { legend: { display: false } }
            }
        });
    }

    const ctxBar = document.getElementById('barChart');
    if (ctxBar) {
        if (state.charts.bar) state.charts.bar.destroy();
        state.charts.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: cats,
                datasets: [{
                    label: 'Score', data: actuals,
                    backgroundColor: cats.map((_, i) => `hsl(${220 + i * 15},60%,55%)`),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

function showResultTab(name, btn) {
    document.querySelectorAll('.result-tab-content').forEach(t =>
        t.classList.toggle('active', t.id === 'tab_' + name));
    document.querySelectorAll('.result-tab-btn').forEach(b =>
        b.classList.toggle('active', b === btn));
    if (name === 'charts') setTimeout(() => renderCharts(state.results), 100);
}

// =====================================================
// MOBILE SIDEBAR
// =====================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar_overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar_overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
}

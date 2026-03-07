/**
 * Credit Scoring Portal — script.js
 * Routing, state management, scoring engine, and result rendering.
 * Updated: 121-question, 15-section structure.
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
    results: {},
    questionnaire: null,  // Will store the fetched questionnaire
    isLoading: true
};

const VALID_ROUTES = ['config', 'questions', 'result'];

const STORAGE_KEY = 'coop_portal_config';
const GOOGLE_WEB_APP_URL = ''; // REPLACE WITH YOUR GOOGLE WEB APP URL

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
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    showLoading(true);

    try {
        await loadQuestions();
        const isRestored = restoreConfig();

        if (isRestored) {
            applyRestoredConfigUI();
            applyFieldVisibility();
            unlockSidebar();
        }

        if (window.lucide) lucide.createIcons();

        router();
        window.addEventListener('hashchange', router);
    } catch (error) {
        console.error('Failed to initialize portal:', error);
        showError('Fail to load questionnaire. Please check your internet connection and refresh.');
    } finally {
        showLoading(false);
    }
});

async function loadQuestions() {
    // Fallback/Mock Data if URL is empty
    if (!GOOGLE_WEB_APP_URL) {
        console.warn('GOOGLE_WEB_APP_URL is not set. Using fallback questionnaire.');
        state.questionnaire = getFallbackQuestionnaire();
    } else {
        try {
            const response = await fetch(GOOGLE_WEB_APP_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            state.questionnaire = await response.json();
        } catch (err) {
            console.error('API Error:', err);
            state.questionnaire = getFallbackQuestionnaire();
        }
    }

    renderQuestionnaire();
}

function showLoading(show) {
    state.isLoading = show;
    let loader = document.getElementById('portal_loader');
    if (!loader && show) {
        loader = document.createElement('div');
        loader.id = 'portal_loader';
        loader.className = 'loader-overlay';
        loader.innerHTML = '<div class="loader-spinner"></div><p>Loading Questionnaire...</p>';
        document.body.appendChild(loader);

        // Add loader styles if not in style.css
        const style = document.createElement('style');
        style.textContent = `
            .loader-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .loader-spinner { width: 50px; height: 50px; border: 5px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    }
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showError(msg) {
    const container = document.getElementById('dynamic_sections_container');
    if (container) {
        container.innerHTML = `
            <div class="alert" style="margin: 40px; text-align: center;">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                <h3>Error Loading Questionnaire</h3>
                <p>${msg}</p>
                <button onclick="location.reload()" class="btn-calculate" style="margin-top: 20px;">Retry</button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
}

function renderQuestionnaire() {
    const sectionsContainer = document.getElementById('questions_container');

    if (!sectionsContainer) return;

    sectionsContainer.innerHTML = '';

    console.log('--- Debugging Questionnaire Fetching ---');
    console.log('Total sections received:', state.questionnaire.sections.length);
    let totalQuestionsExpected = 0;
    
    state.questionnaire.sections.forEach(s => {
        totalQuestionsExpected += (s.questions ? s.questions.length : 0);
    });
    console.log('Total questions expected from payload:', totalQuestionsExpected);

    let renderedQuestionsCount = 0;

    state.questionnaire.sections.forEach((section, idx) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-card';
        sectionDiv.style.marginBottom = '24px';

        let questionsHtml = '';
        section.questions.forEach(q => {
            const isModelB = q.isModelB ? ' model-b-field hidden' : '';
            const requiredStar = q.required ? '<span style="color:var(--danger)">*</span>' : '';
            const requiredTag = q.required ? '<span class="required-tag">Required</span>' : '';

            let inputHtml = '';
            if (q.type === 'select') {
                inputHtml = `
                    <select id="${q.id}" ${q.disabled ? 'disabled' : ''} ${q.onchange ? `onchange="${q.onchange}"` : ''}>
                        ${(q.options || []).map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                `;
            } else if (q.type === 'textarea') {
                inputHtml = `<textarea id="${q.id}" placeholder="${q.placeholder || ''}" ${q.oninput ? `oninput="${q.oninput}"` : ''}></textarea>`;
            } else {
                inputHtml = `<input type="${q.type || 'text'}" id="${q.id}" placeholder="${q.placeholder || ''}" 
                    ${q.min !== undefined ? `min="${q.min}"` : ''} 
                    ${q.max !== undefined ? `max="${q.max}"` : ''}
                    ${q.step !== undefined ? `step="${q.step}"` : ''}
                    ${q.readonly ? 'readonly' : ''}
                    ${q.oninput ? `oninput="${q.oninput}"` : ''}>`;
            }

            questionsHtml += `
                <div class="form-group${isModelB}">
                    <label class="bilingual-label" for="${q.id}">
                        ${q.labelNep || ''} (${q.labelEng || ''}) ${requiredStar}
                    </label>
                    ${inputHtml}
                    ${q.hint ? `<div class="input-hint">${q.hint}</div>` : ''}
                </div>
            `;
            renderedQuestionsCount++;
        });

        sectionDiv.innerHTML = `
            <div class="section-header">
                <div class="section-title"><i data-lucide="${section.icon || 'info'}"></i> ${section.title} <span class="section-badge">Section ${idx + 1}</span></div>
                <span style="font-size:0.82em;color:var(--text-secondary)">${section.subtitle || ''}</span>
            </div>
            <div class="form-grid">
                ${questionsHtml}
            </div>
        `;
        sectionsContainer.appendChild(sectionDiv);
    });

    console.log('Total questions successfully rendered to DOM:', renderedQuestionsCount);
    console.log('--- End Debugging ---');

    if (window.lucide) lucide.createIcons();
}

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
    const validSection = VALID_ROUTES.includes(hash);
    const target = validSection ? hash : 'config';

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
        else if (activeId === 'questions') headerLabel.innerHTML = '<span>Questionnaire</span>';
    }

    const totalSteps = 2; // config + questions
    const sidebarPct = (state.completedSections.size / totalSteps) * 100;
    const fill = document.getElementById('sidebar_progress_fill');
    const text = document.getElementById('sidebar_progress_text');
    if (fill) fill.style.width = sidebarPct + '%';
    if (text) text.textContent = state.completedSections.size === 0
        ? 'Configure to begin'
        : 'Setup Complete';
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
function validateQuestions() {
    if (!state.questionnaire) return true;

    for (const section of state.questionnaire.sections) {
        for (const q of section.questions) {
            if (q.required && !q.isModelB) {
                const el = document.getElementById(q.id);
                if (el && !el.value.trim()) {
                    el.style.borderColor = 'var(--danger)';
                    el.focus();
                    showToast(`${q.labelEng} is required.`, 'error');
                    return false;
                }
                if (el) el.style.borderColor = '';
            }
        }
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
    const btnNext = document.getElementById('btn_start_questions');
    if (state.modelType && state.customerType) {
        if (alertBox) alertBox.classList.add('hidden');
        if (btnNext) btnNext.classList.remove('hidden');
        state.completedSections.add('config');
        applyFieldVisibility();
        unlockSidebar();
        saveConfig();
    } else {
        if (alertBox) alertBox.classList.remove('hidden');
        if (btnNext) btnNext.classList.add('hidden');
        state.completedSections.delete('config');
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

// Section 2: Loan
function calculateTotalLoan() {
    sv('total_loan', gv('existing_loan') + gv('proposed_loan'));
}

// Section 3: Revenue
function calculateRevenue() {
    const milk = gv('milk_sales'), other = gv('other_product_sales'), otherInc = gv('other_income'), grant = gv('grant_income');
    sv('total_sales', milk + other + otherInc);
    sv('total_revenue', milk + other + otherInc + grant);
}

// Section 4: Buyer percentages (auto-calculate % share)
function calculateBuyerShares() {
    const totalSales = gv('total_sales') || gv('milk_sales') + gv('other_product_sales') + gv('other_income');
    if (totalSales > 0) {
        sv('top5_buyer_pct', ((gv('top5_buyers_sales') / totalSales) * 100).toFixed(1));
        sv('largest_buyer_pct', ((gv('largest_buyer_sales') / totalSales) * 100).toFixed(1));
    }
}

// Section 5: Operating Costs
function calculateExpenses() {
    const cogs = gv('raw_milk_cost');
    const procIds = ['processing_cost', 'packaging_cost', 'transport_cost', 'other_processing_cost'];
    const opexIds = ['salary_expense', 'admin_expense', 'electricity_expense', 'fuel_expense', 'repair_expense', 'rent_expense', 'other_opex'];
    const totalOpex = [cogs, ...procIds, ...opexIds].reduce((sum, id) => sum + gv(id), 0);
    sv('total_opex', totalOpex);
}

// Section 7: Assets
function calculateAssets() {
    const cash = gv('cash_hand') + gv('bank_balance');
    sv('total_cash', cash);
    const current = cash + gv('accounts_receivable') + gv('inventory_value') + gv('prepaid_expenses') + gv('other_current_assets');
    sv('total_current_assets', current);
    const fixed = gv('land_value') + gv('building_value') + gv('machinery_value') + gv('vehicle_value') + gv('furniture_value') + gv('other_fixed_assets');
    sv('total_fixed_assets', fixed);
    sv('total_assets', current + fixed);
}

// Section 8: Liabilities
function calculateLiabilities() {
    const current = gv('accounts_payable') + gv('short_term_loan') + gv('accrued_expenses') + gv('current_ltd');
    sv('total_current_liabilities', current);
    const ltl = gv('long_term_loan') + gv('other_ltl');
    sv('total_long_term_liabilities', ltl);
    sv('total_liabilities', current + ltl);
}

// Section 9: Net Worth
function calculateNetWorth() {
    sv('total_net_worth', gv('paid_up_capital') + gv('retained_earnings') + gv('reserve_fund'));
}

// Section 10: Milk Metrics
function calculateMilkMetrics() {
    const collected = gv('total_milk_collected'), loss = gv('milk_loss');
    const pLoss = state.modelType === 'processing' ? gv('processing_loss') : 0;
    sv('total_milk_sold', Math.max(0, collected - loss - pLoss));
    // Average milk per farmer
    const farmers = gv('total_farmers');
    if (farmers > 0 && collected > 0) {
        sv('avg_milk_per_farmer', (collected / farmers).toFixed(1));
    }
}

// =====================================================
// SCORING ENGINE (1000 POINTS)
// =====================================================
function handleCalculate() {
    if (!validateQuestions()) return;
    state.completedSections.add('questions');
    saveConfig();

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

    // ── 1. CASH FLOW (180) ──────────────────────────────────────────────────
    const ebitda = inp.total_revenue - inp.total_opex + inp.annual_depreciation + inp.amortization_amount;
    // Derive debt service from interest rate & loan term if not directly available
    const loanAmt = inp.proposed_loan || 0;
    const months = inp.loan_tenure || 60;
    const rate = (inp.interest_rate || 10) / 100;
    const annualInterest = loanAmt * rate;
    const annualPrincipal = months > 0 ? (loanAmt / (months / 12)) : 0;
    const debtSvc = annualPrincipal + annualInterest;
    const dscr = debtSvc > 0 ? ebitda / debtSvc : (ebitda > 0 ? 2.5 : 0);
    add('Cash Flow', 'DSCR (Debt Coverage)', dscr >= 2.0 ? 60 : dscr >= 1.5 ? 45 : dscr >= 1.25 ? 30 : dscr >= 1.0 ? 15 : 0, 60, 'EBITDA / Debt Service', dscr.toFixed(2) + 'x');

    const season = inp.lowest_monthly_expense > 0 && inp.total_cash > 0 ? inp.total_cash / inp.lowest_monthly_expense : 0;
    add('Cash Flow', 'Seasonality Coverage', season >= 12 ? 36 : season >= 6 ? 24 : season >= 3 ? 12 : 6, 36, 'Cash / Lean Month Exp', season.toFixed(1) + ' mo');

    const invDays = inp.raw_milk_cost > 0 ? (inp.avg_inventory_value / (inp.raw_milk_cost / 365)) : 0;
    add('Cash Flow', 'Inventory Days', invDays <= 30 ? 30 : invDays <= 60 ? 20 : invDays <= 90 ? 10 : 5, 30, 'Avg Inv / (COGS/365)', Math.round(invDays) + ' days');

    const recDays = inp.total_sales > 0 ? (inp.accounts_receivable / (inp.total_sales / 365)) : 0;
    add('Cash Flow', 'Receivable Days', recDays <= 30 ? 40 : recDays <= 45 ? 30 : recDays <= 60 ? 20 : 10, 40, 'AR / (Sales/365)', Math.round(recDays) + ' days');

    // ── 2. MILK SUPPLY (160) ────────────────────────────────────────────────
    const milkStab = inp.avg_monthly_milk > 0 ? (inp.lowest_monthly_milk / inp.avg_monthly_milk) * 100 : 0;
    add('Supply', 'Milk Stability', milkStab >= 90 ? 24 : milkStab >= 75 ? 18 : milkStab >= 60 ? 12 : 6, 24, 'Low / Avg Monthly', milkStab.toFixed(1) + '%');

    const dayStab = (inp.collection_days / 365) * 100;
    add('Supply', 'Collection Days', dayStab >= 95 ? 20 : dayStab >= 85 ? 15 : dayStab >= 75 ? 10 : 5, 20, 'Days / 365', dayStab.toFixed(1) + '%');

    const mLoss = inp.total_milk_collected > 0 ? (inp.milk_loss / inp.total_milk_collected) * 100 : 0;
    add('Supply', 'Milk Loss Rate', mLoss <= 2 ? 20 : mLoss <= 5 ? 15 : mLoss <= 10 ? 10 : 5, 20, 'Milk Loss / Total', mLoss.toFixed(2) + '%');

    const yLoss = inp.total_milk_collected > 0 ? (inp.processing_loss / inp.total_milk_collected) * 100 : 0;
    add('Supply', 'Yield Loss', yLoss <= 2 ? 15 : yLoss <= 5 ? 10 : yLoss <= 8 ? 5 : 2, 15, 'Proc. Loss / Total', yLoss.toFixed(2) + '%');

    const fConc = inp.total_milk_collected > 0 ? (inp.top5_farmers_milk / inp.total_milk_collected) * 100 : 0;
    add('Supply', 'Farmer Concentration', fConc <= 20 ? 15 : fConc <= 35 ? 10 : fConc <= 50 ? 5 : 2, 15, 'Top 5 Farmers Share', fConc.toFixed(1) + '%');

    const logiScore = (inp.vehicle_avail_pct >= 80 ? 7.5 : inp.vehicle_avail_pct >= 50 ? 4 : 0) +
                      (inp.storage_cold_facility === 'Yes' ? 7.5 : 0);
    add('Supply', 'Logistics', logiScore, 15, 'Vehicle+Cold Chain', logiScore === 15 ? 'Full' : logiScore > 0 ? 'Partial' : 'None');

    // ── 3. FINANCIAL STRENGTH (150) ─────────────────────────────────────────
    const nw = inp.total_net_worth;
    add('Financials', 'Net Worth', nw >= 20000000 ? 35 : nw >= 10000000 ? 25 : nw >= 5000000 ? 15 : 8, 35, 'Total Equity', 'NPR ' + (nw / 1e6).toFixed(1) + 'M');

    const de = nw > 0 ? inp.total_liabilities / nw : 5;
    add('Financials', 'Debt/Equity Ratio', de <= 0.5 ? 32 : de <= 1.0 ? 24 : de <= 1.5 ? 16 : 8, 32, 'Liabilities / Equity', de.toFixed(2));

    const cr = inp.total_current_liabilities > 0 ? inp.total_current_assets / inp.total_current_liabilities : 0;
    add('Financials', 'Current Ratio', cr >= 2.0 ? 30 : cr >= 1.5 ? 22 : cr >= 1.0 ? 15 : 7, 30, 'CA / CL', cr.toFixed(2));

    const gPct = inp.total_revenue > 0 ? (inp.grant_income / inp.total_revenue) * 100 : 0;
    add('Financials', 'Grant Dependency', gPct <= 5 ? 20 : gPct <= 15 ? 15 : gPct <= 25 ? 10 : 5, 20, 'Grants / Revenue', gPct.toFixed(1) + '%');

    add('Financials', 'Cash Trend', inp.cash_last_year > inp.cash_prev_year ? 25 : inp.cash_last_year === inp.cash_prev_year ? 18 : 8, 25, 'YoY Cash', inp.cash_last_year > inp.cash_prev_year ? 'Improving' : 'Declining');

    // ── 4. BUYER QUALITY (45) ───────────────────────────────────────────────
    const bSales = inp.total_sales > 0 ? (inp.bank_sales / inp.total_sales) * 100 : 0;
    add('Buyer Quality', 'Bank Sales %', bSales >= 80 ? 25 : bSales >= 50 ? 18 : bSales >= 30 ? 12 : 6, 25, 'Via Bank / Total Sales', bSales.toFixed(1) + '%');

    const top5Pct = inp.total_sales > 0 ? (inp.top5_buyers_sales / inp.total_sales) * 100 : 0;
    add('Buyer Quality', 'Top 5 Buyer Concentration', top5Pct <= 30 ? 20 : top5Pct <= 50 ? 14 : 8, 20, 'Top5 / Total Sales', top5Pct.toFixed(1) + '%');

    // ── 5. LOAN RECOVERY (100) ──────────────────────────────────────────────
    const gnpa = inp.total_member_loans > 0 ? (inp.npa_member_loans / inp.total_member_loans) * 100 : 0;
    add('Recovery', 'Member GNPA', gnpa <= 2 ? 45 : gnpa <= 5 ? 35 : gnpa <= 10 ? 25 : 10, 45, 'NPA / Total Loans', gnpa.toFixed(1) + '%');

    add('Recovery', 'Max DPD Members', inp.max_dpd_members <= 30 ? 35 : inp.max_dpd_members <= 60 ? 25 : 15, 35, 'Days Past Due', inp.max_dpd_members + ' days');

    const rsScore = inp.restructured_loans_3yr === 'None' ? 20 : inp.restructured_loans_3yr === 'Few Times' ? 12 : 5;
    add('Recovery', 'Loan Restructuring', rsScore, 20, 'Past 3 Years', inp.restructured_loans_3yr || 'N/A');

    // ── 6. SECURITY / COLLATERAL (40) ───────────────────────────────────────
    const priColl = inp.proposed_loan > 0 ? (inp.primary_land_value / inp.proposed_loan) : 0;
    add('Security', 'Primary Collateral Coverage', Math.min(priColl * 40, 40), 40, 'Land Value / Loan', priColl.toFixed(2) + 'x');

    // ── 7. GOVERNANCE (80) ──────────────────────────────────────────────────
    add('Governance', 'Mgmt Experience', inp.mgmt_experience >= 10 ? 20 : inp.mgmt_experience >= 5 ? 12 : 6, 20, 'Years', inp.mgmt_experience + ' yrs');
    const icScore = inp.internal_control_score >= 80 ? 20 : inp.internal_control_score >= 60 ? 14 : inp.internal_control_score >= 40 ? 8 : 4;
    add('Governance', 'Internal Controls', icScore, 20, 'Score', inp.internal_control_score);
    const auditScore = inp.audit_observations === 0 ? 20 : inp.audit_observations <= 3 ? 14 : inp.audit_observations <= 6 ? 8 : 4;
    add('Governance', 'Audit Observations', auditScore, 20, 'Count', inp.audit_observations);
    add('Governance', 'Loan Policy', inp.loan_policy_compliance === 'Yes' ? 20 : 0, 20, 'Compliance', inp.loan_policy_compliance || 'N/A');

    // ── 8. EXTERNAL / RISK (55) ─────────────────────────────────────────────
    add('External', 'Insurance Coverage', inp.insurance_available === 'Yes' ? 15 : 0, 15, 'Has Insurance', inp.insurance_available || 'N/A');
    const regScore = inp.regulatory_compliance === 'Yes' ? 20 : inp.regulatory_compliance === 'Partial' ? 10 : 0;
    add('External', 'Regulatory Compliance', regScore, 20, 'Compliance Level', inp.regulatory_compliance || 'N/A');
    add('External', 'Climatic Risk', inp.climatic_risk_score <= 3 ? 20 : inp.climatic_risk_score <= 6 ? 12 : 5, 20, 'Risk Score', inp.climatic_risk_score);

    // ── 9. CREDIT HISTORY (40) ──────────────────────────────────────────────
    const bfiMap = { 'Pass': 20, 'Watch List': 14, 'Substandard': 8, 'Doubtful': 4, 'Loss': 0 };
    add('Credit History', 'BFI Credit History', bfiMap[inp.credit_history_bfi] || 5, 20, 'BFI Record', inp.credit_history_bfi || 'N/A');
    add('Credit History', 'Max DPD (BFI)', inp.max_dpd_bfi <= 0 ? 20 : inp.max_dpd_bfi <= 5 ? 16 : inp.max_dpd_bfi <= 15 ? 10 : 4, 20, 'Days Past Due', inp.max_dpd_bfi + ' days');

    // ── 10. INFRA & DIGITAL (25) ────────────────────────────────────────────
    const misScore = inp.digital_mis_pos === 'Yes' ? 15 : inp.digital_mis_pos === 'Partial' ? 8 : 0;
    add('Infrastructure', 'Digital MIS', misScore, 15, 'MIS/POS Adoption', inp.digital_mis_pos || 'N/A');
    const sopScore = inp.quality_sop_score >= 80 ? 10 : inp.quality_sop_score >= 60 ? 6 : inp.quality_sop_score >= 40 ? 3 : 0;
    add('Infrastructure', 'Quality SOP', sopScore, 10, 'SOP Score', inp.quality_sop_score);

    // ── 11. BEHAVIORAL / SOCIAL (30) ────────────────────────────────────────
    const meetMap = { 'Weekly': 10, 'Bi-Weekly': 8, 'Monthly': 6, 'Rarely': 2 };
    add('Behavior', 'Committee Meetings', meetMap[inp.meeting_frequency] || 2, 10, 'Frequency', inp.meeting_frequency || 'N/A');
    const commMap = { 'Significant': 10, 'Moderate': 6, 'Minimal': 2 };
    add('Behavior', 'Community Support', commMap[inp.community_support_level] || 2, 10, 'Level', inp.community_support_level || 'N/A');
    const emgMap = { 'Proper Plan': 10, 'Ad-hoc': 5, 'No Plan': 0 };
    add('Behavior', 'Emergency Plan', emgMap[inp.emergency_response] || 0, 10, 'Preparedness', inp.emergency_response || 'N/A');

    // ── Base credit: Years in operation ────────────────────────────────────
    const yrs = inp.years_operation;
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

    let riskClass = 'low', riskLabel = 'High Risk', riskColor = '#dc2626', riskBg = '#fee2e2';
    if (scoreVal >= 800) { riskClass = 'excellent'; riskLabel = 'Excellent'; riskColor = '#16a34a'; riskBg = '#dcfce7'; }
    else if (scoreVal >= 650) { riskClass = 'good'; riskLabel = 'Good'; riskColor = '#2563eb'; riskBg = '#dbeafe'; }
    else if (scoreVal >= 500) { riskClass = 'moderate'; riskLabel = 'Moderate Risk'; riskColor = '#d97706'; riskBg = '#fef3c7'; }
    else if (scoreVal >= 350) { riskClass = 'caution'; riskLabel = 'Caution'; riskColor = '#ea580c'; riskBg = '#ffedd5'; }

    const scoreNum = document.getElementById('result_score_number');
    if (scoreNum) { scoreNum.textContent = scoreVal; scoreNum.style.color = riskColor; }

    const badge = document.getElementById('result_risk_badge');
    const badgeLabel = document.getElementById('result_risk_label');
    if (badge) { badge.className = 'risk-badge ' + riskClass; badge.style.background = riskBg; badge.style.color = riskColor; badge.style.borderColor = riskColor; }
    if (badgeLabel) badgeLabel.textContent = riskLabel;

    const nameEl = document.getElementById('result_coop_name');
    if (nameEl) nameEl.textContent = gs('coop_name') || '—';
    const ctEl = document.getElementById('result_coop_type');
    if (ctEl) ctEl.textContent = state.modelType === 'collection' ? 'Collection Only' : 'Collection & Processing';
    const custEl = document.getElementById('result_cust_type');
    if (custEl) custEl.textContent = state.customerType === 'new' ? 'New Customer' : 'Existing Customer';

    const pctBarFill = document.getElementById('score_pct_fill');
    const pctText = document.getElementById('score_pct_text');
    if (pctBarFill) { pctBarFill.style.width = (scoreVal / 10) + '%'; pctBarFill.style.background = riskColor; }
    if (pctText) pctText.textContent = (scoreVal / 10).toFixed(1) + '%';

    renderCategoryCards(res, riskColor);
    renderCalcTable(res);

    const sl = document.getElementById('strengths_list');
    const wl = document.getElementById('weaknesses_list');
    if (sl) sl.innerHTML = res.strengths.slice(0, 6).map(s =>
        `<li><span class="sw-name">${s.name}</span> <span class="sw-val">${s.val}</span></li>`
    ).join('') || '<li>No strong areas identified yet.</li>';
    if (wl) wl.innerHTML = res.weaknesses.slice(0, 6).map(w =>
        `<li><span class="sw-name">${w.name}</span> <span class="sw-val">${w.val}</span></li>`
    ).join('') || '<li>No risk factors identified.</li>';

    const rec = document.getElementById('final_recommendation');
    if (rec) {
        const tier = scoreVal >= 800
            ? ['Highly Recommended', '#16a34a', 'The cooperative demonstrates exceptional financial health, strong governance, and stable operations. Loan approval is strongly recommended.']
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
                    backgroundColor: cats.map((_, i) => `hsl(${220 + i * 18},60%,55%)`),
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

function getFallbackQuestionnaire() {
    return {
        sections: [
            {
                id: 'section_1',
                title: 'Identity & Classification',
                icon: 'info',
                subtitle: 'Q1–Q5 | Basic Identity',
                questions: [
                    { id: 'coop_name', type: 'text', labelEng: 'Cooperative Name', labelNep: 'सहकारीको नाम', required: true, placeholder: 'e.g., ABC Dairy Cooperative' },
                    { id: 'model_type', type: 'select', labelEng: 'Model A / B', labelNep: 'सहकारी मोडल', disabled: true, hint: 'Auto-filled from configuration', options: [{ value: '', label: '-- Select Above --' }, { value: 'Milk Collection Only (Model A)', label: 'Milk Collection Only (Model A)' }, { value: 'Collection & Processing (Model B)', label: 'Collection & Processing (Model B)' }] },
                    { id: 'loan_type', type: 'select', labelEng: 'Loan New or Existing?', labelNep: 'ऋण नयाँ हो कि पहिलेबाट?', hint: 'Auto-filled from configuration', options: [{ value: 'New Loan', label: 'New Loan (नयाँ)' }, { value: 'Existing Loan', label: 'Existing Loan (पहिलेबाट)' }] },
                    { id: 'years_operation', type: 'number', labelEng: 'Years in Operation', labelNep: 'सञ्चालनमा कति वर्ष?', min: 0, placeholder: 'e.g., 10' },
                    { id: 'office_location', type: 'text', labelEng: 'Office Location', labelNep: 'कार्यालय कहाँ छ?', placeholder: 'e.g., Kathmandu' }
                ]
            },
            {
                id: 'section_2',
                title: 'Loan Information',
                icon: 'landmark',
                subtitle: 'Q6–Q11, Q98 | Critical for DSCR & Collateral',
                questions: [
                    { id: 'existing_loan', type: 'number', labelEng: 'Existing Loan Outstanding, NPR', labelNep: 'हाल चालु ऋणको बाँकी रकम', min: 0, placeholder: 'e.g., 1500000', oninput: 'calculateTotalLoan()' },
                    { id: 'proposed_loan', type: 'number', labelEng: 'Proposed New Loan, NPR', labelNep: 'नयाँ प्रस्तावित ऋण रकम', required: true, min: 0, placeholder: 'e.g., 2000000', oninput: 'calculateTotalLoan()' },
                    { id: 'total_loan', type: 'number', labelEng: 'Total Loan, Auto', labelNep: 'जम्मा ऋण', readonly: true },
                    { id: 'interest_rate', type: 'number', labelEng: 'Interest Rate % p.a.', labelNep: 'ऋणको ब्याजदर %', step: 0.01, min: 0, max: 100, placeholder: 'e.g., 10' },
                    { id: 'loan_tenure', type: 'number', labelEng: 'Loan Tenure, Months', labelNep: 'ऋण तिर्ने अवधि महिना', min: 1, placeholder: 'e.g., 60' },
                    { id: 'installment_freq', type: 'select', labelEng: 'Installment Frequency', labelNep: 'किस्ताको भुक्तानी आवृत्ति', options: [{ value: 'Monthly', label: 'Monthly' }, { value: 'Quarterly', label: 'Quarterly' }, { value: 'Semi-Annual', label: 'Semi-Annual' }, { value: 'Annual', label: 'Annual' }] },
                    { id: 'primary_land_value', type: 'number', labelEng: 'Primary Land Collateral Value, NPR', labelNep: 'प्राथमिक धितोमा जग्गाको मूल्य', min: 0, placeholder: 'e.g., 5000000' }
                ]
            },
            {
                id: 'section_3',
                title: 'Revenue & Sales',
                icon: 'trending-up',
                subtitle: 'Q12–Q18 | Cash Flow Weight: 180 pts',
                questions: [
                    { id: 'milk_sales', type: 'number', labelEng: 'Income from Milk Sales, NPR', labelNep: 'दूध बिक्रीबाट आम्दानी', min: 0, placeholder: 'e.g., 28000000', oninput: 'calculateRevenue()' },
                    { id: 'other_product_sales', type: 'number', labelEng: 'Other Product Sales, NPR', labelNep: 'अन्य उत्पादन बिक्री', min: 0, placeholder: 'e.g., 1800000', oninput: 'calculateRevenue()' },
                    { id: 'other_income', type: 'number', labelEng: 'Other Income, NPR', labelNep: 'अन्य आम्दानी', min: 0, placeholder: 'e.g., 200000', oninput: 'calculateRevenue()' },
                    { id: 'total_sales', type: 'number', labelEng: 'Total Sales, Auto', labelNep: 'कुल बिक्री', readonly: true },
                    { id: 'grant_income', type: 'number', labelEng: 'Grant / Subsidy Income, NPR', labelNep: 'अनुदानबाट आम्दानी', min: 0, placeholder: 'e.g., 500000', oninput: 'calculateRevenue()' },
                    { id: 'total_revenue', type: 'number', labelEng: 'Total Revenue / कुल आम्दानी (Auto)', labelNep: 'कुल आम्दानी', readonly: true },
                    { id: 'bank_sales', type: 'number', labelEng: 'Sales via Bank, NPR', labelNep: 'बैंक मार्फत भएको बिक्री', min: 0, placeholder: 'e.g., 15000000' }
                ]
            },
            {
                id: 'section_4',
                title: 'Buyer Analysis',
                icon: 'users',
                subtitle: 'Buyer Concentration Risk',
                questions: [
                    { id: 'total_buyers', type: 'number', labelEng: 'Total Number of Buyers', labelNep: 'जम्मा खरिदकर्ता संख्या', min: 1, placeholder: 'e.g., 300' },
                    { id: 'top5_buyers_sales', type: 'number', labelEng: 'Sales from Top 5 Buyers, NPR', labelNep: 'शीर्ष ५ खरिदकर्ताबाट बिक्री', min: 0, placeholder: 'e.g., 8000000', oninput: 'calculateBuyerShares()' },
                    { id: 'largest_buyer_sales', type: 'number', labelEng: 'Largest Single Buyer, NPR', labelNep: 'सबैभन्दा ठूलो एक खरिदकर्ताबाट बिक्री', min: 0, placeholder: 'e.g., 2000000', oninput: 'calculateBuyerShares()' },
                    { id: 'top5_buyer_pct', type: 'number', labelEng: 'Top 5 Buyers Share %, Auto', labelNep: 'शीर्ष ५ खरिदकर्ताको हिस्सा %', readonly: true },
                    { id: 'largest_buyer_pct', type: 'number', labelEng: 'Largest Buyer Share %, Auto', labelNep: 'ठूलो खरिदकर्ताको हिस्सा %', readonly: true },
                    { id: 'avg_collection_days', type: 'number', labelEng: 'Avg Collection Period, Days', labelNep: 'भुक्तानी गर्न औसत दिन', min: 0, placeholder: 'e.g., 35' }
                ]
            },
            {
                id: 'section_5',
                title: 'Operating Costs',
                icon: 'receipt',
                subtitle: 'Q29, Q33–Q47 | For EBITDA Calculation',
                questions: [
                    { id: 'raw_milk_cost', type: 'number', labelEng: 'Cost of Raw Milk Purchase, NPR', labelNep: 'कच्चा दूध किन्न खर्च', min: 0, oninput: 'calculateExpenses()' },
                    { id: 'processing_cost', type: 'number', labelEng: 'Processing Cost, NPR', labelNep: 'प्रशोधन खर्च', isModelB: true, oninput: 'calculateExpenses()' },
                    { id: 'packaging_cost', type: 'number', labelEng: 'Packaging Cost, NPR', labelNep: 'प्याकेजिङ खर्च', isModelB: true, oninput: 'calculateExpenses()' },
                    { id: 'transport_cost', type: 'number', labelEng: 'Transportation Cost, NPR', labelNep: 'ढुवानी खर्च', oninput: 'calculateExpenses()' },
                    { id: 'salary_expense', type: 'number', labelEng: 'Salary Expense, NPR', labelNep: 'तलब खर्च', oninput: 'calculateExpenses()' },
                    { id: 'total_opex', type: 'number', labelEng: 'Total Operating Expenses, Auto', labelNep: 'कुल सञ्चालन खर्च', readonly: true },
                    { id: 'annual_depreciation', type: 'number', labelEng: 'Annual Depreciation, NPR', labelNep: 'वार्षिक मूल्यह्रास', min: 0 },
                    { id: 'amortization_amount', type: 'number', labelEng: 'Amortization Amount, NPR', labelNep: 'अमोर्टाइजेसन', min: 0 }
                ]
            },
            {
                id: 'section_6',
                title: 'Financial Performance',
                icon: 'bar-chart-2',
                subtitle: 'Cash Trend & Audit',
                questions: [
                    { id: 'cash_last_year', type: 'number', labelEng: 'Last Year Cash/Bank Balance, NPR', labelNep: 'गत वर्ष बैंक/नगद मौज्दात', min: 0 },
                    { id: 'cash_prev_year', type: 'number', labelEng: 'Previous Year Cash/Bank Balance, NPR', labelNep: 'अघिल्लो वर्ष बैंक/नगद मौज्दात', min: 0 },
                    { id: 'income_expense_checked', type: 'select', labelEng: 'Was audited?', labelNep: 'जाँच भयो?', options: [{ value: '', label: 'Select' }, { value: 'Regularly', label: 'Regularly' }, { value: 'Occasionally', label: 'Occasionally' }, { value: 'Never', label: 'Never' }] }
                ]
            },
            {
                id: 'section_7',
                title: 'Assets',
                icon: 'package',
                subtitle: 'Q48–Q63 | Financial Strength: 150 pts',
                questions: [
                    { id: 'cash_hand', type: 'number', labelEng: 'Cash in Hand, NPR', labelNep: 'हातमा नगद', oninput: 'calculateAssets()' },
                    { id: 'bank_balance', type: 'number', labelEng: 'Bank Balance, NPR', labelNep: 'बैंक खातामा रकम', oninput: 'calculateAssets()' },
                    { id: 'total_assets', type: 'number', labelEng: 'Total Assets, Auto', labelNep: 'कुल सम्पत्ति', readonly: true }
                ]
            }
        ]
    };
}

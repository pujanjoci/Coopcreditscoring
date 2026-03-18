/**
 * js/ui/formHandler.js
 *
 * Handles:
 *   1. renderQuestionnaire()   — builds section cards from QUESTIONNAIRE definition
 *   2. applyFieldVisibility()  — shows/hides Model B-only fields
 *   3. validateForm()          — enforces all visible fields are filled before submit
 *   4. collectFormInputs()     — reads all field values into a flat object
 *   5. Auto-calc functions     — calculateTotalLoan, calculateRevenue, etc.
 *   6. unlockSidebar()         — no-op stub (kept for compat)
 *
 * KEY RULES:
 *   - Fields with readonly:true are rendered as <input type="hidden"> ONLY.
 *     They never appear visually. Auto-calc functions still write to them.
 *   - Fields with disabled:true are rendered as hidden inputs (auto-filled by config).
 *   - All other visible fields are required — validateForm() blocks submission
 *     if any are empty and highlights them with a red border.
 *   - Dropdown option labels must NOT contain scoring points (· XX pts).
 *     Points are stripped at render time so questions.js labels can include them
 *     as hints for devs without leaking to users.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Fields that are always hidden — auto-filled by config, not user-entered */
const ALWAYS_HIDDEN_IDS = new Set([
    'model_type', 'loan_type'
]);

/** Fields readonly = auto-calculated — hidden inputs, values set by calc fns */
// These are determined dynamically from questions.js (readonly: true)

// ── Render ────────────────────────────────────────────────────────────────────

function renderQuestionnaire(questionnaire, modelType) {
    const container = document.getElementById('questions_container');
    if (!container || !questionnaire) return;

    container.innerHTML = questionnaire.sections
        .map(section => renderSection(section, modelType))
        .join('');

    // Wire all oninput/onchange auto-calc attributes
    container.querySelectorAll('[data-oninput]').forEach(el => {
        const fn = el.getAttribute('data-oninput');
        el.addEventListener('input', () => {
            if (typeof window[fn] === 'function') window[fn]();
        });
    });

    // Apply model visibility immediately
    applyFieldVisibility(modelType);

    // Run all calcs once to populate auto fields
    _runAllCalcs();

    if (window.lucide) lucide.createIcons();
}

function renderSection(section, modelType) {
    const visibleQuestions = section.questions.filter(q => !q.readonly && !ALWAYS_HIDDEN_IDS.has(q.id));
    const hiddenQuestions  = section.questions.filter(q =>  q.readonly ||  ALWAYS_HIDDEN_IDS.has(q.id));

    // Hidden inputs for readonly/auto-calc fields (invisible but readable by engine)
    const hiddenInputsHTML = hiddenQuestions.map(q =>
        `<input type="hidden" id="${q.id}" name="${q.id}" value="">`
    ).join('');

    // Visible question fields
    const visibleHTML = visibleQuestions.map(q => renderField(q)).join('');

    return `
        <div class="section-card" id="section_card_${section.id}">
            <div class="section-header">
                <div class="section-title-row">
                    <div class="section-icon-wrap">
                        <i data-lucide="${section.icon || 'help-circle'}"></i>
                    </div>
                    <div class="section-title-text">
                        <span class="section-title">${section.title}</span>
                    </div>
                </div>
                ${section.subtitle ? `<div class="section-subtitle">${section.subtitle}</div>` : ''}
            </div>
            <div class="form-grid">
                ${hiddenInputsHTML}
                ${visibleHTML}
            </div>
        </div>`;
}

function renderField(q) {
    const isModelB   = !!q.isModelB;
    const wrapClass  = [
        'form-group',
        isModelB ? 'model-b-field' : ''
    ].filter(Boolean).join(' ');

    const inputHTML = q.type === 'select'
        ? renderSelect(q)
        : renderInput(q);

    const hintHTML = q.hint
        ? `<div class="input-hint"><i data-lucide="info" class="hint-icon"></i>${q.hint}</div>`
        : '';

    return `
        <div class="${wrapClass}" id="wrap_${q.id}">
            <label class="field-label" for="${q.id}">
                <span class="field-label-nep">
                    ${q.labelNep || q.labelEng}
                    ${(!q.readonly && !q.disabled) ? '<span class="field-required-star">*</span>' : ''}
                </span>
                <span class="field-label-eng">${q.labelEng}</span>
            </label>
            ${inputHTML}
            ${hintHTML}
        </div>`;
}

function renderInput(q) {
    const attrs = [
        `id="${q.id}"`,
        `name="${q.id}"`,
        `type="${q.type || 'text'}"`,
        q.placeholder ? `placeholder="${q.placeholder}"` : '',
        q.min !== undefined ? `min="${q.min}"` : '',
        q.max !== undefined ? `max="${q.max}"` : '',
        q.step ? `step="${q.step}"` : '',
        q.oninput ? `data-oninput="${q.oninput.replace('()', '')}"` : '',
        // All visible inputs are required
        'data-required="true"'
    ].filter(Boolean).join(' ');

    return `<input ${attrs}>`;
}

function renderSelect(q) {
    // Strip scoring point hints from option labels (e.g. "· 20 pts", "· 14 pts")
    // so users never see the scoring weights
    const cleanLabel = (label) => label.replace(/\s*[·•]\s*\d+\s*pts?/gi, '').trim();

    const optionsHTML = (q.options || []).map(opt =>
        `<option value="${opt.value}">${cleanLabel(opt.label)}</option>`
    ).join('');

    const attrs = [
        `id="${q.id}"`,
        `name="${q.id}"`,
        q.oninput ? `data-oninput="${q.oninput.replace('()', '')}"` : '',
        'data-required="true"'
    ].filter(Boolean).join(' ');

    return `<select ${attrs}>${optionsHTML}</select>`;
}

// ── Field Visibility (Model A vs B) ──────────────────────────────────────────

function applyFieldVisibility(modelType) {
    const isProcessing = modelType === 'processing';
    document.querySelectorAll('.model-b-field').forEach(el => {
        el.style.display = isProcessing ? '' : 'none';
    });
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate all visible required fields before submission.
 * Highlights empty fields with a red border and scrolls to the first error.
 * @param {Object} questionnaire - QUESTIONNAIRE from questions.js (unused, kept for compat)
 * @param {Function} toastFn     - showToast(msg, type)
 * @returns {boolean} true if valid, false if any field is empty
 */
function validateForm(questionnaire, toastFn) {
    // Clear previous error states
    document.querySelectorAll('.field-error').forEach(el => {
        el.classList.remove('field-error');
        el.style.borderColor = '';
    });
    document.querySelectorAll('.field-error-msg').forEach(el => el.remove());

    const errors = [];

    // Check every visible input/select that has data-required="true"
    document.querySelectorAll(
        '#questions_container input[data-required="true"], ' +
        '#questions_container select[data-required="true"]'
    ).forEach(el => {
        // Skip hidden fields and model-b fields that are currently hidden
        if (el.type === 'hidden') return;
        const wrap = el.closest('.form-group');
        if (wrap && wrap.style.display === 'none') return;

        const val = (el.value || '').trim();
        const isEmpty = val === '' || val === '0' && el.tagName === 'SELECT';

        // For selects, empty means the placeholder option (value="") is selected
        const isSelectEmpty = el.tagName === 'SELECT' && el.value === '';
        // For number inputs, allow 0 as a valid value (e.g. existing_loan = 0 is fine)
        const isInputEmpty  = el.tagName === 'INPUT'  && val === '';

        if (isSelectEmpty || isInputEmpty) {
            el.classList.add('field-error');
            el.style.borderColor = '#dc2626';
            errors.push(el);
        }
    });

    if (errors.length > 0) {
        // Scroll to first error
        const firstWrap = errors[0].closest('.form-group') || errors[0];
        firstWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const count = errors.length;
        if (typeof toastFn === 'function') {
            toastFn(
                `${count} field${count > 1 ? 's are' : ' is'} required. Please fill all fields before submitting.`,
                'error'
            );
        }

        // Remove red border when user starts filling the field
        errors.forEach(el => {
            const clear = () => {
                el.style.borderColor = '';
                el.classList.remove('field-error');
            };
            el.addEventListener('input',  clear, { once: true });
            el.addEventListener('change', clear, { once: true });
        });

        return false;
    }

    return true;
}

// ── Collect Inputs ────────────────────────────────────────────────────────────

/**
 * Read all form inputs into a flat key→value object.
 * Includes hidden inputs (auto-calc fields) so the engine gets everything.
 */
function collectFormInputs() {
    const inputs = {};
    document.querySelectorAll(
        '#questions_container input[id], ' +
        '#questions_container select[id]'
    ).forEach(el => {
        if (!el.id) return;
        if (el.type === 'number' || el.getAttribute('type') === 'number') {
            inputs[el.id] = parseFloat(el.value) || 0;
        } else {
            inputs[el.id] = el.value || '';
        }
    });
    return inputs;
}

// ── Auto-Calc Functions ───────────────────────────────────────────────────────

function calculateTotalLoan() {
    const existing  = safeNum(document.getElementById('existing_loan')?.value);
    const proposed  = safeNum(document.getElementById('proposed_loan')?.value);
    _setHidden('total_loan', existing + proposed);
}

function calculateRevenue() {
    const milk     = safeNum(document.getElementById('milk_sales')?.value);
    const other    = safeNum(document.getElementById('other_product_sales')?.value);
    const otherInc = safeNum(document.getElementById('other_income')?.value);
    const grant    = safeNum(document.getElementById('grant_income')?.value);
    const sales    = milk + other + otherInc;
    const revenue  = sales + grant;
    _setHidden('total_sales',   sales);
    _setHidden('total_revenue', revenue);
}

function calculateBuyerShares() {
    const totalSalesEl = document.getElementById('total_sales');
    const totalSales   = safeNum(totalSalesEl?.value) || (() => {
        // Fallback: recalculate if total_sales hidden field not yet set
        return safeNum(document.getElementById('milk_sales')?.value)
             + safeNum(document.getElementById('other_product_sales')?.value)
             + safeNum(document.getElementById('other_income')?.value);
    })();

    const top5    = safeNum(document.getElementById('top5_buyers_sales')?.value);
    const largest = safeNum(document.getElementById('largest_buyer_sales')?.value);

    _setHidden('top5_buyer_pct',    totalSales > 0 ? round2((top5    / totalSales) * 100) : 0);
    _setHidden('largest_buyer_pct', totalSales > 0 ? round2((largest / totalSales) * 100) : 0);
}

function calculateExpenses() {
    const ids = [
        'raw_milk_cost', 'processing_cost', 'packaging_cost', 'transport_cost',
        'other_processing_cost', 'salary_expense', 'admin_expense',
        'electricity_expense', 'fuel_expense', 'repair_expense',
        'rent_expense', 'other_opex'
    ];
    const total = ids.reduce((sum, id) => sum + safeNum(document.getElementById(id)?.value), 0);
    _setHidden('total_opex', total);
}

function calculateAssets() {
    const cashHand  = safeNum(document.getElementById('cash_hand')?.value);
    const bankBal   = safeNum(document.getElementById('bank_balance')?.value);
    const totalCash = cashHand + bankBal;
    _setHidden('total_cash', totalCash);

    const currentIds = ['accounts_receivable', 'inventory_value', 'prepaid_expenses', 'other_current_assets'];
    const totalCurrent = totalCash + currentIds.reduce((s, id) => s + safeNum(document.getElementById(id)?.value), 0);
    _setHidden('total_current_assets', totalCurrent);

    const fixedIds = ['land_value', 'building_value', 'machinery_value', 'vehicle_value', 'furniture_value', 'other_fixed_assets'];
    const totalFixed = fixedIds.reduce((s, id) => s + safeNum(document.getElementById(id)?.value), 0);
    _setHidden('total_fixed_assets', totalFixed);
    _setHidden('total_assets', totalCurrent + totalFixed);
}

function calculateLiabilities() {
    const currentIds = ['accounts_payable', 'short_term_loan', 'accrued_expenses', 'current_ltd'];
    const totalCurrent = currentIds.reduce((s, id) => s + safeNum(document.getElementById(id)?.value), 0);
    _setHidden('total_current_liabilities', totalCurrent);

    const ltlIds = ['long_term_loan', 'other_ltl'];
    const totalLTL = ltlIds.reduce((s, id) => s + safeNum(document.getElementById(id)?.value), 0);
    _setHidden('total_long_term_liabilities', totalLTL);
    _setHidden('total_liabilities', totalCurrent + totalLTL);
}

function calculateNetWorth() {
    const ids = ['paid_up_capital', 'retained_earnings', 'reserve_fund'];
    const total = ids.reduce((s, id) => s + safeNum(document.getElementById(id)?.value), 0);
    _setHidden('total_net_worth', total);
}

function calculateMilkMetrics() {
    const collected = safeNum(document.getElementById('total_milk_collected')?.value);
    const milkLoss  = safeNum(document.getElementById('milk_loss')?.value);
    const procLoss  = safeNum(document.getElementById('processing_loss')?.value);
    _setHidden('total_milk_sold', Math.max(0, collected - milkLoss - procLoss));

    const farmers = safeNum(document.getElementById('total_farmers')?.value);
    _setHidden('avg_milk_per_farmer', farmers > 0 ? round2(collected / farmers) : 0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Write value to a hidden input by id */
function _setHidden(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

/** Run all auto-calc functions once (called after render) */
function _runAllCalcs() {
    calculateTotalLoan();
    calculateRevenue();
    calculateBuyerShares();
    calculateExpenses();
    calculateAssets();
    calculateLiabilities();
    calculateNetWorth();
    calculateMilkMetrics();
}

/** Stub — kept for script.js compatibility */
function unlockSidebar() {}
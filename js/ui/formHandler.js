/**
 * formHandler.js — Questionnaire UI Handler
 * Handles questionnaire rendering, field visibility, auto-calculations,
 * form validation, and the main calculate button flow.
 */

// ── Questionnaire Rendering ───────────────────────────────────────────────────

/**
 * Render the full questionnaire into the questions_container element.
 * @param {Object} questionnaire - Questionnaire object with sections array
 * @param {string} modelType     - 'collection' | 'processing'
 */
function renderQuestionnaire(questionnaire, modelType) {
    const container = document.getElementById('questions_container');
    if (!container) return;

    container.innerHTML = '';
    let totalRendered = 0;

    (questionnaire.sections || []).forEach((section, idx) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section-card';
        sectionDiv.style.marginBottom = '24px';

        let questionsHtml = '';
        (section.questions || []).forEach(q => {
            const isModelBOnly = q.isModelB === true;
            const modelBClass  = isModelBOnly ? ' model-b-field hidden' : '';
            const requiredStar = q.required ? ' <span class="field-required-star" aria-label="required">*</span>' : '';
            const requiredTag  = q.required ? '<span class="required-tag">Required</span>' : '';
            const readonlyBadge = q.readonly ? '<span class="auto-calc-badge">Auto</span>' : '';

            let inputHtml = '';
            if (q.type === 'select') {
                const opts = (q.options || []).map(opt =>
                    `<option value="${_esc(opt.value)}">${_esc(opt.label)}</option>`
                ).join('');
                inputHtml = `<select id="${q.id}"${q.disabled ? ' disabled' : ''}${q.onchange ? ` onchange="${q.onchange}"` : ''}>${opts}</select>`;
            } else if (q.type === 'textarea') {
                inputHtml = `<textarea id="${q.id}" placeholder="${_esc(q.placeholder || '')}"${q.oninput ? ` oninput="${q.oninput}"` : ''}></textarea>`;
            } else {
                const attrs = [
                    `type="${q.type || 'text'}"`,
                    `id="${q.id}"`,
                    q.placeholder !== undefined ? `placeholder="${_esc(String(q.placeholder))}"` : '',
                    q.min         !== undefined ? `min="${q.min}"` : '',
                    q.max         !== undefined ? `max="${q.max}"` : '',
                    q.step        !== undefined ? `step="${q.step}"` : '',
                    q.readonly    ? 'readonly' : '',
                    q.disabled    ? 'disabled' : '',
                    q.oninput     ? `oninput="${q.oninput}"` : ''
                ].filter(Boolean).join(' ');
                inputHtml = `<input ${attrs}>`;
            }

            const hintHtml = q.hint ? `<div class="input-hint"><i data-lucide="info" class="hint-icon"></i>${_esc(q.hint)}</div>` : '';

            questionsHtml += `
                <div class="form-group${modelBClass}">
                    <label class="field-label" for="${q.id}">
                        <span class="field-label-nep">${_esc(q.labelNep || '')}${requiredStar}${readonlyBadge}</span>
                        <span class="field-label-eng">${_esc(q.labelEng || '')}${q.required ? '&nbsp;' + requiredTag : ''}</span>
                    </label>
                    ${inputHtml}
                    ${hintHtml}
                </div>
            `;
            totalRendered++;
        });

        sectionDiv.innerHTML = `
            <div class="section-header">
                <div class="section-title-row">
                    <div class="section-icon-wrap"><i data-lucide="${_esc(section.icon || 'file-text')}"></i></div>
                    <div class="section-title-text">
                        <span class="section-title">${_esc(section.title)}</span>
                        <span class="section-badge">Section ${idx + 1}</span>
                    </div>
                </div>
                ${section.subtitle ? `<div class="section-subtitle">${_esc(section.subtitle)}</div>` : ''}
            </div>
            <div class="form-grid">${questionsHtml}</div>
        `;
        container.appendChild(sectionDiv);
    });

    // Apply model-B field visibility after rendering
    applyFieldVisibility(modelType);

    if (window.lucide) lucide.createIcons();
    console.log(`[FormHandler] Rendered ${totalRendered} questions across ${(questionnaire.sections || []).length} sections.`);
}

/**
 * Escape HTML special characters (prevent XSS in dynamic content).
 * @param {string} str
 * @returns {string}
 */
function _esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ── Field Visibility (Model A vs Model B) ─────────────────────────────────────

/**
 * Show or hide model-B-only fields based on the selected model type.
 * @param {string} modelType - 'collection' | 'processing'
 */
function applyFieldVisibility(modelType) {
    const isModelB = modelType === 'processing';
    document.querySelectorAll('.model-b-field').forEach(el => {
        el.classList.toggle('hidden', !isModelB);
    });
}

// ── Auto-Calculation Functions ────────────────────────────────────────────────
// These are called via oninput attributes in the rendered HTML.

/** Section 2: Total Loan */
function calculateTotalLoan() {
    const val = safeNum(gv('existing_loan')) + safeNum(gv('proposed_loan'));
    sv('total_loan', val);
}

/** Section 3: Revenue totals */
function calculateRevenue() {
    const milk     = safeNum(gv('milk_sales'));
    const other    = safeNum(gv('other_product_sales'));
    const otherInc = safeNum(gv('other_income'));
    const grant    = safeNum(gv('grant_income'));
    sv('total_sales',   milk + other + otherInc);
    sv('total_revenue', milk + other + otherInc + grant);
}

/** Section 4: Buyer share percentages */
function calculateBuyerShares() {
    const totalSales = safeNum(gv('total_sales')) || (safeNum(gv('milk_sales')) + safeNum(gv('other_product_sales')) + safeNum(gv('other_income')));
    if (totalSales > 0) {
        sv('top5_buyer_pct',     ((safeNum(gv('top5_buyers_sales')) / totalSales) * 100).toFixed(1));
        sv('largest_buyer_pct',  ((safeNum(gv('largest_buyer_sales')) / totalSales) * 100).toFixed(1));
    }
}

/** Section 5: Total operating expenses */
function calculateExpenses() {
    const ids = [
        'raw_milk_cost', 'processing_cost', 'packaging_cost', 'transport_cost',
        'other_processing_cost', 'salary_expense', 'admin_expense',
        'electricity_expense', 'fuel_expense', 'repair_expense', 'rent_expense', 'other_opex'
    ];
    sv('total_opex', ids.reduce((sum, id) => sum + safeNum(gv(id)), 0));
}

/** Section 7: Assets */
function calculateAssets() {
    const cash    = safeNum(gv('cash_hand')) + safeNum(gv('bank_balance'));
    sv('total_cash', cash);
    const current = cash + safeNum(gv('accounts_receivable')) + safeNum(gv('inventory_value'))
                  + safeNum(gv('prepaid_expenses')) + safeNum(gv('other_current_assets'));
    sv('total_current_assets', current);
    const fixed   = safeNum(gv('land_value')) + safeNum(gv('building_value')) + safeNum(gv('machinery_value'))
                  + safeNum(gv('vehicle_value')) + safeNum(gv('furniture_value')) + safeNum(gv('other_fixed_assets'));
    sv('total_fixed_assets', fixed);
    sv('total_assets', current + fixed);
}

/** Section 8: Liabilities */
function calculateLiabilities() {
    const current = safeNum(gv('accounts_payable')) + safeNum(gv('short_term_loan'))
                  + safeNum(gv('accrued_expenses')) + safeNum(gv('current_ltd'));
    sv('total_current_liabilities', current);
    const ltl     = safeNum(gv('long_term_loan')) + safeNum(gv('other_ltl'));
    sv('total_long_term_liabilities', ltl);
    sv('total_liabilities', current + ltl);
}

/** Section 9: Net Worth */
function calculateNetWorth() {
    sv('total_net_worth',
        safeNum(gv('paid_up_capital')) + safeNum(gv('retained_earnings')) + safeNum(gv('reserve_fund')));
}

/** Section 10: Milk Metrics */
function calculateMilkMetrics() {
    const collected = safeNum(gv('total_milk_collected'));
    const loss      = safeNum(gv('milk_loss'));
    const pLoss     = safeNum(gv('processing_loss'));
    sv('total_milk_sold', Math.max(0, collected - loss - pLoss));
    const farmers = safeNum(gv('total_farmers'));
    if (farmers > 0 && collected > 0) {
        sv('avg_milk_per_farmer', (collected / farmers).toFixed(1));
    }
}

// ── DOM Helpers ───────────────────────────────────────────────────────────────

/**
 * Get the numeric value of an input element by ID.
 */
function gv(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = parseFloat(el.value);
    return isNaN(v) ? 0 : v;
}

/**
 * Set the value of an input element by ID.
 */
function sv(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = (typeof val === 'number' && !Number.isInteger(val)) ? val.toFixed(2) : val;
}

// ── Form Validation ───────────────────────────────────────────────────────────

/**
 * Validate all required questionnaire fields.
 * Highlights the first invalid field and shows a toast.
 * @param {Object} questionnaire
 * @param {function} showToastFn - showToast(msg, type) function
 * @returns {boolean} - true if valid
 */
function validateForm(questionnaire, showToastFn) {
    if (!questionnaire) return true;

    for (const section of (questionnaire.sections || [])) {
        for (const q of (section.questions || [])) {
            if (!q.required) continue;
            if (q.isModelB) continue;  // model-B fields are optional for model A
            const el = document.getElementById(q.id);
            if (!el) continue;
            if (!el.value || !el.value.trim()) {
                el.style.borderColor = 'var(--danger)';
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
                if (showToastFn) showToastFn(`"${q.labelEng}" is required.`, 'error');
                return false;
            }
            el.style.borderColor = '';
        }
    }
    return true;
}

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
// scoringEngine.js (loaded before this file) defines all calculateXxx() functions
// with the correct new field IDs. This file does NOT redefine them.
// _runAllCalcs() calls them directly.

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Write value to a hidden input by id */
function _setHidden(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

/** Run all auto-calc functions once (called after render).
 *  These are defined in scoringEngine.js with correct new field IDs. */
function _runAllCalcs() {
    if (typeof calculateTotalLoan    === 'function') calculateTotalLoan();
    if (typeof calculateRevenue      === 'function') calculateRevenue();
    if (typeof calculateBuyerShares  === 'function') calculateBuyerShares();
    if (typeof calculateExpenses     === 'function') calculateExpenses();
    if (typeof calculateAssets       === 'function') calculateAssets();
    if (typeof calculateLiabilities  === 'function') calculateLiabilities();
    if (typeof calculateNetWorth     === 'function') calculateNetWorth();
    if (typeof calculateMilkMetrics  === 'function') calculateMilkMetrics();
}

/** Stub — kept for script.js compatibility */
function unlockSidebar() {}
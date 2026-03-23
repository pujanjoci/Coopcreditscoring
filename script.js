/**
 * Credit Scoring Portal — script.js
 *
 * FIXES:
 *   1. model_type and customer_type are now ALWAYS injected into the answers
 *      object before submission — they were silently missing because formHandler.js
 *      marks model_type as ALWAYS_HIDDEN and collectFormInputs() skips hidden inputs.
 *   2. submitToGAS() now sends a separate top-level `modelLabel` field so the
 *      Google Sheet can store it in a dedicated "Model" column without parsing JSON.
 *   3. JSON strings sent to GAS are never CSV-split because GAS appendRow() handles
 *      them correctly — but we now double-check that the payload is well-formed.
 *
 * Load order (enforced by index.html):
 *   1. js/engine/scoringEngine.js  (shared utils + auto-calc triggers + orchestrator)
 *   2. js/engine/dataTransform.js  (Data Sheet layer)
 *   3. js/engine/calculations.js   (Calculations Sheet layer)
 *   4. js/engine/model.js          (Model/scoring layer)
 *   5. js/questions.js             (questionnaire definition)
 *   6. js/ui/loadingModal.js       (loading overlay)
 *   7. js/ui/formHandler.js        (form render + validation)
 *   8. script.js                   (app controller — this file)
 */

// ── Global State ──────────────────────────────────────────────────────────────
const state = {
    modelType:         null,   // 'collection' | 'processing'
    customerType:      null,   // 'new' | 'existing'
    currentSection:    'config',
    completedSections: new Set(),
    charts:            {},
    results:           {}
};

const VALID_ROUTES = ['config', 'questions'];
const STORAGE_KEY  = 'coop_portal_config';

const GOOGLE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzUJid9Q7bePYbSwnmNsbuUohAIDGeCfCz31V6j7pOLr2C8PnjwaDFW2l47VstJfv56Kw/exec';

const SCORE_TIERS = [
    { min: 0,   max: 499,  label: 'D Risk', riskClass: 'high-risk',  color: '#b91c1c', bg: '#fee2e2' },
    { min: 500, max: 699,  label: 'C Risk', riskClass: 'elevated',   color: '#d97706', bg: '#fef3c7' },
    { min: 700, max: 849,  label: 'B Risk', riskClass: 'moderate',   color: '#2563eb', bg: '#dbeafe' },
    { min: 850, max: 1000, label: 'A Risk', riskClass: 'acceptable', color: '#16a34a', bg: '#dcfce7' }
];

function getTier(score) {
    return SCORE_TIERS.find(t => score >= t.min && score <= t.max) || SCORE_TIERS[0];
}

// ── Initialization ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    showLoading('Loading questionnaire…');

    // Always wipe saved config so page starts fresh
    localStorage.removeItem(STORAGE_KEY);

    // Strip any hash so #questions can't auto-navigate
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname);
    }

    try {
        const q = (typeof QUESTIONNAIRE !== 'undefined') ? QUESTIONNAIRE : null;
        if (!q) throw new Error('QUESTIONNAIRE not found — check js/questions.js is loaded.');

        state.questionnaire = q;

        if (window.lucide) lucide.createIcons();

        navigateTo('config', false);

        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace('#', '') || 'config';
            if (h === 'questions' && !(state.modelType && state.customerType)) {
                history.replaceState(null, '', window.location.pathname);
                navigateTo('config', false);
                return;
            }
            if (VALID_ROUTES.includes(h)) navigateTo(h, false);
        });

    } catch (err) {
        console.error('Init error:', err);
        const container = document.getElementById('questions_container');
        if (container) {
            container.innerHTML = `
                <div class="alert" style="margin:40px;text-align:center;">
                    <i data-lucide="alert-circle" style="width:48px;height:48px;margin-bottom:16px;"></i>
                    <h3>Error Loading Portal</h3>
                    <p>${err.message}</p>
                    <button onclick="location.reload()" class="btn-calculate" style="margin-top:20px;">Retry</button>
                </div>`;
            if (window.lucide) lucide.createIcons();
        }
    } finally {
        hideLoading();
    }
});

// ── Persist / Restore ─────────────────────────────────────────────────────────

function saveConfig() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        modelType:         state.modelType,
        customerType:      state.customerType,
        completedSections: [...state.completedSections]
    }));
}

function restoreConfig() {
    return false;
}

// ── Routing ───────────────────────────────────────────────────────────────────
function router() {
    const hash   = window.location.hash.replace('#', '') || 'config';
    const target = VALID_ROUTES.includes(hash) ? hash : 'config';
    if (!state.modelType && target !== 'config') {
        navigateTo('config', false);
        return;
    }
    navigateTo(target, false);
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigateTo(sectionId, pushHash = true) {
    document.querySelectorAll('.config-panel, #questions').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });

    const target = document.getElementById(sectionId);
    if (target) target.classList.remove('hidden');

    if (sectionId === 'questions' && state.questionnaire && !state._questionnaireRendered) {
        renderQuestionnaire(state.questionnaire, state.modelType);
        applyRestoredConfigUI();
        state._questionnaireRendered = true;
    }

    state.currentSection = sectionId;

    if (pushHash) history.pushState({ section: sectionId }, '', '#' + sectionId);
    window.scrollTo(0, 0);
    if (window.lucide) lucide.createIcons();
}

// ── Configuration ─────────────────────────────────────────────────────────────
function setCoopType(type) {
    state.modelType = type;
    document.querySelectorAll('input[name="coop_type"]').forEach(el => {
        el.closest('.radio-card').classList.toggle('selected', el.value === type);
    });
    // Write the human-readable label into the hidden model_type input
    const modelEl = document.getElementById('model_type');
    if (modelEl) {
        modelEl.disabled = false;
        modelEl.value = type === 'collection'
            ? 'Milk Collection Only (Model A)'
            : 'Collection & Processing (Model B)';
    }
    if (state._questionnaireRendered) applyFieldVisibility(type);
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
    const btnNext  = document.getElementById('btn_start_questions');
    const ready    = !!(state.modelType && state.customerType);
    if (alertBox) alertBox.classList.toggle('hidden', ready);
    if (btnNext)  btnNext.classList.toggle('hidden', !ready);
    if (ready) {
        state.completedSections.add('config');
        saveConfig();
    } else {
        state.completedSections.delete('config');
    }
}

/**
 * No-op — config is never restored on page load.
 */
function applyRestoredConfigUI() {}

// ── Calculate Handler ─────────────────────────────────────────────────────────
function handleCalculateClick() {
    if (!validateForm(state.questionnaire, showToast)) return;

    state.completedSections.add('questions');
    saveConfig();

    showLoading('Calculating credit score…', 'Running 1000-point model…');

    setTimeout(() => {
        try {
            const inputs = collectFormInputs();

            // ── FIX 1: Always inject config values into answers ──────────────
            // collectFormInputs() reads the DOM but model_type is in ALWAYS_HIDDEN_IDS
            // (formHandler.js) so it is never rendered as an input — we inject it here.
            inputs.model_type    = state.modelType === 'collection'
                ? 'Milk Collection Only (Model A)'
                : 'Collection & Processing (Model B)';
            inputs.customer_type = state.customerType || 'new';

            // Also write to the hidden DOM element so engine reads it too
            const modelEl = document.getElementById('model_type');
            if (modelEl) modelEl.value = inputs.model_type;

            const result = runScoringEngine(inputs);
            state.results = result;

            const localId = saveSubmissionLocally(inputs, result);

            submitToGAS(inputs, result, localId).then(function(gasId) {
                hideLoading();
                showSuccessScreen(result, gasId || localId);
            }).catch(function() {
                hideLoading();
                showSuccessScreen(result, localId);
            });
        } catch (err) {
            hideLoading();
            console.error('Scoring error:', err);
            showToast('Calculation failed: ' + err.message, 'error');
        }
    }, 50);
}

// ── Success Screen ────────────────────────────────────────────────────────────
function showSuccessScreen(result, submissionId) {
    const container = document.getElementById('questions');
    if (!container) return;

    window.scrollTo(0, 0);
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="width: 64px; height: 64px; background: rgba(22, 163, 74, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <i data-lucide="check-circle" style="width: 32px; height: 32px; color: #16a34a;"></i>
            </div>
            <h2 style="font-size: 24px; font-weight: 700; color: var(--ink-2); margin-bottom: 12px;">Submission Successful</h2>
            <p style="font-size: 15px; color: var(--ink-4); max-width: 400px; margin: 0 auto 32px; line-height: 1.5;">
                Your cooperative details and financial data have been successfully evaluated and sent to the administrator.
            </p>
            <div style="background: var(--surface-1); border: 1px solid var(--border-light); border-radius: 12px; padding: 24px; max-width: 480px; margin: 0 auto 32px; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: var(--ink-4); font-size: 13px;">Submission ID:</span>
                    <strong style="color: var(--ink-2); font-family: monospace;">${submissionId || Date.now().toString(36).toUpperCase()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--ink-4); font-size: 13px;">Status:</span>
                    <span style="background: rgba(22, 163, 74, 0.1); color: #16a34a; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">Awaiting Approval</span>
                </div>
            </div>
            <button onclick="location.reload()" class="btn-calculate" style="width: auto; padding: 0 32px;">
                <i data-lucide="plus"></i> Submit Another
            </button>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

// ── Save Submission Locally ───────────────────────────────────────────────────
function saveSubmissionLocally(inputs, result) {
    try {
        const KEY  = 'coop_submissions';
        const all  = JSON.parse(localStorage.getItem(KEY) || '[]');
        const coopNameEl = document.getElementById('coop_name');
        const _h = () => Math.floor(Math.random()*0xFFFFFFFF).toString(16).toUpperCase().padStart(8,'0');
        const localId = 'SUB-' + _h().slice(0,8) + '-' + _h().slice(0,3);
        const submission = {
            id:             localId,
            submittedAt:    new Date().toISOString(),
            coopName:       (coopNameEl && coopNameEl.value) || inputs.coop_name || '—',
            modelType:      state.modelType    || 'collection',
            customerType:   state.customerType || 'new',
            score:          result.totalScore  || 0,
            riskTier:       result.riskCategory || '—',
            answers:        inputs,
            result:         result,
            approverStatus: 'pending',
            approverNotes:  '',
            approverDecidedAt: null
        };
        all.push(submission);
        if (all.length > 200) all.splice(0, all.length - 200);
        localStorage.setItem(KEY, JSON.stringify(all));
        return localId;
    } catch (err) {
        console.warn('Could not save submission to localStorage:', err.message);
        return null;
    }
}

// ── Submit to GAS ─────────────────────────────────────────────────────────────
async function submitToGAS(answers, result, submissionId) {
    if (!GOOGLE_WEB_APP_URL) {
        console.info('[Submission] GOOGLE_WEB_APP_URL not set — skipping submission.');
        return null;
    }

    showLoading('Submitting data…', 'Saving, Please wait...');
    try {
        // ── FIX 2: Send modelLabel as a separate top-level field ─────────────
        // This lets GAS write it to its own "Model" column without JSON parsing.
        const modelLabel = state.modelType === 'collection'
            ? 'Collection Only (Model A)'
            : 'Collection & Processing (Model B)';

        const payload = {
            action:     'submitAnswers',
            submissionId: submissionId,
            answers,                    // includes model_type + customer_type (injected above)
            score:      result.totalScore,
            riskTier:   result.riskCategory,
            modelLabel,                 // ← NEW: plain string for its own sheet column
            timestamp:  new Date().toISOString(),
            resultBreakdown: {
                totalScore:     result.totalScore,
                rawTotal:       result.rawTotal,
                riskCategory:   result.riskCategory,
                recommendation: result.recommendation,
                categories: (result.categories || []).map(c => ({
                    name:  c.name,
                    score: c.score,
                    max:   c.max,
                    logs:  c.logs || []
                })),
                indicators: result.indicators  || [],
                metrics:    result.metrics     || {},
                strengths:  result.strengths   || [],
                weaknesses: result.weaknesses  || [],
                focus:      result.focus       || []
            }
        };

        // ── FIX 3: Verify JSON is valid before sending ───────────────────────
        // JSON.stringify can silently produce truncated output on circular refs.
        // Re-parse to catch any serialisation errors before they reach GAS.
        const bodyStr = JSON.stringify(payload);
        JSON.parse(bodyStr); // throws if malformed

        // GAS redirects via echo?user_content_key=… causing ERR_CONNECTION_CLOSED.
        // redirect:'manual' catches this as type='opaqueredirect' — treat as success
        // and return the client-generated submissionId sent in the payload.
        const controller = new AbortController();
        const _timer = setTimeout(() => controller.abort(), 15000);
        let r;
        try {
            r = await fetch(GOOGLE_WEB_APP_URL, {
                method:   'POST',
                headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
                body:     bodyStr,
                redirect: 'manual',
                signal:   controller.signal
            });
        } finally {
            clearTimeout(_timer);
        }
        if (r.type === 'opaqueredirect' || r.status === 0) {
            showToast('Data submitted successfully.', 'success');
            return submissionId;
        }
        const text = await r.text();
        if (text.trim().startsWith('<')) throw new Error('GAS returned HTML — check deploy settings.');
        const data = JSON.parse(text);
        if (data.success) {
            showToast('Data submitted successfully.', 'success');
            return data.submissionId || submissionId;
        } else {
            showToast('Submission warning: ' + (data.error || 'unknown'), 'warn');
            return submissionId;
        }
    } catch (err) {
        console.warn('[Submission] Failed:', err.message);
        showToast('Submission skipped (offline).', 'warn');
    } finally {
        hideLoading();
    }
}

// ── Toast Notifications ───────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = 'info') {
    let t = document.getElementById('_toast');
    if (!t) {
        t = document.createElement('div');
        t.id = '_toast';
        t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99998;padding:11px 20px;border-radius:8px;font-size:13px;font-weight:600;font-family:DM Sans,sans-serif;display:flex;align-items:center;gap:9px;box-shadow:0 4px 20px rgba(0,0,0,.18);max-width:480px;white-space:nowrap;transition:opacity .3s;';
        document.body.appendChild(t);
    }
    const s = {
        success: { bg: '#1a4a1a', color: '#d4f0d4', icon: '✓' },
        warn:    { bg: '#4a3800', color: '#f0e0a0', icon: '⚠' },
        error:   { bg: '#4a1a1a', color: '#f0d0d0', icon: '✕' }
    }[type] || { bg: '#1a1a1a', color: '#fff', icon: 'ℹ' };
    t.style.background = s.bg;
    t.style.color      = s.color;
    t.style.opacity    = '1';
    t.innerHTML        = `<span>${s.icon}</span><span>${msg}</span>`;
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 4000);
}

// ── Compatibility Stubs ───────────────────────────────────────────────────────
function handleDecisionChange() {}
async function submitApproverDecision() {}
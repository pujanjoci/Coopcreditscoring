/**
 * Credit Scoring Portal — script.js
 *
 * CHANGES from previous version:
 *   - Config is NEVER restored from localStorage on page load
 *   - localStorage config key is cleared on every fresh load
 *   - URL hash is cleared on load so #questions can't bypass config
 *   - hashchange guard prevents navigating to questions without config
 *   - saveConfig() uses sessionStorage only (survives tab navigation but not reload)
 *   - applyRestoredConfigUI() is kept as no-op for compatibility
 *
 * Load order (enforced by index.html):
 *   1. js/utils.js
 *   2. js/engine/dataTransform.js
 *   3. js/engine/calculations.js
 *   4. js/engine/model.js
 *   5. js/engine/scoringEngine.js
 *   6. js/questions.js
 *   7. js/ui/loadingModal.js
 *   8. js/ui/formHandler.js
 *   9. script.js
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

const GOOGLE_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz9PodwguDEr4EWEMKlN-Lu566k13970kXXQlMp9rwEsgpni7gQz-dALRlnB9q5Fht22g/exec';

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

    // ── KEY CHANGE: always wipe saved config so page starts fresh ──
    localStorage.removeItem(STORAGE_KEY);

    // ── KEY CHANGE: strip any hash so #questions can't auto-navigate ──
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname);
    }

    try {
        const q = (typeof QUESTIONNAIRE !== 'undefined') ? QUESTIONNAIRE : null;
        if (!q) throw new Error('QUESTIONNAIRE not found — check js/questions.js is loaded.');

        state.questionnaire = q;

        // Do NOT restore config — always start clean
        // applyRestoredConfigUI() is a no-op kept for compat

        if (window.lucide) lucide.createIcons();

        // Always route to config on fresh load
        navigateTo('config', false);

        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace('#', '') || 'config';
            // Guard: never jump to questions unless config is complete
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

/**
 * Save config to sessionStorage only.
 * sessionStorage survives tab navigation but is wiped on page reload/close —
 * so config is never remembered across fresh loads.
 */
function saveConfig() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        modelType:         state.modelType,
        customerType:      state.customerType,
        completedSections: [...state.completedSections]
    }));
}

/**
 * Kept for compatibility — config is never restored on load.
 * Returns false always so calling code skips restoration.
 */
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

    // Lazily render questionnaire on first navigate-to-questions
    if (sectionId === 'questions' && state.questionnaire && !state._questionnaireRendered) {
        renderQuestionnaire(state.questionnaire, state.modelType);
        applyRestoredConfigUI(); // no-op but kept for compat
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
 * Kept so formHandler.js can call it without errors.
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
            inputs.customer_type = state.customerType || 'new';
            const result = runScoringEngine(inputs);
            state.results = result;

            // Save locally first so admin can see it immediately
            const localId = saveSubmissionLocally(inputs, result);

            // Submit to GAS — returns the server-assigned Submission ID
            submitToGAS(inputs, result).then(function(gasId) {
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
        const localId = Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
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
async function submitToGAS(answers, result) {
    if (!GOOGLE_WEB_APP_URL) {
        console.info('[Submission] GOOGLE_WEB_APP_URL not set — skipping submission.');
        return null;
    }

    showLoading('Submitting data…', 'Saving, Please wait...');
    try {
        const payload = {
            action:    'submitAnswers',
            answers,
            score:     result.totalScore,
            riskTier:  result.riskCategory,
            timestamp: new Date().toISOString()
        };
        const r = await fetch(GOOGLE_WEB_APP_URL, {
            method:   'POST',
            headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
            body:     JSON.stringify(payload),
            redirect: 'follow'
        });
        const text = await r.text();
        if (text.trim().startsWith('<')) throw new Error('GAS returned HTML — check deploy settings.');
        const data = JSON.parse(text);
        if (data.success) {
            showToast('Data submitted successfully.', 'success');
            return data.submissionId || null;
        } else {
            showToast('Submission warning: ' + (data.error || 'unknown'), 'warn');
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
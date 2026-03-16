/**
 * scoringEngine.js — Pipeline Orchestrator
 * Orchestrates the full local scoring pipeline:
 *   Raw Inputs → transformData → runCalculations → runModel → Result
 *
 * Usage:
 *   const result = runScoringEngine(formInputs);
 *   displayResults(result);
 */

/**
 * Run the complete credit scoring pipeline locally in the browser.
 * @param {Object} formInputs - Flat key-value object from form DOM (id → value)
 * @returns {Object} - Complete result object for the UI
 */
function runScoringEngine(formInputs) {
    const startTime = performance.now();

    // Guard: ensure required dependencies are loaded
    if (typeof transformData !== 'function') {
        throw new Error('scoringEngine: dataTransform.js not loaded');
    }
    if (typeof runCalculations !== 'function') {
        throw new Error('scoringEngine: calculations.js not loaded');
    }
    if (typeof runModel !== 'function') {
        throw new Error('scoringEngine: model.js not loaded');
    }

    // Step 1: Data Sheet — derive all computed fields from raw inputs
    const data = transformData(formInputs);

    // Step 2: Calculations Sheet — compute financial ratios and metrics
    const metrics = runCalculations(data);

    // Step 3: Model Sheet — apply scoring rules and produce result
    const result = runModel(metrics, data);

    const elapsed = Math.round(performance.now() - startTime);
    console.info(`[ScoringEngine] Pipeline complete in ${elapsed}ms. Score: ${result.totalScore}/1000 (${result.riskCategory})`);

    // Attach execution metadata (useful for debugging)
    result._meta = {
        elapsedMs: elapsed,
        timestamp: new Date().toISOString(),
    };

    return result;
}

/**
 * Collect all current form values from the DOM into a flat object.
 * Reads all input and select elements that have IDs.
 * @returns {Object} - Flat key-value map { fieldId: value }
 */
function collectFormInputs() {
    const inputs = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        if (!el.id) return;
        if (el.type === 'number') {
            inputs[el.id] = parseFloat(el.value) || 0;
        } else {
            inputs[el.id] = el.value || '';
        }
    });
    return inputs;
}

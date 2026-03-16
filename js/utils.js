/**
 * utils.js — Shared utility functions for the Credit Scoring Portal
 * Safe math, formatting, and helper utilities
 */

/**
 * Parse a value to a safe finite number. Returns 0 for NaN, Infinity, null, undefined.
 * @param {*} val
 * @returns {number}
 */
function safeNum(val) {
    if (val === null || val === undefined || val === '') return 0;
    const n = parseFloat(String(val).replace(/,/g, '').replace(/%/g, ''));
    return Number.isFinite(n) ? n : 0;
}

/**
 * Safe division — returns 0 if denominator is 0 or falsy.
 * @param {number} a - Numerator
 * @param {number} b - Denominator
 * @returns {number}
 */
function safeDivide(a, b) {
    if (!b || !Number.isFinite(b) || b === 0) return 0;
    const result = a / b;
    return Number.isFinite(result) ? result : 0;
}

/**
 * Calculate percentage: (a / b) * 100
 * Returns 0 if b is 0.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function pct(a, b) {
    return safeDivide(a, b) * 100;
}

/**
 * Clamp a value between min and max.
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
}

/**
 * Format a number as NPR currency string.
 * e.g. 1234567 → "NPR 12.3L" or returns full number for smaller values
 * @param {number} n
 * @returns {string}
 */
function fmtNPR(n) {
    if (n >= 10000000) return 'NPR ' + (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000)   return 'NPR ' + (n / 100000).toFixed(1) + 'L';
    if (n >= 1000)     return 'NPR ' + (n / 1000).toFixed(1) + 'K';
    return 'NPR ' + n.toFixed(0);
}

/**
 * Format a number with commas.
 * @param {number} n
 * @returns {string}
 */
function fmtNum(n) {
    return Number.isFinite(n) ? n.toLocaleString('en-IN') : '0';
}

/**
 * Round to 2 decimal places safely.
 * @param {number} n
 * @returns {number}
 */
function round2(n) {
    return Math.round(n * 100) / 100;
}

/**
 * Round to 1 decimal place safely.
 * @param {number} n
 * @returns {number}
 */
function round1(n) {
    return Math.round(n * 10) / 10;
}

/**
 * loadingModal.js — Reusable loading overlay component
 * Provides showLoading() and hideLoading() with smooth transitions
 */

(function() {
    let _modalEl = null;
    let _styleInjected = false;

    function _injectStyles() {
        if (_styleInjected) return;
        _styleInjected = true;
        const style = document.createElement('style');
        style.textContent = `
            #portal_loading_modal {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(255, 255, 255, 0.92);
                backdrop-filter: blur(4px);
                z-index: 99999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
                transition: opacity 0.25s ease;
                opacity: 1;
            }
            #portal_loading_modal.fading-out {
                opacity: 0;
                pointer-events: none;
            }
            #portal_loading_modal .lm-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid #e5e7eb;
                border-top-color: var(--primary, #2563eb);
                border-radius: 50%;
                animation: lm-spin 0.9s linear infinite;
            }
            #portal_loading_modal .lm-message {
                font-family: 'DM Sans', sans-serif;
                font-size: 0.95rem;
                font-weight: 500;
                color: var(--text-secondary, #4b5563);
                letter-spacing: 0.01em;
            }
            #portal_loading_modal .lm-sub {
                font-family: 'DM Sans', sans-serif;
                font-size: 0.78rem;
                color: var(--text-secondary, #9ca3af);
            }
            @keyframes lm-spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    function _ensureModal() {
        if (_modalEl) return _modalEl;
        _injectStyles();
        _modalEl = document.createElement('div');
        _modalEl.id = 'portal_loading_modal';
        _modalEl.setAttribute('role', 'status');
        _modalEl.setAttribute('aria-live', 'polite');
        _modalEl.innerHTML = `
            <div class="lm-spinner" aria-hidden="true"></div>
            <div class="lm-message" id="lm_message_text">Loading…</div>
            <div class="lm-sub" id="lm_sub_text"></div>
        `;
        _modalEl.style.display = 'none';
        document.body.appendChild(_modalEl);
        return _modalEl;
    }

    /**
     * Show the loading modal with a custom message.
     * @param {string} [message='Loading…'] - Main message
     * @param {string} [sub=''] - Optional subtitle
     */
    window.showLoading = function(message, sub) {
        const modal = _ensureModal();
        const msgEl = document.getElementById('lm_message_text');
        const subEl = document.getElementById('lm_sub_text');
        if (msgEl) msgEl.textContent = message || 'Loading…';
        if (subEl) subEl.textContent = sub || '';
        modal.classList.remove('fading-out');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    /**
     * Hide the loading modal with a smooth fade-out.
     * @param {number} [delay=0] - Optional ms delay before hiding
     */
    window.hideLoading = function(delay) {
        const modal = document.getElementById('portal_loading_modal');
        if (!modal) return;
        const doHide = () => {
            modal.classList.add('fading-out');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('fading-out');
                document.body.style.overflow = '';
            }, 260);
        };
        if (delay) {
            setTimeout(doHide, delay);
        } else {
            doHide();
        }
    };

    /**
     * Update the message of an already-visible loading modal.
     * @param {string} message
     * @param {string} [sub]
     */
    window.updateLoadingMessage = function(message, sub) {
        const msgEl = document.getElementById('lm_message_text');
        const subEl = document.getElementById('lm_sub_text');
        if (msgEl) msgEl.textContent = message || '';
        if (subEl && sub !== undefined) subEl.textContent = sub;
    };
})();

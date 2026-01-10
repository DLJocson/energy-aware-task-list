/**
 * ========================================
 * animations.js
 * Centralized animation utilities
 * ========================================
 */

const AnimationUtils = {
    /**
     * Smoothly hide an element
     * @param {HTMLElement} element 
     * @param {Function} callback - Optional callback after animation
     */
    hide: (element, callback) => {
        if (!element) return;
        
        // If already hidden, just do callback
        if (element.style.display === 'none') {
            if (callback) callback();
            return;
        }

        element.classList.add('animating-out');
        
        element.addEventListener('animationend', () => {
             element.style.display = 'none';
             element.classList.remove('animating-out');
             if (callback) callback();
        }, { once: true });
    },

    /**
     * Smoothly show an element
     * @param {HTMLElement} element 
     */
    show: (element) => {
        if (!element) return;
        
        // If already visible, don't restart animation unless coerced
        if (element.style.display !== 'none' && !element.classList.contains('animating-out')) {
            return;
        }

        element.classList.remove('animating-out'); // Cancel hide if in progress
        element.style.display = '';
        element.classList.add('animating-in');
        
        element.addEventListener('animationend', () => {
            element.classList.remove('animating-in');
        }, { once: true });
    },

    /**
     * Animate deletion of a list item
     */
    animateDelete: (element, form) => {
        if (!element) return;
        
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.9) translateX(20px)';
        element.style.height = '0';
        element.style.margin = '0';
        element.style.padding = '0';
        
        setTimeout(() => {
            if (form) form.submit();
        }, 300);
    }
};

window.AnimationUtils = AnimationUtils;

// Initialize global listeners
document.addEventListener('DOMContentLoaded', () => {
    // Intercept delete forms
    document.querySelectorAll('form[action*="Delete"]').forEach(form => {
        form.addEventListener('submit', (e) => {
            const btn = e.submitter;
            // Only animate if triggered by a button inside search/list (not bulk actions)
            if (btn && btn.closest('.task-card')) {
                e.preventDefault();
                const card = btn.closest('.task-card');
                AnimationUtils.animateDelete(card, form);
            }
        });
    });
});

/**
 * ========================================
 * popupPositioning.js
 * Smart Collision Detection & Positioning for Pop-ups
 * 
 * Purpose:
 * - Ensures tooltips, modals, and notifications stay within viewport
 * - Implements collision detection to reposition elements when space is limited
 * - Provides smooth transitions and accessibility features
 * - Handles edge cases for small screens and dynamic content
 * ========================================
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        tooltipOffset: 8, // pixels from trigger element
        viewportPadding: 16, // minimum distance from viewport edges
        collisionThreshold: 10, // pixels before triggering reposition
        animationDuration: 300 // milliseconds
    };

    /**
     * Calculate available space around an element
     * @param {DOMRect} triggerRect - Bounding rect of the trigger element
     * @returns {Object} Available space in each direction
     */
    function calculateAvailableSpace(triggerRect) {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        return {
            top: triggerRect.top,
            bottom: viewport.height - triggerRect.bottom,
            left: triggerRect.left,
            right: viewport.width - triggerRect.right
        };
    }

    /**
     * Determine optimal position for tooltip based on available space
     * @param {HTMLElement} trigger - The element triggering the tooltip
     * @param {HTMLElement} tooltip - The tooltip element
     * @returns {string} Optimal position: 'top', 'bottom', 'left', or 'right'
     */
    function determineOptimalPosition(trigger, tooltip) {
        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const space = calculateAvailableSpace(triggerRect);

        // Preference order: top, bottom, right, left
        const positions = [
            { name: 'top', space: space.top, required: tooltipRect.height + CONFIG.tooltipOffset + CONFIG.viewportPadding },
            { name: 'bottom', space: space.bottom, required: tooltipRect.height + CONFIG.tooltipOffset + CONFIG.viewportPadding },
            { name: 'right', space: space.right, required: tooltipRect.width + CONFIG.tooltipOffset + CONFIG.viewportPadding },
            { name: 'left', space: space.left, required: tooltipRect.width + CONFIG.tooltipOffset + CONFIG.viewportPadding }
        ];

        // Find first position with enough space
        for (const pos of positions) {
            if (pos.space >= pos.required) {
                return pos.name;
            }
        }

        // Fallback to position with most space
        positions.sort((a, b) => b.space - a.space);
        return positions[0].name;
    }

    /**
     * Position tooltip relative to trigger element
     * @param {HTMLElement} trigger - The element triggering the tooltip
     * @param {HTMLElement} tooltip - The tooltip element
     * @param {string} position - Desired position ('top', 'bottom', 'left', 'right')
     */
    function positionTooltip(trigger, tooltip, position) {
        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        let top, left;

        switch (position) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - CONFIG.tooltipOffset;
                left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                break;

            case 'bottom':
                top = triggerRect.bottom + CONFIG.tooltipOffset;
                left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                break;

            case 'right':
                top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.right + CONFIG.tooltipOffset;
                break;

            case 'left':
                top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                left = triggerRect.left - tooltipRect.width - CONFIG.tooltipOffset;
                break;

            default:
                // Fallback to top
                top = triggerRect.top - tooltipRect.height - CONFIG.tooltipOffset;
                left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        }

        // Ensure tooltip stays within viewport bounds (horizontal)
        const maxLeft = window.innerWidth - tooltipRect.width - CONFIG.viewportPadding;
        const minLeft = CONFIG.viewportPadding;
        left = Math.max(minLeft, Math.min(left, maxLeft));

        // Ensure tooltip stays within viewport bounds (vertical)
        const maxTop = window.innerHeight - tooltipRect.height - CONFIG.viewportPadding;
        const minTop = CONFIG.viewportPadding;
        top = Math.max(minTop, Math.min(top, maxTop));

        // Apply position
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.setAttribute('data-position', position);
    }

    /**
     * Initialize smart tooltip positioning
     */
    function initializeTooltips() {
        const tooltipTriggers = document.querySelectorAll('.tooltip');

        tooltipTriggers.forEach(trigger => {
            const tooltipText = trigger.querySelector('.tooltip-text');
            if (!tooltipText) return;

            // Show and position tooltip on hover
            trigger.addEventListener('mouseenter', function() {
                // Make tooltip visible but transparent to measure it
                tooltipText.style.visibility = 'visible';
                tooltipText.style.opacity = '0';

                // Determine optimal position
                const optimalPosition = determineOptimalPosition(trigger, tooltipText);

                // Position tooltip
                positionTooltip(trigger, tooltipText, optimalPosition);

                // Make tooltip fully visible
                requestAnimationFrame(() => {
                    tooltipText.style.opacity = '1';
                });
            });

            // Handle focus for accessibility
            trigger.addEventListener('focusin', function() {
                tooltipText.style.visibility = 'visible';
                tooltipText.style.opacity = '0';

                const optimalPosition = determineOptimalPosition(trigger, tooltipText);
                positionTooltip(trigger, tooltipText, optimalPosition);

                requestAnimationFrame(() => {
                    tooltipText.style.opacity = '1';
                });
            });

            // Hide tooltip
            trigger.addEventListener('mouseleave', function() {
                tooltipText.style.visibility = 'hidden';
                tooltipText.style.opacity = '0';
            });

            trigger.addEventListener('focusout', function() {
                tooltipText.style.visibility = 'hidden';
                tooltipText.style.opacity = '0';
            });
        });
    }

    /**
     * Ensure modals stay within viewport bounds
     */
    function constrainModalPosition() {
        const modals = document.querySelectorAll('.modal-dialog, .task-modal-content');

        modals.forEach(modal => {
            const rect = modal.getBoundingClientRect();

            // Check if modal extends beyond viewport
            if (rect.bottom > window.innerHeight || rect.top < 0) {
                modal.style.marginTop = 'auto';
                modal.style.marginBottom = 'auto';
            }

            if (rect.right > window.innerWidth || rect.left < 0) {
                modal.style.marginLeft = 'auto';
                modal.style.marginRight = 'auto';
            }
        });
    }

    /**
     * Adjust notification position to avoid overlapping with other elements
     */
    function positionNotifications() {
        const notifications = document.querySelectorAll('.tired-mode-notification');
        let currentTop = 80; // Initial top position

        notifications.forEach((notification, index) => {
            if (index > 0) {
                currentTop += notification.offsetHeight + 12; // Stack with gap
            }
            notification.style.top = `${currentTop}px`;
        });
    }

    /**
     * Handle viewport resize
     */
    function handleResize() {
        // Reposition visible tooltips
        const visibleTooltips = document.querySelectorAll('.tooltip:hover .tooltip-text, .tooltip:focus-within .tooltip-text');
        visibleTooltips.forEach(tooltip => {
            const trigger = tooltip.closest('.tooltip');
            if (trigger) {
                const optimalPosition = determineOptimalPosition(trigger, tooltip);
                positionTooltip(trigger, tooltip, optimalPosition);
            }
        });

        // Constrain modals
        constrainModalPosition();

        // Reposition notifications
        positionNotifications();
    }

    /**
     * Debounce function for performance
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Initialize all positioning features
     */
    function init() {
        // Initialize tooltips
        initializeTooltips();

        // Initial positioning for modals and notifications
        constrainModalPosition();
        positionNotifications();

        // Handle resize with debouncing
        window.addEventListener('resize', debounce(handleResize, 150));

        // Handle scroll for fixed position elements
        window.addEventListener('scroll', debounce(handleResize, 100));

        // Observe DOM changes for dynamically added tooltips
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    initializeTooltips();
                    constrainModalPosition();
                    positionNotifications();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export functions for external use
    window.PopupPositioning = {
        positionTooltip,
        constrainModalPosition,
        positionNotifications,
        calculateAvailableSpace,
        determineOptimalPosition
    };

})();

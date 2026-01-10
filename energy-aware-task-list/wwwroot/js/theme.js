// --- Lucide monkey-patch: Always update theme toggle icon after any lucide.createIcons() call --- 
if (window.lucide && !window._lucidePatched) {
    const origCreateIcons = lucide.createIcons;
    lucide.createIcons = function(...args) {
        const result = origCreateIcons.apply(this, args);
        // Always update the theme toggle icon after any icon re-render
        setTimeout(() => {
            if (window.themeManager && window.themeManager.updateToggleIcon) {
                const toggle = document.getElementById('themeToggle');
                if (toggle) window.themeManager.updateToggleIcon(toggle);
            }
        }, 0);
        return result;
    };
    window._lucidePatched = true;
}
// ========================================
// theme.js
// Theme management and modal system
// 
// Purpose:
// - ThemeManager: Handles light/dark mode switching with localStorage persistence
// - ModalManager: Manages modal dialogs with focus trapping and accessibility
// - Provides global instances: themeManager, modalManager
// ========================================

// --- Section: Theme Management ---

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        
        // IMMEDIATE: Apply theme to document to prevent flash of wrong theme
        this.applyTheme(this.theme);

        // DEFERRED: Setup UI listeners when DOM is fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Use event delegation to avoid losing the event after lucide.createIcons()
        if (!this._delegated) {
            document.body.addEventListener('click', (e) => {
                const btn = e.target.closest('#themeToggle');
                if (btn) {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
            this._delegated = true;
        }
        // Always update the icon to match the current theme
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            this.updateToggleIcon(toggle);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        localStorage.setItem('theme', theme);
        // Always update the icon after theme change
        setTimeout(() => {
            const toggle = document.getElementById('themeToggle');
            if (toggle) {
                this.updateToggleIcon(toggle);
            }
        }, 0);
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Add smooth transition to body
        document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 400);
    }

    updateToggleIcon(toggleElement) {
        const toggle = toggleElement || document.getElementById('themeToggle');
        if (!toggle) return;

        // Completely recreate the icon content to handle Lucide's SVG replacement
        const iconName = this.theme === 'dark' ? 'sun' : 'moon';
        
        // Clear previous content (SVG or i tag)
        toggle.innerHTML = '';
        
        // Create new icon element
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', iconName);
        icon.className = 'w-6 h-6'; // Preserve original classes
        
        toggle.appendChild(icon);

        // Re-initialize icons for this specific element
        if (window.lucide) {
            lucide.createIcons({
                root: toggle
            });
        }
    }

    getTheme() {
        return this.theme;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();


// ========================================
// 💬 Modal System
// ========================================

class ModalManager {
    constructor() {
        this.modals = new Map();
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize all modals
            document.querySelectorAll('.modal').forEach(modal => {
                this.modals.set(modal.id, modal);
                
                // Close on backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.close(modal.id);
                    }
                });

                // Close on escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && modal.classList.contains('show')) {
                        this.close(modal.id);
                    }
                });
            });

            // Initialize close buttons
            document.querySelectorAll('[data-modal-close]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modalId = btn.closest('.modal').id;
                    this.close(modalId);
                });
            });
        });
    }

    open(modalId) {
        const modal = this.modals.get(modalId) || document.getElementById(modalId);
        if (modal) {
            // Store currently focused element to restore later
            this.previousFocus = document.activeElement;
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Setup keyboard dismissal (Esc key)
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.handleModalClose(modalId, modal);
                }
            };
            modal.escapeHandler = handleEscape;
            document.addEventListener('keydown', handleEscape);
            
            // Setup backdrop click dismissal
            const handleBackdropClick = (e) => {
                if (e.target === modal) {
                    this.handleModalClose(modalId, modal);
                }
            };
            modal.backdropHandler = handleBackdropClick;
            modal.addEventListener('click', handleBackdropClick);
            
            // Setup focus trapping
            this.setupFocusTrap(modal);
            
            // Focus first input if exists
            const firstInput = modal.querySelector('input, textarea, select, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 150);
            }
        }
    }
    
    async handleModalClose(modalId, modal) {
        // Check if modal has unsaved changes
        const hasUnsavedChanges = modal.querySelector('form')?.dataset.modified === 'true';
        
        if (hasUnsavedChanges) {
            const confirmed = await this.confirm({
                title: 'Unsaved Changes',
                message: 'You have unsaved changes. Are you sure you want to close?',
                confirmText: 'Discard Changes',
                cancelText: 'Keep Editing',
                type: 'warning'
            });
            
            if (!confirmed) return;
        }
        
        this.close(modalId);
    }

    close(modalId) {
        const modal = this.modals.get(modalId) || document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Clean up event listeners
            if (modal.escapeHandler) {
                document.removeEventListener('keydown', modal.escapeHandler);
                delete modal.escapeHandler;
            }
            
            if (modal.backdropHandler) {
                modal.removeEventListener('click', modal.backdropHandler);
                delete modal.backdropHandler;
            }
            
            // Restore focus to previous element
            if (this.previousFocus && this.previousFocus.focus) {
                setTimeout(() => this.previousFocus.focus(), 100);
            }
            
            // Clean up focus trap
            if (modal.focusTrapHandler) {
                modal.removeEventListener('keydown', modal.focusTrapHandler);
                delete modal.focusTrapHandler;
            }
            
            // Reset form modified state
            const form = modal.querySelector('form');
            if (form) {
                delete form.dataset.modified;
            }
        }
    }
    
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        
        modal.focusTrapHandler = handleTabKey;
        modal.addEventListener('keydown', handleTabKey);
    }

    confirm(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            type = 'warning' // warning, danger, info
        } = options;
                newToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Theme toggle clicked');
                    this.toggleTheme();
                });
                // Ensure icon matches current theme (in case re-render is needed)
                this.updateToggleIcon(newToggle);
            } else {
                // Try again after a short delay in case DOM is not ready
                setTimeout(() => this.init(), 500);
                modal = this.createConfirmModal(modalId);
                document.body.appendChild(modal);
            }

            // Update content
            modal.querySelector('.modal-title').textContent = title;
            modal.querySelector('.modal-body').textContent = message;
            
            const confirmBtn = modal.querySelector('.btn-confirm');
            const cancelBtn = modal.querySelector('.btn-cancel');
            
            confirmBtn.textContent = confirmText;
            cancelBtn.textContent = cancelText;

            // Set type-specific styling
            modal.className = `modal ${type}-modal`;

            // Handle buttons
            const handleConfirm = () => {
                this.close(modalId);
                resolve(true);
                cleanup();
            };

            const handleCancel = () => {
                this.close(modalId);
                resolve(false);
                cleanup();
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            this.open(modalId);
        });
    }

    alert(options = {}) {
        const {
            title = 'Notice',
            message = '',
            type = 'info', // success, error, warning, info
            buttonText = 'OK'
        } = options;

        return new Promise((resolve) => {
            const modalId = 'alertModal';
            let modal = document.getElementById(modalId);

            // Create modal if it doesn't exist
            if (!modal) {
                modal = this.createAlertModal(modalId);
                document.body.appendChild(modal);
            }

            // Update content
            modal.querySelector('.modal-title').textContent = title;
            modal.querySelector('.modal-body').textContent = message;
            
            const okBtn = modal.querySelector('.btn-ok');
            okBtn.textContent = buttonText;

            // Set type-specific styling
            modal.className = `modal ${type}-modal`;

            // Handle button
            const handleOk = () => {
                this.close(modalId);
                resolve();
                okBtn.removeEventListener('click', handleOk);
            };

            okBtn.addEventListener('click', handleOk);

            this.open(modalId);
        });
    }

    createConfirmModal(id) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button type="button" class="modal-close" data-modal-close>
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn-cancel px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors">
                        Cancel
                    </button>
                    <button type="button" class="btn-confirm px-4 py-2 rounded-xl bg-[#4D2FB2] hover:bg-[#3D2590] text-white font-semibold transition-colors">
                        Confirm
                    </button>
                </div>
            </div>
        `;
        return modal;
    }

    createAlertModal(id) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button type="button" class="modal-close" data-modal-close>
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn-ok px-6 py-2 rounded-xl bg-[#4D2FB2] hover:bg-[#3D2590] text-white font-semibold transition-colors">
                        OK
                    </button>
                </div>
            </div>
        `;
        return modal;
    }
}

// Initialize modal manager
const modalManager = new ModalManager();


// ========================================
// ✨ Enhanced Animations
// ========================================

class AnimationManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Animate cards on page load
            this.animateCards();
            
            // Add hover effects
            this.addHoverEffects();
            
            // Animate progress bars
            this.animateProgressBars();
        });
    }

    animateCards() {
        const cards = document.querySelectorAll('.task-card, .bg-white\\/80, .bg-white\\/90');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    addHoverEffects() {
        // Add lift effect to buttons
        document.querySelectorAll('button, a[class*="btn"]').forEach(btn => {
            if (!btn.classList.contains('no-hover')) {
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-1px)';
                });
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                });
            }
        });
    }

    animateProgressBars() {
        const bars = document.querySelectorAll('[style*="width:"]');
        bars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.transition = 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
                bar.style.width = width;
            }, 100);
        });
    }

    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '1';
        }, 10);
    }

    fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }
}

// Initialize animation manager
const animationManager = new AnimationManager();


// ========================================
// 🎯 Form Validation & Error Handling
// ========================================

class ValidationManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // Add validation to forms
            document.querySelectorAll('form').forEach(form => {
                form.addEventListener('submit', (e) => this.handleSubmit(e, form));
            });

            // Add real-time validation
            document.querySelectorAll('input[required], textarea[required]').forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
            });
        });
    }

    handleSubmit(event, form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) {
            event.preventDefault();
            modalManager.alert({
                title: 'Validation Error',
                message: 'Please fill in all required fields correctly.',
                type: 'error'
            });
        }
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific validations
        if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email';
        }

        if (field.type === 'date' && value) {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (date < today) {
                isValid = false;
                errorMessage = 'Date cannot be in the past';
            }
        }

        this.showFieldError(field, isValid, errorMessage);
        return isValid;
    }

    showFieldError(field, isValid, message) {
        // Remove existing error
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid) {
            field.classList.add('border-red-500');
            
            const error = document.createElement('span');
            error.className = 'field-error text-rose-500 text-xs font-bold ml-1 mt-1 block';
            error.textContent = message;
            field.parentElement.appendChild(error);
        } else {
            field.classList.remove('border-red-500');
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

// Initialize validation manager
const validationManager = new ValidationManager();


// ========================================
// 🌐 Global Helper Functions
// ========================================

// Show success toast
function showSuccess(message) {
    modalManager.alert({
        title: 'Success!',
        message: message,
        type: 'success'
    });
}

// Show error toast
function showError(message) {
    modalManager.alert({
        title: 'Error',
        message: message,
        type: 'error'
    });
}

// Confirm action
async function confirmAction(message, title = 'Confirm Action') {
    return await modalManager.confirm({
        title: title,
        message: message,
        type: 'warning'
    });
}

// Export for use in other scripts
window.themeManager = themeManager;
window.modalManager = modalManager;
window.animationManager = animationManager;
window.validationManager = validationManager;
window.showSuccess = showSuccess;
window.showError = showError;
window.confirmAction = confirmAction;

// Task start validation
window.handleTaskStart = function(event, form, taskEnergy, remainingEnergy) {
    if (taskEnergy > remainingEnergy) {
        event.preventDefault();
        const deficit = taskEnergy - remainingEnergy;
        modalManager.alert({
            title: 'Not Enough Energy',
            message: `You need ${deficit} more energy points to start this task.\n\nCurrent: ${remainingEnergy} | Required: ${taskEnergy}`,
            type: 'danger'
        });
        return false;
    }
    return true;
};

// ========================================
// 🎯 Tooltip Positioning System
// ========================================
class TooltipManager {
    constructor() {
        this.activeTooltips = new Set();
        this.spacing = 10; // Space between tooltip and element
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTooltipListeners();
        });
    }
    
    setupTooltipListeners() {
        // Use event delegation for better performance
        document.addEventListener('mouseenter', (e) => {
            const tooltip = e.target.closest('.tooltip');
            if (tooltip) {
                this.showTooltip(tooltip);
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            const tooltip = e.target.closest('.tooltip');
            if (tooltip) {
                this.hideTooltip(tooltip);
            }
        }, true);
        
        // Reposition on scroll/resize
        window.addEventListener('scroll', () => this.repositionAllTooltips(), true);
        window.addEventListener('resize', () => this.repositionAllTooltips());
    }
    
    showTooltip(tooltipElement) {
        const tooltipText = tooltipElement.querySelector('.tooltip-text');
        if (!tooltipText) return;
        
        // Prevent duplicate positioning
        if (this.activeTooltips.has(tooltipElement)) {
            this.positionTooltip(tooltipElement, tooltipText);
            return;
        }
        
        this.activeTooltips.add(tooltipElement);
        this.positionTooltip(tooltipElement, tooltipText);
    }
    
    hideTooltip(tooltipElement) {
        this.activeTooltips.delete(tooltipElement);
    }
    
    positionTooltip(tooltipElement, tooltipText) {
        // Get trigger element position
        const triggerRect = tooltipElement.getBoundingClientRect();
        const tooltipRect = tooltipText.getBoundingClientRect();
        
        // Calculate preferred position (above)
        let top = triggerRect.top - tooltipRect.height - this.spacing;
        let left = triggerRect.left + (triggerRect.width / 2);
        
        // Collision detection
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        };
        
        // Check if tooltip fits above
        let position = 'top';
        if (top < viewport.scrollY) {
            // Flip to below if not enough space above
            top = triggerRect.bottom + this.spacing;
            position = 'bottom';
        }
        
        // Check horizontal boundaries
        const tooltipWidth = tooltipRect.width || 200; // fallback width
        let translateX = -50; // default center alignment
        
        if (left - (tooltipWidth / 2) < 5) {
            // Too far left, align to left edge
            left = triggerRect.left;
            translateX = 0;
        } else if (left + (tooltipWidth / 2) > viewport.width - 5) {
            // Too far right, align to right edge
            left = triggerRect.right;
            translateX = -100;
        }
        
        // Apply positioning
        tooltipText.style.position = 'fixed';
        tooltipText.style.top = `${top}px`;
        tooltipText.style.left = `${left}px`;
        tooltipText.style.transform = `translateX(${translateX}%)`;
        
        // Update arrow position based on placement
        tooltipText.setAttribute('data-position', position);
        
        // Store positioning for repositioning
        tooltipText.dataset.positioned = 'true';
    }
    
    repositionAllTooltips() {
        this.activeTooltips.forEach(tooltipElement => {
            const tooltipText = tooltipElement.querySelector('.tooltip-text');
            if (tooltipText && tooltipText.dataset.positioned === 'true') {
                this.positionTooltip(tooltipElement, tooltipText);
            }
        });
    }
}

// Initialize tooltip manager
const tooltipManager = new TooltipManager();
window.tooltipManager = tooltipManager;

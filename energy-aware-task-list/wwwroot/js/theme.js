// ========================================
// 🌙 Theme Management System
// ========================================

class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Apply saved theme
        this.applyTheme(this.theme);
        
        // Listen for theme toggle
        document.addEventListener('DOMContentLoaded', () => {
            const toggle = document.getElementById('themeToggle');
            if (toggle) {
                toggle.addEventListener('click', () => this.toggleTheme());
                this.updateToggleIcon();
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        localStorage.setItem('theme', theme);
        this.updateToggleIcon();
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Add smooth transition
        document.body.style.transition = 'background-color 0.4s ease, color 0.4s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 400);
    }

    updateToggleIcon() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        const icon = toggle.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', this.theme === 'dark' ? 'sun' : 'moon');
            if (window.lucide) {
                lucide.createIcons();
            }
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
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focus first input if exists
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    close(modalId) {
        const modal = this.modals.get(modalId) || document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    confirm(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            type = 'warning' // warning, danger, info
        } = options;

        return new Promise((resolve) => {
            const modalId = 'confirmModal';
            let modal = document.getElementById(modalId);

            // Create modal if it doesn't exist
            if (!modal) {
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

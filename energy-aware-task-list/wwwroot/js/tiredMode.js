// ========================================
// tiredMode.js
// Energy-aware task filtering with visual feedback
// 
// Purpose:
// - Filters task list to hide tasks that exceed remaining energy
// - Helps users focus on achievable tasks when energy is low
// - Toggles visibility of Backlog tasks based on cost vs remaining energy
// - Provides visual feedback when mode is activated/deactivated
// - ENHANCED: Better UI feedback, dimming effect, and accessibility
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('tiredModeToggle');
    const container = document.getElementById('taskListContainer');
    
    if (!toggleBtn || !container) return;

    let isTiredMode = false;
    let activeNotification = null;

    // Function to show notification with smart positioning
    function showNotification(message, icon = 'battery-warning', type = 'info') {
        // Remove any existing notification
        if (activeNotification) {
            activeNotification.remove();
            activeNotification = null;
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'tired-mode-notification';
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');
        notification.innerHTML = `
            <i data-lucide="${icon}" class="w-5 h-5"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        activeNotification = notification;

        // Initialize Lucide icons for the notification
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(120%)';
                setTimeout(() => notification.remove(), 300);
            }
            if (activeNotification === notification) {
                activeNotification = null;
            }
        }, 3000);
    }

    // Apply dimming effect to the page when tired mode is active
    function applyTiredModeEffect(isActive) {
        if (isActive) {
            document.body.style.filter = 'brightness(0.92)';
            document.body.style.transition = 'filter 0.4s ease';
        } else {
            document.body.style.filter = '';
        }
    }

    // Count tasks by status
    function getTaskCounts() {
        const allTasks = document.querySelectorAll('.task-card');
        const backlogTasks = Array.from(allTasks).filter(card => 
            card.getAttribute('data-status') === 'Backlog'
        );
        return {
            total: allTasks.length,
            backlog: backlogTasks.length
        };
    }

    toggleBtn.addEventListener('click', () => {
        isTiredMode = !isTiredMode;
        const remainingEnergy = parseInt(container.getAttribute('data-remaining-energy') || 0);

        if (isTiredMode) {
            // Activate Tired Mode
            toggleBtn.classList.add('active');
            toggleBtn.setAttribute('aria-pressed', 'true');
            toggleBtn.setAttribute('aria-label', 'Tired mode is active. Click to deactivate.');
            
            let hiddenCount = 0;
            let totalBacklog = 0;
            
            // Hide items that are too expensive and not Active/Completed
            // Use AnimationUtils if available, otherwise fallback to simple display toggle
            const animate = typeof AnimationUtils !== 'undefined';
            
            document.querySelectorAll('.task-card').forEach(card => {
                const cost = parseInt(card.getAttribute('data-energy-cost'));
                const status = card.getAttribute('data-status');
                
                if (status === 'Backlog') {
                    totalBacklog++;
                    if (cost > remainingEnergy) {
                        if (animate) {
                            AnimationUtils.hide(card);
                        } else {
                            card.style.display = 'none';
                        }
                        
                        card.setAttribute('data-tired-hidden', 'true');
                        hiddenCount++;
                    }
                }
            });

            // Apply visual effect
            applyTiredModeEffect(true);

            // Show feedback notification with contextual message
            let message;
            if (hiddenCount === 0) {
                if (totalBacklog === 0) {
                    message = `Tired Mode ON • No backlog tasks to filter`;
                } else {
                    message = `Tired Mode ON • All ${totalBacklog} backlog ${totalBacklog === 1 ? 'task matches' : 'tasks match'} your energy`;
                }
            } else {
                const remaining = totalBacklog - hiddenCount;
                message = `Tired Mode ON • Hiding ${hiddenCount}/${totalBacklog} high-energy ${hiddenCount === 1 ? 'task' : 'tasks'}`;
            }
            showNotification(message, 'battery-warning');
            
            // Analytics (if available)
            if (window.plausible) {
                window.plausible('Tired Mode', { props: { action: 'activated', hiddenCount } });
            }
            
        } else {
            // Deactivate Tired Mode
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-pressed', 'false');
            toggleBtn.setAttribute('aria-label', 'Activate tired mode to hide high-energy tasks');
            
            // Show all tasks
            let restoredCount = 0;
            const animate = typeof AnimationUtils !== 'undefined';

            document.querySelectorAll('.task-card').forEach(card => {
                if (card.getAttribute('data-tired-hidden') === 'true' || card.getAttribute('data-tired-mode-hidden') === 'true') {
                    // Only show if not hidden by search
                    if (!card.matches('[data-search-hidden="true"]')) {
                        if (animate) {
                            AnimationUtils.show(card);
                        } else {
                            card.style.display = '';
                        }
                        restoredCount++;
                    }
                    card.removeAttribute('data-tired-hidden');
                    card.removeAttribute('data-tired-mode-hidden');
                }
            });

            // Remove visual effect
            applyTiredModeEffect(false);

            // Show feedback notification
            const message = restoredCount > 0 
                ? `Tired Mode OFF • Showing ${restoredCount} ${restoredCount === 1 ? 'task' : 'tasks'}`
                : 'Tired Mode OFF • Showing all tasks';
            showNotification(message, 'battery');
            
            // Analytics (if available)
            if (window.plausible) {
                window.plausible('Tired Mode', { props: { action: 'deactivated', restoredCount } });
            }
        }
    });

    // Add keyboard support (Space/Enter to toggle)
    toggleBtn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleBtn.click();
        }
    });

    // Persist tired mode state (optional)
    try {
        const savedState = localStorage.getItem('tiredModeActive');
        if (savedState === 'true' && !isTiredMode) {
            // Auto-activate if it was previously enabled
            toggleBtn.click();
        }
    } catch (e) {
        console.warn('Could not restore tired mode state:', e);
    }

    // Save state on change
    toggleBtn.addEventListener('click', () => {
        try {
            localStorage.setItem('tiredModeActive', isTiredMode.toString());
        } catch (e) {
            console.warn('Could not save tired mode state:', e);
        }
    });

    // Add visual indicator in the button
    function updateButtonVisual() {
        const icon = toggleBtn.querySelector('i');
        if (icon && isTiredMode) {
            icon.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
        } else if (icon) {
            icon.style.animation = '';
        }
    }

    // Update button visual when clicked
    toggleBtn.addEventListener('click', () => {
        setTimeout(updateButtonVisual, 50);
    });
});
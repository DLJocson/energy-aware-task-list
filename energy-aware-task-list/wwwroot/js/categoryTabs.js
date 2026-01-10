/**
 * ========================================
 * categoryTabs.js
 * Dynamic Category Tab Switching & Task Loading
 * 
 * Purpose:
 * - Handles category tab clicks without page refresh
 * - Updates description text dynamically based on selected tab
 * - Loads tasks for the selected category via AJAX
 * - Provides smooth transitions and animations
 * - Updates URL history without full page reload
 * ========================================
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        animationDuration: 300,
        fadeOutDuration: 150,
        fadeInDelay: 150,
        fetchTimeout: 8000 // 8 seconds timeout
    };

    // Cache DOM elements
    let categoryTabs = null;
    let categoryDescription = null;
    let taskListContainer = null;
    let currentFilter = 'All';

    /**
     * Initialize category tabs functionality
     */
    function init() {
        // Cache DOM elements
        categoryTabs = document.querySelectorAll('.category-tab-link');
        categoryDescription = document.getElementById('categoryDescription');
        taskListContainer = document.getElementById('taskListContainer');

        if (!categoryTabs.length || !categoryDescription || !taskListContainer) {
            console.warn('Category tabs elements not found');
            return;
        }

        // Get initial filter from active tab
        const activeTab = document.querySelector('.category-tab-link.active');
        if (activeTab) {
            currentFilter = activeTab.dataset.status;
        }

        // Attach event listeners to all tabs
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', handleTabClick);

            // Keyboard navigation support
            tab.addEventListener('keydown', handleTabKeydown);
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', handlePopState);

        console.log('Category tabs initialized');
    }

    /**
     * Handle tab click event
     * @param {Event} e - Click event
     */
    function handleTabClick(e) {
        e.preventDefault();

        const clickedTab = e.currentTarget;
        const newStatus = clickedTab.dataset.status;
        const newDescription = clickedTab.dataset.description;

        // Don't reload if clicking the same tab
        if (newStatus === currentFilter) {
            return;
        }

        // Update UI and load tasks
        switchTab(clickedTab, newStatus, newDescription, true);
    }

    /**
     * Handle keyboard navigation for tabs
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleTabKeydown(e) {
        const tabs = Array.from(categoryTabs);
        const currentIndex = tabs.indexOf(e.currentTarget);

        let nextIndex = currentIndex;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                nextIndex = (currentIndex + 1) % tabs.length;
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;

            case 'Home':
                e.preventDefault();
                nextIndex = 0;
                break;

            case 'End':
                e.preventDefault();
                nextIndex = tabs.length - 1;
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                handleTabClick(e);
                return;

            default:
                return;
        }

        // Focus and activate the next tab
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
    }

    /**
     * Switch to a new tab
     * @param {HTMLElement} clickedTab - The tab element that was clicked
     * @param {string} newStatus - The new status filter
     * @param {string} newDescription - The description for the new tab
     * @param {boolean} updateHistory - Whether to update browser history
     */
    function switchTab(clickedTab, newStatus, newDescription, updateHistory = true) {
        // Update active state on all tabs
        categoryTabs.forEach(tab => {
            const isActive = tab === clickedTab;
            
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.setAttribute('tabindex', isActive ? '0' : '-1');

            // Update styles
            if (isActive) {
                tab.style.background = 'var(--accent-primary)';
                tab.style.color = 'white';
                tab.style.boxShadow = '0 4px 12px var(--shadow-color)';
            } else {
                tab.style.background = 'var(--card-bg)';
                tab.style.color = 'var(--accent-primary)';
                tab.style.boxShadow = '';
            }
        });

        // Update description with fade animation
        updateDescription(newDescription);

        // Update current filter
        currentFilter = newStatus;

        // Load tasks for the new category
        loadTasks(newStatus);

        // Update URL without page reload
        if (updateHistory) {
            const url = new URL(window.location);
            url.searchParams.set('status', newStatus);
            window.history.pushState({ status: newStatus }, '', url);
        }

        // Announce change to screen readers
        announceChange(newStatus);
    }

    /**
     * Update description text with smooth animation
     * @param {string} newDescription - New description text
     */
    function updateDescription(newDescription) {
        if (!categoryDescription) return;

        // Fade out with transform
        categoryDescription.style.transition = 'opacity 150ms ease, transform 150ms ease';
        categoryDescription.style.opacity = '0';
        categoryDescription.style.transform = 'translateY(-5px)';

        setTimeout(() => {
            categoryDescription.textContent = newDescription;
            categoryDescription.style.opacity = '1';
            categoryDescription.style.transform = 'translateY(0)';
        }, CONFIG.fadeOutDuration);
    }

    /**
     * Load tasks for the selected category via AJAX
     * @param {string} status - The status filter (Backlog, Active, Completed, All)
     */
    function loadTasks(status) {
        if (!taskListContainer) return;

        // Show loading state
        showLoadingState();

        // Get current search query if exists
        const searchInput = document.getElementById('searchInput');
        const searchQuery = searchInput ? searchInput.value : '';

        // Build URL with query parameters
        // Note: We don't send search query to server so we always get full list
        // This enables client-side clearing/resetting without re-fetching
        const url = `/Tasks/Index?status=${encodeURIComponent(status)}`;

        // Setup timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.fetchTimeout);

        // Fetch tasks via AJAX
        fetch(url, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            // Parse the HTML to extract just the task list
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newTaskList = doc.getElementById('taskListContainer');

            if (newTaskList) {
                // Add fade-out class
                taskListContainer.classList.add('fade-out');

                setTimeout(() => {
                    // Replace content
                    taskListContainer.innerHTML = newTaskList.innerHTML;
                    
                    // Remove fade-out and trigger fade-in
                    taskListContainer.classList.remove('fade-out');
                    taskListContainer.classList.add('fade-in');
                    
                    // Reset styles
                    taskListContainer.style.opacity = '';
                    taskListContainer.style.transform = '';

                    // Update remaining energy attribute
                    const remainingEnergy = newTaskList.dataset.remainingEnergy;
                    if (remainingEnergy) {
                        taskListContainer.dataset.remainingEnergy = remainingEnergy;
                    }

                    // Reinitialize icons
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }

                    // Re-apply tired mode if active
                    if (window.TiredMode && window.TiredMode.isActive()) {
                        window.TiredMode.apply();
                    }

                    // Re-apply search filter if there's an active search
                    if (searchQuery) {
                        if (window.SearchFilter && window.SearchFilter.filter) {
                            window.SearchFilter.filter(searchQuery);
                        } else {
                            const searchEvent = new Event('input');
                            searchInput.dispatchEvent(searchEvent);
                        }
                    }

                    // Fade in new tasks
                    taskListContainer.style.opacity = '1';
                    taskListContainer.style.transform = 'translateY(0)';

                    // Cleanup fade-in class after animation
                    setTimeout(() => {
                        taskListContainer.classList.remove('fade-in');
                    }, 400);
                    
                    // Hide loading indicator
                    hideLoadingState();
                }, 300);
            } else {
                console.error('Task list container not found in response');
                hideLoadingState();
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error('Task loading timed out');
            } else {
                console.error('Error loading tasks:', error);
            }
            showErrorState();
        });
    }

    /**
     * Show loading state in task list
     */
    function showLoadingState() {
        if (!taskListContainer) return;

        taskListContainer.style.opacity = '0.5';
        taskListContainer.style.pointerEvents = 'none';
        
        // Add loading indicator if not already present
        if (!document.getElementById('tasksLoadingIndicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'tasksLoadingIndicator';
            loadingDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 100;
                background: var(--card-bg);
                padding: 1rem 1.5rem;
                border-radius: 1rem;
                box-shadow: 0 8px 24px var(--shadow-color);
                font-weight: 600;
                color: var(--accent-primary);
            `;
            loadingDiv.textContent = 'Loading tasks...';
            taskListContainer.parentElement.style.position = 'relative';
            taskListContainer.parentElement.appendChild(loadingDiv);
        }
    }

    /**
     * Hide loading state
     */
    function hideLoadingState() {
        if (!taskListContainer) return;

        taskListContainer.style.opacity = '1';
        taskListContainer.style.pointerEvents = 'auto';

        const loadingIndicator = document.getElementById('tasksLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    /**
     * Show error state
     */
    function showErrorState() {
        hideLoadingState();

        if (!taskListContainer) return;

        taskListContainer.innerHTML = `
            <div class="text-center py-16 rounded-[2rem]" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                <div class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style="background: var(--input-bg); color: #ef4444;">
                    <i data-lucide="alert-circle" class="w-10 h-10"></i>
                </div>
                <p class="font-bold text-lg" style="color: var(--text-primary);">Error loading tasks</p>
                <p class="text-sm mt-2" style="color: var(--text-muted);">Please refresh the page and try again</p>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /**
     * Handle browser back/forward navigation
     * @param {PopStateEvent} e - Pop state event
     */
    function handlePopState(e) {
        if (e.state && e.state.status) {
            const status = e.state.status;
            const tab = Array.from(categoryTabs).find(t => t.dataset.status === status);
            
            if (tab) {
                switchTab(tab, status, tab.dataset.description, false);
            }
        }
    }

    /**
     * Announce tab change to screen readers
     * @param {string} status - The new status
     */
    function announceChange(status) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        announcement.textContent = `Showing ${status} tasks`;
        document.body.appendChild(announcement);

        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for external use
    window.CategoryTabs = {
        switchTab,
        loadTasks,
        getCurrentFilter: () => currentFilter
    };

})();

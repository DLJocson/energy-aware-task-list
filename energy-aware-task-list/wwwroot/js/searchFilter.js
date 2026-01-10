// ========================================
// searchFilter.js
// Real-time task search filtering
// 
// Purpose:
// - Filters tasks dynamically as the user types
// - No need to press Enter or submit the form
// - Highlights matching tasks and hides non-matching ones
// - Optimized for performance with debouncing
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const taskCards = document.querySelectorAll('.task-card');
    
    if (!searchInput || !taskCards.length) return;

    let debounceTimer;
    let lastSearchTerm = '';

    // Helper: Show toast notification
    function showResetToast() {
        // Use existing container or create one
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'notification notification-info';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <i data-lucide="list" class="notification-icon"></i>
            <span>Showing all tasks</span>
        `;
        
        container.appendChild(toast);
        
        // Initialize star icon
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Real-time search function with animations
    function filterTasks(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const isReset = lastSearchTerm && !term;
        lastSearchTerm = term;

        // If specific reset, show detailed feedback
        if (isReset) {
            showResetToast();
        }

        let visibleCount = 0;
        // Refresh task cards reference in case of AJAX updates
        const currentTaskCards = document.querySelectorAll('.task-card');

        currentTaskCards.forEach((card, index) => {
            // Skip if card is hidden by Tired Mode
            if (card.style.display === 'none' && !term && card.hasAttribute('data-tired-hidden')) {
                return; // Keep hidden by Tired Mode
            }

            // Get task data
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.line-clamp-2')?.textContent.toLowerCase() || '';
            const category = card.querySelector('[data-lucide="folder"]')?.parentElement.textContent.toLowerCase() || '';
            
            // Check if search term matches
            const matches = !term || 
                           title.includes(term) || 
                           description.includes(term) || 
                           category.includes(term);

            // Use AnimationUtils if available for smooth transitions
            const animate = typeof AnimationUtils !== 'undefined';

            // Show/hide based on match with animations
            if (matches) {
                // Only show if not hidden by Tired Mode
                const tiredModeBtn = document.getElementById('tiredModeToggle');
                const isTiredMode = tiredModeBtn?.classList.contains('active');
                
                if (!isTiredMode) {
                    if (animate && card.style.display === 'none') {
                        // Stagger the animation slightly
                        setTimeout(() => {
                            AnimationUtils.show(card);
                        }, index * 30);
                    } else {
                        card.style.display = '';
                    }
                    card.removeAttribute('data-search-hidden');
                    card.setAttribute('data-search-visible', 'true');
                    visibleCount++;
                } else {
                    // Check if this card should be visible in Tired Mode
                    const status = card.getAttribute('data-status');
                    const cost = parseInt(card.getAttribute('data-energy-cost'));
                    const container = document.getElementById('taskListContainer');
                    const remainingEnergy = parseInt(container?.getAttribute('data-remaining-energy') || 0);
                    
                    if (status !== 'Backlog' || cost <= remainingEnergy) {
                        card.style.display = '';
                        card.removeAttribute('data-search-hidden');
                        visibleCount++;
                    } else {
                         // Tag as hidden by Tired Mode so we don't accidentally show it
                         card.setAttribute('data-tired-hidden', 'true');
                         // Force hide if tired mode blocks it, even if search matches
                         card.style.display = 'none'; 
                    }
                }
            } else {
                // Hide non-matching cards with animation
                if (animate) {
                    AnimationUtils.hide(card);
                } else {
                    card.style.display = 'none';
                }
                card.setAttribute('data-search-hidden', 'true');
                card.removeAttribute('data-search-visible');
            }
        });

        // Show "no results" message if nothing visible
        updateNoResultsMessage(term, visibleCount);
    }

    // Expose filter tasks globally for other scripts
    window.SearchFilter = {
        filter: filterTasks
    };

    // Update or create "no results" message
    function updateNoResultsMessage(searchTerm, visibleCount) {
        const container = document.getElementById('taskListContainer');
        if (!container) return;

        let noResultsDiv = document.getElementById('noSearchResults');

        if (searchTerm && visibleCount === 0) {
            // Create message if it doesn't exist
            if (!noResultsDiv) {
                noResultsDiv = document.createElement('div');
                noResultsDiv.id = 'noSearchResults';
                noResultsDiv.className = 'text-center py-16 rounded-[2rem] card-enter';
                noResultsDiv.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color);';
                noResultsDiv.innerHTML = `
                    <div class="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style="background: var(--input-bg); color: var(--accent-primary);">
                        <i data-lucide="search-x" class="w-10 h-10"></i>
                    </div>
                    <p class="font-bold text-lg mb-2" style="color: var(--text-primary);">No tasks found</p>
                    <p class="text-sm" style="color: var(--text-muted);">Try a different search term</p>
                `;
                container.appendChild(noResultsDiv);
                
                // Initialize Lucide icon
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
            noResultsDiv.style.display = '';
        } else if (noResultsDiv) {
            // Hide message if there are results or no search term
            noResultsDiv.style.display = 'none';
        }
    }

    // Debounced search input handler (optimized for performance)
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        clearTimeout(debounceTimer);
        
        // Immediate update if clearing, otherwise debounce
        if (!val) {
            filterTasks('');
        } else {
            debounceTimer = setTimeout(() => {
                filterTasks(val);
            }, 150);
        }
    });
    
    // Handle "search" event (triggered by 'x' clear button in some browsers)
    searchInput.addEventListener('search', (e) => {
        if (e.target.value === '') {
            filterTasks('');
        }
    });

    // Immediate search on paste
    searchInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            filterTasks(e.target.value);
        }, 50);
    });

    // Clear search on Escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault(); // Prevent default browser behavior
            searchInput.value = '';
            filterTasks('');
            searchInput.blur();
        }
    });

    // Initial filter if there's a search value on page load
    if (searchInput.value) {
        filterTasks(searchInput.value);
    }
});

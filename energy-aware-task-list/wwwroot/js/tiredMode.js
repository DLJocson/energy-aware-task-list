document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('tiredModeToggle');
    const container = document.getElementById('taskListContainer');
    
    if (!toggleBtn || !container) return;

    let isTiredMode = false;

    toggleBtn.addEventListener('click', () => {
        isTiredMode = !isTiredMode;
        const remainingEnergy = parseInt(container.getAttribute('data-remaining-energy') || 0);

        if (isTiredMode) {
            toggleBtn.classList.add('bg-[#4D2FB2]', 'text-white', 'border-[#4D2FB2]', 'shadow-purple-200');
            toggleBtn.classList.remove('bg-white', 'text-[#A594F9]', 'border-transparent');
            
            // Hide items that are too expensive and not Active/Completed
            document.querySelectorAll('.task-card').forEach(card => {
                const cost = parseInt(card.getAttribute('data-energy-cost'));
                const status = card.getAttribute('data-status');
                
                if (status === 'Backlog' && cost > remainingEnergy) {
                    card.style.display = 'none';
                }
            });
        } else {
            toggleBtn.classList.remove('bg-[#4D2FB2]', 'text-white', 'border-[#4D2FB2]', 'shadow-purple-200');
            toggleBtn.classList.add('bg-white', 'text-[#A594F9]', 'border-transparent');
            
            // Show all
            document.querySelectorAll('.task-card').forEach(card => {
                card.style.display = '';
            });
        }
    });
});
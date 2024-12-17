class DashboardManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeVerificationStatus();
        
        // Initialize dashboard data after elements are ready
        if (document.readyState === 'complete') {
            this.initializeDashboard();
        } else {
            window.addEventListener('load', () => this.initializeDashboard());
        }
    }

    initializeElements() {
        // Navigation Elements
        this.navItems = document.querySelectorAll('.nav-item');

        // Header Elements
        this.userProfile = document.querySelector('.user-profile');
        
        // Sidebar Elements
        this.sidebarToggle = document.querySelector('.sidebar-toggle');
        this.sidebar = document.querySelector('.sidebar');

        // Dashboard Elements
        this.taskCards = document.querySelector('.task-cards');
        this.statSection = document.querySelector('.stats-section');
        
        // Profile Elements
        this.profileDropdown = document.getElementById('profileDropdown');
        this.dropdownMenu = document.querySelector('.profile-dropdown-menu');
        
        // Verification Elements
        this.verificationRing = document.querySelector('.verification-ring');
        this.verificationWarning = document.querySelector('.verification-warning');
    }

    attachEventListeners() {
        // Profile Dropdown Events
        if (this.profileDropdown) {
            this.profileDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleProfileDropdown();
            });
        }
    
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#profileDropdown')) {
                this.dropdownMenu?.classList.remove('show');
            }
        });

        // Navigation Events
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Sidebar Toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
    }

    async initializeDashboard() {
        if (this.taskCards) {
            this.showLoadingState();
            await this.loadDashboardData();
        }
    }

    showLoadingState() {
        if (!this.taskCards) return;
        
        const cards = this.taskCards.querySelectorAll('.task-card');
        cards.forEach(card => {
            card.classList.add('loading');
            card.innerHTML = `
                <h3 class="loading-skeleton"></h3>
                <div class="task-info loading-skeleton"></div>
                <div class="progress-container">
                    <div class="progress-bar loading-skeleton"></div>
                </div>
            `;
        });
    }

    removeLoadingState() {
        const loadingCards = document.querySelectorAll('.task-card.loading');
        loadingCards.forEach(card => card.classList.remove('loading'));
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/dashboard/stats/');
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            
            const data = await response.json();
            this.removeLoadingState();
            this.updateDashboardContent(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.handleError('Failed to load dashboard data');
        }
    }

    updateDashboardContent(data) {
        if (this.statSection) {
            const stats = this.statSection.querySelectorAll('.stat-card .stat-value');
            if (stats.length >= 3) {
                stats[0].textContent = data.total_tasks || '0';
                stats[1].textContent = data.in_progress || '0';
                stats[2].textContent = data.completed || '0';
            }
        }

        if (this.taskCards) {
            this.updateTaskCards(data.tasks);
        }
    }

    updateTaskCards(tasks) {
        const runningCard = this.taskCards.querySelector('.task-card.running');
        const upcomingCard = this.taskCards.querySelector('.task-card.upcoming');
        
        // Get user type and profile type from the DOM
        const overviewLink = document.querySelector('.nav-item[data-user-type][data-profile-type]');
        const userType = overviewLink?.getAttribute('data-user-type');
        const profileType = overviewLink?.getAttribute('data-profile-type');
    
        if (tasks.first_task && runningCard) {
            runningCard.innerHTML = this.generateTaskCardContent(tasks.first_task, true, userType, profileType);
            runningCard.onclick = () => window.location.href = `/task/${tasks.first_task.id}`;
            this.animateProgressBar(runningCard.querySelector('.progress-fill'), tasks.first_task.task_progress);
        }
    
        if (upcomingCard) {
            if (tasks.second_task) {
                upcomingCard.innerHTML = this.generateTaskCardContent(tasks.second_task, false, userType, profileType);
                upcomingCard.onclick = () => window.location.href = '/tasks/';
                this.animateProgressBar(upcomingCard.querySelector('.progress-fill'), tasks.second_task.task_progress);
            } else {
                // Customize empty state message based on user type
                const isFreelancer = userType === 'individual' && profileType === 'freelancer';
                upcomingCard.innerHTML = `
                    <h3>${isFreelancer ? 'Upcoming Project' : 'Upcoming Task'}</h3>
                    <div class="task-stats empty-state">
                        <p>NO MORE ${isFreelancer ? 'PROJECTS' : 'TASKS'} IN PIPELINE !!</p>
                    </div>
                `;
            }
        }
    }

    generateTaskCardContent(task, isRunning, userType, profileType) {
        const isFreelancer = userType === 'individual' && profileType === 'freelancer';
        return `
            <h3>${isRunning ? (isFreelancer ? 'Running Project' : 'Running Task') : (isFreelancer ? 'Upcoming Project' : 'Upcoming Task')}</h3>
            <div class="task-stats">
                <div class="task-info">
                    <h4>${task.title}</h4>
                    <div class="task-meta">
                        <span class="task-type">${task.category?.name || 'No Category'}</span>
                        <span class="priority-label ${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                    </div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="total-tasks">${task.task_progress}% Complete</span>
                </div>
            </div>
        `;
    }

    animateProgressBar(element, targetWidth) {
        if (!element) return;
        
        let width = 0;
        const interval = setInterval(() => {
            if (width >= targetWidth) {
                clearInterval(interval);
            } else {
                width++;
                element.style.width = width + '%';
            }
        }, 10);
    }

    initializeVerificationStatus() {
        if (!this.profileDropdown) return;
        
        const emailVerified = this.profileDropdown.dataset.emailVerified === 'true';
        const mobileVerified = this.profileDropdown.dataset.mobileVerified === 'true';
        
        this.updateVerificationStatus(emailVerified, mobileVerified);
    }

    updateVerificationStatus(emailVerified, mobileVerified) {
        if (!this.verificationRing || !this.verificationWarning) return;
        
        if (emailVerified && mobileVerified) {
            this.verificationRing.classList.add('verified');
            this.verificationRing.classList.remove('not-verified');
            this.verificationWarning.style.display = 'none';
        } else {
            this.verificationRing.classList.add('not-verified');
            this.verificationRing.classList.remove('verified');
            this.verificationWarning.style.display = 'flex';
        }
    }

    toggleProfileDropdown() {
        if (!this.dropdownMenu) return;
        
        document.querySelectorAll('.profile-dropdown-menu.show')
            .forEach(menu => {
                if (menu !== this.dropdownMenu) {
                    menu.classList.remove('show');
                }
            });
        this.dropdownMenu.classList.toggle('show');
    }

    handleNavigation(event) {
        if (!event.currentTarget.getAttribute('href') || event.currentTarget.getAttribute('href') === '#') {
            event.preventDefault();
        }
        this.navItems.forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('show');
        }
    }

    handleError(message) {
        this.removeLoadingState();
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});
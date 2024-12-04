class DashboardManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        //this.initializeFocusTimer();
        this.updateTaskProgress();
        this.initializeVerificationStatus();
    }

    initializeElements() {
        // Navigation Elements
        this.navItems = document.querySelectorAll('.nav-item');
        //this.helpCenterBtn = document.querySelector('#helpCenterButton')

        // Header Elements
        this.userProfile = document.querySelector('.user-profile');
        
        // Sidebar Elements
        this.sidebarToggle = document.querySelector('.sidebar-toggle');
        this.sidebar = document.querySelector('.sidebar');

        // Focus Timer Elements
        this.timer = {
            display: document.querySelector('.timer-display'),
            startBtn: document.querySelector('#startTimer'),
            resetBtn: document.querySelector('#resetTimer'),
            time: 25 * 60, // 25 minutes in seconds
            interval: null,
            isRunning: false
        };

        // Stats and Progress Elements
        this.statCards = document.querySelectorAll('.stat-card');
        this.runningTaskProgress = document.querySelector('.running .progress-fill');
        this.upcomingTaskProgress = document.querySelector('.upcoming .progress-fill');
        
        // Profile Elements
        this.profileDropdown = document.getElementById('profileDropdown');
        this.dropdownMenu = document.querySelector('.profile-dropdown-menu');
        console.log('Profile elements:', { 
            dropdown: this.profileDropdown, 
            menu: this.dropdownMenu 
        });
    }

    attachEventListeners() {
        // Sidebar Events
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Navigation Items
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Timer Events
        if (this.timer.startBtn) {
            this.timer.startBtn.addEventListener('click', () => this.toggleTimer());
        }
        if (this.timer.resetBtn) {
            this.timer.resetBtn.addEventListener('click', () => this.resetTimer());
        }

        // Profile Events
        if (this.profileDropdown) {
            this.profileDropdown.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop event bubbling
                this.toggleProfileDropdown();
            });
        }
    
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#profileDropdown')) {
                this.dropdownMenu?.classList.remove('show');
            }
        });

        // Outside Click Handler
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        //Help Center Button
        /*if (this.helpCenterBtn) {
            this.helpCenterBtn.addEventListener('click', () => {
                window.location.href = '/help-center/';
            });
        }*/
    }

    showHelpCenter() {
        const modal = document.createElement('div');
        modal.className = 'help-modal';
        modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h3>Help Center</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="help-modal-body">
                    <div class="help-section">
                        <h4>Quick Start Guide</h4>
                        <ul>
                            <li>Create and track your tasks</li>
                            <li>Use focus timer for productivity</li>
                            <li>Monitor your progress</li>
                            <li>Manage task priorities</li>
                        </ul>
                    </div>
                    <div class="help-section">
                        <h4>Need Help?</h4>
                        <p>Having trouble in learning? Contact our support team.</p>
                        <button class="contact-support-btn">Contact Support</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }

    // Focus Timer Functions - Keeping your existing implementation
    toggleTimer() {
        if (!this.timer.isRunning) {
            this.startTimer();
            this.timer.startBtn.textContent = 'Pause';
            this.timer.isRunning = true;
        } else {
            this.pauseTimer();
            this.timer.startBtn.textContent = 'Resume';
            this.timer.isRunning = false;
        }
    }

    startTimer() {
        this.timer.interval = setInterval(() => {
            this.timer.time--;
            this.updateTimerDisplay();
            if (this.timer.time <= 0) this.completeTimer();
        }, 1000);
    }

    pauseTimer() {
        clearInterval(this.timer.interval);
    }

    resetTimer() {
        this.pauseTimer();
        this.timer.time = 25 * 60;
        this.timer.isRunning = false;
        this.timer.startBtn.textContent = 'Start';
        this.updateTimerDisplay();
    }

    completeTimer() {
        this.pauseTimer();
        this.resetTimer();
    }

    updateTimerDisplay() {
        if (!this.timer.display) return;
        const minutes = Math.floor(this.timer.time / 60);
        const seconds = this.timer.time % 60;
        this.timer.display.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Task Progress
    updateTaskProgress() {
        if (this.runningTaskProgress) {
            this.animateProgress(this.runningTaskProgress, 65);
        }
        if (this.upcomingTaskProgress) {
            this.upcomingTaskProgress.style.width = '0%';
        }
    }

    animateProgress(element, targetWidth) {
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

    // Navigation and Sidebar
    handleNavigation(event) {
        // Only prevent default if it's not an actual link
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

    // Utility Functions
    handleOutsideClick(event) {
        const helpModal = document.querySelector('.help-modal');
        const userMenu = document.querySelector('.user-menu');

        if (helpModal && 
            !event.target.closest('.help-modal-content') && 
            !event.target.closest('.help-btn')) {
            helpModal.classList.remove('show');
            setTimeout(() => helpModal.remove(), 300);
        }

        if (userMenu && 
            !event.target.closest('.user-profile') && 
            !event.target.closest('.user-menu')) {
            userMenu.classList.remove('show');
        }
    }

    // Profile Dropdown
    toggleProfileDropdown() {
        if (this.dropdownMenu) {
            // Close any other open dropdowns first
            document.querySelectorAll('.profile-dropdown-menu.show')
                .forEach(menu => {
                    if (menu !== this.dropdownMenu) {
                        menu.classList.remove('show');
                    }
                });
            this.dropdownMenu.classList.toggle('show');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
    
        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    initializeVerificationStatus() {
        // Get verification status from user data
        // You'll need to pass this data from Django to your template
        const emailVerified = document.querySelector('.user-profile').dataset.emailVerified === 'true';
        const mobileVerified = document.querySelector('.user-profile').dataset.mobileVerified === 'true';
        
        this.updateVerificationStatus(emailVerified, mobileVerified);
    }

    updateVerificationStatus(emailVerified, mobileVerified) {
        const verificationRing = document.querySelector('.verification-ring');
        const verificationWarning = document.querySelector('.verification-warning');
        
        if (emailVerified && mobileVerified) {
            verificationRing.classList.add('verified');
            verificationRing.classList.remove('not-verified');
            verificationWarning.style.display = 'none';
        } else {
            verificationRing.classList.add('not-verified');
            verificationRing.classList.remove('verified');
            verificationWarning.style.display = 'flex';
        }
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
});
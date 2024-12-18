class DashboardManager {
    constructor() {
        this.setupCSRFToken();
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
            if (stats.length >= 4) { // Changed to 4 since we have 4 stat cards now
                const userType = document.querySelector('.nav-item[data-user-type]')?.dataset.userType;
                
                if (userType === 'team') {
                    // For team dashboard
                    stats[0].textContent = data.team_members_count || '0';
                    stats[1].textContent = data.total_tasks || '0';
                    stats[2].textContent = data.in_progress || '0';
                    stats[3].textContent = data.completed || '0';
                } else {
                    // For individual dashboard
                    stats[0].textContent = data.total_tasks || '0';
                    stats[1].textContent = data.in_progress || '0';
                    stats[2].textContent = data.completed || '0';
                }
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
        } else if (runningCard) {
            // Show empty state for running card
            runningCard.innerHTML = this.generateEmptyTaskCard(true, userType, profileType);
        }
    
        if (upcomingCard) {
            if (tasks.second_task) {
                upcomingCard.innerHTML = this.generateTaskCardContent(tasks.second_task, false, userType, profileType);
                upcomingCard.onclick = () => window.location.href = '/tasks/';
                this.animateProgressBar(upcomingCard.querySelector('.progress-fill'), tasks.second_task.task_progress);
            } else {
                // Show empty state for upcoming card
                upcomingCard.innerHTML = this.generateEmptyTaskCard(false, userType, profileType);
            }
        }
    }

    generateTaskCardContent(task, isRunning, userType, profileType) {
        const isFreelancer = userType === 'individual' && profileType === 'freelancer';
        const isTeam = userType === 'team';
        const taskTypeLabel = isFreelancer ? (isRunning ? 'Running Project' : 'Upcoming Project') 
                            : isTeam ? (isRunning ? 'Running Team Task' : 'Upcoming Team Task')
                            : (isRunning ? 'Running Task' : 'Upcoming Task');

        return `
            <h3>${taskTypeLabel}</h3>
            <div class="task-stats">
                <div class="task-info">
                    <h4 class="task-title">${task.title}</h4>
                    <div class="task-meta">
                        <span class="task-type">${task.category?.name || 'No Category'}</span>
                        <span class="priority-label ${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-text">${task.task_progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                </div>
                <div class="task-meta">
                    ${this.formatTaskDate(task.end_date, task.end_time, task.status)}
                </div>
            </div>
        `;
    }

    generateEmptyTaskCard(isRunning, userType, profileType) {
        const isFreelancer = userType === 'individual' && profileType === 'freelancer';
        const isTeam = userType === 'team';
        const cardType = isRunning ? 'Running' : 'Upcoming';
        const itemType = isFreelancer ? 'Project' : (isTeam ? 'Team Task' : 'Task');
        
        return `
            <h3>${cardType} ${itemType}</h3>
            <div class="task-stats empty-state">
                <p>NO ${cardType.toUpperCase()} ${itemType.toUpperCase()} IN PIPELINE !!</p>
            </div>
        `;
    }

    formatTaskDate(endDate, endTime, status) {
        if (!endDate) return '';
        
        if (status === "completed") {
            return `
                <div class="due-date completed">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9 12l2 2 4-4"/>
                    </svg>
                    Completed
                </div>`;
        }
        
        const end = new Date(`${endDate}T${endTime || '00:00'}`);
        const now = new Date();
        
        const diffMs = end - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        let dateContent;
        let className;
    
        if (diffDays < 0 || diffHours < 0) {
            dateContent = `Overdue by ${Math.abs(diffDays + 1)} days`;
            className = 'overdue';
        }
        else if (diffHours <= 24) {
            dateContent = `${diffHours} hours left`;
            className = 'urgent';
        }
        else if (diffDays <= 7) {
            dateContent = `${diffDays} days left`;
            className = 'upcoming';
        }
        else {
            const dateFormatter = new Intl.DateTimeFormat('default', { 
                month: 'short', 
                day: 'numeric' 
            });
            dateContent = `Due ${dateFormatter.format(end)}`;
            className = 'future';
        }
    
        return `
            <div class="due-date ${className}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                ${dateContent}
            </div>`;
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

    setupCSRFToken() {
        // Create and add CSRF token input if it doesn't exist
        if (!document.querySelector('[name=csrfmiddlewaretoken]')) {
            const csrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];

            if (csrfToken) {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'csrfmiddlewaretoken';
                tokenInput.value = csrfToken;
                document.body.appendChild(tokenInput);
            }
        }
    }
}

function showManageTeamModal() {
    document.getElementById('manageTeamModal').style.display = 'block';
}

function closeManageTeamModal() {
    document.getElementById('manageTeamModal').style.display = 'none';
}

async function addTeamMember() {
    const email = document.getElementById('newMemberEmail').value;
    try {
        const response = await fetch('/api/team/members/add/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        if (response.ok) {
            window.location.reload();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error adding team member:', error);
    }
}

async function removeTeamMember(memberId) {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
        const response = await fetch(`/api/team/members/${memberId}/remove/`, {
            method: 'DELETE'
        });
        if (response.ok) {
            window.location.reload();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error removing team member:', error);
    }
}

class TeamChat {
    constructor() {
        this.messagesList = document.getElementById('messagesList');
        this.messageInput = document.getElementById('messageInput');
        this.socket = null;
        this.initializeWebSocket();
        this.loadMessageHistory();
    }

    initializeWebSocket() {
        const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const wsUrl = `${wsScheme}${window.location.host}/ws/chat/`;
        
        console.log('Attempting to connect to WebSocket at:', wsUrl);
        
        try {
            this.socket = new WebSocket(wsUrl);
    
            this.socket.onopen = () => {
                console.log('WebSocket connection established');
            };
    
            this.socket.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    this.addMessage(data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };
    
            this.socket.onclose = (e) => {
                console.log('WebSocket connection closed:', e.code, e.reason);
                // Try to reconnect after 5 seconds
                setTimeout(() => this.initializeWebSocket(), 5000);
            };
    
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
        }
    }

    async loadMessageHistory() {
        try {
            const response = await fetch('/api/team/messages/');
            const data = await response.json();
            data.messages.reverse().forEach(msg => this.addMessage(msg));
        } catch (error) {
            console.error('Error loading message history:', error);
        }
    }

    addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender.id === currentUserId ? 'sent' : 'received'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">${message.sender.name}</span>
                    <span class="message-time">${new Date(message.created_at).toLocaleTimeString()}</span>
                </div>
                <div class="message-text">${message.content}</div>
            </div>
        `;
        this.messagesList.appendChild(messageElement);
        this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                'message': message,
                'is_private': false
            }));
            this.messageInput.value = '';
        }
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();

    if (document.getElementById('messagesList')) {
        window.teamChat = new TeamChat();
    }
});
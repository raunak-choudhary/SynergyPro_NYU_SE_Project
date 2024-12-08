class NotificationManager {
    constructor() {
        this.initializeElements();
        this.fetchNotificationsFromServer();
        this.attachEventListeners();
        // Poll for new notifications every minute
        setInterval(() => this.fetchNotificationsFromServer(), 60000);
    }

    initializeElements() {
        this.notificationTrigger = document.querySelector('.notification-trigger');
        this.notificationsPanel = document.querySelector('.notifications-panel');
        this.notificationsList = document.querySelector('.notifications-list');
        this.markAllReadBtn = document.querySelector('.mark-all-read');
        this.notificationBadge = document.querySelector('.notification-badge');
        this.clearAllBtn = document.querySelector('.clear-all');
    }

    async fetchNotificationsFromServer() {
        try {
            const response = await fetch('/api/notifications/');
            if (response.ok) {
                const notifications = await response.json();
                this.renderNotifications(notifications);
                this.updateNotificationBadge(notifications);
            } else {
                console.error('Failed to fetch notifications');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    attachEventListeners() {
        if (this.notificationTrigger) {
            this.notificationTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotifications();
            });
        }

        if (this.markAllReadBtn) {
            this.markAllReadBtn.addEventListener('click', () => this.markAllAsRead());
        }

        if (this.clearAllBtn) {
            this.clearAllBtn.addEventListener('click', () => this.clearAllNotifications());
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notifications') && 
                this.notificationsPanel?.classList.contains('show')) {
                this.notificationsPanel.classList.remove('show');
            }
        });

        // Add click handler for individual notifications
        if (this.notificationsList) {
            this.notificationsList.addEventListener('click', (e) => {
                const notificationItem = e.target.closest('.notification-item');
                if (notificationItem) {
                    const notificationId = parseInt(notificationItem.dataset.id);
                    this.markAsRead(notificationId);
                }
            });
        }
    }

    toggleNotifications() {
        if (this.notificationsPanel) {
            this.notificationsPanel.classList.toggle('show');
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/mark-all-read/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (response.ok) {
                const unreadItems = document.querySelectorAll('.notification-item.unread');
                unreadItems.forEach(item => {
                    item.classList.remove('unread');
                });
                this.updateNotificationBadge([]);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/mark-read/${notificationId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (response.ok) {
                const notificationItem = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
                if (notificationItem) {
                    notificationItem.classList.remove('unread');
                    await this.fetchNotificationsFromServer(); // Refresh notifications
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async clearAllNotifications() {
        try {
            const response = await fetch('/api/notifications/clear/', {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (response.ok) {
                if (this.notificationsList) {
                    this.notificationsList.innerHTML = `
                        <div class="notification-item empty-state">
                            <p>No notifications</p>
                        </div>
                    `;
                }
                this.updateNotificationBadge([]);
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }

    renderNotifications(notifications) {
        if (!this.notificationsList) return;

        if (notifications.length === 0) {
            this.notificationsList.innerHTML = `
                <div class="notification-item empty-state">
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        this.notificationsList.innerHTML = notifications
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                    <div class="notification-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22c1-1 1-2 1-3h-2c0 1 0 2 1 3z"/>
                            <path d="M19 17V11a7 7 0 0 0-14 0v6l-2 2h18l-2-2z"/>
                        </svg>
                    </div>
                    <div class="notification-content">
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${this.formatTimeAgo(notification.created_at)}</span>
                    </div>
                </div>
            `).join('');
    }

    updateNotificationBadge(notifications) {
        if (!this.notificationBadge) return;
        
        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            this.notificationBadge.textContent = unreadCount;
            this.notificationBadge.style.display = 'block';
        } else {
            this.notificationBadge.style.display = 'none';
        }
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }

    // Method to be called from other parts of the application
    async addNotification(message, taskId = null) {
        try {
            const response = await fetch('/api/notifications/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({
                    message,
                    task_id: taskId
                })
            });

            if (response.ok) {
                await this.fetchNotificationsFromServer();
            }
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});
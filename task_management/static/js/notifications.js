// CREATE NEW FILE: static/js/notifications.js
class NotificationManager {
    constructor() {
        this.initializeElements();
        this.initializeNotifications();
        this.attachEventListeners();
        this.updateNotificationBadge();
    }

    initializeElements() {
        this.notificationTrigger = document.querySelector('.notification-trigger');
        this.notificationsPanel = document.querySelector('.notifications-panel');
        this.notificationsList = document.querySelector('.notifications-list');
        this.markAllReadBtn = document.querySelector('.mark-all-read');
        this.notificationBadge = document.querySelector('.notification-badge');
    }

    initializeNotifications() {
        // Get notifications from localStorage first
        const savedNotifications = localStorage.getItem('notifications');
        
        if (savedNotifications) {
            // Use saved notifications if they exist
            this.notifications = JSON.parse(savedNotifications);
        } else {
            // Only set default notifications if none exist in localStorage
            this.notifications = [
                {
                    id: 1,
                    message: 'Task deadline approaching',
                    timestamp: new Date().toISOString(),
                    read: false
                },
                {
                    id: 2,
                    message: 'New task assigned',
                    timestamp: new Date().toISOString(),
                    read: false
                },
                {
                    id: 3,
                    message: 'Progress update required',
                    timestamp: new Date().toISOString(),
                    read: false
                }
            ];
            // Save these default notifications
            this.saveNotifications();
        }
    
        this.renderNotifications();
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

        const clearAllBtn = document.querySelector('.clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllNotifications());
        }
    }

    toggleNotifications() {
        if (this.notificationsPanel) {
            this.notificationsPanel.classList.toggle('show');
        }
    }

    markAllAsRead() {
        const unreadItems = document.querySelectorAll('.notification-item.unread');
        unreadItems.forEach(item => {
            item.classList.remove('unread');
        });
        
        // Update badge
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }

        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveNotifications();
        this.renderNotifications();
        this.updateNotificationBadge();
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.renderNotifications();
            this.updateNotificationBadge();
        }
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (this.notificationBadge) {
            if (unreadCount > 0) {
                this.notificationBadge.textContent = unreadCount;
                this.notificationBadge.style.display = 'block';
            } else {
                this.notificationBadge.style.display = 'none';
            }
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

    renderNotifications() {
        if (!this.notificationsList) return;

        if (this.notifications.length === 0) {
            this.notificationsList.innerHTML = `
                <div class="notification-item empty-state">
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        this.notificationsList.innerHTML = this.notifications
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
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
                    <span class="notification-time">${this.formatTimeAgo(notification.timestamp)}</span>
                </div>
            </div>
        `).join('');
        

    }
    addNotification(message) {
        const notification = {
            id: Date.now(),
            message,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        this.notifications.unshift(notification);
        this.saveNotifications();
        this.renderNotifications();
        this.updateNotificationBadge();
    }

    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.renderNotifications();
        this.updateNotificationBadge();
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});
class SettingsManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadUserPreferences();
        this.initializeTimezones();
    }

    initializeElements() {
        // Navigation
        this.navItems = document.querySelectorAll('.settings-nav-item');
        this.sections = document.querySelectorAll('.settings-section');

        // Forms
        this.passwordForm = document.getElementById('password-form');
        this.bioForm = document.getElementById('bio-form');

        // Theme
        this.themeSelect = document.getElementById('theme-select');

        // Verification
        this.verifyButtons = document.querySelectorAll('.verify-button');

        // Session Management
        this.activeSessionsTable = document.getElementById('active-sessions-data');
        this.loginHistoryTable = document.getElementById('login-history-data');

        // Language and Region
        this.interfaceLanguage = document.getElementById('interface-language');
        this.timezoneSelect = document.getElementById('timezone');
        this.dateFormatSelect = document.getElementById('date-format');

        // Communication
        this.contactMethod = document.getElementById('contact-method');
        this.commFrequency = document.getElementById('comm-frequency');
        this.commLanguage = document.getElementById('comm-language');
    }

    attachEventListeners() {
        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', () => this.switchSection(item.dataset.section));
        });

        // Forms
        if (this.passwordForm) {
            this.passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
        
        if (this.bioForm) {
            this.bioForm.addEventListener('submit', (e) => this.handleBioUpdate(e));
        }

        // Theme
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', () => this.handleThemeChange());
        }

        // Verification
        this.verifyButtons.forEach(button => {
            button.addEventListener('click', () => this.initiateVerification(button.dataset.type));
        });

        // Delete Account
        const deleteButton = document.querySelector('.delete-account-button');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => this.handleDeleteAccount());
        }

        // Language and Region
        if (this.interfaceLanguage) {
            this.interfaceLanguage.addEventListener('change', () => this.handleLanguageChange());
        }
        
        if (this.timezoneSelect) {
            this.timezoneSelect.addEventListener('change', () => this.handleTimezoneChange());
        }
        
        if (this.dateFormatSelect) {
            this.dateFormatSelect.addEventListener('change', () => this.handleDateFormatChange());
        }

        // Communication Preferences
        [this.contactMethod, this.commFrequency, this.commLanguage].forEach(select => {
            if (select) {
                select.addEventListener('change', () => this.handleCommunicationPreferenceChange());
            }
        });
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    switchSection(sectionId) {
        // Update navigation
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Update sections
        this.sections.forEach(section => {
            section.classList.toggle('active', section.id === `${sectionId}-settings`);
        });

        // Update URL without page reload
        history.pushState(null, '', `#${sectionId}`);
    }

    async handlePasswordChange(event) {
        event.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch('/api/settings/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                this.showNotification(data.message || 'Password updated successfully');
                event.target.reset();
            } else {
                this.showNotification(data.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            this.showNotification('An error occurred while updating password', 'error');
        }
    }

    async handleBioUpdate(event) {
        event.preventDefault();
        const bio = document.getElementById('bio').value;

        try {
            const response = await fetch('/api/settings/update-bio/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                },
                body: JSON.stringify({ bio }),
            });

            const data = await response.json();
            if (response.ok) {
                this.showNotification(data.message || 'Bio updated successfully');
            } else {
                this.showNotification(data.message || 'Failed to update bio', 'error');
            }
        } catch (error) {
            this.showNotification('An error occurred while updating bio', 'error');
        }
    }

    handleThemeChange() {
        const theme = this.themeSelect.value;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Send theme preference to server
        fetch('/api/settings/update-theme/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken(),
            },
            body: JSON.stringify({ theme }),
        });
    }

    async loadLoginHistory() {
        try {
            const response = await fetch('/api/settings/login-history/');
            if (response.ok) {
                const data = await response.json();
                this.updateLoginHistoryTable(data.history);
            }
        } catch (error) {
            console.error('Failed to load login history:', error);
        }
    }

    updateLoginHistoryTable(history) {
        if (!this.loginHistoryTable) return;

        this.loginHistoryTable.innerHTML = history.map(entry => `
            <tr>
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
                <td>${entry.device}</td>
                <td>${entry.location}</td>
                <td><span class="status-${entry.status.toLowerCase()}">${entry.status}</span></td>
            </tr>
        `).join('');
    }

    async loadActiveSessions() {
        try {
            const response = await fetch('/api/settings/active-sessions/');
            if (response.ok) {
                const data = await response.json();
                this.updateActiveSessionsTable(data.sessions);
            }
        } catch (error) {
            console.error('Failed to load active sessions:', error);
        }
    }

    updateActiveSessionsTable(sessions) {
        if (!this.activeSessionsTable) return;

        this.activeSessionsTable.innerHTML = sessions.map(session => `
            <tr>
                <td>${session.device}</td>
                <td>${session.location}</td>
                <td>${session.last_active}</td>
                <td>
                    <button class="revoke-session-btn" data-session-id="${session.id}">
                        Revoke Access
                    </button>
                </td>
            </tr>
        `).join('');

        // Attach event listeners to revoke buttons
        this.activeSessionsTable.querySelectorAll('.revoke-session-btn').forEach(button => {
            button.addEventListener('click', () => this.revokeSession(button.dataset.sessionId));
        });
    }

    async revokeSession(sessionId) {
        try {
            const response = await fetch('/api/settings/revoke-session/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                },
                body: JSON.stringify({ session_id: sessionId }),
            });

            if (response.ok) {
                this.showNotification('Session revoked successfully');
                this.loadActiveSessions();
            } else {
                this.showNotification('Failed to revoke session', 'error');
            }
        } catch (error) {
            this.showNotification('An error occurred while revoking session', 'error');
        }
    }

    async handleDeleteAccount() {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/settings/delete-account/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCsrfToken(),
                },
            });

            if (response.ok) {
                window.location.href = '/logout/';
            } else {
                this.showNotification('Failed to delete account', 'error');
            }
        } catch (error) {
            this.showNotification('An error occurred while deleting account', 'error');
        }
    }

    handleLanguageChange() {
        const language = this.interfaceLanguage.value;
        this.savePreference('interface_language', language);
    }

    handleTimezoneChange() {
        const timezone = this.timezoneSelect.value;
        this.savePreference('timezone', timezone);
    }

    handleDateFormatChange() {
        const dateFormat = this.dateFormatSelect.value;
        this.savePreference('date_format', dateFormat);
    }

    handleCommunicationPreferenceChange() {
        const preferences = {
            contact_method: this.contactMethod?.value,
            frequency: this.commFrequency?.value,
            language: this.commLanguage?.value
        };
        
        this.savePreference('communication_preferences', preferences);
    }

    async savePreference(key, value) {
        try {
            const response = await fetch('/api/settings/save-preference/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                },
                body: JSON.stringify({
                    key,
                    value
                }),
            });

            if (response.ok) {
                this.showNotification('Preferences saved successfully');
            } else {
                this.showNotification('Failed to save preferences', 'error');
            }
        } catch (error) {
            this.showNotification('An error occurred while saving preferences', 'error');
        }
    }

    loadUserPreferences() {
        // Load theme
        const savedTheme = localStorage.getItem('theme') || 'system';
        if (this.themeSelect) {
            this.themeSelect.value = savedTheme;
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // Load other sections
        this.loadLoginHistory();
        this.loadActiveSessions();
    }

    initializeTimezones() {
        if (!this.timezoneSelect) return;

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Get all timezones
        Intl.supportedValuesOf('timeZone').forEach(timezone => {
            const option = document.createElement('option');
            option.value = timezone;
            option.textContent = timezone.replace(/_/g, ' ');
            option.selected = timezone === userTimezone;
            this.timezoneSelect.appendChild(option);
        });
    }
}

// Initialize settings manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
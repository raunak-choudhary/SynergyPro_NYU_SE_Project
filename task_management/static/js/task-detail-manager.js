class TaskDetailManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadTaskDetails();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('taskDetailForm');
        this.taskName = document.getElementById('taskName');
        this.taskDescription = document.getElementById('taskDescription');
        this.startDate = document.getElementById('startDate');
        this.startTime = document.getElementById('startTime');
        this.endDate = document.getElementById('endDate');
        this.endTime = document.getElementById('endTime');

        // Buttons
        this.editBtn = document.getElementById('editBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.deleteBtn = document.getElementById('deleteBtn');

        // Comments section
        this.commentsList = document.getElementById('commentsList');
        this.commentTemplate = document.getElementById('commentTemplate');
        this.newCommentInput = document.getElementById('newComment');
        this.addCommentBtn = document.getElementById('addCommentBtn');
        this.commentCount = document.querySelector('.comment-count');

        // Modal elements
        this.deleteModal = document.getElementById('deleteModal');
        this.closeModalBtn = this.deleteModal.querySelector('.close-modal');
        this.cancelDeleteBtn = this.deleteModal.querySelector('.cancel-delete');
        this.confirmDeleteBtn = this.deleteModal.querySelector('.confirm-delete');

        // Get task ID from URL
        this.taskId = window.location.pathname.split('/').filter(Boolean).pop();

        // Form fields to toggle
        this.editableFields = [
            this.taskName,
            this.taskDescription,
            this.startDate,
            this.startTime,
            this.endDate,
            this.endTime
        ];

        // User details
        this.userAvatar = document.querySelector('.avatar-img').src;
        this.userName = document.querySelector('.welcome-message p').textContent.split(',')[0].trim();
    }

    attachEventListeners() {
        // Form action buttons
        this.form.addEventListener('submit', e => this.handleSave(e));
        this.editBtn.addEventListener('click', () => this.enableEditing());
        this.deleteBtn.addEventListener('click', () => this.confirmDelete());
        this.addCommentBtn.addEventListener('click', () => this.addComment());

        // Modal buttons
        this.closeModalBtn.addEventListener('click', () => this.closeDeleteModal());
        this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        this.confirmDeleteBtn.addEventListener('click', () => this.handleDelete());

        // Comments
        this.addCommentBtn.addEventListener('click', () => this.handleAddComment());
        this.newCommentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleAddComment();
            }
        });

        // Close modal on outside click
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) {
                this.closeDeleteModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.deleteModal.classList.contains('show')) {
                this.closeDeleteModal();
            }
        });
    }
    async loadTaskDetails() {
        try {
            const response = await fetch(`/api/task/${this.taskId}/`);
            if (!response.ok) {
                throw new Error('Failed to fetch task details');
            }
            
            const task = await response.json();
            this.populateTaskDetails(task);
            await this.loadComments();
        } catch (error) {
            this.handleError(error, 'Error loading task details');
        }
    }

    populateTaskDetails(task) {
        this.taskName.value = task.title || '';
        this.taskDescription.value = task.description || '';

        if (task.start_date) {
            const startDateTime = new Date(task.start_date);
            this.startDate.value = this.formatDate(startDateTime);
            this.startTime.value = this.formatTime(startDateTime);
        }

        if (task.end_date) {
            const endDateTime = new Date(task.end_date);
            this.endDate.value = this.formatDate(endDateTime);
            this.endTime.value = this.formatTime(endDateTime);
        }

        // Disable editing by default
        this.disableEditing();
    }

    enableEditing() {
        this.editableFields.forEach(field => {
            field.disabled = false;
            field.classList.add('enabled');
        });
        this.saveBtn.disabled = false;
        this.editBtn.disabled = true;

        // Add editing class to form for visual feedback
        this.form.classList.add('editing');
    }

    disableEditing() {
        this.editableFields.forEach(field => {
            field.disabled = true;
            field.classList.remove('enabled');
        });
        this.saveBtn.disabled = true;
        this.editBtn.disabled = false;

        // Remove editing class from form
        this.form.classList.remove('editing');
    }

    async handleSave(e) {
        e.preventDefault();
        
        try {
            const formData = this.getFormData();
            const response = await fetch(`/api/task/${this.taskId}/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update task');
            }

            const result = await response.json();
            this.showNotification('Task updated successfully', 'success');
            this.disableEditing();
            await this.loadTaskDetails(); // Reload to get latest data
        } catch (error) {
            this.handleError(error, 'Error saving task');
        }
    }

    getFormData() {
        const startDateTime = this.combineDateAndTime(this.startDate.value, this.startTime.value);
        const endDateTime = this.combineDateAndTime(this.endDate.value, this.endTime.value);

        return {
            title: this.taskName.value.trim(),
            description: this.taskDescription.value.trim(),
            start_date: startDateTime,
            end_date: endDateTime
        };
    }

    combineDateAndTime(date, time) {
        if (!date || !time) return null;
        return `${date}T${time}:00`;
    }

    showDeleteModal() {
        this.deleteModal.classList.add('show');
        // Focus on cancel button for better keyboard navigation
        this.cancelDeleteBtn.focus();
    }

    closeDeleteModal() {
        this.deleteModal.classList.remove('show');
        // Return focus to delete button
        this.deleteBtn.focus();
    }

    async handleDelete() {
        try {
            const response = await fetch(`/api/task/${this.taskId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            this.showNotification('Task deleted successfully', 'success');
            // Redirect to tasks list page after successful deletion
            setTimeout(() => {
                window.location.href = '/tasks';
            }, 1500);
        } catch (error) {
            this.handleError(error, 'Error deleting task');
        }
    }

    async loadComments() {
        try {
            const response = await fetch(`/api/task/${this.taskId}/comments/`);
            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }
            
            const comments = await response.json();
            this.renderComments(comments);
        } catch (error) {
            this.handleError(error, 'Error loading comments');
        }
    }

    renderComments(comments) {
        this.commentsList.innerHTML = '';
        if (comments.length === 0) {
            this.commentsList.innerHTML = `
                <div class="no-comments">
                    <p>No comments yet. Add your first comment!</p>
                </div>
            `;
            return;
        }

        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            this.commentsList.appendChild(commentElement);
        });

        // Scroll to latest comment
        this.commentsList.scrollTop = this.commentsList.scrollHeight;
    }

    createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        
        div.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    <img src="${comment.author_avatar || this.userAvatar}" alt="Avatar">
                    <span>${comment.author_name}</span>
                </div>
                <span class="comment-time">${this.formatCommentDate(comment.created_at)}</span>
            </div>
            <div class="comment-content">${this.formatCommentText(comment.content)}</div>
        `;
        
        return div;
    }

    async handleAddComment() {
        const content = this.newCommentInput.value.trim();
        if (!content) return;

        try {
            const response = await fetch(`/api/task/${this.taskId}/comments/add/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                throw new Error('Failed to add comment');
            }

            this.newCommentInput.value = '';
            await this.loadComments();
            this.showNotification('Comment added successfully', 'success');
        } catch (error) {
            this.handleError(error, 'Error adding comment');
        }
    }

    // Utility Methods
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    }

    formatTime(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toTimeString().slice(0, 5);
    }

    formatCommentDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        } else {
            return date.toLocaleDateString('default', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    formatCommentText(text) {
        // Convert URLs to clickable links
        text = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Convert line breaks to <br>
        return text.replace(/\n/g, '<br>');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Add show class after a small delay to trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    handleError(error, message) {
        console.error(error);
        this.showNotification(message, 'error');
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }

    getTaskIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.indexOf('task') + 1];
    }
}

// Initialize TaskDetailManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskDetailManager = new TaskDetailManager();
});
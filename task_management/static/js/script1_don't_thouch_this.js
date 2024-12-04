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

        // Comments
        this.commentsList = document.getElementById('commentsList');
        this.commentTemplate = document.getElementById('commentTemplate');
        this.newCommentInput = document.getElementById('newComment');
        this.addCommentBtn = document.getElementById('addCommentBtn');
        this.commentCount = document.querySelector('.comment-count');

        // Form fields array
        this.editableFields = [
            this.taskName,
            this.taskDescription,
            this.startDate,
            this.startTime,
            this.endDate,
            this.endTime
        ];

        // Task ID from URL
        this.taskId = window.location.pathname.split('/').filter(Boolean).pop();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', e => this.handleSave(e));
        this.editBtn.addEventListener('click', () => this.enableEditing());
        this.deleteBtn.addEventListener('click', () => this.confirmDelete());
        this.addCommentBtn.addEventListener('click', () => this.addComment());

        // Auto-resize comment textarea
        this.newCommentInput.addEventListener('input', () => {
            this.newCommentInput.style.height = 'auto';
            this.newCommentInput.style.height = this.newCommentInput.scrollHeight + 'px';
        });
    }

    async loadTaskDetails() {
        try {
            const response = await fetch(`/api/task/${this.taskId}/`);
            const task = await response.json();
            
            this.populateForm(task);
            await this.loadComments();
        } catch (error) {
            this.showNotification('Error loading task details', 'error');
        }
    }

    populateForm(task) {
        this.taskName.value = task.title;
        this.taskDescription.value = task.description;

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
    }

    async loadComments() {
        try {
            const response = await fetch(`/api/task/${this.taskId}/comments/`);
            const comments = await response.json();
            
            this.renderComments(comments);
        } catch (error) {
            this.showNotification('Error loading comments', 'error');
        }
    }

    renderComments(comments) {
        this.commentsList.innerHTML = '';
        this.commentCount.textContent = `${comments.length} comments`;

        if (comments.length === 0) {
            this.commentsList.innerHTML = `
                <div class="no-comments">
                    <p>No comments yet. Add your first comment!</p>
                </div>
            `;
            return;
        }

        comments.forEach(comment => {
            const element = this.createCommentElement(comment);
            this.commentsList.appendChild(element);
        });

        this.commentsList.scrollTop = this.commentsList.scrollHeight;
    }

    createCommentElement(comment) {
        const template = this.commentTemplate.content.cloneNode(true);
        const element = template.querySelector('.comment-item');

        element.querySelector('.author-avatar').src = comment.author_avatar;
        element.querySelector('.author-name').textContent = comment.author_name;
        element.querySelector('.comment-time').textContent = this.formatCommentDate(comment.created_at);
        element.querySelector('.comment-content').textContent = comment.content;

        return element;
    }

    async addComment() {
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

            if (!response.ok) throw new Error('Failed to add comment');

            this.newCommentInput.value = '';
            await this.loadComments();
            this.showNotification('Comment added successfully');
        } catch (error) {
            this.showNotification('Error adding comment', 'error');
        }
    }

    // Utility methods here...

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.taskDetailManager = new TaskDetailManager();
});
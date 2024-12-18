class TaskDetailManager {
    constructor() {
        console.log('Initializing TaskDetailManager');
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .toast {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    border-radius: 12px;
                    margin-bottom: 10px;
                    min-width: 300px;
                    background: #1E1E2D;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    animation: slideIn 0.5s ease-out forwards;
                    color: #fff;
                }
                .toast.success { border-left: 4px solid #0BB783; }
                .toast.error { border-left: 4px solid #F64E60; }
                .toast-icon {
                    margin-right: 12px;
                    display: flex;
                    align-items: center;
                }
                .toast-message {
                    flex-grow: 1;
                    font-size: 14px;
                }
                .toast-close {
                    cursor: pointer;
                    opacity: 0.7;
                    margin-left: 12px;
                }
                .toast-close:hover {
                    opacity: 1;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        this.initialized = false;
        this.initializeElements();
        if (this.initialized) {
            console.log('Initialization successful, setting up components');
            this.attachEventListeners();
            this.initializeFileUpload();
            this.loadCategories();
            this.loadTaskDetails();
            this.loadComments();
            console.log('All components initialized');
        } else {
            console.error('Initialization failed');
        }
    }

    initializeElements() {
        console.log('Initializing elements');
        try {
            // Form elements
            this.form = document.getElementById('taskDetailForm');
            if (!this.form) {
                console.error('Task form not found');
                return;
            }

            this.editBtn = document.getElementById('editBtn');
            this.saveBtn = document.getElementById('saveBtn');

            this.modal = document.querySelector('[data-modal]');
            this.modalContent = this.modal?.querySelector('.modal-content');
            this.closeButtons = document.querySelectorAll('[data-close-modal]');
            this.deleteButton = document.querySelector('.btn-delete');
            this.confirmButton = document.querySelector('.confirm-delete');
            this.taskId = this.deleteButton.dataset.taskId;
            
            // Form input fields
            this.titleInput = document.getElementById('taskTitle');
            this.descriptionInput = document.getElementById('taskDescription');
            this.startDateInput = document.getElementById('startDate');
            this.startTimeInput = document.getElementById('startTime');
            this.endDateInput = document.getElementById('endDate');
            this.endTimeInput = document.getElementById('endTime');
            
            // Progress elements
            this.progressBar = document.getElementById('taskProgress');
            this.progressValue = document.querySelector('.progress-value');
            this.statusButtons = document.querySelectorAll('.status-btn');
            
            // Comments elements
            this.commentsList = document.getElementById('commentsList');
            this.newCommentInput = document.getElementById('newComment');
            this.addCommentBtn = document.getElementById('addCommentBtn');

            // File upload elements
            this.fileUploadBox = document.getElementById('fileUploadBox');
            this.fileInput = document.getElementById('fileInput');
            this.selectedFileDiv = document.querySelector('.selected-file');

            //Category elements
            this.categorySelect = document.getElementById('taskCategory');
            this.categoryModal = document.getElementById('categoryModal');
            this.categoryNameInput = document.getElementById('categoryName');
            this.createCategoryBtn = document.querySelector('.confirm-create-category');

            // Verify critical elements
            if (!this.editBtn || !this.saveBtn || !this.deleteButton) {
                console.error('Critical buttons not found');
                return;
            }

            this.formInputs = this.form.querySelectorAll('input, textarea, button.priority-btn, button.status-btn');
            this.initialized = true;
            console.log('Elements initialized successfully');
        } catch (error) {
            console.error('Error initializing elements:', error);
        }
    }

    attachEventListeners() {
        if (!this.initialized) {
            console.error('Cannot attach event listeners - not initialized');
            return;
        }

        console.log('Attaching event listeners');
        
        this.editBtn.addEventListener('click', () => this.enableEditing());
        this.saveBtn.addEventListener('click', () => this.saveChanges());
        
        if (this.progressBar) {
            this.progressBar.addEventListener('input', () => {
                const progress = parseInt(this.progressBar.value);

                // Update status based on progress
                if (progress === 100) {
                    const completedBtn = document.querySelector('.status-btn[data-value="completed"]');
                    if (completedBtn) {
                        this.selectButton(completedBtn, '.status-btn');
                    }
                } else if (progress === 0) {
                    const yetToStartBtn = document.querySelector('.status-btn[data-value="yet_to_start"]');
                    if (yetToStartBtn) {
                        this.selectButton(yetToStartBtn, '.status-btn');
                    }
                } else {
                    const inProgressBtn = document.querySelector('.status-btn[data-value="in_progress"]');
                    if (inProgressBtn) {
                        this.selectButton(inProgressBtn, '.status-btn');
                    }
                }

                this.updateProgressValue();
            });
        }
        
        if (this.addCommentBtn) {
            this.addCommentBtn.addEventListener('click', () => this.addComment());
        }

        document.querySelectorAll('.priority-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.disabled) this.selectButton(btn, '.priority-btn');
            });
        });
        
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.disabled) {
                    const newStatus = btn.getAttribute('data-value');
                    this.selectButton(btn, '.status-btn');

                    // Update progress bar based on status
                    if (newStatus === 'completed') {
                        this.progressBar.value = 100;
                        this.updateProgressValue();
                    } else if (newStatus === 'yet_to_start') {
                        this.progressBar.value = 0;
                        this.updateProgressValue();
                    }
                }
            });
        });

        if (this.deleteButton) {
            this.deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showDeleteModal();
            });
        }
    
        this.closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideDeleteModal();
            });
        });
    
        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.deleteTask();
            });
        }
    
        if (this.modalContent) {
            this.modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        if (this.categorySelect) {
            this.categorySelect.addEventListener('change', (e) => {
                if (e.target.value === 'create') {
                    this.showCategoryModal();
                    // Reset select to previous value
                    e.target.value = e.target.dataset.lastValue || '';
                }
            });
        }
        
        if (this.createCategoryBtn) {
            this.createCategoryBtn.addEventListener('click', () => this.createCategory());
        }

        const categoryCloseButtons = this.categoryModal?.querySelectorAll('[data-close-modal]');
        if (categoryCloseButtons) {
            categoryCloseButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.hideCategoryModal();
                });
            });
        }
    }

    initializeFileUpload() {
        if (!this.fileUploadBox || !this.fileInput) {
            console.error('File upload elements not found');
            return;
        }
    
        // Click to upload
        this.fileUploadBox.addEventListener('click', () => {
            if (!this.isEditing) return;
            this.fileInput.click();
        });
    
        // File selection handler
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                this.handleSelectedFile(file);
            }
        });
    }

    handleSelectedFile(file) {
        // Validate file size
        if (file.size > 10 * 1024 * 1024) { // 10MB in bytes
            this.showNotification('File size must be no more than 10MB', 'error');
            this.fileInput.value = '';
            return;
        }
    
        const allowedTypes = ['.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg', '.pptx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showNotification('Invalid file type. Allowed types are: PDF, DOCX, Excel, TXT, PNG, JPG, JPEG, PPTX', 'error');
            this.fileInput.value = '';
            return;
        }

        this.selectedFileDiv.style.display = 'block';
        this.selectedFileDiv.textContent = file.name;
    }
    
    async checkAndViewFiles() {
        const taskId = this.getTaskId();
        try {
            const response = await fetch(`/api/tasks/${taskId}/`);
            const task = await response.json();
            
            if (!task || task.file_count === 0) {
                this.showNotification('No files present!!', 'error');
                return;
            }
            
            window.location.href = `/task/${taskId}/files/view/`;
        } catch (error) {
            console.error('Error checking files:', error);
            this.showNotification('Error checking files', 'error');
        }
    }

    async loadTaskDetails() {
        const taskId = this.getTaskId();
        console.log('Loading details for task ID:', taskId);
        try {
            const response = await fetch(`/api/tasks/${taskId}/`);
            if (!response.ok) throw new Error('Failed to fetch task details');
            
            const task = await response.json();
            console.log('Fetched task details:', task); // Debug log
            
            // Get form elements
            const titleInput = document.getElementById('taskTitle');
            const descriptionInput = document.getElementById('taskDescription');
            const startDateInput = document.getElementById('startDate');
            const startTimeInput = document.getElementById('startTime');
            const endDateInput = document.getElementById('endDate');
            const endTimeInput = document.getElementById('endTime');
            const progressBar = document.getElementById('taskProgress');
            const progressValue = document.querySelector('.progress-value');
    
            // Populate basic fields
            if (titleInput) titleInput.value = task.title || '';
            if (descriptionInput) descriptionInput.value = task.description || '';
            
            // Format and set dates
            if (startDateInput && task.start_date) {
                startDateInput.value = task.start_date.split('T')[0];
            }
            
            if (endDateInput && task.end_date) {
                endDateInput.value = task.end_date.split('T')[0];
            }
            
            // Set times
            if (startTimeInput && task.start_time) {
                startTimeInput.value = task.start_time;
            }
            
            if (endTimeInput && task.end_time) {
                endTimeInput.value = task.end_time;
            }
            
            // Set priority
            const priorityBtn = document.querySelector(`.priority-btn[data-value="${task.priority}"]`);
            if (priorityBtn) {
                this.selectButton(priorityBtn, '.priority-btn');
            }
            
            // Set status
            const statusBtn = document.querySelector(`.status-btn[data-value="${task.status}"]`);
            if (statusBtn) {
                this.selectButton(statusBtn, '.status-btn');
            }
            
            // Set progress
            if (progressBar && progressValue) {
                progressBar.value = task.task_progress || 0;
                progressValue.textContent = `${task.task_progress || 0}%`;
            }

            const categorySelect = document.getElementById('taskCategory');
            if (categorySelect) {
                if (task.category) {
                    categorySelect.value = task.category.id;
                    // Store the last value
                    categorySelect.dataset.lastValue = task.category.id;
                } else {
                    categorySelect.value = '';
                    categorySelect.dataset.lastValue = '';
                }
            }
            // Disable all fields initially
            this.disableEditing();
            
        } catch (error) {
            console.error('Error loading task details:', error);
            this.showNotification('Error loading task details', 'error');
        }
    }

    populateTaskForm(task) {
        this.form.title.value = task.title;
        this.form.description.value = task.description;
        this.form.start_date.value = task.start_date;
        this.form.start_time.value = task.start_time;
        this.form.end_date.value = task.end_date;
        this.form.end_time.value = task.end_time;
        
        this.progressBar.value = task.task_progress;
        this.progressValue.textContent = `${task.task_progress}%`;
        
        this.selectButton(
            document.querySelector(`.priority-btn.${task.priority}`), 
            '.priority-btn'
        );
        
        this.selectButton(
            document.querySelector(`.status-btn.${task.status}`), 
            '.status-btn'
        );
    }

    async loadComments() {
        const taskId = this.getTaskId();
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments/`);
            const comments = await response.json();
            this.renderComments(comments);
        } catch (error) {
            this.handleError(error, 'Error loading comments');
        }
    }

    renderComments(comments) {
        this.commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `).join('');
    }

    async addComment() {
        const commentText = this.newCommentInput.value.trim();
        if (!commentText) return;
        
        const taskId = this.getTaskId();
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ text: commentText })
            });

            if (response.ok) {
                this.newCommentInput.value = '';
                await this.loadComments();
                this.showNotification('Comment added successfully', 'success');
            }
        } catch (error) {
            this.handleError(error, 'Error adding comment');
        }
    }

    enableEditing() {
        this.isEditing = true;
        this.formInputs.forEach(input => input.disabled = false);
        this.editBtn.disabled = true;
        this.saveBtn.disabled = false;
        this.categorySelect.disabled = false;
    }

    async saveChanges() {
        const taskId = this.getTaskId();
        if (!taskId) {
            this.showNotification('Error: Task ID not found', 'error');
            return;
        }
    
        const taskData = this.getFormData();
        console.log('Saving task with data:', taskData);
    
        try {
            // First save the task details
            const response = await fetch(`/api/tasks/${taskId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify(taskData)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response:', errorData); // Debug log
                throw new Error(errorData.error || 'Failed to save task');
            }

            const data = await response.json();
            console.log('Save response:', data);
    
            // If there's a file selected, upload it
            if (this.fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', this.fileInput.files[0]);
    
                const fileResponse = await fetch(`/api/tasks/${taskId}/files/upload/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': this.getCsrfToken()
                    },
                    body: formData
                });
    
                if (!fileResponse.ok) {
                    throw new Error('File upload failed');
                }
            }
    
            // Clear file input and selected file display
            this.fileInput.value = '';
            this.selectedFileDiv.style.display = 'none';
            this.selectedFileDiv.textContent = '';
    
            this.disableEditing();
            await this.loadTaskDetails();
            this.showNotification(`Task "${taskData.title}" has been updated`, 'success');
        } catch (error) {
            console.error('Error saving task:', error);
            this.showNotification(error.message || 'Error saving task', 'error');
        }
    }

    // Utility Methods
    getTaskId() {
        // Get the path from URL and split it
        const path = window.location.pathname;
        // Assuming URL format is '/task/{id}/'
        const matches = path.match(/\/task\/(\d+)/);
        if (matches && matches[1]) {
            return matches[1];
        }
        console.error('Could not extract task ID from path:', path);
        return null;
    }

    getFormData() {
        const categorySelect = document.getElementById('taskCategory');
        const categoryId = categorySelect ? categorySelect.value : null;
    
        console.log('Category ID being sent:', categoryId);
        
        const formData = {
            title: document.getElementById('taskTitle')?.value,
            description: document.getElementById('taskDescription')?.value,
            start_date: document.getElementById('startDate')?.value,
            start_time: document.getElementById('startTime')?.value,
            end_date: document.getElementById('endDate')?.value,
            end_time: document.getElementById('endTime')?.value,
            priority: document.querySelector('.priority-btn.selected')?.getAttribute('data-value'),
            status: document.querySelector('.status-btn.selected')?.getAttribute('data-value'),
            task_progress: parseInt(document.getElementById('taskProgress')?.value || 0),
            category_id: categoryId && categoryId !== '' ? parseInt(categoryId) : null
        };
        
        console.log('Form data being sent:', formData);
        return formData;
    }

    showDeleteModal() {
        if (this.modal) {
            this.modal.classList.add('show');
        }
    }
    
    hideDeleteModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
        }
    }
    async deleteTask() {
        try {
            const taskTitle = document.getElementById('taskTitle')?.value || 'Task';
            
            // Changed the endpoint to match your existing view
            const response = await fetch(`/api/tasks/${this.taskId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
    
            if (response.ok) {
                this.hideDeleteModal();
                this.showNotification(`Task "${taskTitle}" has been deleted`, 'success');
                setTimeout(() => {
                    window.location.href = '/tasks/';
                }, 1000);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete task');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Failed to delete task', 'error');
            this.hideDeleteModal();
        }
    }

    selectButton(selectedBtn, selector) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.classList.remove('selected');
        });
        selectedBtn?.classList.add('selected');
    }

    updateProgressValue() {
        this.progressValue.textContent = `${this.progressBar.value}%`;
    }

    disableEditing() {
        this.isEditing = false;
        this.formInputs.forEach(input => input.disabled = true);
        this.editBtn.disabled = false;
        this.saveBtn.disabled = true;
        this.fileInput.value = '';
        this.selectedFileDiv.style.display = 'none';
        this.selectedFileDiv.textContent = '';
        this.categorySelect.disabled = true;
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories/');
            if (!response.ok) throw new Error('Failed to load categories');
            
            const categories = await response.json();
            this.populateCategoryDropdown(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showNotification('Error loading categories', 'error');
        }
    }
    
    populateCategoryDropdown(categories) {
        if (!this.categorySelect) return;
        
        // Save current selection if any
        const currentValue = this.categorySelect.value;
        
        // Clear existing options except first and last
        while (this.categorySelect.options.length > 2) {
            this.categorySelect.remove(1);
        }
        
        // Add new options
        categories.forEach(category => {
            const option = new Option(category.name, category.id);
            this.categorySelect.add(option, this.categorySelect.options[1]);
        });
        
        // Restore selection if it exists
        if (currentValue && currentValue !== 'create') {
            this.categorySelect.value = currentValue;
        }
    }
    
    showCategoryModal() {
        if (this.categoryModal) {
            this.categoryModal.classList.add('show');
            this.categoryNameInput.value = '';
            this.categoryNameInput.focus();
        }
    }
    
    hideCategoryModal() {
        if (this.categoryModal) {
            this.categoryModal.classList.remove('show');
            this.categoryNameInput.value = '';
        }
    }
    
    async createCategory() {
        const categoryName = this.categoryNameInput.value.trim();
        if (!categoryName) {
            this.showNotification('Please enter a category name', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/categories/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ name: categoryName })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create category');
            }
            
            const newCategory = await response.json();
            await this.loadCategories();
            this.categorySelect.value = newCategory.id;
            this.hideCategoryModal();
            this.showNotification('Category created successfully', 'success');
        } catch (error) {
            console.error('Error creating category:', error);
            this.showNotification(error.message || 'Error creating category', 'error');
        }
    }

    handleError(error, message = 'An error occurred') {
        console.error(`${message}:`, error);
        this.showNotification(message, 'error');
    }

    async showNotification(message, type = 'success') {
        // Create toast notification
        const notificationContainer = document.querySelector('.toast-container') || (() => {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        })();
    
        const notification = document.createElement('div');
        notification.className = `toast ${type}`;
        
        const iconSVG = type === 'success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        
        notification.innerHTML = `
            <div class="toast-icon">${iconSVG}</div>
            <div class="toast-message">${message}</div>
            <div class="toast-close">×</div>
        `;
        
        notificationContainer.appendChild(notification);
    
        // Add click handler for close button
        const closeBtn = notification.querySelector('.toast-close');
        closeBtn.onclick = () => {
            notification.style.animation = 'slideOut 0.5s ease-out forwards';
            setTimeout(() => notification.remove(), 500);
        };
    
        // Auto remove toast after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.5s ease-out forwards';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 500);
            }
        }, 3000);
    
        // If it's a success notification, add it to the notification panel
        if (type === 'success') {
            // Get the task title for context
            const taskTitle = document.getElementById('taskTitle')?.value || 'task';
            
            // Create different notification messages based on the action
            let notificationMessage;
            if (message.includes('created')) {
                notificationMessage = `Task "${taskTitle}" was created successfully`;
            } else if (message.includes('updated')) {
                notificationMessage = `Task "${taskTitle}" was updated successfully`;
            } else if (message.includes('deleted')) {
                notificationMessage = `Task "${taskTitle}" was deleted successfully`;
            } else if (message.includes('Comment')) {
                notificationMessage = `New comment added to task "${taskTitle}"`;
            } else {
                notificationMessage = message; // Use original message if no specific case matches
            }
    
            // Add to notification panel
            if (window.notificationManager) {
                await window.notificationManager.addNotification(notificationMessage, this.getTaskId());
            }
        }
    }

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }
}

// Initialize TaskDetailManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskDetailManager = new TaskDetailManager();
});
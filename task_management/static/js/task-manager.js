class TaskManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.fetchTasks();
    }

    initializeElements() {
        // Initialize task section elements
        this.sections = [
            {
                id: 'in-progress-tasks',
                wrapper: document.getElementById('in-progress-tasks'),
                leftArrow: document.querySelector('.in-progress-arrow.left-arrow'),
                rightArrow: document.querySelector('.in-progress-arrow.right-arrow'),
                countElement: document.getElementById('inProgressCount')
            },
            {
                id: 'completed-tasks',
                wrapper: document.getElementById('completed-tasks'),
                leftArrow: document.querySelector('.completed-arrow.left-arrow'),
                rightArrow: document.querySelector('.completed-arrow.right-arrow'),
                countElement: document.getElementById('completedCount')
            },
            {
                id: 'overdue-tasks',
                wrapper: document.getElementById('overdue-tasks'),
                leftArrow: document.querySelector('.overdue-arrow.left-arrow'),
                rightArrow: document.querySelector('.overdue-arrow.right-arrow'),
                countElement: document.getElementById('overdueCount')
            }
        ];
    
        // Initialize task groups
        this.taskGroups = {
            inProgress: [],
            completed: [],
            overdue: []
        };
    
        // Add delete modal HTML
        document.body.insertAdjacentHTML('beforeend', `
            <div id="deleteModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Delete Task</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
                    </div>
                    <div class="modal-footer">
                        <button class="cancel-delete">Cancel</button>
                        <button class="confirm-delete">Delete</button>
                    </div>
                </div>
            </div>
        `);
    
        // Store modal elements
        this.deleteModal = document.getElementById('deleteModal');
        this.closeModalBtn = this.deleteModal.querySelector('.close-modal');
        this.cancelDeleteBtn = this.deleteModal.querySelector('.cancel-delete');
        this.confirmDeleteBtn = this.deleteModal.querySelector('.confirm-delete');
        
        // Store current task ID for deletion
        this.taskToDelete = null;
    
        // Add modal event listeners
        this.closeModalBtn.addEventListener('click', () => this.closeDeleteModal());
        this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
    
        // Add emotion bar only to in-progress section
        const inProgressSection = document.querySelector('#in-progress-tasks').parentElement;
        const emotionBarHTML = `
            <div class="emotion-bar-container">
                <div class="emotion-bar">
                    <div class="emotion-bar-fill">
                        <div class="emotion-emoji">😢</div>
                    </div>
                </div>
                <div class="emotion-text">Task Completion Progress</div>
            </div>
        `;
    
        inProgressSection.insertAdjacentHTML('beforeend', emotionBarHTML);
    }

    attachEventListeners() {
        // Attach carousel navigation for each section
        this.sections.forEach(section => {
            if (section.leftArrow) {
                section.leftArrow.addEventListener('click', () => {
                    this.scrollSection(section.wrapper, -300);
                });
            }
            if (section.rightArrow) {
                section.rightArrow.addEventListener('click', () => {
                    this.scrollSection(section.wrapper, 300);
                });
            }

            // Add scroll event listener for arrow visibility
            if (section.wrapper) {
                section.wrapper.addEventListener('scroll', () => {
                    this.updateArrowVisibility(section);
                });
            }
        });

        // Window resize listener
        window.addEventListener('resize', () => {
            this.sections.forEach(section => {
                this.updateArrowVisibility(section);
            });
        });
    }

    showDeleteModal(taskId) {
        this.taskToDelete = taskId;
        this.deleteModal.classList.add('show');
    }
    
    closeDeleteModal() {
        this.deleteModal.classList.remove('show');
        this.taskToDelete = null;
    }
    
    async confirmDelete() {
        if (!this.taskToDelete) return;
        
        try {
            const response = await fetch(`/api/task/${this.taskToDelete}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            if (data.status === 'success') {
                this.closeDeleteModal();
                await this.fetchTasks();
                this.showNotification('Task deleted successfully');
            } else {
                throw new Error(data.message || 'Failed to delete task');
            }
        } catch (error) {
            this.handleError(error, 'Error deleting task');
        }
    }

    updateEmotionBar() {
        const inProgressTasks = this.taskGroups.inProgress;
        if (inProgressTasks.length === 0) return;
    
        // Calculate average progress
        const totalProgress = inProgressTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
        const averageProgress = totalProgress / inProgressTasks.length;
    
        // Select emoji based on progress
        let emoji = '😢'; // 0-20%
        if (averageProgress > 80) emoji = '🎉';
        else if (averageProgress > 60) emoji = '😊';
        else if (averageProgress > 40) emoji = '😐';
        else if (averageProgress > 20) emoji = '😕';
    
        // Update emotion bar
        const emotionBar = document.querySelector('.emotion-bar-fill');
        const emojiElement = document.querySelector('.emotion-emoji');
        
        if (emotionBar && emojiElement) {
            emotionBar.style.width = `${averageProgress}%`;
            emojiElement.textContent = emoji;
        }
    }

    async fetchTasks() {
        try {
            const response = await fetch('/api/tasks/');
            console.log('API Response Status:', response.status); 
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Fetched Tasks:', data); 
            
            // Clear existing tasks and counters
            this.clearAllTasks();
            
            // Sort tasks into groups
            this.sortTasks(data);
            console.log('Sorted Task Groups:', this.taskGroups); 
            
            // Update task counts
            this.updateTaskCounts();
            
            // Populate task sections
            this.populateTaskSections();
            
            // Update carousel arrows
            this.updateAllArrowsVisibility();
        } catch (error) {
            console.error('Error in fetchTasks:', error);
            this.handleError(error, 'Error fetching tasks');
        }
    }

    clearAllTasks() {
        this.sections.forEach(section => {
            if (section.wrapper) {
                section.wrapper.innerHTML = '';
            }
        });
        this.taskGroups = {
            inProgress: [],
            completed: [],
            overdue: []
        };
    }

    sortTasksByDueDate(tasks) {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.end_date);
            const dateB = new Date(b.end_date);
            return dateA - dateB;
        });
    }

    sortTasks(tasks) {
        tasks.forEach(task => {
            if (task.status === 'completed') {
                this.taskGroups.completed.push(task);
            } else if (task.is_overdue) {
                this.taskGroups.overdue.push(task);
            } else {
                this.taskGroups.inProgress.push(task);
            }
        });
    
        // Sort each group by due date
        this.taskGroups.inProgress = this.sortTasksByDueDate(this.taskGroups.inProgress);
        this.taskGroups.completed = this.sortTasksByDueDate(this.taskGroups.completed);
        this.taskGroups.overdue = this.sortTasksByDueDate(this.taskGroups.overdue);
    }

    updateTaskCounts() {
        const countText = (count) => `${count} task${count !== 1 ? 's' : ''}`;
        
        this.sections.forEach(section => {
            if (section.countElement) {
                let count = 0;
                if (section.id === 'in-progress-tasks') {
                    count = this.taskGroups.inProgress.length;
                } else if (section.id === 'completed-tasks') {
                    count = this.taskGroups.completed.length;
                } else if (section.id === 'overdue-tasks') {
                    count = this.taskGroups.overdue.length;
                }
                section.countElement.textContent = countText(count);
            }
        });
    }

    populateTaskSections() {
        // Clear existing tasks first
        this.sections.forEach(section => {
            if (section.wrapper) {
                section.wrapper.innerHTML = '';
            }
        });
    
        // In Progress tasks
        if (this.taskGroups.inProgress.length > 0) {
            this.taskGroups.inProgress.forEach(task => {
                const taskElement = this.createTaskCard(task);
                this.sections[0].wrapper?.appendChild(taskElement);
            });
        }
    
        // Completed tasks
        if (this.taskGroups.completed.length > 0) {
            this.taskGroups.completed.forEach(task => {
                const taskElement = this.createTaskCard(task);
                this.sections[1].wrapper?.appendChild(taskElement);
            });
        }
    
        // Overdue tasks
        if (this.taskGroups.overdue.length > 0) {
            this.taskGroups.overdue.forEach(task => {
                const taskElement = this.createTaskCard(task);
                this.sections[2].wrapper?.appendChild(taskElement);
            });
        }
    
        // Update emotion bar
        this.updateEmotionBar();
        
        // Update visibility of scroll arrows
        this.updateAllArrowsVisibility();
    }

    createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.taskId = task.id;
    
        const categoryHTML = task.category ? this.generateCategoryHTML(task.category) : '';
    
        // Get user data from the profile dropdown in header
        const profileDropdown = document.getElementById('profileDropdown');
        const headerAvatar = profileDropdown.querySelector('.avatar-img');
        const avatarSrc = headerAvatar.src; // This will get the already processed image URL
    
        taskCard.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <div class="menu-container">
                    <button class="menu-dots">⋮</button>
                    <div class="menu-dropdown">
                        <button class="menu-item delete-option">
                            <span>🗑️</span>Delete
                        </button>
                    </div>
                </div>
            </div>
            <div class="task-footer">
                <div class="task-progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-text">${task.progress || 0}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.progress || 0}%"></div>
                    </div>
                </div>
                <div class="task-meta">
                    ${this.formatTaskDate(task.end_date, task.status)}
                    <div class="task-members">
                        <img src="${avatarSrc}"
                            alt="User" 
                            class="member-avatar"
                        />
                    </div>
                </div>
            </div>
        `;
    
        this.attachTaskCardListeners(taskCard, task.id);
        return taskCard;
    }

    attachTaskCardListeners(taskCard, taskId) {
        const menuButton = taskCard.querySelector('.menu-dots');
        const menuDropdown = taskCard.querySelector('.menu-dropdown');
        const deleteButton = taskCard.querySelector('.delete-option');
    
        menuButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown?.classList.toggle('show');
        });
    
        deleteButton?.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown?.classList.remove('show');
            this.showDeleteModal(taskId);
        });
    
        taskCard.addEventListener('click', () => {
            window.location.href = `/task/${taskId}/`;
        });
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/task/${taskId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': this.getCsrfToken()
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.status === 'success') {
                await this.fetchTasks();
                this.showNotification('Task deleted successfully');
            } else {
                throw new Error(data.message || 'Failed to delete task');
            }
        } catch (error) {
            this.handleError(error, 'Error deleting task');
        }
    }

    formatTaskDate(endDate, status) {
        if (!endDate) return '';
        
        // For completed tasks
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
    
        const end = new Date(endDate);
        const now = new Date();
        const diffInHours = Math.ceil((end - now) / (1000 * 60 * 60));
        const diffInDays = Math.ceil(diffInHours / 24);
    
        let dateContent;
        let className;
    
        // For overdue tasks
        if (diffInDays < 0) {
            dateContent = `Overdue by ${Math.abs(diffInDays)} days`;
            className = 'overdue';
        }
        // For tasks due within 24 hours
        else if (diffInHours <= 24) {
            dateContent = `${diffInHours} hours left`;
            className = 'urgent';
        }
        // For tasks due within 7 days
        else if (diffInDays <= 7) {
            dateContent = `${diffInDays} days left`;
            className = 'upcoming';
        }
        // For tasks due after 7 days
        else {
            dateContent = `Due ${end.toLocaleString('default', { month: 'short' })} ${end.getDate()}`;
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

    generateCategoryHTML(category) {
        const colors = this.generatePastelColor(category.name);
        return `
            <div class="category-tag" style="background-color: ${colors.background}; color: ${colors.text}">
                ${category.name}
            </div>
        `;
    }

    generatePastelColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        const s = 30 + (hash % 30);
        const l = 85 + (hash % 10);
        return {
            background: `hsl(${h}, ${s}%, ${l}%)`,
            text: `hsl(${h}, ${s}%, 30%)`
        };
    }

    scrollSection(wrapper, amount) {
        wrapper?.scrollBy({
            left: amount,
            behavior: 'smooth'
        });
    }

    updateArrowVisibility(section) {
        if (!section.wrapper || !section.leftArrow || !section.rightArrow) return;

        const isScrollable = section.wrapper.scrollWidth > section.wrapper.clientWidth;
        const isAtStart = section.wrapper.scrollLeft <= 0;
        const isAtEnd = section.wrapper.scrollLeft >= section.wrapper.scrollWidth - section.wrapper.clientWidth;

        section.leftArrow.style.display = isScrollable && !isAtStart ? 'flex' : 'none';
        section.rightArrow.style.display = isScrollable && !isAtEnd ? 'flex' : 'none';
    }

    updateAllArrowsVisibility() {
        this.sections.forEach(section => {
            this.updateArrowVisibility(section);
        });
    }

    handleError(error, message = 'An error occurred') {
        console.error(`${message}:`, error);
        this.showNotification(message, 'error');
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

    getCsrfToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }
}

// Initialize TaskManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
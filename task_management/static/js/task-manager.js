class TaskManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeFilters();
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
        const emotionBarContainer = document.querySelector('.emotion-bar-container');

        if (!inProgressTasks || inProgressTasks.length === 0) {
            if (emotionBarContainer) {
                emotionBarContainer.style.display = 'none';
            }
            return;
        }

        const inProgressSection = document.querySelector('#in-progress-tasks').parentElement;
        const visibleTasks = Array.from(inProgressSection.querySelectorAll('.task-card'))
        .filter(task => task.style.display !== 'none');

        if (visibleTasks.length === 0) {
            if (emotionBarContainer) {
                emotionBarContainer.style.display = 'none';
            }
            return;
        }

        // Show the container if there are tasks
        if (emotionBarContainer) {
            emotionBarContainer.style.display = 'block';
        }

        // Calculate average progress
        const totalProgress = inProgressTasks.reduce((sum, task) => sum + (task.task_progress), 0);
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
            const userType = document.querySelector('.nav-item[data-user-type]')?.dataset.userType;
            const response = await fetch('/api/tasks/');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const tasks = await response.json();
            
            // Clear existing tasks and counters
            this.clearAllTasks();
            
            if (userType === 'team') {
                // For team users, filter tasks by team_name
                tasks.forEach(task => {
                    if (task.status === 'completed') {
                        this.taskGroups.completed.push(task);
                    } else if (task.is_overdue) {
                        this.taskGroups.overdue.push(task);
                    } else {
                        this.taskGroups.inProgress.push(task);
                    }
                });
            } else {
                // For individual users, tasks are already filtered by user
                this.sortTasks(tasks);
            }
            
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
    
        // Sort function that considers both date and time
        const sortByDateTime = (a, b) => {
            const dateA = new Date(`${a.end_date}T${a.end_time || '00:00'}`);
            const dateB = new Date(`${b.end_date}T${b.end_time || '00:00'}`);
            return dateA - dateB;
        };
    
        // Sort each group
        this.taskGroups.inProgress = this.taskGroups.inProgress.sort(sortByDateTime);
        this.taskGroups.completed = this.taskGroups.completed.sort(sortByDateTime);
        this.taskGroups.overdue = this.taskGroups.overdue.sort(sortByDateTime);
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
        taskCard.dataset.status = task.status;
        taskCard.dataset.categoryId = task.category ? task.category.id : '';
    
        // Add a unique identifier to the JS-generated template
        const template = `
            <div class="task-header" data-source="js-template">
                <div class="title-section">
                    <h4 class="task-title">${task.title}</h4>
                    <span class="priority-label">${task.priority} •</span>
                    <span class="category-label">${task.category ? task.category.name : 'No Category'}</span>
                </div>
            </div>
            <div class="task-footer">
                <div class="task-progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-text">${task.task_progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.task_progress}%"></div>
                    </div>
                </div>
                <div class="task-meta">
                    ${this.formatTaskDate(task.end_date, task.end_time, task.status)}
                    <div class="task-members">
                        <img src="${this.getCurrentUserAvatar()}" alt="User" class="member-avatar" />
                    </div>
                </div>
            </div>
        `;
    
        taskCard.innerHTML = template;

        taskCard.addEventListener('click', () => {
            window.location.href = `/task/${task.id}/`;
        });

        // Log computed styles
        const titleSection = taskCard.querySelector('.title-section');
        if (titleSection) {
            const computedStyle = window.getComputedStyle(titleSection);
        }
    
        return taskCard;
    }

    getCurrentUserAvatar() {
        const profileDropdown = document.getElementById('profileDropdown');
        const headerAvatar = profileDropdown?.querySelector('.avatar-img');
        return headerAvatar ? headerAvatar.src : '';
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
        
        // Parse date and time separately
        const [year, month, day] = endDate.split('-');
        const [hours, minutes] = endTime.split(':');

        // Create end date with correct time
        const end = new Date(year, month - 1, day);
        end.setHours(parseInt(hours), parseInt(minutes), 0);

        const now = new Date();

        // Calculate difference in milliseconds
        const diffMs = end - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let dateContent;
        let className;
    
        if (diffDays < 0 || diffHours < 0) {
            dateContent = `Overdue by ${Math.abs(diffDays+1)} days`;
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

    initializeFilters() {
      this.statusFilter = document.getElementById('statusFilter');
      this.categoryFilter = document.getElementById('categoryFilter');

      this.statusFilter.addEventListener('change', () => this.applyFilters());
      this.categoryFilter.addEventListener('change', () => this.applyFilters());

      this.populateCategoryFilter();
    }

    async populateCategoryFilter() {
      try {
        const response = await fetch('/api/categories/');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();

        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          this.categoryFilter.appendChild(option);
        });
      } catch (error) {
        this.handleError(error, 'Error loading categories');
      }
    }

    applyFilters() {
      const statusFilter = this.statusFilter.value;
      const categoryFilter = this.categoryFilter.value;
      let visibleInProgressTasks = 0;

      this.sections.forEach(section => {
        if (section.wrapper) {
          const tasks = section.wrapper.querySelectorAll('.task-card');
          tasks.forEach(task => {
            const taskStatus = task.dataset.status;
            const taskCategory = task.dataset.categoryId;
            const statusMatch = !statusFilter || taskStatus === statusFilter;
            const categoryMatch = !categoryFilter || taskCategory === categoryFilter;
            task.style.display = statusMatch && categoryMatch ? 'block' : 'none';
            if (section.id === 'in-progress-tasks' && statusMatch && categoryMatch) {
                visibleInProgressTasks++;
            }
          });
        }
      });

      const emotionBarContainer = document.querySelector('.emotion-bar-container');
      if (emotionBarContainer) {
          emotionBarContainer.style.display = visibleInProgressTasks > 0 ? 'block' : 'none';
      }

      if (visibleInProgressTasks > 0) {
          this.updateEmotionBar(true);
      }

      this.updateTaskCounts();
      this.updateAllArrowsVisibility();
    }
}

// Initialize TaskManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});


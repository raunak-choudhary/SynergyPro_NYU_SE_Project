class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';

        // Make sure DOM is loaded before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeCalendar();
                this.initializeHeaderComponents();
                this.initializeTaskModal();
            });
        } else {
            this.initializeCalendar();
            this.initializeHeaderComponents();
            this.initializeTaskModal();
        }
    }

    initializeCalendar() {
        this.updateCalendarHeader();
        this.renderMonthView();
        this.attachCalendarEventListeners();
    }

    changeView(newView) {
        this.currentView = newView;
        this.updateCalendarHeader();
        this.updateCalendarView();
    }

    // Calendar-specific methods from your original calendar.js
    updateCalendarHeader() {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthDisplay = document.getElementById('currentMonth');
        
        if (!monthDisplay) return;

        if (this.currentView === 'month') {
            // Month view header
            monthDisplay.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        } else {
            // Week view header
            const weekStart = new Date(this.currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Get Sunday
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // Get Saturday
            
            // Format dates
            const formatDate = (date) => {
                const month = monthNames[date.getMonth()].substring(0, 3); // Abbreviated month
                return `${month} ${date.getDate()}`;
            };
            
            // If week spans two months
            if (weekStart.getMonth() !== weekEnd.getMonth()) {
                monthDisplay.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}, ${weekEnd.getFullYear()}`;
            } 
            // If week spans two years
            else if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
                monthDisplay.textContent = `${formatDate(weekStart)}, ${weekStart.getFullYear()} - ${formatDate(weekEnd)}, ${weekEnd.getFullYear()}`;
            }
            // Same month
            else {
                monthDisplay.textContent = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
            }
        }
    }

    updateCalendarView() {
        const calendarGrid = document.getElementById('calendarGrid');
        const daysHeader = document.querySelector('.calendar-days-header');
        if (!calendarGrid) return;
    
        if (this.currentView === 'month') {
            // Show days header and render month view
            if (daysHeader) daysHeader.style.display = 'grid';
            calendarGrid.classList.remove('week-view');
            this.renderMonthView();
        } else {
            // Hide days header and render week view
            if (daysHeader) daysHeader.style.display = 'none';
            calendarGrid.classList.add('week-view');
            this.renderWeekView();
        }
    }

    validateDateTime(dateString, timeString) {
        if (!dateString || !timeString) return false;

        const dateTime = new Date(`${dateString}T${timeString}`);
        return dateTime instanceof Date && !isNaN(dateTime);
    }

    initializeTaskModal() {
        const modal = document.getElementById('taskModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const taskForm = document.getElementById('taskForm');

        // Close modal handlers
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                taskForm.reset();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                taskForm.reset();
            });
        }

        // Close on outside click
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                taskForm.reset();
            }
        });

        function isValidDate(dateString) {
            return !isNaN(new Date(dateString).getTime());
        };

        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form values
            const title = document.getElementById('taskTitle').value;
            const startDate = document.getElementById('taskStartDate').value;
            const startTime = document.getElementById('taskStartTime').value;
            const endDate = document.getElementById('taskEndDate').value;
            const endTime = document.getElementById('taskEndTime').value;

            // Create timezone-aware datetime strings
            const startDateTime = new Date(`${startDate}T${startTime}`);
            const endDateTime = new Date(`${endDate}T${endTime}`);

            // Add timezone offset to make them timezone-aware
            const startDateTimeString = startDateTime.toISOString();
            const endDateTimeString = endDateTime.toISOString();

            const formData = new FormData();
            formData.append('title', title);
            formData.append('start_date', startDateTimeString);
            formData.append('end_date', endDateTimeString);
            formData.append('description', document.getElementById('taskDescription').value || '');
            formData.append('status', 'yet_to_start');

            try {
                const response = await fetch('/api/tasks/create/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    alert('Task created successfully!');
                    modal.style.display = 'none';
                    taskForm.reset();
                    this.renderMonthView();
                } else {
                    console.log(data);
                    alert('Error creating task: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while creating the task.');
            }
        });
    }

    openTaskModal(dateTime) {
        const modal = document.getElementById('taskModal');
        const startDateInput = document.getElementById('taskStartDate');
        const startTimeInput = document.getElementById('taskStartTime');
        const endDateInput = document.getElementById('taskEndDate');
        const endTimeInput = document.getElementById('taskEndTime');

        // Ensure dateTime is a valid Date object
        const date = dateTime instanceof Date ? dateTime : new Date(dateTime);

        if (!(date instanceof Date && !isNaN(date))) {
            console.error('Invalid date format');
            return;
        }

        // Format date and time
        const formattedDate = this.formatDate(date);
        const formattedTime = date.getHours().toString().padStart(2, '0') + ':00';

        // Set default values
        startDateInput.value = formattedDate;
        startTimeInput.value = formattedTime;

        // Set end date and time (default to 1 hour later)
        const endDate = new Date(date);
        endDate.setHours(date.getHours() + 1);
        endDateInput.value = this.formatDate(endDate);
        endTimeInput.value = endDate.getHours().toString().padStart(2, '0') + ':00';

        modal.style.display = 'block';
    }

    formatDate(date) {
        try {
            if (!(date instanceof Date) || isNaN(date)) {
                throw new Error('Invalid date');
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    }

    renderMonthView() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Get first and last date of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get the first day of the week (0 = Sunday)
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Get number of days from previous month to show
        const prevMonthLastDate = new Date(year, month, 0).getDate();

        // Previous month's days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDate - i;
            const dayElement = this.createDayElement(day, 'other-month');
            calendarGrid.appendChild(dayElement);
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(day, this.isToday(day) ? 'today' : '');
            calendarGrid.appendChild(dayElement);
        }

        // Calculate remaining cells to fill
        const totalCells = 42; // 6 rows × 7 days
        const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);

        // Next month's days
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, 'other-month');
            calendarGrid.appendChild(dayElement);
        }

        this.attachCalendarCellListeners();

    }

    attachCalendarCellListeners() {
        const calendarCells = document.querySelectorAll('.calendar-cell');
        calendarCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                const date = e.currentTarget.dataset.date;
                this.openTaskModal(date);
            });
        });
    }

    openTaskModal(dateTime) {
        const modal = document.getElementById('taskModal');
        const startDateInput = document.getElementById('taskStartDate');
        const startTimeInput = document.getElementById('taskStartTime');

        // Ensure dateTime is a Date object
        const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

        // Format date and time
        const formattedDate = this.formatDate(date);
        const formattedTime = date.getHours().toString().padStart(2, '0') + ':00';

        // Set values
        if (startDateInput) {
            startDateInput.value = formattedDate;
        }
        if (startTimeInput) {
            startTimeInput.value = formattedTime;
        }

        // Set minimum date for end date input
        const endDateInput = document.getElementById('taskEndDate');
        if (endDateInput) {
            endDateInput.min = formattedDate;
        }

        // Update modal title and show
        const modalTitle = modal.querySelector('h2');
        if (modalTitle) {
            modalTitle.textContent = 'Create Task';
        }

        modal.style.display = 'block';
    }

    formatDate(date) {
        // Add type check to prevent errors
        if (!(date instanceof Date)) {
            return '';
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    attachCalendarCellListeners() {
        const calendarCells = document.querySelectorAll('.calendar-cell');
        calendarCells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                const dateStr = e.currentTarget.dataset.date;
                const date = new Date(dateStr);
                this.openTaskModal(date);
            });
        });
    }

    renderWeekView() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        calendarGrid.style.height = 'calc(100vh - 300px)';
        
        // Create main container
        const weekContainer = document.createElement('div');
        weekContainer.className = 'week-grid-container';
        
        // Time column
        const timeColumn = this.createTimeColumn();
        weekContainer.appendChild(timeColumn);
        
        // Create day columns
        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            weekContainer.appendChild(this.createDayColumn(currentDate));
        }
        
        calendarGrid.appendChild(weekContainer);
    }

    createTimeColumn() {
        const timeColumn = document.createElement('div');
        timeColumn.className = 'time-column';
        
        // Empty header cell
        const emptyHeader = document.createElement('div');
        emptyHeader.className = 'week-day-header empty';
        timeColumn.appendChild(emptyHeader);
        
        // Time slots
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
            timeColumn.appendChild(timeSlot);
        }
        
        return timeColumn;
    }

    createDayColumn(date) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const isToday = this.isCurrentDay(date);

        // Merge header content into the main header
        const header = document.createElement('div');
        header.className = `week-day-header ${isToday ? 'today' : ''}`;
        header.innerHTML = `
            <div class="day-header-content">
                <span class="weekday">${days[date.getDay()]}</span>
                <span class="date">${date.getDate()}</span>
            </div>
        `;
        dayColumn.appendChild(header);

        // Hour slots with time selection
        for (let hour = 0; hour < 24; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            if (isToday && new Date().getHours() === hour) {
                hourSlot.classList.add('current-hour');
            }

            hourSlot.addEventListener('click', () => {
                const selectedDateTime = new Date(date);
                selectedDateTime.setHours(hour);
                this.openTaskModal(selectedDateTime);
            });

            dayColumn.appendChild(hourSlot);
        }

        return dayColumn;
    }

    isCurrentDay(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    createDayElement(day, additionalClass = '') {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-cell ${additionalClass}`;
        dayElement.dataset.date = this.formatDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day));
        
        const dateSpan = document.createElement('span');
        dateSpan.className = 'date';
        dateSpan.textContent = day;
        
        const tasksDiv = document.createElement('div');
        tasksDiv.className = 'tasks';

        dayElement.appendChild(dateSpan);
        dayElement.appendChild(tasksDiv);

        return dayElement;
    }

    isToday(day) {
        const today = new Date();
        return day === today.getDate() && 
                this.currentDate.getMonth() === today.getMonth() && 
                this.currentDate.getFullYear() === today.getFullYear();
    }

    navigateCalendar(direction) {
        if (this.currentView === 'month') {
            this.navigateMonth(direction);
        } else {
            this.navigateWeek(direction);
        }
    }

    navigateMonth(direction) {
        const newDate = new Date(this.currentDate);
        
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        
        this.currentDate = newDate;
        
        requestAnimationFrame(() => {
            this.updateCalendarHeader();
            this.renderMonthView();
        });
    }

    navigateWeek(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        this.currentDate = newDate;
        this.updateCalendarHeader();
        this.renderWeekView();
    }

    attachCalendarEventListeners() {
        const prevButton = document.querySelector('.nav-btn.prev-month');
        const nextButton = document.querySelector('.nav-btn.next-month');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                if (this.currentView === 'month') {
                    console.log('Previous month clicked');
                    this.navigateMonth('prev');
                } else {
                    console.log('Previous week clicked');
                    this.navigateWeek('prev');
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                if (this.currentView === 'month') {
                    console.log('Next month clicked');
                    this.navigateMonth('next');
                } else {
                    console.log('Next week clicked');
                    this.navigateWeek('next');
                }
            });
        }
    }

    // Header Component methods
    initializeHeaderComponents() {
        // Profile Dropdown initialization
        this.profileDropdown = document.getElementById('profileDropdown');
        this.dropdownMenu = this.profileDropdown?.querySelector('.profile-dropdown-menu');
    
        if (this.profileDropdown) {
            this.profileDropdown.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleProfileMenu();
            });
    
            // Profile link handling
            const profileLink = this.dropdownMenu?.querySelector('a[href*="profile"]');
            if (profileLink) {
                profileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const profileUrl = profileLink.getAttribute('href');
                    if (profileUrl) {
                        window.location.href = profileUrl;
                    }
                });
            }
        }
    
        // View Dropdown initialization
        const viewDropdown = document.getElementById('viewDropdown');
        const viewDropdownMenu = viewDropdown?.querySelector('.profile-dropdown-menu');
        const currentView = viewDropdown?.querySelector('.current-view');
    
        if (viewDropdown && viewDropdownMenu) {
            viewDropdown.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Close profile dropdown if open
                if (this.dropdownMenu?.classList.contains('show')) {
                    this.dropdownMenu.classList.remove('show');
                }
                viewDropdown.classList.toggle('show');
                viewDropdownMenu.classList.toggle('show');
            });
    
            // View options handling
            const viewOptions = viewDropdownMenu.querySelectorAll('.dropdown-item');
            viewOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    viewOptions.forEach(opt => opt.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    if (currentView) {
                        currentView.querySelector('.view-text').textContent = e.target.textContent;
                    }
                    
                    this.changeView(e.target.textContent.toLowerCase());
                    
                    viewDropdown.classList.remove('show');
                    viewDropdownMenu.classList.remove('show');
                });
            });
        }
    
        // Global click handler for dropdowns
        document.addEventListener('click', (e) => {
            // Close profile dropdown
            if (!e.target.closest('#profileDropdown') && 
                this.dropdownMenu?.classList.contains('show')) {
                this.dropdownMenu.classList.remove('show');
            }
            
            // Close view dropdown
            if (!e.target.closest('#viewDropdown') && 
                viewDropdownMenu?.classList.contains('show')) {
                viewDropdown?.classList.remove('show');
                viewDropdownMenu.classList.remove('show');
            }
        });
    
        this.initializeNotifications();
        this.initializeLogout();
    }

    // Update the navigateMonth method to be more robust
    navigateMonth(direction) {
        if (this.currentView !== 'month') return;
        
        const newDate = new Date(this.currentDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        this.currentDate = newDate;
        this.updateCalendarHeader();
        this.renderMonthView();
    }

    navigateWeek(direction) {
        if (this.currentView !== 'week') return;

        const newDate = new Date(this.currentDate);
        if (direction === 'prev') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        this.currentDate = newDate;
        this.updateCalendarHeader();
        this.renderWeekView();
    }

    createDayColumn(date) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const isToday = this.isCurrentDay(date);

        // Create header
        const header = document.createElement('div');
        header.className = `week-day-header ${isToday ? 'today' : ''}`;
        header.innerHTML = `
            <div class="day-header-content">
                <span class="weekday">${days[date.getDay()]}</span>
                <span class="date">${date.getDate()}</span>
            </div>
        `;
        dayColumn.appendChild(header);

        // Create hour slots with click handlers
        for (let hour = 0; hour < 24; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            if (isToday && new Date().getHours() === hour) {
                hourSlot.classList.add('current-hour');
            }

            // Add click handler for time selection
            hourSlot.addEventListener('click', () => {
                const selectedDateTime = new Date(date);
                selectedDateTime.setHours(hour, 0, 0, 0);
                this.openTaskModal(selectedDateTime);
            });

            dayColumn.appendChild(hourSlot);
        }

        return dayColumn;
    }

    openTaskModal(dateTime) {
        const modal = document.getElementById('taskModal');
        const startDateInput = document.getElementById('taskStartDate');
        const startTimeInput = document.getElementById('taskStartTime');

        // Format date and time
        const formattedDate = this.formatDate(dateTime);
        const formattedTime = dateTime.getHours().toString().padStart(2, '0') + ':00';

        // Set values
        startDateInput.value = formattedDate;
        startTimeInput.value = formattedTime;

        // Update modal title and show
        const modalTitle = modal.querySelector('h2');
        if (modalTitle) {
            modalTitle.textContent = 'Create Task';
        }

        modal.style.display = 'block';
    }

    addHour(time) {
        const [hours, minutes] = time.split(':');
        const newHours = (parseInt(hours) + 1) % 24;
        return `${String(newHours).padStart(2, '0')}:${minutes}`;
    }

    initializeNotifications() {
        const notificationTrigger = document.querySelector('.notification-trigger');
        const notificationsPanel = document.querySelector('.notifications-panel');
        
        if (notificationTrigger && notificationsPanel) {
            notificationTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationsPanel.classList.toggle('show');
            });
    
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.notifications') && 
                    notificationsPanel.classList.contains('show')) {
                    notificationsPanel.classList.remove('show');
                }
            });
        }
    
        // Initialize NotificationManager
        if (typeof NotificationManager !== 'undefined') {
            this.notificationManager = new NotificationManager();
        }
    }

    toggleProfileMenu() {
        if (this.dropdownMenu) {
            const viewDropdown = document.getElementById('viewDropdown');
            const viewDropdownMenu = viewDropdown?.querySelector('.profile-dropdown-menu');
            
            // Close view dropdown if open
            if (viewDropdownMenu?.classList.contains('show')) {
                viewDropdown?.classList.remove('show');
                viewDropdownMenu.classList.remove('show');
            }
            
            // Toggle profile dropdown
            const isShowing = this.dropdownMenu.classList.contains('show');
            document.querySelectorAll('.profile-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
            
            if (!isShowing) {
                this.dropdownMenu.classList.add('show');
            }
        }
    }

    initializeLogout() {
        const logoutLink = document.querySelector('a[href*="logout"]');
        
        if (logoutLink) {
            logoutLink.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    const response = await fetch('/api/logout/', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                        }
                    });
                    
                    if (response.ok) {
                        window.location.href = '/';
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
});
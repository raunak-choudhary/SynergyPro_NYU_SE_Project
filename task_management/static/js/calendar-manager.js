class CalendarManager {
    constructor() {
        this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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

    showNotification(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container') || (() => {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        })();
    
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Create toast content with SVG icon
        const iconSVG = type === 'success' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        
        toast.innerHTML = `
            <div class="toast-icon">${iconSVG}</div>
            <div class="toast-message">${message}</div>
            <div class="toast-close">×</div>
        `;
        
        toastContainer.appendChild(toast);
    
        // Add click handler for close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.onclick = () => {
            toast.style.animation = 'slideOut 0.5s ease-out forwards';
            setTimeout(() => toastContainer.removeChild(toast), 500);
        };
    
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOut 0.5s ease-out forwards';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toastContainer.removeChild(toast);
                    }
                }, 500);
            }
        }, 3000);
    }

    initializeTaskModal() {
        const modal = document.getElementById('taskModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const taskForm = document.getElementById('taskForm');
    
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            taskForm.reset();
        });
    
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            taskForm.reset();
        });

        const timeInputs = modal.querySelectorAll('input[type="time"]');
        timeInputs.forEach(input => {
            if (!input.value) {
                input.value = '00:00';
            }
        });
    
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.disabled = true;
        
            try {
                const formData = new FormData();
                const title = document.getElementById('taskTitle').value.trim();
                const startDate = document.getElementById('taskStartDate').value;
                const startTime = document.getElementById('taskStartTime').value;
                const endDate = document.getElementById('taskEndDate').value;
                const endTime = document.getElementById('taskEndTime').value;
        
                // Validation checks
                if (!title) throw new Error('Please enter a task title');
                if (!startDate) throw new Error('Please select a start date');
                if (!startTime) throw new Error('Please select a start time');
                if (!endDate) throw new Error('Please select an end date');
                if (!endTime) throw new Error('Please select an end time');

                // Format time to HH:MM
                const formatTime = (time) => time.slice(0, 5);
                const formattedStartTime = formatTime(startTime);
                const formattedEndTime = formatTime(endTime);

                const startDateTime = new Date(`${startDate}T${formattedStartTime}`);
                const endDateTime = new Date(`${endDate}T${formattedEndTime}`);
        
                if (endDateTime < startDateTime) {
                    throw new Error('End date/time must be after start date/time');
                }
        
                formData.append('title', title);
                formData.append('description', document.getElementById('taskDescription').value.trim());
                formData.append('priority', document.querySelector('input[name="priority"]:checked').value);
                formData.append('start_date', startDate);
                formData.append('start_time', formattedStartTime);
                formData.append('end_date', endDate);
                formData.append('end_time', formattedEndTime);

                const formDataObj = {};
                formData.forEach((value, key) => {
                    formDataObj[key] = value;
                });
                console.log('FormData being sent:', formDataObj);
        
                const response = await fetch('/api/tasks/create/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: formData
                });
        
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
        
                const data = await response.json();
                if (data.success) {
                    modal.style.display = 'none';
                    taskForm.reset();
                    if (this.currentView === 'month') {
                        this.renderMonthView();
                    } else {
                        this.renderWeekView();
                    }
                    this.showNotification(data.message || 'Task created successfully!', 'success');
                } else {
                    throw new Error(data.error || 'Unable to create task. Please try again.');
                }
            } catch (error) {
                console.error('Task creation error:', error);
                this.showNotification(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    openTaskModal(dateTime) {
        const modal = document.getElementById('taskModal');
        const startDateInput = document.getElementById('taskStartDate');
        const startTimeInput = document.getElementById('taskStartTime');
        const endDateInput = document.getElementById('taskEndDate');
        const endTimeInput = document.getElementById('taskEndTime');
    
        // Debug logs
        console.log('Original dateTime:', dateTime);
        console.log('Date object:', new Date(dateTime));
    
        // Ensure dateTime is a Date object and handle timezone
        let date = dateTime instanceof Date ? dateTime : new Date(dateTime);
        console.log('Processed date:', date);
        
        // Adjust for local timezone offset
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        console.log('Local date:', localDate);
    
        if (this.currentView === 'month') {
            // For month view, ensure we're working with start of day
            const startOfDay = new Date(localDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            startDateInput.value = this.formatDate(startOfDay);
            startTimeInput.value = '00:00'; // Use 24-hour format
            console.log('Month view - Start date:', startDateInput.value);
            console.log('Month view - Start time:', startTimeInput.value);
        } else {
            startDateInput.value = this.formatDate(localDate);
            const hours = date.getHours().toString().padStart(2, '0');
            startTimeInput.value = `${hours}:00`; // Use 24-hour format
            console.log('Week view - Start date:', startDateInput.value);
            console.log('Week view - Start time:', startTimeInput.value);
        }
    
        // Clear and set default end time
        endDateInput.value = '';
        endTimeInput.value = '00:00'; // Use 24-hour format
    
        modal.style.display = 'block';
    }

    formatDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            console.error('Invalid date:', date);
            return '';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        console.log('Formatting date:', date, 'to:', formatted);
        return formatted;
    } 

    formatDateTimeForAPI(date, time) {
        const datetime = new Date(`${date}T${time}`);
        return datetime.toLocaleString('en-US', { timeZone: this.userTimezone });
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
        const endDateInput = document.getElementById('taskEndDate');
        const endTimeInput = document.getElementById('taskEndTime');
    
        // Ensure dateTime is a Date object and handle timezone
        let date = dateTime instanceof Date ? dateTime : new Date(dateTime);
        
        // Create a date object for the start of the selected day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
    
        if (this.currentView === 'month') {
            // For month view, set start time to 00:00
            startDateInput.value = this.formatDate(startOfDay);
            startTimeInput.value = '00:00';
        } else {
            // For week view, use clicked hour
            startDateInput.value = this.formatDate(date);
            startTimeInput.value = `${date.getHours().toString().padStart(2, '0')}:00`;
        }
    
        // Clear and set default end time
        endDateInput.value = '';
        endTimeInput.value = '00:00';
    
        modal.style.display = 'block';
    }

    formatDate(date) {
        // Add type check to prevent errors
        if (!(date instanceof Date)) {
            return '';
        }
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
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
            hourSlot.setAttribute('data-hour', hour);
            
            if (isToday && new Date().getHours() === hour) {
                hourSlot.classList.add('current-hour');
            }
    
            hourSlot.addEventListener('click', () => {
                const selectedDateTime = new Date(date);
                selectedDateTime.setHours(hour);
                selectedDateTime.setMinutes(0);
                selectedDateTime.setSeconds(0);
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
        
        // Create date at beginning of day
        const cellDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        cellDate.setHours(0, 0, 0, 0);
        
        console.log('Creating cell for day:', day);
        console.log('Cell date:', cellDate);
        
        dayElement.dataset.date = cellDate.toISOString();
        
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
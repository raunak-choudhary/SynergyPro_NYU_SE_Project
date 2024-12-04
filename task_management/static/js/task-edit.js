document.addEventListener('DOMContentLoaded', function() {
    const editButton = document.getElementById('editButton');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editTaskForm');
    const cancelButton = document.getElementById('cancelEdit');
    const taskId = window.location.pathname.split('/')[2];

    // Show modal
    editButton.addEventListener('click', function() {
        editModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Hide modal
    cancelButton.addEventListener('click', function() {
        editModal.style.display = 'none';
        document.body.style.overflow = '';
    });

    // Handle form submission
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('editTitle').value,
            start_date: document.getElementById('editStartDate').value,
            end_date: document.getElementById('editEndDate').value,
            description: document.getElementById('editDescription').value
        };

        fetch(`/api/task/${taskId}/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.reload();
            } else {
                alert('Failed to update task');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while updating the task');
        });
    });

    // Get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Delete functionality
    const deleteButton = document.getElementById('deleteButton');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');

    deleteButton.addEventListener('click', () => {
        deleteModal.style.display = 'flex';
    });

    cancelDelete.addEventListener('click', () => {
        deleteModal.style.display = 'none';
    });

    confirmDelete.addEventListener('click', () => {
        const taskId = window.location.pathname.split('/')[2];

        fetch(`/api/task/${taskId}/delete/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.href = '/tasks/';
            } else {
                alert('Failed to delete task');
            }
        })
        .catch(error => console.error('Error:', error));
    });

    // Status update functionality
    const statusDropdown = document.getElementById('editStatus');
    statusDropdown.addEventListener('change', function() {
        updateTaskStatus(this.value);
    });

    function updateTaskStatus(newStatus) {
        fetch(`/api/task/${taskId}/update/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                status: newStatus
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Task status updated successfully');
                window.location.reload(); // Redirect to tasks page
            } else {
                console.error('Failed to update task status');
            }
        })
        .catch(error => console.error('Error:', error));
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');
});

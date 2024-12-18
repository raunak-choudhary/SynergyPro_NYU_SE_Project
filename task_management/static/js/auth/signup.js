async function handleSignup(formData) {
    try {
        const response = await fetch('/api/signup/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.status === 409) {  // Team exists case
            if (!formData.joining_existing_team) {
                showTeamJoinModal(data.team_details, formData);
                return false;
            }
        }

        if (!response.ok) {
            showToast(data.message, 'error');
            return false;
        }

        // Close all modals first
        const authModal = document.getElementById('authModal');
        const teamJoinModal = document.getElementById('teamJoinModal');
        if (authModal) authModal.style.display = 'none';
        if (teamJoinModal) teamJoinModal.style.display = 'none';

        // Show success toast
        showToast(data.message, 'success');

        // Show welcome modal with username
        const welcomeModal = document.getElementById('welcomeModal');
        const userNameSpan = welcomeModal.querySelector('.user-name');
        if (welcomeModal && userNameSpan) {
            userNameSpan.textContent = `${formData.firstName} ${formData.lastName}` || data.username;
            welcomeModal.style.display = 'block';
            welcomeModal.classList.add('show');

            // Start vanishing animation after 1.5 seconds
            setTimeout(() => {
                welcomeModal.classList.add('vanish');
            }, 1500);

            // Hide welcome modal and refresh page after 2 seconds
            setTimeout(() => {
                welcomeModal.style.display = 'none';
                window.location.reload(); // Refresh the home page
            }, 2000);
        }

        return true;
    } catch (error) {
        console.error('Signup error:', error);
        showToast('An unexpected error occurred. Please try again.', 'error');
        return false;
    }
}

// Helper function to show toast notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastTimeline = document.getElementById('toast-timeline');
    
    toastMessage.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
    toast.style.backgroundColor = type === 'error' ? '#ff4444' : '#58d68d';
    
    // Clear any existing animations
    toast.classList.remove('show', 'hide');
    void toast.offsetWidth; // Trigger reflow
    
    toast.style.display = 'block';
    toast.classList.add('show');
    
    let timerWidth = 100;
    toastTimeline.style.width = '100%';
    toastTimeline.style.backgroundColor = type === 'error' ? '#cc0000' : '#239b56';
    
    const countdownInterval = setInterval(() => {
        timerWidth -= 2;
        toastTimeline.style.width = `${timerWidth}%`;
        
        if (timerWidth <= 0) {
            clearInterval(countdownInterval);
            toast.classList.add('hide');
            setTimeout(() => {
                toast.style.display = 'none';
                toast.classList.remove('show', 'hide');
            }, 300);
        }
    }, 50);
}

function showTeamJoinModal(teamDetails, formData) {
    const modal = document.getElementById('teamJoinModal');
    
    // Fill in team details
    document.getElementById('team-name').textContent = teamDetails.name;
    document.getElementById('team-admin').textContent = teamDetails.admin_name;
    document.getElementById('team-date').textContent = teamDetails.created_at;
    document.getElementById('team-org').textContent = teamDetails.organization;
    document.getElementById('team-type').textContent = teamDetails.team_type;
    
    modal.style.display = 'block';

    // Handle join button click
    document.getElementById('joinTeamBtn').onclick = () => {
        // Close team join modal
        modal.style.display = 'none';
        
        // Handle signup with joining flag
        handleSignup({
            ...formData,
            joining_existing_team: true
        });
    };

    // Handle cancel button click
    document.getElementById('cancelJoinBtn').onclick = () => {
        modal.style.display = 'none';
    };

    // Handle close button click
    modal.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
    };
}

// Handle welcome modal close button
document.addEventListener('DOMContentLoaded', () => {
    const welcomeModal = document.getElementById('welcomeModal');
    const closeBtn = welcomeModal.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            welcomeModal.style.display = 'none';
        });
    }

    // Close modal if clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === welcomeModal) {
            welcomeModal.style.display = 'none';
        }
    });
});
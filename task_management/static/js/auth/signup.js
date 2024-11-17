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

        if (!response.ok) {
            showToast(data.message, 'error');
            return false;
        }

        // Close the signup modal
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Show success toast
        showToast(data.message, 'success');

        // Show welcome modal with username
        const welcomeModal = document.getElementById('welcomeModal');
        const userNameSpan = welcomeModal.querySelector('.user-name');
        if (welcomeModal && userNameSpan) {
            userNameSpan.textContent = formData.firstName || data.username;
            welcomeModal.style.display = 'block';
        }

        // Redirect to appropriate dashboard after delay
        if (data.redirect_url) {
            setTimeout(() => {
                window.location.href = data.redirect_url;
            }, 2000); // 2 second delay to show welcome message
        } else {
            // Fallback to dashboard router if no specific URL provided
            setTimeout(() => {
                window.location.href = '/dashboard/';
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
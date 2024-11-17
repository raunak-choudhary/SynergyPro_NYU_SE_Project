async function handleLogin(formData) {
    try {
        const response = await fetch('/api/login/', {
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

        // Show welcome message
        document.querySelector('.user-name').textContent = data.user.firstName;
        document.getElementById('welcomeModal').style.display = 'block';

        showToast(data.message, 'success');
        
        // Redirect to appropriate dashboard after delay
        setTimeout(() => {
            window.location.href = data.redirect_url;
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        showToast('An unexpected error occurred. Please try again.', 'error');
        return false;
    }
}
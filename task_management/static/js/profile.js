class ProfileManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Photo Upload Elements
        this.profileImage = document.getElementById('profileImage');
        this.avatar = document.querySelector('.avatar');
        
        // Profile Dropdown Elements
        this.profileDropdown = document.getElementById('profileDropdown');
        this.dropdownMenu = document.querySelector('.profile-dropdown-menu');
        
        //Verification Buttons
        //this.verifyEmailBtn = document.getElementById('verifyEmail');
        //this.verifyPhoneBtn = document.getElementById('verifyPhone');
    }

    attachEventListeners() {      
        // Profile Dropdown
        if (this.profileDropdown) {
            this.profileDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dropdownMenu?.classList.toggle('show');
            });
        }
    
        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#profileDropdown')) {
                this.dropdownMenu?.classList.remove('show');
            }
        });
    
        // Verification Buttons
        //if (this.verifyEmailBtn) {
            //this.verifyEmailBtn.addEventListener('click', () => this.handleEmailVerification());
        //}
    
        //if (this.verifyPhoneBtn) {
            //this.verifyPhoneBtn.addEventListener('click', () => this.handlePhoneVerification());
        //}

        //Profile Dropdown Call
        this.initializeProfileDropdown();

        //Logout Function Call
        this.initializeLogout();
    }

    initializeProfileDropdown() {
        this.profileDropdown = document.getElementById('profileDropdown');
        this.dropdownMenu = document.querySelector('.profile-dropdown-menu');
    
        if (this.profileDropdown) {
            this.profileDropdown.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleProfileMenu();
            });
    
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#profileDropdown') && 
                    this.dropdownMenu?.classList.contains('show')) {
                    this.dropdownMenu.classList.remove('show');
                }
            });
        }
    }

    toggleProfileMenu() {
        if (this.dropdownMenu) {
            const isShowing = this.dropdownMenu.classList.contains('show');
            
            // Close any other open dropdowns first
            document.querySelectorAll('.profile-dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
    
            if (!isShowing) {
                this.dropdownMenu.classList.add('show');
            }
        }
    }

    //handleEmailVerification() {
        //this.showNotification('Email verification link sent!', 'success');
    //}

    //handlePhoneVerification() {
        //this.showNotification('SMS verification code sent!', 'success');
    //}

    handleOutsideClick(event) {
        if (this.photoOptionsModal && 
            !event.target.closest('.image-container') && 
            !event.target.closest('.modal-content')) {
            this.photoOptionsModal.classList.remove('show');
        }

        if (this.dropdownMenu && 
            !event.target.closest('#profileDropdown') && 
            !event.target.closest('.profile-dropdown-menu')) {
            this.dropdownMenu.classList.remove('show');
        }
    }

    initializeLogout() {
        // Get the logout link
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
                        // Immediately redirect to home page
                        window.location.href = '/';
                    }
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
        }
    }
}

// Initialize Profile Manager
document.addEventListener('DOMContentLoaded', () => {
    const profileManager = new ProfileManager();
});

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageUploadModal');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const closeBtn = document.querySelector('.close');
    const fileUploadOption = document.getElementById('fileUploadOption');
    const cameraOption = document.getElementById('cameraOption');
    const fileInput = document.getElementById('fileInput');
    const cameraContainer = document.getElementById('cameraContainer');
    const video = document.getElementById('video');
    const captureBtn = document.getElementById('captureBtn');
    const backToOptions = document.getElementById('backToOptions');
    const circleCanvas = document.getElementById('circleCanvas');
    
    let stream = null;
    
    // Check if this is a page reload after image upload
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('imageUpdated') === 'true') {
        showToast("Congrats!! Profile Image updated successfully.");
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Toast notification function
    function showToast(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Create toast content
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

    // Show modal when camera button is clicked
    changePhotoBtn.onclick = function(e) {
        e.preventDefault();
        modal.style.display = "block";
        cameraContainer.style.display = "none";
    }

    function showModal() {
        modal.style.display = "block";
        document.body.classList.add('modal-open');
    }
    
    // ADD to your modal close function
    function closeModal() {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }

    // Close modal
    closeBtn.onclick = function() {
        closeModal();
        stopCamera();
    }

    // Stop propagation of clicks inside modal to prevent bubbling
    modal.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // File upload option
    fileUploadOption.onclick = function() {
        fileInput.click();
    }

    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            uploadImage(file);
        }
    }

    // Camera option
    cameraOption.onclick = async function() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            cameraContainer.style.display = "block";
            document.querySelector('.upload-options').style.display = "none";
            
            // Draw circular guide
            const ctx = circleCanvas.getContext('2d');
            circleCanvas.width = video.videoWidth;
            circleCanvas.height = video.videoHeight;
            
            function drawCircle() {
                ctx.clearRect(0, 0, circleCanvas.width, circleCanvas.height);
                
                // Calculate oval dimensions
                const centerX = circleCanvas.width / 2;
                const centerY = circleCanvas.height / 2;
                const radiusX = 150; // Wider
                const radiusY = 180; // Taller
                
                ctx.beginPath();
                ctx.strokeStyle = '#FF69B4'; // Pink color
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 3;
                
                // Draw oval instead of circle
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                ctx.stroke();
                
                requestAnimationFrame(drawCircle);
            }
            
            video.onplay = () => {
                circleCanvas.width = video.videoWidth;
                circleCanvas.height = video.videoHeight;
                drawCircle();
            };
        } catch (err) {
            console.error("Error accessing camera:", err);
            showToast("Could not access camera. Please check permissions.", 'error');
        }
    }

    // Capture photo
    captureBtn.onclick = function() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob(function(blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            uploadImage(file);
        }, 'image/jpeg');
    }

    // Back button
    backToOptions.onclick = function() {
        cameraContainer.style.display = "none";
        document.querySelector('.upload-options').style.display = "flex";
        stopCamera();
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch('/api/profile/upload-image/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Close modal
                modal.style.display = "none";
                stopCamera();

                // Reload the page with a query parameter
                window.location.href = window.location.pathname + '?imageUpdated=true';
            } else {
                showToast(data.error || 'Failed to upload image', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while uploading the image', 'error');
        }
    }
});
class OTPManager {
    constructor() {
        console.log("OTPManager initializing");
        this.initializeElements();
        this.attachEventListeners();
        console.log("OTPManager initialized");
        // Tracking verification status
        this.isEmailVerified = false;
        this.isMobileVerified = false;
        // Tracking current transaction
        this.currentTransaction = {
            type: null,
            hasUsedResend: false,
            timerInterval: null
        };
        this.checkInitialVerificationStatus();
        this.updateVerificationUI();

        this.isValidating = false;
        this.isGeneratingOTP = false;
    }

    initializeElements() {
        this.modal = document.getElementById('otpVerificationModal');
        this.modalTitle = document.getElementById('otpModalTitle');
        this.otpDestination = document.getElementById('otpDestination');
        this.otpInputs = document.querySelectorAll('.otp-input');
        this.validateBtn = document.getElementById('validateOtpBtn');
        this.resendBtn = document.getElementById('resendOtpBtn');
        this.closeBtn = this.modal.querySelector('.close');
        this.timerCircle = document.querySelector('.timer-circle');
        this.timerText = document.querySelector('.timer-text');
        
        // Verification buttons
        this.verifyEmailBtn = document.querySelector('.verify-email-btn');
        this.verifyPhoneBtn = document.querySelector('.verify-phone-btn');

        console.log("Email button found:", this.verifyEmailBtn);
        console.log("Phone button found:", this.verifyPhoneBtn);
    }

    attachEventListeners() {
        console.log("Attaching event listeners");
        
        // OTP input handling
        this.otpInputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => this.handleOtpInput(e, index));
            input.addEventListener('keydown', (e) => this.handleBackspace(e, index));
            input.addEventListener('paste', (e) => this.handlePaste(e));
        });
    
        // Remove any existing event listeners first
        if (this.verifyEmailBtn) {
            this.verifyEmailBtn.replaceWith(this.verifyEmailBtn.cloneNode(true));
            this.verifyEmailBtn = document.querySelector('.verify-email-btn');  // Get fresh reference
            
            this.verifyEmailBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!this.isGeneratingOTP) {
                    await this.showOtpModal('email');
                }
            }, { once: true });  // Add once: true to ensure single execution
        } else {
            console.log("Email button not found");
        }
        
        if (this.verifyPhoneBtn) {
            this.verifyPhoneBtn.replaceWith(this.verifyPhoneBtn.cloneNode(true));
            this.verifyPhoneBtn = document.querySelector('.verify-phone-btn');  // Get fresh reference
            
            this.verifyPhoneBtn.addEventListener('click', async () => {
                console.log('Phone verify button clicked');
                if (!this.isGeneratingOTP) {
                    await this.showOtpModal('mobile');
                }
            }, { once: true });  // Add once: true to ensure single execution
        } else {
            console.log("Phone button not found");
        }
    
        // Modal controls
        this.validateBtn.addEventListener('click', () => this.validateOTP());
        this.resendBtn.addEventListener('click', () => this.resendOTP());
        this.closeBtn.addEventListener('click', () => this.hideModal());
    
        console.log("Event listeners attached");
    }

    async showOtpModal(type) {
        // Prevent multiple simultaneous requests
        if (this.isGeneratingOTP) {
            console.log("OTP generation already in progress");
            return;
        }
        
        console.log("Starting OTP generation for type:", type);
        
        try {
            this.isGeneratingOTP = true; // Set the flag
            
            this.currentTransaction = {
                type: type,
                hasUsedResend: false,
                timerInterval: null
            };
    
            // Create FormData
            const formData = new FormData();
            formData.append('type', type);
            
            // Get CSRF token
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
            const response = await fetch('/api/otp/generate/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                body: formData
            });
    
            const data = await response.json();
            console.log("OTP generation response:", data);
            
            if (data.status === 'success') {
                // Show modal and setup UI
                this.modal.style.display = 'flex';
                document.body.classList.add('modal-open');
                
                // Clear previous inputs
                this.otpInputs.forEach(input => {
                    input.value = '';
                    input.disabled = false; // Enable inputs
                });
                this.otpInputs[0].focus();
                
                // Update destination display
                const destinationInput = type === 'email' 
                    ? document.querySelector('input[type="email"]')
                    : document.querySelector('input[type="tel"]');
                    
                if (destinationInput) {
                    this.otpDestination.textContent = destinationInput.value;
                }
                
                // Update modal title based on verification type
                const modalTitle = document.getElementById('otpModalTitle');
                if (modalTitle) {
                    modalTitle.textContent = `Please enter the One Time Password`;
                    modalTitle.style.whiteSpace = 'nowrap';
                }
                
                // Reset and start timer
                this.resetAndStartTimer();
                
                // Enable validate button
                if (this.validateBtn) {
                    this.validateBtn.disabled = false;
                }
                
                // Hide resend button initially
                if (this.resendBtn) {
                    this.resendBtn.style.display = 'none';
                    this.resendBtn.disabled = true;
                }
                
            } else if (data.status === 'error' && data.message.includes('Please wait')) {
                // Handle rate limiting error
                this.showError(data.message);
                // Don't show the modal in this case
                return;
            } else {
                this.showError(data.message || 'Failed to generate OTP');
                return;
            }
            
        } catch (error) {
            console.error("Error generating OTP:", error);
            this.showError('Failed to generate OTP. Please try again.');
            
        } finally {
            // Reset the generating flag after a short delay
            // This prevents rapid successive clicks while allowing new attempts after a brief period
            setTimeout(() => {
                this.isGeneratingOTP = false;
            }, 1000); // 1 second delay
        }
    }

    maskPhoneNumber(phone) {
        // Show only last 4 digits
        return `****-${phone.slice(-4)}`;
    }

    resetAndStartTimer() {
        // Clear any existing timer
        if (this.currentTransaction.timerInterval) {
            clearInterval(this.currentTransaction.timerInterval);
        }

        // Reset UI elements
        this.timerCircle.style.display = 'block';
        this.timerCircle.classList.remove('timer-active');
        this.resendBtn.style.display = 'none';
        this.resendBtn.disabled = false;
        this.resendBtn.textContent = 'Resend OTP';
        this.resendBtn.classList.remove('otp-sent');
        
        // Force reflow for smooth animation
        void this.timerCircle.offsetWidth;
        
        // Start new timer
        this.startTimer();
    }

    startTimer() {
        let timeLeft = 60;
        this.timerCircle.classList.add('timer-active');
        
        const updateTimer = () => {
            this.timerText.textContent = `${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(this.currentTransaction.timerInterval);
                this.timerCircle.style.display = 'none';
                this.resendBtn.style.display = 'block';
                this.resendBtn.textContent = 'Resend OTP';
                this.resendBtn.disabled = false;
            }
            timeLeft--;
        };

        updateTimer(); // Initial call
        this.currentTransaction.timerInterval = setInterval(updateTimer, 1000);
    }

    hideModal() {
        // Clear any running timer
        if (this.currentTransaction.timerInterval) {
            clearInterval(this.currentTransaction.timerInterval);
        }

        this.modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    handleOtpInput(e, index) {
        const input = e.target;
        const value = input.value;
        
        if (value.length === 1) {
            input.value = value[0];
            if (index < this.otpInputs.length - 1) {
                this.otpInputs[index + 1].focus();
            }
        }
    }

    handleBackspace(e, index) {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            this.otpInputs[index - 1].focus();
        }
    }

    handlePaste(e) {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData)
            .getData('text')
            .trim()
            .slice(0, 6);

        [...pastedData].forEach((char, index) => {
            if (this.otpInputs[index]) {
                this.otpInputs[index].value = char;
            }
        });

        if (this.otpInputs[pastedData.length]) {
            this.otpInputs[pastedData.length].focus();
        }
    }

    async validateOTP() {
        const otp = Array.from(this.otpInputs)
            .map(input => input.value)
            .join('');
    
        if (otp.length !== 6) {
            this.showError('Please enter complete OTP');
            return;
        }
    
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const formData = new FormData();
        formData.append('type', this.currentTransaction.type);
        formData.append('otp', otp);
    
        fetch('/api/otp/verify/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Update verification status based on type
                if (this.currentTransaction.type === 'email') {
                    this.isEmailVerified = true;
                    this.updateVerificationUI('email');
                } else {
                    this.isMobileVerified = true;
                    this.updateVerificationUI('mobile');
                }
    
                this.showSuccess('Verification successful!');
                setTimeout(() => this.hideModal(), 1500);
            } else {
                this.showError(data.message || 'Verification failed');
            }
        })
        .catch(error => {
            console.error('Verification error:', error);
            this.showError('Verification failed. Please try again.');
        });
    }

    resendOTP() {
        if (this.currentTransaction.hasUsedResend) return;
        
        this.currentTransaction.hasUsedResend = true;
        this.resendBtn.disabled = true;
        this.resendBtn.textContent = 'Sending...';

        // Simulate OTP resend
        setTimeout(() => {
            this.resendBtn.textContent = 'OTP Sent';
            this.resendBtn.classList.add('otp-sent');
        }, 1500);
    }

    showError(message) {
        if (window.dashboard) {
            window.dashboard.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        if (window.dashboard) {
            window.dashboard.showNotification(message, 'success');
        } else {
            alert(message);
        }
    }

    async checkInitialVerificationStatus() {
        // Check both email and mobile verification status from the server
        fetch('/api/otp/status/')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    this.isEmailVerified = data.data.email.verified;
                    this.isMobileVerified = data.data.mobile.verified;
                    this.updateVerificationUI('email');
                    this.updateVerificationUI('mobile');
                }
            })
            .catch(error => console.error('Error checking verification status:', error));
    }
    
    updateVerificationUI(type) {
        const container = document.getElementById(`${type}-verification-container`);
        if (!container) return;

        const isVerified = type === 'email' ? this.isEmailVerified : this.isMobileVerified;
        const input = container.querySelector('input');
        const verifyButton = container.querySelector(`.verify-${type}-btn`);
        const verificationStatus = container.querySelector('.verification-status');

        if (isVerified) {
            // Remove verify button if it exists
            if (verifyButton) {
                verifyButton.remove();
            }
            
            // Add or update verification status
            if (!verificationStatus) {
                const newStatus = document.createElement('div');
                newStatus.className = 'verification-status success';
                newStatus.innerHTML = `
                    <span class="verification-icon">✓</span>
                    <span class="verification-text">${type === 'email' ? 'Email' : 'Mobile'} Verified</span>
                `;
                container.appendChild(newStatus);
            }
        } else {
            // Remove verification status if it exists
            if (verificationStatus) {
                verificationStatus.remove();
            }
            
            const existingButton = container.querySelector(`.verify-${type}-btn`);
            if (existingButton) {
                existingButton.addEventListener('click', () => this.showOtpModal(type));
            }
        }
    }
}

// Initialize OTP Manager
document.addEventListener('DOMContentLoaded', () => {
    window.otpManager = new OTPManager();
});
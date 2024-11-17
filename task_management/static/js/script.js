// Initialize AOS (Animate on Scroll)
AOS.init({
    duration: 1000,
    once: true
});

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Smooth scroll function
function scrollToFeatures() {
    const featuresSection = document.querySelector('#features');
    if (featuresSection) {
        const headerOffset = 80;
        const elementPosition = featuresSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Parallax effect for hero section
let lastScrollPosition = 0;
window.addEventListener('scroll', function() {
    const currentScrollPosition = window.pageYOffset;
    const heroSection = document.querySelector('.hero');
    
    if (heroSection) {
        const scrollDifference = currentScrollPosition - lastScrollPosition;
        const currentPosition = parseFloat(heroSection.style.backgroundPositionY || '0px');
        const newPosition = currentPosition + (scrollDifference * 0.5);
        
        heroSection.style.backgroundPositionY = `${newPosition}px`;
        lastScrollPosition = currentScrollPosition;
    }
});

// Contact form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show toast message
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        const toastTimeline = document.getElementById('toast-timeline');
        
        toastMessage.innerHTML = '<i class="fas fa-check-circle"></i> Thank you for the message. We will get back to you soon!';
        toast.classList.add('show');
        toast.style.display = 'block';
        toast.style.backgroundColor = '#58d68d'; // Set background color to green
        
        // Start timer line countdown
        let timerWidth = 100;
        toastTimeline.style.width = '100%';
        toastTimeline.style.backgroundColor = '#239b56'; // Darker green color
        
        const countdownInterval = setInterval(() => {
            timerWidth -= 2; // Reduce the width by 2% every 50ms
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
        
        // Reset form
        this.reset();
    });
}
// Welcome Modal Functions
function showWelcomeModal(firstName, lastName) {
    // Close auth modal first
    const authModal = document.getElementById('authModal');
    authModal.style.display = 'none';

    // Get welcome modal elements
    const welcomeModal = document.getElementById('welcomeModal');
    const userName = welcomeModal.querySelector('.user-name');
    
    // Set welcome name
    userName.textContent = `${firstName} ${lastName}`;
    
    // Show modal with animation
    welcomeModal.style.display = 'block';
    setTimeout(() => {
        welcomeModal.classList.add('show');
    }, 10);

    // Add close button functionality
    const closeBtn = welcomeModal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            location.reload();
        });
    }

    // Start vanishing animation after 1.5 seconds
    setTimeout(() => {
        welcomeModal.classList.add('vanish');
    }, 1500);

    // Hide and reload after 2 seconds
    setTimeout(() => {
        welcomeModal.style.display = 'none';
        location.reload();
    }, 2000);
}

// Modal and Authentication Functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeBtn = document.querySelector('.modal .close');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const switchBtns = document.querySelectorAll('.switch-btn');
    const authForms = document.querySelectorAll('.auth-form');
    const userTypeSelect = document.getElementById('userType');
    const individualProfileDiv = document.querySelector('.profile-type-individual');
    const teamProfileDiv = document.querySelector('.profile-type-team');
    const individualProfileSelect = document.getElementById('individualProfileType');
    const teamProfileSelect = document.getElementById('teamProfileType');
    const universityField = document.querySelector('.university-field');
    const organizationField = document.querySelector('.organization-field');
    const websiteField = document.querySelector('.website-field');
    window.scrollTo(0, 0);

    // Initialize select elements
    const selects = document.querySelectorAll('.form-group select');
    selects.forEach(select => {
        select.value = "";
        select.addEventListener('change', function() {
            this.style.borderColor = this.value === "" ? "#f44336" : "#4CAF50";
        });
    });

    // Modal Show/Hide Functions
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();
        });
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.querySelectorAll('.auth-form form').forEach(form => {
            form.reset();
            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
            });
        });
        document.querySelectorAll('.form-message').forEach(msg => {
            msg.style.display = 'none';
        });
    }
    // Show form function
    function showForm(formId) {
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === formId) {
                btn.classList.add('active');
            }
        });

        authForms.forEach(form => {
            form.classList.remove('active');
            if (form.id === formId) {
                form.classList.add('active');
            }
        });
    }

    // Tab and Switch button handlers
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showForm(btn.getAttribute('data-tab'));
        });
    });

    switchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showForm(btn.getAttribute('data-tab'));
        });
    });

    // Password validation
    function validatePassword() {
        const passwordInput = document.getElementById('signup-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        
        if (!passwordInput || !confirmPasswordInput) return false;
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        let isValid = true;
        
        // Reset error states
        passwordInput.parentElement.classList.remove('error');
        confirmPasswordInput.parentElement.classList.remove('error');
        
        if (!passwordPattern.test(password)) {
            passwordInput.parentElement.classList.add('error');
            showError(passwordInput, 'Password must meet all requirements');
            isValid = false;
        }
        
        if (password !== confirmPassword) {
            confirmPasswordInput.parentElement.classList.add('error');
            showError(confirmPasswordInput, 'Passwords do not match');
            isValid = false;
        }
        
        return isValid;
    }

    // Form validation helper functions
    function showError(input, message) {
        const formGroup = input.parentElement;
        const errorDiv = formGroup.querySelector('.error-message') || 
                        document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(errorDiv);
        }
    }

    function showSuccess(form, message) {
        const messageDiv = form.querySelector('.form-message') || 
                          document.createElement('div');
        messageDiv.className = 'form-message success';
        messageDiv.textContent = message;
        if (!form.querySelector('.form-message')) {
            form.insertBefore(messageDiv, form.firstChild);
        }
        messageDiv.style.display = 'block';
    }
    // Login form submission
    const loginForm = document.querySelector('#loginForm form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                username: document.getElementById('login-username').value,
                password: document.getElementById('login-password').value
            };

            const submitBtn = loginForm.querySelector('.submit-btn');
            submitBtn.classList.add('loading');
            
            try {
                await handleLogin(formData);
            } finally {
                submitBtn.classList.remove('loading');
            }
        });
    }

    // Signup form submission
    const signupForm = document.querySelector('#signupForm form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            console.log("Signup form submitted");
            e.preventDefault();

            if (!validatePassword() || !validateForm(signupForm)) {
                return;
            }

            const formData = {
                username: document.getElementById('signup-username').value,
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('signup-email').value,
                phone: document.getElementById('countryCode').value + document.getElementById('phone').value,
                password1: document.getElementById('signup-password').value,
                password2: document.getElementById('signup-confirm-password').value,
                userType: document.getElementById('userType').value,
                profileType: document.getElementById(
                    document.getElementById('userType').value === 'individual' 
                    ? 'individualProfileType' 
                    : 'teamProfileType'
                ).value,
                universityName: document.getElementById('universityName')?.value || 'N/A',
                organizationName: document.getElementById('organizationName')?.value || 'N/A',
                organizationWebsite: document.getElementById('organizationWebsite')?.value || 'N/A'
            };

            console.log('Form Data being sent:', formData);

            const submitBtn = signupForm.querySelector('.submit-btn');
            submitBtn.classList.add('loading');

            try {
                const success = await handleSignup(formData);
                
                if (success) {
                    showWelcomeModal(formData.firstName, formData.lastName);
                }
            } finally {
                submitBtn.classList.remove('loading');
            }
        });
    }

    // Form validation function
    function validateForm(form) {
        let isValid = true;
        const formGroups = form.querySelectorAll('.form-group');
        const userType = document.getElementById('userType').value;
        
        formGroups.forEach(group => {
            if (group.style.display === 'none' || group.parentElement.style.display === 'none') {
                return;
            }
    
            const input = group.querySelector('input');
            const select = group.querySelector('select');
            
            if (input && input.required) {
                if (input.offsetParent === null) return;
                if (!input.checkValidity()) {
                    group.classList.add('error');
                    isValid = false;
                } else {
                    group.classList.remove('error');
                }
            }
            
            if (select && select.required) {
                if (select.offsetParent === null) return;
                if ((userType === 'individual' && select.name === 'teamProfileType') ||
                    (userType === 'team' && select.name === 'individualProfileType')) {
                    return;
                }
                if (select.value === '') {
                    group.classList.add('error');
                    isValid = false;
                } else {
                    group.classList.remove('error');
                }
            }
        });
        
        return isValid;
    }

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            
            if (value.length >= 6) {
                value = `(${value.slice(0,3)})-${value.slice(3,6)}-${value.slice(6)}`;
            } else if (value.length >= 3) {
                value = `(${value.slice(0,3)})-${value.slice(3)}`;
            } else if (value.length > 0) {
                value = `(${value}`;
            }
            
            e.target.value = value;
        });

        // Prevent non-numeric input
        phoneInput.addEventListener('keypress', function(e) {
            if (!/^\d$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
    }

    // Profile type handling
    userTypeSelect.addEventListener('change', function() {
        resetFields();
        
        if (this.value === 'individual') {
            individualProfileDiv.style.display = 'block';
            teamProfileDiv.style.display = 'none';
            document.getElementById('individualProfileType').required = true;
            document.getElementById('teamProfileType').required = false;
        } else if (this.value === 'team') {
            teamProfileDiv.style.display = 'block';
            individualProfileDiv.style.display = 'none';
            document.getElementById('teamProfileType').required = true;
            document.getElementById('individualProfileType').required = false;
        }
    });

    // Individual Profile Type change handler
    individualProfileSelect.addEventListener('change', function() {
        resetAdditionalFields();
        
        if (this.value === 'student') {
            universityField.style.display = 'block';
            document.getElementById('universityName').required = true;
        } else if (this.value === 'freelancer') {
            organizationField.style.display = 'block';
            websiteField.style.display = 'block';
            document.getElementById('organizationName').required = true;
        }
    });

    // Team Profile Type change handler
    teamProfileSelect.addEventListener('change', function() {
        resetAdditionalFields();
        
        if (this.value === 'student' || this.value === 'teacher') {
            universityField.style.display = 'block';
            document.getElementById('universityName').required = true;
        } else if (this.value === 'professional' || this.value === 'hr') {
            organizationField.style.display = 'block';
            websiteField.style.display = 'block';
            document.getElementById('organizationName').required = true;
        }
    });

    // Reset functions
    function resetFields() {
        individualProfileDiv.style.display = 'none';
        teamProfileDiv.style.display = 'none';
        individualProfileSelect.value = '';
        teamProfileSelect.value = '';
        resetAdditionalFields();
    }

    function resetAdditionalFields() {
        universityField.style.display = 'none';
        organizationField.style.display = 'none';
        websiteField.style.display = 'none';
        document.getElementById('universityName').required = false;
        document.getElementById('organizationName').required = false;
        document.getElementById('universityName').value = '';
        document.getElementById('organizationName').value = '';
        document.getElementById('organizationWebsite').value = '';
    }

    // Navigation and scroll handling
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    navLinks.forEach(link => {
        if (link.id !== 'loginBtn') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } else {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const headerOffset = 80;
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        }
    });

    // Active navigation link handling
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('nav a[href^="#"]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const scrollPosition = window.scrollY;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + section.id) {
                        link.classList.add('active');
                    }
                });
            }
        });

        if (window.scrollY < 100) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.classList.contains('logo-link')) {
                    link.classList.add('active');
                }
            });
        }
    }

    // Initialize scroll events
    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink();
});

// Section visibility animation
document.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const isVisible = (rect.top <= window.innerHeight && rect.bottom >= 0);
        
        if(isVisible) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
});
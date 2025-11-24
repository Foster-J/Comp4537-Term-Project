const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://comp4537-term-project-29ei.onrender.com';

// DOM Elements
const form = document.getElementById('registrationForm');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const registerBtn = document.getElementById('registerBtn');
const messageContainer = document.getElementById('messageContainer');
const togglePassword = document.getElementById('togglePassword');
const toggleIcon = document.getElementById('toggleIcon');

// Toggle Password Visibility
togglePassword.addEventListener('click', () => {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    confirmPassword.setAttribute('type', type);

    if (type === 'text') {
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
    } else {
        toggleIcon.classList.remove('bi-eye-slash');
        toggleIcon.classList.add('bi-eye');
    }
});

// Confirm Password Matching
confirmPassword.addEventListener('input', () => {
    const matchDiv = document.getElementById('passwordMatch');
    if (confirmPassword.value === '') {
        matchDiv.textContent = '';
    } else if (password.value === confirmPassword.value) {
        matchDiv.textContent = '✓ Passwords match';
        matchDiv.style.color = '#28a745';
    } else {
        matchDiv.textContent = '✗ Passwords do not match';
        matchDiv.style.color = '#dc3545';
    }
});

// Show Message
function showMessage(message, type) {
    messageContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
}

// Handle Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validation
    if (password.value !== confirmPassword.value) {
        showMessage('Passwords do not match!', 'danger');
        return;
    }

    // Disable button and show loading
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

    try {
        const response = await fetch(API + '/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.value.trim(),
                password: password.value
            })
        });

        const data = await response.json();

        if (response.ok || data.ok) {
            showMessage('✓ Registration successful! Redirecting to login...', 'success');
            form.reset();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showMessage(data.error || 'Registration failed. Please try again.', 'danger');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Create Account';
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', 'danger');
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Create Account';
    }
});
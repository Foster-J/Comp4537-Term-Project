// login.js - Updated with no hard-coded strings

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://unsparked-unperturbedly-dahlia.ngrok-f';

// Initialize page text from strings file
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginTitle').textContent = STRINGS.LOGIN.TITLE;
    document.getElementById('emailLabel').textContent = STRINGS.LOGIN.EMAIL_LABEL;
    document.getElementById('passwordLabel').textContent = STRINGS.LOGIN.PASSWORD_LABEL;
    document.getElementById('loginBtn').textContent = STRINGS.LOGIN.SUBMIT_BUTTON;
    document.getElementById('signupText').textContent = STRINGS.LOGIN.SIGNUP_TEXT;
    document.getElementById('signupLink').textContent = STRINGS.LOGIN.SIGNUP_LINK;

    document.getElementById('email').placeholder = STRINGS.LOGIN.EMAIL_PLACEHOLDER;
    document.getElementById('pass').placeholder = STRINGS.LOGIN.PASSWORD_PLACEHOLDER;

    // Add form submit handler
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});

async function post(path, body) {
    const r = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
    });
    return r.json();
}

async function handleLogin(e) {
    e.preventDefault(); // Prevent form submission
    
    const msg = document.getElementById('msg');
    const email = document.getElementById('email');
    const pass = document.getElementById('pass');
    
    msg.textContent = STRINGS.LOGIN.LOADING_MESSAGE;
    msg.style.color = '';
    msg.className = ''; // Clear any existing classes
    
    try {
        const res = await post('/auth/login', {
            email: email.value.trim(),
            password: pass.value
        });
        
        console.log('Login response:', res); // Debug log
        
        if (res.ok) {
            msg.textContent = STRINGS.LOGIN.SUCCESS_LOGIN;
            msg.style.color = 'green';
            
            // Use the redirectTo from backend if available
            const redirectPage = res.redirectTo || (res.user && res.user.role === 'admin' ? 'admin.html' : 'main.html');
            
            console.log('Redirecting to:', redirectPage); // Debug log
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = redirectPage;
            }, 500);
        } else {
            msg.textContent = STRINGS.LOGIN.ERROR_LOGIN_FAILED + (res.error || STRINGS.LOGIN.ERROR_INVALID_CREDENTIALS);
            msg.style.color = 'red';
        }
    } catch (error) {
        console.error('Login error:', error); // Debug log
        msg.textContent = STRINGS.LOGIN.ERROR_PREFIX + error.message;
        msg.style.color = 'red';
    }
}

// Backup: Also attach to button click
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = handleLogin;
}
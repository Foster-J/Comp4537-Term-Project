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

loginBtn.onclick = async () => {
    msg.textContent = STRINGS.LOGIN.LOADING_MESSAGE;
    msg.style.color = '';
    
    try {
        const res = await post('/auth/login', {
            email: email.value,
            password: pass.value
        });
        
        if (res.ok) {
            if (res.user && res.user.role === 'admin') {
                window.location = 'admin.html';
            } else {
                window.location = 'main.html';
            }
        } else {
            msg.textContent = STRINGS.LOGIN.ERROR_LOGIN_FAILED + (res.error || STRINGS.LOGIN.ERROR_INVALID_CREDENTIALS);
            msg.style.color = 'red';
        }
    } catch (e) {
        msg.textContent = STRINGS.LOGIN.ERROR_PREFIX + e.message;
        msg.style.color = 'red';
    }
};
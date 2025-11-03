const API = 'http://localhost:3000';

async function get(path) {
    const r = await fetch(API + path, { credentials: 'include' });
    return r.json();
}

async function post(path, data = {}) {
    const r = await fetch(API + path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return r.json();
}

// DOM Elements
const userEmail = document.getElementById('userEmail');
const apiCallsUsed = document.getElementById('apiCallsUsed');
const remainingCalls = document.getElementById('remainingCalls');
const progressFill = document.getElementById('progressFill');
const limitWarning = document.getElementById('limitWarning');
const submitBtn = document.getElementById('submitBtn');
const aiCommand = document.getElementById('aiCommand');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');
const memberSince = document.getElementById('memberSince');
const activityList = document.getElementById('activityList');

// Check if user logged in
(async () => {
    const res = await get('/auth/main');
    if (!res.ok) {
        window.location = 'login.html';
        return;
    }

    // Set user info
    userEmail.textContent = res.user.email;

    const userData = {
        apiCallsUsed: res.user.apiCallsUsed || 0,
        createdAt: res.user.createdAt
    };

    updateStats(userData.apiCallsUsed);

    // Format member since date
    const date = new Date(userData.createdAt);
    memberSince.textContent = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
})();

// Update Stats Display
function updateStats(used) {
    const remaining = Math.max(0, 20 - used);
    const percentage = Math.min(100, (used / 20) * 100);

    apiCallsUsed.textContent = used;
    remainingCalls.textContent = remaining;
    progressFill.style.width = percentage + '%';

    if (used >= 20) {
        limitWarning.classList.remove('d-none');
    }
}

// Handle AI Command Submission
submitBtn.addEventListener('click', async () => {
    const input = aiCommand.value.trim();

    if (!input) {
        alert('Please enter a flight command');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    resultBox.classList.add('d-none');

    try {
        const response = await post('/api/ai/predict', { input });

        if (response.error) {
            alert('Error: ' + response.error);
            return;
        }

        resultContent.textContent = response.result || 'No result returned';
        resultBox.classList.remove('d-none');

        if (response.apiCallsUsed !== undefined) {
            updateStats(response.apiCallsUsed);
        }

        addActivity(input);

    } catch (error) {
        alert('Network error. Please try again.');
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>Execute Command';
    }
});

// Quick Command Buttons
document.querySelectorAll('.quick-cmd').forEach(btn => {
    btn.addEventListener('click', () => {
        aiCommand.value = btn.dataset.cmd;
    });
});

// Add activity to list
function addActivity(command) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const item = document.createElement('div');
    item.className = 'list-group-item';
    item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <p class="mb-0"><i class="bi bi-terminal me-2 text-primary"></i>${command}</p>
                    <small class="text-muted">${timeStr}</small>
                </div>
            `;

    if (activityList.firstChild.textContent.includes('No recent activity')) {
        activityList.innerHTML = '';
    }

    activityList.prepend(item);

    while (activityList.children.length > 5) {
        activityList.removeChild(activityList.lastChild);
    }
}

// Logout Handler
document.getElementById('logoutBtn').onclick = async () => {
    await post('/auth/logout');
    window.location = 'login.html';
};
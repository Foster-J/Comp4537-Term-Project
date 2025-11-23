const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://unsparked-unperturbedly-dahlia.ngrok-f';

// Templates
const templates = {
    reservation: {
        script: "Hi, my name is [Name] and I'd like to make a reservation at [Restaurant] for 4 people this Friday at 7 PM. Do you have any availability? Thank you!"
    },
    appointment: {
        script: "Hello, this is [Name]. I'm calling to schedule an appointment at [Business]. I'm available this week in the afternoons. What times do you have available? Thanks!"
    },
    inquiry: {
        script: "Hi, my name is [Name] and I'm calling [Business] to inquire about your services. Could you please provide me with more information about your hours and pricing? Thank you!"
    }
};
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
const callForm = document.getElementById('callForm');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');
const memberSince = document.getElementById('memberSince');
const recentCallsTable = document.getElementById('recentCallsTable');

// Check if user logged in
(async () => {
    const res = await get('/auth/main');
    if (!res.ok) {
        window.location = 'index.html';
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
callForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const callerName = document.getElementById('callerName').value.trim();
    const restaurantName = document.getElementById('restaurantName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const callScript = document.getElementById('callScript').value.trim();

    if (!callerName || !restaurantName || !phoneNumber || !callScript) {
        alert('Please fill in all fields');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    resultBox.classList.add('d-none');

    try {
        const response = await post('/api/ai/call', {
            callerName,
            restaurantName,
            phoneNumber,
            script: callScript
        });

        if (response.error) {
            alert('Error: ' + response.error);
            return;
        }

        resultContent.innerHTML = `
            <strong>Call Details:</strong><br>
            Restaurant: ${restaurantName}<br>
            Phone: ${phoneNumber}<br>
            Status: ${response.status || 'Initiated'}<br>
            ${response.message || 'AI is making the call now...'}
        `;
        resultBox.classList.remove('d-none');

        if (response.apiCallsUsed !== undefined) {
            updateStats(response.apiCallsUsed);
        }

        addRecentCall(restaurantName, phoneNumber);

        callForm.reset();

    } catch (error) {
        alert('Network error. Please try again.');
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>Make AI Phone Call';
    }
});

// Template Buttons
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const template = templates[btn.dataset.template];
        if (template) {
            document.getElementById('callScript').value = template.script;
        }
    });
});

// Clear Form
document.getElementById('clearForm').addEventListener('click', () => {
    callForm.reset();
});

// Load Recent Calls from Database
async function loadRecentCalls() {
    try {
        const response = await get('/api/user/call-history');
        if (response.ok && response.calls && response.calls.length > 0) {
            recentCallsTable.innerHTML = response.calls.map(call => `
                <tr>
                    <td>${new Date(call.created_at).toLocaleString()}</td>
                    <td>${call.restaurant_name}</td>
                    <td>${call.phone_number}</td>
                    <td><span class="badge bg-success">Completed</span></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading call history:', error);
    }
}

// Add Recent Call to table
function addRecentCall(restaurant, phone) {
    const now = new Date();
    const row = `
        <tr>
            <td>${now.toLocaleString()}</td>
            <td>${restaurant}</td>
            <td>${phone}</td>
            <td><span class="badge bg-success">Completed</span></td>
        </tr>
    `;

    if (recentCallsTable.firstChild.textContent.includes('No recent calls')) {
        recentCallsTable.innerHTML = '';
    }

    recentCallsTable.insertAdjacentHTML('afterbegin', row);
}

// Logout Handler
document.getElementById('logoutBtn').onclick = async () => {
    await post('/auth/logout');
    window.location = 'index.html';
};
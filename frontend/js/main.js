const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://comp4537-term-project-29ei.onrender.com';


// Initialize page text from strings file
document.addEventListener('DOMContentLoaded', () => {
    initializeStrings();
});

function initializeStrings() {
    // Navigation
    const navTitle = document.getElementById('navTitle');
    const logoutText = document.getElementById('logoutText');
    const userEmail = document.getElementById('userEmail');
    
    if (navTitle) navTitle.textContent = STRINGS.MAIN.NAV_TITLE;
    if (logoutText) logoutText.textContent = STRINGS.MAIN.NAV_LOGOUT;
    if (userEmail) userEmail.textContent = STRINGS.MAIN.USER_EMAIL_LOADING;
    
    // Form Section
    const formTitle = document.getElementById('formTitle');
    const labelYourName = document.getElementById('labelYourName');
    const labelRestaurantName = document.getElementById('labelRestaurantName');
    const labelPhoneNumber = document.getElementById('labelPhoneNumber');
    const labelCallScript = document.getElementById('labelCallScript');
    
    if (formTitle) formTitle.textContent = STRINGS.MAIN.FORM_TITLE;
    if (labelYourName) labelYourName.textContent = STRINGS.MAIN.LABEL_YOUR_NAME;
    if (labelRestaurantName) labelRestaurantName.textContent = STRINGS.MAIN.LABEL_RESTAURANT_NAME;
    if (labelPhoneNumber) labelPhoneNumber.textContent = STRINGS.MAIN.LABEL_PHONE_NUMBER;
    if (labelCallScript) labelCallScript.textContent = STRINGS.MAIN.LABEL_CALL_SCRIPT;
    
    // Placeholders
    const callerName = document.getElementById('callerName');
    const restaurantName = document.getElementById('restaurantName');
    const phoneNumber = document.getElementById('phoneNumber');
    const callScript = document.getElementById('callScript');
    
    if (callerName) callerName.placeholder = STRINGS.MAIN.PLACEHOLDER_NAME;
    if (restaurantName) restaurantName.placeholder = STRINGS.MAIN.PLACEHOLDER_RESTAURANT;
    if (phoneNumber) phoneNumber.placeholder = STRINGS.MAIN.PLACEHOLDER_PHONE;
    if (callScript) callScript.placeholder = STRINGS.MAIN.PLACEHOLDER_SCRIPT;
    
    // Help text
    const helpPhone = document.getElementById('helpPhone');
    const helpScript = document.getElementById('helpScript');
    
    if (helpPhone) helpPhone.textContent = STRINGS.MAIN.HELP_PHONE;
    if (helpScript) helpScript.textContent = STRINGS.MAIN.HELP_SCRIPT;
    
    // Buttons
    const submitBtnText = document.getElementById('submitBtnText');
    if (submitBtnText) submitBtnText.textContent = STRINGS.MAIN.BUTTON_SUBMIT;
    
    // Progress Bar
    const progressTitle = document.getElementById('progressTitle');
    if (progressTitle) progressTitle.textContent = STRINGS.MAIN.PROGRESS_TITLE;
    
    // Result
    const resultTitle = document.getElementById('resultTitle');
    if (resultTitle) resultTitle.textContent = STRINGS.MAIN.RESULT_SUCCESS_TITLE;
    
    // Tips
    const tipsTitle = document.getElementById('tipsTitle');
    const tip1 = document.getElementById('tip1');
    const tip2 = document.getElementById('tip2');
    const tip3 = document.getElementById('tip3');
    const tip4 = document.getElementById('tip4');
    const tip5 = document.getElementById('tip5');
    
    if (tipsTitle) tipsTitle.textContent = STRINGS.MAIN.TIPS_TITLE;
    if (tip1) tip1.textContent = STRINGS.MAIN.TIP_1;
    if (tip2) tip2.textContent = STRINGS.MAIN.TIP_2;
    if (tip3) tip3.textContent = STRINGS.MAIN.TIP_3;
    if (tip4) tip4.textContent = STRINGS.MAIN.TIP_4;
    if (tip5) tip5.textContent = STRINGS.MAIN.TIP_5;
    
    // Templates
    const templatesTitle = document.getElementById('templatesTitle');
    const templateReservation = document.getElementById('templateReservation');
    const templateAppointment = document.getElementById('templateAppointment');
    const templateInquiry = document.getElementById('templateInquiry');
    const clearForm = document.getElementById('clearForm');
    
    if (templatesTitle) templatesTitle.textContent = STRINGS.MAIN.TEMPLATES_TITLE;
    if (templateReservation) templateReservation.textContent = STRINGS.MAIN.TEMPLATE_RESERVATION;
    if (templateAppointment) templateAppointment.textContent = STRINGS.MAIN.TEMPLATE_APPOINTMENT;
    if (templateInquiry) templateInquiry.textContent = STRINGS.MAIN.TEMPLATE_INQUIRY;
    if (clearForm) clearForm.textContent = STRINGS.MAIN.BUTTON_CLEAR_FORM;
    
    // Recent Calls
    const recentCallsTitle = document.getElementById('recentCallsTitle');
    const tableHeaderTime = document.getElementById('tableHeaderTime');
    const tableHeaderRestaurant = document.getElementById('tableHeaderRestaurant');
    const tableHeaderPhone = document.getElementById('tableHeaderPhone');
    const tableHeaderStatus = document.getElementById('tableHeaderStatus');
    const tableNoCalls = document.getElementById('tableNoCalls');
    
    if (recentCallsTitle) recentCallsTitle.textContent = STRINGS.MAIN.RECENT_CALLS_TITLE;
    if (tableHeaderTime) tableHeaderTime.textContent = STRINGS.MAIN.TABLE_HEADER_TIME;
    if (tableHeaderRestaurant) tableHeaderRestaurant.textContent = STRINGS.MAIN.TABLE_HEADER_RESTAURANT;
    if (tableHeaderPhone) tableHeaderPhone.textContent = STRINGS.MAIN.TABLE_HEADER_PHONE;
    if (tableHeaderStatus) tableHeaderStatus.textContent = STRINGS.MAIN.TABLE_HEADER_STATUS;
    if (tableNoCalls) tableNoCalls.textContent = STRINGS.MAIN.TABLE_NO_CALLS;
}

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
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const limitWarning = document.getElementById('limitWarning');
const submitBtn = document.getElementById('submitBtn');
const callForm = document.getElementById('callForm');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');
const memberSince = document.getElementById('memberSince');
const recentCallsTable = document.getElementById('recentCallsTable');

// Update progress bar with API usage stats
async function updateProgressBar() {
    try {
        const statsRes = await get('/api/user/stats');
        
        if (statsRes.ok && statsRes.stats) {
            const stats = statsRes.stats;
            const used = stats.apiCallsUsed || 0;
            const remaining = stats.freeCallsRemaining || 0;
            
            // Calculate usage percentage
            const usagePercent = Math.min(Math.round((used / 20) * 100), 100);
            
            // Update progress text if element exists
            if (progressText) {
                progressText.textContent = `${used} / 20 calls`;
            }
            
            // Update progress bar if element exists
            if (progressBar) {
                progressBar.style.width = usagePercent + '%';
                progressBar.textContent = usagePercent + '%';
                progressBar.setAttribute('aria-valuenow', usagePercent);
                
                // Set progress bar color based on usage
                progressBar.className = 'progress-bar';
                if (usagePercent >= 100) {
                    progressBar.classList.add('bg-danger');
                } else if (usagePercent >= 80) {
                    progressBar.classList.add('bg-warning');
                } else if (usagePercent >= 50) {
                    progressBar.classList.add('bg-info');
                } else {
                    progressBar.classList.add('bg-success');
                }
            }

            // Update old stats format (for backward compatibility)
            if (apiCallsUsed) {
                apiCallsUsed.textContent = used;
            }
            if (remainingCalls) {
                remainingCalls.textContent = remaining;
            }
            if (progressFill) {
                progressFill.style.width = usagePercent + '%';
            }

            // Show warning if over limit
            if (limitWarning && used >= 20) {
                limitWarning.classList.remove('d-none');
            }

            return { used, remaining, usagePercent };
        }
    } catch (error) {
        console.error('Failed to load API stats:', error);
    }
}

// Update Stats Display (legacy function - now calls updateProgressBar)
async function updateStats(used) {
    // Use the new API-based update instead
    await updateProgressBar();
}

// Check if user logged in
(async () => {
    const res = await get('/auth/main');
    if (!res.ok) {
        window.location = 'index.html';
        return;
    }

    userEmail.textContent = res.user.email;

    // Update progress bar with real API stats
    await updateProgressBar();

    // Load call history
    loadRecentCalls();

    // Set member since date
    if (memberSince && res.user.createdAt) {
        const date = new Date(res.user.createdAt);
        memberSince.textContent = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
})();

// Handle AI Phone Call Submission → goes through backend, which calls hosted LLM
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
        // Send data to backend; backend will call the hosted LLM
        const response = await post('/api/ai/call', {
            callerName,
            restaurantName,
            phoneNumber,
            script: callScript
        });

        console.log('API /api/ai/call response:', response);
        console.log('AI script from backend:', response.aiScript);

        if (!response.ok) {
            alert('Error: ' + (response.error || 'Unknown error'));
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-send me-2"></i>Make AI Phone Call';
            return;
        }

        // Show AI-generated call script / status
        resultContent.innerHTML = `
            <strong>Call Details:</strong><br>
            Restaurant: ${restaurantName}<br>
            Phone: ${phoneNumber}<br>
            Status: ${response.status || 'Completed'}<br>
            <br>
            <strong>AI Call Script:</strong><br>
            ${response.aiScript || response.message || 'No script returned'}
        `;
        resultBox.classList.remove('d-none');

        // Update progress bar after successful call
        await updateProgressBar();

        // Update recent calls table
        addRecentCall(restaurantName, phoneNumber);

        // Clear form on success
        callForm.reset();

    } catch (error) {
        alert('Network error. Please try again.');
        console.error('Error calling /api/ai/call:', error);
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
const clearFormBtn = document.getElementById('clearForm');
if (clearFormBtn) {
    clearFormBtn.addEventListener('click', () => {
        callForm.reset();
    });
}

// Load Recent Calls from Database
async function loadRecentCalls() {
    try {
        const response = await get('/api/user/call-history');
        if (response.ok && response.calls && response.calls.length > 0) {
            if (recentCallsTable) {
                recentCallsTable.innerHTML = response.calls.map(call => `
                    <tr>
                        <td>${new Date(call.created_at).toLocaleString()}</td>
                        <td>${call.restaurant_name}</td>
                        <td>${call.phone_number}</td>
                        <td><span class="badge bg-success">${call.status || 'Completed'}</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading call history:', error);
    }
}

// Add Recent Call to table
function addRecentCall(restaurant, phone) {
    if (!recentCallsTable) return;

    const now = new Date();
    const row = `
        <tr>
            <td>${now.toLocaleString()}</td>
            <td>${restaurant}</td>
            <td>${phone}</td>
            <td><span class="badge bg-success">Completed</span></td>
        </tr>
    `;

    if (recentCallsTable.firstChild && recentCallsTable.firstChild.textContent.includes('No recent calls')) {
        recentCallsTable.innerHTML = '';
    }

    recentCallsTable.insertAdjacentHTML('afterbegin', row);
}

// Logout Handler
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await post('/auth/logout');
        window.location = 'index.html';
    };
}
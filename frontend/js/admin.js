
const API = 'http://localhost:3000';

// API Helper Functions
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
const adminEmail = document.getElementById('adminEmail');
const totalUsers = document.getElementById('totalUsers');
const totalApiCalls = document.getElementById('totalApiCalls');
const activeUsers = document.getElementById('activeUsers');
const usersOverLimit = document.getElementById('usersOverLimit');
const usersTableBody = document.getElementById('usersTableBody');
const searchInput = document.getElementById('searchInput');
const loadingSpinner = document.getElementById('loadingSpinner');
const usersTableContainer = document.getElementById('usersTableContainer');
const topUsersList = document.getElementById('topUsersList');

let allUsers = [];

// Check Admin Access
(async () => {
    const res = await get('/auth/main');
    if (!res.ok) {
        window.location = 'login.html';
        return;
    }

    // Check if user is admin
    if (res.user.role !== 'admin') {
        alert('Access Denied: Admin privileges required');
        window.location = 'main.html';
        return;
    }

    adminEmail.textContent = res.user.email;
    await loadDashboardData();
})();

// Load All Dashboard Data
async function loadDashboardData() {
    loadingSpinner.classList.remove('d-none');
    usersTableContainer.classList.add('d-none');

    try {
        // Get system stats
        const statsRes = await get('/api/admin/stats');
        if (statsRes.ok) {
            updateSystemStats(statsRes.stats);
        }

        // Get all users
        const usersRes = await get('/api/admin/users');
        if (usersRes.ok) {
            allUsers = usersRes.users;
            displayUsers(allUsers);
            updateUserDistribution(allUsers);
            displayTopUsers(allUsers);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard data');
    } finally {
        loadingSpinner.classList.add('d-none');
        usersTableContainer.classList.remove('d-none');
    }
}

// Update System Stats
function updateSystemStats(stats) {
    totalUsers.textContent = stats.totalUsers;
    totalApiCalls.textContent = stats.totalApiCalls;
    activeUsers.textContent = stats.activeUsers;
    usersOverLimit.textContent = stats.usersOverLimit;
}

// Display Users in Table
function displayUsers(users) {
    if (users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No users found</td></tr>';
        return;
    }

    usersTableBody.innerHTML = users.map(user => {
        const createdDate = new Date(user.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const lastLoginDate = user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
            : 'Never';

        const statusBadge = user.apiCallsUsed > 20
            ? '<span class="badge bg-warning">Over Limit</span>'
            : '<span class="badge bg-success">Active</span>';

        const roleBadge = user.role === 'admin'
            ? '<span class="badge bg-danger">Admin</span>'
            : '<span class="badge bg-primary">User</span>';

        return `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.email}</td>
                        <td>${roleBadge}</td>
                        <td>
                            <span class="${user.apiCallsUsed > 20 ? 'text-warning fw-bold' : ''}">
                                ${user.apiCallsUsed}
                            </span>
                        </td>
                        <td>${createdDate}</td>
                        <td>${lastLoginDate}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
    }).join('');
}

// Update User Distribution Stats
function updateUserDistribution(users) {
    const regularUsers = users.filter(u => u.role === 'user').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const avgCalls = users.length > 0
        ? Math.round(users.reduce((sum, u) => sum + u.apiCallsUsed, 0) / users.length)
        : 0;
    const overLimitCount = users.filter(u => u.apiCallsUsed > 20).length;
    const overLimitPercent = users.length > 0
        ? Math.round((overLimitCount / users.length) * 100)
        : 0;

    document.getElementById('regularUsersCount').textContent = regularUsers;
    document.getElementById('adminUsersCount').textContent = adminUsers;
    document.getElementById('avgApiCalls').textContent = avgCalls;
    document.getElementById('limitExceededPercent').textContent = overLimitPercent + '%';
}

// Display Top API Users
function displayTopUsers(users) {
    const sortedUsers = [...users]
        .sort((a, b) => b.apiCallsUsed - a.apiCallsUsed)
        .slice(0, 5);

    if (sortedUsers.length === 0) {
        topUsersList.innerHTML = '<p class="text-muted text-center">No users yet</p>';
        return;
    }

    topUsersList.innerHTML = sortedUsers.map((user, index) => {
        const percentage = Math.min(100, (user.apiCallsUsed / 20) * 100);
        return `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <strong>#${index + 1}</strong> ${user.firstName} ${user.lastName}
                                <br>
                                <small class="text-muted">${user.email}</small>
                            </div>
                            <span class="badge bg-primary rounded-pill">${user.apiCallsUsed} calls</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar ${user.apiCallsUsed > 20 ? 'bg-warning' : ''}" 
                                 style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
    }).join('');
}

// Search Functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredUsers = allUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm) ||
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
});

// Refresh Button
document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadDashboardData();
});

// Logout
document.getElementById('logoutBtn').onclick = async () => {
    await post('/auth/logout');
    window.location = 'login.html';
};
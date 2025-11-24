// admin.js - Complete Admin Dashboard JavaScript

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://comp4537-term-project-29ei.onrender.com';

// Helper functions
async function get(path) {
    const r = await fetch(API + path, {
        method: 'GET',
        credentials: 'include'
    });
    return r.json();
}

async function post(path, body = {}) {
    const r = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
    });
    return r.json();
}

// Load admin dashboard data
async function loadDashboard() {
    try {
        // Load system stats
        const statsRes = await get('/api/admin/stats');
        if (statsRes.ok) {
            document.getElementById('totalUsers').textContent = statsRes.stats.totalUsers;
            document.getElementById('totalApiCalls').textContent = statsRes.stats.totalApiCalls;
            document.getElementById('activeUsers').textContent = statsRes.stats.activeUsers;
            document.getElementById('usersOverLimit').textContent = statsRes.stats.usersOverLimit;
        }

        // Load users list
        await loadUsers();

        // Load endpoint statistics
        await loadEndpointStats();

    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Load users table
async function loadUsers() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const usersTableBody = document.getElementById('usersTableBody');

    loadingSpinner.classList.remove('d-none');

    try {
        const res = await get('/api/admin/users');
        
        if (res.ok && res.users) {
            usersTableBody.innerHTML = '';

            if (res.users.length === 0) {
                usersTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-muted">No users found</td>
                    </tr>
                `;
                return;
            }

            res.users.forEach(user => {
                const row = document.createElement('tr');
                const statusBadge = user.apiCallsUsed > 20 
                    ? '<span class="badge bg-warning">Over Limit</span>'
                    : '<span class="badge bg-success">Active</span>';
                
                const roleBadge = user.role === 'admin'
                    ? '<span class="badge bg-danger">Admin</span>'
                    : '<span class="badge bg-primary">User</span>';

                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>${roleBadge}</td>
                    <td><span class="badge bg-info">${user.apiCallsUsed}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>${statusBadge}</td>
                `;
                usersTableBody.appendChild(row);
            });

            // Calculate user distribution stats
            const regularUsers = res.users.filter(u => u.role === 'user').length;
            const adminUsers = res.users.filter(u => u.role === 'admin').length;
            const avgCalls = res.users.length > 0 
                ? Math.round(res.users.reduce((sum, u) => sum + u.apiCallsUsed, 0) / res.users.length)
                : 0;
            const overLimitCount = res.users.filter(u => u.apiCallsUsed > 20).length;
            const overLimitPercent = res.users.length > 0 
                ? Math.round((overLimitCount / res.users.length) * 100)
                : 0;

            document.getElementById('regularUsersCount').textContent = regularUsers;
            document.getElementById('adminUsersCount').textContent = adminUsers;
            document.getElementById('avgApiCalls').textContent = avgCalls;
            document.getElementById('limitExceededPercent').textContent = overLimitPercent + '%';

            // Update top users list
            const topUsers = [...res.users]
                .sort((a, b) => b.apiCallsUsed - a.apiCallsUsed)
                .slice(0, 5);

            const topUsersList = document.getElementById('topUsersList');
            topUsersList.innerHTML = '';

            topUsers.forEach((user, index) => {
                const item = document.createElement('div');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    <div>
                        <span class="badge bg-secondary me-2">#${index + 1}</span>
                        <strong>${user.email}</strong>
                    </div>
                    <span class="badge bg-primary rounded-pill">${user.apiCallsUsed} calls</span>
                `;
                topUsersList.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">Failed to load users</td>
            </tr>
        `;
    } finally {
        loadingSpinner.classList.add('d-none');
    }
}

// Load endpoint statistics
async function loadEndpointStats() {
    try {
        const res = await get('/api/admin/endpoint-stats');
        
        if (res.ok && res.endpoints) {
            const endpointTableBody = document.getElementById('endpointStatsTableBody');
            
            if (!endpointTableBody) {
                console.warn('Endpoint stats table body not found');
                return;
            }

            endpointTableBody.innerHTML = '';

            if (res.endpoints.length === 0) {
                endpointTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">No endpoint data available</td>
                    </tr>
                `;
                return;
            }

            res.endpoints.forEach(endpoint => {
                const row = document.createElement('tr');
                
                // Method badge color
                let methodBadge = '';
                switch(endpoint.method) {
                    case 'GET':
                        methodBadge = '<span class="badge bg-success">GET</span>';
                        break;
                    case 'POST':
                        methodBadge = '<span class="badge bg-primary">POST</span>';
                        break;
                    case 'PUT':
                        methodBadge = '<span class="badge bg-warning">PUT</span>';
                        break;
                    case 'DELETE':
                        methodBadge = '<span class="badge bg-danger">DELETE</span>';
                        break;
                    default:
                        methodBadge = `<span class="badge bg-secondary">${endpoint.method}</span>`;
                }

                row.innerHTML = `
                    <td>${methodBadge}</td>
                    <td><code>${endpoint.endpoint}</code></td>
                    <td><strong>${endpoint.requestCount.toLocaleString()}</strong></td>
                    <td><small class="text-muted">${new Date(endpoint.lastAccessed).toLocaleString()}</small></td>
                `;
                endpointTableBody.appendChild(row);
            });

            // Update total requests counter
            const totalRequests = res.endpoints.reduce((sum, e) => sum + e.requestCount, 0);
            const totalRequestsEl = document.getElementById('totalEndpointRequests');
            if (totalRequestsEl) {
                totalRequestsEl.textContent = totalRequests.toLocaleString();
            }
        }
    } catch (error) {
        console.error('Failed to load endpoint stats:', error);
        const endpointTableBody = document.getElementById('endpointStatsTableBody');
        if (endpointTableBody) {
            endpointTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">Failed to load endpoint statistics</td>
                </tr>
            `;
        }
    }
}

// Search functionality
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Refresh button
document.getElementById('refreshBtn')?.addEventListener('click', () => {
    loadDashboard();
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await post('/auth/logout');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
});

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
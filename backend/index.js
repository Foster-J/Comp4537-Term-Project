require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const db = require('./databaseConnection');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5500',
    credentials: true
}));

const JWT_SECRET = process.env.JWT_SECRET;

// -----------------------------------------
// Initialize database and seed default users
// -----------------------------------------
async function initDb() {
    await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user','admin') NOT NULL DEFAULT 'user',
      api_calls_used INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL DEFAULT NULL
    ) ENGINE=InnoDB;
  `);

    // Seed the two demo accounts if missing
    const [rows] = await db.query(
        `SELECT email FROM users WHERE email IN ('gugu@gugu.com','admin@admin.com')`
    );
    const have = new Set(rows.map(r => r.email));

    if (!have.has('gugu@gugu.com')) {
        const h = await bcrypt.hash('123', 10);
        await db.query(
            `INSERT INTO users (email, password_hash, role)
       VALUES (?, ?, 'user')`,
            ['gugu@gugu.com', h]
        );
    }
    if (!have.has('admin@admin.com')) {
        const h = await bcrypt.hash('111', 10);
        await db.query(
            `INSERT INTO users (email, password_hash, role)
       VALUES (?, ?, 'admin')`,
            ['admin@admin.com', h]
        );
    }
}

initDb()
    .then(() => console.log('DB ready'))
    .catch(err => { console.error('DB init failed:', err); process.exit(1); });

// -----------------------------------------
// Helper functions
// -----------------------------------------

// sign a JWT token
function sign(user) {
    return jwt.sign(
        { uid: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

// Get user by ID from DB
async function getUserById(id) {
    const [rows] = await db.query(
        `SELECT id, email, role, api_calls_used, created_at, last_login
       FROM users WHERE id = ? LIMIT 1`,
        [id]
    );
    if (!rows[0]) return null;
    const u = rows[0];
    return {
        id: u.id,
        email: u.email,
        role: u.role,
        apiCallsUsed: u.api_calls_used,
        createdAt: u.created_at,
        lastLogin: u.last_login
    };
}

// -----------------------------------------
// Authentication middleware
// -----------------------------------------

// check if token exists and is valid 
function auth(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'invalid' });
    }
}

// Check if user is admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// -----------------------------------------
// AUTH ROUTES
// -----------------------------------------

// Register new user
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }
        // Password minimum length check disabled for testing purposes.
        // To re-enable, either restore the check below or use an env flag
        // e.g. if (process.env.ENFORCE_PASSWORD_MIN === 'true' && password.length < 8) { ... }
        // if (password.length < 8) {
        //     return res.status(400).json({ error: 'Password must be at least 8 characters' });
        // }

        // Already exists?
        const [exists] = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
        if (exists.length) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Create new user
        const passHash = await bcrypt.hash(password, 10);
        await db.query(
            `INSERT INTO users (email, password_hash, role, api_calls_used, created_at, last_login)
       VALUES (?, ?, 'user', 0, NOW(), NULL)`,
            [email, passHash]
        );

        res.status(201).json({ ok: true, message: 'Registration successful' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const [rows] = await db.query(
            `SELECT id, email, password_hash, role
         FROM users WHERE email = ? LIMIT 1`,
            [email]
        );
        const userRow = rows[0];
        if (!userRow) return res.status(401).json({ error: 'bad creds' });

        const ok = await bcrypt.compare(password, userRow.password_hash);
        if (!ok) return res.status(401).json({ error: 'bad creds' });

        // Update last login
        await db.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [userRow.id]);

        const token = sign({ id: userRow.id, role: userRow.role, email: userRow.email });

        // Send cookie to browser
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 1000
        });

        res.json({
            ok: true,
            user: {
                email: userRow.email,
                role: userRow.role
            },
            // Redirect based on user role
            redirectTo: userRow.role === 'admin' ? 'admin.html' : 'main.html'
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/auth/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    });
    res.json({ ok: true });
});

// Get user dashboard data (protected)
app.get('/auth/main', auth, async (req, res) => {
    try {
        const user = await getUserById(req.user.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            ok: true,
            user: {
                email: user.email,
                role: user.role,
                apiCallsUsed: user.apiCallsUsed,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});

/* API ROUTES */

// Get user's API usage stats (protected)
app.get('/api/user/stats', auth, async (req, res) => {
    try {
        const user = await getUserById(req.user.uid);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            ok: true,
            stats: {
                apiCallsUsed: user.apiCallsUsed,
                freeCallsRemaining: Math.max(0, 20 - user.apiCallsUsed),
                exceededLimit: user.apiCallsUsed > 20,
                createdAt: user.createdAt
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/* ADMIN ROUTES */

// Get all users (admin only)
app.get('/api/admin/users', auth, isAdmin, async (_req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, email, role, api_calls_used, created_at, last_login
         FROM users
         ORDER BY api_calls_used DESC, id ASC`
        );
        const users = rows.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,
            apiCallsUsed: u.api_calls_used,
            createdAt: u.created_at,
            lastLogin: u.last_login
        }));
        res.json({ ok: true, users });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to list users' });
    }
});

// Get system stats (admin only)
app.get('/api/admin/stats', auth, isAdmin, async (_req, res) => {
    try {
        const [[tot]] = await db.query(`SELECT COUNT(*) AS total_users FROM users`);
        const [[sum]] = await db.query(`SELECT COALESCE(SUM(api_calls_used),0) AS total_api_calls FROM users`);
        const [[active]] = await db.query(`SELECT COUNT(*) AS active_users FROM users WHERE last_login IS NOT NULL`);
        const [[over]] = await db.query(`SELECT COUNT(*) AS users_over_limit FROM users WHERE api_calls_used > 20`);

        res.json({
            ok: true,
            stats: {
                totalUsers: Number(tot.total_users || 0),
                totalApiCalls: Number(sum.total_api_calls || 0),
                activeUsers: Number(active.active_users || 0),
                usersOverLimit: Number(over.users_over_limit || 0)
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/* SERVER */
app.listen(3000, () => console.log('API running on http://localhost:3000'));

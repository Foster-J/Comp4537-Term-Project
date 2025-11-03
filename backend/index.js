const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:5500',
    credentials: true
}));

const JWT_SECRET = process.env.JWT_SECRET;

// Make sure we add this to a db later. Right now just to test if Auth works.
const users = new Map([
    ['gugu@gugu.com', {
        id: 1,
        email: 'gugu@gugu.com',
        passHash: bcrypt.hashSync('123', 10),
        role: 'user'
    }],
    ['admin@admin.com', {
        id: 2,
        email: 'admin@admin.com',
        passHash: bcrypt.hashSync('111', 10),
        role: 'admin'
    }]
]);

/* Helpers */////////

// sign a JWT token
function sign(user) {
    return jwt.sign(
        { uid: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

/* Middleware */////////

// Get user by ID
function getUserById(id) {
    for (let [email, user] of users) {
        if (user.id === id) return user;
    }
    return null;
}

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

/* ROUTES */////////

app.post('/auth/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Check if user already exists
    if (users.has(email)) {
        return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const newUser = {
        id: users.size + 1,
        firstName,
        lastName,
        email,
        passHash: await bcrypt.hash(password, 10),
        role: 'user',
        apiCallsUsed: 0,
        createdAt: new Date(),
        lastLogin: null
    };
    
    users.set(email, newUser);
    
    res.status(201).json({ 
        ok: true, 
        message: 'Registration successful' 
    });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    const user = users.get(email);
    if (!user || !(await bcrypt.compare(password, user.passHash))) {
        return res.status(401).json({ error: 'bad creds' });
    }

    //Update last login
    user.lastLogin = new Date();

    const token = sign(user);

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
            firstName: user.firstName,
            email: user.email,
            role: user.role
        },

        //Redirect based on user role
        redirectTo: user.role === 'admin' ? 'admin.html' : 'main.html'
     });
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

// Pass in auth fucntion to make sure only authorized users can access.
// Get user dashboard data
app.get('/auth/main', auth, (req, res) => {
    const user = getUserById(req.user.uid);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
        ok: true, 
        user: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            apiCallsUsed: user.apiCallsUsed,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        }
    });
});

/* API ROUTES */

// Get user's API usage stats
app.get('/api/user/stats', auth, (req, res) => {
    const user = getUserById(req.user.uid);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        ok: true,
        stats: {
            apiCallsUsed: user.apiCallsUsed,
            freeCallsRemaining: Math.max(0, 20 - user.apiCallsUsed),
            exceededLimit: user.apiCallsUsed > 20,
            createdAt: user.createdAt
        }
    });
});

/* ADMIN ROUTES */

// Get all users (admin only)
app.get('/api/admin/users', auth, isAdmin, (req, res) => {
    const allUsers = Array.from(users.values()).map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        apiCallsUsed: user.apiCallsUsed,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
    }));

    res.json({
        ok: true,
        users: allUsers
    });
});

// Get system stats (admin only)
app.get('/api/admin/stats', auth, isAdmin, (req, res) => {
    const allUsers = Array.from(users.values());
    
    const stats = {
        totalUsers: allUsers.length,
        totalApiCalls: allUsers.reduce((sum, user) => sum + user.apiCallsUsed, 0),
        activeUsers: allUsers.filter(user => user.lastLogin).length,
        usersOverLimit: allUsers.filter(user => user.apiCallsUsed > 20).length
    };

    res.json({
        ok: true,
        stats
    });
});


/* SERVER*/
app.listen(3000, () => console.log('API running on http://localhost:3000'));

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

/* ROUTES */////////

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    const user = users.get(email);
    if (!user || !(await bcrypt.compare(password, user.passHash))) {
        return res.status(401).json({ error: 'bad creds' });
    }

    const token = sign(user);

    // Send cookie to browser
    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 1000
    });

    res.json({ ok: true });
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
app.get('/auth/main', auth, (req, res) => {
    res.json({ ok: true, user: req.user });
});

app.listen(3000, () => console.log('API running on http://localhost:3000'));

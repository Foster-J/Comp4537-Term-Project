require('dotenv').config();
const twilio = require('twilio');

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');
const db = require('./databaseConnection');

const app = express();
app.use(express.json());
app.use(cookieParser());

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const isDevelopment = process.env.NODE_ENV !== 'production';
console.log(`Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} `);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, mobile apps, etc.)
        if (!origin) return callback(null, true);

        console.log('🔍 Request from:', origin);

        // DEVELOPMENT MODE: Allow all HTTP origins
        if (isDevelopment && origin.startsWith('http://')) {
            console.log('Allowed (dev):', origin);
            return callback(null, true);
        }

        // PRODUCTION MODE: Whitelist only
        const productionOrigins = [
            'https://helpful-froyo-497ae3.netlify.app'
        ];

        if (productionOrigins.includes(origin)) {
            console.log('Allowed (prod):', origin);
            return callback(null, true);
        }

        console.log('CORS Blocked:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
}));

// Handle preflight requests for all routes
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
        return res.sendStatus(200);
    }
    next();
});

const JWT_SECRET = process.env.JWT_SECRET;

// Hosted LLM config – set these in .env
// LLM_URL=https://llm.comp4537.com
// LLM_API_TOKEN=super_secret_token_123456
const LLM_URL = process.env.LLM_URL || 'https://llm.comp4537.com';
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;

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

    await db.query(`
    CREATE TABLE IF NOT EXISTS call_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      caller_name VARCHAR(255) NOT NULL,
      restaurant_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50) NOT NULL,
      script TEXT NOT NULL,
      status ENUM('pending','completed','failed') DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
`);

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

function sign(user) {
    return jwt.sign(
        { uid: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

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

function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// -----------------------------------------
// AUTH ROUTES
// -----------------------------------------

app.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const [exists] = await db.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
        if (exists.length) {
            return res.status(409).json({ error: 'Email already registered' });
        }

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

        await db.query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [userRow.id]);

        const token = sign({ id: userRow.id, role: userRow.role, email: userRow.email });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 60 * 60 * 1000
        });

        res.json({
            ok: true,
            user: {
                email: userRow.email,
                role: userRow.role
            },
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
        secure: true,
        sameSite: 'none',
        path: '/'
    });
    res.json({ ok: true });
});

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

app.post('/api/ai/call', auth, async (req, res) => {
    const { callerName, restaurantName, phoneNumber, script } = req.body;
    const newApiCount = user.apiCallsUsed + 1;

    try {
        if (!LLM_API_TOKEN) {
            console.error('LLM_API_TOKEN is not set');
            return res.status(500).json({ error: 'LLM server not configured' });
        }

        const inputPrompt =
            `You are calling a restaurant on behalf of a client to place an order. ` +
            `Speak casually. Your job is to introduce yourself as an AI bot from the Company UpScaling, ` +
            `explain that you are calling on behalf of the client, state the client’s name and order clearly, ` +
            `but do not request confirmation. Do NOT output JSON in your answer. Do NOT mention JSON. ` +
            `Just speak as if you are making the call. ` +
            `Here is the order data you should use (this is for you, the AI, and should NOT be repeated as JSON in your answer): ` +
            `{ "client": "${callerName}", "restaurant": "${restaurantName}", "order": "${script}" }`;

        const llmResponse = await axios.post(
            `${LLM_URL}/chat`,
            { input: inputPrompt },
            {
                headers: {
                    Authorization: `Bearer ${LLM_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        const aiOutput = llmResponse.data.output || '';

        // >>> LOG HERE <<<
        console.log('LLM raw response:', llmResponse.data);
        console.log('LLM generated script:', aiOutput);


        if (!callerName || !restaurantName || !phoneNumber || !script) {
            return res.status(400).json({ error: 'All fields required' });
        }

        const user = await getUserById(req.user.uid);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await db.query(`UPDATE users SET api_calls_used = api_calls_used + 1 WHERE id = ?`, [user.id]);

        try {
            // TODO: Call AI model / Twilio / phone service here
            // Example: const result = await makeAICall(phoneNumber, script);

            // Save to database
            await db.query(
                `INSERT INTO call_history (user_id, caller_name, restaurant_name, phone_number, script, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'completed', NOW())`,
                [user.id, callerName, restaurantName, phoneNumber, aiOutput || script]
            );

            res.json({
                ok: true,
                status: 'Completed',
                message: 'AI call script generated and saved to your history.',
                aiScript: aiOutput,
                apiCallsUsed: newApiCount,
                freeCallsRemaining: Math.max(0, 20 - newApiCount)
            });

        } catch (error) {
            console.error('AI Call Error:', error.response?.data || error.message);
            res.status(500).json({ error: 'Failed to generate AI call script' });
        }
    });


// Get user's call history
app.get('/api/user/call-history', auth, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, caller_name, restaurant_name, phone_number, script, status, created_at
             FROM call_history 
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 10`,
            [req.user.uid]
        );


        res.json({
            ok: true,
            calls: rows
        });
    } catch (error) {
        console.error('Error fetching call history:', error);
        res.status(500).json({ error: 'Failed to fetch call history' });
    }
});

/* ADMIN ROUTES */

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

// Generic AI chat endpoint (optional, uses same hosted LLM)
app.post('/api/ai/chat', auth, async (req, res) => {
    try {
        const { input } = req.body;

        if (!input) {
            return res.status(400).json({ error: 'input is required' });
        }

        if (!LLM_API_TOKEN) {
            console.error('LLM_API_TOKEN is not set');
            return res.status(500).json({ error: 'LLM server not configured' });
        }

        const response = await axios.post(
            `${LLM_URL}/chat`,
            { input },
            {
                headers: {
                    Authorization: `Bearer ${LLM_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        const aiOutput = response.data.output;

        return res.json({
            ok: true,
            output: aiOutput
        });
    } catch (e) {
        console.error('AI chat failed:', e.response?.data || e.message);
        return res.status(500).json({ error: 'AI server error' });
    }
});


async function makeTTSCall(phoneNumber, text) {
    try {
        const call = await twilioClient.calls.create({
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `${process.env.PUBLIC_URL}/twilio/say?text=${encodeURIComponent(text)}`
        });

        console.log("📞 Call SID:", call.sid);
        return call.sid;

    } catch (err) {
        console.error("❌ Twilio Error:", err);
        throw err;
    }
}

app.post("/twilio/say", (req, res) => {
    const text = req.query.text || "Hello, this is an AI call.";

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    twiml.say({
        voice: "Polly.Joanna",     // High-quality TTS
        language: "en-US"
    }, text);

    res.type("text/xml").send(twiml.toString());
});



/* SERVER */
app.listen(3000, () => console.log('API running on http://localhost:3000'));
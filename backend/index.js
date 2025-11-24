require('dotenv').config();
const twilio = require('twilio');

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const axios = require('axios');
const db = require('./databaseConnection');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());
app.use(cookieParser());

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'COMP4537 Term Project API',
            version: '1.0.0',
            description: 'Swagger auto-generated API docs'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local dev server'
            }
        ]
    },
    apis: ['./index.js'], // important!
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', (req, res, next) => {
    console.log('🔥 /api-docs hit:', req.method, req.url);
    next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

    await db.query(`
    CREATE TABLE IF NOT EXISTS endpoint_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        method VARCHAR(10) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        request_count INT NOT NULL DEFAULT 0,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_endpoint (method, endpoint)
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

// Track all API endpoint usage
app.use(async (req, res, next) => {
    // Track endpoint after response is sent
    res.on('finish', async () => {
        // Only track API endpoints (skip static files, OPTIONS, etc.)
        if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
            try {
                await db.query(`
                    INSERT INTO endpoint_stats (method, endpoint, request_count, last_accessed)
                    VALUES (?, ?, 1, NOW())
                    ON DUPLICATE KEY UPDATE 
                        request_count = request_count + 1,
                        last_accessed = NOW()
                `, [req.method, req.path]);
            } catch (err) {
                console.error('Failed to track endpoint stats:', err);
            }
        }
    });
    
    next();
});

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

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 3
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Invalid input or email already exists
 */

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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "123"
 *     responses:
 *       200:
 *         description: Successful login, JWT cookie set
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly JWT auth cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                 redirectTo:
 *                   type: string
 *                   description: Frontend page to redirect user to
 *                   example: "main.html"
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed due to server error
 */
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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user by clearing the auth cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Server error
 */
app.post('/auth/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
    });
    res.json({ ok: true });
});

/**
 * @swagger
 * /auth/main:
 *   get:
 *     summary: Get the logged-in user's dashboard info
 *     description: Requires a valid JWT token stored in an HttpOnly cookie.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully retrieved user dashboard information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     apiCallsUsed:
 *                       type: integer
 *                       example: 5
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T20:34:12.000Z"
 *                     lastLogin:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2025-02-10T16:21:44.000Z"
 *       401:
 *         description: Missing or invalid authentication cookie
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error while loading dashboard
 */
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

/**
 * @swagger
 * /api/user/stats:
 *   get:
 *     summary: Get usage statistics for the logged-in user
 *     description: Returns API call usage, remaining free calls, and account creation date. Requires authentication via JWT cookie.
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successfully retrieved user statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     apiCallsUsed:
 *                       type: integer
 *                       example: 7
 *                     freeCallsRemaining:
 *                       type: integer
 *                       example: 13
 *                     exceededLimit:
 *                       type: boolean
 *                       example: false
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T19:22:17.000Z"
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch stats due to server error
 */
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

/**
 * @swagger
 * /api/ai/call:
 *   post:
 *     summary: Generate an AI restaurant-call script and place a phone call using Twilio
 *     description: >
 *       Uses an LLM to generate a natural-sounding call script, increments the user's API usage,
 *       stores the script in the call history, and attempts to place a phone call using Twilio TTS.
 *       Requires authentication via JWT cookie.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callerName
 *               - restaurantName
 *               - phoneNumber
 *               - script
 *             properties:
 *               callerName:
 *                 type: string
 *                 example: "Gurvir"
 *               restaurantName:
 *                 type: string
 *                 example: "Pizza Heaven"
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number to call using Twilio
 *                 example: "+16045551234"
 *               script:
 *                 type: string
 *                 description: Customer's order or notes used to generate the AI call script
 *                 example: "I'd like a pepperoni pizza with extra cheese."
 *     responses:
 *       200:
 *         description: AI script generated and saved; Twilio call attempted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   description: Final call status
 *                   example: "Completed"
 *                   enum: [Completed, Failed]
 *                 message:
 *                   type: string
 *                   example: "AI call script generated, call placed, and saved to your history."
 *                 aiScript:
 *                   type: string
 *                   example: "Hi, this is UpScaling calling on behalf of Gurvir..."
 *                 callSid:
 *                   type: string
 *                   nullable: true
 *                   description: Twilio call SID if a call was successfully made
 *                   example: "CA1234567890abcdef"
 *                 apiCallsUsed:
 *                   type: integer
 *                   example: 8
 *                 freeCallsRemaining:
 *                   type: integer
 *                   example: 12
 *       400:
 *         description: Missing required fields in the request body
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to generate AI call script or Twilio error
 */
app.post('/api/ai/call', auth, async (req, res) => {
    try {
        const { callerName, restaurantName, phoneNumber, script } = req.body;

        // Validate request body
        if (!callerName || !restaurantName || !phoneNumber || !script) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check LLM token
        if (!LLM_API_TOKEN) {
            console.error('LLM_API_TOKEN is not set');
            return res.status(500).json({ error: 'LLM server not configured' });
        }

        // Get user from DB
        const user = await getUserById(req.user.uid);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newApiCount = (user.apiCallsUsed || 0) + 1;

        // Build prompt for LLM
        const inputPrompt =
            `You are calling a restaurant on behalf of a client to place an order. ` +
            `Speak casually. Your job is to introduce yourself as an AI bot from the Company UpScaling, ` +
            `explain that you are calling on behalf of the client, state the client’s name and order clearly, ` +
            `but do not request confirmation. Do NOT output JSON in your answer. Do NOT mention JSON. ` +
            `Just speak as if you are making the call. ` +
            `Here is the order data you should use (this is for you, the AI, and should NOT be repeated as JSON in your answer): ` +
            `{ "client": "${callerName}", "restaurant": "${restaurantName}", "order": "${script}" }`;

        // Call LLM
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
        const spokenText = aiOutput || script;

        // Debug logs
        console.log('LLM raw response:', llmResponse.data);
        console.log('LLM generated script:', aiOutput);

        await db.query(
            `UPDATE users SET api_calls_used = api_calls_used + 1 WHERE id = ?`,
            [user.id]
        );

        // Trigger Twilio call with the generated script
        let callStatus = 'pending';
        let callSid = null;

        try {
            callSid = await makeTTSCall(phoneNumber, spokenText);
            console.log('Twilio call started, SID:', callSid);
            callStatus = 'completed';
        } catch (twilioErr) {
            console.error('Twilio call failed:', twilioErr);
            callStatus = 'failed';   
        }

        await db.query(
            `INSERT INTO call_history (
                user_id, caller_name, restaurant_name, phone_number, script, status, created_at
             )
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [user.id, callerName, restaurantName, phoneNumber, spokenText, callStatus]
        );

        return res.json({
            ok: true,
            status: callStatus === 'completed' ? 'Completed' : 'Failed',
            message: callStatus === 'completed'
                ? 'AI call script generated, call placed, and saved to your history.'
                : 'AI script generated and saved, but placing the call failed.',
            aiScript: spokenText,
            callSid,
            apiCallsUsed: newApiCount,
            freeCallsRemaining: Math.max(0, 20 - newApiCount)
        });

    } catch (error) {
        console.error('AI Call Error:', error.response?.data || error.message || error);
        return res.status(500).json({ error: 'Failed to generate AI call script' });
    }
});

/**
 * @swagger
 * /api/user/call-history:
 *   get:
 *     summary: Get the recent AI call history for the logged-in user
 *     description: Returns up to the 10 most recent AI/Twilio calls made by the authenticated user.
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Successfully retrieved call history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 calls:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 3
 *                       caller_name:
 *                         type: string
 *                         example: "Gurvir"
 *                       restaurant_name:
 *                         type: string
 *                         example: "Pizza Heaven"
 *                       phone_number:
 *                         type: string
 *                         example: "+16045551234"
 *                       script:
 *                         type: string
 *                         description: The AI-generated or fallback script that was used for the call
 *                         example: "Hi, this is UpScaling calling on behalf of Gurvir..."
 *                       status:
 *                         type: string
 *                         description: Call status
 *                         example: "completed"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-02-10T18:45:12.000Z"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Failed to fetch call history due to server error
 */
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

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get a list of all users (admin only)
 *     description: >
 *       Returns all users in the system, ordered by API usage.  
 *       Requires authentication and admin privileges.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Successfully retrieved list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 12
 *                       email:
 *                         type: string
 *                         example: "user@example.com"
 *                       role:
 *                         type: string
 *                         example: "user"
 *                       apiCallsUsed:
 *                         type: integer
 *                         example: 17
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-12T18:45:22.000Z"
 *                       lastLogin:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-02-21T10:12:11.000Z"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — user is not an admin
 *       500:
 *         description: Server error while fetching user list
 */
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

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get global application statistics (admin only)
 *     description: >
 *       Returns total user count, total API usage, number of active users,
 *       and the number of users who have exceeded the 20-call limit.
 *       Requires authentication + admin privileges.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Successfully retrieved application statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 42
 *                     totalApiCalls:
 *                       type: integer
 *                       example: 183
 *                     activeUsers:
 *                       type: integer
 *                       description: Users with a non-null last_login timestamp
 *                       example: 29
 *                     usersOverLimit:
 *                       type: integer
 *                       description: Users who exceeded 20 API calls
 *                       example: 4
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — user is not an admin
 *       500:
 *         description: Server error while retrieving admin stats
 */
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

// Get endpoint statistics
/**
 * @swagger
 * /api/admin/endpoint-stats:
 *   get:
 *     summary: Get API usage statistics for all endpoints (admin only)
 *     description: >
 *       Returns analytics for each API endpoint, including request counts,
 *       HTTP method, last accessed time, and creation date.  
 *       Requires authentication and admin privileges.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Successfully retrieved endpoint statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       method:
 *                         type: string
 *                         example: "GET"
 *                       endpoint:
 *                         type: string
 *                         example: "/api/user/stats"
 *                       requestCount:
 *                         type: integer
 *                         example: 48
 *                       lastAccessed:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-02-20T13:21:34.000Z"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-01-10T09:12:44.000Z"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — user is not an admin
 *       500:
 *         description: Failed to fetch endpoint statistics due to server error
 */
app.get('/api/admin/endpoint-stats', auth, isAdmin, async (_req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                method,
                endpoint,
                request_count,
                last_accessed,
                created_at
            FROM endpoint_stats
            ORDER BY request_count DESC
        `);

        res.json({
            ok: true,
            endpoints: rows.map(e => ({
                method: e.method,
                endpoint: e.endpoint,
                requestCount: e.request_count,
                lastAccessed: e.last_accessed,
                createdAt: e.created_at
            }))
        });
    } catch (e) {
        console.error('Failed to fetch endpoint stats:', e);
        res.status(500).json({ error: 'Failed to fetch endpoint statistics' });
    }
});

// Generic AI chat endpoint (optional, uses same hosted LLM)
/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a text prompt to the LLM and get a chat-style response
 *     description: >
 *       Sends the user's input message to the configured LLM API and returns the generated output.
 *       Requires authentication via JWT cookie.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - input
 *             properties:
 *               input:
 *                 type: string
 *                 description: The user's prompt to send to the LLM
 *                 example: "Rewrite this to sound more polite: hurry up."
 *     responses:
 *       200:
 *         description: AI responded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 output:
 *                   type: string
 *                   description: The LLM-generated response
 *                   example: "Could you please proceed a little faster? Thank you!"
 *       400:
 *         description: Missing required 'input' field
 *       401:
 *         description: Unauthorized — missing or invalid authentication token
 *       500:
 *         description: LLM server error or failed processing
 */
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

/**
 * @swagger
 * /twilio/say:
 *   post:
 *     summary: Generate Twilio-compatible XML (TwiML) to speak a message aloud
 *     description: >
 *       Returns a TwiML `<Response>` document containing a `<Say>` instruction.
 *       Used by Twilio when making TTS phone calls.  
 *       Accepts an optional `text` query parameter.
 *     tags: [Twilio]
 *     parameters:
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *         required: false
 *         description: The text that Twilio should speak aloud
 *         example: "Your order is ready for pickup."
 *     responses:
 *       200:
 *         description: Twilio XML (TwiML) returned successfully
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               example: |
 *                 <?xml version="1.0" encoding="UTF-8"?>
 *                 <Response>
 *                   <Say voice="Polly.Joanna" language="en-US">Hello from Twilio</Say>
 *                 </Response>
 *       500:
 *         description: Server error generating TwiML
 */
app.post("/twilio/say", (req, res) => {
    const text = req.query.text || "Hello, this is an AI call.";

    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    twiml.say({
        voice: "Polly.Joanna",     
        language: "en-US"
    }, text);

    res.type("text/xml").send(twiml.toString());
});

/* SERVER */
app.listen(3000, () => console.log('API running on http://localhost:3000'));
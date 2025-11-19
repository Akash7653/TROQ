// wa-backend/app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db'); // mysql2 pool (your db.js)
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();

// ============ CONFIG ============
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const PORT = process.env.PORT || 3001;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const APP_SECRET = process.env.APP_SECRET;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'change_this_secret';

// trust proxy (helps cookie handling when behind proxies; safe for dev)
app.set('trust proxy', 1);

// CORS: allow frontend origin and credentials (cookies)
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session (cookie-backed). In prod set cookie.secure = true and use HTTPS.
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',       // allow cross-site POST from your frontend
    secure: process.env.NODE_ENV === 'production', // set true in prod (HTTPS)
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ============ HELPERS ============
async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('WhatsApp token/phone id not configured — skipping message send.');
    return null;
  }

  const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    text: { body: text }
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (err) {
    console.error('WhatsApp Send Error:', err.response?.data || err.message);
    return null;
  }
}

function verifySignature(rawBody, signature) {
  if (!APP_SECRET) return true;
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
  return signature === `sha256=${expected}`;
}

// session-based auth middleware for admin APIs
function protect(req, res, next) {
  if (req.session && req.session.auth) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// ============ WEBHOOK (VERIFY + RECEIVE) ============
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', bodyParser.json({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    if (!verifySignature(JSON.stringify(req.body), signature)) {
      console.warn('Invalid webhook signature');
      return res.sendStatus(403);
    }

    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body || '';
    console.log('Webhook message from:', from, 'text:', text);

    // Simple menu handling
    if (text.trim() === '1') {
      await sendWhatsAppMessage(from, "🚗 Driver Service\nSend details as:\nName | Phone | Pickup | Drop | Date & Time");
      return res.sendStatus(200);
    }

    if (text.includes('|')) {
      const parts = text.split('|').map(p => p.trim());
      const [name, phone, pickup, drop_location, date_time] = parts;

      const [result] = await pool.query(
        `INSERT INTO requests (whatsapp_id, name, phone, pickup, drop_location, date_time, service_type, raw_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [from, name || null, phone || null, pickup || null, drop_location || null, date_time || null, 'Driver', text]
      );

      await sendWhatsAppMessage(from, `✅ Thanks ${name || ''}! Your request ID: ${result.insertId}`);
      return res.sendStatus(200);
    }

    // default menu
    await sendWhatsAppMessage(from, "👋 Welcome to TROQ\n1️⃣ Driver\n2️⃣ Airport\n3️⃣ Logistics\nSend option number.");
    return res.sendStatus(200);

  } catch (err) {
    console.error('Webhook handling error:', err);
    return res.sendStatus(500);
  }
});

// ============ AUTH (ADMIN) ============
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.auth = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.warn('session destroy err', err);
    res.json({ success: true });
  });
});

// ============ REQUESTS API ============
app.get('/api/requests', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM requests ORDER BY created_at DESC LIMIT 1000');
    res.json(rows);
  } catch (err) {
    console.error('DB error get requests', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/requests/:id/assign', protect, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { assigned_to } = req.body;
    await pool.query('UPDATE requests SET assigned_to=?, status=? WHERE id=?', [assigned_to, 'Assigned', id]);

    // notify user (best effort)
    const [[row]] = await pool.query('SELECT whatsapp_id, name FROM requests WHERE id=?', [id]);
    if (row && row.whatsapp_id) {
      try {
        await sendWhatsAppMessage(row.whatsapp_id, `✅ Hi ${row.name || ''}, your request (ID: ${id}) has been assigned to ${assigned_to}.`);
      } catch (e) {
        console.warn('Could not notify user via WhatsApp', e);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('assign error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/requests/:id/status', protect, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    await pool.query('UPDATE requests SET status=? WHERE id=?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('update status error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/requests/recent', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, phone, pickup, drop_location, status, created_at
       FROM requests ORDER BY created_at DESC LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    console.error('recent requests error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ============ STATS API ============
app.get('/api/stats', protect, async (req, res) => {
  try {
    const [[{ total_requests }]] = await pool.query(`SELECT COUNT(*) AS total_requests FROM requests`);
    const [[{ pending }]] = await pool.query(`SELECT COUNT(*) AS pending FROM requests WHERE status='Pending'`);
    const [[{ assigned }]] = await pool.query(`SELECT COUNT(*) AS assigned FROM requests WHERE status='Assigned'`);
    const [[{ completed }]] = await pool.query(`SELECT COUNT(*) AS completed FROM requests WHERE status='Completed'`);
    const [[{ today_requests }]] = await pool.query(`SELECT COUNT(*) AS today_requests FROM requests WHERE DATE(created_at)=CURDATE()`);

    res.json({
      total_requests: Number(total_requests || 0),
      pending: Number(pending || 0),
      assigned: Number(assigned || 0),
      completed: Number(completed || 0),
      today_requests: Number(today_requests || 0)
    });
  } catch (err) {
    console.error('stats error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/stats/status', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT status, COUNT(*) AS count FROM requests GROUP BY status`);
    res.json(rows);
  } catch (err) {
    console.error('status dist error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/stats/service', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT service_type, COUNT(*) AS count FROM requests GROUP BY service_type`);
    res.json(rows);
  } catch (err) {
    console.error('service dist error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/stats/daily', protect, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count FROM requests
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [days]
    );
    res.json(rows);
  } catch (err) {
    console.error('daily stats error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ============ DRIVERS (table ensured on startup) ============
(async function ensureDriversTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(64),
        vehicle VARCHAR(128),
        city VARCHAR(128),
        status ENUM('Available','On Trip','Unavailable') DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('drivers table verified/created');
  } catch (e) {
    console.warn('Could not create/verify drivers table:', e.message || e);
  }
})();

app.get('/api/drivers', protect, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM drivers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('get drivers error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/drivers', protect, async (req, res) => {
  try {
    const { name, phone, vehicle, city } = req.body;
    await pool.query('INSERT INTO drivers (name, phone, vehicle, city) VALUES (?, ?, ?, ?)', [name, phone, vehicle, city]);
    res.json({ success: true });
  } catch (err) {
    console.error('add driver error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Use PUT for status updates (frontend should call PUT)
app.put('/api/drivers/:id', protect, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    await pool.query('UPDATE drivers SET status=? WHERE id=?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('update driver error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/drivers/:id', protect, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM drivers WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('delete driver error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ============ Serve uploaded report (from your environment) ============
const reportPath = '/mnt/data/ac238bc0-2c9d-4054-9e30-2027ed26699f.pdf';
app.get('/report', protect, (req, res) => {
  if (fs.existsSync(reportPath)) return res.sendFile(reportPath);
  return res.status(404).json({ error: 'Report file not found' });
});

// ============ Serve frontend (production) if exists ============
const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => res.sendFile(path.join(frontendBuildPath, 'index.html')));
}

// ============ Error handler ============
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Server error' });
});

// ============ START ============
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`Frontend origin allowed: ${FRONTEND_ORIGIN}`);
});

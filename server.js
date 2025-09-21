require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 8979;
const DB_PATH = path.join(__dirname, 'data.sqlite');

// Init DB
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    phone TEXT,
    hospital TEXT,
    state TEXT,
    role TEXT,
    experience TEXT,
    welcome_sent INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Setup mailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Simple CORS whitelist for local dev (Live Server at :5500)
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:8979',
  'http://localhost:8979'
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Serve static files (index.html, assets)
app.use(express.static(path.join(__dirname)));

// API: signup
app.post('/api/signup', (req, res) => {
  const data = req.body;
  const fields = ['firstName','lastName','email','phone','hospital','state','role','experience'];
  const values = fields.map(f => data[f] || '');

  const stmt = db.prepare(`INSERT INTO signups (firstName,lastName,email,phone,hospital,state,role,experience) VALUES (?,?,?,?,?,?,?,?)`);
  stmt.run(...values, function(err) {
    if (err) {
      console.error('DB insert error', err);
      return res.status(500).json({ success: false, error: 'db_error' });
    }

    const id = this.lastID;

    // send welcome email (best-effort)
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: data.email,
      subject: 'Welcome to Helium Health Champions',
      html: `<p>Hi ${escapeHtml(data.firstName || '')},</p><p>Thanks for signing up to be a Helium Health Champion. We'll be in touch with next steps.</p>`
    };

    transporter.sendMail(mailOptions, (mailErr, info) => {
      if (mailErr) {
        console.error('Mail error', mailErr);
      } else {
        db.run('UPDATE signups SET welcome_sent = 1 WHERE id = ?', [id]);
      }
    });

    return res.json({ success: true, id });
  });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false });

  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, row) => {
    if (err || !row) return res.status(401).json({ success: false });
    bcrypt.compare(password, row.password_hash).then(match => {
      if (!match) return res.status(401).json({ success: false });
      req.session.admin = { id: row.id, username: row.username };
      res.json({ success: true });
    });
  });
});

function ensureAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ success: false });
}

// Admin: list signups
app.get('/api/admin/signups', ensureAdmin, (req, res) => {
  db.all('SELECT * FROM signups ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, signups: rows });
  });
});

// Admin: add admin user
app.post('/api/admin/users', ensureAdmin, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false });
  bcrypt.hash(password, 10).then(hash => {
    db.run('INSERT INTO admins (username,password_hash) VALUES (?,?)', [username, hash], function(err) {
      if (err) return res.status(500).json({ success: false, error: 'db_error' });
      res.json({ success: true, id: this.lastID });
    });
  });
});

// Admin logout
app.get('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Fallback to index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function escapeHtml(str) {
  return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}

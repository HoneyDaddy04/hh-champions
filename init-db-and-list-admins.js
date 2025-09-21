const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.join(__dirname, 'data.sqlite');
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
  )`, (err) => {
    if (err) {
      console.error('Failed to ensure admins table:', err.message);
      process.exit(1);
    }

    db.all('SELECT id, username, created_at FROM admins ORDER BY id', (err, rows) => {
      if (err) {
        console.error('Query error:', err.message);
        process.exit(1);
      }
      if (!rows || rows.length === 0) {
        console.log('No admin users found in the database.');
        process.exit(0);
      }
      console.log('Admins:');
      rows.forEach(r => console.log(`${r.id}\t${r.username}\t${r.created_at}`));
      process.exit(0);
    });
  });
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

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

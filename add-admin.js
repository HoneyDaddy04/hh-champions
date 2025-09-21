require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  // fallback to bcryptjs if native bcrypt fails to build
  bcrypt = require('bcryptjs');
}
const readline = require('readline');

const DB_PATH = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(q) { return new Promise(res => rl.question(q, ans => res(ans))); }

(async function() {
  try {
    const usernameInput = await question('Admin username (default: admin@example.com): ');
    const passwordInput = await question('Admin password (default: Admin@123): ');
    rl.close();

    const username = (usernameInput && usernameInput.trim()) ? usernameInput.trim() : 'admin@example.com';
    const password = (passwordInput && passwordInput.trim()) ? passwordInput.trim() : 'Admin@123';

    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO admins (username,password_hash) VALUES (?,?)', [username, hash], function(err) {
      if (err) return console.error('Error creating admin', err);
      console.log('Admin created with id', this.lastID);
      process.exit(0);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

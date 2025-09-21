const sqlite3 = require('sqlite3').verbose();
const path = require('path');
let bcrypt;
try { bcrypt = require('bcrypt'); } catch (e) { bcrypt = require('bcryptjs'); }

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node create-admin-direct.js <username> <password>');
  process.exit(1);
}
const [username, password] = args;

const DB_PATH = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_PATH);

(async function() {
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO admins (username,password_hash) VALUES (?,?)', [username, hash], function(err) {
      if (err) {
        console.error('Error creating admin:', err.message);
        process.exit(1);
      }
      console.log('Admin created with id', this.lastID);
      process.exit(0);
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const testDbPath = path.join(__dirname, 'test_database.sqlite');

beforeAll(async () => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(testDbPath, (err) => {
      if (err) {
        console.error('Error creating test database file:', err.message);
        return reject(err);
      }
      console.log('Test database created.');

      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS entries (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  code TEXT UNIQUE,
                  code_png TEXT,
                  name TEXT,
                  date INTEGER
              )`, (err) => {
          if (err) console.error("Error creating test entries table", err);
        });
        db.run(`CREATE TABLE IF NOT EXISTS scans (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  code TEXT,
                  date INTEGER,
                  scan_date TEXT,
                  category_code TEXT
              )`, (err) => {
          if (err) console.error("Error creating test scans table", err);
        });
        db.run(`CREATE TABLE IF NOT EXISTS categories (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE,
                  code TEXT UNIQUE,
                  date INTEGER
              )`, (err) => {
          if (err) console.error("Error creating test categories table", err);
          else {
            db.run(`INSERT OR IGNORE INTO categories (name, code, date) VALUES (?, ?, ?)`, ['General', 'test-general-uuid', Date.now()], (err) => {
              db.close((closeErr) => {
                if (closeErr) {
                  console.error("Error closing database:", closeErr);
                  reject(closeErr);
                } else {
                  resolve();
                }
              });
            });
          }
        });
      });
    });
  });
});

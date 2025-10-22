const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "database.sqlite";
const { v4: uuidv4 } = require('uuid');

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE,
                code_png TEXT,
                name TEXT,
                date INTEGER
            )`, (err) => {
                if (err) {
                    console.error("Error creating entries table", err);
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT,
                date INTEGER,
                scan_date TEXT,
                category_code TEXT
            )`, (err) => {
                if (err) {
                    console.error("Error creating scans table", err);
                } else {
                    db.run(`CREATE INDEX IF NOT EXISTS idx_scan_date ON scans(scan_date)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_scan_code ON scans(code)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_scan_category_code ON scans(category_code)`);
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                code TEXT UNIQUE,
                date INTEGER
            )`, (err) => {
                if (err) {
                    console.error("Error creating categories table", err);
                } else {
                    const currentDate = Date.now();
                    const generalCode = uuidv4();
                    db.run(`INSERT OR IGNORE INTO categories (name, code, date) VALUES (?, ?, ?)`, ['General', generalCode, currentDate]);
                }
            });
        });
    }
});

module.exports = db;

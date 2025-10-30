const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const qrcode = require('qrcode');
const sharp = require('sharp');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const util = require('util');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });
const sleep = util.promisify(setTimeout);

const formatDateForDB = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatTime12Hour = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const paddedHours = String(hours).padStart(2, '0');
    return `${paddedHours}:${minutes}:${seconds} ${ampm}`;
};

const formatTime24Hour = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

app.get('/api/entries', (req, res) => {
    const { sortBy = 'name', order = 'ASC', search = '' } = req.query;
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const offset = (page - 1) * limit;

    const allowedSortBy = ['name', 'date'];
    const allowedOrder = ['ASC', 'DESC'];

    if (!allowedSortBy.includes(sortBy) || !allowedOrder.includes(order)) {
        return res.status(400).json({ "error": "Invalid sort parameters." });
    }

    const searchPattern = `%${search}%`;

    const countSql = `SELECT COUNT(*) as count FROM entries WHERE name LIKE ?`;
    db.get(countSql, [searchPattern], (err, countRow) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const totalEntries = countRow.count;
        const dataSql = `SELECT code, name FROM entries WHERE name LIKE ? ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
        
        db.all(dataSql, [searchPattern, limit, offset], (err, rows) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            res.json({
                "message": "success",
                "data": rows,
                "total": totalEntries
            });
        });
    });
});

app.get('/api/entry/:code', (req, res) => {
    const { code } = req.params;
    db.get("SELECT code, name, code_png, date FROM entries WHERE code = ?", [code], (err, row) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});

app.get('/api/entry/:code/scans', (req, res) => {
    const { code } = req.params;
    const { order = 'DESC', page = 1, limit = 10, startDate, endDate, days, categories } = req.query;

    const allowedOrder = ['ASC', 'DESC'];
    if (!allowedOrder.includes(order.toUpperCase())) {
        return res.status(400).json({ "error": "Invalid order parameter." });
    }

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit, 10);

    let whereClauses = ['s.code = ?'];
    let params = [code];

    if (startDate) {
        whereClauses.push('s.scan_date >= ?');
        params.push(startDate);
    }
    if (endDate) {
        whereClauses.push('s.scan_date <= ?');
        params.push(endDate);
    }

    if (days) {
        const dayList = days.split(',').map(d => parseInt(d, 10)).filter(d => d >= 0 && d <= 6);
        if (dayList.length > 0) {
            const placeholders = dayList.map(() => '?').join(',');
            whereClauses.push(`CAST(strftime('%w', s.date / 1000, 'unixepoch', 'localtime') AS INTEGER) IN (${placeholders})`);
            params.push(...dayList);
        }
    }

    if (categories) {
        const categoryList = categories.split(',');
        if (categoryList.length > 0) {
            const placeholders = categoryList.map(() => '?').join(',');
            whereClauses.push(`s.category_code IN (${placeholders})`);
            params.push(...categoryList);
        }
    }

    const whereString = whereClauses.join(' AND ');

    const countSql = `SELECT COUNT(*) as count FROM scans s WHERE ${whereString}`;

    db.get(countSql, params, (err, countRow) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const totalScans = countRow.count;
        const dataSql = `
            SELECT s.date, c.name as category 
            FROM scans s
            JOIN categories c ON s.category_code = c.code
            WHERE ${whereString} 
            ORDER BY s.date ${order} 
            LIMIT ? OFFSET ?`;
        const dataParams = [...params, limitNum, offset];

        db.all(dataSql, dataParams, (err, rows) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            res.json({
                message: "success",
                data: rows,
                total: totalScans
            });
        });
    });
});

app.get('/api/entry/:code/date-range', (req, res) => {
    const { code } = req.params;
    const sql = `
        SELECT 
            MIN(scan_date) as minDate, 
            MAX(scan_date) as maxDate 
        FROM scans 
        WHERE code = ?
    `;

    db.get(sql, [code], (err, row) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});

app.post('/api/entry', async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ "error": "Name is required." });
    }

    try {
        const code = uuidv4();
        const currentDate = Date.now();
        const code_png = await qrcode.toDataURL(code);
        const sql = `INSERT INTO entries (code, code_png, name, date) VALUES (?,?,?,?)`;
        const params = [code, code_png, name, currentDate];

        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ "error": "Could not create entry." });
                return;
            }
            res.json({
                "message": "Successfully created entry.",
                "data": { code, name }
            });
        });
    } catch (err) {
        res.status(500).json({ "error": "Could not generate QR code." });
    }
});

app.put('/api/entry/:code', (req, res) => {
    const { code } = req.params;
    const { name } = req.body;
    db.run(
        `UPDATE entries SET name = ? WHERE code = ?`,
        [name, code],
        function (err) {
            if (err) {
                res.status(400).json({ "error": "Could not update entry." })
                return;
            }
            res.json({ message: "Successfully updated entry." })
        }
    );
});

app.put('/api/entry/qrcode/:code', async (req, res) => {
    const { code: oldCode } = req.params;
    try {
        const newCode = uuidv4();
        const new_code_png = await qrcode.toDataURL(newCode);

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const updateEntriesSql = `UPDATE entries SET code = ?, code_png = ? WHERE code = ?`;
            db.run(updateEntriesSql, [newCode, new_code_png, oldCode], function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ "error": "Could not update entry code." });
                }
            });

            const updateScansSql = `UPDATE scans SET code = ? WHERE code = ?`;
            db.run(updateScansSql, [newCode, oldCode], function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ "error": "Could not update scan history." });
                }
            });

            db.run("COMMIT", (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ "error": "Could not commit transaction." });
                }
                res.json({
                    message: "Successfully updated entry.",
                    data: { code: newCode, code_png: new_code_png }
                });
            });
        });
    } catch (err) {
        res.status(500).json({ "error": "Could not generate QR code." });
    }
});

app.delete('/api/entry/:code', (req, res) => {
    const { code } = req.params;
    db.run("BEGIN TRANSACTION", (err) => {
        if (err) return res.status(500).json({ error: "Could not start transaction." });

        db.run('DELETE FROM entries WHERE code = ?', code, function(err) {
            if (err) {
                return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not delete entry." }));
            }

            db.run('DELETE FROM scans WHERE code = ?', code, (err) => {
                if (err) {
                    return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not delete associated scans." }));
                }

                db.run("COMMIT", (err) => {
                    if (err) return res.status(500).json({ error: "Could not commit transaction." });
                    res.json({ message: "Successfully deleted entry." });
                });
            });
        });
    });
});

app.delete('/api/scan/:timestamp', (req, res) => {
    const { timestamp } = req.params;
    const scanTimestamp = parseInt(timestamp, 10);

    db.get("SELECT code, date FROM scans WHERE date = ?", [scanTimestamp], (err, scan) => {
        if (err) {
            return res.status(500).json({ error: "Could not find scan." });
        }
        if (!scan) {
            return res.status(404).json({ error: "Scan not found." });
        }

        db.run("BEGIN TRANSACTION", (err) => {
            if (err) return res.status(500).json({ error: "Could not start transaction." });

            db.run('DELETE FROM scans WHERE date = ?', [scanTimestamp], function(err) {
                if (err) {
                    return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not delete scan record." }));
                }

                db.run("COMMIT", (err) => {
                    if (err) return res.status(500).json({ error: "Could not commit transaction." });
                    res.json({ message: "Successfully deleted scan." });
                });
            });
        });
    });
});

app.post('/api/entries/delete', (req, res) => {
    const { codes } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    const placeholders = codes.map(() => '?').join(',');

    db.run("BEGIN TRANSACTION", (err) => {
        if (err) return res.status(500).json({ error: "Could not start transaction." });

        db.run(`DELETE FROM entries WHERE code IN (${placeholders})`, codes, function(err) {
            if (err) {
                return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not delete entries." }));
            }

            db.run(`DELETE FROM scans WHERE code IN (${placeholders})`, codes, (err) => {
                if (err) {
                    return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not delete associated scans." }));
                }

                db.run("COMMIT", (err) => {
                    if (err) return res.status(500).json({ error: "Could not commit transaction." });
                    res.json({ message: "Successfully deleted entries." });
                });
            });
        });
    });
});

app.post('/api/scan', (req, res) => {
    const { code, category_code } = req.body;

    db.get("SELECT MAX(date) as lastScan FROM scans WHERE code = ?", [code], (err, lastScanRow) => {
        if (err) {
            return res.status(500).json({ "error": "Could not check for recent scans." });
        }

        if (lastScanRow && lastScanRow.lastScan) {
            const lastScanTimestamp = lastScanRow.lastScan;
            const now = Date.now();
            const timeDifference = now - lastScanTimestamp;

            if (timeDifference < 600000) { // 10 minutes in milliseconds
                return res.status(429).json({ "error": "Entry scanned less than 10 minutes ago." });
            }
        }

        db.get("SELECT name FROM entries WHERE code = ?", [code], (err, row) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            if (!row) {
                return res.status(404).json({ "error": "Invalid code." });
            }

            const currentDate = Date.now();
            const scanDateFormatted = formatDateForDB(currentDate);

            db.run("BEGIN TRANSACTION", (err) => {
                if (err) {
                    return res.status(500).json({ "error": "Could not start transaction." });
                }

                const insertSql = `INSERT INTO scans (code, date, scan_date, category_code) VALUES (?, ?, ?, ?)`;
                db.run(insertSql, [code, currentDate, scanDateFormatted, category_code], function (err) {
                    if (err) {
                        return db.run("ROLLBACK", () => {
                            res.status(500).json({ "error": "Could not record scan." });
                        });
                    }

                    db.run("COMMIT", (err) => {
                        if (err) {
                            return res.status(500).json({ "error": "Could not commit transaction." });
                        }
                        res.json({ message: `Successfully scanned code for ${row.name}.` });
                    });
                });
            });
        });
    });
});

app.post('/api/scan/record', (req, res) => {
    const { code, category_code, date, time } = req.body;

    if (!code || !category_code || !date || !time) {
        return res.status(400).json({ "error": "Code, category, date, and time are required." });
    }

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const newDate = new Date(year, month - 1, day, hours, minutes, seconds);

    if (newDate > new Date()) {
        return res.status(400).json({ "error": "Cannot select a future date or time." });
    }

    db.get("SELECT name FROM entries WHERE code = ?", [code], (err, row) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }
        if (!row) {
            return res.status(404).json({ "error": "Invalid code." });
        }

        const newTimestamp = newDate.getTime();
        const newScanDate = formatDateForDB(newDate);

        const insertSql = `INSERT INTO scans (code, date, scan_date, category_code) VALUES (?, ?, ?, ?)`;
        db.run(insertSql, [code, newTimestamp, newScanDate, category_code], function (err) {
            if (err) {
                return res.status(500).json({ "error": "Could not record scan." });
            }
            res.json({ message: `Successfully created scan for ${row.name}.` });
        });
    });
});

app.get('/api/entry/download/:code', async (req, res) => {
    const { code } = req.params;
    db.get("SELECT name, code_png FROM entries WHERE code = ?", [code], async (err, row) => {
        if (err || !row) {
            return res.status(404).json({ "error": "Entry not found." });
        }

        try {
            const base64Data = row.code_png.replace(/^data:image\/png;base64,/, "");
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            const resizedImageBuffer = await sharp(imageBuffer)
                .resize(500, 500)
                .toBuffer();

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="${row.name.replace(/\s+/g, '_')}_${code}.png"`);
            res.send(resizedImageBuffer);
        } catch (error) {
            res.status(500).json({ "error": "Could not process image." });
        }
    });
});

app.post('/api/entries/export-csv', (req, res) => {
    const { codes, sortBy = 'name', order = 'ASC' } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    const placeholders = codes.map(() => '?').join(',');
    const allowedSortBy = ['name', 'date'];
    const allowedOrder = ['ASC', 'DESC'];

    if (!allowedSortBy.includes(sortBy) || !allowedOrder.includes(order)) {
        return res.status(400).json({ "error": "Invalid sort parameters." });
    }

    const sql = `SELECT name, code, date FROM entries WHERE code IN (${placeholders}) ORDER BY ${sortBy} ${order}`;

    db.all(sql, codes, (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        let csv = '"Name","Code","Date"\n';
        rows.forEach(row => {
            const date = formatDateForDB(row.date);
            csv += `"${row.name}","${row.code}","${date}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="entries.csv"');
        res.status(200).send(csv);
    });
});

app.post('/api/entry/export-csv/:code', (req, res) => {
    const { code } = req.params;
    const { order = 'DESC', startDate, endDate, days, categories } = req.body;

    db.get("SELECT name FROM entries WHERE code = ?", [code], (err, entry) => {
        if (err || !entry) {
            return res.status(404).json({ "error": "Entry not found." });
        }

        let whereClauses = ['s.code = ?'];
        let params = [code];

        if (startDate) {
            whereClauses.push('s.scan_date >= ?');
            params.push(startDate);
        }
        if (endDate) {
            whereClauses.push('s.scan_date <= ?');
            params.push(endDate);
        }
        if (days === '') {
            whereClauses.push('1 = 0');
        } else if (days) {
            const dayList = days.split(',').map(d => parseInt(d, 10)).filter(d => d >= 0 && d <= 6);
            if (dayList.length > 0) {
                const placeholders = dayList.map(() => '?').join(',');
                whereClauses.push(`CAST(strftime('%w', s.date / 1000, 'unixepoch', 'localtime') AS INTEGER) IN (${placeholders})`);
                params.push(...dayList);
            }
        }
        if (categories) {
            const categoryList = categories.split(',');
            if (categoryList.length > 0) {
                const placeholders = categoryList.map(() => '?').join(',');
                whereClauses.push(`s.category_code IN (${placeholders})`);
                params.push(...categoryList);
            }
        }

        const whereString = whereClauses.join(' AND ');
        const finalOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
        const sql = `
            SELECT s.date, c.name as category
            FROM scans s
            JOIN categories c ON s.category_code = c.code
            WHERE ${whereString}
            ORDER BY s.date ${finalOrder}
        `;

        db.all(sql, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }

            let csv = '"Name","Date","Time","Category"\n';
            rows.forEach(row => {
                const d = new Date(row.date);
                const date = formatDateForDB(d);
                const time = formatTime24Hour(d);
                csv += `"${entry.name}","${date}","${time}","${row.category}"\n`;
            });

            const filename = `${entry.name.replace(/\s+/g, '_')}_${code}.csv`;
            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(200).send(csv);
        });
    });
});

app.post('/api/entries/export-pdf', (req, res) => {
    const { codes, sortBy = 'name', order = 'ASC' } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    const placeholders = codes.map(() => '?').join(',');
    const allowedSortBy = ['name', 'date'];
    const allowedOrder = ['ASC', 'DESC'];

    if (!allowedSortBy.includes(sortBy) || !allowedOrder.includes(order)) {
        return res.status(400).json({ "error": "Invalid sort parameters." });
    }

    const sql = `SELECT name, code, date FROM entries WHERE code IN (${placeholders}) ORDER BY ${sortBy} ${order}`;

    db.all(sql, codes, (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const doc = new PDFDocument({ margin: 72 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="entries.pdf"');
        doc.pipe(res);

        const generateTable = (doc, tableRows) => {
            let tableTop = doc.y;
            const nameX = 72;
            const codeX = 250;
            const dateX = 450;
            const tableWidth = 478;
            const rowHeight = 25;
            let y = tableTop;

            const drawPage = (isFirstPage) => {
                if (!isFirstPage) {
                    doc.addPage();
                    tableTop = doc.y;
                    y = tableTop;
                }

                doc.font('Helvetica-Bold').fontSize(12);
                doc.text('Name', nameX, y + 6)
                   .text('Code', codeX, y + 6)
                   .text('Date', dateX, y + 6);
                
                doc.moveTo(nameX - 10, y).lineTo(nameX - 10 + tableWidth, y).stroke();
                doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();

                y += rowHeight;
                doc.font('Helvetica').fontSize(12);
            };

            drawPage(true);

            tableRows.forEach((row, index) => {
                if (index > 0 && index % 25 === 0) {
                    doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                    doc.moveTo(codeX - 10, tableTop).lineTo(codeX - 10, y).stroke();
                    doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
                    doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
                    
                    drawPage(false);
                }

                const d = new Date(row.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const dayOfMonth = String(d.getDate()).padStart(2, '0');
                const date = `${month}/${dayOfMonth}/${year}`;
                doc.fontSize(10).text(row.name, nameX, y + 6);
                doc.fontSize(8).text(row.code, codeX, y + 6);
                doc.fontSize(10).text(date, dateX, y + 6);
                doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                y += rowHeight;
            });

            doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
            doc.moveTo(codeX - 10, tableTop).lineTo(codeX - 10, y).stroke();
            doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
            doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
        };

        generateTable(doc, rows);

        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(12);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(now.getDate()).padStart(2, '0');
        const reportDate = `${month}/${dayOfMonth}/${year}`;
        const reportTime = formatTime24Hour(now);

        doc.text(`Generated report on ${reportDate} at ${reportTime}.`);
        doc.moveDown();
        doc.text(`Successfully exported ${rows.length} entries.`);
        doc.moveDown();
        doc.text("Scansheet v1.0.0");

        doc.end();
    });
});

app.post('/api/entry/export-pdf/:code', (req, res) => {
    const { code } = req.params;
    const { order = 'DESC', startDate, endDate, days, categories } = req.body;

    db.get("SELECT name FROM entries WHERE code = ?", [code], (err, entry) => {
        if (err || !entry) {
            return res.status(404).json({ "error": "Entry not found." });
        }

        let whereClauses = ['s.code = ?'];
        let params = [code];

        if (startDate) {
            whereClauses.push('s.scan_date >= ?');
            params.push(startDate);
        }
        if (endDate) {
            whereClauses.push('s.scan_date <= ?');
            params.push(endDate);
        }
        if (days === '') {
            whereClauses.push('1 = 0');
        } else if (days) {
            const dayList = days.split(',').map(d => parseInt(d, 10)).filter(d => d >= 0 && d <= 6);
            if (dayList.length > 0) {
                const placeholders = dayList.map(() => '?').join(',');
                whereClauses.push(`CAST(strftime('%w', s.date / 1000, 'unixepoch', 'localtime') AS INTEGER) IN (${placeholders})`);
                params.push(...dayList);
            }
        }
        if (categories) {
            const categoryList = categories.split(',');
            if (categoryList.length > 0) {
                const placeholders = categoryList.map(() => '?').join(',');
                whereClauses.push(`s.category_code IN (${placeholders})`);
                params.push(...categoryList);
            }
        }

        const whereString = whereClauses.join(' AND ');
        const finalOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
        const sql = `
            SELECT s.date, c.name as category
            FROM scans s
            JOIN categories c ON s.category_code = c.code
            WHERE ${whereString}
            ORDER BY s.date ${finalOrder}
        `;

        db.all(sql, params, (err, rows) => {
            if (err) { return res.status(500).json({ "error": err.message }); }

            const doc = new PDFDocument({ margin: 72 });
            const filename = `${entry.name.replace(/\s+/g, '_')}_${code}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            doc.pipe(res);

            const generateTable = (doc, tableRows) => {
                let tableTop = doc.y;
                const nameX = 72, dateX = 240, timeX = 340, categoryX = 400;
                const tableWidth = 468;
                const rowHeight = 25;
                let y = tableTop;

                const drawPage = (isFirstPage) => {
                    if (!isFirstPage) {
                        doc.addPage();
                        tableTop = doc.y;
                        y = tableTop;
                    }
                    doc.font('Helvetica-Bold').fontSize(12);
                    doc.text('Name', nameX, y + 6)
                       .text('Date', dateX, y + 6)
                       .text('Time', timeX, y + 6)
                       .text('Category', categoryX, y + 6);
                    doc.moveTo(nameX - 10, y).lineTo(nameX - 10 + tableWidth, y).stroke();
                    doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                    y += rowHeight;
                    doc.font('Helvetica').fontSize(10);
                };

                drawPage(true);

                tableRows.forEach((row, index) => {
                    if (index > 0 && index % 25 === 0) {
                        doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                        doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
                        doc.moveTo(timeX - 10, tableTop).lineTo(timeX - 10, y).stroke();
                        doc.moveTo(categoryX - 10, tableTop).lineTo(categoryX - 10, y).stroke();
                        doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();

                        drawPage(false);
                    }
                    const d = new Date(row.date);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(d.getDate()).padStart(2, '0');
                    const date = `${month}/${dayOfMonth}/${year}`;
                    const time = formatTime24Hour(d);
                    doc.text(entry.name, nameX, y + 6)
                       .text(date, dateX, y + 6)
                       .text(time, timeX, y + 6)
                       .text(row.category, categoryX, y + 6);
                    doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                    y += rowHeight;
                });

                doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
                doc.moveTo(timeX - 10, tableTop).lineTo(timeX - 10, y).stroke();
                doc.moveTo(categoryX - 10, tableTop).lineTo(categoryX - 10, y).stroke();
                doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
            };

            generateTable(doc, rows);

            doc.addPage();
            doc.font('Helvetica-Bold').fontSize(12);
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const dayOfMonth = String(now.getDate()).padStart(2, '0');
            const reportDate = `${month}/${dayOfMonth}/${year}`;
            const reportTime = formatTime24Hour(now);

            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let dayString;
            if (days === '') {
                dayString = 'None';
            } else if (days) {
                dayString = days.split(',').map(d => dayOfWeek[d]).join(', ');
            } else {
                dayString = 'All';
            }

            const formatYMDtoMDY = (ymd) => {
                if (!ymd) return 'N/A';
                const [y, m, d] = ymd.split('-');
                return `${m}/${d}/${y}`;
            };

            const formattedStartDate = formatYMDtoMDY(startDate);
            const formattedEndDate = formatYMDtoMDY(endDate);
            
            const getCategoryNames = (callback) => {
                if (!categories) {
                    return callback('All');
                }
                const categoryList = categories.split(',');
                if (categoryList.length === 0) {
                    return callback('None');
                }
                const placeholders = categoryList.map(() => '?').join(',');
                const catSql = `SELECT name FROM categories WHERE code IN (${placeholders})`;
                db.all(catSql, categoryList, (err, catRows) => {
                    if (err || catRows.length === 0) {
                        return callback('N/A');
                    }
                    callback(catRows.map(r => r.name).join(', '));
                });
            };

            getCategoryNames(categoryString => {
                doc.text(`Generated report for ${entry.name} on ${reportDate} at ${reportTime}.`);
                doc.moveDown();
                doc.text(`Successfully exported ${rows.length} scans, using the following options:`);
                doc.font('Helvetica').fontSize(10);
                doc.text(`Day(s): ${dayString}`);
                doc.text(`Categories: ${categoryString}`);
                doc.text(`Date Range: ${formattedStartDate} to ${formattedEndDate}`);
                doc.moveDown();
                doc.font('Helvetica-Bold').fontSize(12);
                doc.text("Scansheet v1.0.0");

                doc.end();
            });
        });
    });
});

app.post('/api/entries/import', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv({ headers: false }))
        .on('data', (data) => results.push(data[0]))
        .on('end', async () => {
            fs.unlinkSync(filePath);

            if (results.length === 0) {
                return res.status(400).json({ error: 'CSV file is empty or invalid.' });
            }

            try {
                db.run("BEGIN TRANSACTION");

                const sql = `INSERT INTO entries (code, code_png, name, date) VALUES (?,?,?,?)`;

                for (const name of results) {
                    if (!name || !name.trim()) {
                        continue;
                    }
                    
                    const code = uuidv4();
                    const code_png = await qrcode.toDataURL(code);
                    const params = [code, code_png, name.trim(), Date.now()];
                    
                    db.run(sql, params);
                    const randomDelay = Math.floor(Math.random() * 11) + 5;
                    await sleep(randomDelay);
                }

                db.run("COMMIT", (err) => {
                    if (err) {
                        return res.status(500).json({ error: "Could not commit transaction." });
                    }
                    res.json({ message: `Successfully imported ${results.length} entries.` });
                });
            } catch (err) {
                db.run("ROLLBACK");
                res.status(500).json({ error: "Could not upload entries: " + err.message });
            }
        });
});

app.post('/api/entries/print', (req, res) => {
    const { codes, sortBy = 'name', order = 'ASC' } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "No entries selected for printing." });
    }

    const placeholders = codes.map(() => '?').join(',');
    const sql = `SELECT name, code, code_png FROM entries WHERE code IN (${placeholders}) ORDER BY ${sortBy} ${order}`;

    db.all(sql, codes, (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const doc = new PDFDocument({
            size: 'letter',
            margins: {
                top: 72,
                bottom: 72,
                left: 36,
                right: 36
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="badges.pdf"');
        doc.pipe(res);

        const { top, bottom, left, right } = doc.page.margins;
        const printableW = doc.page.width - left - right;
        const printableH = doc.page.height - top - bottom;
        
        const labelW = printableW / 2;
        const labelH = printableH / 3;
        
        const positions = [
            { x: left, y: top },
            { x: left + labelW, y: top },
            { x: left, y: top + labelH },
            { x: left + labelW, y: top + labelH },
            { x: left, y: top + labelH * 2 },
            { x: left + labelW, y: top + labelH * 2 },
        ];

        rows.forEach((entry, index) => {
            const slotIndex = index % 6;

            if (index > 0 && slotIndex === 0) {
                doc.addPage();
            }
            
            const pos = positions[slotIndex];
            const padding = 18;
            
            const imageBuffer = Buffer.from(entry.code_png.replace(/^data:image\/png;base64,/, ""), 'base64');

            doc.image(imageBuffer, pos.x + padding, pos.y + padding, {
                fit: [labelW - padding * 2, labelH - padding * 4],
                align: 'center'
            });

            const textY = pos.y + labelH - padding - 24;
            
            doc.fontSize(10).font('Helvetica-Bold').text(entry.name, pos.x, textY, {
                width: labelW,
                align: 'center'
            });

            doc.fontSize(8).font('Helvetica').text(entry.code, pos.x, textY + 14, {
                width: labelW,
                align: 'center'
            });
        });

        doc.end();
    });
});

app.get('/api/entry/print/:code', (req, res) => {
    const { code } = req.params;

    const sql = `SELECT name, code, code_png FROM entries WHERE code = ?`;

    db.get(sql, [code], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ "error": "Entry not found." });
        }

        const doc = new PDFDocument({
            size: 'letter',
            margins: {
                top: 72,
                bottom: 72,
                left: 36,
                right: 36
            }
        });

        const filename = `${row.name.replace(/\s+/g, '_')}_${row.code}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        const { top, bottom, left, right } = doc.page.margins;
        const printableW = doc.page.width - left - right;
        const printableH = doc.page.height - top - bottom;
        
        const labelW = printableW / 2;
        const labelH = printableH / 3;
        
        const pos = { x: left, y: top };
        const padding = 18;

        const imageBuffer = Buffer.from(row.code_png.replace(/^data:image\/png;base64,/, ""), 'base64');
        
        doc.image(imageBuffer, pos.x + padding, pos.y + padding, {
            fit: [labelW - padding * 2, labelH - padding * 4],
            align: 'center'
        });

        const textY = pos.y + labelH - padding - 24;

        doc.fontSize(10).font('Helvetica-Bold').text(row.name, pos.x, textY, {
            width: labelW,
            align: 'center'
        });

        doc.fontSize(8).font('Helvetica').text(row.code, pos.x, textY + 14, {
            width: labelW,
            align: 'center'
        });

        doc.end();
    });
});

app.get('/api/categories', (req, res) => {
    const { sortBy = 'name', order = 'ASC', search = '', page, limit } = req.query;

    if (page && limit) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        let offset = (pageNum - 1) * limitNum;

        const allowedSortBy = ['name', 'date'];
        const allowedOrder = ['ASC', 'DESC'];

        if (!allowedSortBy.includes(sortBy) || !allowedOrder.includes(order)) {
            return res.status(400).json({ "error": "Invalid sort parameters." });
        }

        const searchPattern = `%${search}%`;
        const countSql = `SELECT COUNT(*) as count FROM categories WHERE name LIKE ? AND name != 'General'`;
        
        db.get(countSql, [searchPattern], (err, countRow) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }

            const totalCategories = countRow.count;

            db.get("SELECT name, code FROM categories WHERE name = 'General'", [], (err, generalCategory) => {
                if (err) {
                    return res.status(500).json({ "error": err.message });
                }

                let finalCategories = [];
                if (generalCategory && pageNum === 1 && (!search || 'general'.includes(search.toLowerCase()))) {
                    finalCategories.push(generalCategory);
                }

                const dataSql = `
                    SELECT name, code FROM categories 
                    WHERE name LIKE ? AND name != 'General' 
                    ORDER BY ${sortBy} ${order} 
                    LIMIT ? OFFSET ?`;
                
                db.all(dataSql, [searchPattern, limitNum, offset], (err, rows) => {
                    if (err) {
                        return res.status(500).json({ "error": err.message });
                    }
                    
                    finalCategories = finalCategories.concat(rows);

                    res.json({
                        "message": "success",
                        "data": finalCategories,
                        "total": totalCategories
                    });
                });
            });
        });
    } else {
        db.all("SELECT name, code FROM categories ORDER BY CASE WHEN name = 'General' THEN 0 ELSE 1 END, name", [], (err, rows) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            res.json({
                "message": "success",
                "data": rows
            });
        });
    }
});

app.post('/api/category', (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ "error": "Name is required." });
    }

    if (name.trim().toLowerCase() === 'general') {
        return res.status(400).json({ "error": "'General' category cannot be created." });
    }

    const sql = `INSERT INTO categories (name, code, date) VALUES (?, ?, ?)`;
    const currentDate = Date.now();
    const categoryCode = uuidv4();
    const params = [name.trim(), categoryCode, currentDate];

    db.run(sql, params, function (err) {
        if (err) {
            if (err.errno === 19) { 
                return res.status(409).json({ "error": "Category with this name already exists." });
            }
            return res.status(500).json({ "error": "Could not create category." });
        }
        res.status(201).json({
            "message": "Successfully created category.",
            "data": { name: name.trim(), code: categoryCode }
        });
    });
});

app.post('/api/categories/import', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv({ headers: false }))
        .on('data', (data) => results.push(data[0]))
        .on('end', async () => {
            fs.unlinkSync(filePath);

            if (results.length === 0) {
                return res.status(400).json({ error: 'CSV file is empty or invalid.' });
            }

            try {
                db.run("BEGIN TRANSACTION");

                const sql = `INSERT OR IGNORE INTO categories (name, code, date) VALUES (?, ?, ?)`;
                let successfulImports = 0;

                for (const name of results) {
                    if (name && name.trim()) {
                        const currentDate = Date.now();
                        const categoryCode = uuidv4();
                        const params = [name.trim(), categoryCode, currentDate];
                        
                        await new Promise((resolve, reject) => {
                            db.run(sql, params, function(err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    if (this.changes > 0) {
                                        successfulImports++;
                                    }
                                    resolve();
                                }
                            });
                        });
                        const randomDelay = Math.floor(Math.random() * 11) + 5;
                        await sleep(randomDelay);
                    }
                }

                db.run("COMMIT", (err) => {
                    if (err) {
                        return res.status(500).json({ error: "Could not commit transaction." });
                    }
                    res.json({ message: `Successfully imported ${successfulImports} categories.` });
                });
            } catch (err) {
                db.run("ROLLBACK");
                res.status(500).json({ error: "Could not upload categories: " + err.message });
            }
        });
});

app.delete('/api/category/:code', (req, res) => {
    const { code } = req.params;

    db.get("SELECT name FROM categories WHERE code = ?", [code], (err, category) => {
        if (err || !category) {
            return res.status(404).json({ error: "Category not found." });
        }

        if (category.name.toLowerCase() === 'general') {
            return res.status(400).json({ error: "'General' category cannot be deleted." });
        }

        db.get("SELECT code FROM categories WHERE name = 'General'", (err, generalCategory) => {
            if (err || !generalCategory) {
                return res.status(500).json({ error: "Could not find the 'General' category." });
            }

            db.run("BEGIN TRANSACTION", (err) => {
                if (err) return res.status(500).json({ error: "Could not start transaction." });

                db.run('UPDATE scans SET category_code = ? WHERE category_code = ?', [generalCategory.code, code], function (err) {
                    if (err) {
                        return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not update scans." }));
                    }

                    db.run('DELETE FROM categories WHERE code = ?', [code], (err) => {
                        if (err) {
                            return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not delete category." }));
                        }

                        db.run("COMMIT", (err) => {
                            if (err) return res.status(500).json({ error: "Could not commit transaction." });
                            res.json({ message: "Successfully deleted category." });
                        });
                    });
                });
            });
        });
    });
});

app.post('/api/categories/delete', (req, res) => {
    const { codes } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    db.get("SELECT code FROM categories WHERE name = 'General'", (err, generalCategory) => {
        if (err || !generalCategory) {
            return res.status(500).json({ error: "Could not find the 'General' category." });
        }

        const filteredCodes = codes.filter(code => code !== generalCategory.code);
        if (filteredCodes.length === 0) {
            return res.json({ message: "No categories to delete." });
        }

        const placeholders = filteredCodes.map(() => '?').join(',');

        db.run("BEGIN TRANSACTION", (err) => {
            if (err) return res.status(500).json({ error: "Could not start transaction." });

            db.run(`UPDATE scans SET category_code = ? WHERE category_code IN (${placeholders})`, [generalCategory.code, ...filteredCodes], function (err) {
                if (err) {
                    return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not update scans." }));
                }

                db.run(`DELETE FROM categories WHERE code IN (${placeholders})`, filteredCodes, (err) => {
                    if (err) {
                        return db.run("ROLLBACK", () => res.status(400).json({ error: "Could not delete categories." }));
                    }

                    db.run("COMMIT", (err) => {
                        if (err) return res.status(500).json({ error: "Could not commit transaction." });
                        res.json({ message: "Successfully deleted categories." });
                    });
                });
            });
        });
    });
});

app.put('/api/category/:code', (req, res) => {
    const { code } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ "error": "Name is required." });
    }

    if (name.trim().toLowerCase() === 'general') {
        return res.status(400).json({ "error": "Category cannot be named 'General'." });
    }

    db.get("SELECT name FROM categories WHERE code = ?", [code], (err, category) => {
        if (err || !category) {
            return res.status(404).json({ error: "Category not found." });
        }

        if (category.name.toLowerCase() === 'general') {
            return res.status(400).json({ error: "'General' category cannot be renamed." });
        }

        db.run(
            `UPDATE categories SET name = ? WHERE code = ?`,
            [name.trim(), code],
            function (err) {
                if (err) {
                    if (err.errno === 19) {
                        return res.status(409).json({ "error": "Category with this name already exists." });
                    }
                    return res.status(400).json({ "error": "Could not update category." });
                }
                res.json({ message: "Successfully updated category." });
            }
        );
    });
});

app.post('/api/categories/export-csv', (req, res) => {
    const { codes, sortBy = 'name', order = 'ASC' } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    const placeholders = codes.map(() => '?').join(',');
    const allowedSortBy = ['name', 'date'];
    const allowedOrder = ['ASC', 'DESC'];

    if (!allowedSortBy.includes(sortBy) || !allowedOrder.includes(order)) {
        return res.status(400).json({ "error": "Invalid sort parameters." });
    }

    const sql = `SELECT name, date FROM categories WHERE code IN (${placeholders}) ORDER BY ${sortBy} ${order}`;

    db.all(sql, codes, (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        let csv = '"Name","Date"\n';
        rows.forEach(row => {
            const date = formatDateForDB(row.date);
            csv += `"${row.name}","${date}"\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="categories.csv"');
        res.status(200).send(csv);
    });
});

app.post('/api/categories/export-pdf', (req, res) => {
    const { codes, sortBy = 'name', order = 'ASC' } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    const placeholders = codes.map(() => '?').join(',');
    const allowedSortBy = ['name', 'date'];
    const allowedOrder = ['ASC', 'DESC'];

    if (!allowedSortBy.includes(sortBy) || !allowedOrder.includes(order)) {
        return res.status(400).json({ "error": "Invalid sort parameters." });
    }

    const sql = `SELECT name, date FROM categories WHERE code IN (${placeholders}) ORDER BY ${sortBy} ${order}`;

    db.all(sql, codes, (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const doc = new PDFDocument({ margin: 72 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="categories.pdf"');
        doc.pipe(res);

        const generateTable = (doc, tableRows) => {
            let tableTop = doc.y;
            const nameX = 72;
            const dateX = 450;
            const tableWidth = 478;
            const rowHeight = 25;
            let y = tableTop;

            const drawPage = (isFirstPage) => {
                if (!isFirstPage) {
                    doc.addPage();
                    tableTop = doc.y;
                    y = tableTop;
                }

                doc.font('Helvetica-Bold').fontSize(12);
                doc.text('Name', nameX, y + 6)
                   .text('Date', dateX, y + 6);
                
                doc.moveTo(nameX - 10, y).lineTo(nameX - 10 + tableWidth, y).stroke();
                doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();

                y += rowHeight;
                doc.font('Helvetica').fontSize(12);
            };

            drawPage(true);

            tableRows.forEach((row, index) => {
                if (index > 0 && index % 25 === 0) {
                    doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                    doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
                    doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
                    
                    drawPage(false);
                }

                const d = new Date(row.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const dayOfMonth = String(d.getDate()).padStart(2, '0');
                const date = `${month}/${dayOfMonth}/${year}`;
                doc.fontSize(10).text(row.name, nameX, y + 6);
                doc.fontSize(10).text(date, dateX, y + 6);
                doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                y += rowHeight;
            });

            doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
            doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
            doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
        };

        generateTable(doc, rows);

        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(12);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(now.getDate()).padStart(2, '0');
        const reportDate = `${month}/${dayOfMonth}/${year}`;
        const reportTime = formatTime24Hour(now);

        doc.text(`Generated report on ${reportDate} at ${reportTime}.`);
        doc.moveDown();
        doc.text(`Successfully exported ${rows.length} categories.`);
        doc.moveDown();
        doc.text("Scansheet v1.0.0");

        doc.end();
    });
});

app.get('/api/dates', (req, res) => {
    const { order = 'DESC', search = '' } = req.query;
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const offset = (page - 1) * limit;
    const { startDate, endDate, days } = req.query;

    const allowedOrder = ['ASC', 'DESC'];
    if (!allowedOrder.includes(order.toUpperCase())) {
        return res.status(400).json({ "error": "Invalid order parameter." });
    }

    let whereClauses = [];
    let params = [];

    if (startDate) {
        whereClauses.push('scan_date >= ?');
        params.push(startDate);
    }
    if (endDate) {
        whereClauses.push('scan_date <= ?');
        params.push(endDate);
    }
    if (days) {
        const dayList = days.split(',').map(d => parseInt(d, 10)).filter(d => d >= 0 && d <= 6);
        if (dayList.length > 0) {
            const placeholders = dayList.map(() => '?').join(',');
            whereClauses.push(`CAST(strftime('%w', scan_date) AS INTEGER) IN (${placeholders})`);
            params.push(...dayList);
        }
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(DISTINCT scan_date) as count FROM scans ${whereString}`;
    db.get(countSql, params, (err, countRow) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const totalDates = countRow.count;
        const dataSql = `
            SELECT DISTINCT scan_date 
            FROM scans 
            ${whereString} 
            ORDER BY scan_date ${order} 
            LIMIT ? OFFSET ?`;
        const dataParams = [...params, limit, offset];
        
        db.all(dataSql, dataParams, (err, rows) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            res.json({
                "message": "success",
                "data": rows.map(r => r.scan_date),
                "total": totalDates
            });
        });
    });
});

app.get('/api/dates/range', (req, res) => {
    const sql = `
        SELECT 
            MIN(scan_date) as minDate, 
            MAX(scan_date) as maxDate 
        FROM scans
    `;
    db.get(sql, [], (err, row) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});

app.get('/api/scans/:date', (req, res) => {
    const { date } = req.params;
    const { order = 'DESC', page = 1, limit = 10, categories } = req.query;

    const allowedOrder = ['ASC', 'DESC'];
    if (!allowedOrder.includes(order.toUpperCase())) {
        return res.status(400).json({ "error": "Invalid order parameter." });
    }

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit, 10);

    let whereClauses = ['s.scan_date = ?'];
    let params = [date];

    if (categories) {
        const categoryList = categories.split(',');
        if (categoryList.length > 0) {
            const placeholders = categoryList.map(() => '?').join(',');
            whereClauses.push(`s.category_code IN (${placeholders})`);
            params.push(...categoryList);
        }
    }

    const whereString = whereClauses.join(' AND ');

    const countSql = `SELECT COUNT(*) as count FROM scans s WHERE ${whereString}`;

    db.get(countSql, params, (err, countRow) => {
        if (err) {
            return res.status(500).json({ "error": err.message });
        }

        const totalScans = countRow.count;
        const dataSql = `
            SELECT s.date, e.name as entry_name, c.name as category_name
            FROM scans s
            JOIN entries e ON s.code = e.code
            JOIN categories c ON s.category_code = c.code
            WHERE ${whereString} 
            ORDER BY s.date ${order} 
            LIMIT ? OFFSET ?`;
        const dataParams = [...params, limitNum, offset];

        db.all(dataSql, dataParams, (err, rows) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }
            res.json({
                message: "success",
                data: rows,
                total: totalScans
            });
        });
    });
});

app.delete('/api/scans/date/:date', (req, res) => {
    const { date } = req.params;
    db.run('DELETE FROM scans WHERE scan_date = ?', [date], function(err) {
        if (err) {
            return res.status(400).json({ error: "Could not delete scans for this date." });
        }
        res.json({ message: `Successfully deleted all scans for ${date}.` });
    });
});

app.post('/api/scans/dates/delete', (req, res) => {
    const { dates } = req.body;
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({ error: "Invalid request. No dates provided." });
    }
    const placeholders = dates.map(() => '?').join(',');
    db.run(`DELETE FROM scans WHERE scan_date IN (${placeholders})`, dates, function(err) {
        if (err) {
            return res.status(400).json({ error: "Could not delete scans for the selected dates." });
        }
        res.json({ message: `Successfully deleted scans for ${dates.length} dates.` });
    });
});

app.post('/api/dates/compare-upload', upload.single('compareFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    res.json({
        message: 'File uploaded',
        filePath: req.file.path,
        originalName: req.file.originalname
    });
});

app.post('/api/dates/compare-delete', (req, res) => {
    const { filePath } = req.body;
    if (!filePath) {
        return res.status(400).json({ error: 'No file path provided.' });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Failed to delete temp file:", err);
            return res.status(500).json({ error: 'Could not delete file.' });
        }
        res.json({ message: 'File deleted.' });
    });
});

app.post('/api/dates/export-csv/:date', (req, res) => {
    const { date } = req.params;
    const { order = 'DESC', categories, removeDuplicates, alphabetize, compareFilePath, compareFileName } = req.body;

    let whereClauses = ['s.scan_date = ?'];
    let params = [date];

    if (categories) {
        const categoryList = categories.split(',');
        if (categoryList.length > 0) {
            const placeholders = categoryList.map(() => '?').join(',');
            whereClauses.push(`s.category_code IN (${placeholders})`);
            params.push(...categoryList);
        }
    }

    const whereString = whereClauses.join(' AND ');

    if (compareFilePath) {
        const importedNames = [];
        fs.createReadStream(compareFilePath)
            .pipe(csv({ headers: false }))
            .on('data', (data) => importedNames.push(data[0]))
            .on('end', () => {
                const sql = `
                    WITH RankedScans AS (
                        SELECT s.date, e.name as entry_name,
                               ROW_NUMBER() OVER(PARTITION BY s.code ORDER BY s.date DESC) as rn
                        FROM scans s
                        JOIN entries e ON s.code = e.code
                        JOIN categories c ON s.category_code = c.code
                        WHERE ${whereString}
                    )
                    SELECT date, entry_name
                    FROM RankedScans
                    WHERE rn = 1
                `;

                db.all(sql, params, (err, rows) => {
                    if (err) {
                        fs.unlinkSync(compareFilePath);
                        return res.status(500).json({ "error": err.message });
                    }

                    const scanMap = new Map();
                    rows.forEach(row => {
                        scanMap.set(row.entry_name, row.date);
                    });

                    let csv = '"Name","Present","Timestamp"\n';
                    importedNames.forEach(name => {
                        const timestamp = scanMap.get(name);
                        if (timestamp) {
                            const d = new Date(timestamp);
                            const time = formatTime24Hour(d);
                            csv += `"${name}","X","${time}"\n`;
                        } else {
                            csv += `"${name}","",""\n`;
                        }
                    });

                    fs.unlinkSync(compareFilePath);
                    const filename = `comparison_${date}.csv`;
                    res.header('Content-Type', 'text/csv');
                    res.header('Content-Disposition', `attachment; filename="${filename}"`);
                    res.status(200).send(csv);
                });
            })
            .on('error', (err) => {
                fs.unlinkSync(compareFilePath);
                res.status(500).json({ error: "Could not read comparison file." });
            });

    } else {
        let finalOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

        if (alphabetize) {
            finalOrder = `entry_name ASC, date ${finalOrder}`;
        } else {
            finalOrder = `date ${finalOrder}`;
        }

        let sql;
        if (removeDuplicates) {
            sql = `
                WITH RankedScans AS (
                    SELECT s.date, e.name as entry_name, c.name as category_name,
                           ROW_NUMBER() OVER(PARTITION BY s.code ORDER BY s.date DESC) as rn
                    FROM scans s
                    JOIN entries e ON s.code = e.code
                    JOIN categories c ON s.category_code = c.code
                    WHERE ${whereString}
                )
                SELECT date, entry_name, category_name
                FROM RankedScans
                WHERE rn = 1
                ORDER BY ${finalOrder}
            `;
        } else {
            sql = `
                SELECT s.date as date, e.name as entry_name, c.name as category_name
                FROM scans s
                JOIN entries e ON s.code = e.code
                JOIN categories c ON s.category_code = c.code
                WHERE ${whereString}
                ORDER BY ${finalOrder}
            `;
        }

        db.all(sql, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ "error": err.message });
            }

            let csv = '"Name","Date","Time","Category"\n';
            rows.forEach(row => {
                const d = new Date(row.date);
                const csvDate = formatDateForDB(d);
                const time = formatTime24Hour(d);
                csv += `"${row.entry_name}","${csvDate}","${time}","${row.category_name}"\n`;
            });

            const filename = `scans_${date}.csv`;
            res.header('Content-Type', 'text/csv');
            res.header('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(200).send(csv);
        });
    }
});

app.post('/api/dates/export-pdf/:date', (req, res) => {
    const { date } = req.params;
    const { order = 'DESC', categories, removeDuplicates, alphabetize, compareFilePath, compareFileName } = req.body;

    let whereClauses = ['s.scan_date = ?'];
    let params = [date];

    if (categories) {
        const categoryList = categories.split(',');
        if (categoryList.length > 0) {
            const placeholders = categoryList.map(() => '?').join(',');
            whereClauses.push(`s.category_code IN (${placeholders})`);
            params.push(...categoryList);
        }
    }

    const whereString = whereClauses.join(' AND ');

    if (compareFilePath) {
        const importedNames = [];
        fs.createReadStream(compareFilePath)
            .pipe(csv({ headers: false }))
            .on('data', (data) => importedNames.push(data[0]))
            .on('end', () => {
                const sql = `
                    WITH RankedScans AS (
                        SELECT s.date, e.name as entry_name,
                               ROW_NUMBER() OVER(PARTITION BY s.code ORDER BY s.date DESC) as rn
                        FROM scans s
                        JOIN entries e ON s.code = e.code
                        JOIN categories c ON s.category_code = c.code
                        WHERE ${whereString}
                    )
                    SELECT date, entry_name
                    FROM RankedScans
                    WHERE rn = 1
                `;

                db.all(sql, params, (err, rows) => {
                    if (err) {
                        fs.unlinkSync(compareFilePath);
                        return res.status(500).json({ "error": err.message });
                    }

                    const scanMap = new Map();
                    rows.forEach(row => {
                        scanMap.set(row.entry_name, row.date);
                    });

                    const results = importedNames.map(name => {
                        const timestamp = scanMap.get(name);
                        if (timestamp) {
                            const d = new Date(timestamp);
                            const time = formatTime24Hour(d);
                            return { name, present: 'X', time };
                        } else {
                            return { name, present: '', time: '' };
                        }
                    });

                    fs.unlinkSync(compareFilePath);

                    const doc = new PDFDocument({ margin: 72 });
                    const filename = `comparison_${date}.pdf`;
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    doc.pipe(res);

                    const generateTable = (doc, tableRows) => {
                        let tableTop = doc.y;
                        const nameX = 72, presentX = 350, timeX = 450;
                        const tableWidth = 478;
                        const rowHeight = 25;
                        let y = tableTop;

                        const drawPage = (isFirstPage) => {
                            if (!isFirstPage) {
                                doc.addPage();
                                tableTop = doc.y;
                                y = tableTop;
                            }
                            doc.font('Helvetica-Bold').fontSize(12);
                            doc.text('Name', nameX, y + 6)
                               .text('Present', presentX, y + 6)
                               .text('Timestamp', timeX, y + 6);
                            doc.moveTo(nameX - 10, y).lineTo(nameX - 10 + tableWidth, y).stroke();
                            doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                            y += rowHeight;
                            doc.font('Helvetica').fontSize(10);
                        };

                        drawPage(true);

                        tableRows.forEach((row, index) => {
                            if (index > 0 && index % 25 === 0) {
                                doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                                doc.moveTo(presentX - 10, tableTop).lineTo(presentX - 10, y).stroke();
                                doc.moveTo(timeX - 10, tableTop).lineTo(timeX - 10, y).stroke();
                                doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
                                drawPage(false);
                            }
                            doc.text(row.name, nameX, y + 6)
                               .text(row.present, presentX, y + 6)
                               .text(row.time, timeX, y + 6);
                            doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                            y += rowHeight;
                        });

                        doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                        doc.moveTo(presentX - 10, tableTop).lineTo(presentX - 10, y).stroke();
                        doc.moveTo(timeX - 10, tableTop).lineTo(timeX - 10, y).stroke();
                        doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
                    };

                    generateTable(doc, results);

                    doc.addPage();
                    doc.font('Helvetica-Bold').fontSize(12);
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(now.getDate()).padStart(2, '0');
                    const reportDate = `${month}/${dayOfMonth}/${year}`;
                    const reportTime = formatTime24Hour(now);

                    const [year_s, month_s, day_s] = date.split('-');
                    const formattedDate = `${month_s}/${day_s}/${year_s}`;

                    doc.text(`Generated report for ${formattedDate} on ${reportDate} at ${reportTime}.`);
                    doc.moveDown();
                    doc.font('Helvetica').fontSize(10);
                    doc.text(`Successfully compared against the following file: ${compareFileName || 'Unknown'}.`);
                    doc.moveDown();
                    doc.font('Helvetica-Bold').fontSize(12);
                    doc.text("Scansheet v1.0.0");
                    doc.end();
                });
            })
            .on('error', (err) => {
                fs.unlinkSync(compareFilePath);
                res.status(500).json({ error: "Could not read comparison file." });
            });

    } else {
        let finalOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

        if (alphabetize) {
            finalOrder = `entry_name ASC, date ${finalOrder}`;
        } else {
            finalOrder = `date ${finalOrder}`;
        }

        let sql;
        if (removeDuplicates) {
            sql = `
                WITH RankedScans AS (
                    SELECT s.date, e.name as entry_name, c.name as category_name,
                           ROW_NUMBER() OVER(PARTITION BY s.code ORDER BY s.date DESC) as rn
                    FROM scans s
                    JOIN entries e ON s.code = e.code
                    JOIN categories c ON s.category_code = c.code
                    WHERE ${whereString}
                )
                SELECT date, entry_name, category_name
                FROM RankedScans
                WHERE rn = 1
                ORDER BY ${finalOrder}
            `;
        } else {
            sql = `
                SELECT s.date as date, e.name as entry_name, c.name as category_name
                FROM scans s
                JOIN entries e ON s.code = e.code
                JOIN categories c ON s.category_code = c.code
                WHERE ${whereString}
                ORDER BY ${finalOrder}
            `;
        }

        db.all(sql, params, (err, rows) => {
            if (err) { return res.status(500).json({ "error": err.message }); }

            const doc = new PDFDocument({ margin: 72 });
            const filename = `scans_${date}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            doc.pipe(res);

            const generateTable = (doc, tableRows) => {
                let tableTop = doc.y;
                const nameX = 72, dateX = 240, timeX = 340, categoryX = 400;
                const tableWidth = 468;
                const rowHeight = 25;
                let y = tableTop;

                const drawPage = (isFirstPage) => {
                    if (!isFirstPage) {
                        doc.addPage();
                        tableTop = doc.y;
                        y = tableTop;
                    }
                    doc.font('Helvetica-Bold').fontSize(12);
                    doc.text('Name', nameX, y + 6)
                       .text('Date', dateX, y + 6)
                       .text('Time', timeX, y + 6)
                       .text('Category', categoryX, y + 6);
                    doc.moveTo(nameX - 10, y).lineTo(nameX - 10 + tableWidth, y).stroke();
                    doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                    y += rowHeight;
                    doc.font('Helvetica').fontSize(10);
                };

                drawPage(true);

                tableRows.forEach((row, index) => {
                    if (index > 0 && index % 25 === 0) {
                        doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                        doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
                        doc.moveTo(timeX - 10, tableTop).lineTo(timeX - 10, y).stroke();
                        doc.moveTo(categoryX - 10, tableTop).lineTo(categoryX - 10, y).stroke();
                        doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();

                        drawPage(false);
                    }
                    const d = new Date(row.date);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = String(d.getDate()).padStart(2, '0');
                    const formattedDate = `${month}/${dayOfMonth}/${year}`;
                    const time = formatTime24Hour(d);
                    doc.text(row.entry_name, nameX, y + 6)
                       .text(formattedDate, dateX, y + 6)
                       .text(time, timeX, y + 6)
                       .text(row.category_name, categoryX, y + 6);
                    doc.moveTo(nameX - 10, y + rowHeight).lineTo(nameX - 10 + tableWidth, y + rowHeight).stroke();
                    y += rowHeight;
                });

                doc.moveTo(nameX - 10, tableTop).lineTo(nameX - 10, y).stroke();
                doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
                doc.moveTo(timeX - 10, tableTop).lineTo(timeX - 10, y).stroke();
                doc.moveTo(categoryX - 10, tableTop).lineTo(categoryX - 10, y).stroke();
                doc.moveTo(nameX - 10 + tableWidth, tableTop).lineTo(nameX - 10 + tableWidth, y).stroke();
            };

            generateTable(doc, rows);

            doc.addPage();
            doc.font('Helvetica-Bold').fontSize(12);
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const dayOfMonth = String(now.getDate()).padStart(2, '0');
            const reportDate = `${month}/${dayOfMonth}/${year}`;
            const reportTime = formatTime24Hour(now);
            
            const getCategoryNames = (callback) => {
                if (!categories) {
                    return callback('All');
                }
                const categoryList = categories.split(',');
                if (categoryList.length === 0) {
                    return callback('None');
                }
                const placeholders = categoryList.map(() => '?').join(',');
                const catSql = `SELECT name FROM categories WHERE code IN (${placeholders})`;
                db.all(catSql, categoryList, (err, catRows) => {
                    if (err || catRows.length === 0) {
                        return callback('N/A');
                    }
                    callback(catRows.map(r => r.name).join(', '));
                });
            };

            getCategoryNames(categoryString => {
                const [year, month, day] = date.split('-');
                const formattedDate = `${month}/${day}/${year}`;

                doc.text(`Generated report for ${formattedDate} on ${reportDate} at ${reportTime}.`);
                doc.moveDown();
                doc.text(`Successfully exported ${rows.length} scans, using the following options:`);
                doc.font('Helvetica').fontSize(10);
                doc.text(`Categories: ${categoryString}`);
                doc.moveDown();
                doc.font('Helvetica-Bold').fontSize(12);
                doc.text("Scansheet v1.0.0");

                doc.end();
            });
        });
    }
});

app.put('/api/scan/:timestamp', (req, res) => {
    const { timestamp } = req.params;
    const { date, time } = req.body;

    if (!date || !time) {
        return res.status(400).json({ "error": "Date and time are required." });
    }

    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);

    const newDate = new Date(year, month - 1, day, hours, minutes, seconds);

    if (newDate > new Date()) {
        return res.status(400).json({ "error": "Cannot select a future date or time." });
    }

    const newTimestamp = newDate.getTime();
    const newScanDate = formatDateForDB(newDate);

    db.run(
        `UPDATE scans SET date = ?, scan_date = ? WHERE date = ?`,
        [newTimestamp, newScanDate, timestamp],
        function (err) {
            if (err) {
                res.status(400).json({ "error": "Could not update scan." });
                return;
            }
            res.json({ message: "Successfully updated scan." });
        }
    );
});

app.post('/api/dates/export-csv', (req, res) => {
    const { dates, order = 'DESC' } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    const sortedDates = dates.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return order === 'ASC' ? dateA - dateB : dateB - dateA;
    });

    const formattedDates = sortedDates.map(dateStr => {
         const date = new Date(dateStr);
         const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
         const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
         const day = String(correctedDate.getDate()).padStart(2, '0');
         const year = correctedDate.getFullYear();
         return `${month}/${day}/${year}`;
    });

    let csv = '"Date"\n';
    formattedDates.forEach(formattedDate => {
        csv += `"${formattedDate}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="dates.csv"');
    res.status(200).send(csv);
});

app.post('/api/dates/export-pdf', (req, res) => {
    const { dates, order = 'DESC' } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({ error: "Invalid request." });
    }

    const sortedDates = dates.sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return order === 'ASC' ? dateA - dateB : dateB - dateA;
    });

     const formattedDates = sortedDates.map(dateStr => {
         const date = new Date(dateStr);
         const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
         const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
         const day = String(correctedDate.getDate()).padStart(2, '0');
         const year = correctedDate.getFullYear();
         return `${month}/${day}/${year}`;
    });

    const doc = new PDFDocument({ margin: 72 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="dates.pdf"');
    doc.pipe(res);

    const generateTable = (doc, tableRows) => {
        let tableTop = doc.y;
        const dateX = 72;
        const tableWidth = 478;
        const rowHeight = 25;
        let y = tableTop;

        const drawPage = (isFirstPage) => {
            if (!isFirstPage) {
                doc.addPage();
                tableTop = doc.y;
                y = tableTop;
            }

            doc.font('Helvetica-Bold').fontSize(12);
            doc.text('Date', dateX, y + 6);

            doc.moveTo(dateX - 10, y).lineTo(dateX - 10 + tableWidth, y).stroke();
            doc.moveTo(dateX - 10, y + rowHeight).lineTo(dateX - 10 + tableWidth, y + rowHeight).stroke();

            y += rowHeight;
            doc.font('Helvetica').fontSize(12);
        };

        drawPage(true);

        tableRows.forEach((formattedDate, index) => {
             if (index > 0 && index % 25 === 0) {
                doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
                doc.moveTo(dateX - 10 + tableWidth, tableTop).lineTo(dateX - 10 + tableWidth, y).stroke();
                drawPage(false);
            }

            doc.fontSize(10).text(formattedDate, dateX, y + 6);
            doc.moveTo(dateX - 10, y + rowHeight).lineTo(dateX - 10 + tableWidth, y + rowHeight).stroke();
            y += rowHeight;
        });

        doc.moveTo(dateX - 10, tableTop).lineTo(dateX - 10, y).stroke();
        doc.moveTo(dateX - 10 + tableWidth, tableTop).lineTo(dateX - 10 + tableWidth, y).stroke();
    };

    generateTable(doc, formattedDates);

    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(12);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(now.getDate()).padStart(2, '0');
    const reportDate = `${month}/${dayOfMonth}/${year}`;
    const reportTime = formatTime24Hour(now);

    doc.text(`Generated report on ${reportDate} at ${reportTime}.`);
    doc.moveDown();
    doc.text(`Successfully exported ${formattedDates.length} dates.`);
    doc.moveDown();
    doc.text("Scansheet v1.0.0");

    doc.end();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };

use crate::AppState;
use chrono::{Local, NaiveDate, NaiveTime, TimeZone};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Serialize, Deserialize)]
pub struct Scan {
    pub date: i64,
    pub entry_name: String,
    pub category_name: String,
}

#[derive(Serialize)]
pub struct ScansResponse {
    pub message: String,
    pub data: Vec<Scan>,
    pub total: i64,
}

#[tauri::command]
pub fn get_scans(
    state: State<'_, AppState>,
    date: String,
    order: Option<String>,
    page: Option<i32>,
    limit: Option<i32>,
    categories: Option<String>,
) -> Result<ScansResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let ord = order.unwrap_or_else(|| "DESC".to_string());
    if ord.to_uppercase() != "ASC" && ord.to_uppercase() != "DESC" {
        return Err("Invalid order parameter.".to_string());
    }

    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(10);
    let offset = (p - 1) * l;

    let mut where_clauses = vec!["s.scan_date = ?".to_string()];
    let mut params_vals: Vec<String> = vec![date.clone()];

    if let Some(cats) = categories {
        let cat_list: Vec<&str> = cats.split(',').filter(|c| !c.is_empty()).collect();
        if !cat_list.is_empty() {
            let placeholders = cat_list.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            where_clauses.push(format!("s.category_code IN ({})", placeholders));
            for cat in cat_list {
                params_vals.push(cat.to_string());
            }
        }
    }

    let where_string = where_clauses.join(" AND ");
    let count_sql = format!("SELECT COUNT(*) FROM scans s WHERE {}", where_string);

    let mut count_stmt = db.prepare(&count_sql).map_err(|e| e.to_string())?;
    let total: i64 = count_stmt
        .query_row(rusqlite::params_from_iter(params_vals.iter()), |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let data_sql = format!(
        "SELECT s.date, e.name as entry_name, c.name as category_name \
         FROM scans s \
         JOIN entries e ON s.code = e.code \
         JOIN categories c ON s.category_code = c.code \
         WHERE {} \
         ORDER BY s.date {} \
         LIMIT ? OFFSET ?",
        where_string, ord
    );

    let mut data_params: Vec<rusqlite::types::ToSqlOutput<'_>> = params_vals
        .iter()
        .map(|s| rusqlite::types::ToSqlOutput::from(s.as_str()))
        .collect();
    data_params.push(rusqlite::types::ToSqlOutput::from(l));
    data_params.push(rusqlite::types::ToSqlOutput::from(offset));

    let mut stmt = db.prepare(&data_sql).map_err(|e| e.to_string())?;
    let scan_iter = stmt
        .query_map(rusqlite::params_from_iter(data_params.iter()), |row| {
            Ok(Scan {
                date: row.get(0)?,
                entry_name: row.get(1)?,
                category_name: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut data = Vec::new();
    for scan in scan_iter {
        data.push(scan.map_err(|e| e.to_string())?);
    }

    Ok(ScansResponse {
        message: "success".to_string(),
        data,
        total,
    })
}

#[tauri::command]
pub fn delete_scan(state: State<'_, AppState>, timestamp: i64) -> Result<String, String> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;

    let count: i32 = db
        .query_row(
            "SELECT COUNT(*) FROM scans WHERE date = ?1",
            params![timestamp],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if count == 0 {
        return Err("Scan not found.".to_string());
    }

    let tx = db.transaction().map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM scans WHERE date = ?1", params![timestamp])
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;

    Ok("Successfully deleted scan.".to_string())
}

#[tauri::command]
pub fn delete_scans_by_date(state: State<'_, AppState>, date: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM scans WHERE scan_date = ?1", params![date])
        .map_err(|e| e.to_string())?;
    
    Ok(format!("Successfully deleted all scans for {}.", date))
}

#[tauri::command]
pub fn get_scans_by_dates(
    state: State<'_, AppState>,
    dates: Vec<String>,
    order: Option<String>,
) -> Result<Vec<Scan>, String> {
    if dates.is_empty() {
        return Ok(Vec::new());
    }

    let db = state.db.lock().map_err(|e| e.to_string())?;

    let ord = order.unwrap_or_else(|| "DESC".to_string());
    if ord.to_uppercase() != "ASC" && ord.to_uppercase() != "DESC" {
        return Err("Invalid order parameter.".to_string());
    }

    let placeholders = dates.iter().map(|_| "?").collect::<Vec<&str>>().join(",");
    let sql = format!(
        "SELECT s.date, e.name as entry_name, c.name as category_name \
         FROM scans s \
         JOIN entries e ON s.code = e.code \
         JOIN categories c ON s.category_code = c.code \
         WHERE s.scan_date IN ({}) \
         ORDER BY s.date {}",
        placeholders, ord
    );

    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    
    let params: Vec<&dyn rusqlite::ToSql> = dates.iter().map(|d| d as &dyn rusqlite::ToSql).collect();
    let scan_iter = stmt
        .query_map(params.as_slice(), |row| {
            Ok(Scan {
                date: row.get(0)?,
                entry_name: row.get(1)?,
                category_name: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut data = Vec::new();
    for scan in scan_iter {
        data.push(scan.map_err(|e| e.to_string())?);
    }

    Ok(data)
}

#[tauri::command]
pub fn bulk_delete_scans_by_dates(state: State<'_, AppState>, dates: Vec<String>) -> Result<String, String> {
    if dates.is_empty() {
        return Err("Invalid request. No dates provided.".to_string());
    }

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let placeholders = dates.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!("DELETE FROM scans WHERE scan_date IN ({})", placeholders);
    
    db.execute(&sql, rusqlite::params_from_iter(dates.iter()))
        .map_err(|_e| "Could not delete scans for the selected dates.".to_string())?;

    Ok(format!("Successfully deleted scans for {} dates.", dates.len()))
}

#[tauri::command]
pub fn create_scan(state: State<'_, AppState>, code: String, category_code: String) -> Result<String, String> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;

    let last_scan: Option<i64> = db.query_row(
        "SELECT MAX(date) FROM scans WHERE code = ?1",
        params![&code],
        |row| row.get(0),
    ).unwrap_or(None);

    let now = chrono::Utc::now().timestamp_millis();

    if let Some(last_timestamp) = last_scan {
        let time_difference = now - last_timestamp;
        if time_difference < 600000 {
            return Err("Entry scanned less than 10 minutes ago.".to_string());
        }
    }

    let name: String = db.query_row(
        "SELECT name FROM entries WHERE code = ?1",
        params![&code],
        |row| row.get(0),
    ).map_err(|_| "Invalid code.".to_string())?;

    let current_local = Local::now();
    let scan_date_formatted = current_local.format("%Y-%m-%d").to_string();

    let tx = db.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO scans (code, date, scan_date, category_code) VALUES (?1, ?2, ?3, ?4)",
        params![code, now, scan_date_formatted, category_code],
    ).map_err(|_| "Could not record scan.".to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(format!("Successfully scanned code for {}.", name))
}

#[tauri::command]
pub fn record_scan(
    state: State<'_, AppState>,
    code: String,
    category_code: String,
    date: String,
    time: String,
) -> Result<String, String> {
    if code.is_empty() || category_code.is_empty() || date.is_empty() || time.is_empty() {
        return Err("Code, category, date, and time are required.".to_string());
    }

    let parsed_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d").map_err(|_| "Invalid date format".to_string())?;
    let parsed_time = NaiveTime::parse_from_str(&time, "%H:%M:%S").map_err(|_| "Invalid time format".to_string())?;
    let datetime = parsed_date.and_time(parsed_time);
    
    // Original express server did `new Date(year, month - 1, day, hours, minutes, seconds)`
    // which operates in the local timezone.
    let local_datetime = Local.from_local_datetime(&datetime).single().ok_or("Invalid local datetime".to_string())?;
    let new_timestamp = local_datetime.timestamp_millis();

    if new_timestamp > Local::now().timestamp_millis() {
        return Err("Cannot select a future date or time.".to_string());
    }

    let db = state.db.lock().map_err(|e| e.to_string())?;

    let name: String = db.query_row(
        "SELECT name FROM entries WHERE code = ?1",
        params![&code],
        |row| row.get(0),
    ).map_err(|_| "Invalid code.".to_string())?;

    let new_scan_date = parsed_date.format("%Y-%m-%d").to_string();

    db.execute(
        "INSERT INTO scans (code, date, scan_date, category_code) VALUES (?1, ?2, ?3, ?4)",
        params![code, new_timestamp, new_scan_date, category_code],
    ).map_err(|_| "Could not record scan.".to_string())?;

    Ok(format!("Successfully created scan for {}.", name))
}

#[tauri::command]
pub fn update_scan(
    state: State<'_, AppState>,
    timestamp: String,
    date: String,
    time: String,
) -> Result<String, String> {
    let ts_int: i64 = timestamp.parse().map_err(|_| "Invalid timestamp".to_string())?;

    if date.is_empty() || time.is_empty() {
        return Err("Date and time are required.".to_string());
    }

    let parsed_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d").map_err(|_| "Invalid date format".to_string())?;
    let parsed_time = NaiveTime::parse_from_str(&time, "%H:%M:%S").map_err(|_| "Invalid time format".to_string())?;
    let datetime = parsed_date.and_time(parsed_time);
    
    let local_datetime = Local.from_local_datetime(&datetime).single().ok_or("Invalid local datetime".to_string())?;
    let new_timestamp = local_datetime.timestamp_millis();

    if new_timestamp > Local::now().timestamp_millis() {
        return Err("Cannot select a future date or time.".to_string());
    }

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let new_scan_date = parsed_date.format("%Y-%m-%d").to_string();

    db.execute(
        "UPDATE scans SET date = ?1, scan_date = ?2 WHERE date = ?3",
        params![new_timestamp, new_scan_date, ts_int],
    ).map_err(|_| "Could not update scan.".to_string())?;

    Ok("Successfully updated scan.".to_string())
}

#[tauri::command]
pub fn get_scans_for_export(
    state: State<'_, AppState>,
    date: String,
    order: Option<String>,
    categories: Option<String>,
    remove_duplicates: bool,
    alphabetize: bool,
) -> Result<Vec<Scan>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut where_clauses = vec!["s.scan_date = ?".to_string()];
    let mut params_vals: Vec<String> = vec![date];

    if let Some(cats) = categories {
        let cat_list: Vec<&str> = cats.split(',').filter(|c| !c.is_empty()).collect();
        if !cat_list.is_empty() {
            let placeholders = cat_list.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            where_clauses.push(format!("s.category_code IN ({})", placeholders));
            for cat in cat_list {
                params_vals.push(cat.to_string());
            }
        }
    }

    let where_string = where_clauses.join(" AND ");

    let ord = order.unwrap_or_else(|| "DESC".to_string());
    let mut final_order = if ord.to_uppercase() == "ASC" || ord.to_uppercase() == "DESC" {
        ord.to_uppercase()
    } else {
        "DESC".to_string()
    };

    if alphabetize {
        final_order = format!("entry_name ASC, date {}", final_order);
    } else {
        final_order = format!("date {}", final_order);
    }

    let sql = if remove_duplicates {
        format!("
            WITH RankedScans AS (
                SELECT s.date, e.name as entry_name, c.name as category_name,
                       ROW_NUMBER() OVER(PARTITION BY s.code ORDER BY s.date DESC) as rn
                FROM scans s
                JOIN entries e ON s.code = e.code
                JOIN categories c ON s.category_code = c.code
                WHERE {}
            )
            SELECT date, entry_name, category_name
            FROM RankedScans
            WHERE rn = 1
            ORDER BY {}
        ", where_string, final_order)
    } else {
        format!("
            SELECT s.date as date, e.name as entry_name, c.name as category_name
            FROM scans s
            JOIN entries e ON s.code = e.code
            JOIN categories c ON s.category_code = c.code
            WHERE {}
            ORDER BY {}
        ", where_string, final_order)
    };

    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    let scans = stmt
        .query_map(rusqlite::params_from_iter(params_vals.iter()), |row| {
            Ok(Scan {
                date: row.get(0)?,
                entry_name: row.get(1)?,
                category_name: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(scans)
}

#[derive(Serialize, Deserialize)]
pub struct ComparisonResult {
    pub name: String,
    pub present: String,
    pub timestamp: String,
}

#[tauri::command]
pub fn get_comparison_export(
    state: State<'_, AppState>,
    date: String,
    categories: Option<String>,
    compare_file_path: String,
) -> Result<Vec<ComparisonResult>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let mut reader = csv::ReaderBuilder::new().has_headers(false).from_path(&compare_file_path).map_err(|e| e.to_string())?;
    let mut imported_names = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|e| e.to_string())?;
        if let Some(name) = record.get(0) {
            if !name.trim().is_empty() {
                imported_names.push(name.trim().to_string());
            }
        }
    }

    let mut where_clauses = vec!["s.scan_date = ?".to_string()];
    let mut params_vals: Vec<String> = vec![date];

    if let Some(cats) = categories {
        let cat_list: Vec<&str> = cats.split(',').filter(|c| !c.is_empty()).collect();
        if !cat_list.is_empty() {
            let placeholders = cat_list.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            where_clauses.push(format!("s.category_code IN ({})", placeholders));
            for cat in cat_list {
                params_vals.push(cat.to_string());
            }
        }
    }

    let where_string = where_clauses.join(" AND ");

    let sql = format!("
        WITH RankedScans AS (
            SELECT s.date, e.name as entry_name,
                   ROW_NUMBER() OVER(PARTITION BY s.code ORDER BY s.date DESC) as rn
            FROM scans s
            JOIN entries e ON s.code = e.code
            JOIN categories c ON s.category_code = c.code
            WHERE {}
        )
        SELECT date, entry_name
        FROM RankedScans
        WHERE rn = 1
    ", where_string);

    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    
    use std::collections::HashMap;
    let mut scan_map = HashMap::new();

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_vals.iter()), |row| {
            let date: i64 = row.get(0)?;
            let name: String = row.get(1)?;
            Ok((name, date))
        })
        .map_err(|e| e.to_string())?;

    for row in rows {
        let (name, date) = row.map_err(|e| e.to_string())?;
        scan_map.insert(name, date);
    }

    let mut results = Vec::new();
    for name in imported_names {
        if let Some(timestamp) = scan_map.get(&name) {
            let local_time = Local.timestamp_millis_opt(*timestamp).single().ok_or("Invalid timestamp")?;
            let time_str = local_time.format("%H:%M:%S").to_string();
            results.push(ComparisonResult {
                name,
                present: "X".to_string(),
                timestamp: time_str,
            });
        } else {
            results.push(ComparisonResult {
                name,
                present: "".to_string(),
                timestamp: "".to_string(),
            });
        }
    }

    Ok(results)
}


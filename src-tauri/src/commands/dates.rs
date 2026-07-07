use crate::AppState;
use rusqlite::params;
use serde::Serialize;
use tauri::State;
use crate::commands::scans::Scan;

#[derive(Serialize)]
pub struct DatesResponse {
    pub message: String,
    pub data: Vec<String>,
    pub total: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DateRange {
    pub min_date: Option<String>,
    pub max_date: Option<String>,
}

#[derive(Serialize)]
pub struct DateRangeResponse {
    pub message: String,
    pub data: DateRange,
}

#[derive(Serialize)]
pub struct EntryScansResponse {
    pub message: String,
    pub data: Vec<Scan>,
    pub total: i64,
}

#[tauri::command]
pub fn get_dates(
    state: State<'_, AppState>,
    order: Option<String>,
    _search: Option<String>,
    page: Option<i32>,
    limit: Option<i32>,
    start_date: Option<String>,
    end_date: Option<String>,
    days: Option<String>,
) -> Result<DatesResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let ord = order.unwrap_or_else(|| "DESC".to_string());
    if ord.to_uppercase() != "ASC" && ord.to_uppercase() != "DESC" {
        return Err("Invalid order parameter.".to_string());
    }

    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(10);
    let offset = (p - 1) * l;

    let mut where_clauses = Vec::new();
    let mut params_vals = Vec::new();

    if let Some(start) = start_date {
        where_clauses.push("scan_date >= ?".to_string());
        params_vals.push(start);
    }
    if let Some(end) = end_date {
        where_clauses.push("scan_date <= ?".to_string());
        params_vals.push(end);
    }
    if let Some(d_str) = days {
        let day_list: Vec<i32> = d_str
            .split(',')
            .filter_map(|s| s.parse::<i32>().ok())
            .filter(|&d| d >= 0 && d <= 6)
            .collect();
        if !day_list.is_empty() {
            let placeholders = day_list.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            where_clauses.push(format!("CAST(strftime('%w', scan_date) AS INTEGER) IN ({})", placeholders));
            for d in day_list {
                params_vals.push(d.to_string());
            }
        }
    }

    let where_string = if where_clauses.is_empty() {
        "".to_string()
    } else {
        format!("WHERE {}", where_clauses.join(" AND "))
    };

    let count_sql = format!("SELECT COUNT(DISTINCT scan_date) FROM scans {}", where_string);
    
    let mut count_stmt = db.prepare(&count_sql).map_err(|e| e.to_string())?;
    let total: i64 = count_stmt
        .query_row(rusqlite::params_from_iter(params_vals.iter()), |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let data_sql = format!(
        "SELECT DISTINCT scan_date FROM scans {} ORDER BY scan_date {} LIMIT ? OFFSET ?",
        where_string, ord
    );

    let mut data_params: Vec<rusqlite::types::ToSqlOutput<'_>> = params_vals
        .iter()
        .map(|s| rusqlite::types::ToSqlOutput::from(s.as_str()))
        .collect();
    data_params.push(rusqlite::types::ToSqlOutput::from(l));
    data_params.push(rusqlite::types::ToSqlOutput::from(offset));

    let mut stmt = db.prepare(&data_sql).map_err(|e| e.to_string())?;
    let date_iter = stmt
        .query_map(rusqlite::params_from_iter(data_params.iter()), |row| {
            row.get::<_, String>(0)
        })
        .map_err(|e| e.to_string())?;

    let mut data = Vec::new();
    for date in date_iter {
        data.push(date.map_err(|e| e.to_string())?);
    }

    Ok(DatesResponse {
        message: "success".to_string(),
        data,
        total,
    })
}

#[tauri::command]
pub fn get_date_range(state: State<'_, AppState>) -> Result<DateRangeResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare("SELECT MIN(scan_date), MAX(scan_date) FROM scans").map_err(|e| e.to_string())?;
    
    let range = stmt.query_row([], |row| {
        Ok(DateRange {
            min_date: row.get(0)?,
            max_date: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    Ok(DateRangeResponse {
        message: "success".to_string(),
        data: range,
    })
}

#[tauri::command]
pub fn get_entry_scans(
    state: State<'_, AppState>,
    code: String,
    order: Option<String>,
    page: Option<i32>,
    limit: Option<i32>,
    start_date: Option<String>,
    end_date: Option<String>,
    days: Option<String>,
    categories: Option<String>,
) -> Result<EntryScansResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let ord = order.unwrap_or_else(|| "DESC".to_string());
    if ord.to_uppercase() != "ASC" && ord.to_uppercase() != "DESC" {
        return Err("Invalid order parameter.".to_string());
    }

    let p = page.unwrap_or(1);
    let l = limit.unwrap_or(10);
    let offset = (p - 1) * l;

    let mut where_clauses = vec!["s.code = ?".to_string()];
    let mut params_vals = vec![code];

    if let Some(start) = start_date {
        where_clauses.push("s.scan_date >= ?".to_string());
        params_vals.push(start);
    }
    if let Some(end) = end_date {
        where_clauses.push("s.scan_date <= ?".to_string());
        params_vals.push(end);
    }
    if let Some(d_str) = days {
        let day_list: Vec<i32> = d_str
            .split(',')
            .filter_map(|s| s.parse::<i32>().ok())
            .filter(|&d| d >= 0 && d <= 6)
            .collect();
        if !day_list.is_empty() {
            let placeholders = day_list.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            where_clauses.push(format!("CAST(strftime('%w', s.date / 1000, 'unixepoch', 'localtime') AS INTEGER) IN ({})", placeholders));
            for d in day_list {
                params_vals.push(d.to_string());
            }
        }
    }
    if let Some(cats) = categories {
        let cat_list: Vec<&str> = cats.split(',').filter(|c| !c.is_empty()).collect();
        if !cat_list.is_empty() {
            let placeholders = cat_list.iter().map(|_| "?").collect::<Vec<_>>().join(",");
            where_clauses.push(format!("s.category_code IN ({})", placeholders));
            for c in cat_list {
                params_vals.push(c.to_string());
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
        "SELECT s.date, '' as entry_name, c.name as category_name \
         FROM scans s \
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

    Ok(EntryScansResponse {
        message: "success".to_string(),
        data,
        total,
    })
}

#[tauri::command]
pub fn get_entry_date_range(state: State<'_, AppState>, code: String) -> Result<DateRangeResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare("SELECT MIN(scan_date), MAX(scan_date) FROM scans WHERE code = ?").map_err(|e| e.to_string())?;
    
    let range = stmt.query_row(params![code], |row| {
        Ok(DateRange {
            min_date: row.get(0)?,
            max_date: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?;

    Ok(DateRangeResponse {
        message: "success".to_string(),
        data: range,
    })
}

// FIX: Implement export commands (CSV/PDF) and compare upload logic for dates

use crate::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Entry {
    pub code: String,
    pub name: String,
    pub code_png: Option<String>,
    pub date: i64,
}

#[derive(Serialize)]
pub struct EntriesResponse {
    pub message: String,
    pub data: Vec<Entry>,
    pub total: i64,
}

#[derive(Serialize)]
pub struct SingleEntryResponse {
    pub message: String,
    pub data: Entry,
}

#[tauri::command]
pub fn get_entries(
    state: State<'_, AppState>,
    search: String,
    sort_by: String,
    order: String,
    page: i32,
    limit: i32,
) -> Result<EntriesResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let allowed_sort_by = ["name", "date"];
    let allowed_order = ["ASC", "DESC"];

    if !allowed_sort_by.contains(&sort_by.as_str()) || !allowed_order.contains(&order.as_str()) {
        return Err("Invalid sort parameters.".to_string());
    }

    let search_pattern = format!("%{}%", search);
    let offset = (page - 1) * limit;

    let count_sql = "SELECT COUNT(*) FROM entries WHERE name LIKE ?";
    let total: i64 = db
        .query_row(count_sql, params![search_pattern], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let data_sql = format!(
        "SELECT code, name, code_png, date FROM entries WHERE name LIKE ? ORDER BY {} {} LIMIT ? OFFSET ?",
        sort_by, order
    );

    let mut stmt = db.prepare(&data_sql).map_err(|e| e.to_string())?;
    let entry_iter = stmt
        .query_map(params![search_pattern, limit, offset], |row| {
            Ok(Entry {
                code: row.get(0)?,
                name: row.get(1)?,
                code_png: row.get(2)?,
                date: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut data = Vec::new();
    for entry in entry_iter {
        data.push(entry.map_err(|e| e.to_string())?);
    }

    Ok(EntriesResponse {
        message: "success".to_string(),
        data,
        total,
    })
}

#[tauri::command]
pub fn get_entry(state: State<'_, AppState>, code: String) -> Result<SingleEntryResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT code, name, code_png, date FROM entries WHERE code = ?")
        .map_err(|e| e.to_string())?;
    
    let entry = stmt
        .query_row(params![code], |row| {
            Ok(Entry {
                code: row.get(0)?,
                name: row.get(1)?,
                code_png: row.get(2)?,
                date: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(SingleEntryResponse {
        message: "success".to_string(),
        data: entry,
    })
}

#[tauri::command]
pub fn create_entry(state: State<'_, AppState>, name: String) -> Result<SingleEntryResponse, String> {
    if name.trim().is_empty() {
        return Err("Name is required.".to_string());
    }

    let code = Uuid::new_v4().to_string();
    let current_date = chrono::Utc::now().timestamp_millis();
    let code_png = ""; // FIX: Generate Base64 QR code image using qrcode crate

    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "INSERT INTO entries (code, code_png, name, date) VALUES (?1, ?2, ?3, ?4)",
        params![code, code_png, name, current_date],
    )
    .map_err(|e| e.to_string())?;

    Ok(SingleEntryResponse {
        message: "Successfully created entry.".to_string(),
        data: Entry {
            code,
            name,
            code_png: Some(code_png.to_string()),
            date: current_date,
        },
    })
}

#[tauri::command]
pub fn update_entry(state: State<'_, AppState>, code: String, name: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE entries SET name = ?1 WHERE code = ?2",
        params![name, code],
    )
    .map_err(|e| e.to_string())?;

    Ok("Successfully updated entry.".to_string())
}

#[tauri::command]
pub fn delete_entry(state: State<'_, AppState>, code: String) -> Result<String, String> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM entries WHERE code = ?1", params![&code])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM scans WHERE code = ?1", params![&code])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok("Successfully deleted entry.".to_string())
}

#[tauri::command]
pub fn bulk_delete_entries(state: State<'_, AppState>, codes: Vec<String>) -> Result<String, String> {
    if codes.is_empty() {
        return Err("Invalid request.".to_string());
    }

    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;

    for code in &codes {
        tx.execute("DELETE FROM entries WHERE code = ?1", params![code])
            .map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM scans WHERE code = ?1", params![code])
            .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok("Successfully deleted entries.".to_string())
}

// FIX: Implement update_entry_qrcode command (PUT /api/entry/qrcode/:code)
// FIX: Implement import/export commands (CSV/PDF/Print/Image Download) for entries

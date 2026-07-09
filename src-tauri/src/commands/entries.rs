use crate::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use qrcode::QrCode;
use image::{Luma, DynamicImage};
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};

fn generate_qr_code_base64(data: &str) -> Result<String, String> {
    let code = QrCode::new(data).map_err(|e| format!("Failed to create QR code: {}", e))?;
    // Use module_dimensions(5, 5) to prevent DB bloat while keeping sharp edges
    let image = code.render::<Luma<u8>>().module_dimensions(5, 5).build();
    let dynamic_image = DynamicImage::ImageLuma8(image);
    let mut cursor = Cursor::new(Vec::new());
    dynamic_image.write_to(&mut cursor, image::ImageFormat::Png).map_err(|e| format!("Failed to write image: {}", e))?;
    let base64_str = general_purpose::STANDARD.encode(cursor.into_inner());
    Ok(format!("data:image/png;base64,{}", base64_str))
}
#[derive(Serialize, Deserialize)]
pub struct Entry {
    pub code: String,
    pub name: String,
    pub code_png: Option<String>,
    pub date: Option<i64>,
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
    pub data: Option<Entry>,
}

// FIXED: MT 7/7
#[tauri::command]
pub fn get_entries(
    state: State<'_, AppState>,
    search: Option<String>,
    sort_by: Option<String>,
    order: Option<String>,
    page: Option<i32>,
    limit: Option<i32>,
) -> Result<EntriesResponse, String> {
    let search = search.unwrap_or_default();
    let sort_by = sort_by.unwrap_or_else(|| "name".to_string());
    let order = order.unwrap_or_else(|| "ASC".to_string());
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(10);

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
        "SELECT code, name FROM entries WHERE name LIKE ? ORDER BY {} {} LIMIT ? OFFSET ?",
        sort_by, order
    );

    let mut stmt = db.prepare(&data_sql).map_err(|e| e.to_string())?;
    let entry_iter = stmt
        .query_map(params![search_pattern, limit, offset], |row| {
            Ok(Entry {
                code: row.get(0)?,
                name: row.get(1)?,
                code_png: None,
                date: None,
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

// FIXED: MT 7/7
#[tauri::command]
pub fn get_entry(state: State<'_, AppState>, code: String) -> Result<SingleEntryResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db
        .prepare("SELECT code, name, code_png, date FROM entries WHERE code = ?")
        .map_err(|e| e.to_string())?;
    
    let entry_result = stmt
        .query_row(params![code], |row| {
            Ok(Entry {
                code: row.get(0)?,
                name: row.get(1)?,
                code_png: row.get(2)?,
                date: row.get(3)?,
            })
        });

    let data = match entry_result {
        Ok(entry) => Some(entry),
        Err(rusqlite::Error::QueryReturnedNoRows) => None,
        Err(e) => return Err(e.to_string()),
    };

    Ok(SingleEntryResponse {
        message: "success".to_string(),
        data,
    })
}

// FIXED: MT 7/7
#[tauri::command]
pub fn create_entry(state: State<'_, AppState>, name: String) -> Result<SingleEntryResponse, String> {
    if name.trim().is_empty() {
        return Err("Name is required.".to_string());
    }

    let code = Uuid::new_v4().to_string();
    let current_date = chrono::Utc::now().timestamp_millis();
    let code_png = generate_qr_code_base64(&code).map_err(|_| "Could not generate QR code.".to_string())?;

    let db = state.db.lock().map_err(|_| "Could not create entry.".to_string())?;
    db.execute(
        "INSERT INTO entries (code, code_png, name, date) VALUES (?1, ?2, ?3, ?4)",
        params![code, code_png, name, current_date],
    )
    .map_err(|_| "Could not create entry.".to_string())?;

    Ok(SingleEntryResponse {
        message: "Successfully created entry.".to_string(),
        data: Some(Entry {
            code,
            name,
            code_png: Some(code_png.to_string()),
            date: Some(current_date),
        }),
    })
}

// FIXED: MT 7/7
#[tauri::command]
pub fn update_entry(state: State<'_, AppState>, code: String, name: String) -> Result<String, String> {
    let db = state.db.lock().map_err(|_| "Could not update entry.".to_string())?;
    db.execute(
        "UPDATE entries SET name = ?1 WHERE code = ?2",
        params![name, code],
    )
    .map_err(|_| "Could not update entry.".to_string())?;

    Ok("Successfully updated entry.".to_string())
}

// FIXED: MT 7/7
#[tauri::command]
pub fn delete_entry(state: State<'_, AppState>, code: String) -> Result<String, String> {
    let mut db = state.db.lock().map_err(|_| "Could not start transaction.".to_string())?;
    let tx = db.transaction().map_err(|_| "Could not start transaction.".to_string())?;

    tx.execute("DELETE FROM entries WHERE code = ?1", params![&code])
        .map_err(|_| "Could not delete entry.".to_string())?;
    tx.execute("DELETE FROM scans WHERE code = ?1", params![&code])
        .map_err(|_| "Could not delete associated scans.".to_string())?;

    tx.commit().map_err(|_| "Could not commit transaction.".to_string())?;

    Ok("Successfully deleted entry.".to_string())
}

// FIXED: MT 7/7
#[tauri::command]
pub fn bulk_delete_entries(state: State<'_, AppState>, codes: Vec<String>) -> Result<String, String> {
    if codes.is_empty() {
        return Err("Invalid request.".to_string());
    }

    let mut db = state.db.lock().map_err(|_| "Could not start transaction.".to_string())?;
    let tx = db.transaction().map_err(|_| "Could not start transaction.".to_string())?;

    let json_codes = serde_json::to_string(&codes).map_err(|e| e.to_string())?;
    
    let delete_entries_sql = "DELETE FROM entries WHERE code IN (SELECT value FROM json_each(?1))";
    tx.execute(delete_entries_sql, params![json_codes])
        .map_err(|_| "Could not delete entries.".to_string())?;

    let delete_scans_sql = "DELETE FROM scans WHERE code IN (SELECT value FROM json_each(?1))";
    tx.execute(delete_scans_sql, params![json_codes])
        .map_err(|_| "Could not delete associated scans.".to_string())?;

    tx.commit().map_err(|_| "Could not commit transaction.".to_string())?;

    Ok("Successfully deleted entries.".to_string())
}

// FIXED: MT 7/7
#[tauri::command]
pub fn update_entry_qrcode(state: State<'_, AppState>, code: String) -> Result<SingleEntryResponse, String> {
    let new_code = Uuid::new_v4().to_string();
    let new_code_png = generate_qr_code_base64(&new_code).map_err(|_| "Could not generate QR code.".to_string())?;

    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE entries SET code = ?1, code_png = ?2 WHERE code = ?3",
        params![new_code, new_code_png, code],
    )
    .map_err(|_| "Could not update entry code.".to_string())?;

    tx.execute(
        "UPDATE scans SET code = ?1 WHERE code = ?2",
        params![new_code, code],
    )
    .map_err(|_| "Could not update scan history.".to_string())?;

    tx.commit().map_err(|_| "Could not commit transaction.".to_string())?;

    let mut stmt = db
        .prepare("SELECT code, name, code_png, date FROM entries WHERE code = ?")
        .map_err(|e| e.to_string())?;
    
    let entry_result = stmt
        .query_row(params![new_code], |row| {
            Ok(Entry {
                code: row.get(0)?,
                name: row.get(1)?,
                code_png: row.get(2)?,
                date: row.get(3)?,
            })
        });

    let data = match entry_result {
        Ok(entry) => Some(entry),
        Err(rusqlite::Error::QueryReturnedNoRows) => None,
        Err(e) => return Err(e.to_string()),
    };

    Ok(SingleEntryResponse {
        message: "Successfully updated entry.".to_string(),
        data,
    })
}

// FIXED: MT 7/7
#[tauri::command]
pub fn get_entries_by_codes(state: State<'_, AppState>, codes: Vec<String>, sort_by: String, order: String, include_image: bool) -> Result<Vec<Entry>, String> {
    if codes.is_empty() {
        return Err("No entries selected for printing.".to_string());
    }

    let allowed_sort_by = ["name", "date"];
    let allowed_order = ["ASC", "DESC"];

    if !allowed_sort_by.contains(&sort_by.as_str()) || !allowed_order.contains(&order.as_str()) {
        return Err("Invalid sort parameters.".to_string());
    }

    let json_codes = serde_json::to_string(&codes).map_err(|e| e.to_string())?;
    let select_cols = if include_image { "code, name, code_png, date" } else { "code, name, NULL as code_png, date" };
    let sql = format!("SELECT {} FROM entries WHERE code IN (SELECT value FROM json_each(?1)) ORDER BY {} {}", select_cols, sort_by, order);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    
    let entry_iter = stmt
        .query_map(params![json_codes], |row| {
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

    Ok(data)
}

// FIXED: MT 7/7
#[tauri::command]
pub async fn import_csv(state: State<'_, AppState>, path: String) -> Result<String, String> {
    // FIXED: Offload CPU-heavy QR generation to a blocking thread to avoid freezing the Tauri v2 UI thread and starving the Tokio async runtime.
    let records_to_insert = tauri::async_runtime::spawn_blocking(move || -> Result<Vec<(String, String, String, i64)>, String> {
        let bytes = std::fs::read(&path).map_err(|e| format!("Failed to read CSV file: {}", e))?;
        
        let csv_string = match String::from_utf8(bytes) {
            Ok(s) => s,
            Err(e) => {
                let bytes = e.into_bytes();
                let (cow, _, _) = encoding_rs::WINDOWS_1252.decode(&bytes);
                cow.into_owned()
            }
        };

        let mut rdr = csv::ReaderBuilder::new()
            .has_headers(false)
            .from_reader(csv_string.as_bytes());
        
        // Generate QR codes and UUIDs in memory first to avoid freezing the DB mutex lock
        let mut records = Vec::new();
        let mut last_timestamp = 0;
        
        for result in rdr.records() {
            let record = result.map_err(|e| format!("Could not upload entries: {}", e))?;
            if record.len() < 1 { continue; }
            
            // Strip the \u{FEFF} BOM that Excel sometimes prefixes to the first cell
            let name = record[0].trim().trim_start_matches('\u{FEFF}');
            if name.is_empty() { continue; }

            let code = Uuid::new_v4().to_string();
            let mut current_date = chrono::Utc::now().timestamp_millis();
            
            // Ensure chronological timestamp uniqueness without freezing the UI thread with a sleep delay
            if current_date <= last_timestamp {
                current_date = last_timestamp + 1;
            }
            last_timestamp = current_date;

            let code_png = generate_qr_code_base64(&code).map_err(|e| format!("Could not upload entries: {}", e))?;

            records.push((code, code_png, name.to_string(), current_date));
        }
        
        if records.is_empty() {
            return Err("CSV file is empty or invalid.".to_string());
        }

        Ok(records)
    }).await.map_err(|e| format!("Task panicked: {}", e))??;

    let mut db = state.db.lock().map_err(|e| format!("Could not upload entries: {}", e))?;
    let tx = db.transaction().map_err(|e| format!("Could not upload entries: {}", e))?;

    let count = records_to_insert.len();
    for (code, code_png, name, current_date) in records_to_insert {
        tx.execute(
            "INSERT INTO entries (code, code_png, name, date) VALUES (?1, ?2, ?3, ?4)",
            params![code, code_png, name, current_date],
        ).map_err(|e| format!("Could not upload entries: {}", e))?;
    }

    tx.commit().map_err(|_| "Could not commit transaction.".to_string())?;
    
    Ok(format!("Successfully imported {} entries.", count))
}

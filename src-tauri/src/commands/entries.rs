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
    let image = code.render::<Luma<u8>>().build();
    let dynamic_image = DynamicImage::ImageLuma8(image);
    let resized = dynamic_image.resize_exact(500, 500, image::imageops::FilterType::Nearest);
    let mut cursor = Cursor::new(Vec::new());
    resized.write_to(&mut cursor, image::ImageFormat::Png).map_err(|e| format!("Failed to write image: {}", e))?;
    let base64_str = general_purpose::STANDARD.encode(cursor.into_inner());
    Ok(format!("data:image/png;base64,{}", base64_str))
}
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
    let code_png = generate_qr_code_base64(&code)?;

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

#[tauri::command]
pub fn update_entry_qrcode(state: State<'_, AppState>, code: String) -> Result<SingleEntryResponse, String> {
    let new_code = Uuid::new_v4().to_string();
    let new_code_png = generate_qr_code_base64(&new_code)?;

    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE entries SET code = ?1, code_png = ?2 WHERE code = ?3",
        params![new_code, new_code_png, code],
    )
    .map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE scans SET code = ?1 WHERE code = ?2",
        params![new_code, code],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    let mut stmt = db
        .prepare("SELECT code, name, code_png, date FROM entries WHERE code = ?")
        .map_err(|e| e.to_string())?;
    
    let entry = stmt
        .query_row(params![new_code], |row| {
            Ok(Entry {
                code: row.get(0)?,
                name: row.get(1)?,
                code_png: row.get(2)?,
                date: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(SingleEntryResponse {
        message: "Successfully updated entry.".to_string(),
        data: entry,
    })
}

#[tauri::command]
pub fn get_entries_by_codes(state: State<'_, AppState>, codes: Vec<String>, sort_by: String, order: String) -> Result<Vec<Entry>, String> {
    if codes.is_empty() {
        return Ok(Vec::new());
    }

    let allowed_sort_by = ["name", "date"];
    let allowed_order = ["ASC", "DESC"];

    if !allowed_sort_by.contains(&sort_by.as_str()) || !allowed_order.contains(&order.as_str()) {
        return Err("Invalid sort parameters.".to_string());
    }

    let placeholders = codes.iter().map(|_| "?").collect::<Vec<&str>>().join(",");
    let sql = format!("SELECT code, name, code_png, date FROM entries WHERE code IN ({}) ORDER BY {} {}", placeholders, sort_by, order);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    
    let params: Vec<&dyn rusqlite::ToSql> = codes.iter().map(|c| c as &dyn rusqlite::ToSql).collect();
    let entry_iter = stmt
        .query_map(params.as_slice(), |row| {
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

#[tauri::command]
pub fn import_csv(state: State<'_, AppState>, path: String) -> Result<String, String> {
    let mut rdr = csv::Reader::from_path(path).map_err(|e| format!("Failed to read CSV: {}", e))?;
    
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;
    
    let mut count = 0;
    
    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        if record.len() < 1 { continue; }
        
        let name = &record[0];
        if name.trim().is_empty() { continue; }

        let code = Uuid::new_v4().to_string();
        let current_date = chrono::Utc::now().timestamp_millis();
        let code_png = generate_qr_code_base64(&code)?;

        tx.execute(
            "INSERT INTO entries (code, code_png, name, date) VALUES (?1, ?2, ?3, ?4)",
            params![code, code_png, name, current_date],
        ).map_err(|e| e.to_string())?;
        
        count += 1;
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    
    Ok(format!("Successfully imported {} entries.", count))
}

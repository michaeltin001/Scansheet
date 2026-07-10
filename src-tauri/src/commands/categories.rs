use crate::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct Category {
    pub name: String,
    pub code: String,
    // FIX: Restored date field for exact export behavior
    pub date: i64,
}

#[derive(Serialize)]
pub struct CategoriesResponse {
    pub message: String,
    pub data: Vec<Category>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<i64>,
}

#[derive(Serialize)]
pub struct SingleCategoryResponse {
    pub message: String,
    pub data: Category,
}

// FIXED: MT 7/9
#[tauri::command]
pub fn get_categories(
    state: State<'_, AppState>,
    search: Option<String>,
    sort_by: Option<String>,
    order: Option<String>,
    page: Option<i32>,
    limit: Option<i32>,
) -> Result<CategoriesResponse, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    if let (Some(p), Some(l)) = (page, limit) {
        let sort = sort_by.unwrap_or_else(|| "name".to_string());
        let ord = order.unwrap_or_else(|| "ASC".to_string());
        let allowed_sort_by = ["name", "date"];
        let allowed_order = ["ASC", "DESC"];

        if !allowed_sort_by.contains(&sort.as_str()) || !allowed_order.contains(&ord.as_str()) {
            return Err("Invalid sort parameters.".to_string());
        }

        let search_str = search.unwrap_or_default();
        let search_pattern = format!("%{}%", search_str);
        let offset = (p - 1) * l;

        let count_sql = "SELECT COUNT(*) FROM categories WHERE name LIKE ? AND name != 'General'";
        let total: i64 = db
            .query_row(count_sql, params![search_pattern], |row| row.get(0))
            .map_err(|e| e.to_string())?;

        let mut general_category: Option<Category> = None;
        if let Ok(gen) = db.query_row(
            "SELECT name, code, date FROM categories WHERE name = 'General'",
            [],
            |row| {
                Ok(Category {
                    name: row.get(0)?,
                    code: row.get(1)?,
                    // FIX: Populate date
                    date: row.get(2)?,
                })
            },
        ) {
            general_category = Some(gen);
        }

        let mut final_categories = Vec::new();
        if let Some(gen) = general_category {
            if p == 1 && (search_str.is_empty() || "general".contains(&search_str.to_lowercase())) {
                final_categories.push(gen);
            }
        }

        let data_sql = format!(
            "SELECT name, code, date FROM categories WHERE name LIKE ? AND name != 'General' ORDER BY {} {} LIMIT ? OFFSET ?",
            sort, ord
        );

        let mut stmt = db.prepare(&data_sql).map_err(|e| e.to_string())?;
        let cat_iter = stmt
            .query_map(params![search_pattern, l, offset], |row| {
                Ok(Category {
                    name: row.get(0)?,
                    code: row.get(1)?,
                    // FIX: Populate date
                    date: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for cat in cat_iter {
            final_categories.push(cat.map_err(|e| e.to_string())?);
        }

        Ok(CategoriesResponse {
            message: "success".to_string(),
            data: final_categories,
            total: Some(total),
        })
    } else {
        let mut stmt = db
            .prepare("SELECT name, code, date FROM categories ORDER BY CASE WHEN name = 'General' THEN 0 ELSE 1 END, name")
            .map_err(|e| e.to_string())?;

        let cat_iter = stmt
            .query_map([], |row| {
                Ok(Category {
                    name: row.get(0)?,
                    code: row.get(1)?,
                    // FIX: Populate date
                    date: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut data = Vec::new();
        for cat in cat_iter {
            data.push(cat.map_err(|e| e.to_string())?);
        }

        Ok(CategoriesResponse {
            message: "success".to_string(),
            data,
            total: None,
        })
    }
}

// FIXED: MT 7/9
#[tauri::command]
pub fn create_category(state: State<'_, AppState>, name: String) -> Result<SingleCategoryResponse, String> {
    let name_trimmed = name.trim();
    if name_trimmed.is_empty() {
        return Err("Name is required.".to_string());
    }
    if name_trimmed.to_lowercase() == "general" {
        return Err("'General' category cannot be created.".to_string());
    }

    let code = Uuid::new_v4().to_string();
    let current_date = chrono::Utc::now().timestamp_millis();

    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Check if it already exists (to match errno 19)
    let count: i32 = db.query_row(
        "SELECT COUNT(*) FROM categories WHERE name = ?1",
        params![name_trimmed],
        |row| row.get(0)
    ).map_err(|_| "Could not create category.".to_string())?; // FIXED: Explicitly propagate DB errors instead of swallowing them
    
    if count > 0 {
        return Err("Category with this name already exists.".to_string());
    }

    db.execute(
        "INSERT INTO categories (name, code, date) VALUES (?1, ?2, ?3)",
        params![name_trimmed, code, current_date],
    )
    .map_err(|_| "Could not create category.".to_string())?;

    Ok(SingleCategoryResponse {
        message: "Successfully created category.".to_string(),
        data: Category {
            name: name_trimmed.to_string(),
            code,
            // FIX: Populate date
            date: current_date,
        },
    })
}

// FIXED: MT 7/9
#[tauri::command]
pub fn delete_category(state: State<'_, AppState>, code: String) -> Result<String, String> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;

    let cat_name: String = db
        .query_row("SELECT name FROM categories WHERE code = ?1", params![&code], |row| row.get(0))
        .map_err(|_| "Category not found.".to_string())?;

    if cat_name.to_lowercase() == "general" {
        return Err("'General' category cannot be deleted.".to_string());
    }

    let general_code: String = db
        .query_row("SELECT code FROM categories WHERE name = 'General'", [], |row| row.get(0))
        .map_err(|_| "Could not find the 'General' category.".to_string())?;

    // Updated error string to match the original server.js behavior
    let tx = db.transaction().map_err(|_| "Could not start transaction.".to_string())?;

    tx.execute(
        "UPDATE scans SET category_code = ?1 WHERE category_code = ?2",
        params![general_code, code],
    )
    // Updated error string to match the original server.js behavior
    .map_err(|_| "Could not update scans.".to_string())?;

    tx.execute("DELETE FROM categories WHERE code = ?1", params![code])
        // Updated error string to match the original server.js behavior
        .map_err(|_| "Could not delete category.".to_string())?;

    // Updated error string to match the original server.js behavior
    tx.commit().map_err(|_| "Could not commit transaction.".to_string())?;

    Ok("Successfully deleted category.".to_string())
}

// FIXED: MT 7/9
#[tauri::command]
pub fn bulk_delete_categories(state: State<'_, AppState>, codes: Vec<String>) -> Result<String, String> {
    if codes.is_empty() {
        return Err("Invalid request.".to_string());
    }

    let mut db = state.db.lock().map_err(|e| e.to_string())?;

    let general_code: String = db
        .query_row("SELECT code FROM categories WHERE name = 'General'", [], |row| row.get(0))
        .map_err(|_| "Could not find the 'General' category.".to_string())?;

    let filtered_codes: Vec<String> = codes.into_iter().filter(|c| c != &general_code).collect();
    
    if filtered_codes.is_empty() {
        return Ok("No categories to delete.".to_string());
    }

    let tx = db.transaction().map_err(|_| "Could not start transaction.".to_string())?;

    let json_codes = serde_json::to_string(&filtered_codes).map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE scans SET category_code = ?1 WHERE category_code IN (SELECT value FROM json_each(?2))",
        params![&general_code, &json_codes],
    )
    .map_err(|_| "Could not update scans.".to_string())?;

    tx.execute("DELETE FROM categories WHERE code IN (SELECT value FROM json_each(?1))", params![&json_codes])
        .map_err(|_| "Could not delete categories.".to_string())?;

    tx.commit().map_err(|_| "Could not commit transaction.".to_string())?;

    Ok("Successfully deleted categories.".to_string())
}

// FIXED: MT 7/9
#[tauri::command]
pub fn update_category(state: State<'_, AppState>, code: String, name: String) -> Result<String, String> {
    let name_trimmed = name.trim();
    if name_trimmed.is_empty() {
        return Err("Name is required.".to_string());
    }

    if name_trimmed.to_lowercase() == "general" {
        return Err("Category cannot be named 'General'.".to_string());
    }

    let db = state.db.lock().map_err(|e| e.to_string())?;

    let cat_name: String = db
        .query_row("SELECT name FROM categories WHERE code = ?1", params![&code], |row| row.get(0))
        .map_err(|_| "Category not found.".to_string())?;

    if cat_name.to_lowercase() == "general" {
        return Err("'General' category cannot be renamed.".to_string());
    }

    // Check if new name exists
    let count: i32 = db.query_row(
        "SELECT COUNT(*) FROM categories WHERE name = ?1 AND code != ?2",
        params![name_trimmed, &code],
        |row| row.get(0)
    ).map_err(|_| "Could not update category.".to_string())?; // FIXED: Explicitly propagate DB errors instead of swallowing them
    
    if count > 0 {
        return Err("Category with this name already exists.".to_string());
    }

    // We map any unexpected execution error to a generic message to match the original Node.js behavior.
    db.execute(
        "UPDATE categories SET name = ?1 WHERE code = ?2",
        params![name_trimmed, code],
    )
    .map_err(|_| "Could not update category.".to_string())?;

    Ok("Successfully updated category.".to_string())
}

#[tauri::command]
pub fn get_categories_by_codes(
    state: State<'_, AppState>,
    codes: Vec<String>,
    sort_by: String,
    order: String,
) -> Result<Vec<Category>, String> {
    if codes.is_empty() {
        return Ok(Vec::new());
    }

    let allowed_sort_by = ["name", "date"];
    let allowed_order = ["ASC", "DESC"];

    if !allowed_sort_by.contains(&sort_by.as_str()) || !allowed_order.contains(&order.as_str()) {
        return Err("Invalid sort parameters.".to_string());
    }

    let json_codes = serde_json::to_string(&codes).map_err(|e| e.to_string())?;
    let sql = format!(
        "SELECT name, code, date FROM categories WHERE code IN (SELECT value FROM json_each(?1)) ORDER BY {} {}",
        sort_by, order
    );

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare(&sql).map_err(|e| e.to_string())?;
    
    let cat_iter = stmt
        .query_map(params![json_codes], |row| {
            Ok(Category {
                name: row.get(0)?,
                code: row.get(1)?,
                // FIX: Populate date
                date: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut data = Vec::new();
    for cat in cat_iter {
        data.push(cat.map_err(|e| e.to_string())?);
    }

    Ok(data)
}

// FIXED: MT 7/9
#[tauri::command]
pub fn import_categories_csv(state: State<'_, AppState>, path: String) -> Result<String, String> {
    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(false) // FIX: Explicitly disable headers so first row isn't skipped
        .from_path(path)
        .map_err(|e| format!("Could not upload categories: Failed to read CSV: {}", e))?; // FIX: Align error string
    
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;
    
    let mut successful_imports = 0;
    let mut total_records = 0; // FIX: Track total records for empty CSV checking
    let base_timestamp = chrono::Utc::now().timestamp_millis(); // FIX: Use base timestamp for monotonic dates
    
    for result in rdr.records() {
        let record = result.map_err(|e| e.to_string())?;
        total_records += 1;
        
        if record.len() < 1 { continue; }
        
        // Strip the \u{FEFF} BOM that Excel sometimes prefixes to the first cell
        let name_trimmed = record[0].trim().trim_start_matches('\u{FEFF}');
        if name_trimmed.is_empty() || name_trimmed.to_lowercase() == "general" { continue; }

        let code = Uuid::new_v4().to_string();
        let current_date = base_timestamp + (successful_imports as i64); // FIX: Ensure distinct dates without blocking

        // FIX: Re-introduced INSERT OR IGNORE and proper error handling
        let rows_inserted = tx.execute(
            "INSERT OR IGNORE INTO categories (name, code, date) VALUES (?1, ?2, ?3)",
            params![name_trimmed, code, current_date],
        ).map_err(|e| format!("Could not upload categories: {}", e))?;
        
        successful_imports += rows_inserted;
    }
    
    // FIX: Re-introduced empty CSV check to match original backend
    if total_records == 0 {
        return Err("CSV file is empty or invalid.".to_string());
    }
    
    tx.commit().map_err(|_| "Could not commit transaction.".to_string())?; // FIX: Align error string
    
    Ok(format!("Successfully imported {} categories.", successful_imports))
}

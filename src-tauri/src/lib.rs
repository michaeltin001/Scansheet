use rusqlite::Connection;
use std::fs;
use std::sync::Mutex;
use tauri::Manager;
use uuid::Uuid;
use chrono::Utc;

pub mod commands;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_data_dir = app.path().app_data_dir().expect("failed to get app_data_dir");
            fs::create_dir_all(&app_data_dir).expect("failed to create app data directory");

            let db_path = app_data_dir.join("database.sqlite");
            let db = Connection::open(db_path).expect("failed to open db");

            // Create entries table
            db.execute(
                "CREATE TABLE IF NOT EXISTS entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE,
                    code_png TEXT,
                    name TEXT,
                    date INTEGER
                )",
                (),
            )
            .expect("Error creating entries table");

            // Create scans table
            db.execute(
                "CREATE TABLE IF NOT EXISTS scans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT,
                    date INTEGER,
                    scan_date TEXT,
                    category_code TEXT
                )",
                (),
            )
            .expect("Error creating scans table");

            // Create scan indexes
            db.execute("CREATE INDEX IF NOT EXISTS idx_scan_date ON scans(scan_date)", ())
                .expect("Error creating index");
            db.execute("CREATE INDEX IF NOT EXISTS idx_scan_code ON scans(code)", ())
                .expect("Error creating index");
            db.execute("CREATE INDEX IF NOT EXISTS idx_scan_category_code ON scans(category_code)", ())
                .expect("Error creating index");

            // Create categories table
            db.execute(
                "CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    code TEXT UNIQUE,
                    date INTEGER
                )",
                (),
            )
            .expect("Error creating categories table");

            // Insert 'General' category
            let current_date = Utc::now().timestamp_millis();
            let general_code = Uuid::new_v4().to_string();

            let _ = db.execute(
                "INSERT OR IGNORE INTO categories (name, code, date) VALUES (?1, ?2, ?3)",
                rusqlite::params!["General", general_code, current_date],
            );

            app.manage(AppState {
                db: Mutex::new(db),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::entries::get_entries,
            commands::entries::get_entry,
            commands::entries::create_entry,
            commands::entries::update_entry,
            commands::entries::update_entry_qrcode,
            commands::entries::delete_entry,
            commands::entries::bulk_delete_entries,
            commands::entries::get_entries_by_codes,
            commands::entries::import_csv,
            commands::categories::get_categories,
            commands::categories::create_category,
            commands::categories::update_category,
            commands::categories::delete_category,
            commands::categories::bulk_delete_categories,
            commands::categories::get_categories_by_codes,
            commands::categories::import_categories_csv,
            commands::scans::get_scans,
            commands::scans::get_scans_by_dates,
            commands::scans::create_scan,
            commands::scans::record_scan,
            commands::scans::update_scan,
            commands::scans::delete_scan,
            commands::scans::delete_scans_by_date,
            commands::scans::bulk_delete_scans_by_dates,
            commands::dates::get_dates,
            commands::dates::get_date_range,
            commands::dates::get_entry_scans,
            commands::dates::get_entry_date_range,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  app_lib::run();
}

#[cfg(test)]
mod tests {
    use app_lib::{AppState, commands};
    use tauri::Manager;
    use chrono::Utc;
    use uuid::Uuid;
    use rusqlite::Connection;
    use std::sync::Mutex;

    fn setup_test_app() -> tauri::AppHandle<tauri::test::MockRuntime> {
        let app = tauri::test::mock_builder()
            .build(tauri::generate_context!())
            .expect("Failed to build test app");
        
        let handle = app.handle().clone();

        let db = Connection::open_in_memory().expect("failed to open db");

        db.execute(
            "CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE,
                code_png TEXT,
                name TEXT,
                date INTEGER
            )",
            (),
        ).expect("Error creating entries table");

        db.execute(
            "CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT,
                date INTEGER,
                scan_date TEXT,
                category_code TEXT
            )",
            (),
        ).expect("Error creating scans table");

        db.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                code TEXT UNIQUE,
                date INTEGER
            )",
            (),
        ).expect("Error creating categories table");

        let current_date = Utc::now().timestamp_millis();
        let general_code = Uuid::new_v4().to_string();

        let _ = db.execute(
            "INSERT OR IGNORE INTO categories (name, code, date) VALUES (?1, ?2, ?3)",
            rusqlite::params!["General", general_code, current_date],
        );

        handle.manage(AppState {
            db: Mutex::new(db),
        });

        handle
    }

    #[test]
    fn test_api_workflow() {
        let app = setup_test_app();
        let state = app.state::<AppState>();
        
        // --- Task 1: Fetch initial list of entries ---
        let res = commands::entries::get_entries(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert_eq!(res.total, 0);
        assert!(res.data.is_empty());
        println!("Task 1: Fetch initial entries: pass");

        // --- Task 2: Create six entries and fetch list ---
        let entry_names = vec!["Apple", "Banana", "Cherry", "Durian", "Eggplant", "Fig"];
        let mut created_entry_codes = std::collections::HashMap::new();
        
        for name in &entry_names {
            let create_res = commands::entries::create_entry(state.clone(), name.to_string()).unwrap();
            let entry = create_res.data;
            created_entry_codes.insert(name.to_string(), entry.unwrap().code);
        }
        
        let fetch_res = commands::entries::get_entries(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert_eq!(fetch_res.total, 6);
        assert_eq!(fetch_res.data.len(), 6);
        
        let mut names: Vec<String> = fetch_res.data.into_iter().map(|e| e.name).collect();
        names.sort();
        let mut expected_names: Vec<String> = entry_names.iter().map(|s| s.to_string()).collect();
        expected_names.sort();
        assert_eq!(names, expected_names);
        println!("Task 2: Create entries and fetch: pass");
        
        // --- Task 3: Delete "Fig" entry and fetch list ---
        let fig_code = created_entry_codes.get("Fig").unwrap();
        let delete_res = commands::entries::delete_entry(state.clone(), fig_code.to_string()).unwrap();
        assert!(delete_res.contains("Successfully deleted entry"));
        
        let fetch_res = commands::entries::get_entries(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert_eq!(fetch_res.total, 5);
        let names: Vec<String> = fetch_res.data.into_iter().map(|e| e.name).collect();
        assert!(!names.contains(&"Fig".to_string()));
        println!("Task 3: Delete entry and fetch: pass");

        // --- Task 4: Edit "Cherry" to "Citrus" and fetch list ---
        let cherry_code = created_entry_codes.get("Cherry").unwrap();
        let edit_res = commands::entries::update_entry(state.clone(), cherry_code.to_string(), "Citrus".to_string()).unwrap();
        assert!(edit_res.contains("Successfully updated entry"));
        
        created_entry_codes.insert("Citrus".to_string(), cherry_code.to_string());
        created_entry_codes.remove("Cherry");
        
        let fetch_res = commands::entries::get_entries(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert_eq!(fetch_res.total, 5);
        let names: Vec<String> = fetch_res.data.into_iter().map(|e| e.name).collect();
        assert!(names.contains(&"Citrus".to_string()));
        assert!(!names.contains(&"Cherry".to_string()));
        println!("Task 4: Edit entry and fetch: pass");

        // --- Task 5: Fetch initial list of categories (should contain General) ---
        let res = commands::categories::get_categories(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert!(!res.data.is_empty());
        let general_cat = res.data.iter().find(|c| c.name == "General").expect("Expected General category");
        let general_category_code = general_cat.code.clone();
        println!("Task 5: Fetch initial categories: pass");

        // --- Task 6: Create six categories and fetch list ---
        let category_names = vec!["Algebra", "Biology", "Calculus", "Dance", "Economics", "French"];
        let mut created_category_codes = std::collections::HashMap::new();
        
        for name in &category_names {
            let create_res = commands::categories::create_category(state.clone(), name.to_string()).unwrap();
            let cat = create_res.data;
            created_category_codes.insert(name.to_string(), cat.code);
        }
        
        let fetch_res = commands::categories::get_categories(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert_eq!(fetch_res.data.len(), 7); // General + 6
        let mut names: Vec<String> = fetch_res.data.into_iter().map(|c| c.name).collect();
        names.sort();
        let mut expected_names = category_names.iter().map(|s| s.to_string()).collect::<Vec<String>>();
        expected_names.push("General".to_string());
        expected_names.sort();
        assert_eq!(names, expected_names);
        println!("Task 6: Create categories and fetch: pass");

        // --- Task 7: Delete "French" category and fetch list ---
        let french_code = created_category_codes.get("French").unwrap();
        let delete_res = commands::categories::delete_category(state.clone(), french_code.to_string()).unwrap();
        assert!(delete_res.contains("Successfully deleted category"));
        
        let fetch_res = commands::categories::get_categories(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert_eq!(fetch_res.data.len(), 6);
        let names: Vec<String> = fetch_res.data.into_iter().map(|c| c.name).collect();
        assert!(!names.contains(&"French".to_string()));
        println!("Task 7: Delete category and fetch: pass");

        // --- Task 8: Edit "Calculus" to "Chemistry" and fetch list ---
        let calculus_code = created_category_codes.get("Calculus").unwrap();
        let edit_res = commands::categories::update_category(state.clone(), calculus_code.to_string(), "Chemistry".to_string()).unwrap();
        assert!(edit_res.contains("Successfully updated category"));
        
        created_category_codes.insert("Chemistry".to_string(), calculus_code.to_string());
        created_category_codes.remove("Calculus");
        
        let fetch_res = commands::categories::get_categories(
            state.clone(), None, None, None, None, None
        ).unwrap();
        assert_eq!(fetch_res.data.len(), 6);
        let names: Vec<String> = fetch_res.data.into_iter().map(|c| c.name).collect();
        assert!(names.contains(&"Chemistry".to_string()));
        assert!(!names.contains(&"Calculus".to_string()));
        println!("Task 8: Edit category and fetch: pass");

        // --- Task 9: Fetch scans for 01/11/2025 (initially empty) ---
        let fetch_res = commands::scans::get_scans_by_dates(
            state.clone(), vec!["2025-01-11".to_string()], None
        ).unwrap();
        assert!(fetch_res.is_empty());
        println!("Task 9: Fetch scans for 01/11/2025 (initial): pass");

        // --- Task 10: Create scans for 01/11/2025 and fetch list ---
        let entry_names_to_scan = vec!["Apple", "Banana", "Citrus", "Durian", "Eggplant"];
        let scan_date = "2025-01-11".to_string();
        let scan_time = "15:00:00".to_string();
        
        for name in &entry_names_to_scan {
            let entry_code = created_entry_codes.get(*name).unwrap();
            let create_res = commands::scans::record_scan(
                state.clone(),
                Some(entry_code.to_string()),
                Some(general_category_code.clone()),
                Some(scan_date.clone()),
                Some(scan_time.clone()),
            ).unwrap();
            assert!(create_res.contains("Successfully created scan"));
        }
        
        let fetch_res = commands::scans::get_scans_by_dates(
            state.clone(), vec!["2025-01-11".to_string()], None
        ).unwrap();
        assert_eq!(fetch_res.len(), 5);
        let mut scanned_names: Vec<String> = fetch_res.iter().map(|s| s.entry_name.clone()).collect();
        scanned_names.sort();
        let mut expected_scan_names: Vec<String> = entry_names_to_scan.iter().map(|s| s.to_string()).collect();
        expected_scan_names.sort();
        assert_eq!(scanned_names, expected_scan_names);
        for scan in &fetch_res {
            assert_eq!(scan.category_name, "General");
        }
        println!("Task 10: Create scans for 01/11/2025 and fetch: pass");

        // --- Task 11: Create scans for 01/12/2025 (Chemistry) and fetch list ---
        let scan_date = "2025-01-12".to_string();
        let scan_time = "15:00:00".to_string();
        let chemistry_code = created_category_codes.get("Chemistry").unwrap();

        for name in &entry_names_to_scan {
            let entry_code = created_entry_codes.get(*name).unwrap();
            let create_res = commands::scans::record_scan(
                state.clone(),
                Some(entry_code.to_string()),
                Some(chemistry_code.clone()),
                Some(scan_date.clone()),
                Some(scan_time.clone()),
            ).unwrap();
            assert!(create_res.contains("Successfully created scan"));
        }

        let fetch_res = commands::scans::get_scans_by_dates(
            state.clone(), vec!["2025-01-12".to_string()], None
        ).unwrap();
        assert_eq!(fetch_res.len(), 5);
        let mut scanned_names: Vec<String> = fetch_res.iter().map(|s| s.entry_name.clone()).collect();
        scanned_names.sort();
        assert_eq!(scanned_names, expected_scan_names);
        for scan in &fetch_res {
            assert_eq!(scan.category_name, "Chemistry");
        }
        println!("Task 11: Create scans for 01/12/2025 and fetch: pass");

        // --- Task 12: Delete "Chemistry" category and fetch scans for 01/12/2025 (category should be General) ---
        let delete_res = commands::categories::delete_category(state.clone(), chemistry_code.to_string()).unwrap();
        assert!(delete_res.contains("Successfully deleted category"));

        let fetch_res = commands::scans::get_scans_by_dates(
            state.clone(), vec!["2025-01-12".to_string()], None
        ).unwrap();
        assert_eq!(fetch_res.len(), 5);
        for scan in &fetch_res {
            assert_eq!(scan.category_name, "General");
        }
        println!("Task 12: Delete category and fetch scans (reassigned to General): pass");
    }
}

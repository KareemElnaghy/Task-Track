// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Serialize, Deserialize};
use sysinfo::System;

#[derive(Serialize, Deserialize)]
struct ProcessInfo { // struct to hold process information
    pid: String,
    name: String
}

#[tauri::command]
fn os_name() -> String {  // command to get the OS name
    let info = os_info::get();
    format!("{} {}", info.os_type(), info.version())
}

#[tauri::command]
fn get_processes() -> Vec<ProcessInfo> {
    let mut sys = System::new_all(); // Initialize the System struct with all information
    sys.refresh_all(); // Refresh process information

    sys.processes()
        .iter()
        .map(|(pid, process)| {
            ProcessInfo {
                pid: pid.to_string(),
                name: process.name().to_string_lossy().into_owned()
            }
        })
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![os_name, get_processes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

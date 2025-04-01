// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn os_name(name: &str) -> String {
    let info = os_info::get();
    format!("{} {}", info.os_type(), info.version())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![os_name])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Serialize, Deserialize};
use sysinfo::{System, Pid};
    // , ProcessExt, SystemExt};
use std::process::Command;

#[derive(Serialize, Deserialize)]
struct ProcessInfo { // struct to hold process information
    pid: u32,
    name: String,   //TODO: add more fields to this struct
    status: String,
    // cpu_usage: f32,
    // mem_usage: f32,
}

#[tauri::command]
fn os_name() -> String {  
    let info = os_info::get();
    format!("{} {}", info.os_type(), info.version())
}

#[tauri::command]
fn get_processes() -> Vec<ProcessInfo> {
    let mut sys = System::new_all();
    sys.refresh_all(); 

    sys.processes() // TODO: Retrieve Other fields
        .iter()
        .map(|(pid, process)| {
            ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().into_owned(),
                status: process.status().to_string(), 
                // cpu_usage: process.cpu_usage(),
                // mem_usage: process.memory()
            }
        })
        .collect()
}

#[tauri::command]
fn kill_process(pid: u32) -> bool {
    let mut sys = System::new_all();
    sys.refresh_all();

    let system_pid = Pid::from_u32(pid);

    if let Some(process) = sys.process(system_pid) {
        process.kill();
        return true;
    }
    false
}

#[tauri::command]
fn suspend_process(pid: u32) -> bool {
    // Use the kill command with SIGSTOP signal to suspend the process
    let output = Command::new("kill")
        .arg("-STOP")
        .arg(pid.to_string())
        .output();
    
    match output {
        Ok(output) => output.status.success(),
        Err(_) => false
    }
}

#[tauri::command]
fn resume_process(pid: u32) -> bool {
    let output = Command::new("kill")
        .arg("-CONT")  // SIGCONT signal
        .arg(pid.to_string())
        .output();
    
    match output {
        Ok(output) => output.status.success(),
        Err(_) => false
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![os_name, get_processes, kill_process,suspend_process,resume_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

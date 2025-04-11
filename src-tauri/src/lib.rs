// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Serialize, Deserialize};
use sysinfo::{System, Pid};
    // , ProcessExt, SystemExt};
use std::{process::Command};

#[derive(Serialize, Deserialize)]
struct ProcessInfo { // struct to hold process information
    pid: u32,
    name: String,   //TODO: add more fields to this struct
    status: String,
    cpu_usage: f32, // TODO: add CPU usage
    mem_usage: f32,
}

#[tauri::command]
fn os_name() -> String {  
    let info = os_info::get();
    format!("{} {}", info.os_type(), info.version())
}

#[tauri::command]
fn get_processes(sort_by: String, direction: Option<String>) -> Vec<ProcessInfo> {

    let mut sys = System::new_all();
    
    sys.refresh_all();
    
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_all();

    let mut processes: Vec<ProcessInfo> = sys.processes()
        .iter()
        .map(|(pid, process)| {
            let cpu = (process.cpu_usage()*100.0).round() / 100.0;
            let process_memory = process.memory();
            let total_memory = sys.total_memory();
            let mut mem = (process_memory as f32 / total_memory as f32) * 100.0;
            mem = (mem * 100.0).round() / 100.0;

            ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().into_owned(),
                status: process.status().to_string(), 
                cpu_usage: cpu,
                mem_usage: mem,
            }
        })
        .collect();

    let is_ascending = direction.unwrap_or_else(|| "ascending".to_string()) == "ascending";
    
    match sort_by.as_str() {
        "name" => {
            if is_ascending {
                processes.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
            } else {
                processes.sort_by(|a, b| b.name.to_lowercase().cmp(&a.name.to_lowercase()));
            }
        }
        "pid" => {
            if is_ascending {
                processes.sort_by(|a, b| a.pid.cmp(&b.pid));
            } else {
                processes.sort_by(|a, b| b.pid.cmp(&a.pid));
            }
        }
        "cpu_usage" => {
            if is_ascending {
                processes.sort_by(|a, b| a.cpu_usage.partial_cmp(&b.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
            } else {
                processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
            }
        }
        "mem_usage" => {
            if is_ascending {
                processes.sort_by(|a, b| a.mem_usage.partial_cmp(&b.mem_usage).unwrap_or(std::cmp::Ordering::Equal));
            } else {
                processes.sort_by(|a, b| b.mem_usage.partial_cmp(&a.mem_usage).unwrap_or(std::cmp::Ordering::Equal));
            }
        }
        _ => {
            processes.sort_by(|a,b| a.pid.cmp(&b.pid));
        }
    }

    processes
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

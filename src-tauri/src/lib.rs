// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Serialize, Deserialize};
use sysinfo::{System,Pid};
use std::process::Command;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;
use sysinfo::Process;


#[derive(Serialize, Deserialize)]
struct ProcessInfo { // struct to hold process information
    pid: u32,
    name: String,   //TODO: add more fields to this struct
    status: String,
    cpu_usage: f32, 
    mem_usage: f32,
    username: String,
}

#[derive(Serialize, Deserialize)]
struct ProcessTreeNode {
    pid: u32,
    name: String,
    children: Vec<ProcessTreeNode>,
}

// cache for usernames
static USERNAME_CACHE: Lazy<Arc<Mutex<HashMap<String, String>>>> = 
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

fn get_username_for_pid(pid: u32) -> String {
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        let uid_key = format!("pid_{}", pid);
        
        // try to get from cache
        {
            let cache = USERNAME_CACHE.lock().unwrap();
            if let Some(username) = cache.get(&uid_key) {
                return username.clone();
            }
        }
        
        // if not in cache, look it up
        let output = Command::new("ps")
            .args(&["-o", "user=", "-p", &pid.to_string()])
            .output();
        
        let username = match output {
            Ok(output) if output.status.success() => {
                String::from_utf8_lossy(&output.stdout).trim().to_string()
            },
            _ => "Unknown".to_string()
        };
        
        // Store in cache
        {
            let mut cache = USERNAME_CACHE.lock().unwrap();
            cache.insert(uid_key, username.clone());
        }
        
        username
    }
    
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



            let user = get_username_for_pid(pid.as_u32());


            ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().into_owned(),
                status: process.status().to_string(), 
                cpu_usage: cpu,
                mem_usage: mem, // TODO: Memory Usage as percentage or in bytes?
                username: user,
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
        "username" => {
            if is_ascending {
                processes.sort_by(|a, b| a.username.to_lowercase().cmp(&b.username.to_lowercase()));
            } else {
                processes.sort_by(|a, b| b.username.to_lowercase().cmp(&a.username.to_lowercase()));
            }
        }
        _ => {
            processes.sort_by(|a,b| a.pid.cmp(&b.pid));
        }
    }

    processes
}


// Single Process Operations (Kill, Resume, Suspend)

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

// Group Process Operations (Kill, Suspend, Resume)

#[tauri::command]
fn kill_processes(pids: Vec<u32>) -> Vec<(u32, bool)> {
    let mut results = Vec::new();
    let mut sys = System::new_all();
    sys.refresh_all();
    
    for pid in pids {
        let system_pid = Pid::from_u32(pid);
        let success = if let Some(process) = sys.process(system_pid) {
            process.kill();
            true
        } else {
            false
        };
        results.push((pid, success));
    }
    results
}

#[tauri::command]
fn suspend_processes(pids: Vec<u32>) -> Vec<(u32, bool)> {
    let mut results = Vec::new();
    
    for pid in pids {
        let output = Command::new("kill")
            .arg("-STOP")
            .arg(pid.to_string())
            .output();
        
        let success = match output {
            Ok(output) => output.status.success(),
            Err(_) => false
        };
        results.push((pid, success));
    }
    results
}

#[tauri::command]
fn resume_processes(pids: Vec<u32>) -> Vec<(u32, bool)> {
    let mut results = Vec::new();
    
    for pid in pids {
        let output = Command::new("kill")
            .arg("-CONT")
            .arg(pid.to_string())
            .output();
        
        let success = match output {
            Ok(output) => output.status.success(),
            Err(_) => false
        };
        results.push((pid, success));
    }
    results
}

// Process Tree Functions
#[tauri::command]
fn get_process_tree() -> Vec<ProcessTreeNode> {
    let mut sys = System::new_all();
    
    // Match your existing refresh pattern from get_processes
    sys.refresh_all();
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_all();

    let processes = sys.processes();
    let mut parent_map: HashMap<Pid, Vec<Pid>> = HashMap::new();

    // Build parent-child relationships
    for (pid, process) in processes {
        let ppid = process.parent().unwrap_or_else(|| Pid::from(0));
        parent_map.entry(ppid).or_default().push(*pid);
    }

    // Recursive tree builder
    fn build_tree(
        pid: Pid,
        processes: &HashMap<Pid, Process>,  // Changed to Process instead of &Process
        parent_map: &HashMap<Pid, Vec<Pid>>,
    ) -> Option<ProcessTreeNode> {
        let process = processes.get(&pid)?;
        
        Some(ProcessTreeNode {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().into_owned(), // Fixed string conversion
            children: parent_map.get(&pid)
                .map(|pids| pids.iter()
                    .filter_map(|child_pid| build_tree(*child_pid, processes, parent_map))
                    .collect())
                .unwrap_or_default(),
        })
    }

    // Get root processes
    let mut roots = Vec::new();
    for root_pid in [Pid::from(0), Pid::from(1)] {  // Proper iteration
        if let Some(root) = build_tree(root_pid, &processes, &parent_map) {
            roots.push(root);
        }
    }
    
    roots
}

#[tauri::command]
fn get_process_subtree(pid: u32) -> Option<ProcessTreeNode> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let processes = sys.processes();
    let mut parent_map: HashMap<Pid, Vec<Pid>> = HashMap::new();

    // Build parent-child relationships
    for (pid, process) in processes {
        let ppid = process.parent().unwrap_or_else(|| Pid::from_u32(0));
        parent_map.entry(ppid).or_default().push(*pid);
    }

    // Recursive function to build the tree
    fn build_tree(
        pid: Pid,
        processes: &HashMap<Pid, Process>,
        parent_map: &HashMap<Pid, Vec<Pid>>,
    ) -> Option<ProcessTreeNode> {
        let process = processes.get(&pid)?;
        let children = parent_map.get(&pid)
            .map(|pids| pids.iter()
                .filter_map(|child_pid| build_tree(*child_pid, processes, parent_map))
                .collect())
            .unwrap_or_default();

        Some(ProcessTreeNode {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().into_owned(),
            children,
        })
    }
    build_tree(Pid::from_u32(pid), &processes, &parent_map)
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![os_name, get_processes, 
            kill_process,suspend_process,resume_process, get_process_tree, 
            get_process_subtree, get_cpu_count, get_cpu_usage, get_cpu_frequency, 
            get_cpu_load, kill_processes, suspend_processes, resume_processes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
//get the number of cpus
static SYS: Lazy<Mutex<System>> = Lazy::new(|| {
    let mut sys = System::new_all();
    sys.refresh_all(); // Initial refresh to establish baseline
    Mutex::new(sys)
});

#[tauri::command]
fn get_cpu_count() -> usize {
    let sys = SYS.lock().unwrap();
    sys.cpus().len()
}

#[tauri::command]
fn get_cpu_usage() -> Vec<f32> {
    let mut sys = SYS.lock().unwrap();
    sys.refresh_all();
    sys.cpus().iter().map(|cpu| cpu.cpu_usage()).collect()
}

#[tauri::command]
fn get_cpu_frequency() -> Vec<u64> {
    let sys = SYS.lock().unwrap();
    sys.cpus().iter().map(|cpu| cpu.frequency()).collect()
}

#[tauri::command]
fn get_cpu_load() -> Vec<f32> {
    let mut sys = SYS.lock().unwrap();
    sys.refresh_all();
    sys.cpus().iter().map(|cpu| cpu.cpu_usage()).collect() // Using cpu_usage as load
}


import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [osName, setOSName] = useState("");
  const [processes, setProcesses] = useState([]);

  async function getOsName() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setOSName(await invoke("os_name"));
  }

  async function getProcessesList(){
    
    const processes = await invoke("get_processes");
    setProcesses(processes);
  }

  return (
    <main className="container">
      <h1>Getting OS Name</h1>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          getOsName();
          getProcessesList();
        }}
      >
        <button type="submit">Yalla</button>
      </form>
      <p>{osName}</p>
      <div className="processes">
        <h2>Processes</h2>
        <ul>
          {processes.map((process) => (
            <li key={process.pid}>
              <p>{process.name}</p>
              <p>{process.pid}</p>
              <p>{process.status}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default App;

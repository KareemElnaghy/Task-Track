import { useState } from "react";
import { TbReload } from "react-icons/tb";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [osName, setOSName] = useState("");
  const [processes, setProcesses] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState("processes");
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  async function getOsName() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setOSName(await invoke("os_name"));
  }

  async function getProcessesList() {
    const processes = await invoke("get_processes");
    setProcesses(processes);
  }

  async function handleKill(pid) {
    await invoke("kill_process", { pid });
    getProcessesList();
  }
  async function handleSuspend(pid) {
    await invoke("suspend_process", { pid });
    getProcessesList();
  }
  async function handleResume(pid) {
    await invoke("resume_process", { pid });
    getProcessesList();
  }
  // async function handleTabClick(tab) {
  //   setActiveTab(tab);
  //   if (tab === "resources") {
  //     //show Monitoring resources window
  //   }
  // }

  // Actions on all processes
  // async function handleSuspendAll() {
  //   await invoke("suspend_all_processes");
  //   getProcessesList();
  // }
  // async function handleKillAll() {
  //   await invoke("kill_all_processes");
  //   getProcessesList();
  // }
  // async function handleResumeAll() {
  //   await invoke("resume_all_processes");
  //   getProcessesList();
  // }

  return (
    <main className="container">
      {!hasFetched ? (
        <>
          <h1>Getting OS Name</h1>

          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              getOsName();
              getProcessesList();
              setHasFetched(true);
            }}
          >
            <button className="start">Yalla</button>
          </form>
        </>
      ) : (
        <div className="processes">
          <button
            className="relaod"
            onClick={() => {
              getOsName();
              getProcessesList();
            }}
          >
            <TbReload />
          </button>
        </div>
      )}
      <p className="os-name">Operating System: {osName}</p>
      <div className="tabs">
        <div
          className={`tab ${activeTab === "processes" ? "active" : ""}`}
          onClick={() => handleTabClick("processes")}
        >
          Processes
        </div>
        <div
          className={`tab ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => handleTabClick("resources")}
        >
          Resources
        </div>
        {/* Add more tabs as needed */}
      </div>
      <div className="processes">
        <table>
          <thead>
            <tr>
              <th>PID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process) => (
              <tr key={process.pid}>
                <td>{process.pid}</td>
                <td>{process.name}</td>
                <td>{process.status}</td>
                <td>
                  <button
                    className="kill"
                    onClick={() => handleKill(process.pid)}
                  >
                    Kill
                  </button>
                  <button
                    className="suspend"
                    onClick={() => handleSuspend(process.pid)}
                  >
                    Suspend
                  </button>
                  <button
                    className="resume"
                    onClick={() => handleResume(process.pid)}
                  >
                    Resume
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default App;

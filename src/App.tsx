import { useState } from "react";
import { TbReload } from "react-icons/tb";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  interface Process {
    pid: string;
    name: string;
    status: string;
    cpu_usage: string;
    mem: string;
  }
  const [osName, setOSName] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState("processes");
  const [searchQuery, setSearchQuery] = useState("");

  async function getOsName() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setOSName(await invoke("os_name"));
  }

  async function getProcessesList() {
    const processes = await invoke<Process[]>("get_processes");
    setProcesses(processes);
  }

  async function handleKill(pid: string) {
    await invoke("kill_process", { pid });
    getProcessesList();
  }
  async function handleSuspend(pid: string) {
    await invoke("suspend_process", { pid });
    getProcessesList();
  }
  async function handleResume(pid: string) {
    await invoke("resume_process", { pid });
    getProcessesList();
  }
  async function handleTabClick(tab: "processes" | "resources") {
    setActiveTab(tab);
    if (tab === "resources") {
      setProcesses([]);
    } else if (tab === "processes") {
      getProcessesList();
    }
  }
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
              setActiveTab("processes");
              setSearchQuery("");
            }}
          >
            <TbReload />
          </button>
        </div>
      )}
      <p className="os-name">Operating System: {osName}</p>
      {/* Tabs*/}
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
        {/* add more tabs here */}
      </div>
      {/* Resources TAB */}
      {activeTab === "resources" && (
        <div className="resources">
          <div className="resource-row">
            <p>CPU Usage:</p>
            <div className="resource-box">[CPU Graph]</div>
          </div>
          <div className="resource-row">
            <p>Memory Usage:</p>
            <div className="resource-box">[Memory Graph]</div>
          </div>
          <div className="resource-row">
            <p>Disk Usage:</p>
            <div className="resource-box">[Disk Graph]</div>
          </div>
        </div>
      )}
      {/* Processes TAB */}
      {activeTab === "processes" && (
        <>
          {/* Search bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name or PID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="processes">
            <table>
              <thead>
                <tr>
                  <th>PID</th>
                  <th>Name</th>
                  <th>CPU%</th>
                  <th>Memory</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes
                  .filter(
                    (process) =>
                      process.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      process.pid.toString().includes(searchQuery)
                  )
                  .map((process) => (
                    <tr key={process.pid}>
                      <td>{process.pid}</td>
                      <td>{process.name}</td>
                      <td>{process.status}</td>
                      <td>{process.cpu_usage}</td>
                      <td>{process.mem}</td>
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
        </>
      )}
    </main>
  );
}

export default App;

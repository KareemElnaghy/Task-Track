import { useState } from "react";
import { useEffect } from "react";
import { TbReload } from "react-icons/tb";
import { invoke } from "@tauri-apps/api/core";
import { TbSortAscending, TbSortDescending } from "react-icons/tb";
import "./App.css";

function App() {
  interface Process {
    pid: string;
    name: string;
    status: string;
    cpu_usage: string;
    mem_usage: string;
    username: string;
  }
  const [osName, setOSName] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [activeTab, setActiveTab] = useState("processes");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortBy, setSortBy] = useState<string>("cpu_usage");
  const [sortDirection, setSortDirection] = useState<string>("descending");


  // AUTO REFRESH of processes every 1 second
  useEffect(() => {
    if (activeTab === "processes") {
      const interval = setInterval(() => {
        getOsName();
        getProcessesList();
        setActiveTab("processes");
      }, 1000); // 1000ms = 1 seconds

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [activeTab, sortBy, sortDirection]);

  async function getOsName() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setOSName(await invoke("os_name"));
  }
  async function getProcessesList() {
    const processes = await invoke<Process[]>("get_processes", {sortBy: sortBy, direction: sortDirection});
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
  function handleSort(column: string) {
    console.log(`Sorting by column: ${column}`);
    
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      const newDirection = sortDirection === "ascending" ? "descending" : "ascending";
      console.log(`Toggling direction to: ${newDirection}`);
      setSortDirection(newDirection);
    } else {

      console.log(`Changing sort column from ${sortBy} to ${column}`);
      setSortBy(column);
      setSortDirection("ascending");
    }
    
    setTimeout(() => {
      getProcessesList();
    }, 0);
  }
  

  function renderSortIndicator(column: string) {
    if (sortBy === column) {
      return sortDirection === "ascending" ? 
        <TbSortAscending className="sort-icon" /> : 
        <TbSortDescending className="sort-icon" />;
    }
    return null;
  }

  return (
    <main className="container">
      {!hasFetched ? (
        <>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              getOsName();
              getProcessesList();
              setHasFetched(true);
            }}
          >
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
                  <th onClick={() => handleSort("pid")} className="sortable-header">
                    PID {renderSortIndicator("pid")}
                  </th>
                  <th onClick={() => handleSort("name")} className="sortable-header">
                    Name {renderSortIndicator("name")}
                  </th>
                  <th onClick={() => handleSort("cpu_usage")} className="sortable-header">
                    CPU % {renderSortIndicator("cpu_usage")}
                  </th>
                  <th onClick={() => handleSort("mem_usage")} className="sortable-header">
                    Mem % {renderSortIndicator("mem_usage")}
                  </th>
                  <th>User</th>
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
                      <td>{process.cpu_usage}</td>
                      <td>{process.mem_usage}</td>
                      <td>{process.username}</td>
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
        </>
      )}
    </main>
  );
}

export default App;

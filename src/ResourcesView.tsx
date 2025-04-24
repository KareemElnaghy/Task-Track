import { useState } from "react";
import { useEffect } from "react";
import { TbReload } from "react-icons/tb";
import { invoke } from "@tauri-apps/api/core";
import { TbSortAscending, TbSortDescending } from "react-icons/tb";
import "./App.css";

function ResourcesView() {
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
    </main>
  );
}

export default ResourcesView;

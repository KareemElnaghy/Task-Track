import { useState, useEffect } from "react";
import { TbReload, TbSortAscending, TbSortDescending } from "react-icons/tb";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface Process {
  pid: string;
  name: string;
  status: string;
  cpu_usage: string;
  mem_usage: string;
  username: string;
}

export default function ProcessesView() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("cpu_usage");
  const [sortDirection, setSortDirection] = useState("descending");
  const [osName, setOSName] = useState("");

  // Initial fetch and auto-refresh
  useEffect(() => {
    const fetchData = async () => {
      await getOsName();
      await getProcessesList();
    };
    
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [sortBy, sortDirection]);

  async function getOsName() {
    try {
      const name = await invoke<string>("os_name");
      setOSName(name);
    } catch (error) {
      console.error("Error getting OS name:", error);
    }
  }

  async function getProcessesList() {
    try {
      const result = await invoke<Process[]>("get_processes", {
        sortBy,
        direction: sortDirection
      });
      setProcesses(result);
    } catch (error) {
      console.error("Error fetching processes:", error);
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === "ascending" ? "descending" : "ascending");
    } else {
      setSortBy(column);
      setSortDirection("ascending");
    }
  };

  const renderSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortDirection === "ascending" 
        ? <TbSortAscending className="sort-icon" /> 
        : <TbSortDescending className="sort-icon" />;
    }
    return null;
  };

  return (
    <div className="processes-view">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or PID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="processes-table">
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
              <th onClick={() => handleSort("username")} className="sortable-header">
                User {renderSortIndicator("username")}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {processes
              .filter(process =>
                process.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                process.pid.toString().includes(searchQuery)
              )
              .map(process => (
                <tr key={process.pid}>
                  <td>{process.pid}</td>
                  <td>{process.name}</td>
                  <td>{process.cpu_usage}</td>
                  <td>{process.mem_usage}</td>
                  <td>{process.username}</td>
                  <td>{process.status}</td>
                  <td>
                    <button className="kill" onClick={() => invoke("kill_process", { pid: process.pid })}>
                      Kill
                    </button>
                    <button className="suspend" onClick={() => invoke("suspend_process", { pid: process.pid })}>
                      Suspend
                    </button>
                    <button className="resume" onClick={() => invoke("resume_process", { pid: process.pid })}>
                      Resume
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { TbSortAscending, TbSortDescending } from "react-icons/tb";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import "./App.css";

interface Process {
  pid: string;
  name: string;
  status: string;
  cpu_usage: string;
  mem_usage: string;
  username: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  selectedPid: string | null;
}

export default function ProcessesView() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("cpu_usage");
  const [sortDirection, setSortDirection] = useState("descending");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedPid: null,
  });
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (selectedProcesses.length > 0) {
      // Skip refreshing while processes are selected
      return;
    }

    const fetchData = async () => {
      await getProcessesList();
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [sortBy, sortDirection, selectedProcesses]);

  async function getProcessesList() {
    try {
      const result = await invoke<Process[]>("get_processes", {
        sortBy,
        direction: sortDirection,
      });
      setProcesses(result);
    } catch (error) {
      console.error("Error fetching processes:", error);
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection((prev) =>
        prev === "ascending" ? "descending" : "ascending"
      );
    } else {
      setSortBy(column);
      setSortDirection("ascending");
    }
  };

  const renderSortIndicator = (column: string) => {
    if (sortBy === column) {
      return sortDirection === "ascending" ? (
        <TbSortAscending className="sort-icon" />
      ) : (
        <TbSortDescending className="sort-icon" />
      );
    }
    return null;
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest("tr")?.onContextMenu // Don't close when clicking the row that opened it
      ) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [contextMenu.visible]);

  const handleRowContextMenu = (event: React.MouseEvent, process: Process) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      selectedPid: process.pid,
    });
  };

  const handleContextMenuAction = () => {
    navigate("/process-subtree", {
      state: {
        pid: contextMenu.selectedPid,
      },
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tableRef.current &&
        !tableRef.current.contains(event.target as Node)
      ) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const handleGroupAction = async (action: "kill" | "suspend" | "resume") => {
    if (selectedProcesses.length === 0) return;

    const pids = selectedProcesses.map((pid) => parseInt(pid));
    let results;

    switch (action) {
      case "kill":
        results = await invoke<Array<[number, boolean]>>("kill_processes", {
          pids,
        });
        break;
      case "suspend":
        results = await invoke<Array<[number, boolean]>>("suspend_processes", {
          pids,
        });
        break;
      case "resume":
        results = await invoke<Array<[number, boolean]>>("resume_processes", {
          pids,
        });
        break;
    }

    // Refresh process list
    getProcessesList();

    // Reset selections after operation completes
    setSelectedProcesses([]);
  };

  return (
    <div className="processes-view" ref={tableRef}>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or PID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Right Click Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: "absolute",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
          }}
        >
          <div className="menu-item" onClick={() => handleContextMenuAction()}>
            View Process Tree
          </div>
        </div>
      )}

      <div className="processes-table">
        <div className="group-actions">
          {" "}
          {/*TODO: Group Action Buttons where to put? */}
          {selectedProcesses.length > 0 && (
            <button
              className="deselect-all-button"
              onClick={() => setSelectedProcesses([])}
            >
              Deselect All
            </button>
          )}
          <button
            disabled={selectedProcesses.length === 0}
            onClick={() => handleGroupAction("kill")}
          >
            Kill Selected
          </button>
          <button
            disabled={selectedProcesses.length === 0}
            onClick={() => handleGroupAction("suspend")}
          >
            Suspend Selected
          </button>
          <button
            disabled={selectedProcesses.length === 0}
            onClick={() => handleGroupAction("resume")}
          >
            Resume Selected
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort("pid")} className="sortable-header">
                PID {renderSortIndicator("pid")}
              </th>
              <th
                onClick={() => handleSort("name")}
                className="sortable-header"
              >
                Name {renderSortIndicator("name")}
              </th>
              <th
                onClick={() => handleSort("cpu_usage")}
                className="sortable-header"
              >
                CPU % {renderSortIndicator("cpu_usage")}
              </th>
              <th
                onClick={() => handleSort("mem_usage")}
                className="sortable-header"
              >
                Mem % {renderSortIndicator("mem_usage")}
              </th>
              <th
                onClick={() => handleSort("username")}
                className="sortable-header"
              >
                User {renderSortIndicator("username")}
              </th>
              <th className="process-header">Status</th>
              <th className="process-header">Actions</th>
              <th className="process-header">Select</th>
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
                <tr
                  key={process.pid}
                  onContextMenu={(e) => handleRowContextMenu(e, process)}
                  className={
                    selectedProcesses.includes(process.pid)
                      ? "selected-row"
                      : ""
                  }
                >
                  <td>{process.pid}</td>
                  <td>{process.name}</td>
                  <td>{process.cpu_usage}</td>
                  <td>{process.mem_usage}</td>
                  <td>{process.username}</td>
                  <td>{process.status}</td>
                  <td>
                    <button
                      className="kill"
                      onClick={() =>
                        invoke("kill_process", { pid: process.pid })
                      }
                    >
                      Kill
                    </button>
                    <button
                      className="suspend"
                      onClick={() =>
                        invoke("suspend_process", { pid: process.pid })
                      }
                    >
                      Suspend
                    </button>
                    <button
                      className="resume"
                      onClick={() =>
                        invoke("resume_process", { pid: process.pid })
                      }
                    >
                      Resume
                    </button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedProcesses.includes(process.pid)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProcesses([
                            ...selectedProcesses,
                            process.pid,
                          ]);
                        } else {
                          setSelectedProcesses(
                            selectedProcesses.filter((id) => id !== process.pid)
                          );
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { TbReload } from "react-icons/tb";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { BsCircleHalf } from "react-icons/bs";
import ProcessesView from "./ProcessesView";
import ResourcesView from "./ResourcesView";
import ProcessTreeView from "./ProcessTreeView";
import ProcessSubtreeView from "./ProcessSubtreeView";
import "./Light.css"; // Default theme

const Navigation = () => {
  const location = useLocation();
  return (
    <div className="tabs">
      <Link
        to="/processes"
        className={`tab ${location.pathname === "/processes" ? "active" : ""}`}
      >
        Processes
      </Link>
      <Link
        to="/resources"
        className={`tab ${location.pathname === "/resources" ? "active" : ""}`}
      >
        Resources
      </Link>
      <Link
        to="/process-tree"
        className={`tab ${
          location.pathname === "/process-tree" ? "active" : ""
        }`}
      >
        Process Tree
      </Link>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    switch (theme) {
      case "dark":
        import("./Dark.css");
        break;
      case "purple":
        import("./Purple.css");
        break;
      case "light":
        import("./Light.css");
        break;
      default:
        import("./Purple.css");
    }
  }, [theme]);

  // Fetch OS name on component mount
  useEffect(() => {
    const fetchOsName = async () => {
      try {
        const name = await invoke<string>("os_name");
        setOSName(name);
      } catch (error) {
        console.error("Error fetching OS name:", error);
        setOSName("Unknown OS");
      }
    };

    fetchOsName();
  }, []);

    return (
    <HashRouter>
      <main className="container">
        <div className="header">
          <h1 className="app-title">Task Track</h1>
          <div className="header-buttons">
            <div className="theme-toggle">
              <button
                className={`theme-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
                title="Light Theme"
              >
                <MdLightMode />
              </button>
              <button
                className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
                title="Dark Theme"
              >
                <MdDarkMode />
              </button>
              <button
                className={`theme-btn ${theme === "purple" ? "active" : ""}`}
                onClick={() => setTheme("purple")}
                title="Purple Theme"
              >
                <BsCircleHalf />
              </button>
            </div>
          </div>
        </div>
  
        <Navigation />
  
        <Routes>
          <Route path="/processes" element={<ProcessesView />} />
          <Route path="/resources" element={<ResourcesView />} />
          <Route path="/process-tree" element={<ProcessTreeView />} />
          <Route path="/process-subtree" element={<ProcessSubtreeView />} />
          <Route path="/" element={<Navigate to="/processes" replace />} />
          <Route path="*" element={<Navigate to="/processes" replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}
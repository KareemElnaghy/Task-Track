import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { TbReload } from "react-icons/tb";
import ProcessesView from "./ProcessesView";
import ResourcesView from "./ResourcesView";
import "./App.css";

const Navigation = () => {
  const location = useLocation();
  return (
    <div className="tabs">
      <Link 
        to="/processes" 
        className={`tab ${location.pathname === '/processes' ? 'active' : ''}`}
      >
        Processes
      </Link>
      <Link 
        to="/resources" 
        className={`tab ${location.pathname === '/resources' ? 'active' : ''}`}
      >
        Resources
      </Link>
    </div>
  );
};

export default function App() {
  const [osName, setOSName] = useState("");

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
        {/* Header Section */}
        <div className="header">
          <p className="os-name">Operating System: {osName || "Loading..."}</p>
          <button 
            className="reload"
            onClick={async () => {
              try {
                const name = await invoke<string>("os_name");
                setOSName(name);
              } catch (error) {
                console.error("Error reloading OS name:", error);
              }
            }}
          >
            <TbReload />
          </button>
        </div>

        <Navigation />

        <Routes>
          <Route path="/processes" element={<ProcessesView />} />
          <Route path="/resources" element={<ResourcesView />} />
          <Route path="/" element={<Navigate to="/processes" replace />} />
          <Route path="*" element={<Navigate to="/processes" replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

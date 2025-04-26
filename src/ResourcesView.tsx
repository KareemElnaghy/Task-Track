import { useState } from "react";
import { useEffect } from "react";
import { TbReload } from "react-icons/tb";
import { invoke } from "@tauri-apps/api/core";
import { TbSortAscending, TbSortDescending } from "react-icons/tb";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";
function ResourcesView() {
  return (
    <main className="container">
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

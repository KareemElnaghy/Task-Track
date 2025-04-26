import { useState } from "react";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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
  const [cpuData, setCpuData] = useState<Record<string, number>[]>([]);
  const [numCores, setNumCores] = useState(0);

  useEffect(() => {
    async function fetchCpuCount() {
      const count = await invoke<number>("get_cpu_count");
      setNumCores(count);
    }
    fetchCpuCount();

    const interval = setInterval(async () => {
      const usages = await invoke<number[]>("get_cpu_usage");

      setCpuData((oldData) => {
        const newPoint: Record<string, number> = {
          time: Date.now(),
        };
        usages.forEach((usage, idx) => {
          newPoint[`core${idx}`] = usage;
        });
        return [...oldData.slice(-59), newPoint]; // Keep last 60 points
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <main className="container">
      <div className="resources">
        <div className="resource-row">
          <p>CPU Usage:</p>
          <div className="resource-box">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cpuData}>
                <XAxis hide />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip />
                {Array.from({ length: numCores }).map((_, idx) => (
                  <Line
                    key={idx}
                    type="monotone"
                    dataKey={`core${idx}`}
                    stroke={`hsl(${(idx * 360) / numCores}, 70%, 50%)`}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
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
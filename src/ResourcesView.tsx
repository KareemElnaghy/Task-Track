// ResourcesView.tsx
import "./App.css";
import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Line } from "react-chartjs-2";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function ResourcesView() {
  const [memoryGraphData, setMemoryGraphData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [coreDataPoints, setCoreDataPoints] = useState<number[][]>([]);
  const [selectedCore, setSelectedCore] = useState<string>("avg");

  // CPU UTILIZATION
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;
      const cpuUtilization: number = await invoke("get_cpu_utilization");
      const now = new Date();
      const timestamp = now.toLocaleTimeString();
      setDataPoints((prev) => [...prev, cpuUtilization]);
      setLabels((prev) => [...prev, timestamp]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // PER CORE Utilization
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;
      const coreUtilizations: number[] = await invoke(
        "get_cpu_utilization_per_core"
      );

      setCoreDataPoints((prev) => {
        const updated = [...prev];
        coreUtilizations.forEach((val, idx) => {
          if (!updated[idx]) updated[idx] = [];
          updated[idx] = [...updated[idx], val];
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const selectedData =
    selectedCore === "avg"
      ? dataPoints
      : coreDataPoints[parseInt(selectedCore)] || [];

  const CPUchart = {
    labels,
    datasets: [
      {
        label:
          selectedCore === "avg"
            ? "AVG. CPU Utilization"
            : `CPU Core ${parseInt(selectedCore) + 1} Utilization`,
        data: selectedData,
        // borderColor: "#89648f",
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const CPUchartoptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        suggestedMin: Math.min(...selectedData) - 1,
        suggestedMax: Math.max(...selectedData) + 1,
        title: { display: true, text: "CPU Utilization (%)" },
      },
      x: {
        title: { display: true, text: "Time (s)" },
      },
    },
  };

  //MEMORY
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;
      const memoryUsage = (await invoke("get_memory_usage_gb")) as number;
      setMemoryGraphData((prevData) => [...prevData, memoryUsage]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const memChartData = {
    labels: Array.from({ length: memoryGraphData.length }, (_, i) => {
      const timestamp = new Date(
        Date.now() - (memoryGraphData.length - i) * 1000
      );
      return timestamp.toLocaleTimeString();
    }),
    datasets: [
      {
        label: "Memory Usage GB",
        data: memoryGraphData,
        borderColor: "rgb(255, 99, 132)",
        // borderColor: "#89648f",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
        tension: 0.4,
      },
    ],
  };
  const memchartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        suggestedMin: Math.min(...memoryGraphData) - 1,
        suggestedMax: Math.max(...memoryGraphData) + 1,
        title: { display: true, text: "GB" },
      },
      x: {
        title: { display: true, text: "Time (s)" },
      },
    },
  };

  // DISK
  type DiskThingy = {
    name: string;
    used_space: number;
    total_space: number;
  };

  const [disks, setDisks] = useState<DiskThingy[]>([]);

  useEffect(() => {
    invoke<DiskThingy[]>("get_disk_usage").then(setDisks);
  }, []);

  return (
    <main className="container">
      <div className="resources">
        <div className="resource-row">
          <p>
            CPU Utilization:
            <div>
              <button
                onClick={() => setSelectedCore("avg")}
                title="AVG Utilization"
              ></button>
            </div>
            <div>
              {coreDataPoints.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCore(idx.toString())}
                >
                  Core {idx + 1}
                </button>
              ))}
            </div>
          </p>
          <div className="resource-box">
            <Line data={CPUchart} options={CPUchartoptions} />
          </div>
        </div>
        <div className="resource-row">
          <p>Memory Usage:</p>

          <div className="resource-box">
            <Line data={memChartData} options={memchartOptions} />
          </div>
        </div>
        <div className="resource-row">
          <p>Disk Usage:</p>
          <div></div>
          <div className="resource-box">
            {disks.length === 0 ? (
              <p>Loading disk info...</p>
            ) : (
              <ul>
                {disks.map((disk, idx) => (
                  <li key={idx}>
                    <strong>{disk.name}</strong>: Used {disk.used_space} / Total{" "}
                    {disk.total_space} bytes
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ResourcesView;

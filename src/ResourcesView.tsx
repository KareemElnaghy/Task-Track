// ResourcesView.tsx
import "./App.css";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Line } from "react-chartjs-2";
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

  // CPU UTILIZATION
  useEffect(() => {
    const interval = setInterval(async () => {
      const cpuUtilization: number = await invoke("get_cpu_utilization");
      const now = new Date();
      const timestamp = now.toLocaleTimeString();
      setDataPoints((prev) => [...prev, cpuUtilization]);
      setLabels((prev) => [...prev, timestamp]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const CPUchartData = {
    labels,
    datasets: [
      {
        label: "CPU Utilization Over Time",
        data: dataPoints,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const CPUchartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        suggestedMin: Math.min(...dataPoints) - 1,
        suggestedMax: Math.max(...dataPoints) + 1,
        title: { display: true, text: "CPU Utilization (%)" },
      },
      x: {
        title: { display: true, text: "Time (s)" },
      },
    },
  };

  //MEMORY
  useEffect(() => {
    const interval = setInterval(async () => {
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

  return (
    <main className="container">
      <div className="resources">
        <div className="resource-row">
          <p>CPU Utilization: </p>
          <div className="resource-box">
            <Line data={CPUchartData} options={CPUchartOptions} />
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
          <div className="resource-box">[Disk Graph]</div>
        </div>
      </div>
    </main>
  );
}

export default ResourcesView;

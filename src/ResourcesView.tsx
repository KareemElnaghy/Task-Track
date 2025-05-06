// ResourcesView.tsx
import "./App.css";
import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Line } from "react-chartjs-2";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function ResourcesView() {
  const [labels, setLabels] = useState<string[]>([]);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [coreDataPoints, setCoreDataPoints] = useState<number[][]>([]);
  const [selectedCore, setSelectedCore] = useState<string>("avg");

  const [coreFrequencies, setCoreFrequencies] = useState<number[]>([]);
  const [cpuTemperature, setCpuTemperature] = useState<number | null>(null);

  //freq & temp
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;
      const temp: number | null = await invoke("get_cpu_temperature");
      const frequencies: number[] = await invoke("get_cpu_frequencies");
      setCpuTemperature(temp);
      setCoreFrequencies(frequencies);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const [memoryGraphData, setMemoryGraphData] = useState<number[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [memoryload, setMemoryload] = useState<number>(0);
  const [totalMemory, setTotalMemory] = useState<number>(0);
  const [freeMemory, setFreeMemory] = useState<number>(0);
  const [swapMemoryUsage, setSwapMemoryUsage] = useState<number>(0);
  const [cachedmem, setCachedmem] = useState<number>(0);
  const [cachedFiles, setCachedFiles] = useState<number | null>(null);

  const fetchMemoryData = async () => {
    try {
      const usedMemory = await invoke("get_memory_usage_gb");
      const totalMem = await invoke("get_total_memory_gb");
      const freeMem = await invoke("get_free_memory_gb");
      const swapUsage = await invoke("get_swap_memory_usage_gb");
      const cached = await invoke("get_cached_memory_gb");

      setMemoryUsage(usedMemory as number);
      setTotalMemory(totalMem as number);
      setFreeMemory(freeMem as number);
      setSwapMemoryUsage(swapUsage as number);
      setCachedFiles(cached as number);
    } catch (error) {
      console.error("Error fetching memory data:", error);
    }
  };
  useEffect(() => {
    fetchMemoryData();
    const interval = setInterval(() => {
      fetchMemoryData();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;
      const memoryload =
        (((await invoke("get_memory_usage_gb")) as number) /
          ((await invoke("get_total_memory_gb")) as number)) *
        100;
      setMemoryGraphData((prevData) => [...prevData, memoryload]);
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
        label: "Memory Load (%)",
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
        title: { display: true, text: "Load (%)" },
      },
      x: {
        title: { display: true, text: "Time (s)" },
      },
    },
  };

  // DISK
  type DiskThingy = {
    name: string;
    mount_point: string;
    fs_type: string;
    is_root: boolean;
    is_swap: boolean;
    used_gb: number;
    free_gb: number;
    total_gb: number;
  };

  const [disks, setDisks] = useState<DiskThingy[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      invoke<DiskThingy[]>("get_disk_usage").then(setDisks);
    }, 1000);
    return () => clearInterval(interval);
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
          </p>
          <div
            className="resource-box"
            style={{ marginLeft: "3.3rem", marginTop: "3rem" }}
          >
            <Line data={CPUchart} options={CPUchartoptions} />
          </div>

          <div>
            {coreDataPoints.map((_, idx) => (
              <button key={idx} onClick={() => setSelectedCore(idx.toString())}>
                Core {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="resource-row">
          <p>Memory Usage:</p>
          <div className="resource-box">
            <Line data={memChartData} options={memchartOptions} />
          </div>
        </div>

        <div className="dashboard-sections side-by-side-boxes">
          <div className="resource-row" style={{ marginBottom: "20rem" }}>
            <p>Stats Summary:</p>
          </div>
          <div className="dashboard-box disk-section">
            <div className="disk-info">
              <strong>Physical Memory:</strong>
              <h2>Total Memory: {totalMemory?.toFixed(2)} GB</h2>
              <h2>Used Memory: {memoryUsage?.toFixed(2)} GB</h2>
              <h2>Swap Memory Used: {swapMemoryUsage?.toFixed(2)} GB </h2>
              <h2>Cached files: {cachedFiles?.toFixed(2)} GB </h2>
            </div>
            <div className="disk-info">
              <strong>CPU:</strong>
              <h2>
                <div>
                  Temperature:{" "}
                  {cpuTemperature !== null
                    ? `${cpuTemperature.toFixed(1)}°C`
                    : "N/A"}
                </div>
                {coreFrequencies.map((freq, idx) => (
                  <div key={idx}>
                    Core {idx + 1}:
                    {(
                      coreDataPoints[idx]?.[coreDataPoints[idx].length - 1] || 0
                    ).toFixed(1)}
                    % @ {(freq / 1000).toFixed(1)} GHz
                  </div>
                ))}
              </h2>
            </div>
          </div>
          <div className="resource-row" style={{ marginBottom: "20rem" }}>
            <p>Disk Usage:</p>
          </div>
          <div className="dashboard-box disk-section">
            {disks.length === 0 ? (
              <p>Loading disk info...</p>
            ) : (
              disks.map((disk, idx) => (
                <div className="disk-info" key={idx}>
                  <strong>
                    {disk.is_root ? "Root" : disk.is_swap ? "Swap" : "Data"}:
                  </strong>{" "}
                  {disk.name}
                  <div>Mount Point: {disk.mount_point}</div>
                  <div>File System: {disk.fs_type}</div>
                  <div>Total: {disk.total_gb.toFixed(2)} GB</div>
                  <div>Used: {disk.used_gb.toFixed(2)} GB</div>
                  <div>Free: {disk.free_gb.toFixed(2)} GB</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ResourcesView;

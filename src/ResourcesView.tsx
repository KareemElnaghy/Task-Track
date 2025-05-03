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
interface CPUData {
  core: number;
  load: number;
}

function ResourcesView() {
  // const [cpuData, setCpuData] = useState<number[][]>([]);
  // const [labels, setLabels] = useState<string[]>([]);
  // const [memData, setMemData] = useState<number[]>([]);

  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     const usage = await invoke<number[]>("get_cpu_load_for_all_cores");
  //     setCpuData((prev) => [...prev.slice(-29), usage]);
  //     setLabels((prev) => [
  //       ...prev.slice(-29),
  //       new Date().toLocaleTimeString(),
  //     ]);
  //     const memUsage = await invoke<number>("get_memory_usage");
  //     setMemData((prev) => [...prev.slice(-29), memUsage]);
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, []);

  // const data = {
  //   //CPU load for all cores
  //   labels,
  //   datasets:
  //     cpuData[0]?.map((_, index) => ({
  //       label: `Core ${index + 1}`,
  //       data: cpuData.map((usage) => usage[index]),
  //       borderColor: `hsl(${(index * 360) / cpuData[0]?.length}, 100%, 50%)`,
  //       fill: false,
  //       tension: 0.3,
  //     })) || [],

  const [cpuData, setCpuData] = useState<CPUData[]>([]);
  const [memoryData, setMemoryData] = useState<number>(0);
  const [cpuGraphData, setCpuGraphData] = useState<any[]>([]);
  const [memoryGraphData, setMemoryGraphData] = useState<number[]>([]);
  const cpuColors = [
    "rgb(255, 0, 0)",
    "rgb(255, 145, 0)",
    "rgb(250, 246, 0)",
    "rgb(13, 100, 35)",
    "rgb(0, 89, 255)",
    "rgb(129, 0, 250)",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get CPU load data for all cores
        const cpuLoad = (await invoke(
          "get_cpu_load_for_all_cores"
        )) as number[];
        console.log("Fetched CPU Load:", cpuLoad); // Log the fetched CPU data
        const memoryUsage = (await invoke("get_memory_usage_gb")) as number;

        // Update CPU Data (one line per core)
        setCpuData(cpuLoad.map((load, index) => ({ core: index + 1, load })));

        // Update Memory Data
        setMemoryData(memoryUsage);
      } catch (error) {
        console.error("Error fetching system stats:", error);
      }
    };

    fetchData();
    // Update every 1 second
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cpuData.length > 0) {
      setCpuGraphData((prevData) => {
        const newData = [...prevData];

        cpuData.forEach(({ core, load }, index) => {
          const label = `Core ${core}`;
          const existing = newData.find((d) => d.label === label);

          if (existing) {
            existing.data = [...existing.data.slice(-29), load];
          } else {
            newData.push({
              label,
              data: [load],
              borderColor: cpuColors[index % cpuColors.length],
              backgroundColor: `${cpuColors[index % cpuColors.length]
                .replace("rgb", "rgba")
                .replace(")", ", 0.3)")}`,
              fill: true,
              tension: 0.4,
            });
          }
        });

        return newData;
      });
    }

    if (memoryData !== undefined) {
      setMemoryGraphData((prevData) => [...prevData, memoryData]); // Update memory graph data
    }
  }, [cpuData, memoryData]);

  const cpuChartData = {
    labels: Array.from(
      { length: cpuGraphData.length > 0 ? cpuGraphData[0]?.data.length : 0 },
      (_, i) =>
        new Date(
          Date.now() - (memoryGraphData.length - i) * 1000
        ).toLocaleTimeString()
    ),
    datasets: cpuGraphData,
  };

  const memoryChartData = {
    labels: Array.from({ length: memoryGraphData.length }, (_, i) =>
      new Date(
        Date.now() - (memoryGraphData.length - i) * 1000
      ).toLocaleTimeString()
    ),
    datasets: [
      {
        label: "Memory Usage",
        data: memoryGraphData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
        tension: 0.4,
      },
    ],
  };

  return (
    <main className="container">
      <div className="resources">
        <div className="resource-row">
          <p>CPU Usage:</p>
          {/* <div className="resource-box">
            <div className="p-4">
              <h1 className="text-xl font-bold mb-4">
                Live CPU Usage (All Cores)
              </h1>
              <Line data={data} />
            </div>
          </div>
        </div> */}
          <div className="resource-box">
            <Line
              data={cpuChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                      callback: (value) => `${value}%`,
                    },
                    suggestedMin: 0,
                    suggestedMax: 30,
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="resource-row">
          <p>Memory Usage:</p>

          <div className="resource-box">
            <Line
              data={memoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 0.5,
                    },
                  },
                },
              }}
            />
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
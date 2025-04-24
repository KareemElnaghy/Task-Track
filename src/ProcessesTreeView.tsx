// src/ProcessTreeView.tsx
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLocation, useNavigate } from "react-router-dom";

interface ProcessTreeNode {
  pid: number;
  name: string;
  children: ProcessTreeNode[];
}

export default function ProcessTreeView() {
  const [tree, setTree] = useState<ProcessTreeNode[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPid = location.state?.pid;

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const data = await invoke<ProcessTreeNode[]>("get_process_tree");
        setTree(data);
      } catch (error) {
        console.error("Error fetching process tree:", error);
      }
    };
    fetchTree();
  }, []);

  const TreeNode = ({ node, depth = 0 }: { node: ProcessTreeNode, depth?: number }) => (
    <div className="tree-node" style={{ marginLeft: depth * 24 }}>
      <div className={`node-content ${node.pid === selectedPid ? "selected" : ""}`}>
        <span className="pid">[{node.pid}]</span>
        <span className="name">{node.name}</span>
      </div>
      {node.children.map(child => (
        <TreeNode key={child.pid} node={child} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div className="process-tree-view">
      <button className="back-button" onClick={() => navigate(-1)}>
        &larr; Back to Processes
      </button>
      <h2>Process Hierarchy</h2>
      {tree.map(root => (
        <TreeNode key={root.pid} node={root} />
      ))}
    </div>
  );
}

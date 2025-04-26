import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLocation, useNavigate } from "react-router-dom";

interface ProcessTreeNode {
  pid: number;
  name: string;
  children: ProcessTreeNode[];
}

export default function ProcessTreeView() {
  const [tree, setTree] = useState<ProcessTreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPid = location.state?.pid;

  useEffect(() => {
    const fetchTree = async () => {
      if (!selectedPid) {
        setError("No process selected");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching subtree for PID:", selectedPid);
        // Pass the pid parameter to the command
        const data = await invoke<ProcessTreeNode>("get_process_subtree", {
          pid: parseInt(selectedPid)
        });
        console.log("Received data:", data);
        setTree(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching process tree:", error);
        setError("Failed to load process tree");
        setLoading(false);
      }
    };
    fetchTree();
  }, [selectedPid]);

  const TreeNode = ({ node, depth = 0 }: { node: ProcessTreeNode, depth?: number }) => (
    <div className="tree-node" style={{ marginLeft: depth * 24 }}>
      <div className="node-content">
        <span className="pid">[{node.pid}]</span>
        <span className="name">{node.name}</span>
      </div>
      {node.children.map(child => (
        <TreeNode key={child.pid} node={child} depth={depth + 1} />
      ))}
    </div>
  );

  if (loading) {
    return <div className="process-tree-view loading">Loading process tree...</div>;
  }

  if (error) {
    return (
      <div className="process-tree-view error">
        <div className="error-message">{error}</div>
        <button className="back-button" onClick={() => navigate(-1)}>
          &larr; Back to Processes
        </button>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="process-tree-view empty">
        <div className="empty-message">No process tree available</div>
        <button className="back-button" onClick={() => navigate(-1)}>
          &larr; Back to Processes
        </button>
      </div>
    );
  }

  return (
    <div className="process-tree-view">
      <button className="back-button" onClick={() => navigate(-1)}>
        &larr; Back to Processes
      </button>
      <h2>Process Tree for PID {selectedPid} ({tree.name})</h2>
      <div className="tree-container">
        <TreeNode node={tree} />
      </div>
    </div>
  );
}
"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";

import { useGraphStore, type NodeData, type FlowNode, type FlowEdge } from "../../lib/graph-store";
import { RipplNode } from "./RipplNode";
import { CausalEdge } from "./CausalEdge";
import {
  RotateCcw,
  X,
  ShieldAlert,
  AlertTriangle,
  GitBranch,
  User,
  Quote,
  FileCode2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { executeAgentActionApi } from "../../lib/api";

const nodeTypes = {
  source: RipplNode,
  claim: RipplNode,
  decision: RipplNode,
  action: RipplNode,
  person: RipplNode,
  agent: RipplNode,
  default: RipplNode,
  sourceNode: RipplNode,
  claimNode: RipplNode,
  decisionNode: RipplNode,
  actionNode: RipplNode,
  personNode: RipplNode,
  agentNode: RipplNode,
  ripplNode: RipplNode,
};

const edgeTypes = {
  causalEdge: CausalEdge,
  smoothstep: CausalEdge,
};

// DAG Card layout dimensions (LangSmith style 260x120px)
const CARD_WIDTH = 260;
const CARD_HEIGHT = 120;

function layoutDagre(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 40,
    ranksep: 90,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    g.setNode(n.id, { width: CARD_WIDTH, height: CARD_HEIGHT });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos ? pos.x - CARD_WIDTH / 2 : 0,
        y: pos ? pos.y - CARD_HEIGHT / 2 : 0,
      },
    };
  });
}

// Blast radius BFS helper
function getDownstreamBlastRadius(rootId: string, edges: FlowEdge[]): Set<string> {
  const visited = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    edges.forEach((e) => {
      if (e.source === curr && !visited.has(e.target)) {
        visited.add(e.target);
        queue.push(e.target);
      }
    });
  }
  return visited;
}

function FitViewWatcher({ nodes }: { nodes: any[] }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 200 });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [nodes?.length, fitView]);
  return null;
}

export default function GraphExplorer({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const {
    nodes: rawNodes,
    edges: rawEdges,
    headerMetrics,
    isCascading,
    proposeRetractClaim,
    retractClaim,
    resetGraph,
  } = useGraphStore();

  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [focusClaimId, setFocusClaimId] = useState<string>("CLM-001");
  const [isProposing, setIsProposing] = useState(false);
  const [isTestingAgent, setIsTestingAgent] = useState(false);
  const [agentTestResult, setAgentTestResult] = useState<any | null>(null);

  // Compute downstream blast radius
  const blastRadiusIds = useMemo(() => {
    return getDownstreamBlastRadius(focusClaimId, rawEdges);
  }, [focusClaimId, rawEdges]);

  // Compute focused causal chain: upstream source + target claim + downstream blast radius
  const focusedNodeIds = useMemo(() => {
    const upstreamIds = rawEdges
      .filter((e) => e.target === focusClaimId)
      .map((e) => e.source);
    const downstreamIds = Array.from(getDownstreamBlastRadius(focusClaimId, rawEdges));
    return new Set([...upstreamIds, focusClaimId, ...downstreamIds]);
  }, [focusClaimId, rawEdges]);

  // Check if any node is retracted in the graph
  const hasActiveRetraction = useMemo(() => {
    return rawNodes.some(
      (n) =>
        n.data.status === "Premise Retracted" ||
        n.data.status === "Retracted" ||
        n.data.status === "Blocked" ||
        n.data.status === "Premise At Risk" ||
        n.data.status === "Proposed Retraction"
    );
  }, [rawNodes]);

  // Filter nodes & edges strictly to focused causal chain (e.g. 5 nodes)
  const visibleNodes = useMemo(() => {
    const subset = rawNodes.filter((n) => focusedNodeIds.has(n.id));
    const nodesToUse = subset.length > 0 ? subset : rawNodes.slice(0, 5);
    return nodesToUse.map((n) => {
      const isAffected = blastRadiusIds.has(n.id);
      return {
        ...n,
        data: {
          ...n.data,
          isDimmed: hasActiveRetraction && !isAffected,
          isAffected,
        },
      };
    });
  }, [rawNodes, focusedNodeIds, blastRadiusIds, hasActiveRetraction]);

  const visibleEdges = useMemo(() => {
    const allowed = new Set(visibleNodes.map((n) => n.id));
    return rawEdges.filter((e) => allowed.has(e.source) && allowed.has(e.target));
  }, [rawEdges, visibleNodes]);

  const layoutedNodes = useMemo(() => {
    if (visibleNodes.length === 0) return [];
    return layoutDagre(visibleNodes, visibleEdges);
  }, [visibleNodes, visibleEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const nData = node.data as unknown as NodeData;
    setSelectedNode(nData);
    if (nData.type === "claim") {
      setFocusClaimId(nData.id);
    }
  }, []);

  const handleProposeRetract = async () => {
    if (!selectedNode) return;
    setIsProposing(true);
    try {
      await proposeRetractClaim(selectedNode.id, "Flagged in DAG explorer for human review");
      setSelectedNode((prev) => (prev ? { ...prev, status: "Proposed Retraction" } : null));
    } finally {
      setIsProposing(false);
    }
  };

  const handleTestAgent = async () => {
    setIsTestingAgent(true);
    try {
      const res = await executeAgentActionApi();
      setAgentTestResult(res);
    } catch (err: any) {
      setAgentTestResult({
        success: false,
        status: "ERROR",
        message: err.message,
      });
    } finally {
      setIsTestingAgent(false);
    }
  };

  // LangSmith Drawer metadata
  const drawerMetadata = useMemo(() => {
    if (!selectedNode) return null;
    const props = selectedNode.properties || {};
    return {
      quote:
        props.quote ||
        props.evidence_quote ||
        (selectedNode.id === "CLM-001"
          ? "Shard-09 replication lag sustained < 5ms under 14k peak write IOPS"
          : selectedNode.id === "DEC-001"
          ? "Shard-09 metrics verified healthy, promoting to active primary write replica."
          : `Verified dependency trace for ${selectedNode.id} in FalkorDB GraphBLAS.`),
      source:
        props.source_title ||
        props.source ||
        (selectedNode.id.startsWith("CLM")
          ? "SRC-003: DB-Shard-09 Production Telemetry"
          : "FalkorDB Load-Bearing Graph"),
      owner:
        props.owner ||
        (selectedNode.type === "decision"
          ? "Elena Rostova (SRE Lead)"
          : selectedNode.type === "action"
          ? "Marcus Vance (Infra Architect)"
          : "DB-Shard-09 Sentry Agent (AGT-001)"),
    };
  }, [selectedNode]);

  return (
    <div className="relative w-full h-full bg-[#09090b] overflow-hidden flex flex-col select-none text-zinc-100">
      {/* ─── Top Control Bar (Clean Vercel/Linear Style) ─── */}
      <div className="h-12 px-6 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between shrink-0 z-20 gap-4">
        {/* Left: Graph Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">
              Causal Radius
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {layoutedNodes.length} Nodes
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-800 text-[11px] font-mono text-zinc-500">
            <span>Target:</span>
            <span className="text-zinc-300 font-semibold">{focusClaimId}</span>
            <span>|</span>
            <span className="text-zinc-400">{blastRadiusIds.size} downstream in radius</span>
            <span>|</span>
            <span className="text-emerald-400 font-medium">1.14ms BFS</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => retractClaim(focusClaimId)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 transition-colors cursor-pointer"
          >
            <ShieldAlert size={12} />
            <span>Retract {focusClaimId}</span>
          </button>

          <button
            onClick={resetGraph}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ─── Main React Flow DAG Canvas ─── */}
      <div className="flex-1 w-full relative min-h-[550px]" style={{ width: "100%", height: "calc(100vh - 104px)" }}>
        <ReactFlow
          style={{ width: "100%", height: "100%" }}
          nodes={layoutedNodes as any}
          edges={visibleEdges as any}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.15}
          maxZoom={2.0}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: isCascading,
            style: { stroke: "#27272a", strokeWidth: 1.5 },
          }}
          className="bg-[#09090b]"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#1e1e24"
          />
          <Controls
            className="!bg-[#121215] !border !border-zinc-800 !rounded-md !text-zinc-400 overflow-hidden"
            showInteractive={false}
          />
          <FitViewWatcher nodes={layoutedNodes} />
        </ReactFlow>

        {/* ─── The LangSmith Detail Drawer ─── */}
        {selectedNode && drawerMetadata && (
          <aside className="absolute right-0 top-0 bottom-0 w-96 bg-[#09090b] border-l border-zinc-800 z-30 flex flex-col justify-between p-5 transition-all overflow-y-auto font-sans shadow-xl">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-zinc-400 uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {selectedNode.type}
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-100 uppercase">
                    {selectedNode.id}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between py-2 px-3 rounded bg-zinc-900/60 border border-zinc-800">
                <span className="text-xs text-zinc-400">Status</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedNode.status === "Premise Retracted" ||
                      selectedNode.status === "Retracted" ||
                      selectedNode.status === "Blocked"
                        ? "bg-rose-500"
                        : selectedNode.status === "Premise At Risk" ||
                          selectedNode.status === "Proposed Retraction"
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span
                    className={
                      selectedNode.status === "Premise Retracted" ||
                      selectedNode.status === "Retracted" ||
                      selectedNode.status === "Blocked"
                        ? "text-rose-400 font-semibold"
                        : selectedNode.status === "Premise At Risk" ||
                          selectedNode.status === "Proposed Retraction"
                        ? "text-amber-400 font-semibold"
                        : "text-emerald-400"
                    }
                  >
                    {selectedNode.status || "Sound"}
                  </span>
                </div>
              </div>

              {/* 1. Ground Truth Quote */}
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-medium">
                  <Quote size={12} className="text-zinc-400" />
                  <span>Ground Truth Quote</span>
                </span>
                <blockquote className="text-xs text-zinc-300 leading-relaxed bg-[#121215] p-3 rounded border border-zinc-800 italic">
                  &ldquo;{drawerMetadata.quote}&rdquo;
                </blockquote>
              </div>

              {/* 2. Accountable Owner */}
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-medium">
                  <User size={12} className="text-zinc-400" />
                  <span>Accountable Owner</span>
                </span>
                <div className="text-xs font-mono text-zinc-300 bg-[#121215] p-2.5 rounded border border-zinc-800 flex items-center justify-between">
                  <span>{drawerMetadata.owner}</span>
                  <span className="text-[10px] text-zinc-500">Notified on cascade</span>
                </div>
              </div>

              {/* 3. Raw Node Metadata JSON (Collapsed by default per LangSmith style) */}
              <details className="space-y-1.5 group">
                <summary className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center justify-between font-medium cursor-pointer py-1 hover:text-zinc-200 select-none">
                  <span className="flex items-center gap-1.5">
                    <FileCode2 size={12} className="text-zinc-400" />
                    <span>Node Metadata (JSON)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <pre className="p-3 mt-1 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed max-h-48">
                  {JSON.stringify(
                    {
                      id: selectedNode.id,
                      type: selectedNode.type,
                      status: selectedNode.status || "Holding",
                      source: drawerMetadata.source,
                      properties: selectedNode.properties || {},
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>

            {/* Bottom Actions Drawer: Single Primary Action */}
            <div className="pt-4 border-t border-zinc-800 space-y-2 font-mono text-xs">
              {selectedNode.type === "claim" && (
                <button
                  onClick={handleProposeRetract}
                  disabled={isProposing}
                  className="w-full py-2 rounded font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <AlertTriangle size={13} />
                  <span>{isProposing ? "Proposing..." : "Propose Retraction"}</span>
                </button>
              )}

              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-1.5 rounded font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Pre-Flight Modal */}
      {agentTestResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-lg bg-[#121215] border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Lock size={14} className="text-zinc-400" />
                <span>Pre-Flight Guardrail Result</span>
              </h3>
              <button
                onClick={() => setAgentTestResult(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div
              className={`p-3 rounded border text-xs font-mono ${
                agentTestResult.success
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/20 border-rose-500/40 text-rose-300"
              }`}
            >
              <div className="font-bold mb-1">
                STATUS: {agentTestResult.status}
              </div>
              <p className="leading-relaxed opacity-90">{agentTestResult.message}</p>
            </div>

            <button
              onClick={() => setAgentTestResult(null)}
              className="w-full py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  fetchGraph,
  fetchStats,
  retractClaimApi,
  proposeRetractClaimApi,
  seedGraphApi,
  fetchReviewQueue,
  approveReviewApi,
  rejectReviewApi,
  subscribeToCascadeStream,
  type StatsPayload,
  type CascadeResultPayload,
  type RetractionReceiptPayload,
} from "./api";
import dagre from "@dagrejs/dagre";

export interface NodeData {
  id: string;
  type: "source" | "claim" | "decision" | "action" | "person" | "agent";
  label: string;
  title?: string;
  text?: string;
  description?: string;
  status?: string;
  sourceType?: string;
  invalidated_at?: number;
  hop?: number;
  isDimmed?: boolean;
  isRippling?: boolean;
  properties: Record<string, any>;
  [key: string]: any;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
  [key: string]: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: Record<string, any>;
}

export interface HeaderMetrics {
  totalNodes: number;
  holdingDecisions: number;
  impactedDecisions: number;
  blockedActions: number;
  pendingReviews: number;
}

interface GraphStore {
  nodes: FlowNode[];
  edges: FlowEdge[];
  stats: StatsPayload | null;
  reviews: any[];
  isCascading: boolean;
  ripplingNodeIds: string[];
  activeCascadeResult: CascadeResultPayload | null;
  latestReceipt: RetractionReceiptPayload | null;
  selectedNode: NodeData | null;
  headerMetrics: HeaderMetrics;
  isLoading: boolean;
  error: string | null;
  proposeRetractClaim: (claimId: string, reason?: string) => Promise<any>;
  retractClaim: (claimId: string) => Promise<CascadeResultPayload | null>;
  resetGraph: () => Promise<void>;
  approveReview: (reviewId: string) => Promise<void>;
  rejectReview: (reviewId: string) => Promise<void>;
  selectNode: (node: NodeData | null) => void;
  refreshGraph: () => Promise<void>;
  dismissReceipt: () => void;
}

const GraphContext = createContext<GraphStore | null>(null);

// Compact pill node layout dimensions for 100+ node graph readability
const NODE_WIDTH = 170;
const NODE_HEIGHT = 44;

function layoutGraph(apiNodes: any[], apiEdges: any[]): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 35,
    ranksep: 75,
  });
  g.setDefaultEdgeLabel(() => ({}));

  apiNodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  apiEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const flowNodes: FlowNode[] = apiNodes.map((n) => {
    const rawType = (n.label || "decision").toLowerCase();
    const nodePos = g.node(n.id);
    const x = nodePos ? nodePos.x - NODE_WIDTH / 2 : 0;
    const y = nodePos ? nodePos.y - NODE_HEIGHT / 2 : 0;

    return {
      id: n.id,
      type: `${rawType}Node`,
      position: { x, y },
      data: {
        id: n.id,
        type: rawType as any,
        label: n.id,
        title: n.properties.title || n.properties.name || n.properties.text || n.id,
        text: n.properties.text,
        description: n.properties.description,
        status: n.properties.status || "Holding",
        sourceType: n.properties.source_type,
        invalidated_at: n.properties.invalidated_at,
        isDimmed: false,
        isRippling: false,
        properties: n.properties,
      },
    };
  });

  const flowEdges: FlowEdge[] = apiEdges.map((e, idx) => ({
    id: e.id || `e-${idx}`,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    data: {
      type: e.type,
      quote: e.properties?.quote,
      weight: e.properties?.weight,
    },
    style: {
      strokeWidth: 1.5,
      stroke: "#3f3f46", // zinc-700
    },
  }));

  return { nodes: flowNodes, edges: flowEdges };
}

export function GraphProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isCascading, setIsCascading] = useState(false);
  const [ripplingNodeIds, setRipplingNodeIds] = useState<string[]>([]);
  const [activeCascadeResult, setActiveCascadeResult] = useState<CascadeResultPayload | null>(null);
  const [latestReceipt, setLatestReceipt] = useState<RetractionReceiptPayload | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshGraph = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [graphData, statsData, reviewData] = await Promise.all([
        fetchGraph(),
        fetchStats(),
        fetchReviewQueue(),
      ]);

      const layouted = layoutGraph(graphData.nodes, graphData.edges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setStats(statsData);
      setReviews(reviewData);
    } catch (err: any) {
      console.error("Error refreshing graph from backend:", err);
      setError(err.message || "Failed to connect to backend server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Compute unified global state synchronization metrics
  const headerMetrics = useMemo<HeaderMetrics>(() => {
    const totalNodes = nodes.length || (stats?.total_nodes ?? 113);
    const holdingDecisions = nodes.filter(
      (n) => n.data.type === "decision" && (n.data.status === "Holding" || !n.data.status)
    ).length;
    
    // Impacted decisions include Premise Retracted & Premise At Risk
    const impactedDecisions = nodes.filter(
      (n) => n.data.type === "decision" && (n.data.status === "Premise Retracted" || n.data.status === "Premise At Risk")
    ).length;

    // Blocked actions include Blocked, Premise Retracted, and Premise At Risk
    const blockedActions = nodes.filter(
      (n) => n.data.type === "action" && (n.data.status === "Blocked" || n.data.status === "Premise Retracted" || n.data.status === "Premise At Risk")
    ).length;

    const pendingReviews = reviews.filter((r) => r.status === "pending").length;

    return {
      totalNodes,
      holdingDecisions,
      impactedDecisions,
      blockedActions,
      pendingReviews,
    };
  }, [nodes, stats, reviews]);

  // Initial load & SSE connection
  useEffect(() => {
    refreshGraph();

    const unsubscribe = subscribeToCascadeStream((event, data) => {
      if (event === "preview_start") {
        setIsCascading(true);
        if (data.claim_id) {
          setRipplingNodeIds([data.claim_id]);
        }
      } else if (event === "node_at_risk") {
        setRipplingNodeIds((prev) => Array.from(new Set([...prev, data.node_id])));
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === data.node_id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  status: "Premise At Risk",
                  hop: data.hop,
                  isRippling: true,
                  isDimmed: false,
                },
              };
            }
            return n;
          })
        );
      } else if (event === "preview_complete") {
        setIsCascading(false);
        fetchStats().then(setStats).catch(() => {});
        fetchReviewQueue().then(setReviews).catch(() => {});
      } else if (event === "cascade_start") {
        setIsCascading(true);
        if (data.claim_id) {
          setRipplingNodeIds([data.claim_id]);
        }
      } else if (event === "node_invalidated") {
        setRipplingNodeIds((prev) => Array.from(new Set([...prev, data.node_id])));
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === data.node_id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  status: data.status || "Premise Retracted",
                  hop: data.hop,
                  invalidated_at: Date.now(),
                  isRippling: true,
                  isDimmed: false,
                },
              };
            }
            return n;
          })
        );
      } else if (event === "cascade_complete") {
        setIsCascading(false);
        if (data.receipt) {
          setLatestReceipt(data.receipt);
        }
        fetchStats().then(setStats).catch(() => {});
        fetchReviewQueue().then(setReviews).catch(() => {});
      } else if (event === "review_approved" || event === "review_rejected" || event === "graph_reset") {
        refreshGraph();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshGraph]);

  // Synchronize dimmed state across nodes when cascading
  useEffect(() => {
    if (isCascading && ripplingNodeIds.length > 0) {
      setNodes((prev) =>
        prev.map((n) => {
          const isAffected = ripplingNodeIds.includes(n.id);
          return {
            ...n,
            data: {
              ...n.data,
              isDimmed: !isAffected,
              isRippling: isAffected,
            },
          };
        })
      );
    } else if (!isCascading) {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isDimmed: false,
            isRippling: false,
          },
        }))
      );
    }
  }, [isCascading, ripplingNodeIds]);

  // Stage 1 Human Gate: Propose Retraction
  const proposeRetractClaim = useCallback(
    async (claimId: string, reason?: string): Promise<any> => {
      try {
        setIsCascading(true);
        setRipplingNodeIds([claimId]);
        const res = await proposeRetractClaimApi(claimId, reason);
        await refreshGraph();
        return res;
      } catch (err: any) {
        console.error("Propose retraction failed:", err);
        setError(`Proposal failed: ${err.message}`);
        return null;
      } finally {
        setIsCascading(false);
      }
    },
    [refreshGraph]
  );

  const retractClaim = useCallback(
    async (claimId: string): Promise<CascadeResultPayload | null> => {
      try {
        setIsCascading(true);
        setRipplingNodeIds([claimId]);
        const result = await retractClaimApi(claimId);
        setActiveCascadeResult(result);
        if (result.receipt) {
          setLatestReceipt(result.receipt);
        }
        await refreshGraph();
        return result;
      } catch (err: any) {
        console.error("Retraction failed:", err);
        setError(`Retraction failed: ${err.message}`);
        return null;
      } finally {
        setIsCascading(false);
      }
    },
    [refreshGraph]
  );

  const resetGraph = useCallback(async () => {
    try {
      setIsLoading(true);
      await seedGraphApi();
      await refreshGraph();
      setLatestReceipt(null);
      setActiveCascadeResult(null);
      setRipplingNodeIds([]);
    } catch (err: any) {
      console.error("Reset failed:", err);
      setError(`Reset failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [refreshGraph]);

  const approveReview = useCallback(
    async (reviewId: string) => {
      try {
        setIsCascading(true);
        const res = await approveReviewApi(reviewId);
        if (res.receipt) {
          setLatestReceipt(res.receipt);
        }
        await refreshGraph();
      } catch (err: any) {
        console.error("Approval error:", err);
      } finally {
        setIsCascading(false);
      }
    },
    [refreshGraph]
  );

  const rejectReview = useCallback(
    async (reviewId: string) => {
      try {
        await rejectReviewApi(reviewId);
        await refreshGraph();
      } catch (err: any) {
        console.error("Reject error:", err);
      }
    },
    [refreshGraph]
  );

  const dismissReceipt = useCallback(() => {
    setLatestReceipt(null);
  }, []);

  return (
    <GraphContext.Provider
      value={{
        nodes,
        edges,
        stats,
        reviews,
        isCascading,
        ripplingNodeIds,
        activeCascadeResult,
        latestReceipt,
        selectedNode,
        headerMetrics,
        isLoading,
        error,
        proposeRetractClaim,
        retractClaim,
        resetGraph,
        approveReview,
        rejectReview,
        selectNode: setSelectedNode,
        refreshGraph,
        dismissReceipt,
      }}
    >
      {children}
    </GraphContext.Provider>
  );
}

export function useGraphStore(): GraphStore {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraphStore must be used within a GraphProvider");
  }
  return context;
}

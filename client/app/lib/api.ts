/**
 * Real API client connecting Next.js to the live Rippl FastAPI backend.
 * Zero mocks — all state is backed by real FalkorDB / GraphBLAS engine.
 */

const API_BASE = "http://localhost:8000/api";

export interface ApiNode {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface ApiEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphPayload {
  nodes: ApiNode[];
  edges: ApiEdge[];
}

export interface StatsPayload {
  total_nodes: number;
  holding_decisions: number;
  compromised_decisions: number;
  blocked_actions: number;
  verified_claims: number;
  retracted_claims: number;
  active_subscribers: number;
}

export interface RetractionReceiptPayload {
  receipt_id: string;
  claim_id: string;
  claim_text: string;
  timestamp: number;
  affected_nodes_count: number;
  affected_decisions: string[];
  affected_actions: string[];
  max_hop_distance: number;
  cascade_paths: string[][];
  signature: string;
  verified: boolean;
}

export interface CascadeResultPayload {
  success: boolean;
  claim_id: string;
  claim_text: string;
  affected_nodes: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    hop: number;
  }>;
  blast_radius: {
    total_nodes_invalidated: number;
    decisions_compromised: number;
    actions_blocked: number;
    max_propagation_depth: number;
  };
  receipt: RetractionReceiptPayload;
}

export async function fetchGraph(): Promise<GraphPayload> {
  const res = await fetch(`${API_BASE}/graph`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch graph: ${res.statusText}`);
  return res.json();
}

export async function fetchStats(): Promise<StatsPayload> {
  const res = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

export async function retractClaimApi(claimId: string): Promise<CascadeResultPayload> {
  const res = await fetch(`${API_BASE}/claims/${encodeURIComponent(claimId)}/retract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to retract claim: ${res.statusText}`);
  return res.json();
}

export async function proposeRetractClaimApi(claimId: string, reason?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/claims/${encodeURIComponent(claimId)}/propose-retract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || "Flagged in graph explorer for human review" }),
  });
  if (!res.ok) throw new Error(`Failed to propose retraction: ${res.statusText}`);
  return res.json();
}

export async function seedGraphApi(): Promise<any> {
  const res = await fetch(`${API_BASE}/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to seed graph: ${res.statusText}`);
  return res.json();
}

export async function resetGraphApi(): Promise<any> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to reset graph: ${res.statusText}`);
  return res.json();
}

export async function fetchReviewQueue(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/review-queue`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch review queue: ${res.statusText}`);
  return res.json();
}

export async function approveReviewApi(itemId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/review/${encodeURIComponent(itemId)}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to approve review: ${res.statusText}`);
  return res.json();
}

export async function rejectReviewApi(itemId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/review/${encodeURIComponent(itemId)}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to reject review: ${res.statusText}`);
  return res.json();
}

export async function askProvenanceApi(question: string): Promise<{
  question: string;
  answer: string;
  cypher_query: string;
  provenance_path: Array<{ id: string; title: string; type: string; status: string }>;
  execution_time_ms: number;
  llm_provider?: string;
}> {
  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Failed to ask provenance: ${res.statusText}`);
  return res.json();
}

export async function preflightCheckApi(decisionId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/preflight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision_id: decisionId }),
  });
  if (!res.ok) throw new Error(`Failed preflight check: ${res.statusText}`);
  return res.json();
}

export async function executeAgentActionApi(): Promise<any> {
  const res = await fetch(`${API_BASE}/agent/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed agent action: ${res.statusText}`);
  return res.json();
}

export async function runAgentApi(goal: string, actionId: string = "ACT-001", decisionId: string = "DEC-001"): Promise<any> {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, action_id: actionId, decision_id: decisionId }),
  });
  if (!res.ok) throw new Error(`Failed to run agent: ${res.statusText}`);
  return res.json();
}

export async function ingestDocumentApi(text: string): Promise<any> {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to ingest document: ${res.statusText}`);
  return res.json();
}

export async function fetchBenchmark(): Promise<any> {
  const res = await fetch(`${API_BASE}/benchmark`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch benchmark: ${res.statusText}`);
  return res.json();
}

export function subscribeToCascadeStream(
  onEvent: (event: string, data: any) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/stream/cascade`);

  eventSource.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      if (parsed.event && parsed.data) {
        onEvent(parsed.event, parsed.data);
      } else {
        onEvent("message", parsed);
      }
    } catch {
      // heartbeats or plaintext
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}

// ─── Graph Ontology Types ───

export type ClaimStatus = "Verified" | "Retracted";
export type DecisionStatus = "Holding" | "Premise At Risk" | "Premise Retracted" | "Superseded" | "Unverified";
export type ActionStatus = "Pending" | "Executed" | "Blocked";

export type NodeType = "source" | "claim" | "decision" | "action" | "person" | "agent";

export interface SourceNode {
  type: "source";
  id: string;
  title: string;
  sourceType: string; // e.g., AuditReport, VendorEmail
}

export interface ClaimNode {
  type: "claim";
  id: string;
  text: string;
  status: ClaimStatus;
}

export interface DecisionNode {
  type: "decision";
  id: string;
  title: string;
  status: DecisionStatus;
  invalidated_at?: number;
}

export interface ActionNode {
  type: "action";
  id: string;
  description: string;
  status: ActionStatus;
}

export interface PersonNode {
  type: "person";
  id: string;
  name: string;
  role: string;
}

export interface AgentNode {
  type: "agent";
  id: string;
  model: string;
  capability: string;
}

export type GraphNode = SourceNode | ClaimNode | DecisionNode | ActionNode | PersonNode | AgentNode;

export type EdgeType = "STATES" | "SUPPORTS" | "DEPENDS_ON" | "DRIVES" | "OWNS" | "EXECUTED";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  quote?: string;
  weight?: number;
  authorized_at?: number;
}

// ─── Cascade Event (SSE) ───
export interface CascadeEvent {
  nodeId: string;
  previousStatus: string;
  newStatus: string;
  hopDistance: number;
  timestamp: number;
}

// ─── Review Queue Item ───
export interface ReviewItem {
  id: string;
  claimId: string;
  claimText: string;
  proposedBy: string;
  proposedAt: number;
  affectedDecisions: number;
  affectedActions: number;
  status: "pending" | "approved" | "rejected";
  cascadePath: string[];
}

// ─── Chat Message ───
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  cypherQuery?: string;
  provenancePath?: { type: NodeType; id: string; label: string }[];
}

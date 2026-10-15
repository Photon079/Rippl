import {
  GraphNode,
  GraphEdge,
  ReviewItem,
  ChatMessage,
  CascadeEvent,
} from "./types";

// ─── Northwind Logistics Scenario: DB-Shard-09 ───
// A corrupted database shard triggers a cascade that invalidates
// multiple decisions and blocks downstream actions.

export const mockNodes: GraphNode[] = [
  // Sources
  {
    type: "source",
    id: "SRC-001",
    title: "Q3 Infrastructure Audit Report",
    sourceType: "AuditReport",
  },
  {
    type: "source",
    id: "SRC-002",
    title: "Vendor SLA Compliance Email",
    sourceType: "VendorEmail",
  },
  {
    type: "source",
    id: "SRC-003",
    title: "Database Monitoring Dashboard",
    sourceType: "MonitoringLog",
  },
  {
    type: "source",
    id: "SRC-004",
    title: "Capacity Planning Spreadsheet",
    sourceType: "InternalDoc",
  },

  // Claims
  {
    type: "claim",
    id: "CLM-001",
    text: "DB-Shard-09 is operating within normal parameters and handling 12% of total write traffic",
    status: "Verified",
  },
  {
    type: "claim",
    id: "CLM-002",
    text: "Vendor CloudDB Inc. guarantees 99.99% uptime SLA for all provisioned shards",
    status: "Verified",
  },
  {
    type: "claim",
    id: "CLM-003",
    text: "Current infrastructure can support 2x load increase without additional provisioning",
    status: "Verified",
  },
  {
    type: "claim",
    id: "CLM-004",
    text: "Billing reconciliation data integrity depends on all active database shards",
    status: "Verified",
  },

  // Decisions
  {
    type: "decision",
    id: "DEC-001",
    title: "Route 12% of write traffic through DB-Shard-09",
    status: "Holding",
  },
  {
    type: "decision",
    id: "DEC-002",
    title: "Defer infrastructure expansion to Q4 based on current capacity",
    status: "Holding",
  },
  {
    type: "decision",
    id: "DEC-003",
    title: "Approve monthly billing reconciliation pipeline",
    status: "Holding",
  },
  {
    type: "decision",
    id: "DEC-004",
    title: "Onboard 3 new enterprise clients to Shard-09 cluster",
    status: "Holding",
  },
  {
    type: "decision",
    id: "DEC-005",
    title: "Maintain current disaster recovery configuration",
    status: "Holding",
  },

  // Actions
  {
    type: "action",
    id: "ACT-001",
    description: "Flush Billing Queue via automated reconciliation",
    status: "Pending",
  },
  {
    type: "action",
    id: "ACT-002",
    description: "Deploy client onboarding microservice to Shard-09",
    status: "Pending",
  },
  {
    type: "action",
    id: "ACT-003",
    description: "Execute monthly SLA compliance verification",
    status: "Executed",
  },
  {
    type: "action",
    id: "ACT-004",
    description: "Archive Q2 telemetry data to cold storage",
    status: "Executed",
  },

  // Persons
  {
    type: "person",
    id: "PER-001",
    name: "Sarah Chen",
    role: "VP of Engineering",
  },
  {
    type: "person",
    id: "PER-002",
    name: "Marcus Rivera",
    role: "Database Lead",
  },
  {
    type: "person",
    id: "PER-003",
    name: "Priya Patel",
    role: "Operations Manager",
  },

  // Agents
  {
    type: "agent",
    id: "AGT-001",
    model: "gpt-4o",
    capability: "StewardAgent",
  },
  {
    type: "agent",
    id: "AGT-002",
    model: "gpt-4o",
    capability: "ExecutorAgent",
  },
];

export const mockEdges: GraphEdge[] = [
  // Source → Claim (STATES)
  {
    id: "e-src1-clm1",
    source: "SRC-003",
    target: "CLM-001",
    type: "STATES",
    quote: "Shard-09 metrics: 12.3% write throughput, latency p99 < 8ms",
  },
  {
    id: "e-src2-clm2",
    source: "SRC-002",
    target: "CLM-002",
    type: "STATES",
    quote: "Per contractual agreement Section 4.2, uptime guarantee of 99.99%",
  },
  {
    id: "e-src1-clm3",
    source: "SRC-001",
    target: "CLM-003",
    type: "STATES",
    quote: "Load testing confirms 2x headroom on current provisioning",
  },
  {
    id: "e-src4-clm4",
    source: "SRC-004",
    target: "CLM-004",
    type: "STATES",
    quote: "Billing pipeline reads from all active shards for reconciliation",
  },

  // Claim → Decision (SUPPORTS)
  {
    id: "e-clm1-dec1",
    source: "CLM-001",
    target: "DEC-001",
    type: "SUPPORTS",
    weight: 0.95,
  },
  {
    id: "e-clm2-dec1",
    source: "CLM-002",
    target: "DEC-001",
    type: "SUPPORTS",
    weight: 0.8,
  },
  {
    id: "e-clm3-dec2",
    source: "CLM-003",
    target: "DEC-002",
    type: "SUPPORTS",
    weight: 0.9,
  },
  {
    id: "e-clm1-dec2",
    source: "CLM-001",
    target: "DEC-002",
    type: "SUPPORTS",
    weight: 0.7,
  },
  {
    id: "e-clm4-dec3",
    source: "CLM-004",
    target: "DEC-003",
    type: "SUPPORTS",
    weight: 0.85,
  },
  {
    id: "e-clm1-dec4",
    source: "CLM-001",
    target: "DEC-004",
    type: "SUPPORTS",
    weight: 0.9,
  },
  {
    id: "e-clm2-dec5",
    source: "CLM-002",
    target: "DEC-005",
    type: "SUPPORTS",
    weight: 0.75,
  },

  // Decision → Decision (DEPENDS_ON)
  {
    id: "e-dec1-dec3",
    source: "DEC-003",
    target: "DEC-001",
    type: "DEPENDS_ON",
  },
  {
    id: "e-dec1-dec4",
    source: "DEC-004",
    target: "DEC-001",
    type: "DEPENDS_ON",
  },

  // Decision → Action (DRIVES)
  {
    id: "e-dec3-act1",
    source: "DEC-003",
    target: "ACT-001",
    type: "DRIVES",
    authorized_at: Date.now() - 86400000,
  },
  {
    id: "e-dec4-act2",
    source: "DEC-004",
    target: "ACT-002",
    type: "DRIVES",
    authorized_at: Date.now() - 172800000,
  },
  {
    id: "e-dec5-act3",
    source: "DEC-005",
    target: "ACT-003",
    type: "DRIVES",
    authorized_at: Date.now() - 259200000,
  },
  {
    id: "e-dec2-act4",
    source: "DEC-002",
    target: "ACT-004",
    type: "DRIVES",
    authorized_at: Date.now() - 604800000,
  },

  // Person → Decision (OWNS)
  { id: "e-per1-dec2", source: "PER-001", target: "DEC-002", type: "OWNS" },
  { id: "e-per2-dec1", source: "PER-002", target: "DEC-001", type: "OWNS" },
  { id: "e-per3-dec3", source: "PER-003", target: "DEC-003", type: "OWNS" },
  { id: "e-per1-dec5", source: "PER-001", target: "DEC-005", type: "OWNS" },
  { id: "e-per2-dec4", source: "PER-002", target: "DEC-004", type: "OWNS" },

  // Agent → Action (EXECUTED)
  { id: "e-agt1-act3", source: "AGT-001", target: "ACT-003", type: "EXECUTED" },
  { id: "e-agt2-act4", source: "AGT-002", target: "ACT-004", type: "EXECUTED" },
];

// ─── Review Queue Seed Data ───
export const mockReviewItems: ReviewItem[] = [
  {
    id: "REV-001",
    claimId: "CLM-001",
    claimText:
      "DB-Shard-09 is operating within normal parameters and handling 12% of total write traffic",
    proposedBy: "AGT-001 (StewardAgent)",
    proposedAt: Date.now() - 3600000,
    affectedDecisions: 4,
    affectedActions: 3,
    status: "pending",
    cascadePath: [
      "CLM-001",
      "DEC-001",
      "DEC-002",
      "DEC-003",
      "DEC-004",
      "ACT-001",
      "ACT-002",
      "ACT-004",
    ],
  },
  {
    id: "REV-002",
    claimId: "CLM-003",
    claimText:
      "Current infrastructure can support 2x load increase without additional provisioning",
    proposedBy: "PER-001 (Sarah Chen)",
    proposedAt: Date.now() - 7200000,
    affectedDecisions: 1,
    affectedActions: 1,
    status: "pending",
    cascadePath: ["CLM-003", "DEC-002", "ACT-004"],
  },
  {
    id: "REV-003",
    claimId: "CLM-002",
    claimText:
      "Vendor CloudDB Inc. guarantees 99.99% uptime SLA for all provisioned shards",
    proposedBy: "PER-002 (Marcus Rivera)",
    proposedAt: Date.now() - 86400000,
    affectedDecisions: 2,
    affectedActions: 1,
    status: "approved",
    cascadePath: ["CLM-002", "DEC-001", "DEC-005", "ACT-003"],
  },
];

// ─── Chat History Seed Data ───
export const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-001",
    role: "user",
    content: "Why did we route 12% of traffic to DB-Shard-09?",
    timestamp: Date.now() - 120000,
  },
  {
    id: "msg-002",
    role: "assistant",
    content:
      'Decision DEC-001 ("Route 12% of write traffic through DB-Shard-09") was based on two supporting claims:\n\n1. **CLM-001**: DB-Shard-09 monitoring data showed normal operating parameters with 12.3% write throughput and p99 latency under 8ms.\n2. **CLM-002**: Vendor SLA guarantees 99.99% uptime.\n\nThis decision is currently **Holding** and was authorized by Marcus Rivera (Database Lead).',
    timestamp: Date.now() - 115000,
    cypherQuery:
      "MATCH (d:Decision {id: 'DEC-001'})<-[:SUPPORTS]-(c:Claim)<-[:STATES]-(s:Source)\nRETURN d, c, s\nORDER BY c.id",
    provenancePath: [
      { type: "source", id: "SRC-003", label: "Database Monitoring Dashboard" },
      { type: "claim", id: "CLM-001", label: "DB-Shard-09 normal operations" },
      { type: "decision", id: "DEC-001", label: "Route 12% traffic" },
      { type: "source", id: "SRC-002", label: "Vendor SLA Email" },
      { type: "claim", id: "CLM-002", label: "99.99% uptime SLA" },
    ],
  },
];

// ─── Cascade Simulation ───
export function simulateCascade(claimId: string): CascadeEvent[] {
  const events: CascadeEvent[] = [];
  const visited = new Set<string>();
  const queue: { nodeId: string; hop: number }[] = [];

  // Find all directly supported decisions
  for (const edge of mockEdges) {
    if (edge.source === claimId && edge.type === "SUPPORTS") {
      queue.push({ nodeId: edge.target, hop: 1 });
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const node = mockNodes.find((n) => n.id === current.nodeId);
    if (!node) continue;

    let previousStatus = "";
    if (node.type === "decision") previousStatus = node.status;
    else if (node.type === "action") previousStatus = node.status;

    events.push({
      nodeId: current.nodeId,
      previousStatus,
      newStatus: node.type === "action" ? "Blocked" : "Premise Retracted",
      hopDistance: current.hop,
      timestamp: Date.now() + current.hop * 800,
    });

    // Find downstream: DEPENDS_ON, DRIVES
    for (const edge of mockEdges) {
      if (edge.source === current.nodeId && (edge.type === "DEPENDS_ON" || edge.type === "DRIVES")) {
        queue.push({ nodeId: edge.target, hop: current.hop + 1 });
      }
      // Also check reverse DEPENDS_ON (target depends on source)
      if (edge.target === current.nodeId && edge.type === "DEPENDS_ON") {
        queue.push({ nodeId: edge.source, hop: current.hop + 1 });
      }
    }
  }

  return events.sort((a, b) => a.hopDistance - b.hopDistance);
}

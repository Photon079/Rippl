Rippl is the perfect name. It captures the exact "wow" moment of the demo: one retracted claim rippling through the entire company's decision history.

Below is the comprehensive, executive-quality Product Requirements Document (PRD). You can feed this directly into Antigravity to ground the OpenCode agent. The GitHub repositories of past winners have been mapped to specific UI/UX components so the agent can analyze their code structure for the frontend.

Product Requirements Document (PRD): Rippl
Tagline: "Most agents remember what happened. Rippl remembers what every decision was standing on — so when a claim is retracted, the graph shows every dependent decision and agent action that just became unsafe."

1. Product Vision & Architecture
Rippl is a stateful causal memory layer for engineering teams. It abandons flat vector retrieval in favor of a deterministic dependency graph. When a foundational premise (a Claim) is invalidated, the system executes a variable-length graph traversal to immediately flag all downstream Decisions and Actions as compromised. Autonomous agents query this graph as a pre-flight check, halting execution if their reasoning chain is broken.

1.1 Core Technology Stack
Database: FalkorDB (Sparse-matrix GraphBLAS architecture to eliminate pointer-chasing and ensure sub-millisecond multi-hop latency).

Backend: Python 3.11+, FastAPI (REST + Server-Sent Events).

Agent Orchestration: LangGraph (deterministic state machine for the Steward and Executor agents).

Agent Tooling: Model Context Protocol (MCP) using the official Python SDK.

Frontend: Next.js 15, Tailwind CSS, shadcn/ui, React Flow.

1.2 System Topology
Plaintext
[ Northwind Synthetic Seed Data ]
          │
          ▼
+---------------------------------------------------+
|  Ingestion Engine (Python / FastAPI)              |
|  - Entity Resolution & Deduplication              |
|  - Idempotent Cypher MERGE operations             |
+---------------------------------------------------+
          │
          ▼
+---------------------------------------------------+
|  FalkorDB (Stateful Causal Memory Layer)          |
|  - Nodes: Source, Claim, Decision, Action, Agent  |
|  - Edges: STATES, SUPPORTS, DRIVES, EXECUTED      |
+---------------------------------------------------+
          ▲                                 │
          │ (Cypher Queries)                │ (SSE Stream)
          ▼                                 ▼
+---------------------------------------------------+
|  Model Context Protocol (MCP) Server              |
|  Tools: check_premises(), retract_claim(), why()  |
+---------------------------------------------------+
          ▲                                 │
          │                                 ▼
+-----------------------+         +-----------------------+
|  LangGraph Agents     |         |  Next.js Frontend     |
|  - StewardAgent       | <-----> |  - React Flow Canvas  |
|  - ExecutorAgent      |         |  - Review Queue       |
+-----------------------+         +-----------------------+
2. Graph Ontology & Data Model
The schema is rigidly predefined to ensure that OpenCode can autonomously call the database_schema MCP tool to draft correct Cypher queries without hallucinating edge labels.

2.1 Node Definitions
(:Source): id, title, type (e.g., AuditReport, VendorEmail).

(:Claim): id, text, status (Verified | Retracted).

(:Decision): id, title, status (Must be one of the 5 Honest States below), invalidated_at.

(:Action): id, description, status (Pending | Executed | Blocked).

(:Person): id, name, role.

(:Agent): id, model, capability.

2.2 The Five Honest Decision States
Holding: Active and safe.

Premise At Risk: Upstream claim flagged for review.

Premise Retracted: Upstream premise invalidated.

Superseded: Replaced by a newer decision.

Unverified: Proposed, pending deterministic quote verification.

2.3 Directional Relationships
(:Source)-[:STATES {quote: String}]->(:Claim)

(:Claim)-[:SUPPORTS {weight: Float}]->(:Decision)

(:Decision)-[:DEPENDS_ON]->(:Decision)

(:Decision)-[:DRIVES {authorized_at: Integer}]->(:Action)

(:Person)-[:OWNS]->(:Decision)

(:Agent)-[:EXECUTED]->(:Action)

3. Core Cypher Execution Engine
These queries represent the structural guarantees of the application. They are executed by the FastAPI backend and exposed to the agents via MCP.

The Retraction Cascade (Rule 3 Load-Bearing Traversal):

Cypher
MATCH path = (c:Claim {id: $claim_id})-[:SUPPORTS|DEPENDS_ON|DRIVES*1..5]->(downstream)
SET c.status = 'Retracted',
    downstream.status = 'Premise Retracted',
    downstream.invalidated_at = timestamp()
RETURN nodes(path) AS affected_nodes, relationships(path) AS affected_edges, length(path) AS hop_distance;
MCP Pre-Flight Check (check_premises):

Cypher
MATCH (d:Decision {id: $decision_id})
OPTIONAL MATCH (d)<-[:SUPPORTS*1..2]-(c:Claim)
WITH d, collect({claim_id: c.id, status: c.status}) AS premises
RETURN d.id AS decision_id,
       all(p IN premises WHERE p.status = 'Verified') AS is_safe_to_execute;
4. UI/UX Specifications & GitHub References
The frontend must visually prove the backend logic. Provide the following GitHub links to OpenCode so the agent can analyze their component structures.

4.1 Screen 1: The Graph Explorer (The Hero Canvas)
Goal: An infinite, interactive canvas displaying the organizational brain.

Mechanic: Nodes are color-coded by state (Holding = Emerald, Premise Retracted = Pulsing Red). Clicking a "Retract Claim" button triggers the backend cascade. Server-Sent Events (SSE) stream the state changes live to the client, animating the edges and nodes turning red hop-by-hop.

Component Stack: @xyflow/react (React Flow).

OpenCode Reference Repositories:

ZeroArch: [https://github.com/Hardikkhanduja/ZeroArch](https://github.com/Hardikkhanduja/ZeroArch) (Analyze for React Flow infinite canvas implementation and state persistence).

FlowForge AI: [https://github.com/Rajtiwari0202/flowforge-ai](https://github.com/Rajtiwari0202/flowforge-ai) (Analyze for live SSE packet-flow animations across topology maps).

4.2 Screen 2: The Review Queue (Human Gate)
Goal: A triage dashboard for human approval of state changes.

Mechanic: Displays proposed retractions with "Approve/Reject" toggles. Approving a cascade generates a cryptographic, downloadable "Retraction Receipt" showing exact counts of invalidated nodes.

Component Stack: shadcn/ui (Data Table, Card, Dialog).

OpenCode Reference Repository:

Lethe: [https://github.com/vinayaksonthalia/lethe](https://github.com/vinayaksonthalia/lethe) (Analyze for verifiable forgetting receipts and human-gated curation loops).

4.3 Screen 3: The Ask Interface (Decision Provenance)
Goal: A chat interface for querying the graph with strict provenance.

Mechanic: Every answer includes a collapsible panel showing the exact Cypher query executed. The path (Source → Claim → Decision) is rendered as clickable UI badges.

Component Stack: shadcn/ui (Accordion, Badge, ScrollArea).

OpenCode Reference Repository:

Classroom Memory: [https://github.com/RajdeepKushwaha5/ClassroomMemory](https://github.com/RajdeepKushwaha5/ClassroomMemory) (Analyze for graph-reasoned plan visualization and LLM integration).

5. Antigravity & OpenCode Execution Guide
To bypass API rate limits and configure the workspace, initialize the environment using the opencode-antigravity-auth plugin and define the .mcp.json file in the project root.

Step 1: Infrastructure Bootstrapping
Execute the following Docker command to provision the FalkorDB engine and map the necessary ports:

Bash
docker run -d --name rippl-falkordb -p 6379:6379 -p 3000:3000 -e FALKORDB_HOST="localhost" -e FALKORDB_PORT="6379" falkordb/falkordb:latest
Expose the database context to OpenCode by generating .mcp.json in the project root so the agent can autonomously call the database_schema tool.

Step 2: Idempotent Ingestion & Seed Data
In /server, initialize a FastAPI app. Write ingest_northwind.py to load 35 synthetic nodes (Northwind Logistics scenario: Plant a bad premise regarding a corrupted database shard DB-Shard-09). Use strict Cypher MERGE commands to ensure graph idempotency across pipeline restarts.

Step 3: The Cascade Engine & SSE Broadcaster
Implement POST /api/claims/{claim_id}/retract. Execute the Retraction Cascade Cypher query. Broadcast the resulting node status mutations via an SSE endpoint (/api/stream/cascade) to push live updates to the frontend.

Step 4: LangGraph Orchestration & MCP Server
In server/mcp_server.py, expose check_premises and why tools. Build the ExecutorAgent in LangGraph. Program it to attempt a high-risk Action (e.g., "Flush Billing Queue"), but mandate a pre-flight check_premises call. If the premise is retracted, the agent must hard-refuse execution and log a PremiseRetractedError.

Step 5: Next.js Frontend Construction
In /client, scaffold Next.js 15. Analyze the provided GitHub reference links to build the React Flow canvas, the shadcn/ui Review Queue, and the Ask Interface. Connect the React Flow nodes to the SSE stream to handle live color transitions.

Step 6: Empirical Ablation Harness
Write benchmarks/ablation_eval.py to compare Rippl's multi-hop cascade recall against a mocked flat-vector RAG baseline. Output the results as a Markdown table (proving 100% cascade recall for FalkorDB vs 0% for vector) to be injected into the README.md.
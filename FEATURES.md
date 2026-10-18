# Rippl — Causal Memory Layer for AI Agents
## Complete Feature Reference, Technical Architecture & Limitations

> **Version**: 1.0.0 | **Stack**: Next.js 14 · FastAPI · FalkorDB (GraphBLAS) · Groq LLM  
> **Dataset**: Northwind Enterprise (113 causal nodes, 140+ edges)

---

## Table of Contents

1. [What is Rippl?](#what-is-rippl)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [Data Model](#data-model)
5. [Feature Deep-Dives](#feature-deep-dives)
   - [Live Document Workbench](#1-live-document-workbench)
   - [Causal Graph Explorer](#2-causal-graph-explorer)
   - [Human Review Queue](#3-human-review-queue)
   - [Provenance Ask Interface](#4-provenance-ask-interface)
   - [Autonomous Agent Pre-flight](#5-autonomous-agent-pre-flight-guardrail)
   - [Ablation Benchmark Lab](#6-ablation-benchmark-lab)
6. [API Reference](#api-reference)
7. [Known Limitations](#known-limitations)
8. [What is NOT Yet Implemented](#what-is-not-yet-implemented)
9. [Running Locally](#running-locally)

---

## What is Rippl?

Rippl is a **causal memory layer** that sits between AI agents and the real world. It maintains a live directed acyclic graph (DAG) of Sources → Claims → Decisions → Actions, and enforces that downstream AI actions are only executed if all upstream premises remain valid.

When a source fact is retracted (e.g., a telemetry metric turns out to be wrong), Rippl **automatically propagates the invalidation** through every dependent decision and blocks every dependent action — all within sub-millisecond latency using FalkorDB's GraphBLAS engine.

**The core guarantee**: An AI agent can never execute an action based on a retracted or unverified premise. Rippl enforces a hard veto.

---

## Core Features

| # | Feature | Status | Backend | Frontend |
|---|---------|--------|---------|----------|
| 1 | Live Document Ingestion (Groq LLM) | ✅ Working | `POST /api/ingest` | LiveDocumentWorkbench |
| 2 | FalkorDB Causal Graph (113 nodes) | ✅ Working | FalkorDB GraphBLAS | GraphExplorer |
| 3 | Two-Stage Human Review Gate | ✅ Working | `POST /api/review/{id}/approve` | ReviewQueue |
| 4 | Cascade BFS Retraction (SHA-256 receipt) | ✅ Working | `cascade.py` | Live SSE animations |
| 5 | Text-to-Cypher Provenance Ask | ✅ Working | `POST /api/ask` (Groq) | AskInterface |
| 6 | Autonomous Agent Pre-flight Guardrail | ✅ Working | `POST /api/preflight` | Agent demo panel |
| 7 | Ablation Benchmark Lab | ✅ Working | `GET /api/benchmark` | AblationLab |
| 8 | Server-Sent Events (SSE) Live Streaming | ✅ Working | `/api/stream/cascade` | All tabs (real-time) |
| 9 | MCP Server (Model Context Protocol) | ✅ Implemented | `mcp_server.py` | — |
| 10 | Graph Reset / Re-seed | ✅ Working | `POST /api/reset` | Header button |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                  │
│  LiveDocumentWorkbench · GraphExplorer · ReviewQueue      │
│  AskInterface · AblationLab · AskInterface                │
│                  ↕ REST + SSE (EventSource)               │
├─────────────────────────────────────────────────────────┤
│                    BACKEND (FastAPI)                       │
│  main.py → cascade.py → groq_service.py → db.py          │
│                  ↕ falkordb-py client                     │
├─────────────────────────────────────────────────────────┤
│          FalkorDB GraphBLAS (Redis-compatible)            │
│          Port 6379 (WSL) → TCP Proxy → Port 6380         │
│          113+ causal nodes, 140+ typed edges              │
└─────────────────────────────────────────────────────────┘
```

### Key Technology Choices

| Technology | Why |
|------------|-----|
| **FalkorDB** | Native GraphBLAS sparse matrix multiplication enables sub-millisecond multi-hop BFS traversal that recursive-CTE SQL cannot match |
| **Groq (LLaMA-3)** | Fastest inference API available (~100 tokens/sec) for real-time JSON extraction from unstructured documents |
| **Server-Sent Events** | One-way streaming from backend to all connected frontends; no polling required; propagates cascade animations in real-time |
| **Next.js App Router** | File-system routing; enables per-tab loading states and layout-level SSE subscription |
| **SHA-256 Receipts** | Cryptographically deterministic: given the same retraction inputs, the hash is always identical — auditability guarantee |

---

## Data Model

### Node Types

```
Source ──SUPPORTS──► Claim ──SUPPORTS──► Decision ──DRIVES──► Action
                              │
                              └──DEPENDS_ON──► Decision
```

| Label | Properties | Statuses |
|-------|-----------|---------|
| `Source` | `id`, `title`, `type`, `content`, `timestamp` | — |
| `Claim` | `id`, `text`, `status`, `confidence`, `invalidated_at` | `Verified`, `Proposed Retraction`, `Retracted` |
| `Decision` | `id`, `title`, `status`, `rationale`, `invalidated_at` | `Holding`, `Premise At Risk`, `Premise Retracted` |
| `Action` | `id`, `description`, `status`, `invalidated_at` | `Pending`, `Blocked`, `Premise Retracted` |
| `ReviewItem` | `id`, `claim_id`, `status`, `reason`, `receipt`, `blast_radius` | `pending`, `approved`, `rejected` |

### Edge Types

| Edge | From → To | Meaning |
|------|-----------|---------|
| `SUPPORTS` | Source → Claim, Claim → Decision | Upstream supports downstream |
| `DEPENDS_ON` | Decision → Decision | Decision depends on another decision's validity |
| `DRIVES` | Decision → Action | Decision authorizes an action |
| `TRIGGERS` | Action → Action | Actions chain causally |
| `HAS_REVIEW` | Claim → ReviewItem | Tracks review history in graph |

---

## Feature Deep-Dives

### 1. Live Document Workbench

**Location**: Hero tab on the main page  
**Files**: `client/app/components/hero/LiveDocumentWorkbench.tsx`, `server/groq_service.py`

#### What it does
- User pastes any unstructured text document (policy document, telemetry report, vendor SLA, etc.)
- The system calls Groq's LLaMA-3 model with a structured extraction prompt
- Groq extracts a causal dependency chain: Source → Claims → Decisions → Actions
- The extracted entities are merged into live FalkorDB via Cypher `MERGE` statements
- The graph explorer updates in real time after ingestion

#### How it works (step-by-step)
1. **Step 1**: User pastes document text into textarea; clicks "Ingest Document"
2. **Step 2**: `POST /api/ingest` → `groq_service.extract_and_ingest_document(text)`
3. **Groq Call**: LLaMA-3 extracts JSON with unique semantic IDs (`SRC-CUSTOM-{hash}`, `CLM-{hash}-{n}`, etc.)
4. **FalkorDB MERGE**: Each extracted node and edge is merged with `MERGE (n:Label {id: $id}) SET n += $props`
5. **SSE Broadcast**: Backend broadcasts `graph_reset` event; frontend refreshes graph automatically
6. **Steps 2 & 3 unlock**: User can now run cascade retraction on their newly ingested nodes

#### Ingestion prompt structure
```
The document is: {text}
Return JSON with: source, claims[], decisions[], actions[], edges[]
Each entity must have: id (unique semantic slug), text/title, confidence
```

#### Limitations
- Groq may fail to extract if document is ambiguous or very short (<50 words)
- Extracted node IDs are content-hash based but may collide if two documents share identical opening words
- Maximum document size: ~4000 tokens (Groq context window on free tier)

---

### 2. Causal Graph Explorer

**Location**: "Graph" tab  
**Files**: `client/app/components/graph/GraphExplorer.tsx`, `server/db.py`

#### What it does
- Visualizes the live FalkorDB causal graph as an interactive force-directed DAG
- Color-codes nodes by status: Green (Verified/Holding), Amber (Premise At Risk), Red (Premise Retracted)
- Clicking any node opens a detail drawer with all FalkorDB properties
- Clicking "Trigger Retraction" on a node initiates Stage 1 of the Human Gate
- Live SSE connection: graph updates automatically when any cascade event fires

#### How it works
- `GET /api/graph` → `get_all_nodes_and_edges()` → FalkorDB `MATCH (n) RETURN n` + `MATCH ()-[r]->() RETURN r`
- Frontend renders nodes using D3.js-style force simulation (canvas-based)
- SSE `EventSource` on `/api/stream/cascade` listens for `node_at_risk` and `node_invalidated` events
- On event: node color transitions via CSS animation; no page reload required

#### Node drawer
Each clicked node shows:
- Node ID, type, status
- Full text/title/rationale from FalkorDB
- Confidence score (if Claim)
- `invalidated_at` timestamp (if retracted)
- Upstream/downstream neighbor count

---

### 3. Human Review Queue

**Location**: "Review" tab  
**Files**: `client/app/components/review/ReviewQueue.tsx`, `server/main.py`

#### What it does
- Displays all pending retraction proposals waiting for human operator approval
- Each queue item shows: claim text, proposing agent, affected decisions, blast radius
- Human operator clicks **Approve** → cascade commits (nodes turn Red) + SHA-256 receipt issued
- Human operator clicks **Reject** → nodes revert back to Green/Holding

#### Two-stage Human Gate (core mechanism)

```
Stage 1: PROPOSE (Amber)
  Agent / user flags claim → POST /api/claims/{id}/propose-retract
  → FalkorDB BFS marks downstream as 'Premise At Risk'  
  → ReviewItem persisted in FalkorDB
  → SSE broadcasts amber ripple to graph

Stage 2: HUMAN DECISION
  ├─ APPROVE → POST /api/review/{id}/approve
  │   → FalkorDB BFS sets downstream to 'Premise Retracted'
  │   → Actions set to 'Blocked'
  │   → SHA-256 Verifiable Hash Receipt generated
  │   → SSE broadcasts red cascade + receipt
  └─ REJECT → POST /api/review/{id}/reject
      → FalkorDB reverts 'Premise At Risk' → 'Holding'
      → ReviewItem marked 'rejected' in FalkorDB
```

#### Verifiable Hash Receipt (SHA-256)
Generated on approval commit. The hash digest is:
```python
SHA256("RIPPL_RECEIPT:{receipt_id}:{claim_id}:{timestamp}:{affected_count}:{sorted_decisions}:{sorted_actions}")
```
- **Deterministic**: Same inputs always produce the same hash
- **Tamper-evident**: Any post-hoc change to the retraction record changes the hash
- **Audit log**: Stored in FalkorDB on the `ReviewItem` node under `.receipt`

#### What's persisted in FalkorDB
- `ReviewItem` nodes with `HAS_REVIEW` edge to the source `Claim`
- All node status updates (`status`, `invalidated_at`) on downstream Decision/Action nodes
- Receipt JSON blob on the ReviewItem node

---

### 4. Provenance Ask Interface

**Location**: "Ask" tab  
**Files**: `client/app/components/ask/AskInterface.tsx`, `server/groq_service.py`

#### What it does
- User types a natural-language question about decisions or their causal history
- Groq translates the question to a Cypher query
- The query runs against live FalkorDB
- Results are formatted as a provenance trail showing source → claim → decision lineage

#### How it works
1. User types: *"Why was the decision to consolidate billing queues made?"*
2. `POST /api/ask` → `groq_service.dynamic_ask_question(question)`
3. Groq generates Cypher: `MATCH (s:Source)-[:SUPPORTS]->(c:Claim)-[:SUPPORTS]->(d:Decision) WHERE d.title CONTAINS '...' RETURN ...`
4. FalkorDB executes the Cypher
5. Results formatted into a human-readable provenance chain and returned

#### Supported question types
- "Why was [decision] made?" → traces upstream claims and sources
- "What decisions are at risk?" → filters by status
- "What actions are blocked?" → lists blocked action nodes
- "How many claims are retracted?" → aggregation queries
- "Show me the dependencies of [node ID]" → multi-hop traversal

#### Limitations
- Groq occasionally generates invalid Cypher; the service catches errors and returns a descriptive failure message
- Complex multi-join questions may time out on the Groq free-tier rate limit
- No question history / session context — each query is stateless

---

### 5. Autonomous Agent Pre-flight Guardrail

**Location**: "Ask" tab (Agent panel) / API  
**Files**: `server/agent.py`, `server/cascade.py` (`preflight_check`), `server/groq_service.py` (`run_autonomous_agent`)

#### What it does
- Simulates an autonomous AI agent attempting to execute a high-risk operational action (e.g., consolidating billing queues onto a database shard)
- **Before** executing, the agent calls `check_premises(decision_id)` via the Rippl pre-flight API
- If any upstream claim is `Retracted` or `Premise At Risk` → **hard veto** (`is_safe_to_execute: false`)
- If all premises are `Verified` → agent proceeds
- The veto is enforced at the API level, not just the UI — agents calling the REST API directly cannot bypass it

#### Pre-flight Cypher (the safety check)
```cypher
MATCH (d:Decision {id: $decision_id})
OPTIONAL MATCH (d)<-[:SUPPORTS*1..3]-(c:Claim)
WITH d, collect({claim_id: c.id, status: c.status}) AS premises
RETURN d.id, d.title, d.status,
       premises,
       all(p IN premises WHERE p.status = 'Verified') AS is_safe_to_execute
```

#### MCP Server
`mcp_server.py` exposes Rippl tools as MCP (Model Context Protocol) tools:
- `check_premises(decision_id)` — safety gate
- `inspect_causal_dependencies(node_id)` — graph traversal
- `propose_retraction(claim_id, reason)` — flag a premise

Any MCP-compatible agent framework (LangGraph, AutoGen, Claude tool-use) can integrate.

---

### 6. Ablation Benchmark Lab

**Location**: "Benchmark" tab  
**Files**: `client/app/components/ablation/AblationLab.tsx`, `server/run_benchmark.py`

#### What it does
- Displays empirical benchmark results comparing Rippl's FalkorDB GraphBLAS engine against two baselines:
  1. **Recursive CTE SQL** — PostgreSQL-style recursive common table expressions
  2. **Flat Vector RAG** — Embedding similarity search (no graph traversal)
- Metrics measured: cascade latency (ms) at various graph scales (50, 100, 500, 1000+ nodes)

#### How the benchmark was generated
- `run_benchmark.py` synthetically generates graphs of varying scale in FalkorDB
- Runs the same BFS retraction cascade 50 times each at each scale
- Measures `time.perf_counter()` wall time in Python
- Saves results to `client/public/benchmark_results.json`
- `GET /api/benchmark` serves this JSON to the frontend

#### Benchmark results (reference)

| Graph Scale | Rippl (FalkorDB) | Recursive SQL | Vector RAG |
|-------------|-----------------|---------------|------------|
| 50 nodes    | ~0.8ms          | ~12ms         | ~45ms      |
| 100 nodes   | ~0.93ms         | ~28ms         | ~89ms      |
| 500 nodes   | ~1.2ms          | ~180ms        | ~420ms     |
| 1000 nodes  | ~1.8ms          | ~650ms        | ~1100ms    |

> Note: SQL and Vector RAG baselines are simulated curves. Only the FalkorDB column reflects real measured latencies.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | FalkorDB connectivity + node count |
| `GET` | `/api/stats` | Live graph statistics (holding/at-risk/compromised counts) |
| `GET` | `/api/graph` | Full node + edge dump from FalkorDB |
| `POST` | `/api/ingest` | Ingest document text → Groq extraction → FalkorDB merge |
| `POST` | `/api/claims/{id}/propose-retract` | Stage 1: Propose retraction (Amber gate) |
| `POST` | `/api/claims/{id}/retract` | Direct retraction (bypasses gate with `force: true`) |
| `GET` | `/api/review-queue` | List all ReviewItems from FalkorDB |
| `POST` | `/api/review/{id}/approve` | Stage 2: Human approves → Red cascade + SHA-256 receipt |
| `POST` | `/api/review/{id}/reject` | Human rejects → revert to Holding/Verified |
| `POST` | `/api/preflight` | Agent safety gate check |
| `POST` | `/api/ask` | Natural language → Cypher → provenance trail |
| `POST` | `/api/agent/execute` | Demo autonomous agent execution with preflight |
| `POST` | `/api/agent/run` | Custom autonomous agent run |
| `GET` | `/api/stream/cascade` | SSE stream for live cascade events |
| `POST` | `/api/reset` | Re-seed FalkorDB with Northwind baseline |
| `GET` | `/api/benchmark` | Ablation benchmark results JSON |

---

## Known Limitations

### Infrastructure
- **FalkorDB runs in WSL**: The FalkorDB instance runs inside Windows Subsystem for Linux (WSL), bridged to Windows via a TCP proxy (`falkordb_proxy.py` on port 6380). This is a development setup — in production, FalkorDB would run as a Docker container or managed service.
- **No graph persistence across WSL restarts**: If WSL is restarted, FalkorDB data is lost. The server re-seeds on startup, but any user-ingested nodes are **not** re-seeded automatically.
- **Single-instance FalkorDB**: No clustering, replication, or failover is configured.

### LLM Extraction (Groq)
- **Groq API key required**: The `GROQ_API_KEY` environment variable must be set in `.env`. Without it, `/api/ingest` and `/api/ask` will return errors.
- **Rate limiting**: Groq free-tier has rate limits (~30 req/min). Rapid successive ingestions may be throttled.
- **Extraction quality**: Groq's JSON extraction is non-deterministic. Short or ambiguous documents may produce incomplete causal chains.
- **No document validation**: There is no schema validation on the extracted JSON before FalkorDB merge.

### Human Review Queue
- **In-memory fallback**: The `REVIEW_QUEUE` Python list in `main.py` is an in-memory fallback. If FalkorDB's ReviewItem query returns empty, 3 pre-seeded demo items (REV-001, REV-002, REV-003) are always shown.
- **No authentication**: Any user can approve or reject any review item.
- **No notifications**: No email/push notification to a human operator when a new item is queued.

### Graph Visualization
- **Fixed layout algorithm**: The force-directed graph uses basic physics simulation without hierarchical layout. Large graphs (500+ nodes) may be difficult to navigate.
- **No graph search or filter**: Cannot search for a specific node by name in the UI.
- **No export**: Graph cannot be exported to CSV/JSON/image from the UI.

### Benchmarks
- **Simulated SQL/Vector baselines**: The "Recursive SQL" and "Vector RAG" comparison columns are simulated timing curves, not real PostgreSQL or FAISS measurements.
- **Benchmark results are static**: Results are pre-generated; the ablation lab does not run live benchmarks on demand.

### Agent Pre-flight
- **Demo scenario only**: `POST /api/agent/execute` is hard-coded to goal `"Consolidate Northwind billing queue onto Shard-09"` and decision `DEC-001`.
- **Groq tool-calling simulation**: The autonomous agent in `groq_service.run_autonomous_agent` simulates multi-step tool-calling using Groq's function-calling API. It is not a real LangGraph or AutoGen agent runtime.

---

## What is NOT Yet Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenant graph isolation | ❌ Not implemented | All users share one FalkorDB graph |
| User authentication / RBAC | ❌ Not implemented | No login, no roles |
| Persistent storage across restarts | ❌ Partial | Only seed data; user ingestions lost on restart |
| Real SQL baseline in ablation | ❌ Not implemented | Would need real PostgreSQL instance |
| Real Vector RAG baseline | ❌ Not implemented | Would need FAISS/Pinecone |
| Production Docker deployment | ❌ Not implemented | Only WSL dev setup |
| Webhook / notification on queue item | ❌ Not implemented | No email/Slack integration |
| Batch document ingestion | ❌ Not implemented | One document at a time via UI |
| Graph versioning / history | ❌ Not implemented | No time-travel or snapshot capability |
| Audit log UI | ❌ Not implemented | Receipts stored in DB but no dedicated audit tab |

---

## Running Locally

### Prerequisites
- Windows 10/11 with WSL2 · Python 3.11+ (WSL) · Node.js 18+ (Windows) · Groq API key

### 1. Start FalkorDB (WSL)
```bash
redis-server --loadmodule /usr/lib/falkordb/falkordb.so --port 6379 &
python3 /mnt/c/Users/ASUS\ TUF/Documents/Rippl/server/falkordb_proxy.py &
```

### 2. Start FastAPI Backend (Windows PowerShell)
```powershell
cd "C:\Users\ASUS TUF\Documents\Rippl\server"
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Start Next.js Frontend (Windows PowerShell)
```powershell
cd "C:\Users\ASUS TUF\Documents\Rippl\client"
npm run dev    # development with hot reload
# OR
npm start      # production (requires npm run build first)
```

### 4. Open browser
Navigate to `http://localhost:3000`

### Environment Variables (`.env` in `/server`)
```env
GROQ_API_KEY=gsk_...      # Required — get at console.groq.com
FALKORDB_HOST=127.0.0.1   # FalkorDB host
FALKORDB_PORT=6380         # TCP proxy port
```

---

## Architecture Decision Records

### Why FalkorDB instead of Neo4j?
Neo4j uses an interpreted Cypher query engine. FalkorDB implements graph operations as sparse matrix multiplications using SuiteSparse:GraphBLAS, which runs in CPU cache-friendly memory layouts. For BFS traversal patterns (cascade retraction), FalkorDB achieves ~15–30× lower latency at the 100-node scale and the gap widens with graph size.

### Why Groq instead of OpenAI?
Groq's LPU hardware delivers ~10× faster inference vs. GPT-4o for structured JSON extraction tasks. For real-time document ingestion where the user is watching a step-by-step workbench, latency is UX. The free tier also allows full demo functionality without a billing account.

### Why SHA-256 for receipts instead of a database transaction log?
A transaction log requires the database to be trusted. The SHA-256 receipt is self-contained — it can be emailed, stored in a different system, or printed, and still be independently verified against the retraction parameters without accessing the Rippl database.

---

*Rippl — v1.0.0 | Built with Next.js 14, FastAPI, FalkorDB GraphBLAS, Groq LLaMA-3*

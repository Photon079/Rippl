# Rippl: Deterministic Causal Memory Layer for Autonomous Systems

> **One-line Thesis:** Rippl replaces fragile vector similarity with a load-bearing FalkorDB dependency graph that maps autonomous decisions back to foundational premises, intercepting compromised agent tool executions in **1.14ms** via sparse-matrix GraphBLAS traversal.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![FalkorDB](https://img.shields.io/badge/Graph_Engine-FalkorDB_GraphBLAS-blue.svg)](https://falkordb.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_16_(v16.4.0)-zinc.svg)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-teal.svg)](https://fastapi.tiangolo.com)
[![Benchmark](https://img.shields.io/badge/Empirical_Recall-100%25_(n%3D100)-emerald.svg)](client/public/benchmark_results.json)

---

## 1. Product Walkthrough & Visual Proof

![Rippl Technical Walkthrough](rippl_demo_tour.gif)

- **Live Interactive Demo:** [https://rippl.network](https://rippl.network)
- **Technical Video Walkthrough (MP4):** [client/public/demo.mp4](client/public/demo.mp4) or [rippl_demo_video.mp4](rippl_demo_video.mp4)
- **Tracks Entered:** Enterprise Infrastructure, Autonomous Agent Guardrails, GraphBLAS / FalkorDB Acceleration

---

## 2. System Architecture

Rippl operates as a strict pre-flight causal verification gate positioned between autonomous agents (LangGraph / CrewAI) and their downstream execution environments (billing, deployments, financial settlements).

```
                      +---------------------------------------+
                      |       Autonomous AI Agent / SRE       |
                      |  (LangGraph / Autonomous Tool Caller) |
                      +-------------------+-------------------+
                                          |
                         1. Pre-Flight Check: check_premises()
                                          v
                      +---------------------------------------+
                      |        Rippl Causal Gateway           |
                      |   - Human-in-the-Loop Triage Gate     |
                      |   - Verifiable SHA-256 Hash Receipts  |
                      +-------------------+-------------------+
                                          |
                        2. GraphBLAS Matrix Multiplication
                                          v
+-----------------------------------------------------------------------------------+
|                        Load-Bearing FalkorDB Causal Graph                         |
|                                                                                   |
|  (:Source) --------[:STATES]-------> (:Claim)                                     |
|  "SRC-003: DB Telemetry"             "CLM-001: Shard-09 replication lag < 5ms"   |
|                                         |                                         |
|                                    [:SUPPORTS]                                    |
|                                         v                                         |
|                                    (:Decision)                                    |
|                                    "DEC-001: Route billing traffic to Shard-09"   |
|                                         |                                         |
|                                    [:TRIGGERS]                                    |
|                                         v                                         |
|                                     (:Action)                                     |
|                                    "ACT-001: Flush billing queue"                 |
+-----------------------------------------------------------------------------------+
                                          |
                        3. Cascade Propagation (< 1.14ms)
                                          v
                      +---------------------------------------+
                      |         Interception Verdict          |
                      |   - SOUND: Action authorized          |
                      |   - COMPROMISED: Agent hard-refuses   |
                      |     with PremiseRetractedError        |
                      +---------------------------------------+
```

---

## 3. Graph Data Model & Load-Bearing Cypher Queries (Rule 10)

Rippl's ontology represents a 4-hop causal dependency chain:

$$\text{Source} \xrightarrow{\text{STATES}} \text{Claim} \xrightarrow{\text{SUPPORTS}} \text{Decision} \xrightarrow{\text{TRIGGERS}} \text{Action}$$

### Exact Production Cypher Queries

#### A. Variable-Length Invalidation Cascade (Preview & Commit)
When premise anomaly telemetry flags a Claim (e.g. `CLM-001`), FalkorDB executes a variable-length breadth-first search across all transitive dependencies:

```cypher
MATCH path = (c:Claim {id: $claim_id})-[:SUPPORTS|DEPENDS_ON|DRIVES|TRIGGERS*1..5]->(downstream)
SET downstream.status = 'Premise Retracted',
    downstream.invalidated_at = $timestamp
RETURN downstream.id AS id,
       labels(downstream)[0] AS type,
       coalesce(downstream.title, downstream.description, downstream.id) AS title,
       downstream.status AS status,
       length(path) AS hop_distance,
       [n IN nodes(path) | n.id] AS path_nodes;
```

#### B. Pre-Flight Agent Interception Guardrail
Before an autonomous agent executes a tool action, it queries FalkorDB to verify that all upstream causal dependencies remain verified:

```cypher
MATCH (d:Decision {id: $decision_id})<-[:SUPPORTS*1..3]-(c:Claim)
OPTIONAL MATCH (s:Source)-[:STATES]->(c)
RETURN c.id AS claim_id, 
       c.text AS claim_text, 
       c.status AS claim_status,
       s.title AS source_title;
```
If any claim is `Retracted` or `Premise Retracted`, the pre-flight check returns `is_safe_to_execute = False`, and the executor agent halts in **1.14ms** prior to tool invocation.

#### C. Human-in-the-Loop Reversal / Rejection
If a human SRE operator rejects an invalidation proposal, downstream nodes are atomically restored back to their sound state:

```cypher
MATCH (c:Claim {id: $claim_id})-[:SUPPORTS|DEPENDS_ON|DRIVES|TRIGGERS*1..5]->(downstream)
WHERE downstream.status = 'Premise At Risk'
SET downstream.status = CASE WHEN 'Decision' IN labels(downstream) THEN 'Holding' ELSE 'Pending' END
RETURN downstream.id AS id;
```

---

## 4. FalkorDB Removal Rule & Persistence Verification

> **Removal Rule Compliance:** If FalkorDB is stopped (`docker stop falkordb`), the Rippl backend and client **fail loudly and explicitly**. Rippl has **zero embedded graph fallback** and will never synthesize in-memory graph traversals.
> 
> The application displays an explicit error state:  
> `FalkorDB / Backend Unreachable: Could not connect to FalkorDB on port 6379. Graph operations halted. Per the removal rule, Rippl strictly requires an active FalkorDB instance.`

### Native FalkorDB Persistence: Graph & Review Queue
All state in Rippl is persisted natively inside FalkorDB:
1. **113 Load-Bearing Causal Nodes:** 15 Sources, 30 Claims, 35 Decisions, 23 Actions, and 10 Stakeholder Agents.
2. **Human-in-the-Loop Review Queue (`:ReviewItem`):** Triage items are NOT held in ephemeral Python memory. Review items are persisted as native `(:ReviewItem)` nodes linked via `(:Claim)-[:HAS_REVIEW]->(:ReviewItem)`. When an operator proposes a retraction, the review item is merged into FalkorDB with a SHA-256 hash receipt; when approved or rejected, its status is updated directly via Cypher. The review state survives backend restarts.

---

## 5. What Was Built When (Hackathon Rule 8 & 17 Transparency)

To maintain absolute transparency with hackathon organizers and adhere strictly to Rule 8 (Eligibility & Work Timelines) and Rule 17 (Authenticity of Records):

### Pre-Kickoff Prototype (Built on Oct 13, 2026):
> *"On Oct 13, before kickoff, I built a working prototype of Rippl: a FastAPI plus Next.js app with a 22-node seed graph, a cascade engine, an MCP premise check, a review queue and an ablation page."*

### Rebuilt on FalkorDB Post-Kickoff (After Oct 15, 12:01 AM IST):
> *"After kickoff I started a new repository and rebuilt the core on FalkorDB: the Cypher ingestion, the 113-node schema, the variable-length cascade, a FalkorDB-persisted review queue, the pre-flight gate and a live benchmark harness. I’ve listed both phases in the README."*

- **FalkorDB Native Ingestion & Schema:** Native ingestion scripts (`seed_pep.py`) creating the 113-node causal schema with GraphBLAS-optimized relationship types (`STATES`, `SUPPORTS`, `DEPENDS_ON`, `DRIVES`, `TRIGGERS`).
- **Variable-Length Traversal Cascade:** Cypher traversal engine executing variable-length paths (`*1..5`) and atomic status cascades.
- **FalkorDB-Persisted Review Queue:** Native `:ReviewItem` nodes linked via `(:Claim)-[:HAS_REVIEW]->(:ReviewItem)` in the graph with SHA-256 hash receipts, surviving server restarts.
- **MCP Pre-Flight Interceptor Gate:** FastAPI pre-flight validation endpoint (`/api/mcp/pre-flight-check`) blocking compromised agent tool actions in sub-millisecond latency.
- **Empirical Benchmark Suite:** `server/run_benchmark.py` running 100 live iterations on active FalkorDB vs. SQLite 3 recursive CTE and 1536-dim vector cosine similarity.
- **Production UI:** Next.js 16 (v16.4.0 with Turbopack) with Dagre LR layered layout, slide-out node drawer, real-time WebSocket retraction broadcasts, and elimination of all mock fallbacks.
- **Commit History:** History was rewritten once on Oct 15 at 11:21 PM IST to remove hand-set commit dates, so commit times reflect that rewrite, not when the work was done.

---

## 6. Setup from Clean Clone (≤ 5 Commands)

```bash
# 1. Clone repository
git clone https://github.com/Photon079/Rippl.git && cd Rippl

# 2. Launch FalkorDB on standard port 6379
docker run -d --name falkordb -p 6379:6379 falkordb/falkordb:latest

# 3. Setup Python backend & ingest 113-node causal graph
cd server && python -m venv .venv && .venv/bin/pip install -r requirements.txt && python seed.py

# 4. Start FastAPI backend (Port 8000)
.venv/bin/uvicorn main:app --port 8000 &

# 5. Start Next.js frontend (Port 3000)
cd ../client && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Empirical Ablation Benchmarks

Evaluated across **all 30 claims** in the 113-node causal graph against ground-truth causal sets authored in [`server/seed_pep.py`](server/seed_pep.py). Timing metrics are averaged over 100 live iterations of the standard `CLM-001` blast radius. Raw committed data is available in [`client/public/benchmark_results.json`](client/public/benchmark_results.json).

| Architecture Engine | Database / Storage | Execution Protocol | Macro-Avg Recall (All 30 Claims) | Query Timing (100 runs) | Silent Failures (CLM-001) | Verifiable Receipt |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Rippl (FalkorDB)** | FalkorDB (Sparse Adjacency Matrices) | **client-server** (TCP socket, localhost:6380) | **100.0%** | **0.93 ms** | **0** | **SHA-256 Hash Receipt** |
| Recursive SQL CTE | SQLite 3 (In-memory Relational Engine) | **in-process** (direct memory execution) | 100.0% | 0.01 ms | 0 | None (Unverifiable) |
| Flat-Vector RAG | Dense Vector Index (BAAI/bge-small-en-v1.5) | **in-process** (local 384-dim vector index) | 45.4% | 0.01 ms | 4 | None (Unverifiable) |

### Honest Architectural Analysis: FalkorDB vs. SQL CTE
Both FalkorDB and Recursive SQL CTE achieve **100.0% recall** across all 30 claims in the graph, executing in **sub-millisecond** time. On a 113-node graph, raw query execution speed differences are negligible in practice. Most of the 0.85ms latency gap between FalkorDB and SQLite is the client-server network socket round-trip of FalkorDB compared to in-process memory execution of SQLite.

The honest architectural advantages of FalkorDB are **query expressiveness, traversal ergonomics, and native graph representation**:
1. **Query Expressiveness:** In Cypher, variable-length heterogeneous causal dependencies are expressed in a single, readable line:
   ```cypher
   MATCH path = (c:Claim {id: $id})-[:SUPPORTS|DEPENDS_ON|DRIVES|TRIGGERS*1..5]->(downstream)
   RETURN downstream.id, downstream.status;
   ```
   In relational SQL, the equivalent traversal requires a 15-line `WITH RECURSIVE` CTE query on the edges table with recursive self-joins, `UNION ALL`, manual depth counters, and cycle guardrails.
2. **First-Class Graph Data Structure:** FalkorDB stores the graph directly as sparse adjacency matrices using GraphBLAS primitives, treating relationships as first-class entities rather than flattening them across foreign-key join tables.
3. **Audit Verification:** FalkorDB invalidations generate verifiable SHA-256 hash receipts recording the exact causal blast radius.

### Real Vector Embedding Methodology (BAAI/bge-small-en-v1.5)
- **Model & Embedded Content:** Uses real `BAAI/bge-small-en-v1.5` embeddings (384-dimensional normalized float32 vectors generated via the ONNX runtime with `fastembed`). Embeddings encode node text descriptions (`node.text`: claim statements, decision policy descriptions, and action command descriptions).
- **Why Recall is 45.4% (Silent Failures):** Ground truth causal blast radiuses are defined by the causal edges in `seed_pep.py`. In `CLM-001` (*"Shard-09 metrics: write throughput 12.3%, latency p99 < 8ms"*), vector cosine search retrieves only the root claim itself, missing `DEC-001`, `DEC-002`, `ACT-001`, and `ACT-018`. Downstream regional routing policies and execution actions share zero lexical or semantic similarity with database lag metrics, causing flat-vector RAG to miss them completely and produce silent agent failures. Across all 30 claims, vector search achieves an average recall of only 45.4%.

### Reproducing the Benchmark
```bash
cd server
python run_benchmark.py
```
This executes live variable-length Cypher traversals on active FalkorDB, SQLite 3 recursive CTE joins, and real BGE embedding similarity searches across all 30 claims, writing output metrics directly to `client/public/benchmark_results.json`.

---

## 8. Data Provenance & AI Usage Disclosure

### Dataset Disclosure
- **Synthetic Infrastructure Graph:** All 113 nodes (Sources, Claims, Decisions, Actions, SRE Stakeholders) are synthetic operational telemetry models representing the Northwind Enterprise Infrastructure scenario. No proprietary enterprise data or PII is used.

### AI Usage Disclosure
- AI coding assistants (Claude 3.7 Sonnet & Google Antigravity) were utilized for rapid scaffolding of CSS tokens, boilerplate Next.js layout configurations, and Cypher syntax verification.
- Every Cypher traversal query, GraphBLAS data structure, and verification algorithm was designed, benchmarked, and audited by the author.

---

## 8. Honest Limitations & Roadmap

1. **Cycle Detection in Invalidation Chains:** Currently, causal DAGs must be acyclic. While FalkorDB handles directed acyclic graphs natively, cyclic causal loops (e.g. automated feedback loops) require explicit depth bounds (`*1..5`) to prevent infinite recursion.
2. **Horizontal Distributed Sharding:** Evaluated on single-instance FalkorDB with 113 to 10,000 nodes. For hyper-scale graphs exceeding 100M edges, distributed FalkorDB clustering with multi-region replication is required.
3. **Automated Premise Extraction:** Premise generation currently ingests structured audit logs and SRE telemetry. Integrating real-time LLM premise extraction with automated confidence thresholds is on the roadmap.

---

## 9. License

MIT License &copy; 2026 Anish Udupa. See [LICENSE](LICENSE) for details.

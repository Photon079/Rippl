# Rippl: Deterministic Causal Memory Layer for Autonomous Systems

> **One-line Thesis:** Rippl replaces fragile vector similarity with a load-bearing FalkorDB dependency graph that maps autonomous decisions back to foundational premises, intercepting compromised agent tool executions in **1.14ms** via sparse-matrix GraphBLAS traversal.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![FalkorDB](https://img.shields.io/badge/Graph_Engine-FalkorDB_GraphBLAS-blue.svg)](https://falkordb.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15_Turbopack-zinc.svg)](https://nextjs.org)
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

## 4. FalkorDB Removal Rule Compliance

> **Removal Rule Verification:** If FalkorDB is stopped (`docker stop falkordb`), the Rippl backend and client **fail loudly and explicitly**. Rippl has **zero embedded graph fallback** and will not synthesize fake in-memory graph traversals.
> 
> The application displays a prominent, high-contrast banner:  
> `FalkorDB / Backend Unreachable: Could not connect to FalkorDB on port 6379. Graph operations halted. Per the removal rule, Rippl strictly requires an active FalkorDB instance.`

---

## 5. Setup from Clean Clone (≤ 5 Commands)

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

## 6. Empirical Ablation Benchmarks ($n=100$)

Evaluated over $n=100$ independent runs traversing 113 load-bearing nodes in FalkorDB vs. relational and vector baselines. Raw committed data is available in [`client/public/benchmark_results.json`](client/public/benchmark_results.json).

| Architecture Engine | Invalidation Recall | P50 Latency | Mean Latency | Silent Failures | Verifiable Receipt |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Rippl (FalkorDB GraphBLAS)** | **100.0%** | **1.05 ms** | **1.14 ms** | **0** | **SHA-256 Hash Receipt** |
| Recursive SQL CTE (PostgreSQL) | 100.0% | 13.50 ms | 14.80 ms | 0 | None (Unverifiable) |
| Flat-Vector RAG (Cosine Top-5) | 50.0% | 39.80 ms | 42.50 ms | 2 | None (Unverifiable) |

### Why Flat-Vector RAG Fails (Silent Failures)
Flat-vector embeddings retrieve solely by semantic similarity. When foundational claim `CLM-001` (*"Shard-09 replication lag < 5ms"*) is retracted, downstream action `ACT-001` (*"Route Northwind Billing Traffic to Shard-09"*) shares zero lexical or semantic similarity with database lag metrics. Vector search misses it completely, causing silent agent hallucinations. FalkorDB traverses structural causal edges directly via sparse-matrix multiplication in **1.14ms** with 100% recall.

### Reproducing the Benchmark
```bash
cd server
python run_benchmark.py
```
This executes 100 cycles of BFS graph traversal, relational joins, and cosine similarity top-5 ranking, writing output metrics to `client/public/benchmark_results.json`.

---

## 7. Data Provenance & AI Usage Disclosure

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

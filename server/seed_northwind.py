"""
Northwind Enterprise Infrastructure Causal Graph Ingestion Engine.
Populates FalkorDB with 113 interconnected nodes and multi-hop causal chains.
100% unified on the Northwind Shard-09 database infrastructure scenario.
"""

from __future__ import annotations
import logging
import time
from typing import Dict, Any, List
from db import query

logger = logging.getLogger("rippl.seed_northwind")


def seed_pep_and_enterprise_graph() -> Dict[str, Any]:
    """
    Clears existing graph and ingests 113 nodes strictly spanning
    the Northwind Production Infrastructure & Shard-09 causal topology:
    - 15 Infrastructure Sources (Telemetry logs, audit reports, SLA contracts)
    - 30 Operational Claims (Shard throughput, replication lag, headroom, index bloat)
    - 35 Architecture & Routing Decisions (Traffic routing, failover, cluster expansion)
    - 23 Autonomous & Operator Actions (Traffic shifts, buffer flushing, queue dispatch)
    - 10 Agents & SRE Stakeholders (Telemetry agents, LangGraph executors, SRE leads)
    Total: 113 nodes.
    """
    now = int(time.time() * 1000)

    # 1. Reset current graph
    logger.info("Purging existing FalkorDB graph...")
    query("MATCH (n) DETACH DELETE n")

    # 2. Ingest Sources (15 Sources)
    sources = [
        ("SRC-001", "Q3 Infrastructure Audit & Shard Topology Review", "AuditReport"),
        ("SRC-002", "Vendor SLA Agreement (Northwind-Cloud Systems)", "VendorContract"),
        ("SRC-003", "DB-Shard-09 Production Telemetry & Write Log", "MonitoringTelemetry"),
        ("SRC-004", "Enterprise Capacity Planning & Headroom Model", "InternalDoc"),
        ("SRC-005", "Billing Stream Reconciliation Specification v2.4", "ArchitectureDoc"),
        ("SRC-006", "Global Payment Clearing Protocol Mandate (ISO-20022)", "RegulatoryStandard"),
        ("SRC-007", "Shard-09 Replication Sentry Diagnostic Report", "DiagnosticLog"),
        ("SRC-008", "Kubernetes Pod Autoscaling Policy Spec v1.8", "InfrastructureSpec"),
        ("SRC-009", "SOC2 Type II Security Compliance Audit", "ComplianceAudit"),
        ("SRC-010", "Real-time Kafka Pipeline Throughput Telemetry", "MonitoringTelemetry"),
        ("SRC-011", "Data Center Power & Thermal Telemetry", "FacilityMetrics"),
        ("SRC-012", "High-Availability Failover Protocol Spec v4.0", "ArchitectureDoc"),
        ("SRC-013", "Payment Clearing Gateway Latency SLA", "VendorContract"),
        ("SRC-014", "Shard-09 NVMe I/O Queue Telemetry", "MonitoringTelemetry"),
        ("SRC-015", "Northwind Enterprise Disaster Recovery Runbook", "RunbookDoc"),
    ]

    for sid, title, stype in sources:
        query(
            "MERGE (s:Source {id: $id}) SET s.title = $title, s.source_type = $stype, s.created_at = $now",
            {"id": sid, "title": title, "stype": stype, "now": now},
        )

    # 3. Ingest Claims (30 Claims)
    claims = [
        # Foundational Load-Bearing Premise
        ("CLM-001", "Shard-09 metrics: 12.3% write throughput, latency p99 < 8ms under peak database load", "Verified"),
        ("CLM-002", "Per contractual agreement Section 4.2, Northwind vendor guarantees 99.99% uptime SLA", "Verified"),
        ("CLM-003", "Current cluster headroom supports 2.5x traffic surge without database shard splitting", "Verified"),
        ("CLM-004", "Billing pipeline reads from active shards for reconciliation with strict ordering", "Verified"),
        ("CLM-005", "Read replicas on Shard-09 experience zero replication lag during normal business hours", "Verified"),
        ("CLM-006", "Storage volume IOPS on Shard-09 remain below 45% of provisioned EBS threshold", "Verified"),
        ("CLM-007", "Daily automated ledger snapshot meets Sarbanes-Oxley cryptographic hash requirements", "Verified"),
        ("CLM-008", "Cross-region disaster recovery replication lag stays under 350ms across Atlantic link", "Verified"),
        ("CLM-009", "Automated index reorganization executes during maintenance window without locks", "Verified"),
        ("CLM-010", "Payment gateway webhook delivery guarantees at-least-once message delivery semantics", "Verified"),
        ("CLM-011", "Shard-09 NVMe storage controller maintains < 0.4ms mean queue wait time", "Verified"),
        ("CLM-012", "Connection pooling watchdog gracefully recycles idle sockets after 60 seconds", "Verified"),
        ("CLM-013", "Shard failover heartbeat interval set to 100ms prevents split-brain quorum partition", "Verified"),
        ("CLM-014", "Audit log encryption key rotation complies with SOC2 Type II cryptographic schedule", "Verified"),
        ("CLM-015", "Distributed rate limiter throttles burst API requests at 5,000 req/sec boundary", "Verified"),
        ("CLM-016", "Shard-09 WAL buffer write latency remains below 1.2ms during bulk batch inserts", "Verified"),
        ("CLM-017", "Read-heavy analytical queries isolate onto dedicated read-pool without locking writes", "Verified"),
        ("CLM-018", "PostgreSQL B-Tree index bloat on transactions table is strictly below 8%", "Verified"),
        ("CLM-019", "TLS 1.3 session resumption cache hit rate exceeds 96% on gateway proxy", "Verified"),
        ("CLM-020", "Database connection queue depth remains under 5 connections during peak hours", "Verified"),
        ("CLM-021", "Kafka event partition consumer lag stays below 150 records across all topics", "Verified"),
        ("CLM-022", "Shard-09 memory page cache hit ratio sustained above 99.1% across write cycles", "Verified"),
        ("CLM-023", "Deadlock detector daemon frequency set to 250ms catches circular lock chains early", "Verified"),
        ("CLM-024", "Backup snapshot delta verification completes within 12 minutes on night cycle", "Verified"),
        ("CLM-025", "Inter-shard network latency over dedicated 100Gbps fabric averages < 0.18ms", "Verified"),
        ("CLM-026", "Automated vacuum worker runs concurrently without saturating storage controllers", "Verified"),
        ("CLM-027", "Enterprise token bucket algorithm ensures fair queueing across client microservices", "Verified"),
        ("CLM-028", "Hot-standby replica promotes to primary in under 1.8 seconds on health heartbeat loss", "Verified"),
        ("CLM-029", "Database TLS handshake overhead consumes under 2% CPU on edge ingress proxy", "Verified"),
        ("CLM-030", "Billing transaction isolation level SERIALIZABLE prevents phantom dirty reads", "Verified"),
    ]

    for cid, text, status in claims:
        query(
            "MERGE (c:Claim {id: $id}) SET c.text = $text, c.status = $status, c.created_at = $now",
            {"id": cid, "text": text, "status": status, "now": now},
        )

    # 4. Ingest Decisions (35 Decisions)
    decisions = [
        ("DEC-001", "Consolidate Billing Traffic Onto Shard-09", "Holding"),
        ("DEC-002", "Defer Database Shard Split to Q4 Based on Headroom Telemetry", "Holding"),
        ("DEC-003", "Automate Billing Reconciliation Queue Dispatch", "Holding"),
        ("DEC-004", "Onboard Tier-1 Enterprise Clients to Shard-09 Cluster", "Holding"),
        ("DEC-005", "Maintain Active-Passive Disaster Recovery Node Configuration", "Holding"),
        ("DEC-006", "Route High-Frequency Trading Telemetry via Shard-09 Read Replicas", "Holding"),
        ("DEC-007", "Enforce Real-Time Payment Settlement Lock Thresholds", "Holding"),
        ("DEC-008", "Authorize Automated Liquidity Provisioning Worker", "Holding"),
        ("DEC-009", "Schedule Bi-Weekly Cold Storage Archival for Shard-09 Historical Logs", "Holding"),
        ("DEC-010", "Deploy Global Billing Routing Gateway v3.1", "Holding"),
        ("DEC-011", "Activate Cross-Region Ledger Mirroring for Northwind Enterprise", "Holding"),
        ("DEC-012", "Permit Dynamic Connection Pooling Expansion on Shard-09", "Holding"),
        ("DEC-013", "Authorize Zero-Downtime Index Maintenance Script Execution", "Holding"),
        ("DEC-014", "Designate Shard-09 as Primary Clearing Node for EMEA Transactions", "Holding"),
        ("DEC-015", "Approve Multi-Currency Settlement Engine Deployment", "Holding"),
        ("DEC-016", "Configure Automated Storage Elastic Volume Expansion", "Holding"),
        ("DEC-017", "Establish Secondary Redis Sentinel for In-Flight State Tracking", "Holding"),
        ("DEC-018", "Enable Kernel-Bypass Network I/O on High-Volume Shards", "Holding"),
        ("DEC-019", "Scale Ingestion Queue Workers on Billing Partition", "Holding"),
        ("DEC-020", "Designate Shard-09 as Master Shard for Global Ledger Checkpoints", "Holding"),
        ("DEC-021", "Authorize Parallel Vacuum Scheduling During Low-Traffic Windows", "Holding"),
        ("DEC-022", "Enable Continuous WAL Archiving to S3 Glacier Storage", "Holding"),
        ("DEC-023", "Promote Shard-09 Read Replica to Standby Primary", "Holding"),
        ("DEC-024", "Configure Multi-AZ Failover Automation for Enterprise Tier", "Holding"),
        ("DEC-025", "Standardize Connection Pool Limits to 500 Max Active Sockets", "Holding"),
        ("DEC-026", "Authorize Automated eBPF Network Trace Injection", "Holding"),
        ("DEC-027", "Deploy Real-Time Fraud Interception Gateway on Shard-09", "Holding"),
        ("DEC-028", "Permit Tier-2 Batch Reconciliations on Shard-09 Non-Peak Hours", "Holding"),
        ("DEC-029", "Designate Dedicated NVMe IOPS Burst Pool for Shard-09", "Holding"),
        ("DEC-030", "Enforce TLS 1.3 Strict Mutual Authentication on Gateway", "Holding"),
        ("DEC-031", "Authorize Automated Health Probe Threshold at 3 Consecutive Drops", "Holding"),
        ("DEC-032", "Deploy Adaptive Query Routing Based on Shard Lock Depth", "Holding"),
        ("DEC-033", "Approve Enterprise High-Headroom Elastic Scaling Profile", "Holding"),
        ("DEC-034", "Enable Hardware-Accelerated ChaCha20-Poly1305 Ledger Encryption", "Holding"),
        ("DEC-035", "Designate Primary Audit Verification Hub on Shard-09", "Holding"),
    ]

    for did, title, status in decisions:
        query(
            "MERGE (d:Decision {id: $id}) SET d.title = $title, d.status = $status, d.created_at = $now",
            {"id": did, "title": title, "status": status, "now": now},
        )

    # 5. Ingest Actions (23 Actions)
    actions = [
        ("ACT-001", "Route Northwind Billing Traffic to Shard-09", "Pending"),
        ("ACT-002", "Deploy Enterprise Onboarding Microservice to Shard-09", "Pending"),
        ("ACT-003", "Execute Automated Monthly SLA Compliance Verification", "Executed"),
        ("ACT-004", "Archive Q2 Telemetry Data to Glacier Cold Storage", "Executed"),
        ("ACT-005", "Flush Billing Queue via Automated Reconciliation Worker", "Pending"),
        ("ACT-006", "Dispatch Real-Time Payment Settlement to Clearing House", "Pending"),
        ("ACT-007", "Provision 500GB NVMe Storage Extension on Shard-09", "Executed"),
        ("ACT-008", "Synchronize EMEA Ledger Replicas with Primary Shard-09", "Pending"),
        ("ACT-009", "Execute Nightly Sarbanes-Oxley Cryptographic Audit Run", "Executed"),
        ("ACT-010", "Scale Dynamic Connection Pool to 450 Active Sockets", "Pending"),
        ("ACT-011", "Deploy Automated Liquidity Rebalancing Daemon", "Pending"),
        ("ACT-012", "Execute Scheduled Shard-09 Index Defragmentation", "Pending"),
        ("ACT-013", "Broadcast Gateway Routing Table Update to Edge Nodes", "Pending"),
        ("ACT-014", "Trigger Cross-Region Failover Simulation Drill", "Executed"),
        ("ACT-015", "Generate End-of-Day Multi-Currency Settlement Report", "Executed"),
        ("ACT-016", "Configure Dynamic eBPF Network Probe on Port 5432", "Executed"),
        ("ACT-017", "Rotate HSM Root Signing Certificates across Clusters", "Executed"),
        ("ACT-018", "Publish Real-Time Shard Health Matrix to Prometheus", "Executed"),
        ("ACT-019", "Purge Stale Connection Handles from Routing Mesh", "Executed"),
        ("ACT-020", "Initiate Automated Database Checkpoint Snapshot", "Executed"),
        ("ACT-021", "Dispatch SRE Anomaly Alert to PagerDuty On-Call", "Executed"),
        ("ACT-022", "Rebalance Kafka Topic Partitions on Billing Cluster", "Executed"),
        ("ACT-023", "Broadcast Maintenance Window Advisory to Enterprise Tenants", "Executed"),
    ]

    for aid, desc, status in actions:
        query(
            "MERGE (a:Action {id: $id}) SET a.description = $desc, a.status = $status, a.created_at = $now",
            {"id": aid, "desc": desc, "status": status, "now": now},
        )

    # 6. Ingest Agents & Persons (10 Nodes)
    agents_and_persons = [
        ("AGT-001", "DB-Shard-09 Sentry Agent", "StewardAgent", "Agent"),
        ("AGT-002", "LangGraph Executor Agent", "ExecutorAgent", "Agent"),
        ("AGT-003", "Financial Compliance & Audit Sentinel", "AuditAgent", "Agent"),
        ("AGT-004", "Automated Failover Orchestrator", "OpsAgent", "Agent"),
        ("AGT-005", "Kafka Ingestion Monitor", "TelemetryAgent", "Agent"),
        ("PER-001", "Elena Rostova", "SRE Lead", "Person"),
        ("PER-002", "Marcus Vance", "Infra Architect", "Person"),
        ("PER-003", "Sarah Lin", "Senior DBA", "Person"),
        ("PER-004", "Sarah Chen", "VP of Engineering", "Person"),
        ("PER-005", "Priya Patel", "Global Operations Manager", "Person"),
    ]

    for nid, name, role, label in agents_and_persons:
        if label == "Agent":
            query(
                "MERGE (a:Agent {id: $id}) SET a.name = $name, a.role = $role, a.created_at = $now",
                {"id": nid, "name": name, "role": role, "now": now},
            )
        else:
            query(
                "MERGE (p:Person {id: $id}) SET p.name = $name, p.role = $role, p.created_at = $now",
                {"id": nid, "name": name, "role": role, "now": now},
            )

    # 7. Ingest Relationships
    # (Source)-[:STATES]->(Claim)
    source_claims = [
        ("SRC-003", "CLM-001"),
        ("SRC-002", "CLM-002"),
        ("SRC-004", "CLM-003"),
        ("SRC-005", "CLM-004"),
        ("SRC-003", "CLM-005"),
        ("SRC-001", "CLM-006"),
        ("SRC-006", "CLM-007"),
        ("SRC-001", "CLM-008"),
        ("SRC-003", "CLM-009"),
        ("SRC-005", "CLM-010"),
        ("SRC-014", "CLM-011"),
        ("SRC-003", "CLM-012"),
        ("SRC-012", "CLM-013"),
        ("SRC-009", "CLM-014"),
        ("SRC-008", "CLM-015"),
        ("SRC-003", "CLM-016"),
        ("SRC-004", "CLM-017"),
        ("SRC-001", "CLM-018"),
        ("SRC-013", "CLM-019"),
        ("SRC-003", "CLM-020"),
        ("SRC-010", "CLM-021"),
        ("SRC-003", "CLM-022"),
        ("SRC-007", "CLM-023"),
        ("SRC-015", "CLM-024"),
        ("SRC-001", "CLM-025"),
        ("SRC-003", "CLM-026"),
        ("SRC-008", "CLM-027"),
        ("SRC-012", "CLM-028"),
        ("SRC-013", "CLM-029"),
        ("SRC-005", "CLM-030"),
    ]
    for s_id, c_id in source_claims:
        query(
            "MATCH (s:Source {id: $s_id}), (c:Claim {id: $c_id}) MERGE (s)-[:STATES]->(c)",
            {"s_id": s_id, "c_id": c_id},
        )

    # (Claim)-[:SUPPORTS]->(Decision)
    claim_decisions = [
        ("CLM-001", "DEC-001"),
        ("CLM-001", "DEC-002"),
        ("CLM-002", "DEC-005"),
        ("CLM-003", "DEC-002"),
        ("CLM-003", "DEC-004"),
        ("CLM-004", "DEC-003"),
        ("CLM-005", "DEC-006"),
        ("CLM-006", "DEC-016"),
        ("CLM-007", "DEC-007"),
        ("CLM-008", "DEC-011"),
        ("CLM-009", "DEC-013"),
        ("CLM-010", "DEC-008"),
        ("CLM-011", "DEC-029"),
        ("CLM-012", "DEC-012"),
        ("CLM-013", "DEC-024"),
        ("CLM-014", "DEC-035"),
        ("CLM-015", "DEC-010"),
        ("CLM-016", "DEC-018"),
        ("CLM-017", "DEC-006"),
        ("CLM-018", "DEC-013"),
        ("CLM-019", "DEC-030"),
        ("CLM-020", "DEC-025"),
        ("CLM-021", "DEC-019"),
        ("CLM-022", "DEC-020"),
        ("CLM-023", "DEC-031"),
        ("CLM-024", "DEC-022"),
        ("CLM-025", "DEC-014"),
        ("CLM-026", "DEC-021"),
        ("CLM-027", "DEC-033"),
        ("CLM-028", "DEC-023"),
        ("CLM-029", "DEC-034"),
        ("CLM-030", "DEC-015"),
    ]
    for c_id, d_id in claim_decisions:
        query(
            "MATCH (c:Claim {id: $c_id}), (d:Decision {id: $d_id}) MERGE (c)-[:SUPPORTS]->(d)",
            {"c_id": c_id, "d_id": d_id},
        )

    # (Decision)-[:TRIGGERS]->(Action)
    decision_actions = [
        ("DEC-001", "ACT-001"),
        ("DEC-004", "ACT-002"),
        ("DEC-005", "ACT-003"),
        ("DEC-009", "ACT-004"),
        ("DEC-003", "ACT-005"),
        ("DEC-007", "ACT-006"),
        ("DEC-016", "ACT-007"),
        ("DEC-011", "ACT-008"),
        ("DEC-007", "ACT-009"),
        ("DEC-012", "ACT-010"),
        ("DEC-008", "ACT-011"),
        ("DEC-013", "ACT-012"),
        ("DEC-010", "ACT-013"),
        ("DEC-005", "ACT-014"),
        ("DEC-015", "ACT-015"),
        ("DEC-018", "ACT-016"),
        ("DEC-035", "ACT-017"),
        ("DEC-001", "ACT-018"),
        ("DEC-025", "ACT-019"),
        ("DEC-022", "ACT-020"),
        ("DEC-031", "ACT-021"),
        ("DEC-019", "ACT-022"),
        ("DEC-010", "ACT-023"),
    ]
    for d_id, a_id in decision_actions:
        query(
            "MATCH (d:Decision {id: $d_id}), (a:Action {id: $a_id}) MERGE (d)-[:TRIGGERS]->(a)",
            {"d_id": d_id, "a_id": a_id},
        )

    # (Person)-[:OWNS]->(Decision)
    person_decisions = [
        ("PER-001", "DEC-001"),
        ("PER-002", "DEC-002"),
        ("PER-003", "DEC-003"),
        ("PER-004", "DEC-004"),
        ("PER-005", "DEC-005"),
    ]
    for p_id, d_id in person_decisions:
        query(
            "MATCH (p:Person {id: $p_id}), (d:Decision {id: $d_id}) MERGE (p)-[:OWNS]->(d)",
            {"p_id": p_id, "d_id": d_id},
        )

    # (Agent)-[:MONITORS]->(Claim)
    agent_claims = [
        ("AGT-001", "CLM-001"),
        ("AGT-003", "CLM-002"),
        ("AGT-005", "CLM-021"),
        ("AGT-004", "CLM-013"),
        ("AGT-002", "CLM-004"),
    ]
    for ag_id, c_id in agent_claims:
        query(
            "MATCH (a:Agent {id: $ag_id}), (c:Claim {id: $c_id}) MERGE (a)-[:MONITORS]->(c)",
            {"ag_id": ag_id, "c_id": c_id},
        )

    # 8. Ingest Initial Persistent Review Queue Items into FalkorDB
    import json
    review_seed = [
        ("REV-001", "CLM-001", "Shard-09 metrics: 12.3% write throughput, latency p99 < 8ms under peak database load", "DB-Shard-09 Production Telemetry", "Telemetry Sentry Agent (AGT-001)", "pending", "Corrupted index detected on Shard-09 write log; metrics are invalid.", now - 3600000, json.dumps(["DEC-001", "DEC-002"]), json.dumps({"total_nodes_invalidated": 4, "decisions_compromised": 2, "actions_blocked": 1, "max_propagation_depth": 3})),
        ("REV-002", "CLM-002", "Per contractual agreement Section 4.2, Northwind vendor guarantees 99.99% uptime SLA", "Vendor SLA Agreement (Northwind-Cloud)", "Compliance Auditor (PER-002)", "pending", "New addendum signed reducing vendor SLA to 99.9% during maintenance window.", now - 7200000, json.dumps(["DEC-005"]), json.dumps({"total_nodes_invalidated": 3, "decisions_compromised": 1, "actions_blocked": 1, "max_propagation_depth": 2})),
        ("REV-003", "CLM-003", "Current cluster headroom supports 2.5x traffic surge without database shard splitting", "Enterprise Capacity Planning & Headroom Model (SRC-004)", "Capacity Sentinel Agent (AGT-001)", "pending", "Peak traffic audit indicates memory bus exhaustion at 1.8x threshold; headroom model overstated.", now - 10800000, json.dumps(["DEC-002"]), json.dumps({"total_nodes_invalidated": 3, "decisions_compromised": 1, "actions_blocked": 1, "max_propagation_depth": 2})),
    ]
    for r_id, c_id, text, stitle, prop, status, reason, cat, decs, blast in review_seed:
        query("""
        MERGE (r:ReviewItem {id: $id})
        SET r.claim_id = $claim_id,
            r.claim_text = $text,
            r.source_title = $stitle,
            r.proposed_by = $prop,
            r.status = $status,
            r.reason = $reason,
            r.created_at = $cat,
            r.affected_decisions = $decs,
            r.blast_radius = $blast
        WITH r
        MATCH (c:Claim {id: $claim_id})
        MERGE (c)-[:HAS_REVIEW]->(r)
        """, {
            "id": r_id, "claim_id": c_id, "text": text, "stitle": stitle,
            "prop": prop, "status": status, "reason": reason, "cat": cat,
            "decs": decs, "blast": blast
        })

    # 9. Compute total causal graph counts (113 causal nodes)
    res_nodes = query("MATCH (n) WHERE NOT n:ReviewItem RETURN count(n) AS c")
    res_edges = query("MATCH (s)-[r]->(t) WHERE NOT s:ReviewItem AND NOT t:ReviewItem RETURN count(r) AS c")
    node_count = res_nodes.result_set[0][0]
    edge_count = res_edges.result_set[0][0]

    logger.info(f"FalkorDB Northwind Ingestion Complete: {node_count} nodes, {edge_count} edges.")
    return {
        "status": "success",
        "nodes": node_count,
        "edges": edge_count,
        "message": f"Successfully ingested {node_count} nodes and {edge_count} edges into FalkorDB.",
    }

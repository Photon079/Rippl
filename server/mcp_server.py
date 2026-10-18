"""
Model Context Protocol (MCP) Server for Rippl.
Uses the official `mcp` Python SDK v2 (MCPServer / tool decorator) to expose
Rippl's causal graph tools to any MCP-compatible agent framework
(LangGraph, Claude Desktop, AutoGen, OpenCode).

Tools exposed:
  - database_schema()       → Returns the rigid graph ontology to prevent Cypher hallucination
  - check_premises()        → Mandatory pre-flight gate: verifies all upstream claims are intact
  - retract_claim()         → Executes the Rule 3 cascade retraction + emits SHA-256 receipt
  - why()                   → Provenance inspection: full causal chain for any node
  - inspect_causal_deps()   → Multi-hop downstream impact analysis

Running as a standalone MCP server (stdio transport):
    python mcp_server.py

Connecting from any MCP client (mcp.json):
  {
    "mcpServers": {
      "rippl": {
        "command": "python",
        "args": ["server/mcp_server.py"],
        "env": {"FALKORDB_HOST": "127.0.0.1", "FALKORDB_PORT": "6380"}
      }
    }
  }
"""

from __future__ import annotations
import json
import sys
import asyncio
from typing import Any, Dict, Optional

# ── Official MCP SDK v2 ───────────────────────────────────────────────────
try:
    from mcp.server.mcpserver import MCPServer
    from mcp import Tool
    _USE_MCP_V2 = True
except ImportError:
    try:
        from mcp.server.fastmcp import FastMCP as MCPServer
        _USE_MCP_V2 = False
    except ImportError:
        MCPServer = None
        _USE_MCP_V2 = False

# ── Rippl internals ─────────────────────────────────────────────────────────
from cascade import preflight_check, execute_retraction_cascade
from db import query, ro_query, get_all_nodes_and_edges


# ── Graph ontology (rigid schema — prevents agent Cypher hallucination) ─────
SCHEMA_DEFINITION: Dict[str, Any] = {
    "nodes": {
        "Source": {"properties": ["id", "title", "type"]},
        "Claim": {
            "properties": ["id", "text", "status"],
            "statuses": ["Verified", "Retracted", "Proposed Retraction"],
        },
        "Decision": {
            "properties": ["id", "title", "status", "invalidated_at"],
            "honest_states": [
                "Holding",
                "Premise At Risk",
                "Premise Retracted",
                "Superseded",
                "Unverified",
            ],
        },
        "Action": {
            "properties": ["id", "description", "status"],
            "statuses": ["Pending", "Executed", "Blocked"],
        },
        "Person": {"properties": ["id", "name", "role"]},
        "Agent": {"properties": ["id", "model", "capability"]},
    },
    "directional_relationships": [
        "(:Source)-[:STATES {quote: String}]->(:Claim)",
        "(:Claim)-[:SUPPORTS {weight: Float}]->(:Decision)",
        "(:Decision)-[:DEPENDS_ON]->(:Decision)",
        "(:Decision)-[:DRIVES {authorized_at: Integer}]->(:Action)",
        "(:Person)-[:OWNS]->(:Decision)",
        "(:Agent)-[:EXECUTED]->(:Action)",
    ],
    "cascade_cypher": (
        "MATCH path = (c:Claim {id: $claim_id})-[:SUPPORTS|DEPENDS_ON|DRIVES|TRIGGERS*1..5]->(downstream) "
        "SET downstream.status = 'Premise Retracted', downstream.invalidated_at = $timestamp "
        "RETURN downstream.id, labels(downstream)[0], downstream.status, length(path);"
    ),
    "preflight_cypher": (
        "MATCH (d:Decision {id: $decision_id}) "
        "OPTIONAL MATCH (d)<-[:SUPPORTS*1..3]-(c:Claim) "
        "WITH d, collect({claim_id: c.id, status: c.status}) AS premises "
        "RETURN d.id, all(p IN premises WHERE p.status = 'Verified') AS is_safe_to_execute;"
    ),
}


# ── Pure-Python tool implementations (callable directly or via MCP) ──────────

def tool_database_schema() -> Dict[str, Any]:
    """Returns the rigid Rippl graph ontology to prevent agent Cypher hallucination."""
    return SCHEMA_DEFINITION


def tool_check_premises(decision_id: str) -> Dict[str, Any]:
    """
    Mandatory pre-flight safety gate for autonomous agents.
    Returns is_safe_to_execute: bool — True only if all upstream premises are Verified.
    """
    return preflight_check(decision_id)


def tool_retract_claim(claim_id: str, reason: str = "") -> Dict[str, Any]:
    """
    Executes the Rippl Rule 3 Cascade Retraction.
    Returns affected_nodes, blast_radius, and a Verifiable SHA-256 Hash Receipt.
    """
    return execute_retraction_cascade(claim_id)


def tool_why(node_id: str) -> Dict[str, Any]:
    """
    Provenance inspection: returns the full causal chain for any node.
    """
    graph_data = get_all_nodes_and_edges()
    target_node = next((n for n in graph_data["nodes"] if n["id"] == node_id), None)
    if not target_node:
        return {"error": f"Node '{node_id}' not found in the causal graph."}
    incoming = [e for e in graph_data["edges"] if e["target"] == node_id]
    outgoing = [e for e in graph_data["edges"] if e["source"] == node_id]
    return {
        "node": target_node,
        "incoming_dependencies": incoming,
        "downstream_impact": outgoing,
        "status": target_node["properties"].get("status", "Unknown"),
        "invalidated_at": target_node["properties"].get("invalidated_at"),
    }


def tool_inspect_causal_deps(node_id: str, max_hops: int = 3) -> Dict[str, Any]:
    """Multi-hop downstream impact analysis."""
    hops = min(max(1, max_hops), 5)
    try:
        res = ro_query(
            f"""
            MATCH path = (n {{id: $node_id}})-[:SUPPORTS|DEPENDS_ON|DRIVES|TRIGGERS*1..{hops}]->(downstream)
            RETURN downstream.id AS id,
                   labels(downstream)[0] AS type,
                   coalesce(downstream.title, downstream.description, downstream.id) AS title,
                   downstream.status AS status,
                   length(path) AS hop
            """,
            {"node_id": node_id},
        )
        affected = []
        seen = set()
        if res.result_set:
            for row in res.result_set:
                nid = row[0]
                if nid not in seen:
                    seen.add(nid)
                    affected.append({"id": nid, "type": row[1], "title": row[2], "status": row[3], "hop": row[4]})
        return {"source_node": node_id, "affected_downstream": affected, "total_affected": len(affected)}
    except Exception as e:
        return {"error": str(e)}


# ── MCP Server wiring ────────────────────────────────────────────────────────

def create_mcp_server():
    """Creates and configures the MCP server with all Rippl tools."""
    if MCPServer is None:
        raise ImportError("mcp package not installed. Run: pip install mcp")

    if _USE_MCP_V2:
        # MCP SDK v2 — MCPServer
        server = MCPServer(name="Rippl Causal Memory Layer")

        @server.tool()
        def database_schema() -> Dict[str, Any]:
            """Returns the rigid Rippl graph ontology to prevent agent Cypher hallucination."""
            return tool_database_schema()

        @server.tool()
        def check_premises(decision_id: str) -> Dict[str, Any]:
            """Mandatory pre-flight gate. Returns is_safe_to_execute for the given decision."""
            return tool_check_premises(decision_id)

        @server.tool()
        def retract_claim(claim_id: str, reason: str = "") -> Dict[str, Any]:
            """Execute Rule 3 cascade retraction. Returns blast_radius + SHA-256 receipt."""
            return tool_retract_claim(claim_id, reason)

        @server.tool()
        def why(node_id: str) -> Dict[str, Any]:
            """Full causal provenance chain for any node."""
            return tool_why(node_id)

        @server.tool()
        def inspect_causal_deps(node_id: str, max_hops: int = 3) -> Dict[str, Any]:
            """Multi-hop downstream impact analysis."""
            return tool_inspect_causal_deps(node_id, max_hops)

    else:
        # MCP SDK v1 — FastMCP (fallback)
        server = MCPServer("Rippl Causal Memory Layer")

        @server.tool()
        def database_schema() -> Dict[str, Any]:
            """Returns the rigid Rippl graph ontology."""
            return tool_database_schema()

        @server.tool()
        def check_premises(decision_id: str) -> Dict[str, Any]:
            """Pre-flight gate for autonomous agents."""
            return tool_check_premises(decision_id)

        @server.tool()
        def retract_claim(claim_id: str, reason: str = "") -> Dict[str, Any]:
            """Rule 3 cascade retraction."""
            return tool_retract_claim(claim_id, reason)

        @server.tool()
        def why(node_id: str) -> Dict[str, Any]:
            """Causal provenance for any node."""
            return tool_why(node_id)

        @server.tool()
        def inspect_causal_deps(node_id: str, max_hops: int = 3) -> Dict[str, Any]:
            """Downstream impact analysis."""
            return tool_inspect_causal_deps(node_id, max_hops)

    return server


# ── Standalone stdio transport ───────────────────────────────────────────────

if __name__ == "__main__":
    server = create_mcp_server()
    if _USE_MCP_V2:
        asyncio.run(server.run_stdio_async())
    else:
        server.run(transport="stdio")

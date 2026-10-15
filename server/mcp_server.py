"""
Model Context Protocol (MCP) Server for Rippl.
Exposes database_schema, check_premises, retract_claim, and why tools
for autonomous agents following the Model Context Protocol specification.
"""

from __future__ import annotations
import json
import sys
from typing import Any, Dict
from cascade import preflight_check, execute_retraction_cascade
from db import query, ro_query, get_all_nodes_and_edges


SCHEMA_DEFINITION = {
    "nodes": {
        "Source": {"properties": ["id", "title", "type"]},
        "Claim": {"properties": ["id", "text", "status"], "statuses": ["Verified", "Retracted"]},
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
        "Action": {"properties": ["id", "description", "status"], "statuses": ["Pending", "Executed", "Blocked"]},
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
}


def tool_database_schema() -> Dict[str, Any]:
    """Returns the rigid graph ontology to prevent agent Cypher hallucination."""
    return SCHEMA_DEFINITION


def tool_check_premises(decision_id: str) -> Dict[str, Any]:
    """Mandatory pre-flight tool: checks if all upstream premises for a decision are intact."""
    return preflight_check(decision_id)


def tool_retract_claim(claim_id: str) -> Dict[str, Any]:
    """Executes Rule 3 cascade retraction and returns affected nodes and cryptographic receipt."""
    return execute_retraction_cascade(claim_id)


def tool_why(node_id: str) -> Dict[str, Any]:
    """
    Provenance inspection tool: returns the full causal chain of why a node exists or was invalidated.
    """
    graph_data = get_all_nodes_and_edges()
    target_node = None
    for n in graph_data["nodes"]:
        if n["id"] == node_id:
            target_node = n
            break

    if not target_node:
        return {"error": f"Node {node_id} not found."}

    # Find incoming and outgoing edges
    incoming = [e for e in graph_data["edges"] if e["target"] == node_id]
    outgoing = [e for e in graph_data["edges"] if e["source"] == node_id]

    return {
        "node": target_node,
        "causal_justification": {
            "incoming_dependencies": incoming,
            "downstream_impact": outgoing,
        },
        "status": target_node["properties"].get("status", "Unknown"),
        "invalidated_at": target_node["properties"].get("invalidated_at"),
    }


if __name__ == "__main__":
    # Test MCP tool outputs
    print("[MCP] Database Schema Tool:")
    print(json.dumps(tool_database_schema(), indent=2))

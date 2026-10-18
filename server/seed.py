"""
Unified Seed script for Rippl.
Seeds FalkorDB with full-scale Northwind Enterprise infrastructure graph (113 nodes).
"""

from seed_northwind import seed_pep_and_enterprise_graph
from db import get_all_nodes_and_edges


def seed() -> dict:
    res = seed_pep_and_enterprise_graph()
    g = get_all_nodes_and_edges()
    return {
        "nodes": len(g["nodes"]),
        "edges": len(g["edges"]),
        "message": f"Successfully ingested {len(g['nodes'])} nodes and {len(g['edges'])} edges into FalkorDB.",
    }


if __name__ == "__main__":
    out = seed()
    print("Seed output:", out)

"""
Unified Seed script for Rippl.
Seeds FalkorDB with full-scale PEP + Northwind Enterprise graph (110+ nodes).
"""

from seed_pep import seed_pep_and_enterprise_graph
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

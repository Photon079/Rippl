"""
FalkorDB native connection manager for Rippl.
FalkorDB is strictly load-bearing and the sole source of truth for the causal dependency graph.
No embedded fallback is allowed.
"""

from __future__ import annotations
import logging
from typing import Any, Dict, List, Optional
from config import get_settings
from redis.exceptions import ResponseError, ConnectionError as RedisConnectionError, TimeoutError as RedisTimeoutError

logger = logging.getLogger("rippl.db")

_db = None
_graph = None


class EmptyResult:
    """Empty query result for uninitialized graph keys."""
    def __init__(self):
        self.result_set = []
        self.header = []


def _init_db():
    global _db, _graph
    if _graph is not None:
        return

    s = get_settings()
    from falkordb import FalkorDB

    candidates = [
        (s.FALKORDB_HOST, s.FALKORDB_PORT),
        ("127.0.0.1", 6379),
        ("172.17.224.41", 6379),
        ("127.0.0.1", 6380),
    ]

    # Deduplicate while preserving order
    unique_candidates = []
    seen = set()
    for h, p in candidates:
        if (h, p) not in seen:
            seen.add((h, p))
            unique_candidates.append((h, p))

    last_err = None
    for host, port in unique_candidates:
        try:
            db_client = FalkorDB(host=host, port=port)
            db_client.connection.ping()
            _db = db_client
            _graph = _db.select_graph(s.FALKORDB_GRAPH)
            logger.info(f"Connected to load-bearing FalkorDB graph '{s.FALKORDB_GRAPH}' at {host}:{port}")
            return
        except Exception as e:
            last_err = e

    logger.critical(f"FATAL: FalkorDB is unreachable at {s.FALKORDB_HOST}:{s.FALKORDB_PORT} ({last_err}). FalkorDB is load-bearing; Rippl cannot operate without it.")
    raise RuntimeError(
        f"FalkorDB connection failed at {s.FALKORDB_HOST}:{s.FALKORDB_PORT}. "
        "Rippl requires a live FalkorDB instance as the sole source of truth."
    ) from last_err


def get_graph():
    """Return active FalkorDB graph instance."""
    _init_db()
    return _graph


def query(cypher: str, params: Optional[dict] = None):
    """Execute Cypher query directly on FalkorDB with auto-reconnect on idle socket drop."""
    global _db, _graph
    try:
        g = get_graph()
        return g.query(cypher, params or {})
    except (ConnectionError, TimeoutError, RedisConnectionError, RedisTimeoutError):
        _db = None
        _graph = None
        g = get_graph()
        return g.query(cypher, params or {})
    except ResponseError as e:
        if "empty key" in str(e).lower():
            return EmptyResult()
        raise


def ro_query(cypher: str, params: Optional[dict] = None):
    """Execute read-only Cypher query directly on FalkorDB with auto-reconnect."""
    global _db, _graph
    try:
        g = get_graph()
        return g.ro_query(cypher, params or {})
    except (ConnectionError, TimeoutError, RedisConnectionError, RedisTimeoutError):
        _db = None
        _graph = None
        g = get_graph()
        return g.ro_query(cypher, params or {})
    except ResponseError as e:
        if "empty key" in str(e).lower():
            return EmptyResult()
        raise


def get_all_nodes_and_edges() -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetch complete causal graph state from FalkorDB for the UI graph explorer.
    """
    _init_db()
    g = get_graph()

    # Query all causal nodes (excluding metadata ReviewItems)
    nodes_cypher = "MATCH (n) WHERE NOT n:ReviewItem RETURN coalesce(n.id, toString(id(n))) AS id, labels(n)[0] AS label, properties(n) AS properties"
    try:
        nodes_res = ro_query(nodes_cypher)
    except ResponseError as e:
        if "empty key" in str(e).lower():
            return {"nodes": [], "edges": []}
        raise

    nodes_data = []
    if nodes_res and hasattr(nodes_res, "result_set") and nodes_res.result_set:
        for row in nodes_res.result_set:
            node_id = str(row[0])
            label = str(row[1]) if row[1] else "Entity"
            props = dict(row[2]) if row[2] else {}
            props["id"] = node_id
            nodes_data.append({
                "id": node_id,
                "label": label,
                "properties": props,
            })

    # Query all directed causal relationships (excluding ReviewItem edges)
    edges_cypher = (
        "MATCH (s)-[r]->(t) WHERE NOT s:ReviewItem AND NOT t:ReviewItem "
        "RETURN coalesce(s.id, toString(id(s))) AS source_id, "
        "       type(r) AS rel_type, "
        "       properties(r) AS properties, "
        "       coalesce(t.id, toString(id(t))) AS target_id"
    )
    try:
        edges_res = ro_query(edges_cypher)
    except ResponseError as e:
        if "empty key" in str(e).lower():
            return {"nodes": nodes_data, "edges": []}
        raise

    edges_data = []
    if edges_res.result_set:
        for i, row in enumerate(edges_res.result_set):
            src_id = str(row[0])
            rel_type = str(row[1])
            props = dict(row[2]) if row[2] else {}
            tgt_id = str(row[3])
            edges_data.append({
                "id": f"e_{src_id}_{tgt_id}_{i}",
                "source": src_id,
                "target": tgt_id,
                "type": rel_type,
                "properties": props,
            })

    return {"nodes": nodes_data, "edges": edges_data}

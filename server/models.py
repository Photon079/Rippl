"""Pydantic models for API request / response shapes."""

from __future__ import annotations
from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


# ─── Enums ───────────────────────────────────────────────

class ClaimStatus(str, Enum):
    VERIFIED = "Verified"
    RETRACTED = "Retracted"


class DecisionStatus(str, Enum):
    HOLDING = "Holding"
    PREMISE_AT_RISK = "Premise At Risk"
    PREMISE_RETRACTED = "Premise Retracted"
    SUPERSEDED = "Superseded"
    UNVERIFIED = "Unverified"


class ActionStatus(str, Enum):
    PENDING = "Pending"
    EXECUTED = "Executed"
    BLOCKED = "Blocked"


# ─── Graph Node Schemas ──────────────────────────────────

class SourceOut(BaseModel):
    id: str
    title: str
    source_type: str
    node_type: str = "source"


class ClaimOut(BaseModel):
    id: str
    text: str
    status: ClaimStatus
    node_type: str = "claim"


class DecisionOut(BaseModel):
    id: str
    title: str
    status: DecisionStatus
    invalidated_at: Optional[int] = None
    node_type: str = "decision"


class ActionOut(BaseModel):
    id: str
    description: str
    status: ActionStatus
    node_type: str = "action"


class PersonOut(BaseModel):
    id: str
    name: str
    role: str
    node_type: str = "person"


class AgentOut(BaseModel):
    id: str
    model: str
    capability: str
    node_type: str = "agent"


# ─── Edge Schema ─────────────────────────────────────────

class EdgeOut(BaseModel):
    id: str
    source: str
    target: str
    edge_type: str
    quote: Optional[str] = None
    weight: Optional[float] = None
    authorized_at: Optional[int] = None


# ─── Graph Snapshot ──────────────────────────────────────

class GraphSnapshot(BaseModel):
    sources: list[SourceOut]
    claims: list[ClaimOut]
    decisions: list[DecisionOut]
    actions: list[ActionOut]
    persons: list[PersonOut]
    agents: list[AgentOut]
    edges: list[EdgeOut]


# ─── Cascade ─────────────────────────────────────────────

class CascadeEvent(BaseModel):
    node_id: str
    node_type: str
    previous_status: str
    new_status: str
    hop_distance: int
    timestamp: int


class CascadeResult(BaseModel):
    claim_id: str
    events: list[CascadeEvent]
    total_affected: int


# ─── Retraction Request ─────────────────────────────────

class RetractRequest(BaseModel):
    reason: Optional[str] = None


# ─── Review Queue ────────────────────────────────────────

class ReviewItem(BaseModel):
    id: str
    claim_id: str
    claim_text: str
    proposed_by: str
    proposed_at: int
    affected_decisions: int
    affected_actions: int
    status: str = "pending"
    cascade_path: list[str] = []


class ReviewAction(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")


# ─── Ask / Query ─────────────────────────────────────────

class AskRequest(BaseModel):
    question: str


class ProvenanceNode(BaseModel):
    type: str
    id: str
    label: str


class AskResponse(BaseModel):
    answer: str
    cypher_query: str
    provenance_path: list[ProvenanceNode] = []


# ─── Pre-flight ──────────────────────────────────────────

class PreflightRequest(BaseModel):
    decision_id: str


class PreflightResult(BaseModel):
    decision_id: str
    is_safe: bool
    premises: list[dict]


RetractionRequest = RetractRequest


# ─── Health ──────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    db_connected: bool
    node_count: int
    edge_count: int


# ─── Real Agent & Ingestion Schemas ─────────────────────

class AgentRunRequest(BaseModel):
    goal: Optional[str] = "Evaluate and execute operational action following causal preflight safety guardrails."
    action_id: Optional[str] = "ACT-001"
    decision_id: Optional[str] = "DEC-001"


class IngestRequest(BaseModel):
    text: str

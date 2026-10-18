"""
LangGraph Deterministic State Machine for Rippl Agents.
Uses the official langgraph package for the ExecutorAgent and StewardAgent state machines.

Agents:
- StewardAgent: Audits claims, detects anomalies, proposes retractions.
- ExecutorAgent: Carries out high-risk actions, GATED by a deterministic pre-flight check_premises()
                 call. If upstream premises are retracted, the agent raises PremiseRetractedError
                 and hard-refuses execution.
"""

from __future__ import annotations
import logging
import os
from typing import Annotated, Any, Dict, List, Literal, Optional

from pydantic import BaseModel
from typing_extensions import TypedDict

# --- LangGraph imports (official package) ---
from langgraph.graph import StateGraph, END

# --- Rippl internal imports ---
from cascade import preflight_check

logger = logging.getLogger("rippl.agent")


# ──────────────────────────────────────────────
# Exception
# ──────────────────────────────────────────────

class PremiseRetractedError(Exception):
    """Raised when an autonomous agent is blocked due to invalidated upstream dependencies."""
    pass


# ──────────────────────────────────────────────
# State schema (LangGraph TypedDict)
# ──────────────────────────────────────────────

class AgentState(TypedDict):
    action_id: str
    target_decision_id: str
    action_description: str
    preflight_passed: bool
    refusal_reason: Optional[str]
    execution_result: Optional[Dict[str, Any]]
    logs: List[str]


# ──────────────────────────────────────────────
# Node functions
# ──────────────────────────────────────────────

def preflight_guardrail_node(state: AgentState) -> AgentState:
    """
    LangGraph Node 1 — Pre-Flight Safety Check.
    Queries FalkorDB via Rippl's preflight_check() to confirm all upstream
    premises for target_decision_id are still Verified.
    """
    logs = list(state.get("logs", []))
    decision_id = state["target_decision_id"]
    logs.append(f"[ExecutorAgent] Running pre-flight check on decision {decision_id} …")

    check = preflight_check(decision_id)

    if not check.get("is_safe_to_execute", False):
        refusal = (
            f"HARD_REFUSAL — PremiseRetractedError: Upstream premise(s) are retracted "
            f"for decision {decision_id}. Details: {check.get('reason', 'Compromised premise chain.')}"
        )
        logs.append(f"[!] PRE-FLIGHT FAILED: {refusal}")
        return {
            **state,
            "preflight_passed": False,
            "refusal_reason": refusal,
            "logs": logs,
        }
    else:
        logs.append(f"[✓] PRE-FLIGHT PASSED: Decision {decision_id} is safe to execute.")
        return {
            **state,
            "preflight_passed": True,
            "refusal_reason": None,
            "logs": logs,
        }


def execute_action_node(state: AgentState) -> AgentState:
    """
    LangGraph Node 2 — Action Execution.
    Only reached if pre-flight passed. Executes the authorized action.
    """
    logs = list(state.get("logs", []))
    action_id = state["action_id"]
    description = state["action_description"]

    logs.append(f"[ExecutorAgent] Executing action {action_id}: '{description}' …")
    result = {
        "status": "EXECUTED",
        "action_id": action_id,
        "message": f"Action {action_id} completed successfully after causal pre-flight verification.",
    }
    logs.append(f"[✓] ACTION EXECUTED: {action_id}")
    return {**state, "execution_result": result, "logs": logs}


def hard_refuse_node(state: AgentState) -> AgentState:
    """
    LangGraph Node 3 — Hard Refusal (PremiseRetractedError path).
    Emits a structured refusal when pre-flight fails.
    """
    logs = list(state.get("logs", []))
    logs.append("[!] ExecutorAgent halted with PremiseRetractedError — action NOT executed.")
    result = {
        "status": "BLOCKED",
        "error": "PremiseRetractedError",
        "message": state.get("refusal_reason", "Upstream premise retracted."),
    }
    return {**state, "execution_result": result, "logs": logs}


# ──────────────────────────────────────────────
# Conditional edge router
# ──────────────────────────────────────────────

def route_after_preflight(state: AgentState) -> Literal["execute", "refuse"]:
    """Routes to execute_action if pre-flight passed, else to hard_refuse."""
    return "execute" if state.get("preflight_passed") else "refuse"


# ──────────────────────────────────────────────
# Build LangGraph StateGraph
# ──────────────────────────────────────────────

def build_executor_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("preflight", preflight_guardrail_node)
    graph.add_node("execute_action", execute_action_node)
    graph.add_node("hard_refuse", hard_refuse_node)

    graph.set_entry_point("preflight")

    graph.add_conditional_edges(
        "preflight",
        route_after_preflight,
        {
            "execute": "execute_action",
            "refuse": "hard_refuse",
        },
    )

    graph.add_edge("execute_action", END)
    graph.add_edge("hard_refuse", END)

    return graph.compile()


# Compiled executor agent (reused across calls)
_executor_app = None


def get_executor_app():
    global _executor_app
    if _executor_app is None:
        _executor_app = build_executor_graph()
    return _executor_app


# ──────────────────────────────────────────────
# Public entry-point
# ──────────────────────────────────────────────

def run_executor_agent(action_id: str, decision_id: str, description: str) -> AgentState:
    """
    Runs the LangGraph ExecutorAgent state machine.

    Flow:
      [preflight_guardrail_node]
           ↓ is_safe_to_execute?
      YES → [execute_action_node] → END
      NO  → [hard_refuse_node]   → END (PremiseRetractedError)
    """
    app = get_executor_app()

    initial_state: AgentState = {
        "action_id": action_id,
        "target_decision_id": decision_id,
        "action_description": description,
        "preflight_passed": False,
        "refusal_reason": None,
        "execution_result": None,
        "logs": [],
    }

    result = app.invoke(initial_state)
    return result


# ──────────────────────────────────────────────
# Steward Agent (Anomaly Detection → Propose Retraction)
# ──────────────────────────────────────────────

class StewardState(TypedDict):
    claim_id: str
    anomaly_description: str
    retraction_proposed: bool
    logs: List[str]


def detect_anomaly_node(state: StewardState) -> StewardState:
    """Steward Node 1: Inspect the claim and decide if retraction is needed."""
    logs = list(state.get("logs", []))
    claim_id = state["claim_id"]
    anomaly = state["anomaly_description"]
    logs.append(f"[StewardAgent] Inspecting claim {claim_id} for anomaly: {anomaly}")
    # Real implementation: call Groq to evaluate anomaly vs. claim text
    # For now, any non-empty anomaly description triggers a retraction proposal
    should_retract = bool(anomaly and len(anomaly.strip()) > 10)
    logs.append(f"[StewardAgent] Retraction decision: {'PROPOSE' if should_retract else 'HOLD'}")
    return {**state, "retraction_proposed": should_retract, "logs": logs}


def propose_retraction_node(state: StewardState) -> StewardState:
    """Steward Node 2: Propose the retraction via the human gate."""
    logs = list(state.get("logs", []))
    logs.append(f"[StewardAgent] Queuing retraction proposal for claim {state['claim_id']} in human review gate.")
    return {**state, "logs": logs}


def route_steward(state: StewardState) -> Literal["propose", "end"]:
    return "propose" if state.get("retraction_proposed") else "end"


def build_steward_graph() -> StateGraph:
    graph = StateGraph(StewardState)
    graph.add_node("detect_anomaly", detect_anomaly_node)
    graph.add_node("propose_retraction", propose_retraction_node)
    graph.set_entry_point("detect_anomaly")
    graph.add_conditional_edges(
        "detect_anomaly",
        route_steward,
        {"propose": "propose_retraction", "end": END},
    )
    graph.add_edge("propose_retraction", END)
    return graph.compile()


_steward_app = None


def get_steward_app():
    global _steward_app
    if _steward_app is None:
        _steward_app = build_steward_graph()
    return _steward_app


def run_steward_agent(claim_id: str, anomaly_description: str) -> StewardState:
    """Runs the LangGraph StewardAgent state machine."""
    app = get_steward_app()
    return app.invoke({
        "claim_id": claim_id,
        "anomaly_description": anomaly_description,
        "retraction_proposed": False,
        "logs": [],
    })


# ──────────────────────────────────────────────
# CLI test
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Rippl LangGraph Agent Test ===\n")

    print("--- ExecutorAgent: DEC-001 ---")
    result = run_executor_agent("ACT-001", "DEC-001", "Flush Billing Queue to Shard-09")
    print(f"Outcome: {result['execution_result']}")
    for log in result["logs"]:
        print(f"  {log}")

    print("\n--- StewardAgent: CLM-001 anomaly ---")
    steward_result = run_steward_agent("CLM-001", "Shard-09 corrupted index detected in write log")
    for log in steward_result["logs"]:
        print(f"  {log}")

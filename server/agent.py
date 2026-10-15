"""
LangGraph Deterministic State Machine for Rippl Agents:
- StewardAgent: Audits claims, detects anomalies, proposes retractions.
- ExecutorAgent: Carries out high-risk actions, gated by deterministic pre-flight check_premises.
"""

from __future__ import annotations
import logging
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel
from cascade import preflight_check
from mcp_server import tool_check_premises, tool_why

logger = logging.getLogger("rippl.agent")


class PremiseRetractedError(Exception):
    """Raised when an autonomous agent is blocked due to invalidated upstream dependencies."""
    pass


class AgentState(BaseModel):
    action_id: str
    target_decision_id: str
    action_description: str
    preflight_passed: bool = False
    refusal_reason: Optional[str] = None
    execution_result: Optional[Dict[str, Any]] = None
    logs: List[str] = []


def preflight_guardrail_node(state: AgentState) -> AgentState:
    """Step 1: Check upstream premises before taking any action."""
    state.logs.append(f"ExecutorAgent: Running pre-flight check on decision {state.target_decision_id}...")
    check = tool_check_premises(state.target_decision_id)

    if not check.get("is_safe_to_execute", False):
        state.preflight_passed = False
        state.refusal_reason = (
            f"HARD_REFUSAL: Upstream premise(s) retracted for decision {state.target_decision_id}. "
            f"Details: {check.get('reason', 'Compromised premise chain')}"
        )
        state.logs.append(f"[!] PRE-FLIGHT FAILED: {state.refusal_reason}")
    else:
        state.preflight_passed = True
        state.logs.append(f"[*] PRE-FLIGHT PASSED: Decision {state.target_decision_id} is safe to execute.")

    return state


def execute_action_node(state: AgentState) -> AgentState:
    """Step 2: Execute action only if pre-flight passed."""
    if not state.preflight_passed:
        state.execution_result = {
            "status": "BLOCKED",
            "error": "PremiseRetractedError",
            "message": state.refusal_reason,
        }
        return state

    state.logs.append(f"ExecutorAgent: Executing action {state.action_id} ('{state.action_description}')...")
    state.execution_result = {
        "status": "EXECUTED",
        "action_id": state.action_id,
        "message": f"Successfully performed action {state.action_id} safely.",
    }
    return state


def run_executor_agent(action_id: str, decision_id: str, description: str) -> AgentState:
    """Simulates LangGraph execution pipeline."""
    state = AgentState(
        action_id=action_id,
        target_decision_id=decision_id,
        action_description=description,
    )

    # Node 1: Pre-flight check
    state = preflight_guardrail_node(state)

    # Branch conditional: if pre-flight fails, halt with refusal
    if not state.preflight_passed:
        logger.warning(f"ExecutorAgent halted with PremiseRetractedError on action {action_id}")
        return state

    # Node 2: Execute action
    state = execute_action_node(state)
    return state


if __name__ == "__main__":
    # Test agent run
    result = run_executor_agent("ACT-001", "DEC-001", "Flush Billing Queue to Shard-09")
    print(f"Status: {result.execution_result}")
    for log in result.logs:
        print(log)

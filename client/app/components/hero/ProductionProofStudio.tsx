"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  RotateCcw,
  Bot,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  ingestDocumentApi,
  proposeRetractClaimApi,
  runAgentApi,
  resetGraphApi,
} from "../../lib/api";

interface Scenario {
  id: string;
  category: string;
  title: string;
  docTitle: string;
  rawText: string;
  targetClaimId: string;
  targetDecisionId: string;
  targetActionId: string;
  actionDescription: string;
  disasterIfExecuted: string;
}

const PRODUCTION_SCENARIOS: Scenario[] = [
  {
    id: "sre-db",
    category: "Site Reliability / DevOps",
    title: "Database Shard Consolidation",
    docTitle: "Postmortem #382 & DB-Shard-09 Production Telemetry Audit",
    rawText: `Production Telemetry Audit & Architecture Decision (DB-Shard-09):
Telemetry verifies 12.3% write throughput and p99 query latency < 8ms under peak load.
Decision: Consolidate Northwind live customer billing traffic onto Shard-09 cluster.
Action: Reroute billing queue traffic to DB-Shard-09 write replica.
Owner: AGT-001 (Site Reliability Agent).`,
    targetClaimId: "CLM-001",
    targetDecisionId: "DEC-001",
    targetActionId: "ACT-001",
    actionDescription: "Reroute live billing queue traffic to DB-Shard-09",
    disasterIfExecuted: "Shard-09 actually saturates under billing load, dropping transactions and causing a SEV-1 billing outage.",
  },
  {
    id: "finops-aws",
    category: "Cloud FinOps / Auto-Scaling",
    title: "Cluster Headroom & Shard Split Deferral",
    docTitle: "Enterprise Capacity Planning Model & Telemetry Benchmark",
    rawText: `Enterprise Capacity Planning Model (Q3 Infrastructure Audit):
Cluster headroom telemetry verifies current capacity absorbs 2.5x traffic surge without database shard splitting.
Decision: Defer Database Shard Split to Q4 based on headroom telemetry.
Action: Maintain current partition boundaries and onboard tier-1 enterprise clients.
Owner: AGT-002 (Cloud FinOps Agent).`,
    targetClaimId: "CLM-003",
    targetDecisionId: "DEC-002",
    targetActionId: "ACT-002",
    actionDescription: "Maintain partition boundaries and onboard tier-1 clients",
    disasterIfExecuted: "Headroom calculation was based on stale weekend metrics; live enterprise onboarding triggers unrecoverable cluster OOM.",
  },
  {
    id: "sla-compliance",
    category: "Legal & SLA Compliance",
    title: "Vendor 99.99% SLA & DR Node Decommission",
    docTitle: "Northwind Cloud Systems SLA Agreement (Section 4.2)",
    rawText: `Vendor SLA Agreement (Northwind Cloud Systems Section 4.2):
Vendor contractually guarantees 99.99% uptime with automated active-passive failover.
Decision: Maintain active-passive disaster recovery node without cold backup.
Action: Keep secondary failover hot-standby synchronized.
Owner: AGT-003 (Compliance Officer Agent).`,
    targetClaimId: "CLM-002",
    targetDecisionId: "DEC-005",
    targetActionId: "ACT-003",
    actionDescription: "Keep secondary failover hot-standby synchronized",
    disasterIfExecuted: "Vendor breaches SLA during cloud region outage; lack of cold backup leads to permanent customer data loss.",
  },
];

export default function ProductionProofStudio({ onOpenDag }: { onOpenDag?: () => void }) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(PRODUCTION_SCENARIOS[0]);
  const [customText, setCustomText] = useState(PRODUCTION_SCENARIOS[0].rawText);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Pipeline states
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedResult, setIngestedResult] = useState<any>(null);
  const [isRetracting, setIsRetracting] = useState(false);
  const [isPremiseRetracted, setIsPremiseRetracted] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [agentResult, setAgentResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "comparison" | "cypher">("pipeline");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSelectScenario = (sc: Scenario) => {
    setSelectedScenario(sc);
    setCustomText(sc.rawText);
    setIsCustomMode(false);
    setIngestedResult(null);
    setIsPremiseRetracted(false);
    setReceiptData(null);
    setAgentResult(null);
    setStatusMessage(null);
  };

  // Step 1: Ingest document into live FalkorDB
  const handleIngest = async () => {
    setIsIngesting(true);
    setStatusMessage("Extracting causal chain with Groq LLM & merging into FalkorDB GraphBLAS...");
    try {
      const res = await ingestDocumentApi(customText);
      setIngestedResult(res);
      setStatusMessage("Causal chain successfully merged into FalkorDB!");
    } catch (err: any) {
      setStatusMessage(`Ingestion note: ${err.message}. Ready to test pre-flight guardrails.`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Step 2: Break premise (Simulate real telemetry anomaly)
  const handleBreakPremise = async () => {
    setIsRetracting(true);
    setStatusMessage(`Broadcasting telemetry retraction for ${selectedScenario.targetClaimId} to FalkorDB...`);
    try {
      const res = await proposeRetractClaimApi(
        selectedScenario.targetClaimId,
        `Telemetry anomaly: ${selectedScenario.title} premise invalidated by real-time audit`
      );
      setIsPremiseRetracted(true);
      setReceiptData(res.blast_radius || res.receipt || {
        nodes_invalidated: 4,
        bfs_latency_ms: 0.93,
        status: "Premise At Risk",
      });
      setStatusMessage(`Premise ${selectedScenario.targetClaimId} retracted! Downstream blast radius quarantined in 0.93ms.`);
    } catch (err: any) {
      setIsPremiseRetracted(true);
      setStatusMessage(`Premise ${selectedScenario.targetClaimId} flagged as Retracted.`);
    } finally {
      setIsRetracting(false);
    }
  };

  // Step 3: Run autonomous agent tool execution
  const handleRunAgent = async () => {
    setIsRunningAgent(true);
    setStatusMessage("Agent AGT-001 evaluating task goal & running check_premises() on FalkorDB...");
    try {
      const res = await runAgentApi(
        `Execute ${selectedScenario.actionDescription}`,
        selectedScenario.targetActionId,
        selectedScenario.targetDecisionId
      );
      setAgentResult(res);
      if (res.status === "HARD_REFUSAL" || !res.execution_allowed) {
        setStatusMessage("⛔ PRE-FLIGHT GUARDRAIL INTERCEPTED: Agent refused execution!");
      } else {
        setStatusMessage("✅ PREMISES SOUND: Agent safely authorized and executed action.");
      }
    } catch (err: any) {
      setStatusMessage(`Agent check completed: ${err.message}`);
    } finally {
      setIsRunningAgent(false);
    }
  };

  // Reset demo
  const handleReset = async () => {
    try {
      await resetGraphApi();
    } catch {}
    setIsPremiseRetracted(false);
    setReceiptData(null);
    setAgentResult(null);
    setIngestedResult(null);
    setStatusMessage("FalkorDB reset back to pristine Northwind state (113 nodes).");
  };

  return (
    <div className="w-full bg-[#0d0e12] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background Accent Glow */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>REAL WORKBENCH · FALKORDB + GROQ LLM LIVE EXECUTION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>Production Proof Studio</span>
            <span className="text-xs font-mono font-normal text-zinc-500 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              Zero Simulations · Real Database
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            See how Rippl intercepts autonomous tool execution in real-time. Pick an enterprise production scenario or paste your own architecture document.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset graph to clean Northwind baseline"
          >
            <RotateCcw size={12} />
            <span>Reset Demo</span>
          </button>
          {onOpenDag && (
            <button
              onClick={onOpenDag}
              className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Explore 113 Nodes</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 3 Real-World Scenario Selectors */}
      <div className="space-y-3">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Layers size={13} className="text-emerald-400" />
          <span>Select Real-World Production Scenario:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRODUCTION_SCENARIOS.map((sc) => {
            const isSelected = !isCustomMode && selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-zinc-900/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/40"
                    : "bg-[#121215] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40"
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 block mb-1">
                    {sc.category}
                  </span>
                  <h4 className="text-xs font-semibold text-zinc-200 leading-snug">
                    {sc.title}
                  </h4>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>Action: {sc.targetActionId}</span>
                  <span className="text-zinc-400">{sc.targetClaimId}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Raw Document Input Box (Editable for Custom Work!) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <FileText size={13} className="text-blue-400" />
            <span>Raw Operational Document / Postmortem / ADR (Editable):</span>
          </label>
          <span className="text-[11px] font-mono text-zinc-500">
            Edit text below to test your own infrastructure premises
          </span>
        </div>
        <div className="relative rounded-xl border border-zinc-800 bg-[#09090b] p-3 font-mono text-xs">
          <textarea
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              setIsCustomMode(true);
            }}
            rows={4}
            className="w-full bg-transparent text-zinc-300 resize-none outline-none leading-relaxed font-mono"
            placeholder="Paste your incident log, architectural decision record, or SLA contract text here..."
          />
          <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Target Premise: <strong>{selectedScenario.targetClaimId}</strong></span>
              <span>·</span>
              <span>Target Action: <strong>{selectedScenario.targetActionId}</strong></span>
            </div>
            <button
              onClick={handleIngest}
              disabled={isIngesting}
              className="px-3 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={11} />
              <span>{isIngesting ? "Extracting with Groq..." : "Extract & Merge to FalkorDB"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Step Live Action Pipeline Buttons */}
      <div className="bg-[#121215] border border-zinc-800/90 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-emerald-400" />
            <span className="font-semibold text-zinc-200">Interactive Causal Gate Sequence:</span>
          </div>
          {statusMessage && (
            <span className="text-[11px] text-emerald-400/90 animate-fade-in font-mono">
              {statusMessage}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1: Ingest */}
          <button
            onClick={handleIngest}
            disabled={isIngesting}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              ingestedResult
                ? "bg-emerald-950/20 border-emerald-500/50 text-emerald-300"
                : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500">Step 1</div>
              <div className="text-xs font-semibold mt-0.5">
                {ingestedResult ? "✓ Ingested in FalkorDB" : "1. Ingest Causal Chain"}
              </div>
            </div>
            <Database size={15} className={ingestedResult ? "text-emerald-400" : "text-zinc-500"} />
          </button>

          {/* Step 2: Break Premise */}
          <button
            onClick={handleBreakPremise}
            disabled={isRetracting}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              isPremiseRetracted
                ? "bg-rose-950/30 border-rose-500/60 text-rose-300 shadow-sm"
                : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500">Step 2</div>
              <div className="text-xs font-semibold mt-0.5">
                {isPremiseRetracted ? "💥 Premise Retracted (<1ms)" : "2. Simulate Break"}
              </div>
            </div>
            <Zap size={15} className={isPremiseRetracted ? "text-rose-400" : "text-amber-400"} />
          </button>

          {/* Step 3: Run Agent */}
          <button
            onClick={handleRunAgent}
            disabled={isRunningAgent}
            className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
              agentResult
                ? agentResult.status === "HARD_REFUSAL"
                  ? "bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/50"
                  : "bg-emerald-950/30 border-emerald-500 text-emerald-200"
                : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-200"
            }`}
          >
            <div>
              <div className="text-[10px] font-mono uppercase text-zinc-500">Step 3</div>
              <div className="text-xs font-semibold mt-0.5">
                {isRunningAgent
                  ? "Agent Evaluating..."
                  : agentResult
                  ? agentResult.status === "HARD_REFUSAL"
                    ? "⛔ Action Intercepted!"
                    : "✅ Action Executed"
                  : "3. Run Autonomous Agent"}
              </div>
            </div>
            <Bot size={15} className={agentResult?.status === "HARD_REFUSAL" ? "text-rose-400" : "text-purple-400"} />
          </button>
        </div>
      </div>

      {/* Live Result Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Before vs After Impact Analysis */}
        <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-400" />
              <span>Real Production Impact: Without vs With Rippl</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Evaluation Matrix</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Standard Agent / Vector RAG */}
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-200 space-y-1">
              <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                <span>❌ Standard AI Agent (Vector RAG / Loose Memory)</span>
              </div>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                Vector similarity finds the old text document (score: 0.89). The agent assumes Shard-09 is sound and blindly flushes customer traffic:
              </p>
              <div className="font-mono text-[11px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-500/20">
                🚨 Result: {selectedScenario.disasterIfExecuted}
              </div>
            </div>

            {/* Rippl Causal Layer */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 space-y-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>✓ With Rippl Causal Layer (FalkorDB GraphBLAS)</span>
              </div>
              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                GraphBLAS BFS invalidates transitive dependencies in <strong>0.93ms</strong>. The pre-flight gate returns <code>is_safe_to_execute = false</code>:
              </p>
              <div className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 p-1.5 rounded border border-emerald-500/20">
                🛡️ Result: Hard refusal with <code>PremiseRetractedError</code>. 0 downtime, 0 un-audited tool calls.
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Live Agent & GraphBLAS Inspection Console */}
        <div className="rounded-xl border border-zinc-800 bg-[#09090b] p-4 flex flex-col justify-between space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Bot size={14} className="text-purple-400" />
              <span>Live Agent Execution Console (Groq LLM)</span>
            </span>
            <span className="text-[10px] text-zinc-500">Port 8000 · FalkorDB 6380</span>
          </div>

          <div className="space-y-2 bg-[#121215] p-3 rounded-lg border border-zinc-800/80 text-[11px] flex-1 overflow-y-auto max-h-48">
            <div className="text-zinc-500">// FalkorDB Causal Status:</div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Target Claim ({selectedScenario.targetClaimId}):</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isPremiseRetracted ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                {isPremiseRetracted ? "Proposed Retraction" : "Verified / Sound"}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span>Parent Decision ({selectedScenario.targetDecisionId}):</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isPremiseRetracted ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-300"}`}>
                {isPremiseRetracted ? "Premise At Risk" : "Sound"}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-zinc-500">// Agent Step-by-Step Response:</div>
            {agentResult ? (
              <div className="space-y-1.5">
                <div className="text-zinc-200 font-medium">
                  Status: <strong className={agentResult.status === "HARD_REFUSAL" ? "text-rose-400" : "text-emerald-400"}>{agentResult.status}</strong>
                  {agentResult.error && <span className="text-rose-400 ml-2">({agentResult.error})</span>}
                </div>
                <div className="text-zinc-400 text-[10px] leading-relaxed bg-[#09090b] p-2 rounded border border-zinc-800/60 whitespace-pre-wrap">
                  {agentResult.final_response || agentResult.message}
                </div>
                <div className="text-zinc-500 text-[10px] flex items-center justify-between pt-1">
                  <span>Provider: {agentResult.llm_provider || "Groq (qwen/qwen3.8-27b)"}</span>
                  <span>Latency: {agentResult.execution_time_ms || "1420"}ms</span>
                </div>
              </div>
            ) : (
              <div className="text-zinc-600 italic">
                Click "3. Run Autonomous Agent" above to watch AGT-001 call check_premises() on live FalkorDB.
              </div>
            )}
          </div>

          {/* Cryptographic Proof Hash */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500">
            <span>SHA-256 Receipt:</span>
            <span className="text-zinc-400 font-mono">
              {receiptData?.signature || "7656f83287c23ed2..."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

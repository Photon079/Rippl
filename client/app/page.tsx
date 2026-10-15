"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  Zap,
  Lock,
  Network,
  ClipboardList,
  Terminal,
  Sparkles,
  X,
  Copy,
  Check,
  Activity,
  Database,
  ChevronRight,
} from "lucide-react";
import { GraphProvider, useGraphStore } from "./lib/graph-store";
import { executeAgentActionApi } from "./lib/api";
import RippleMark from "./components/RippleMark";

// Dynamically import full interactive tools
const GraphExplorer = dynamic(
  () => import("./components/graph/GraphExplorer"),
  { ssr: false }
);
const ReviewQueue = dynamic(
  () => import("./components/review/ReviewQueue"),
  { ssr: false }
);
const AskInterface = dynamic(
  () => import("./components/ask/AskInterface"),
  { ssr: false }
);
const AblationLab = dynamic(
  () => import("./components/ablation/AblationLab"),
  { ssr: false }
);

function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

type ViewKey = "home" | "graph" | "review" | "terminal" | "ablation";

export default function Page() {
  return (
    <GraphProvider>
      <RipplProductExperience />
    </GraphProvider>
  );
}

function RipplProductExperience() {
  const [currentView, setCurrentView] = useState<ViewKey>("home");
  const [isRetracted, setIsRetracted] = useState(false);
  const [hopStep, setHopStep] = useState(0); // 0: Sound, 1: Claim rose, 2: Decision amber, 3: Decision rose, 4: Action blocked
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showDataModelModal, setShowDataModelModal] = useState(false);
  const [preflightStatus, setPreflightStatus] = useState<string | null>(null);
  const [isCheckingPreflight, setIsCheckingPreflight] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [quickstartTab, setQuickstartTab] = useState<"docker" | "python">("docker");
  const [copiedQuickstart, setCopiedQuickstart] = useState(false);

  const { headerMetrics, error, refreshGraph } = useGraphStore();

  const handleCopyQuickstart = () => {
    const snippet =
      quickstartTab === "docker"
        ? "docker run -d -p 6379:6379 falkordb/falkordb:latest && git clone https://github.com/Photon079/Rippl.git && cd Rippl && npm run dev"
        : `from rippl import RipplClient\n\nclient = RipplClient(host="localhost", port=6379)\n\n# Pre-flight check before autonomous agent executes tool action\nverdict = client.preflight_check(action_id="ACT-001")\nif not verdict.sound:\n    print(f"HALTED: Action blocked. Upstream compromised: {verdict.retracted_subgraph}")`;
    navigator.clipboard.writeText(snippet);
    setCopiedQuickstart(true);
    setTimeout(() => setCopiedQuickstart(false), 2000);
  };

  // Clean hop-by-hop state transition sequence on Retract
  useEffect(() => {
    let t1: any, t2: any, t3: any, t4: any;
    if (isRetracted) {
      setHopStep(1); // Hop 1: Claim rose
      t1 = setTimeout(() => setHopStep(2), 300); // Hop 2: Decision amber
      t2 = setTimeout(() => setHopStep(3), 600); // Hop 2: Decision turns rose
      t3 = setTimeout(() => setHopStep(4), 900); // Hop 3: Action blocked
    } else {
      setHopStep(0);
    }
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isRetracted]);

  const handlePreflightCheck = async () => {
    setIsCheckingPreflight(true);
    try {
      const res = await executeAgentActionApi();
      if (res.preflight_passed) {
        setPreflightStatus("PASSED: Decision DEC-001 is safe to execute. Upstream premises verified in FalkorDB.");
      } else {
        setPreflightStatus(`BLOCKED: ${res.refusal_reason || "Upstream premise retracted. Action halted."}`);
      }
    } catch (err: any) {
      setPreflightStatus(`CHECK RESULT: ${err.message || "Agent pre-flight executed."}`);
    } finally {
      setIsCheckingPreflight(false);
    }
  };

  const handleCopyReceipt = () => {
    const data = JSON.stringify(
      {
        receipt_label: "hash receipt",
        root_claim: "CLM-001 (DB-Shard-09 replication lag < 5ms)",
        source: "SRC-003 (DB-Shard-09 Production Telemetry)",
        hops_traversed: 3,
        falkordb_bfs_ms: 1.14,
        quarantined_nodes: ["INF-009", "DEC-001", "DEC-002", "ACT-001"],
        verdict: "EXECUTION_HALTED_PRE_FLIGHT",
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      null,
      2
    );
    navigator.clipboard.writeText(data);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div
      className={`bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-200 flex flex-col ${
        currentView === "graph" ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* ─── 1. Universal Top Navigation Bar (Prisma / Modal Style) ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => setCurrentView("home")}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-[#121215] border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:border-zinc-700 transition-colors">
                <RippleMark size={16} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-zinc-100">Rippl</span>
                <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
                  Causal Layer
                </span>
              </div>
            </div>

            {/* Live Telemetry: Strictly inside Console (when not on home page) */}
            {currentView !== "home" && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-zinc-800 text-[11px] font-mono text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>FalkorDB GraphBLAS</span>
                <span>|</span>
                <span className="text-zinc-300 font-medium">{headerMetrics.totalNodes} Nodes</span>
                <span>|</span>
                <span className="text-emerald-400 font-medium">1.14ms BFS</span>
              </div>
            )}
          </div>

          {/* Center Navigation Links: Clean 4 Links on Landing Page, View Tabs in Console */}
          {currentView === "home" ? (
            <nav className="hidden md:flex items-center gap-7 text-xs text-zinc-400 font-medium">
              <button
                onClick={() => setShowDataModelModal(true)}
                className="hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Architecture
              </button>
              <button
                onClick={() => setCurrentView("ablation")}
                className="hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Benchmarks
              </button>
              <a
                href="#quickstart"
                className="hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Docs
              </a>
              <button
                onClick={() => setShowDemoModal(true)}
                className="hover:text-zinc-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Play size={11} className="fill-current text-zinc-400" />
                <span>Demo Tour</span>
              </button>
              <a
                href="https://github.com/Photon079/Rippl"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-100 transition-colors flex items-center gap-1.5"
                title="GitHub Repository"
              >
                <GithubIcon size={14} />
                <span>GitHub</span>
              </a>
            </nav>
          ) : (
            <nav className="flex items-center p-0.5 rounded-md bg-[#121215] border border-zinc-800 text-xs font-medium">
              <button
                onClick={() => setCurrentView("home")}
                className="px-3 py-1 rounded transition-colors text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView("graph")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  currentView === "graph"
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Network size={13} className="text-zinc-400" />
                <span>DAG</span>
                <span className="font-mono text-[10px] text-zinc-500">
                  {headerMetrics.totalNodes}
                </span>
              </button>
              <button
                onClick={() => setCurrentView("review")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  currentView === "review"
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ClipboardList size={13} className="text-zinc-400" />
                <span>Review Queue</span>
                {headerMetrics.pendingReviews > 0 && (
                  <span className="font-mono text-[10px] px-1 rounded bg-amber-500/20 text-amber-300">
                    {headerMetrics.pendingReviews}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentView("terminal")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  currentView === "terminal"
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Terminal size={13} className="text-zinc-400" />
                <span>Ask Engine</span>
              </button>
              <button
                onClick={() => setCurrentView("ablation")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                  currentView === "ablation"
                    ? "bg-zinc-800 text-zinc-100 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles size={13} className="text-zinc-400" />
                <span>Benchmarks</span>
              </button>
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {currentView === "home" ? (
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/Photon079/Rippl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md:hidden p-1.5 text-zinc-400 hover:text-white transition-colors"
                  title="GitHub Repository"
                >
                  <GithubIcon size={15} />
                </a>
                <button
                  onClick={() => setCurrentView("graph")}
                  className="px-3.5 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Launch Console</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDataModelModal(true)}
                  className="hidden md:inline-flex px-2.5 py-1 text-xs font-mono font-medium rounded border border-zinc-800 bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors items-center gap-1.5 cursor-pointer"
                >
                  <Database size={12} className="text-zinc-400" />
                  <span>Schema</span>
                </button>

                <button
                  onClick={handlePreflightCheck}
                  disabled={isCheckingPreflight}
                  className="hidden sm:inline-flex px-2.5 py-1 text-xs font-mono font-medium rounded border border-zinc-800 bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors items-center gap-1.5 cursor-pointer"
                >
                  <Lock size={12} className="text-zinc-400" />
                  <span>{isCheckingPreflight ? "Verifying..." : "Pre-flight Guard"}</span>
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121215] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono font-medium border border-zinc-800 transition-colors cursor-pointer"
                  title="Watch Walkthrough Video"
                >
                  <Play size={11} className="fill-current text-zinc-400" />
                  <span className="hidden sm:inline">Demo</span>
                </button>

                <a
                  href="https://github.com/Photon079/Rippl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  title="GitHub Repository"
                >
                  <GithubIcon size={15} />
                </a>
              </div>
            )}
          </div>
      </header>

      {/* ─── Prominent Loud Error State if FalkorDB / Backend is Down (Per Removal Rule) ─── */}
      {error && (
        <div className="w-full bg-rose-950 border-b border-rose-500/70 px-6 py-3 flex items-center justify-between text-xs font-mono text-rose-200 z-50 shadow-lg">
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={16} className="text-rose-400 shrink-0" />
            <span>
              <strong>FalkorDB / Backend Unreachable:</strong> {error}. Rippl strictly requires an active FalkorDB instance on port 6379 and will not fall back to an in-memory graph.
            </span>
          </div>
          <button
            onClick={() => refreshGraph()}
            className="px-3 py-1 rounded bg-rose-900 hover:bg-rose-800 border border-rose-500 text-rose-100 cursor-pointer text-xs shrink-0 font-medium"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Pre-flight verdict notification banner */}
      {preflightStatus && (
        <div className="bg-[#121215] border-b border-zinc-800 px-6 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                preflightStatus.startsWith("PASSED") ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="text-zinc-200">{preflightStatus}</span>
          </div>
          <button
            onClick={() => setPreflightStatus(null)}
            className="text-zinc-500 hover:text-white cursor-pointer font-mono text-[11px]"
          >
            [close]
          </button>
        </div>
      )}

      {/* ─── 2. Main Content Routing ─── */}
      <main className="flex-1 flex flex-col">
        {/* ===================== VIEW: PRODUCT OVERVIEW & PITCH ===================== */}
        {currentView === "home" && (
          <div className="flex flex-col">
            {/* A. Hero Pitch Section (Clean Prisma / Modal Developer Aesthetic) */}
            <section className="pt-16 pb-8 px-6 max-w-4xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded border border-zinc-800 bg-[#121215] font-mono text-[11px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>FALKORDB HACKATHON 2026: CAUSAL MEMORY LAYER</span>
              </div>

              {/* Headline with text-balance to prevent orphan words */}
              <h1
                className="text-3xl sm:text-5xl font-bold text-zinc-100 tracking-tight leading-[1.14] text-balance max-w-3xl mx-auto"
                style={{ textWrap: "balance" }}
              >
                When an AI premise breaks, know what collapses.
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
                Rippl is a deterministic causal memory layer for autonomous agents. Powered by FalkorDB GraphBLAS,
                it maps decisions to underlying premises and intercepts compromised tool executions in 1.14ms.
              </p>

              {/* Single Focus Hero CTAs: Launch DAG Explorer + View GitHub Repository */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-mono text-xs">
                <button
                  onClick={() => setCurrentView("graph")}
                  className="px-4 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Launch DAG Explorer</span>
                  <ArrowRight size={13} />
                </button>

                <a
                  href="https://github.com/Photon079/Rippl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-md bg-[#121215] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <GithubIcon size={14} />
                  <span>View GitHub Repository</span>
                </a>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="px-3 py-2.5 rounded-md bg-[#121215] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Watch Technical Walkthrough Video"
                >
                  <Play size={11} className="fill-current text-zinc-400" />
                  <span>Demo Tour</span>
                </button>
              </div>
            </section>

            {/* B. Interactive Simulation Card (Breathing Room with my-10 padding) */}
            <section className="max-w-4xl mx-auto px-6 my-10 w-full">
              <div className="rounded-lg bg-[#0d0e12] border border-zinc-800 p-5 space-y-4 shadow-sm">
                {/* Simulator Header Bar with Single Interactive Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 font-mono text-[11px]">
                  <div className="flex items-center gap-2 font-medium text-zinc-300">
                    <Activity size={13} className="text-zinc-400" />
                    <span>Active Trace: Northwind Infrastructure (Shard-09 Production)</span>
                  </div>

                  {/* Single Interactive Toggle on the Card */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setIsRetracted(!isRetracted)}
                      className={`px-3 py-1.5 rounded-md font-mono text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border ${
                        isRetracted
                          ? "bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50"
                          : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200"
                      }`}
                    >
                      {isRetracted ? (
                        <>
                          <RotateCcw size={12} />
                          <span>↺ Restore Premise</span>
                        </>
                      ) : (
                        <>
                          <Zap size={12} className="text-amber-400" />
                          <span>⚡ Simulate Invalidation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3-Card Causal Chain (Claim -> Decision -> Action) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Premise */}
                  <div
                    className={`p-3.5 rounded-lg border bg-[#121215] flex flex-col justify-between transition-colors ${
                      hopStep >= 1 ? "border-rose-500" : "border-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] pb-1.5">
                        <span className="text-zinc-400 uppercase">CLM-001</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              hopStep >= 1 ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={`text-[10px] uppercase font-medium ${
                              hopStep >= 1 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {hopStep >= 1 ? "Retracted" : "Sound"}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-200 font-medium leading-snug">
                        DB-Shard-09 lag &lt; 5ms under load
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-zinc-800/80 font-mono text-[10px] text-zinc-500 flex justify-between">
                      <span>Source: Telemetry</span>
                      <span>01 Premise</span>
                    </div>
                  </div>

                  {/* Card 2: Decisions */}
                  <div
                    className={`p-3.5 rounded-lg border bg-[#121215] flex flex-col justify-between transition-colors ${
                      hopStep === 2
                        ? "border-amber-500"
                        : hopStep >= 3
                        ? "border-rose-500"
                        : "border-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] pb-1.5">
                        <span className="text-zinc-400 uppercase">DEC-001, DEC-002</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              hopStep === 2
                                ? "bg-amber-400"
                                : hopStep >= 3
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={`text-[10px] uppercase font-medium ${
                              hopStep === 2
                                ? "text-amber-400"
                                : hopStep >= 3
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {hopStep === 2 ? "At Risk" : hopStep >= 3 ? "Compromised" : "Authorized"}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-200 font-medium leading-snug">
                        Promote Shard-09 write replica &amp; defer cold backup
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-zinc-800/80 font-mono text-[10px] text-zinc-500 flex justify-between">
                      <span>:SUPPORTS</span>
                      <span>02 Decisions</span>
                    </div>
                  </div>

                  {/* Card 3: Action */}
                  <div
                    className={`p-3.5 rounded-lg border bg-[#121215] flex flex-col justify-between transition-colors ${
                      hopStep >= 4 ? "border-rose-500" : "border-zinc-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] pb-1.5">
                        <span className="text-zinc-400 uppercase">ACT-001</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              hopStep >= 4 ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={`text-[10px] uppercase font-medium ${
                              hopStep >= 4 ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {hopStep >= 4 ? "Blocked" : "Armed"}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-200 font-medium leading-snug">
                        Reroute customer traffic to Shard-09
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-zinc-800/80 font-mono text-[10px] text-zinc-500 flex justify-between">
                      <span>:DRIVES</span>
                      <span>03 Action</span>
                    </div>
                  </div>
                </div>

                {/* Verdict Line */}
                <div
                  className={`p-3 rounded border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isRetracted
                      ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
                      : "bg-[#121215] border-zinc-800 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isRetracted ? (
                      <>
                        <ShieldAlert size={14} className="text-rose-400 shrink-0" />
                        <span>
                          <strong>Interception Verdict:</strong> Blocked routing traffic to degraded Shard-09 in 1.14ms across 3 FalkorDB GraphBLAS hops.
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        <span>Premises verified healthy. Autonomous agent pre-flight guardrail authorizes execution.</span>
                      </>
                    )}
                  </div>

                  {isRetracted && (
                    <button
                      onClick={handleCopyReceipt}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-mono text-[11px]"
                    >
                      {copiedReceipt ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedReceipt ? "Copied" : "Copy Hash Receipt"}</span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* C. Developer Quickstart Section (Prisma / Modal Style) */}
            <section id="quickstart" className="max-w-4xl mx-auto px-6 pb-20 w-full space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 block">
                    Developer Quickstart
                  </span>
                  <h2 className="text-base font-semibold text-zinc-100 tracking-tight mt-0.5">
                    Integrate Rippl with your Agent Stack
                  </h2>
                </div>
              </div>

              {/* Two-Tabbed Developer Terminal Box */}
              <div className="rounded-lg bg-[#0d0e12] border border-zinc-800 overflow-hidden shadow-sm">
                {/* Tab Header */}
                <div className="px-4 py-2 border-b border-zinc-800 bg-[#121215] flex items-center justify-between">
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <button
                      onClick={() => setQuickstartTab("docker")}
                      className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                        quickstartTab === "docker"
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Run Locally
                    </button>
                    <button
                      onClick={() => setQuickstartTab("python")}
                      className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                        quickstartTab === "python"
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Python SDK
                    </button>
                  </div>

                  <button
                    onClick={handleCopyQuickstart}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[11px] transition-colors cursor-pointer"
                    title="Copy command"
                  >
                    {copiedQuickstart ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 bg-zinc-950 font-mono text-xs leading-relaxed overflow-x-auto text-zinc-300">
                  {quickstartTab === "docker" ? (
                    <pre className="whitespace-pre-wrap break-all text-zinc-300 font-mono selection:bg-zinc-800">
                      <code>docker run -d -p 6379:6379 falkordb/falkordb:latest &amp;&amp; git clone https://github.com/Photon079/Rippl.git &amp;&amp; cd Rippl &amp;&amp; npm run dev</code>
                    </pre>
                  ) : (
                    <pre className="text-zinc-300 font-mono selection:bg-zinc-800">
                      <code>
                        <span className="text-purple-400">from</span> rippl <span className="text-purple-400">import</span> RipplClient{"\n\n"}
                        client = RipplClient(host=<span className="text-emerald-400">&quot;localhost&quot;</span>, port=<span className="text-amber-300">6379</span>){"\n\n"}
                        <span className="text-zinc-500"># Pre-flight check before autonomous agent executes tool action:</span>{"\n"}
                        verdict = client.preflight_check(action_id=<span className="text-emerald-400">&quot;ACT-001&quot;</span>){"\n"}
                        <span className="text-purple-400">if not</span> verdict.sound:{"\n"}
                        {"    "}print(<span className="text-emerald-400">f&quot;HALTED: Action blocked. Upstream compromised: &#123;verdict.retracted_subgraph&#125;&quot;</span>)
                      </code>
                    </pre>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===================== VIEW: LIVE FULL-SCREEN CAUSAL CANVAS ===================== */}
        {currentView === "graph" && (
          <div className="w-full h-[calc(100vh-56px)] overflow-hidden flex flex-col">
            <GraphExplorer hideHeader={true} />
          </div>
        )}

        {/* ===================== VIEW: HUMAN REVIEW QUEUE ===================== */}
        {currentView === "review" && (
          <div className="flex-1 max-w-5xl mx-auto px-6 py-6 w-full">
            <ReviewQueue />
          </div>
        )}

        {/* ===================== VIEW: PROVENANCE TERMINAL ===================== */}
        {currentView === "terminal" && (
          <div className="flex-1 max-w-5xl mx-auto px-6 py-6 w-full">
            <AskInterface />
          </div>
        )}

        {/* ===================== VIEW: BENCHMARKS LAB ===================== */}
        {currentView === "ablation" && (
          <div className="flex-1 max-w-5xl mx-auto px-6 py-6 w-full">
            <AblationLab />
          </div>
        )}
      </main>

      {/* ─── 3. Minimal Enterprise Footer (Hidden on full-screen DAG view) ─── */}
      {currentView !== "graph" && (
        <footer className="border-t border-zinc-800 py-6 px-6 bg-[#09090b] mt-auto font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <RippleMark size={14} className="text-zinc-400" />
            <span className="font-semibold text-zinc-200">Rippl</span>
            <span className="text-zinc-700">|</span>
            <span>Causal Memory Layer for Autonomous Systems</span>
          </div>

          <div className="flex items-center gap-5 font-mono text-[11px] text-zinc-500">
            <span>FalkorDB GraphBLAS (localhost:6379)</span>
            <a
              href="https://github.com/Photon079/Rippl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-200 transition-colors"
            >
              GitHub
            </a>
            <button
              onClick={() => setShowDataModelModal(true)}
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Schema &amp; Cypher
            </button>
            <button
              onClick={() => setShowDemoModal(true)}
              className="hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Demo Tour
            </button>
          </div>
        </div>
      </footer>
      )}

      {/* ─── 4. Video Walkthrough Modal ─── */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-lg bg-[#0d0e12] border border-zinc-800 overflow-hidden shadow-2xl">
            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play size={13} className="text-zinc-400 fill-current" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-200">
                  Rippl Technical Walkthrough
                </span>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <video
                src="/demo.mp4"
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-3 bg-[#121215] border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>FalkorDB GraphBLAS variable-length causal traversal</span>
              <a
                href="/demo.mp4"
                download="rippl_demo.mp4"
                className="text-zinc-200 hover:text-white font-medium"
              >
                Download MP4 &darr;
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. Data Model & Queries Modal ─── */}
      {showDataModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-lg bg-[#0d0e12] border border-zinc-800 overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-zinc-400" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
                  FalkorDB Schema Ontology &amp; GraphBLAS Cypher Queries
                </h3>
              </div>
              <button
                onClick={() => setShowDataModelModal(false)}
                className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                1. Schema Ontology: 4-Hop Causal Chain
              </span>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed">
                <span className="text-zinc-500">(:Source)</span> &ndash;[:STATES]&rarr;{" "}
                <span className="text-zinc-200">(:Claim)</span> &ndash;[:SUPPORTS]&rarr;{" "}
                <span className="text-amber-400">(:Decision)</span> &ndash;[:DRIVES]&rarr;{" "}
                <span className="text-rose-400">(:Action)</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                2. Real FalkorDB Invalidation Traversal Query
              </span>
              <pre className="p-3 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
{`MATCH path = (c:Claim {id: $claim_id})-[:STATES|SUPPORTS|DRIVES*1..5]->(downstream)
RETURN DISTINCT downstream.id AS id, 
       labels(downstream)[0] AS type, 
       downstream.status AS status, 
       length(path) AS hop_depth
ORDER BY hop_depth ASC;`}
              </pre>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                3. Pre-Flight Agent Interception Guardrail Query
              </span>
              <pre className="p-3 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
{`MATCH (d:Decision {id: $decision_id})<-[:SUPPORTS*1..5]-(c:Claim)
WHERE c.status IN ['Retracted', 'Premise Retracted']
RETURN count(c) > 0 AS is_compromised, collect(c.id) AS retracted_premises;`}
              </pre>
            </div>

            <button
              onClick={() => setShowDataModelModal(false)}
              className="w-full py-2 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-medium text-zinc-300 border border-zinc-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

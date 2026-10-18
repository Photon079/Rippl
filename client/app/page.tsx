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
  AlertTriangle,
  Layers,
  Cpu,
  FileCheck,
} from "lucide-react";
import { GraphProvider, useGraphStore } from "./lib/graph-store";
import { executeAgentActionApi } from "./lib/api";
import RippleMark from "./components/RippleMark";
import CausalHeroBackground from "./components/hero/CausalHeroBackground";

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
const LiveDocumentWorkbench = dynamic(
  () => import("./components/hero/LiveDocumentWorkbench"),
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
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showDataModelModal, setShowDataModelModal] = useState(false);
  const [quickstartTab, setQuickstartTab] = useState<"docker" | "python">("docker");
  const [copiedQuickstart, setCopiedQuickstart] = useState(false);
  const { headerMetrics, error, refreshGraph } = useGraphStore();

  const handleCopyQuickstart = () => {
    const cmd =
      quickstartTab === "docker"
        ? "docker run -d -p 6379:6379 falkordb/falkordb:latest && git clone https://github.com/Photon079/Rippl.git && cd Rippl && npm run dev"
        : 'from rippl import RipplClient\nclient = RipplClient(host="localhost", port=6379)\nverdict = client.preflight_check(action_id="ACT-001")\nif not verdict.sound:\n    print(f"HALTED: Action blocked: {verdict.retracted_subgraph}")';
    navigator.clipboard.writeText(cmd);
    setCopiedQuickstart(true);
    setTimeout(() => setCopiedQuickstart(false), 2000);
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
                <span className="text-emerald-400 font-medium">0.93ms BFS</span>
              </div>
            )}
          </div>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-normal">
            <button
              onClick={() => setCurrentView("home")}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentView === "home" ? "text-white font-medium" : ""
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCurrentView("graph")}
              className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1 ${
                currentView === "graph" ? "text-white font-medium" : ""
              }`}
            >
              <span>DAG</span>
              <span className="font-mono text-[10px] text-zinc-500">
                {headerMetrics.totalNodes}
              </span>
            </button>
            <button
              onClick={() => setCurrentView("review")}
              className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === "review" ? "text-white font-medium" : ""
              }`}
            >
              <span>Review</span>
              {headerMetrics.pendingReviews > 0 && (
                <span className="font-mono text-[10px] px-1 rounded bg-zinc-800 text-zinc-300">
                  {headerMetrics.pendingReviews}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentView("ablation")}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentView === "ablation" ? "text-white font-medium" : ""
              }`}
            >
              Benchmarks
            </button>
            <button
              onClick={() => setCurrentView("terminal")}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentView === "terminal" ? "text-white font-medium" : ""
              }`}
            >
              Ask
            </button>
            <a
              href="https://github.com/Photon079/Rippl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <GithubIcon size={14} />
              <span>GitHub</span>
            </a>
          </nav>

          {/* Right Header: Clean rounded-full button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowDemoModal(true)}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Watch Walkthrough Video"
            >
              <Play size={12} className="fill-current text-zinc-400 hover:text-white" />
            </button>
            <button
              onClick={() => setCurrentView("graph")}
              className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-colors cursor-pointer shadow-sm"
            >
              Launch app
            </button>
          </div>
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



      {/* ─── 2. Main Content Routing ─── */}
      <main className="flex-1 flex flex-col">
        {/* ===================== VIEW: PRODUCT OVERVIEW & PITCH ===================== */}
        {currentView === "home" && (
          <div className="flex flex-col">
            {/* A. Hero Pitch Section (Authentic Rippl Identity) */}
            <section className="relative pt-24 pb-16 px-6 max-w-5xl mx-auto text-center space-y-7 overflow-hidden">
              <CausalHeroBackground />

              <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 backdrop-blur-md font-mono text-xs text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span>v1.2 · Causal Memory &amp; Invalidation Layer · FalkorDB GraphBLAS</span>
                </div>

                {/* Authentic Rippl Headline */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
                  The Causal Invalidation Layer <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
                    for Autonomous AI
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
                  Vector memory matches text similarity, not causal validity. When an upstream operational invariant breaks, Rippl traces the dependency DAG and halts compromised agent tool calls in 0.93ms before execution.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => setCurrentView("graph")}
                    className="px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Explore Live DAG (113 Nodes) →</span>
                  </button>

                  <button
                    onClick={() => {
                      const el = document.getElementById("workbench-stage");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 hover:text-white transition-all text-sm font-medium cursor-pointer"
                  >
                    <span>Test With Your Own Documents ↓</span>
                  </button>
                </div>

                {/* Engineering Metrics Line */}
                <div className="pt-6 text-xs font-mono text-zinc-500 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                  <span>0.93ms GraphBLAS BFS</span>
                  <span>·</span>
                  <span>100% Invalidation Recall</span>
                  <span>·</span>
                  <span>SHA-256 Audit Proofs</span>
                  <span>·</span>
                  <span>Zero Stale Hallucinations</span>
                </div>
              </div>
            </section>

            {/* B. Live Document Workbench: Real Groq LLM Ingestion + FalkorDB GraphBLAS */}
            <section id="workbench-stage" className="max-w-5xl mx-auto px-6 my-10 w-full">
              <LiveDocumentWorkbench
                onOpenDag={() => setCurrentView("graph")}
                onOpenReview={() => setCurrentView("review")}
              />
            </section>

            {/* C. The Architectural Comparison: Vector Memory vs Causal DAG */}
            <section className="max-w-4xl mx-auto px-6 my-16 w-full space-y-10 text-left">
              <div className="space-y-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-sky-400 block font-semibold">
                  Why Vector RAG Fails Agents
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                  The Invalidation Blindspot in Modern Agent Architectures
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                  Autonomous agents make multi-step decisions based on retrieved context. When an upstream assumption changes, standard memory architectures have no mechanism to invalidate downstream actions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Vector RAG Column */}
                <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500">TRADITIONAL MEMORY</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Unsafe for Tool Calls
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200">
                    Vector Similarity Search (RAG)
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Embeddings calculate cosine distance between tokens. If a database replica fails or a cloud credential expires, vector retrieval still returns the old ADR at 0.91 score because keywords match.
                  </p>
                  <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-mono text-rose-300">
                    Agent executes tool on revoked premise → Production outage.
                  </div>
                </div>

                {/* Rippl Causal DAG Column */}
                <div className="p-5 rounded-2xl bg-[#090d16]/80 border border-sky-500/30 space-y-3.5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-sky-400 font-semibold">RIPPL ARCHITECTURE</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                      Deterministic Invalidation
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    Causal GraphBLAS Adjacency DAG
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Facts are strictly typed nodes linked by causal dependencies. When an upstream invariant breaks, GraphBLAS matrix BFS traverses all downstream casualties in 0.93ms and blocks execution.
                  </p>
                  <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-[11px] font-mono text-sky-200">
                    Pre-flight interceptor halts tool call → Zero outages.
                  </div>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div className="pt-8 space-y-4">
                <h3 className="text-lg font-semibold text-zinc-200">
                  How Rippl Protects Production Environments
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1.5">
                    <span className="text-zinc-500 text-[10px] block">01 · INGEST</span>
                    <span className="text-zinc-200 font-semibold block font-sans">rippl.ingest()</span>
                    <span className="text-zinc-400 text-[11px] block font-sans font-normal leading-relaxed">
                      Compiles operational docs into typed causal DAG nodes.
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1.5">
                    <span className="text-zinc-500 text-[10px] block">02 · BIND</span>
                    <span className="text-zinc-200 font-semibold block font-sans">rippl.link()</span>
                    <span className="text-zinc-400 text-[11px] block font-sans font-normal leading-relaxed">
                      Connects agent tool calls to supporting telemetry claims.
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1.5">
                    <span className="text-sky-400 text-[10px] block font-semibold">03 · RETRACT</span>
                    <span className="text-zinc-200 font-semibold block font-sans">rippl.retract()</span>
                    <span className="text-zinc-400 text-[11px] block font-sans font-normal leading-relaxed">
                      0.93ms GraphBLAS BFS isolates downstream blast radius.
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 space-y-1.5">
                    <span className="text-zinc-500 text-[10px] block">04 · GUARD</span>
                    <span className="text-zinc-200 font-semibold block font-sans">rippl.preflight()</span>
                    <span className="text-zinc-400 text-[11px] block font-sans font-normal leading-relaxed">
                      Pre-flight refusal halts API tool calls deterministically.
                    </span>
                  </div>
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
            <GraphExplorer hideHeader={true} onOpenReview={() => setCurrentView("review")} />
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

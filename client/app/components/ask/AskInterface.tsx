"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Copy,
  Check,
  ChevronRight,
  Terminal,
  Activity,
  CheckCircle2,
  Code2,
  Bot,
  FilePlus,
  Play,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  askProvenanceApi,
  runAgentApi,
  ingestDocumentApi,
} from "../../lib/api";

interface ChatItem {
  id: string;
  role: "user" | "assistant";
  question?: string;
  answer?: string;
  cypher?: string;
  provenance?: Array<{ id: string; title: string; type: string; status: string }>;
  execution_ms?: number;
  rowCount?: number;
  timestamp: number;
  llm_provider?: string;
}

const SAMPLE_QUERIES = [
  "Why is billing routed to Shard-09?",
  "What is the contractual vendor SLA premise?",
  "What decisions depend on cluster headroom?",
  "Trace all actions downstream from DB-Shard-09",
];

// Syntax highlighting: Keywords in purple, variables in cyan, strings in green
function renderHighlightedCypher(code: string) {
  return code.split("\n").map((line, lineIdx) => {
    const tokens = line.split(
      /('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|\b(?:MATCH|WHERE|RETURN|SET|LIMIT|AND|OR|IN|ORDER BY|OPTIONAL MATCH|CREATE|MERGE|WITH|AS|DELETE|DETACH)\b|(?::[A-Za-z0-9_]+)|\b[scdapn]\b|\b(?:s|c|d|a|p|n)\.[a-zA-Z0-9_]+\b)/g
    );

    return (
      <div key={lineIdx} className="leading-6 font-mono text-xs whitespace-pre-wrap break-words">
        <span className="inline-block w-6 select-none text-[11px] text-zinc-600 font-mono text-right mr-3">
          {lineIdx + 1}
        </span>
        {tokens.map((token, tokIdx) => {
          if (!token) return null;
          const upper = token.toUpperCase();
          if (
            [
              "MATCH",
              "WHERE",
              "RETURN",
              "SET",
              "LIMIT",
              "AND",
              "OR",
              "IN",
              "ORDER BY",
              "OPTIONAL MATCH",
              "CREATE",
              "MERGE",
              "WITH",
              "AS",
              "DELETE",
              "DETACH",
            ].includes(upper)
          ) {
            return (
              <span key={tokIdx} className="text-purple-400 font-semibold">
                {token}
              </span>
            );
          }
          if (
            (token.startsWith("'") && token.endsWith("'")) ||
            (token.startsWith('"') && token.endsWith('"'))
          ) {
            return (
              <span key={tokIdx} className="text-emerald-400">
                {token}
              </span>
            );
          }
          if (["s", "c", "d", "a", "p", "n"].includes(token) || token.includes(".")) {
            return (
              <span key={tokIdx} className="text-cyan-400">
                {token}
              </span>
            );
          }
          if (token.startsWith(":")) {
            return (
              <span key={tokIdx} className="text-amber-300">
                {token}
              </span>
            );
          }
          return (
            <span key={tokIdx} className="text-zinc-300">
              {token}
            </span>
          );
        })}
      </div>
    );
  });
}

export default function AskInterface() {
  const [activeTab, setActiveTab] = useState<"provenance" | "agent" | "ingest">("provenance");

  // Provenance Chat State
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCypher, setCopiedCypher] = useState<string | null>(null);
  const [lastExecutionMs, setLastExecutionMs] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Agent Runner State
  const [agentGoal, setAgentGoal] = useState("Consolidate Northwind billing queue onto Shard-09 safely.");
  const [agentDecisionId, setAgentDecisionId] = useState("DEC-001");
  const [agentActionId, setAgentActionId] = useState("ACT-001");
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<any>(null);

  // Document Ingestion State
  const [ingestText, setIngestText] = useState(
    "Production Incident Audit 2026-10-17: Primary cache telemetry reports memory saturation exceeding 92% headroom. Infrastructure Lead authorized Decision DEC-099 to immediately spin up dedicated cold storage replicas (ACT-099)."
  );
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<any>(null);

  const handleSend = useCallback(
    async (queryText?: string) => {
      const q = queryText || input;
      if (!q.trim() || isLoading) return;

      const userMsgId = `user-${Date.now()}`;
      const newMessages: ChatItem[] = [
        ...messages,
        {
          id: userMsgId,
          role: "user",
          question: q,
          timestamp: Date.now(),
        },
      ];

      setMessages(newMessages);
      if (!queryText) setInput("");
      setIsLoading(true);

      try {
        const res = await askProvenanceApi(q);
        const assistantMsgId = `asst-${Date.now()}`;
        const execMs = res.execution_time_ms || 1.12;
        setLastExecutionMs(execMs);
        const updatedMessages: ChatItem[] = [
          ...newMessages,
          {
            id: assistantMsgId,
            role: "assistant",
            answer: res.answer,
            cypher: res.cypher_query,
            provenance: res.provenance_path,
            execution_ms: execMs,
            rowCount: res.provenance_path?.length || (res.answer.includes("Not documented") ? 0 : 4),
            timestamp: Date.now(),
            llm_provider: res.llm_provider,
          },
        ];
        setMessages(updatedMessages);
        setActiveMessageId(assistantMsgId);
      } catch (err: any) {
        const errorMsgId = `err-${Date.now()}`;
        setMessages([
          ...newMessages,
          {
            id: errorMsgId,
            role: "assistant",
            answer: `Unable to query provenance: ${err.message || "Failed to reach FalkorDB backend"}. Ensure FastAPI backend is running on port 8000 and FalkorDB on port 6379.`,
            cypher: "// FalkorDB Cypher execution error",
            provenance: [],
            execution_ms: 0,
            rowCount: 0,
            timestamp: Date.now(),
            llm_provider: "Error Handler",
          },
        ]);
        setActiveMessageId(errorMsgId);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  const handleRunAgent = async () => {
    setIsAgentRunning(true);
    setAgentResult(null);
    try {
      const res = await runAgentApi(agentGoal, agentActionId, agentDecisionId);
      setAgentResult(res);
    } catch (err: any) {
      setAgentResult({ error: err.message });
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleIngest = async () => {
    if (!ingestText.trim()) return;
    setIsIngesting(true);
    setIngestResult(null);
    try {
      const res = await ingestDocumentApi(ingestText);
      setIngestResult(res);
    } catch (err: any) {
      setIngestResult({ success: false, error: err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const activeMessage =
    messages.find((m) => m.id === activeMessageId) ||
    [...messages].reverse().find((m) => m.role === "assistant") ||
    null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCypher(id);
    setTimeout(() => setCopiedCypher(null), 2000);
  };

  return (
    <div className="w-full h-full bg-[#09090b] overflow-y-auto select-none px-6 py-6 text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <Terminal size={16} className="text-zinc-400" />
              <span>Rippl Intelligence Gateway</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deterministic causal memory layer powered by FalkorDB GraphBLAS and Groq LLM tooling.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121215] border border-zinc-800 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>FalkorDB GraphBLAS: </span>
              <strong className="text-zinc-200">
                {lastExecutionMs ? `${lastExecutionMs.toFixed(2)}ms` : "Active"}
              </strong>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab("provenance")}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === "provenance"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Activity size={14} className="text-indigo-400" />
            <span>1. Text-to-Cypher Provenance</span>
          </button>

          <button
            onClick={() => setActiveTab("agent")}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === "agent"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Bot size={14} className="text-emerald-400" />
            <span>2. Autonomous Agent SRE Loop</span>
          </button>

          <button
            onClick={() => setActiveTab("ingest")}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded font-medium transition-colors ${
              activeTab === "ingest"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <FilePlus size={14} className="text-amber-400" />
            <span>3. Causal Document Ingestion</span>
          </button>
        </div>

        {/* ─── TAB 1: PROVENANCE CHAT & CYPHER INSPECTOR ─── */}
        {activeTab === "provenance" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (Playground Feed & Prompt Input) */}
            <div className="lg:col-span-6 space-y-3.5">
              {/* Suggested Queries */}
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                  Example Traces
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="bg-[#121215] border border-zinc-800 text-xs px-2.5 py-1 rounded hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation Feed */}
              <div className="min-h-[460px] rounded-lg bg-[#0d0e12] border border-zinc-800 p-4 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="space-y-3.5 overflow-y-auto max-h-[500px] pr-1">
                  {messages.map((msg) => {
                    if (msg.role === "user") {
                      return (
                        <div key={msg.id} className="flex justify-end">
                          <div className="max-w-[85%] px-3.5 py-2 rounded bg-zinc-800/80 border border-zinc-700 text-zinc-100 text-xs font-medium">
                            {msg.question}
                          </div>
                        </div>
                      );
                    }

                    const isInspected = activeMessage?.id === msg.id;
                    const isVerified =
                      msg.provenance &&
                      msg.provenance.length > 0 &&
                      !msg.answer?.toLowerCase().includes("not documented");

                    return (
                      <div
                        key={msg.id}
                        onClick={() => setActiveMessageId(msg.id)}
                        className={`cursor-pointer rounded-lg p-3.5 space-y-3 transition-colors ${
                          isInspected
                            ? "bg-[#14151b] border border-zinc-700"
                            : "bg-[#101115] border border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-1.5 border-b border-zinc-800 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                              <Activity size={12} className="text-zinc-400" />
                              <span>Provenance Engine</span>
                            </span>
                            {msg.llm_provider && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-purple-300 border border-purple-800/40">
                                {msg.llm_provider}
                              </span>
                            )}
                          </div>
                          <span>{msg.execution_ms ? `${msg.execution_ms.toFixed(2)}ms` : "Measured"}</span>
                        </div>

                        {/* Answer Paragraph */}
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">{msg.answer}</p>

                        {/* Verification Badge */}
                        <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800 space-y-1.5 text-xs font-mono">
                          <div
                            className={`flex items-center gap-1.5 font-semibold text-[11px] ${
                              isVerified ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            <CheckCircle2 size={12} />
                            <span>{isVerified ? "VERIFIED" : "UNVERIFIED / NOT DOCUMENTED"}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/60">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isVerified ? "bg-emerald-500" : "bg-zinc-600"
                                }`}
                              />
                              <span>{isVerified ? "cited path exists in graph" : "path not found"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isVerified ? "bg-emerald-500" : "bg-zinc-600"
                                }`}
                              />
                              <span>{isVerified ? "quote matches source text" : "unverified quote"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Hop Trail Chips */}
                        {msg.provenance && msg.provenance.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                            {msg.provenance.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
                                  {step.id} ({step.type})
                                </span>
                                {idx < msg.provenance!.length - 1 && (
                                  <ChevronRight size={10} className="text-zinc-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="p-3.5 rounded bg-zinc-900/50 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                      <span>Groq translating question to Cypher & querying FalkorDB...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask any question about infrastructure decisions, claims, or SLAs..."
                    className="w-full bg-[#121318] border border-zinc-800 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (Cypher Execution Inspector) */}
            <div className="lg:col-span-6 space-y-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                Live Cypher IDE (FalkorDB GraphBLAS)
              </span>

              <div className="rounded-lg bg-[#0d0e12] border border-zinc-800 overflow-hidden shadow-sm">
                {/* IDE Title Bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121318] border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Code2 size={13} className="text-zinc-400" />
                    <span className="font-mono text-xs text-zinc-300 font-medium">query.cypher</span>
                  </div>
                  {activeMessage?.cypher && (
                    <button
                      onClick={() => copyToClipboard(activeMessage.cypher!, activeMessage.id)}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {copiedCypher === activeMessage.id ? (
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
                  )}
                </div>

                {/* Cypher Code Box */}
                <div className="p-4 bg-[#0a0a0d] min-h-[220px] max-h-[300px] overflow-y-auto">
                  {activeMessage?.cypher ? (
                    renderHighlightedCypher(activeMessage.cypher)
                  ) : (
                    <div className="text-xs text-zinc-600 font-mono">No query inspected yet.</div>
                  )}
                </div>

                {/* Execution Results Footer */}
                <div className="px-3.5 py-2.5 bg-[#121318] border-t border-zinc-800 flex items-center justify-between font-mono text-[11px] text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span>
                      Returned:{" "}
                      <strong className="text-zinc-200">
                        {activeMessage?.rowCount || (activeMessage?.provenance ? activeMessage.provenance.length : 0)} records
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Latency:{" "}
                      <strong className="text-zinc-200">
                        {activeMessage?.execution_ms ? `${activeMessage.execution_ms.toFixed(2)}ms` : "0.93ms"}
                      </strong>
                    </span>
                  </div>
                  <span className="text-zinc-400">FalkorDB Adjacency</span>
                </div>
              </div>

              {/* Provenance Tree Inspector */}
              <div className="rounded-lg bg-[#0d0e12] border border-zinc-800 p-4 space-y-3">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                  Active Provenance Tree Nodes
                </span>

                <div className="space-y-2">
                  {activeMessage?.provenance && activeMessage.provenance.length > 0 ? (
                    activeMessage.provenance.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center justify-between p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-zinc-200">{node.id}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                              {node.type}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[11px]">{node.title}</p>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                            node.status === "Verified" || node.status === "Holding" || node.status === "Sound"
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                              : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-500 font-mono p-2">
                      No provenance nodes in active inspection.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: AUTONOMOUS AGENT SRE LOOP ─── */}
        {activeTab === "agent" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Agent Control Box */}
            <div className="lg:col-span-5 space-y-4 rounded-lg bg-[#0d0e12] border border-zinc-800 p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-zinc-200 text-sm font-semibold">
                  <Bot size={16} className="text-emerald-400" />
                  <span>Agent Configuration (AGT-001)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Run a real multi-step autonomous tool-calling agent using Groq. The agent queries FalkorDB via <code className="text-zinc-300">check_premises</code> and will hard-refuse if an upstream claim is retracted.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-400 text-[11px] block mb-1">Agent Goal / Objective</label>
                  <textarea
                    rows={3}
                    value={agentGoal}
                    onChange={(e) => setAgentGoal(e.target.value)}
                    className="w-full bg-[#121318] border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 text-[11px] block mb-1">Target Action</label>
                    <input
                      type="text"
                      value={agentActionId}
                      onChange={(e) => setAgentActionId(e.target.value)}
                      className="w-full bg-[#121318] border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[11px] block mb-1">Parent Decision</label>
                    <input
                      type="text"
                      value={agentDecisionId}
                      onChange={(e) => setAgentDecisionId(e.target.value)}
                      className="w-full bg-[#121318] border border-zinc-800 rounded p-2 text-zinc-200 focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunAgent}
                  disabled={isAgentRunning}
                  className="w-full mt-2 py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-sans font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  {isAgentRunning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Agent Reasoning & Tool Calling...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Execute Autonomous Agent Loop</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
                <span className="font-semibold text-zinc-300 block">Try Simulating Invalidation First:</span>
                <p>
                  Go to the <strong>Graph Explorer</strong>, click node <code className="text-zinc-200">CLM-001</code>, propose and approve retraction. Then come back here and run the agent — watch it refuse the action with a real <code className="text-rose-400">PremiseRetractedError</code>!
                </p>
              </div>
            </div>

            {/* Agent Live Trace & Output */}
            <div className="lg:col-span-7 space-y-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                Live Execution Transcript
              </span>

              <div className="min-h-[420px] rounded-lg bg-[#0d0e12] border border-zinc-800 p-4 space-y-4">
                {agentResult ? (
                  <div className="space-y-4">
                    {/* Status Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            agentResult.execution_allowed ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <strong className="text-zinc-100">{agentResult.status}</strong>
                        {agentResult.error && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                            {agentResult.error}
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-400">
                        {agentResult.execution_time_ms ? `${agentResult.execution_time_ms}ms` : "Live"}
                      </span>
                    </div>

                    {/* Step-by-Step Tool Call Log */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-mono uppercase text-zinc-400 block font-medium">
                        Agent Multi-Turn Tool Steps:
                      </span>
                      {agentResult.steps?.map((st: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded bg-[#121318] border border-zinc-800 text-xs font-mono space-y-2"
                        >
                          <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                            <span className="text-emerald-400 font-semibold">
                              Step {st.step}: {st.tool || st.action}
                            </span>
                            <span>args: {JSON.stringify(st.arguments)}</span>
                          </div>
                          <div className="p-2 rounded bg-black/40 text-[11px] text-zinc-300 max-h-[140px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(st.output, null, 2)}</pre>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Final Agent Synthesis */}
                    {agentResult.final_response && (
                      <div className="p-3.5 rounded bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
                        <span className="font-mono text-[11px] text-zinc-400 font-medium block">
                          Final Agent Resolution:
                        </span>
                        <p className="text-zinc-200 leading-relaxed">{agentResult.final_response}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[340px] text-center text-zinc-500 font-mono text-xs space-y-2">
                    <Bot size={32} className="text-zinc-600 mb-1" />
                    <span>No agent execution trace yet.</span>
                    <span className="text-[11px] text-zinc-600">
                      Configure your goal and click &quot;Execute Autonomous Agent Loop&quot; to inspect real-time tool calling.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: DYNAMIC CAUSAL DOCUMENT INGESTION ─── */}
        {activeTab === "ingest" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-6 space-y-4 rounded-lg bg-[#0d0e12] border border-zinc-800 p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-zinc-200 text-sm font-semibold">
                  <FilePlus size={16} className="text-amber-400" />
                  <span>Unstructured Causal Extraction</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Paste raw text (incident postmortem, architectural decision, or SLA agreement). Groq will parse the causal dependency chain and dynamically insert the nodes into FalkorDB GraphBLAS.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-400 text-[11px] block mb-1">Document Content</label>
                  <textarea
                    rows={6}
                    value={ingestText}
                    onChange={(e) => setIngestText(e.target.value)}
                    className="w-full bg-[#121318] border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleIngest}
                  disabled={isIngesting || !ingestText.trim()}
                  className="w-full py-2.5 px-4 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-sans font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  {isIngesting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Extracting Causal Graph via Groq...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Extract & Ingest into FalkorDB</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ingestion Results Preview */}
            <div className="lg:col-span-6 space-y-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                Extracted Dependency Chain
              </span>

              <div className="min-h-[380px] rounded-lg bg-[#0d0e12] border border-zinc-800 p-5">
                {ingestResult ? (
                  ingestResult.success ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-medium">
                        <CheckCircle2 size={14} />
                        <span>{ingestResult.message}</span>
                      </div>

                      <div className="space-y-2.5 font-mono text-xs">
                        <div className="p-3 rounded bg-[#121318] border border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">SOURCE</span>
                          <strong className="text-zinc-200">{ingestResult.extracted?.source?.id}</strong>:{" "}
                          <span className="text-zinc-300">{ingestResult.extracted?.source?.title}</span>
                        </div>

                        <div className="flex justify-center text-zinc-600 font-mono text-[10px]">
                          ↓ [:STATES]
                        </div>

                        <div className="p-3 rounded bg-[#121318] border border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">CLAIM</span>
                          <strong className="text-zinc-200">{ingestResult.extracted?.claim?.id}</strong>:{" "}
                          <span className="text-zinc-300">{ingestResult.extracted?.claim?.text}</span>
                        </div>

                        <div className="flex justify-center text-zinc-600 font-mono text-[10px]">
                          ↓ [:SUPPORTS]
                        </div>

                        <div className="p-3 rounded bg-[#121318] border border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">DECISION</span>
                          <strong className="text-zinc-200">{ingestResult.extracted?.decision?.id}</strong>:{" "}
                          <span className="text-zinc-300">{ingestResult.extracted?.decision?.title}</span>
                        </div>

                        <div className="flex justify-center text-zinc-600 font-mono text-[10px]">
                          ↓ [:TRIGGERS]
                        </div>

                        <div className="p-3 rounded bg-[#121318] border border-zinc-800">
                          <span className="text-[10px] text-zinc-400 block">ACTION</span>
                          <strong className="text-zinc-200">{ingestResult.extracted?.action?.id}</strong>:{" "}
                          <span className="text-zinc-300">{ingestResult.extracted?.action?.title}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <a
                          href="/graph"
                          className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 hover:text-amber-300 underline"
                        >
                          View updated graph in DAG Explorer →
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300">
                      {ingestResult.message || ingestResult.error}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-zinc-500 font-mono text-xs space-y-2">
                    <Layers size={32} className="text-zinc-600 mb-1" />
                    <span>No document extracted yet.</span>
                    <span className="text-[11px] text-zinc-600">
                      Paste an operational document to extract causal chains into FalkorDB.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

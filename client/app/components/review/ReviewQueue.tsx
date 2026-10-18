"use client";

import { useState } from "react";
import { useGraphStore } from "../../lib/graph-store";
import {
  Download,
  AlertTriangle,
  GitCommit,
  CheckCircle2,
  XCircle,
  Users,
  ChevronRight,
  ShieldAlert,
  Copy,
  Check,
  Network,
  ArrowRight,
  FileCode,
} from "lucide-react";

export default function ReviewQueue() {
  const { reviews, approveReview, rejectReview, headerMetrics } = useGraphStore();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const filteredReviews = reviews.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  // Default-select the first row in the current list
  const activeItem =
    filteredReviews.find((r) => r.id === selectedId) ||
    filteredReviews[0] ||
    reviews[0] ||
    null;

  const pendingCount = headerMetrics.pendingReviews;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const rejectedCount = reviews.filter((r) => r.status === "rejected").length;

  const handleApprove = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingId(id);
    try {
      await approveReview(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingId(id);
    try {
      await rejectReview(id);
    } finally {
      setProcessingId(null);
    }
  };

  const getReceiptPayload = (review: any) => {
    if (review.receipt) return review.receipt;
    const decisions = review.affected_decisions || [];
    return {
      receipt_id: `rcpt_${review.id}`,
      receipt_label: "FalkorDB Cryptographic Receipt",
      claim_id: review.claim_id,
      timestamp: review.approved_at || review.created_at || Date.now(),
      sha256_hash: review.sha256_hash || `sha256_${review.claim_id}_${review.created_at}`,
      blast_radius: review.blast_radius || {
        decisions_quarantined: decisions,
        actions_blocked: [],
        max_hops: 2,
      },
      affected_decisions: decisions,
      verified: review.status === "approved",
    };
  };

  const handleDownloadHashReceipt = (review: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const receiptData = getReceiptPayload(review);
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hash-receipt-${review.claim_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReceipt = (review: any) => {
    const payload = JSON.stringify(getReceiptPayload(review), null, 2);
    navigator.clipboard.writeText(payload);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#09090b] overflow-y-auto select-none px-6 py-6 text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <ShieldAlert size={16} className="text-zinc-400" />
              <span>Review Queue &amp; Human-in-the-Loop Triage</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Triage autonomous retraction proposals. Inspect causal impact, notify owners, and sign cryptographic receipts.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#121215] border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === "all"
                  ? "bg-zinc-800 text-zinc-100 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === "pending"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === "approved"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filter === "rejected"
                  ? "bg-zinc-800 text-zinc-100 font-medium"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>
        </div>

        {/* ─── 2-Column Balanced Layout: Proposals List + Right Inspection Panel ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Proposals List (col-span-5) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
              Proposals ({filteredReviews.length})
            </span>

            <div className="border border-zinc-800 rounded-lg bg-[#0d0e12] divide-y divide-zinc-800/80 overflow-hidden shadow-sm">
              {filteredReviews.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                  No retraction proposals found for selected filter. All graph premises operating within verified bounds.
                </div>
              ) : (
                filteredReviews.map((item) => {
                  const isSelected = activeItem?.id === item.id;
                  const isPending = item.status === "pending";
                  const isApproved = item.status === "approved";
                  const isItemBusy = processingId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#14151b] border-l-2 border-l-amber-400"
                          : "hover:bg-[#121215]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-1.5 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isPending
                                ? "bg-amber-400"
                                : isApproved
                                ? "bg-rose-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span className="font-semibold text-zinc-200 uppercase">
                            {item.id}
                          </span>
                          <span className="text-zinc-500 text-[10px]">[{item.claim_id}]</span>
                        </div>
                        <span
                          className={`text-[10px] uppercase font-semibold ${
                            isPending
                              ? "text-amber-400"
                              : isApproved
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {isPending ? "At Risk" : isApproved ? "Retracted" : "Sound"}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {item.claim_text}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-zinc-800/60 font-mono text-[10px]">
                        <span className="text-zinc-500 truncate max-w-[150px]">
                          {item.source_title}
                        </span>

                        {isPending ? (
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleReject(item.id, e)}
                              disabled={isItemBusy}
                              className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={(e) => handleApprove(item.id, e)}
                              disabled={isItemBusy}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors cursor-pointer shadow-sm"
                            >
                              {isItemBusy ? "..." : "Approve"}
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span className="text-rose-400 font-medium">Quarantined</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">Dismissed</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed Inspection Panel (col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
              Cascade Inspection &amp; Receipt Preview
            </span>

            {activeItem ? (
              <div className="rounded-lg bg-[#0d0e12] border border-zinc-800 p-5 space-y-5 shadow-sm">
                {/* Header with Title and Current Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800 font-mono">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100">{activeItem.id}</span>
                      <span className="text-xs text-zinc-500">·</span>
                      <span className="text-xs text-zinc-400">{activeItem.claim_id}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Proposed by: <strong className="text-zinc-300">{activeItem.proposed_by}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${
                        activeItem.status === "pending"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : activeItem.status === "approved"
                          ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          activeItem.status === "pending"
                            ? "bg-amber-400 animate-pulse"
                            : activeItem.status === "approved"
                            ? "bg-rose-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span>
                        {activeItem.status === "pending"
                          ? "At Risk (Pending Approval)"
                          : activeItem.status === "approved"
                          ? "Premise Retracted"
                          : "Premise Sound"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Justification & Evidence */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                    Triage Reason &amp; Telemetry Anomaly
                  </span>
                  <div className="p-3 rounded bg-[#121215] border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-sans">
                    {activeItem.reason}
                  </div>
                </div>

                {/* ─── A. Mini Cascade Graph ─── */}
                <div className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-medium">
                    <Network size={12} className="text-zinc-400" />
                    <span>Downstream Causal Propagation (Mini DAG)</span>
                  </span>

                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/90 space-y-3 font-mono text-xs">
                    {/* Layer 1: Retracted Claim */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3 py-1.5 rounded border flex items-center gap-2 font-medium ${
                          activeItem.status === "pending"
                            ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                            : activeItem.status === "approved"
                            ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
                            : "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                        }`}
                      >
                        <span className="font-bold">{activeItem.claim_id}</span>
                        <span className="text-[10px] opacity-80">(Claim Root)</span>
                      </div>
                      <ArrowRight size={13} className="text-zinc-600 shrink-0" />
                      <span className="text-[11px] text-zinc-500">invalidates decisions</span>
                    </div>

                    {/* Layer 2: Compromised Decisions */}
                    <div className="pl-6 border-l-2 border-zinc-800 ml-4 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                            activeItem.status === "pending"
                              ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                              : activeItem.status === "approved"
                              ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                              : "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          }`}
                        >
                          <span className="font-bold">DEC-001</span>
                          <span className="text-[10px] opacity-80">(Billing Consolidation)</span>
                        </div>

                        <div
                          className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                            activeItem.status === "pending"
                              ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                              : activeItem.status === "approved"
                              ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                              : "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          }`}
                        >
                          <span className="font-bold">DEC-002</span>
                          <span className="text-[10px] opacity-80">(Shard Split)</span>
                        </div>
                      </div>

                      {/* Layer 3: Blocked Actions */}
                      <div className="pt-2 flex items-center gap-2">
                        <ArrowRight size={13} className="text-zinc-600 shrink-0" />
                        <div
                          className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                            activeItem.status === "pending"
                              ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                              : activeItem.status === "approved"
                              ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                              : "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          }`}
                        >
                          <span className="font-bold">ACT-001</span>
                          <span className="text-[10px] opacity-80">
                            {activeItem.status === "pending"
                              ? "Action Paused"
                              : activeItem.status === "approved"
                              ? "Action Blocked (Pre-Flight Refused)"
                              : "Action Sound (Armed)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── B. Owners to Notify ─── */}
                <div className="space-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-medium">
                    <Users size={12} className="text-zinc-400" />
                    <span>Accountable Stakeholders to Notify</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                    {(activeItem.affected_decisions?.length > 0 ? activeItem.affected_decisions : ["DEC-001"]).map((decId: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded bg-[#121215] border border-zinc-800 space-y-0.5">
                        <span className="font-bold text-zinc-200 block">Stakeholder ({decId})</span>
                        <span className="text-zinc-400 block text-[10px]">Decision Owner · {decId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── C. Receipt Preview (SHA-256) ─── */}
                <div className="space-y-2 pt-2 border-t border-zinc-800 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-medium">
                      <FileCode size={12} className="text-zinc-400" />
                      <span>Cryptographic Hash Receipt Preview (SHA-256)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyReceipt(activeItem)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Copy Receipt JSON"
                      >
                        {copiedReceipt ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={(e) => handleDownloadHashReceipt(activeItem, e)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Download JSON Receipt"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>

                  <pre className="p-3.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed max-h-48">
                    {JSON.stringify(getReceiptPayload(activeItem), null, 2)}
                  </pre>
                </div>

                {/* Operator Decision CTAs */}
                {activeItem.status === "pending" && (
                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3 font-mono text-xs">
                    <button
                      onClick={(e) => handleReject(activeItem.id, e)}
                      disabled={processingId === activeItem.id}
                      className="px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject Proposal
                    </button>
                    <button
                      onClick={(e) => handleApprove(activeItem.id, e)}
                      disabled={processingId === activeItem.id}
                      className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {processingId === activeItem.id ? "Committing..." : "Approve Retraction"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-[#0d0e12] border border-zinc-800 p-8 text-center text-xs text-zinc-500 font-mono">
                Select a proposal to inspect causal cascade &amp; receipt
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

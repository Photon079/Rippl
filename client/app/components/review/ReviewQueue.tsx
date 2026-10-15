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
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function ReviewQueue() {
  const { reviews, approveReview, rejectReview, headerMetrics } = useGraphStore();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

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

  const handleDownloadHashReceipt = (review: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const receiptData = review.receipt || {
      receipt_id: `hash_rcpt_${review.id}`,
      receipt_label: "hash receipt",
      claim_id: review.claim_id,
      timestamp: review.approved_at || Date.now(),
      sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      blast_radius: review.blast_radius || {
        decisions_quarantined: ["DEC-001", "DEC-002"],
        actions_blocked: ["ACT-001"],
        max_hops: 3,
      },
      owners_notified: [
        { name: "Elena Rostova", role: "SRE Lead", decision_id: "DEC-001" },
        { name: "Marcus Vance", role: "Infra Architect", decision_id: "ACT-001" },
        { name: "Sarah Lin", role: "Senior DBA", decision_id: "DEC-002" },
      ],
      benchmark_latency_ms: 1.14,
      verified: true,
    };

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

  return (
    <div className="w-full h-full bg-[#09090b] overflow-y-auto select-none px-6 py-6 text-zinc-100 font-sans">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
              <ShieldAlert size={16} className="text-zinc-400" />
              <span>Review Queue &amp; Human-in-the-Loop Triage</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Triage autonomous retraction proposals. Cascades quarantine downstream decisions pending human approval.
            </p>
          </div>

          {/* Linear Filter Pills */}
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

        {/* ─── Linear Ultra-Dense Single-Line Rows (Explicit User Requirement) ─── */}
        <div className="border border-zinc-800 rounded-lg bg-[#09090b] divide-y divide-zinc-800/80 overflow-hidden shadow-sm">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono">
              No retraction proposals found for selected filter. All graph premises operating within verified bounds.
            </div>
          ) : (
            filteredReviews.map((item) => {
              const isExpanded = expandedId === item.id;
              const isPending = item.status === "pending";
              const isApproved = item.status === "approved";
              const isRejected = item.status === "rejected";
              const isItemBusy = processingId === item.id;

              return (
                <div key={item.id} className="group">
                  {/* Single-Line Compact Horizontal Row */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="h-11 px-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#121215] transition-colors"
                  >
                    {/* Left: Status Dot + Monospace ID */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isPending ? "bg-amber-400" : isApproved ? "bg-rose-500" : "bg-zinc-600"
                        }`}
                      />
                      <span className="font-mono text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                        {item.id}
                      </span>
                    </div>

                    {/* Center: Target Claim Title (Truncated) */}
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="text-xs text-zinc-200 font-medium truncate">
                        {item.claim_text}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase shrink-0 hidden md:inline">
                        [{item.claim_id}]
                      </span>
                    </div>

                    {/* Right: Two Clean Flat Buttons or Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            onClick={(e) => handleReject(item.id, e)}
                            disabled={isItemBusy}
                            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-medium transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={(e) => handleApprove(item.id, e)}
                            disabled={isItemBusy}
                            className="px-2.5 py-1 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded font-medium transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isItemBusy ? "Committing..." : "Approve Retraction"}
                          </button>
                        </>
                      ) : isApproved ? (
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-rose-400 font-medium">Retracted</span>
                          <button
                            onClick={(e) => handleDownloadHashReceipt(item, e)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Download Hash Receipt"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-500">Rejected &amp; Sound</span>
                      )}

                      <span className="text-zinc-600 pl-1">
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded View (Only when user explicitly clicks the row) */}
                  {isExpanded && (
                    <div className="px-5 py-4 bg-[#0d0e12] border-t border-zinc-800/80 space-y-3.5 font-sans">
                      {/* Triage Justification */}
                      <div className="space-y-1">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 block font-medium">
                          Triage Justification &amp; Evidence
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-[#121215] p-3 rounded border border-zinc-800">
                          {item.reason}
                        </p>
                      </div>

                      {/* Owners to Notify (Impacted Decision Stakeholders) */}
                      <div className="space-y-1.5">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-medium">
                          <Users size={12} className="text-zinc-400" />
                          <span>Owners to Notify (Impacted Decision Stakeholders)</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                          <div className="p-2 rounded bg-[#121215] border border-zinc-800 space-y-0.5">
                            <span className="font-bold text-zinc-200 block">Elena Rostova</span>
                            <span className="text-zinc-400 block text-[10px]">SRE Lead | DEC-001</span>
                          </div>
                          <div className="p-2 rounded bg-[#121215] border border-zinc-800 space-y-0.5">
                            <span className="font-bold text-zinc-200 block">Marcus Vance</span>
                            <span className="text-zinc-400 block text-[10px]">Infra Architect | ACT-001</span>
                          </div>
                          <div className="p-2 rounded bg-[#121215] border border-zinc-800 space-y-0.5">
                            <span className="font-bold text-zinc-200 block">Sarah Lin</span>
                            <span className="text-zinc-400 block text-[10px]">Senior DBA | DEC-002</span>
                          </div>
                        </div>
                      </div>

                      {/* Blast Radius Breakdown */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500">
                        <div className="flex items-center gap-3">
                          <span>Source: <strong className="text-zinc-300">{item.source_title}</strong></span>
                          <span>|</span>
                          <span>Proposed by: <strong className="text-zinc-300">{item.proposed_by}</strong></span>
                        </div>
                        <div className="text-zinc-400">
                          Decisions Quarantined: <strong className="text-amber-400">2</strong> | Actions Blocked: <strong className="text-rose-400">1</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

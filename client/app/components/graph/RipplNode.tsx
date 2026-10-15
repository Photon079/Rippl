"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface NodePayload {
  id: string;
  type: "source" | "claim" | "decision" | "action" | "person" | "agent";
  label?: string;
  title?: string;
  text?: string;
  description?: string;
  status?: string;
  sourceType?: string;
  hop?: number;
  isDimmed?: boolean;
  isAffected?: boolean;
}

export const RipplNode = memo(function RipplNode({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = data as unknown as NodePayload;
  const rawType = (nodeData.type || "decision").toUpperCase();
  const status = nodeData.status || "Holding";
  const title = nodeData.title || nodeData.label || nodeData.text || id;

  const isRetracted = status === "Retracted" || status === "Premise Retracted" || status === "Blocked";
  const isAtRisk = status === "Premise At Risk" || status === "Proposed Retraction";
  const isSound = status === "Verified" || status === "Executed" || status === "Holding" || status === "Sound";

  const isDimmed = Boolean(nodeData.isDimmed);
  const isAffected = isRetracted || isAtRisk || Boolean(nodeData.isAffected);

  // Status dot color
  let statusDotColor = "bg-zinc-500";
  if (isRetracted) {
    statusDotColor = "bg-rose-500";
  } else if (isAtRisk) {
    statusDotColor = "bg-amber-400";
  } else if (isSound) {
    statusDotColor = "bg-emerald-500";
  }

  // Border color: when affected by blast radius, border-rose-500 or border-amber-500; selected: border-zinc-500; default: border-zinc-800
  let borderColor = "border-zinc-800";
  if (isRetracted) {
    borderColor = "border-rose-500";
  } else if (isAtRisk) {
    borderColor = "border-amber-500";
  } else if (selected) {
    borderColor = "border-zinc-500";
  }

  return (
    <div
      title={`${id}: ${title} (${status})`}
      className={`w-[260px] bg-[#121215] border rounded-lg p-3 select-none transition-opacity duration-150 flex flex-col justify-between cursor-pointer ${borderColor} ${
        isDimmed ? "opacity-30" : "opacity-100"
      }`}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !-left-1 !bg-zinc-600 !border !border-zinc-950"
      />

      {/* Top Row: Monospace ID on left, tiny colored status dot on right */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            {id}
          </span>
          <span className="font-mono text-[10px] text-zinc-600 uppercase px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800">
            {rawType}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
          <span
            className={`font-mono text-[10px] uppercase tracking-wide font-medium ${
              isRetracted ? "text-rose-400" : isAtRisk ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {isRetracted ? "Retracted" : isAtRisk ? "At Risk" : "Sound"}
          </span>
        </div>
      </div>

      {/* Middle Row: Entity Title (truncated at 2 lines) */}
      <div className="text-xs text-zinc-200 line-clamp-2 leading-relaxed font-normal min-h-[36px] my-1">
        {title}
      </div>

      {/* Bottom Row: font-mono latency or timestamp metric */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500">
        <span>FalkorDB GraphBLAS</span>
        <span className="text-zinc-400 font-mono">3.2ms BFS</span>
      </div>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !-right-1 !bg-zinc-600 !border !border-zinc-950"
      />
    </div>
  );
});

"use client";

import { useState } from "react";
import {
  Network,
  ClipboardList,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useGraphStore } from "../lib/graph-store";
import RippleMark from "./RippleMark";
import Link from "next/link";

export type Screen = "graph" | "review" | "ask" | "ablation";

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export default function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { headerMetrics } = useGraphStore();

  const navItems = [
    {
      id: "graph" as Screen,
      label: "Causal Graph",
      badge: `${headerMetrics.totalNodes}`,
      icon: Network,
    },
    {
      id: "review" as Screen,
      label: "Review Queue",
      badge: headerMetrics.pendingReviews > 0 ? `${headerMetrics.pendingReviews}` : undefined,
      icon: ClipboardList,
    },
    {
      id: "ask" as Screen,
      label: "Ask Rippl",
      badge: undefined,
      icon: MessageSquare,
    },
    {
      id: "ablation" as Screen,
      label: "Ablation Benchmark",
      badge: undefined,
      icon: Sparkles,
    },
  ];

  return (
    <aside
      className={`relative h-full flex flex-col transition-all duration-150 border-r border-[#242429] bg-[#0c0c0e] z-30 select-none ${
        collapsed ? "w-[60px]" : "w-[240px]"
      }`}
    >
      {/* Top Branding */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#242429]">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden group cursor-pointer"
          title="Back to Landing Page"
        >
          <RippleMark size={26} />

          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-zinc-100 tracking-tight group-hover:text-white transition-colors">
                Rippl
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 whitespace-nowrap">
                hackathon build
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#1f1f24] text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#151518]"
              } ${collapsed ? "justify-center" : "justify-between"}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon size={15} className="shrink-0 text-zinc-400" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!collapsed && item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#242429]">
        {!collapsed ? (
          <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>FalkorDB Engine</span>
            <span className="text-zinc-400">Active</span>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-zinc-500 mx-auto" />
        )}
      </div>
    </aside>
  );
}

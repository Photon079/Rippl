"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar, { type Screen } from "./Sidebar";
import { GraphProvider } from "../lib/graph-store";

const GraphExplorer = dynamic(
  () => import("./graph/GraphExplorer"),
  { ssr: false }
);
const ReviewQueue = dynamic(
  () => import("./review/ReviewQueue"),
  { ssr: false }
);
const AskInterface = dynamic(
  () => import("./ask/AskInterface"),
  { ssr: false }
);
const AblationLab = dynamic(
  () => import("./ablation/AblationLab"),
  { ssr: false }
);

interface AppShellProps {
  initialScreen?: Screen;
}

export default function AppShell({ initialScreen = "graph" }: AppShellProps) {
  const [activeScreen, setActiveScreen] = useState<Screen>(initialScreen);

  return (
    <GraphProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#09090b] to-[#09090b] text-zinc-100 font-sans">
        <Sidebar
          activeScreen={activeScreen}
          onScreenChange={setActiveScreen}
        />

        <main className="flex-1 overflow-hidden relative flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 via-[#09090b] to-[#09090b]">
          {activeScreen === "graph" && <GraphExplorer />}
          {activeScreen === "review" && <ReviewQueue />}
          {activeScreen === "ask" && <AskInterface />}
          {activeScreen === "ablation" && <AblationLab />}
        </main>
      </div>
    </GraphProvider>
  );
}

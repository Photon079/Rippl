"use client";

import { useEffect, useRef } from "react";

interface GraphNode {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  color: string;
  glow: string;
  phase: number;
  speed: number;
}

export default function CausalHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      initNodes();
    };

    window.addEventListener("resize", handleResize);

    // Floating clean graph nodes with mixed subtle colors (cyan, emerald, violet)
    let nodes: GraphNode[] = [];
    const colors = [
      { fill: "#38bdf8", glow: "rgba(56, 189, 248, 0.4)" }, // Cyan
      { fill: "#34d399", glow: "rgba(52, 211, 153, 0.35)" }, // Emerald
      { fill: "#a78bfa", glow: "rgba(167, 139, 250, 0.35)" }, // Violet
      { fill: "#38bdf8", glow: "rgba(56, 189, 248, 0.3)" },
    ];

    const initNodes = () => {
      nodes = [];
      const count = 16;
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * (height * 0.85);
        const c = colors[i % colors.length];
        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          radius: 2.5 + Math.random() * 2,
          color: c.fill,
          glow: c.glow,
          phase: Math.random() * Math.PI * 2,
          speed: 0.015 + Math.random() * 0.015,
        });
      }
    };

    initNodes();

    let time = 0;
    let phase = 0;

    const render = () => {
      time += 0.01;
      phase += 0.003;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle connecting lines between nearby nodes (< 190px)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);

          if (dist < 190) {
            const opacity = (1 - dist / 190) * 0.16;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 2. Draw nodes with gentle floating motion & soft breathing glow
      nodes.forEach((n) => {
        n.phase += n.speed;
        n.x = n.baseX + Math.sin(time + n.phase) * 10;
        n.y = n.baseY + Math.cos(time * 0.8 + n.phase) * 8;

        const pulse = (Math.sin(n.phase) + 1) / 2;

        // Outer glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = n.glow;
        ctx.fill();

        // Node center
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
      });

      // 3. Draw silky flowing bezier waves across the bottom
      const waves = [
        { yOffset: height * 0.75, amp: 24, freq: 0.0016, speed: 1.0, color: "rgba(56, 189, 248, 0.07)", lineWidth: 1.2 },
        { yOffset: height * 0.82, amp: 30, freq: 0.0012, speed: 0.8, color: "rgba(52, 211, 153, 0.06)", lineWidth: 1.0 },
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 14) {
          const y =
            w.yOffset +
            Math.sin(x * w.freq + phase * w.speed) * w.amp +
            Math.cos(x * w.freq * 0.6 + phase * 0.4) * (w.amp * 0.3);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = w.color;
        ctx.lineWidth = w.lineWidth;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Mixed Aurora Ambient Nebulae (Soft Cyan, Emerald & Violet Glows) */}
      <div className="absolute -top-36 left-1/4 w-[550px] h-[380px] bg-sky-500/12 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-[500px] h-[350px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-500/8 rounded-full blur-[150px] pointer-events-none" />

      {/* Clean dynamic graph & wave canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-90"
      />
    </div>
  );
}

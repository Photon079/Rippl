"use client";

import React, { memo } from "react";

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}

export const Ripple = memo(function Ripple({
  mainCircleSize = 180,
  mainCircleOpacity = 0.22,
  numCircles = 7,
  className = "",
}: RippleProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 select-none [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)] ${className}`}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = Math.max(0.04, mainCircleOpacity - i * 0.03);
        const animationDelay = `${i * 0.15}s`;

        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-700/35"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animation: `ripple-wave 4s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
              animationDelay,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes ripple-wave {
          0% {
            transform: translate(-50%, -50%) scale(0.85);
            opacity: 0.1;
          }
          50% {
            opacity: 0.35;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.25);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

export default Ripple;

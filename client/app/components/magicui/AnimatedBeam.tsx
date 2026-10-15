"use client";

import React from "react";

interface AnimatedBeamProps {
  className?: string;
  isRetracted?: boolean;
  reverse?: boolean;
  duration?: number;
}

export function AnimatedBeam({
  className = "",
  isRetracted = false,
  duration = 2,
}: AnimatedBeamProps) {
  const beamId = React.useId();

  return (
    <div className={`relative flex items-center justify-center w-full h-8 ${className}`}>
      <svg
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 20"
      >
        <defs>
          <linearGradient id={`gradient-${beamId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor={isRetracted ? "#f43f5e" : "#00f2fe"}
              stopOpacity="0.1"
            />
            <stop
              offset="50%"
              stopColor={isRetracted ? "#f43f5e" : "#00f2fe"}
              stopOpacity="0.9"
            />
            <stop
              offset="100%"
              stopColor={isRetracted ? "#fb7185" : "#38bdf8"}
              stopOpacity="0.1"
            />
          </linearGradient>
        </defs>

        {/* Base Static Track */}
        <line
          x1="0"
          y1="10"
          x2="100"
          y2="10"
          stroke={isRetracted ? "rgba(244, 63, 94, 0.25)" : "rgba(255, 255, 255, 0.12)"}
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* Flowing Laser Beam */}
        <line
          x1="0"
          y1="10"
          x2="100"
          y2="10"
          stroke={`url(#gradient-${beamId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animated-beam-line"
        />
      </svg>

      <style jsx>{`
        .animated-beam-line {
          stroke-dasharray: 25 75;
          animation: beam-flow ${duration}s linear infinite;
        }
        @keyframes beam-flow {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default AnimatedBeam;

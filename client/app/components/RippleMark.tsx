"use client";

interface RippleMarkProps {
  className?: string;
  size?: number;
}

export default function RippleMark({ className = "w-6 h-6", size = 24 }: RippleMarkProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-md bg-zinc-900 border border-zinc-700/80 shrink-0 text-zinc-100 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      aria-label="Rippl logo"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-zinc-100"
      >
        {/* Central Origin */}
        <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
        {/* Inner Ripple Arcs */}
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M8.5 15.5a5 5 0 0 1 0-7" />
        {/* Outer Ripple Arcs */}
        <path d="M18.8 5.2a9.5 9.5 0 0 1 0 13.6" />
        <path d="M5.2 18.8a9.5 9.5 0 0 1 0-13.6" />
      </svg>
    </div>
  );
}

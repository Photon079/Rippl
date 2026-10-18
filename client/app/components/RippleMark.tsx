"use client";

interface RippleMarkProps {
  className?: string;
  size?: number;
}

export default function RippleMark({ className = "w-6 h-6", size = 24 }: RippleMarkProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-md overflow-hidden shrink-0 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      aria-label="Rippl logo"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Rippl logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

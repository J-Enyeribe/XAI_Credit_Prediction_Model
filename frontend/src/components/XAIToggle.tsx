import { useState } from "react";

export const XAIToggle = () => {
  const [active, setActive] = useState(false);

  return (
    <>
      <button
        onClick={() => setActive(!active)}
        aria-label="Toggle XAI Mode"
        aria-pressed={active}
        className="relative group outline-none cursor-pointer"
      >
        {/* Main button body */}
        <div
          className={`relative w-28 h-28 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
            active
              ? "border-pacific_blue-500/60 bg-pacific_blue-500/10 shadow-[0_0_40px_rgba(0,159,183,0.15)]"
              : "border-[var(--accent)]/20 bg-[var(--bg-card)]/50 shadow-lg"
          }`}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl transition-colors duration-500" style={{ borderColor: active ? '#009fb7' : 'var(--accent)' }} />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr transition-colors duration-500" style={{ borderColor: active ? '#009fb7' : 'var(--accent)' }} />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl transition-colors duration-500" style={{ borderColor: active ? '#009fb7' : 'var(--accent)' }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br transition-colors duration-500" style={{ borderColor: active ? '#009fb7' : 'var(--accent)' }} />

          {/* Inner content */}
          <div className="absolute inset-3 rounded-xl bg-[var(--bg-dark)] flex items-center justify-center overflow-hidden">
            {/* Background glow */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                active ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,159,183,0.15) 0%, transparent 70%)",
              }}
            />

            {/* Shield Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              className="relative z-10 w-12 h-12 transition-all duration-500"
              style={{
                filter: active
                  ? "drop-shadow(0 0 8px rgba(0,159,183,0.5))"
                  : "none",
              }}
            >
              {/* Shield outline */}
              <path
                d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11 4.5-.85 8-5.75 8-11V7l-8-4z"
                className="transition-colors duration-500"
                fill={active ? "#009fb7" : "var(--text-muted)"}
                fillOpacity={active ? 0.15 : 0.1}
                stroke={active ? "#009fb7" : "var(--text-muted)"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {/* Checkmark */}
              <path
                d="M9 12l2 2 4-4"
                className="transition-all duration-500"
                stroke={active ? "#009fb7" : "var(--text-muted)"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={active ? 1 : 0.3}
              />
              {/* Inner pulse dot */}
              <circle
                cx="12"
                cy="12"
                r="2"
                className="transition-all duration-500"
                fill={active ? "#009fb7" : "transparent"}
                opacity={active ? 0.8 : 0}
              />
            </svg>
          </div>
        </div>

        {/* LED indicator */}
        <div
          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--bg-dark)] transition-all duration-500 ${
            active
              ? "bg-pacific_blue-500 shadow-[0_0_12px_rgba(0,159,183,0.6)]"
              : "bg-[var(--text-muted)]/30"
          }`}
        />

        {/* Label */}
        <div className="mt-3 text-center">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
              active ? "text-pacific_blue-500" : "text-[var(--text-muted)]/50"
            }`}
          >
            {active ? "XAI Active" : "XAI Off"}
          </span>
        </div>
      </button>

      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-50">
        <svg height="100%" width="100%">
          <defs>
            <pattern
              height={500}
              width={500}
              patternUnits="userSpaceOnUse"
              id="noise-pattern-toggle"
            >
              <filter y={0} x={0} id="noise-toggle">
                <feTurbulence
                  stitchTiles="stitch"
                  numOctaves={3}
                  baseFrequency="0.65"
                  type="fractalNoise"
                />
                <feBlend mode="screen" />
              </filter>
              <rect filter="url(#noise-toggle)" height={500} width={500} />
            </pattern>
          </defs>
          <rect fill="url(#noise-pattern-toggle)" height="100%" width="100%" />
        </svg>
      </div>
    </>
  );
};

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Subtle radial highlight — like light on polished black */}
      <div className="absolute left-1/2 top-0 h-[70vh] w-[140vw] -translate-x-1/2 -translate-y-1/4 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />

      {/* Aurora orbs — slow, organic, wide blurs */}
      <div
        className="absolute left-[-10%] top-[10%] h-[600px] w-[800px] rounded-full bg-indigo-500/[0.04] blur-[160px]"
        style={{ animation: "aurora-1 20s ease-in-out infinite" }}
      />
      <div
        className="absolute right-[-5%] top-[40%] h-[500px] w-[700px] rounded-full bg-violet-500/[0.03] blur-[140px]"
        style={{ animation: "aurora-2 25s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[5%] left-[20%] h-[400px] w-[600px] rounded-full bg-sky-500/[0.025] blur-[130px]"
        style={{ animation: "aurora-3 22s ease-in-out infinite" }}
      />

      {/* Shimmer band — slow horizontal sweep */}
      <div
        className="absolute top-[30%] h-[1px] w-[60vw] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent blur-sm"
        style={{ animation: "shimmer-sweep 18s ease-in-out infinite" }}
      />

      {/* Noise texture overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035]">
        <filter id="ambient-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#ambient-noise)" />
      </svg>
    </div>
  );
}

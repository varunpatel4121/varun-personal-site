import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the workspace package (ships TS + scoped CSS source).
  transpilePackages: ["@blh/tech-loop-quiz"],
};

export default nextConfig;

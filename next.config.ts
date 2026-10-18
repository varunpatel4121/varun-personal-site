import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the local preview's badge from covering fixed mobile navigation.
  devIndicators: false,
  // Transpile the workspace quiz packages (they ship TS + scoped CSS source).
  transpilePackages: ["@blh/quiz-core", "@blh/tech-loop-quiz", "@blh/parent-quiz"],
};

export default nextConfig;

/**
 * @blh/tech-loop-quiz — headless entry point.
 *
 * Exports the deterministic engine, the versioned config/content, the shared
 * types, the persistence adapter interface, and the AI narrative layer. No
 * React here — import the UI from "@blh/tech-loop-quiz/ui".
 */

export * from "./types";
export * from "./engine";
export * from "./config";
export * from "./persistence";
export * from "./ai";

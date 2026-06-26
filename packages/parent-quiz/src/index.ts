/**
 * @blh/parent-quiz — headless entry. Types, deterministic engine, config,
 * AI narrative composer, and persistence builder. No React — import the UI from
 * "@blh/parent-quiz/ui". Built on @blh/quiz-core.
 */

export * from "./types";
export * from "./version";
export * from "./engine";
export * from "./config";
export * from "./ai";
export * from "./persistence";

// Re-export the core adapters apps commonly need.
export {
  httpPersistence,
  noopPersistence,
  makeNarrator,
  deterministicNarrator,
  type QuizPersistence,
  type Narrator,
  type CompleteFn,
  type SessionRecord,
} from "@blh/quiz-core";

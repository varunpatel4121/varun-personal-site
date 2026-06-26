export { score, runPipeline } from "./score";
export type { ScoreOptions } from "./score";
export { normalize } from "./normalize";
export { gateSatisfied, gateOutcome } from "./gates";
export { calculateSeverity, bandFor } from "./severity";
export { evaluateHardRules, hasLowConcern, evaluateSafety } from "./hard-rules";
export { resolveTopPair } from "./tie-breakers";
export { buildFormulation, bandLabel } from "./formulation";
export { has, tagsOfType } from "./signals";

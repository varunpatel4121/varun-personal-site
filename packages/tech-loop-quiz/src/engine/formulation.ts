/**
 * Deterministic formulation sentence — the clinician/product one-liner.
 * Example: "The Night Regulator, steady pull, driven by The Zone-Out and
 * Soothe Me, showing a Time-Sink / Binge Loop, with Sleep and Mood or Anxiety
 * cost." Built purely from the structured output; the AI layer may warm the
 * tone but never changes this.
 */

import type { SeverityBand } from "../types";
import { tagLabel } from "../config";

const BAND_LABEL: Record<SeverityBand, string> = {
  light_grip: "light grip",
  steady_pull: "steady pull",
  deep_loop: "deep loop",
  high_impact_loop: "high-impact loop",
};

export function bandLabel(band: SeverityBand): string {
  return BAND_LABEL[band];
}

function joinAnd(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export interface FormulationParts {
  primaryName: string;
  band: SeverityBand;
  hooks: string[]; // hook tags
  jobs: string[]; // job tags
  loops: string[]; // loop_shape tags
  costs: string[]; // cost_domain tags
}

export function buildFormulation(p: FormulationParts): string {
  const hookPhrase = joinAnd(p.hooks.slice(0, 2).map((t) => tagLabel("hook", t)));
  const jobPhrase = joinAnd(p.jobs.slice(0, 1).map((t) => tagLabel("job", t)));
  const loopPhrase = p.loops[0] ? tagLabel("loop_shape", p.loops[0]) : "";
  const costPhrase = joinAnd(p.costs.map((t) => tagLabel("cost_domain", t)));

  const driver = [hookPhrase, jobPhrase].filter(Boolean).join(" and ");
  const segments = [`${p.primaryName}, ${BAND_LABEL[p.band]}`];
  if (driver) segments.push(`driven by ${driver}`);
  if (loopPhrase) segments.push(`showing a ${loopPhrase}`);
  if (costPhrase) segments.push(`with ${costPhrase} cost`);
  return segments.join(", ") + ".";
}

export function noDominantFormulation(): string {
  return "No dominant problematic loop — your use looks mostly in your own control right now.";
}

import type { JobTag, ScoringState } from "./types";
import { topJobs, topPhenotype } from "./scoring";
import phenotypesConfig from "../config/phenotypes.json";

const JOB_LABELS = (phenotypesConfig as { jobLabels: Record<JobTag, string> }).jobLabels;

export function jobLabel(tag: JobTag): string {
  return JOB_LABELS[tag] ?? tag;
}

export function fallbackMirrorText(state: ScoringState): string {
  const jobs = topJobs(state, 1);
  const job = jobs[0]
    ? JOB_LABELS[jobs[0]]
    : "something other than entertainment";
  const when = state.timing.includes("latenight")
    ? "mostly late at night"
    : state.timing.includes("taskstart")
      ? "right when you're supposed to start something"
      : state.timing.includes("gaps")
        ? "in the in-between moments"
        : state.timing.includes("alone")
          ? "mostly when you're alone"
          : "at predictable moments";
  const stage =
    state.stage === "compensation"
      ? " And it sounds like it stopped being fun a while ago — now it's less about enjoying it and more about what it turns off."
      : "";
  const label = state.anchorLabel || "that app";
  return `So far, this doesn't sound like a "you love your phone too much" story. It sounds like ${label} has a job: ${job} — and it clocks in ${when}.${stage}`;
}

export function loopLine(state: ScoringState): string {
  const t: string[] = [];
  if (state.timing.includes("latenight")) t.push("late-night, in-bed sessions");
  if (state.timing.includes("waking")) t.push("first-thing checks");
  if (state.timing.includes("taskstart"))
    t.push("fires exactly when work should start");
  if (state.timing.includes("gaps")) t.push("fills every in-between moment");
  if (state.timing.includes("poststress")) t.push("spikes after stress");
  if (state.timing.includes("alone")) t.push("strongest when you're alone");
  const stage =
    state.stage === "compensation"
      ? "running on relief more than enjoyment"
      : state.stage === "gratification"
        ? "still genuinely enjoyable, which makes it stickier"
        : "";
  const ctl = state.control >= 4 ? "with real loss-of-control moments" : "";
  return [t.join("; ") || "a recurring rhythm", stage, ctl]
    .filter(Boolean)
    .join(" — ");
}

const COST_NAMES: Record<string, string> = {
  sleep: "sleep",
  school: "school and work",
  attention: "focus",
  mood: "how you feel about yourself",
  social: "in-person connection",
  family: "peace at home",
  money: "money",
};

export function costPhrase(state: ScoringState): string {
  const cs = state.costs.map((c) => COST_NAMES[c]).filter(Boolean);
  if (cs.length === 0)
    return "not much yet — which makes this the cheapest moment to change it";
  if (cs.length === 1) return cs[0];
  return cs.slice(0, -1).join(", ") + " and " + cs[cs.length - 1];
}

export function hasMirrorSignal(state: ScoringState): boolean {
  return topPhenotype(state) !== null;
}

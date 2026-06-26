// @vitest-environment jsdom
/**
 * Rendering/flow test for the adult quiz. Mounts the real <TechLoopQuiz/> and
 * verifies the things that broke or changed: option selection lights up
 * (data-selected), the funnel reaches a second-person result, Back navigation
 * works, and progress is persisted to sessionStorage so a reload resumes.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TechLoopQuiz } from "./TechLoopQuiz";
import { QUIZ_CONTENT } from "../config";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

const tick = () => new Promise((r) => setTimeout(r, 0));
const optButtons = () =>
  screen.getAllByRole("button").filter((b) => b.classList.contains("tlq-opt"));

/** Advance one screen: pick its first option (+ Continue / Skip as needed). */
function step() {
  // Required identity gate (name + email, no skip) sits right before the result.
  const nameInput = document.querySelector('input[placeholder="Name"]') as HTMLInputElement | null;
  const emailInput = document.querySelector('input[placeholder="Email"]') as HTMLInputElement | null;
  if (nameInput && emailInput) {
    fireEvent.change(nameInput, { target: { value: "Test" } });
    fireEvent.change(emailInput, { target: { value: "t@e.co" } });
    fireEvent.click(screen.getByText("See full results on the next page"));
    return;
  }
  const opts = optButtons();
  if (opts.length) fireEvent.click(opts[0]!);
  const cont = screen.queryByText("Continue");
  if (cont) fireEvent.click(cont);
}

describe("<TechLoopQuiz/>", () => {
  it("renders the intro", () => {
    render(<TechLoopQuiz />);
    expect(screen.getByText(QUIZ_CONTENT.intro.title)).toBeTruthy();
    expect(screen.getByText(QUIZ_CONTENT.intro.cta)).toBeTruthy();
  });

  it("lights up a selected option (data-selected) — the selection-visibility fix", async () => {
    render(<TechLoopQuiz />);
    fireEvent.click(screen.getByText(QUIZ_CONTENT.intro.cta));
    for (let i = 0; i < 8 && !screen.queryByText(QUIZ_CONTENT.pull.platformQuestion); i++) {
      step();
      await tick();
    }
    // On the platform picker: clicking an option must mark it selected.
    const first = optButtons()[0]!;
    expect(first.getAttribute("data-selected")).toBe("false");
    fireEvent.click(first);
    expect(optButtons()[0]!.getAttribute("data-selected")).toBe("true");
  });

  it("persists progress to sessionStorage (survives reload)", async () => {
    render(<TechLoopQuiz />);
    fireEvent.click(screen.getByText(QUIZ_CONTENT.intro.cta));
    step();
    await tick();
    const raw = window.sessionStorage.getItem("blh.techloop.v2");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).pos).toBeGreaterThan(0);
  });

  it("walks to a second-person result, then Back returns to the quiz", async () => {
    render(<TechLoopQuiz />);
    fireEvent.click(screen.getByText(QUIZ_CONTENT.intro.cta));
    for (let i = 0; i < 30 && !screen.queryByText("Primary phenotype"); i++) {
      step();
      await tick();
    }
    // Result rendered with the second-person read + actionable card + fit.
    expect(await screen.findByText("Primary phenotype")).toBeTruthy();
    expect(document.querySelector(".tlq-read")?.textContent ?? "").toContain("You're someone who");
    expect(screen.getByText("What helps")).toBeTruthy();
    expect(screen.getByText(QUIZ_CONTENT.result.fitQuestion)).toBeTruthy();

    // Back leaves the result and returns to the last question.
    fireEvent.click(screen.getByText("Back"));
    await tick();
    expect(screen.queryByText("Primary phenotype")).toBeNull();
    // Identity is the step right before the result — now a "Your result is ready"
    // gate teasing the result name, with the name + email fields.
    expect(screen.getByText("Your result is ready")).toBeTruthy();
    expect(document.querySelector('input[placeholder="Name"]')).toBeTruthy();
  });
});

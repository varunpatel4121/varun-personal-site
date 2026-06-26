// @vitest-environment jsdom
/**
 * Rendering/flow test — mounts the real <ParentQuiz/>, walks the funnel by
 * picking the first option on each screen, and asserts the redesigned result
 * renders: the recognition line, the CARES booking CTA (with the injected URL),
 * the expandable detail, and the fit feedback. Guards the UI end-to-end.
 */

import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ParentQuiz } from "./ParentQuiz";

beforeAll(() => {
  // jsdom doesn't implement scrollTo; stub it so the flow's smooth-scroll is a no-op.
  window.scrollTo = () => {};
});
afterEach(cleanup);

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("<ParentQuiz/>", () => {
  it("renders the intro", () => {
    render(<ParentQuiz />);
    expect(screen.getByText("What's really going on with screens at home?")).toBeTruthy();
    expect(screen.getByText("Start")).toBeTruthy();
  });

  it("walks the funnel to a well-formed result with the CARES CTA", async () => {
    render(<ParentQuiz bookingUrl="https://example.com/cares" />);
    fireEvent.click(screen.getByText("Start"));

    // Answer each screen by clicking its first option (+ Continue for multi).
    for (let i = 0; i < 14; i++) {
      if (screen.queryByText("Just show the result") || screen.queryByText(/Reading your family/)) break;
      const opts = screen.getAllByRole("button").filter((b) => b.classList.contains("q-opt"));
      if (!opts.length) break;
      fireEvent.click(opts[0]!);
      const cont = screen.queryByText("Continue");
      if (cont) fireEvent.click(cont);
      await tick();
    }

    // Email gate → skip → result.
    const skip = await screen.findByText("Just show the result");
    fireEvent.click(skip);

    const book = await screen.findByText(/book a free consult/i);
    expect(book.getAttribute("href")).toBe("https://example.com/cares");
    expect(book.getAttribute("target")).toBe("_blank");

    // Recognition line + expandable detail + fit feedback are present.
    expect(document.querySelector(".pq-recognition")?.textContent?.length).toBeGreaterThan(10);
    expect(document.querySelector(".pq-detail")).toBeTruthy();
    expect(screen.getByText(/does this sound like your house/i)).toBeTruthy();
    expect(document.querySelector(".pq-hero-name")?.textContent).toMatch(/^The /);
  });
});

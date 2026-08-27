import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { BodyEvolution } from "@/features/body/components/body-evolution";
import {
  bodyScanDriveUrl,
  bodyScans,
  latestSegmentalLean,
  trendMetrics,
} from "@/features/body/data/scans";
import { navigation } from "@/data/navigation";

afterEach(cleanup);

describe("body scan data", () => {
  it("keeps the scan archive chronological with the August scan last", () => {
    expect(bodyScans).toHaveLength(7);
    expect(bodyScans.length).toBeGreaterThanOrEqual(2);
    expect(bodyScans.map((scan) => scan.date)).toEqual(
      [...bodyScans].map((scan) => scan.date).sort()
    );
    expect(bodyScans.at(-1)).toMatchObject({
      id: "2026-08-26",
      dateLabel: "August 26, 2026",
      weight: 182.1,
      skeletalMuscleMass: 82.5,
      percentBodyFat: 21.7,
    });
    expect(latestSegmentalLean).toHaveLength(5);
    expect(bodyScanDriveUrl).toContain("118BtZJ0qvDDLcTVN_l9Y-IDQ0sdYOKKJ");
  });

  it("provides a finite value for every configured trend on every scan", () => {
    for (const metric of trendMetrics) {
      for (const scan of bodyScans) {
        expect(Number.isFinite(scan[metric.key])).toBe(true);
      }
    }
    expect(navigation.filter((item) => item.href === "/body")).toEqual([
      { label: "Body", href: "/body" },
    ]);
  });
});

describe("<BodyEvolution />", () => {
  it("renders the complete latest scan and the source archive by default", () => {
    render(<BodyEvolution />);

    const tabs = screen.getAllByRole("tab");
    const panel = screen.getByRole("tabpanel");
    expect(tabs).toHaveLength(bodyScans.length);
    expect(tabs.at(-1)).toHaveAttribute("aria-selected", "true");
    expect(within(panel).getByRole("heading", { name: "August 26, 2026" })).toBeVisible();
    expect(within(panel).getByText("182.1", { exact: true })).toBeVisible();
    expect(within(panel).getAllByRole("term")).toHaveLength(14);
    expect(within(panel).getByText("InBody level")).toBeVisible();
    expect(within(panel).getByText("kg/m²")).toBeVisible();
    expect(within(panel).getByText("BMI").closest("div")?.querySelector("small")).toBeNull();
    expect(screen.getByRole("img", { name: /^Body composition map/ })).toBeVisible();
    expect(screen.getByText("16.4 lb", { exact: true })).toBeVisible();
    expect(screen.getByText("64.3 lb", { exact: true })).toBeVisible();
    expect(screen.getByText("42.2 lb", { exact: true })).toBeVisible();

    const ledgerRows = screen.getAllByRole("row").slice(1);
    expect(ledgerRows).toHaveLength(bodyScans.length);
    expect(ledgerRows[0]).toHaveAttribute("data-latest", "false");
    expect(ledgerRows.at(-1)).toHaveAttribute("data-latest", "true");

    const archive = screen.getByRole("link", { name: /open private 7-page archive/i });
    expect(archive).toHaveAttribute("href", bodyScanDriveUrl);
    expect(archive).toHaveAttribute("target", "_blank");
  });

  it("updates the reading panel for every scan tab", () => {
    render(<BodyEvolution />);

    const tabs = screen.getAllByRole("tab");
    const panel = screen.getByRole("tabpanel");
    bodyScans.forEach((scan, index) => {
      fireEvent.click(tabs[index]);
      expect(tabs[index]).toHaveAttribute("aria-selected", "true");
      expect(within(panel).getByRole("heading", { name: scan.dateLabel })).toBeVisible();
      expect(within(panel).getByText(scan.time, { exact: false })).toBeVisible();
      expect(within(panel).getByText(scan.weight.toFixed(1), { exact: true })).toBeVisible();
    });

    expect(tabs.at(-1)).toHaveAttribute("tabindex", "0");
    expect(tabs[0]).toHaveAttribute("tabindex", "-1");
    expect(panel).toHaveAttribute("aria-labelledby", tabs.at(-1)?.id);

    fireEvent.keyDown(tabs.at(-1)!, { key: "Home" });
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(panel).toHaveAttribute("aria-labelledby", tabs[0].id);

    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
    expect(tabs.at(-1)).toHaveFocus();
    expect(tabs.at(-1)).toHaveAttribute("aria-selected", "true");
  });

  it("updates the chart for every trend, including positive and negative deltas", () => {
    render(<BodyEvolution />);

    for (const metric of trendMetrics) {
      const button = screen.getByRole("button", { name: metric.shortLabel });
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("img", {
          name: `${metric.label} from ${bodyScans[0].dateLabel} to ${bodyScans.at(-1)?.dateLabel}`,
        })
      ).toBeVisible();
    }

    fireEvent.click(screen.getByRole("button", { name: "Body fat" }));
    expect(screen.getByText(/-1\.5 %/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Muscle" }));
    expect(screen.getAllByText(/\+6\.4 lb/)).toHaveLength(2);

    const chart = screen.getByRole("img", {
      name: `Skeletal muscle mass from ${bodyScans[0].dateLabel} to ${bodyScans.at(-1)?.dateLabel}`,
    });
    const dateLabels = Array.from(chart.querySelectorAll("text")).filter((label) =>
      bodyScans.some((scan) => scan.shortDate === label.textContent)
    );
    const xPositions = dateLabels.map((label) => Number(label.getAttribute("x")));
    expect(xPositions).toHaveLength(bodyScans.length);
    expect(xPositions[1] - xPositions[0]).toBeGreaterThan(xPositions[4] - xPositions[3]);
  });
});

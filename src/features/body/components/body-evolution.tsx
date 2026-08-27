"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  bodyScanDriveUrl,
  bodyScans,
  latestSegmentalLean,
  trendMetrics,
  type BodyScan,
  type TrendMetric,
  type TrendMetricKey,
} from "@/features/body/data/scans";
import styles from "./body-evolution.module.css";

type Reading = {
  label: string;
  value: string;
  unit?: string;
  note?: string;
};

function formatDelta(value: number, decimals = 1) {
  const rounded = Number(value.toFixed(decimals));
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(decimals)}`;
}

function getReadings(scan: BodyScan): readonly Reading[] {
  return [
    { label: "Body weight", value: scan.weight.toFixed(1), unit: "lb" },
    {
      label: "Skeletal muscle",
      value: scan.skeletalMuscleMass.toFixed(1),
      unit: "lb",
    },
    { label: "Body fat mass", value: scan.bodyFatMass.toFixed(1), unit: "lb" },
    { label: "Percent body fat", value: scan.percentBodyFat.toFixed(1), unit: "%" },
    { label: "Lean body mass", value: scan.leanBodyMass.toFixed(1), unit: "lb" },
    { label: "Total body water", value: scan.totalBodyWater.toFixed(1), unit: "lb" },
    { label: "BMI", value: scan.bmi.toFixed(1) },
    {
      label: "Visceral fat level",
      value: scan.visceralFatLevel.toFixed(0),
      note: "InBody level",
    },
    { label: "ECW / TBW", value: scan.ecwTbw.toFixed(3) },
    {
      label: "Basal metabolic rate",
      value: scan.basalMetabolicRate.toLocaleString("en-US"),
      unit: "kcal",
    },
    { label: "Skeletal muscle index", value: scan.skeletalMuscleIndex.toFixed(1), unit: "kg/m²" },
    { label: "Dry lean mass", value: scan.dryLeanMass.toFixed(1), unit: "lb" },
    { label: "Intracellular water", value: scan.intracellularWater.toFixed(1), unit: "lb" },
    { label: "Extracellular water", value: scan.extracellularWater.toFixed(1), unit: "lb" },
  ];
}

function BodyFigure() {
  const upperMass = latestSegmentalLean[0].mass + latestSegmentalLean[1].mass;
  const lowerMass = latestSegmentalLean[3].mass + latestSegmentalLean[4].mass;

  return (
    <div className={styles.bodyScene} aria-label="Latest regional lean mass">
      <div className={styles.bodyOrbit} aria-hidden="true" />
      <svg
        className={styles.bodyFigure}
        viewBox="0 0 300 620"
        role="img"
        aria-labelledby="body-figure-title body-figure-description"
      >
        <title id="body-figure-title">Body composition map</title>
        <desc id="body-figure-description">
          A stylized body silhouette showing the latest lean mass distribution in the arms,
          trunk, and legs.
        </desc>
        <defs>
          <linearGradient id="body-surface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d9ffbf" stopOpacity="0.84" />
            <stop offset="0.42" stopColor="#6ee7d8" stopOpacity="0.34" />
            <stop offset="1" stopColor="#07100d" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="body-core" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8ff6a" stopOpacity="0.45" />
            <stop offset="1" stopColor="#6ee7d8" stopOpacity="0.05" />
          </linearGradient>
          <filter id="body-glow" x="-60%" y="-30%" width="220%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className={styles.bodyRings} aria-hidden="true">
          <ellipse cx="150" cy="306" rx="118" ry="268" />
          <ellipse cx="150" cy="306" rx="82" ry="232" />
          <path d="M22 306H278M150 28V588" />
        </g>

        <g className={styles.silhouette} filter="url(#body-glow)">
          <ellipse cx="150" cy="67" rx="33" ry="41" />
          <path d="M133 104L128 125L99 145L112 236L123 281L115 351L94 550L128 570L150 367L172 570L206 550L185 351L177 281L188 236L201 145L172 125L167 104Z" />
          <path d="M103 145L74 175L52 280L69 292L102 211" />
          <path d="M197 145L226 175L248 280L231 292L198 211" />
        </g>

        <g className={styles.bodyCore} aria-hidden="true">
          <path d="M130 129Q150 144 170 129L182 180Q169 208 150 213Q131 208 118 180Z" />
          <path d="M122 221Q150 239 178 221L173 277Q150 292 127 277Z" />
          <path d="M128 291L145 352L127 524M172 291L155 352L173 524" />
        </g>

        <g className={styles.bodyContours} aria-hidden="true">
          <path d="M126 153Q150 170 174 153M121 187Q150 203 179 187" />
          <path d="M150 137V277M129 236Q150 249 171 236" />
          <path d="M73 188L96 211M227 188L204 211" />
          <path d="M119 371L143 390M181 371L157 390" />
          <path d="M111 449L137 461M189 449L163 461" />
        </g>

        <g className={styles.bodyNodes} aria-hidden="true">
          <circle cx="84" cy="205" r="5" />
          <circle cx="216" cy="205" r="5" />
          <circle cx="150" cy="222" r="6" />
          <circle cx="126" cy="414" r="5" />
          <circle cx="174" cy="414" r="5" />
        </g>

        <rect className={styles.scanBeam} x="43" y="119" width="214" height="3" rx="2" />
      </svg>

      <div className={`${styles.figureCallout} ${styles.figureCalloutUpper}`}>
        <span>Upper lean</span>
        <strong>{upperMass.toFixed(1)} lb</strong>
      </div>
      <div className={`${styles.figureCallout} ${styles.figureCalloutCore}`}>
        <span>Core lean</span>
        <strong>{latestSegmentalLean[2].mass.toFixed(1)} lb</strong>
      </div>
      <div className={`${styles.figureCallout} ${styles.figureCalloutLower}`}>
        <span>Lower lean</span>
        <strong>{lowerMass.toFixed(1)} lb</strong>
      </div>

      <p className={styles.figureCaption}>Aug 26, 2026 · regional lean mass</p>
    </div>
  );
}

function TrendChart({ metric }: { metric: TrendMetric }) {
  const chart = useMemo(() => {
    const values = bodyScans.map((scan) => scan[metric.key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const padding = range * 0.22;
    const low = min - padding;
    const high = max + padding;
    const xStart = 58;
    const xEnd = 782;
    const yTop = 34;
    const yBottom = 218;
    const points = values.map((value, index) => ({
      x: xStart + (index / (values.length - 1)) * (xEnd - xStart),
      y: yBottom - ((value - low) / (high - low)) * (yBottom - yTop),
      value,
    }));
    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L${xEnd} ${yBottom} L${xStart} ${yBottom} Z`;

    return { points, line, area, low, high };
  }, [metric]);

  const gradientId = `trend-${metric.key}`;
  const ariaLabel = `${metric.label} from ${bodyScans[0].dateLabel} to ${bodyScans.at(-1)?.dateLabel}`;

  return (
    <div className={styles.chartFrame}>
      <svg className={styles.trendChart} viewBox="0 0 840 280" role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={metric.color} stopOpacity="0.28" />
            <stop offset="1" stopColor={metric.color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((line) => {
          const y = 34 + line * 61.3;
          const label = chart.high - ((chart.high - chart.low) * line) / 3;
          return (
            <g key={line}>
              <line className={styles.chartGridLine} x1="58" x2="782" y1={y} y2={y} />
              <text className={styles.chartAxisLabel} x="8" y={y + 4}>
                {label.toFixed(metric.decimals)}
              </text>
            </g>
          );
        })}

        <path d={chart.area} fill={`url(#${gradientId})`} />
        <path className={styles.chartLine} d={chart.line} style={{ stroke: metric.color }} />

        {chart.points.map((point, index) => (
          <g key={bodyScans[index].id}>
            <circle
              className={styles.chartPointHalo}
              cx={point.x}
              cy={point.y}
              r="10"
              style={{ fill: metric.color }}
            />
            <circle
              className={styles.chartPoint}
              cx={point.x}
              cy={point.y}
              r="4.5"
              style={{ fill: metric.color }}
            />
            <text className={styles.chartDateLabel} x={point.x} y="255" textAnchor="middle">
              {bodyScans[index].shortDate}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ReadingGrid({ scan }: { scan: BodyScan }) {
  return (
    <dl className={styles.readingGrid}>
      {getReadings(scan).map((reading) => (
        <div className={styles.reading} key={reading.label}>
          <dt>{reading.label}</dt>
          <dd>
            <span>{reading.value}</span>
            {reading.unit ? <small>{reading.unit}</small> : null}
          </dd>
          {reading.note ? <p>{reading.note}</p> : null}
        </div>
      ))}
    </dl>
  );
}

export function BodyEvolution() {
  const [selectedScanIndex, setSelectedScanIndex] = useState(bodyScans.length - 1);
  const [selectedMetricKey, setSelectedMetricKey] =
    useState<TrendMetricKey>("skeletalMuscleMass");

  const selectedScan = bodyScans[selectedScanIndex];
  const firstScan = bodyScans[0];
  const latestScan = bodyScans.at(-1) ?? bodyScans[bodyScans.length - 1];
  const selectedMetric =
    trendMetrics.find((metric) => metric.key === selectedMetricKey) ?? trendMetrics[0];
  const selectedMetricStart = firstScan[selectedMetric.key];
  const selectedMetricEnd = latestScan[selectedMetric.key];
  const selectedMetricDelta = selectedMetricEnd - selectedMetricStart;
  const selectedMetricValues = bodyScans.map((scan) => scan[selectedMetric.key]);

  return (
    <article className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              Body / 07 scans / 281 days
            </p>
            <h1>
              The build,
              <span>in motion.</span>
            </h1>
            <p className={styles.heroIntro}>
              A living record of strength, composition, and change. Seven checkpoints,
              distilled into one body of data.
            </p>
            <a className={styles.primaryLink} href="#timeline">
              Explore the timeline
              <span aria-hidden="true">↓</span>
            </a>

            <dl className={styles.heroStats}>
              <div>
                <dt>Skeletal muscle</dt>
                <dd>+6.4 lb</dd>
              </div>
              <div>
                <dt>Body fat</dt>
                <dd>−1.5 pts</dd>
              </div>
              <div>
                <dt>Lean mass</dt>
                <dd>+9.4 lb</dd>
              </div>
            </dl>
          </div>

          <BodyFigure />
        </div>
      </section>

      <section className={styles.section} id="timeline">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Scan timeline</p>
          <h2>Every checkpoint. One clean view.</h2>
          <p>Choose a date to inspect the full core output from that scan.</p>
        </div>

        <div className={styles.timelineRail} role="tablist" aria-label="Body scan dates">
          {bodyScans.map((scan, index) => (
            <button
              className={styles.timelineButton}
              data-active={selectedScanIndex === index}
              key={scan.id}
              onClick={() => setSelectedScanIndex(index)}
              role="tab"
              type="button"
              aria-selected={selectedScanIndex === index}
              aria-controls="scan-readings"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{scan.shortDate}</strong>
              <small>{scan.date.slice(0, 4)}</small>
            </button>
          ))}
        </div>

        <div className={styles.scanPanel} id="scan-readings" role="tabpanel">
          <header className={styles.scanPanelHeader}>
            <div>
              <span>Scan {String(selectedScanIndex + 1).padStart(2, "0")}</span>
              <h3>{selectedScan.dateLabel}</h3>
              <p>{selectedScan.time} · InBody 570</p>
            </div>
            <div className={styles.scanPulse}>
              <span aria-hidden="true" />
              Recorded
            </div>
          </header>
          <ReadingGrid scan={selectedScan} />
        </div>
      </section>

      <section className={`${styles.section} ${styles.trendSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Signal explorer</p>
          <h2>Pick a signal. Watch the line.</h2>
          <p>The whole nine-month arc, without dashboard clutter.</p>
        </div>

        <div className={styles.metricSelector} aria-label="Choose a trend" role="group">
          {trendMetrics.map((metric) => (
            <button
              key={metric.key}
              className={styles.metricButton}
              data-active={selectedMetricKey === metric.key}
              onClick={() => setSelectedMetricKey(metric.key)}
              type="button"
              aria-pressed={selectedMetricKey === metric.key}
            >
              {metric.shortLabel}
            </button>
          ))}
        </div>

        <div className={styles.trendLayout}>
          <div>
            <div className={styles.trendTitleRow}>
              <div>
                <span>{selectedMetric.label}</span>
                <strong>
                  {selectedMetricEnd.toFixed(selectedMetric.decimals)}
                  {selectedMetric.unit ? <small>{selectedMetric.unit}</small> : null}
                </strong>
              </div>
              <p
                className={styles.metricDelta}
                style={{ "--metric-color": selectedMetric.color } as CSSProperties}
              >
                {formatDelta(selectedMetricDelta, selectedMetric.decimals)} {selectedMetric.unit}
                <span> since first scan</span>
              </p>
            </div>
            <TrendChart metric={selectedMetric} />
          </div>

          <dl className={styles.trendSummary}>
            <div>
              <dt>First</dt>
              <dd>{selectedMetricStart.toFixed(selectedMetric.decimals)}</dd>
            </div>
            <div>
              <dt>Latest</dt>
              <dd>{selectedMetricEnd.toFixed(selectedMetric.decimals)}</dd>
            </div>
            <div>
              <dt>Low</dt>
              <dd>{Math.min(...selectedMetricValues).toFixed(selectedMetric.decimals)}</dd>
            </div>
            <div>
              <dt>High</dt>
              <dd>{Math.max(...selectedMetricValues).toFixed(selectedMetric.decimals)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={`${styles.section} ${styles.anatomySection}`}>
        <div className={styles.anatomyIntro}>
          <p className={styles.eyebrow}>Latest anatomy</p>
          <h2>Balanced by region.</h2>
          <p>
            Regional lean mass from the latest scan, shown against the InBody ideal-weight
            reference.
          </p>
        </div>

        <div className={styles.segmentList}>
          {latestSegmentalLean.map((segment) => (
            <div className={styles.segmentRow} key={segment.id}>
              <div>
                <span>{segment.label}</span>
                <strong>{segment.mass.toFixed(2)} lb</strong>
              </div>
              <div className={styles.segmentTrack} aria-hidden="true">
                <span style={{ width: `${Math.min(segment.percent, 115) / 1.15}%` }} />
                <i />
              </div>
              <b>{segment.percent.toFixed(1)}%</b>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.recordSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Full record</p>
          <h2>Seven scans, side by side.</h2>
          <p>Every primary trend in one compact ledger.</p>
        </div>

        <div className={styles.tableScroller} tabIndex={0} aria-label="Scrollable body scan table">
          <table className={styles.recordTable}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Weight</th>
                <th scope="col">Muscle</th>
                <th scope="col">Body fat</th>
                <th scope="col">PBF</th>
                <th scope="col">BMI</th>
                <th scope="col">Lean mass</th>
                <th scope="col">Water</th>
                <th scope="col">ECW/TBW</th>
                <th scope="col">VFL</th>
              </tr>
            </thead>
            <tbody>
              {bodyScans.map((scan, index) => (
                <tr key={scan.id} data-latest={index === bodyScans.length - 1}>
                  <th scope="row">
                    <time dateTime={scan.date}>{scan.shortDate}</time>
                    <small>{scan.date.slice(0, 4)}</small>
                  </th>
                  <td>{scan.weight.toFixed(1)}</td>
                  <td>{scan.skeletalMuscleMass.toFixed(1)}</td>
                  <td>{scan.bodyFatMass.toFixed(1)}</td>
                  <td>{scan.percentBodyFat.toFixed(1)}%</td>
                  <td>{scan.bmi.toFixed(1)}</td>
                  <td>{scan.leanBodyMass.toFixed(1)}</td>
                  <td>{scan.totalBodyWater.toFixed(1)}</td>
                  <td>{scan.ecwTbw.toFixed(3)}</td>
                  <td>{scan.visceralFatLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.archiveSection}>
        <div>
          <p className={styles.eyebrow}>Source archive</p>
          <h2>The data stays attached to the paper.</h2>
          <p>Seven original reports, merged chronologically with the newest scan last.</p>
        </div>
        <a href={bodyScanDriveUrl} target="_blank" rel="noreferrer">
          Open the seven-page archive
          <span aria-hidden="true">↗</span>
        </a>
      </section>
    </article>
  );
}

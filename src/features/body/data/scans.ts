export type BodyScan = {
  id: string;
  date: string;
  dateLabel: string;
  shortDate: string;
  time: string;
  weight: number;
  skeletalMuscleMass: number;
  bodyFatMass: number;
  percentBodyFat: number;
  bmi: number;
  intracellularWater: number;
  extracellularWater: number;
  totalBodyWater: number;
  dryLeanMass: number;
  leanBodyMass: number;
  ecwTbw: number;
  visceralFatLevel: number;
  basalMetabolicRate: number;
  skeletalMuscleIndex: number;
};

export const bodyScans: readonly BodyScan[] = [
  {
    id: "2025-11-18",
    date: "2025-11-18",
    dateLabel: "November 18, 2025",
    shortDate: "Nov 18",
    time: "11:25",
    weight: 173.4,
    skeletalMuscleMass: 76.1,
    bodyFatMass: 40.2,
    percentBodyFat: 23.2,
    bmi: 24.2,
    intracellularWater: 61.7,
    extracellularWater: 35.5,
    totalBodyWater: 97.2,
    dryLeanMass: 35.9,
    leanBodyMass: 133.2,
    ecwTbw: 0.365,
    visceralFatLevel: 7,
    basalMetabolicRate: 1674,
    skeletalMuscleIndex: 7.8,
  },
  {
    id: "2026-02-20",
    date: "2026-02-20",
    dateLabel: "February 20, 2026",
    shortDate: "Feb 20",
    time: "09:25",
    weight: 176.8,
    skeletalMuscleMass: 80.2,
    bodyFatMass: 36.6,
    percentBodyFat: 20.7,
    bmi: 24.7,
    intracellularWater: 65,
    extracellularWater: 37.3,
    totalBodyWater: 102.3,
    dryLeanMass: 37.9,
    leanBodyMass: 140.2,
    ecwTbw: 0.365,
    visceralFatLevel: 7,
    basalMetabolicRate: 1743,
    skeletalMuscleIndex: 8.1,
  },
  {
    id: "2026-04-07",
    date: "2026-04-07",
    dateLabel: "April 7, 2026",
    shortDate: "Apr 07",
    time: "07:20",
    weight: 178.3,
    skeletalMuscleMass: 83.1,
    bodyFatMass: 34.8,
    percentBodyFat: 19.5,
    bmi: 24.9,
    intracellularWater: 67,
    extracellularWater: 37.7,
    totalBodyWater: 104.7,
    dryLeanMass: 38.8,
    leanBodyMass: 143.5,
    ecwTbw: 0.36,
    visceralFatLevel: 6,
    basalMetabolicRate: 1776,
    skeletalMuscleIndex: 8.3,
  },
  {
    id: "2026-05-29",
    date: "2026-05-29",
    dateLabel: "May 29, 2026",
    shortDate: "May 29",
    time: "07:29",
    weight: 178,
    skeletalMuscleMass: 82.9,
    bodyFatMass: 34.5,
    percentBodyFat: 19.4,
    bmi: 24.8,
    intracellularWater: 67,
    extracellularWater: 37.5,
    totalBodyWater: 104.5,
    dryLeanMass: 39,
    leanBodyMass: 143.5,
    ecwTbw: 0.359,
    visceralFatLevel: 6,
    basalMetabolicRate: 1776,
    skeletalMuscleIndex: 8.2,
  },
  {
    id: "2026-06-19",
    date: "2026-06-19",
    dateLabel: "June 19, 2026",
    shortDate: "Jun 19",
    time: "07:28",
    weight: 178,
    skeletalMuscleMass: 82.7,
    bodyFatMass: 34.9,
    percentBodyFat: 19.7,
    bmi: 24.8,
    intracellularWater: 66.8,
    extracellularWater: 37.5,
    totalBodyWater: 104.3,
    dryLeanMass: 38.8,
    leanBodyMass: 143.1,
    ecwTbw: 0.359,
    visceralFatLevel: 6,
    basalMetabolicRate: 1771,
    skeletalMuscleIndex: 8.2,
  },
  {
    id: "2026-07-29",
    date: "2026-07-29",
    dateLabel: "July 29, 2026",
    shortDate: "Jul 29",
    time: "07:26",
    weight: 183.5,
    skeletalMuscleMass: 84.2,
    bodyFatMass: 37.6,
    percentBodyFat: 20.4,
    bmi: 25.6,
    intracellularWater: 68.1,
    extracellularWater: 38.4,
    totalBodyWater: 106.5,
    dryLeanMass: 39.5,
    leanBodyMass: 145.9,
    ecwTbw: 0.361,
    visceralFatLevel: 7,
    basalMetabolicRate: 1801,
    skeletalMuscleIndex: 8.3,
  },
  {
    id: "2026-08-26",
    date: "2026-08-26",
    dateLabel: "August 26, 2026",
    shortDate: "Aug 26",
    time: "08:50",
    weight: 182.1,
    skeletalMuscleMass: 82.5,
    bodyFatMass: 39.5,
    percentBodyFat: 21.7,
    bmi: 25.4,
    intracellularWater: 66.6,
    extracellularWater: 37.3,
    totalBodyWater: 103.8,
    dryLeanMass: 38.8,
    leanBodyMass: 142.6,
    ecwTbw: 0.359,
    visceralFatLevel: 7,
    basalMetabolicRate: 1767,
    skeletalMuscleIndex: 8.2,
  },
];

export type TrendMetricKey =
  | "weight"
  | "skeletalMuscleMass"
  | "percentBodyFat"
  | "leanBodyMass"
  | "totalBodyWater"
  | "bmi";

export type TrendMetric = {
  key: TrendMetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  decimals: number;
  color: string;
};

export const trendMetrics: readonly TrendMetric[] = [
  {
    key: "skeletalMuscleMass",
    label: "Skeletal muscle mass",
    shortLabel: "Muscle",
    unit: "lb",
    decimals: 1,
    color: "#a8ff6a",
  },
  {
    key: "percentBodyFat",
    label: "Percent body fat",
    shortLabel: "Body fat",
    unit: "%",
    decimals: 1,
    color: "#ffbd6a",
  },
  {
    key: "weight",
    label: "Body weight",
    shortLabel: "Weight",
    unit: "lb",
    decimals: 1,
    color: "#6ee7d8",
  },
  {
    key: "leanBodyMass",
    label: "Lean body mass",
    shortLabel: "Lean mass",
    unit: "lb",
    decimals: 1,
    color: "#8fd4ff",
  },
  {
    key: "totalBodyWater",
    label: "Total body water",
    shortLabel: "Body water",
    unit: "lb",
    decimals: 1,
    color: "#77a7ff",
  },
  {
    key: "bmi",
    label: "Body mass index",
    shortLabel: "BMI",
    unit: "",
    decimals: 1,
    color: "#d7b5ff",
  },
];

export const latestSegmentalLean = [
  { id: "right-arm", label: "Right arm", mass: 8.2, percent: 105 },
  { id: "left-arm", label: "Left arm", mass: 8.18, percent: 104.6 },
  { id: "trunk", label: "Trunk", mass: 64.3, percent: 103.2 },
  { id: "right-leg", label: "Right leg", mass: 20.99, percent: 96.7 },
  { id: "left-leg", label: "Left leg", mass: 21.21, percent: 97.6 },
] as const;

export const bodyScanDriveUrl =
  "https://drive.google.com/file/d/118BtZJ0qvDDLcTVN_l9Y-IDQ0sdYOKKJ/view";

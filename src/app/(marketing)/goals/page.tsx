import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import { GoalsPage } from "./goals-page";
import styles from "./goals.module.css";

const handwriting = Caveat({ subsets: ["latin"], variable: "--font-goals-hand", display: "swap" });

export const metadata: Metadata = {
  title: "Goals",
  description: "A personal vision board for October–December 2026, past goals, and a map of the next five years.",
};

export default function Page() {
  return <div className={`${styles.journal} ${handwriting.variable}`} id="goals-top"><GoalsPage /></div>;
}

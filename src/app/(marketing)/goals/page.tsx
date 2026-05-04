import type { Metadata } from "next";
import { GoalsPage } from "./goals-page";

export const metadata: Metadata = {
  title: "Goals",
  description: "Summer 2026 and a map of the next five years.",
};

export default function Page() {
  return <GoalsPage />;
}

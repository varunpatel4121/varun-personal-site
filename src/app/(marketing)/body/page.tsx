import type { Metadata } from "next";
import { BodyEvolution } from "@/features/body/components/body-evolution";

export const metadata: Metadata = {
  title: "Body",
  description:
    "An interactive record of Varun Patel's body composition, strength, and InBody scan history.",
};

export default function BodyPage() {
  return <BodyEvolution />;
}

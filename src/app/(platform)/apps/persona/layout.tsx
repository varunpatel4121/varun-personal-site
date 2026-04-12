import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Persona",
  description:
    "Conversational AI with configurable personality layers and memory.",
};

export default function PersonaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

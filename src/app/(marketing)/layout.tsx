import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { AmbientBackground } from "@/components/marketing/ambient-background";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AmbientBackground />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

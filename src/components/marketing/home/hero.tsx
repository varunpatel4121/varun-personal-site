"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-[15%] top-[20%] h-[600px] w-[600px] rounded-full bg-accent/[0.09] blur-[140px]"
          style={{ animation: "glow-drift 12s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[25%] right-[20%] h-[500px] w-[500px] rounded-full bg-indigo-500/[0.06] blur-[120px]"
          style={{ animation: "glow-drift-alt 15s ease-in-out infinite" }}
        />
        <div
          className="absolute left-[50%] top-[60%] h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-violet-400/[0.04] blur-[100px]"
          style={{ animation: "aurora-2 28s ease-in-out infinite" }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_300px]"
        >
          <div>
            <motion.p
              variants={fadeUp}
              className="font-mono text-sm uppercase tracking-[0.2em] text-accent-foreground sm:text-base"
            >
              Varun Patel
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-8 text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Building at the frontier of{" "}
              <span className="text-muted">
                AI, product, and human potential.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-2xl text-lg leading-relaxed text-muted"
            >
              Engineer and Wharton MBA candidate. Former Google. Exploring how
              intelligent systems can solve problems worth solving.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/projects"
                className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                View My Work
              </Link>
              <Link
                href="mailto:varun4@wharton.upenn.edu"
                className="rounded-md border border-border px-6 py-3 text-sm text-muted transition-colors hover:border-muted hover:text-foreground"
              >
                Get in Touch
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="relative mx-auto w-full max-w-[280px] lg:ml-auto"
          >
            <div className="pointer-events-none absolute -inset-5 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.16),transparent_65%)] blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-surface/45 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-sm">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <Image
                  src="/Professional_Picture_Varun_Patel.jpg"
                  alt="Professional portrait of Varun Patel"
                  fill
                  priority
                  sizes="(max-width: 1024px) 75vw, 320px"
                  className="object-cover object-top opacity-88 saturate-75"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { motion } from "motion/react";

export type BrandLoaderPhase = "loading" | "complete" | "exit";

export function BrandLoader({
  label = "Apertura Lama...",
  completeLabel = "Pronto",
  phase = "loading",
}: {
  label?: string;
  completeLabel?: string;
  phase?: BrandLoaderPhase;
}) {
  const isReady = phase !== "loading";

  return (
    <motion.main
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#0b0b0a]"
      initial={{ opacity: 0 }}
      animate={phase === "exit"
        ? { opacity: 0, scale: 1.015, filter: "blur(3px)" }
        : { opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: phase === "exit" ? 0.42 : 0.28, ease: "easeOut" }}
    >
      <motion.div
        aria-hidden
        className="absolute size-64 rounded-full bg-amber-300/10 blur-[80px]"
        animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.35, 0.68, 0.35] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.84, y: 10 }}
          animate={{ opacity: 1, scale: isReady ? 1.035 : 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-36 w-72 overflow-hidden drop-shadow-[0_14px_38px_rgba(200,164,91,.16)]"
        >
          <Image
            src="/lama-logo-white.png"
            alt="Lama Barber App"
            fill
            sizes="288px"
            className="scale-[1.55] object-contain"
            preload
          />
        </motion.div>

        <div
          className="mt-1 h-1 w-36 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Caricamento applicazione"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={isReady ? 100 : undefined}
        >
          <motion.div
            className="h-full rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.55)]"
            initial={{ width: "4%" }}
            animate={{ width: isReady ? "100%" : "82%" }}
            transition={{ duration: isReady ? 0.3 : 1.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <motion.p
          key={isReady ? "ready" : "loading"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.72, y: 0 }}
          className="mt-4 text-[11px] font-medium uppercase tracking-[.24em] text-zinc-400"
        >
          {isReady ? completeLabel : label}
        </motion.p>
      </div>
    </motion.main>
  );
}

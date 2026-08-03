"use client";

import { motion } from "motion/react";
import Image from "next/image";

export function BrandLoader({ label = "Apertura Lama…" }: { label?: string }) {
  return <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#0b0b0a]">
    <motion.div aria-hidden className="absolute size-64 rounded-full bg-amber-300/10 blur-[80px]" animate={{ scale: [0.85, 1.15, 0.85], opacity: [.35, .75, .35] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
    <div className="relative flex flex-col items-center">
      <motion.div initial={{ opacity: 0, scale: .78, y: 12 }} animate={{ opacity: 1, scale: [1, 1.025, 1], y: 0 }} transition={{ opacity: { duration: .45 }, y: { duration: .55, ease: "easeOut" }, scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }} className="relative h-32 w-64 overflow-hidden drop-shadow-[0_14px_35px_rgba(200,164,91,.14)]">
        <Image src="/lama-logo.png" alt="Lama Barber App" fill sizes="256px" className="scale-[1.55] object-contain" preload />
      </motion.div>
      <div className="mt-2 h-0.5 w-28 overflow-hidden rounded-full bg-white/8"><motion.div className="h-full w-1/2 rounded-full bg-amber-300" animate={{ x: ["-110%", "220%"] }} transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }} /></div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: [.45, .9, .45] }} transition={{ duration: 1.8, repeat: Infinity }} className="mt-4 text-[11px] font-medium uppercase tracking-[.24em] text-zinc-500">{label}</motion.p>
    </div>
  </main>;
}

"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { imageCandidates } from "@/lib/format";

export function AppImage({ src, alt, className, sizes = "96px" }: { src?: string | null; alt: string; className?: string; sizes?: string }) {
  const sourceKey = src ?? "";
  const candidates = useMemo(() => [...imageCandidates(src), "/placeholder-avatar.svg"].filter((value, index, all) => all.indexOf(value) === index), [src]);
  const [attempt, setAttempt] = useState({ sourceKey, index: 0 });
  const index = attempt.sourceKey === sourceKey ? attempt.index : 0;
  return <Image src={candidates[Math.min(index, candidates.length - 1)]} alt={alt} fill sizes={sizes} className={className ?? "object-cover"} onError={() => setAttempt({ sourceKey, index: index + 1 })} />;
}

"use client";
import Image from "next/image";
import { useState } from "react";
import { imageUrl } from "@/lib/format";
export function AppImage({ src, alt, className, sizes = "96px" }: { src?: string | null; alt: string; className?: string; sizes?: string }) { const [failed, setFailed] = useState(false); return <Image src={failed ? "/placeholder-avatar.svg" : imageUrl(src)} alt={alt} fill sizes={sizes} className={className ?? "object-cover"} onError={() => setFailed(true)} />; }

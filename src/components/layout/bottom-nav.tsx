"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { CalendarDays, Home, Package, Scissors, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/prenota", label: "Prenota", icon: Scissors },
  { href: "/prenotazioni", label: "Agenda", icon: CalendarDays },
  { href: "/prodotti", label: "Prodotti", icon: Package },
  { href: "/profilo", label: "Profilo", icon: UserRound },
] as const;

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  segment: number;
  dragging: boolean;
  cancelled: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const activeIndex = Math.max(0, items.findIndex((item) => item.href === pathname));
  const [previewIndex, setPreviewIndex] = useState(activeIndex);
  const [ready, setReady] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const suppressClickRef = useRef(false);
  const indicatorX = useMotionValue(0);

  const segmentWidth = useCallback(() => {
    const width = surfaceRef.current?.clientWidth ?? 0;
    return width > 8 ? (width - 8) / items.length : 0;
  }, []);

  const snapTo = useCallback((index: number, immediate = false) => {
    const segment = segmentWidth();
    if (!segment) return;
    const target = index * segment;
    indicatorX.stop();
    if (immediate || reduceMotion) indicatorX.set(target);
    else animate(indicatorX, target, { type: "spring", stiffness: 430, damping: 38, mass: .72 });
  }, [indicatorX, reduceMotion, segmentWidth]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    setPreviewIndex(activeIndex);
    snapTo(activeIndex, !ready);
    setReady(true);
    const observer = new ResizeObserver(() => snapTo(activeIndex, true));
    observer.observe(surface);
    return () => observer.disconnect();
  }, [activeIndex, ready, snapTo]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const segment = segmentWidth();
    if (!segment) return;
    indicatorX.stop();
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: activeIndex * segment,
      segment,
      dragging: false,
      cancelled: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || gesture.cancelled) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (!gesture.dragging) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        gesture.cancelled = true;
        snapTo(activeIndex);
        return;
      }
      if (Math.abs(deltaX) < 6) return;
      gesture.dragging = true;
      suppressClickRef.current = true;
    }

    if (event.cancelable) event.preventDefault();
    const x = clamp(gesture.originX + deltaX, 0, gesture.segment * (items.length - 1));
    indicatorX.set(x);
    setPreviewIndex(clamp(Math.round(x / gesture.segment), 0, items.length - 1));
  }

  function finishGesture(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    gestureRef.current = null;

    if (!gesture.dragging || gesture.cancelled) {
      setPreviewIndex(activeIndex);
      snapTo(activeIndex);
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    let target = Math.round(clamp((gesture.originX + deltaX) / gesture.segment, 0, items.length - 1));
    if (Math.abs(deltaX) >= 20 && target === activeIndex) target = clamp(activeIndex + Math.sign(deltaX), 0, items.length - 1);
    if (Math.abs(deltaX) < 20) target = activeIndex;

    setPreviewIndex(target);
    snapTo(target);
    if (target !== activeIndex) router.push(items[target].href);
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  }

  function cancelGesture(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    suppressClickRef.current = false;
    setPreviewIndex(activeIndex);
    snapTo(activeIndex);
  }

  function handleLinkClick(event: React.MouseEvent<HTMLAnchorElement>, index: number) {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    setPreviewIndex(index);
    snapTo(index);
  }

  return (
    <nav aria-label="Navigazione principale" className="pointer-events-none fixed inset-x-0 bottom-[calc(.4rem+env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-1rem)] max-w-[648px]">
      <div
        ref={surfaceRef}
        className="pointer-events-auto relative grid h-[4.1rem] touch-pan-y cursor-grab select-none grid-cols-5 rounded-[1.55rem] border border-white/8 bg-zinc-900/78 p-1 shadow-[0_14px_48px_rgba(0,0,0,.48)] backdrop-blur-3xl active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={cancelGesture}
      >
        <motion.span
          aria-hidden
          style={{ x: indicatorX, width: `calc((100% - 8px) / ${items.length})` }}
          animate={{ opacity: ready ? 1 : 0 }}
          className="pointer-events-none absolute bottom-1 left-1 top-1 rounded-[1.05rem] bg-amber-300 shadow-[0_8px_22px_rgba(200,164,91,.16)]"
        />
        {items.map((item, index) => {
          const selected = previewIndex === index;
          const active = activeIndex === index;
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} draggable={false} onDragStart={(event) => event.preventDefault()} onClick={(event) => handleLinkClick(event, index)} aria-current={active ? "page" : undefined} className={`relative z-10 flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.15rem] text-[9px] font-medium transition-colors duration-150 ${selected ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-200"}`}><Icon className="size-[1.15rem]" /><span className="max-w-full truncate">{item.label}</span></Link>;
        })}
      </div>
    </nav>
  );
}

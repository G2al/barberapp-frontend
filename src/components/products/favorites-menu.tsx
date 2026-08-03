"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { euro } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import { AppImage } from "@/components/ui/app-image";
import { ErrorState, Skeleton } from "@/components/ui/primitives";

export function FavoritesMenu({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.favorites, queryFn: endpoints.favorites });
  const products = query.data ? (Array.isArray(query.data) ? query.data : "favorites" in query.data ? query.data.favorites : query.data.products) : [];
  const remove = useMutation({ mutationFn: endpoints.removeFavorite, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.favorites }), queryClient.invalidateQueries({ queryKey: queryKeys.products })]); } });

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, open]);

  return <>
    <button onClick={onOpen} aria-label={`Apri preferiti${products.length ? `, ${products.length} prodotti` : ""}`} aria-haspopup="dialog" className="relative grid size-10 place-items-center rounded-full bg-white/[.055] text-zinc-200 shadow-lg transition hover:bg-white/10">
      <Heart className={`size-[1.15rem] ${products.length ? "fill-amber-300 text-amber-300" : ""}`} />
      {products.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-amber-300 px-1 text-[9px] font-bold leading-[1.125rem] text-zinc-950">{products.length > 9 ? "9+" : products.length}</span>}
    </button>
    {typeof document !== "undefined" && createPortal(<AnimatePresence>{open && <>
      <motion.button aria-label="Chiudi lista preferiti" className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside role="dialog" aria-modal="true" aria-labelledby="global-favorites-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 34 }} className="fixed bottom-0 right-0 top-0 z-[60] w-[min(88vw,390px)] overflow-y-auto border-l border-white/10 bg-zinc-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">La tua selezione</p><h2 id="global-favorites-title" className="mt-1 text-2xl font-semibold">Preferiti</h2><p className="mt-1 text-sm text-zinc-500">{products.length} {products.length === 1 ? "prodotto" : "prodotti"}</p></div><button onClick={onClose} aria-label="Chiudi" className="grid size-11 place-items-center rounded-full bg-white/5"><X /></button></div>
        {query.isPending ? <div className="mt-7 space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : query.isError ? <div className="mt-7"><ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} /></div> : !products.length ? <div className="mt-16 text-center"><Heart className="mx-auto size-10 text-zinc-700" /><p className="mt-4 font-medium">La lista è vuota</p><p className="mt-2 text-sm text-zinc-500">Tocca il cuore su un prodotto per ritrovarlo qui.</p></div> : <div className="mt-7 space-y-3">{products.map((product) => <motion.div layout key={product.id} className="flex gap-3 rounded-2xl bg-white/[.04] p-3"><div className="relative size-20 shrink-0 overflow-hidden rounded-xl"><AppImage src={product.image_url ?? product.image} alt={product.name} sizes="80px" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{product.name}</p><p className="mt-1 text-xs text-zinc-500">{product.category}</p><p className="mt-2 text-sm font-semibold text-amber-300">{euro(product.price)}</p></div><button disabled={remove.isPending} onClick={() => remove.mutate(product.id)} aria-label={`Rimuovi ${product.name} dai preferiti`} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5"><Heart className="size-4 fill-amber-300 text-amber-300" /></button></motion.div>)}</div>}
        {remove.isError && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{apiErrorMessage(remove.error)}</p>}
      </motion.aside>
    </>}</AnimatePresence>, document.body)}
  </>;
}

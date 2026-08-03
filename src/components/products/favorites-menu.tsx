"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, X } from "lucide-react";
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
  const whatsappMessage = `Ciao Lama, sono interessato ${products.length === 1 ? "a questo prodotto" : "a questi prodotti"}:\n\n${products.map((product) => `• ${product.name}`).join("\n")}\n\nPotrei avere maggiori informazioni su disponibilità e prezzo?`;
  const whatsappUrl = `https://wa.me/393240994144?text=${encodeURIComponent(whatsappMessage)}`;
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
      <motion.aside role="dialog" aria-modal="true" aria-labelledby="global-favorites-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 34 }} className="fixed bottom-0 right-0 top-0 z-[60] flex w-[min(88vw,390px)] flex-col overflow-y-auto border-l border-white/10 bg-zinc-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">La tua selezione</p><h2 id="global-favorites-title" className="mt-1 text-2xl font-semibold">Preferiti</h2><p className="mt-1 text-sm text-zinc-500">{products.length} {products.length === 1 ? "prodotto" : "prodotti"}</p></div><button onClick={onClose} aria-label="Chiudi" className="grid size-11 place-items-center rounded-full bg-white/5"><X /></button></div>
        {query.isPending ? <div className="mt-7 flex-1 space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : query.isError ? <div className="mt-7 flex-1"><ErrorState message={apiErrorMessage(query.error)} retry={() => query.refetch()} /></div> : !products.length ? <div className="flex flex-1 flex-col items-center justify-center py-16 text-center"><Heart className="size-10 text-zinc-700" /><p className="mt-4 font-medium">La lista è vuota</p><p className="mt-2 text-sm text-zinc-500">Tocca il cuore su un prodotto per ritrovarlo qui.</p></div> : <div className="mt-7 flex-1 space-y-2.5">{products.map((product) => <motion.article layout key={product.id} className="flex gap-3 rounded-[1.35rem] border border-white/6 bg-white/[.035] p-2.5"><div className="relative size-[4.25rem] shrink-0 overflow-hidden rounded-2xl bg-white/5"><AppImage src={product.image_url ?? product.image} alt={product.name} sizes="68px" /></div><div className="flex min-w-0 flex-1 flex-col py-0.5"><p className="truncate text-sm font-semibold">{product.name}</p>{product.category && <p className="mt-0.5 truncate text-[11px] text-zinc-500">{product.category}</p>}<div className="mt-auto flex items-end justify-between gap-2 pt-2"><p className="truncate text-xs font-semibold text-amber-300">{euro(product.price)}</p><button disabled={remove.isPending} onClick={() => remove.mutate(product.id)} aria-label={`Rimuovi ${product.name} dai preferiti`} className="flex min-h-8 shrink-0 items-center gap-1 rounded-full bg-red-400/8 px-2.5 text-[10px] font-medium text-red-300 transition hover:bg-red-400/15"><X className="size-3" />Rimuovi</button></div></div></motion.article>)}</div>}
        {remove.isError && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{apiErrorMessage(remove.error)}</p>}
        {!!products.length && <div className="sticky bottom-0 -mx-5 mt-5 bg-zinc-900 px-5 pb-1 pt-4"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 font-semibold text-zinc-950 shadow-[0_12px_35px_rgba(37,211,102,.18)]"><MessageCircle className="size-5" />Invia richiesta su WhatsApp</a><p className="mt-2 text-center text-[10px] text-zinc-600">Si apre una chat con la lista già compilata</p></div>}
      </motion.aside>
    </>}</AnimatePresence>, document.body)}
  </>;
}

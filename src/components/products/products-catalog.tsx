"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Heart, Search, X } from "lucide-react";
import { useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { apiErrorMessage } from "@/lib/api/client";
import { euro } from "@/lib/format";
import { queryKeys } from "@/lib/query/keys";
import type { Product } from "@/types";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState, ErrorState, Input, PageTitle, Skeleton } from "@/components/ui/primitives";

export function ProductsCatalog() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({ queryKey: queryKeys.products, queryFn: endpoints.products });
  const favoritesQuery = useQuery({ queryKey: queryKeys.favorites, queryFn: endpoints.favorites });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tutti");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const favoriteItems = favoritesQuery.data ? (Array.isArray(favoritesQuery.data) ? favoritesQuery.data : "favorites" in favoritesQuery.data ? favoritesQuery.data.favorites : favoritesQuery.data.products) : [];
  const favoriteIds = new Set(favoriteItems.map((product) => String(product.id)));
  const products = (productsQuery.data?.products ?? []).map((product) => ({ ...product, is_favorite: overrides[String(product.id)] ?? Boolean(product.is_favorite || favoriteIds.has(String(product.id))) }));
  const favorites = products.filter((product) => product.is_favorite);
  const categories = ["Tutti", ...new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))];
  const shown = products.filter((product) => (category === "Tutti" || product.category === category) && `${product.name} ${product.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  const mutation = useMutation({
    mutationFn: (product: Product) => product.is_favorite ? endpoints.removeFavorite(product.id) : endpoints.addFavorite(product.id),
    onMutate: (product) => {
      const next = !product.is_favorite;
      setError("");
      setOverrides((current) => ({ ...current, [String(product.id)]: next }));
      if (next) setDrawerOpen(true);
      return { previous: Boolean(product.is_favorite) };
    },
    onError: (mutationError, product, context) => { setOverrides((current) => ({ ...current, [String(product.id)]: context?.previous ?? Boolean(product.is_favorite) })); setError(apiErrorMessage(mutationError)); },
    onSettled: async (_data, _error, product) => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.products }), queryClient.invalidateQueries({ queryKey: queryKeys.favorites })]);
      setOverrides((current) => { const next = { ...current }; delete next[String(product.id)]; return next; });
    },
  });

  return <>
    <PageTitle eyebrow="Selezione barber" title="Prodotti" description="Cura quotidiana, scelta dai professionisti della barberia." />
    <button onClick={() => setDrawerOpen(true)} className="mb-4 flex w-full items-center justify-between rounded-[1.5rem] bg-amber-300 px-4 py-3 text-zinc-950 shadow-[0_12px_35px_rgba(252,211,77,.1)]"><span className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-zinc-950/10"><Heart className={`size-5 ${favorites.length ? "fill-zinc-950" : ""}`} /></span><span className="text-left"><strong className="block text-sm">I tuoi preferiti</strong><span className="block text-xs opacity-70">{favorites.length ? `${favorites.length} prodotti salvati` : "La tua lista è vuota"}</span></span></span><ChevronRight /></button>
    <div className="relative"><Search className="absolute left-4 top-3.5 size-5 text-zinc-500" /><Input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Cerca prodotti" placeholder="Cerca un prodotto" className="pl-12" /></div>
    <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`relative min-h-10 shrink-0 overflow-hidden rounded-full px-4 text-xs ${category === item ? "text-zinc-950" : "bg-white/[.035] text-zinc-400"}`}>{category === item && <motion.span layoutId="category-active" className="absolute inset-0 bg-amber-300" />}<span className="relative">{item}</span></button>)}</div>
    {error && <p role="alert" className="mt-3 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
    {productsQuery.isPending ? <div className="mt-5 grid grid-cols-2 gap-3"><Skeleton className="h-72" /><Skeleton className="h-72" /></div> : productsQuery.isError ? <div className="mt-5"><ErrorState message={apiErrorMessage(productsQuery.error)} retry={() => productsQuery.refetch()} /></div> : !shown.length ? <div className="mt-5"><EmptyState title="Nessun prodotto" description="Prova a cambiare ricerca o categoria." /></div> : <motion.div layout className="mt-5 grid grid-cols-2 gap-3">{shown.map((product, index) => <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .03 }} key={product.id} className={`overflow-hidden rounded-[1.65rem] bg-card shadow-lg ring-1 ring-white/8 ${shown.length === 1 ? "col-span-2 grid grid-cols-[42%_1fr]" : ""}`}><div className="relative aspect-square bg-white/5"><AppImage src={product.image_url} alt={product.name} sizes={shown.length === 1 ? "280px" : "(max-width: 672px) 50vw, 320px"} /><motion.button whileTap={{ scale: .76 }} animate={product.is_favorite ? { scale: [1, 1.25, 1] } : { scale: 1 }} aria-label={product.is_favorite ? `Rimuovi ${product.name} dai preferiti` : `Aggiungi ${product.name} ai preferiti`} disabled={mutation.isPending} onClick={() => mutation.mutate(product)} className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-zinc-950/80 shadow-xl backdrop-blur"><Heart className={`size-5 transition ${product.is_favorite ? "fill-amber-300 text-amber-300" : "text-white"}`} /></motion.button></div><div className="flex flex-col justify-center p-4">{product.category && <p className="text-[10px] uppercase tracking-wider text-amber-300">{product.category}</p>}<h2 className="mt-1 line-clamp-2 font-semibold">{product.name}</h2>{product.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{product.description}</p>}<p className="mt-3 text-sm font-semibold">{euro(product.price)}</p></div></motion.article>)}</motion.div>}
    <AnimatePresence>{drawerOpen && <FavoritesDrawer products={favorites} busy={mutation.isPending} onToggle={(product) => mutation.mutate(product)} onClose={() => setDrawerOpen(false)} />}</AnimatePresence>
  </>;
}

function FavoritesDrawer({ products, busy, onToggle, onClose }: { products: Product[]; busy: boolean; onToggle: (product: Product) => void; onClose: () => void }) {
  return <><motion.button aria-label="Chiudi lista preferiti" className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.aside role="dialog" aria-modal="true" aria-labelledby="favorites-title" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 34 }} className="fixed bottom-0 right-0 top-0 z-[60] w-[min(88vw,390px)] overflow-y-auto border-l border-white/10 bg-zinc-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">La tua selezione</p><h2 id="favorites-title" className="mt-1 text-2xl font-semibold">Preferiti</h2><p className="mt-1 text-sm text-zinc-500">{products.length} {products.length === 1 ? "prodotto" : "prodotti"}</p></div><button onClick={onClose} aria-label="Chiudi" className="grid size-11 place-items-center rounded-full bg-white/5"><X /></button></div>{!products.length ? <div className="mt-16 text-center"><Heart className="mx-auto size-10 text-zinc-700" /><p className="mt-4 font-medium">La lista è vuota</p><p className="mt-2 text-sm text-zinc-500">Tocca il cuore su un prodotto per ritrovarlo qui.</p></div> : <div className="mt-7 space-y-3">{products.map((product) => <motion.div layout key={product.id} className="flex gap-3 rounded-2xl bg-white/[.04] p-3"><div className="relative size-20 shrink-0 overflow-hidden rounded-xl"><AppImage src={product.image_url} alt={product.name} sizes="80px" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{product.name}</p><p className="mt-1 text-xs text-zinc-500">{product.category}</p><p className="mt-2 text-sm font-semibold text-amber-300">{euro(product.price)}</p></div><button disabled={busy} onClick={() => onToggle(product)} aria-label={`Rimuovi ${product.name} dai preferiti`} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5"><Heart className="size-4 fill-amber-300 text-amber-300" /></button></motion.div>)}</div>}</motion.aside></>;
}

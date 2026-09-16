"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LogOut, X } from "lucide-react";
import { useRef } from "react";

export function LogoutDialog({ onConfirm, onOpen, pending }: { onConfirm: () => void; onOpen: () => void; pending: boolean }) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return <Dialog.Root onOpenChange={open => { if (open) onOpen(); }}>
    <Dialog.Trigger disabled={pending} aria-label="Esci dall’account" className="grid size-10 place-items-center rounded-full bg-red-400/[.07] text-red-300 shadow-lg transition hover:bg-red-400/15 disabled:opacity-50">
      <LogOut className="size-[1.15rem]" />
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none" />
      <Dialog.Popup initialFocus={cancelRef} className="fixed left-1/2 top-1/2 z-[90] max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2rem] border border-white/10 bg-[#191918] p-6 text-zinc-100 shadow-2xl outline-none transition-[opacity,scale] duration-200 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none">
        <Dialog.Close aria-label="Chiudi conferma uscita" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-300"><X className="size-5" /></Dialog.Close>
        <div aria-hidden="true" className="mb-5 grid size-14 place-items-center rounded-2xl border border-amber-300/15 bg-amber-300/10 text-amber-300"><LogOut className="size-6" /></div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-amber-300">Del Piano Luxury</p>
        <Dialog.Title className="text-2xl font-semibold tracking-tight">Vuoi uscire?</Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-relaxed text-zinc-400">Uscirai dal tuo account su questo dispositivo. Potrai accedere di nuovo quando vuoi: le tue prenotazioni resteranno salvate.</Dialog.Description>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Dialog.Close ref={cancelRef} className="min-h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300">Resta qui</Dialog.Close>
          <button type="button" disabled={pending} onClick={onConfirm} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-50"><LogOut className="size-4" />Esci</button>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

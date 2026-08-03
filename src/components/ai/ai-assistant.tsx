"use client";

import { AnimatePresence, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Sparkles, Trash2, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import { useAuth } from "@/providers/auth-provider";
import { ChatMessage, type ChatMessageData, LoadingMessage } from "./chat-message";
import type { AiChatHistoryMessage, AiConfirmBookingAction, BookingsResponse } from "@/types";

const MAX_MESSAGE_LENGTH = 800;
const KEYBOARD_THRESHOLD = 120;

type KeyboardViewport = {
  top: number;
  height: number;
};

const initialMessage: ChatMessageData = {
  id: 0,
  role: "assistant",
  text: "Ciao! Posso aiutarti con servizi, prezzi, orari, prenotazioni e punti fedeltà.",
};
const suggestions = [
  "Quali servizi offrite?",
  "Quali sono gli orari?",
  "Come funzionano i punti?",
  "Come annullo una prenotazione?",
];

export function AiAssistant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([initialMessage]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [keyboardViewport, setKeyboardViewport] = useState<KeyboardViewport | null>(null);
  const requestInFlightRef = useRef(false);
  const bookingInFlightRef = useRef(new Set<number>());
  const nextId = useRef(1);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => previousFocusRef.current?.focus(), 250);
  }, []);

  const show = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 320);
    const onEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const syncViewport = () => {
      if (window.matchMedia("(min-width: 640px)").matches) {
        setKeyboardViewport(null);
        return;
      }

      const layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
      const coveredHeight = layoutHeight - visualViewport.height - visualViewport.offsetTop;
      const keyboardOpen = document.activeElement === inputRef.current && coveredHeight > KEYBOARD_THRESHOLD;

      if (!keyboardOpen) {
        setKeyboardViewport(null);
        return;
      }

      const height = Math.min(visualViewport.height, Math.max(320, Math.round(visualViewport.height * .86)));
      const top = Math.round(visualViewport.offsetTop + visualViewport.height - height);
      setKeyboardViewport((current) => current?.top === top && current.height === height ? current : { top, height });
    };

    syncViewport();
    visualViewport.addEventListener("resize", syncViewport);
    visualViewport.addEventListener("scroll", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    return () => {
      visualViewport.removeEventListener("resize", syncViewport);
      visualViewport.removeEventListener("scroll", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const messagesArea = messagesRef.current;
    if (!messagesArea) return;
    const frame = window.requestAnimationFrame(() => {
      messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [keyboardViewport, messages, open, sending]);

  async function sendMessage(value = draft) {
    const message = value.trim();
    if (!message || requestInFlightRef.current || message.length > MAX_MESSAGE_LENGTH) return;

    const history: AiChatHistoryMessage[] = messages
      .flatMap((item) => item.role === "error" ? [] : [{ role: item.role, content: item.text }])
      .slice(-8);
    requestInFlightRef.current = true;
    const userMessage: ChatMessageData = { id: nextId.current++, role: "user", text: message };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setSending(true);
    if (inputRef.current) inputRef.current.style.height = "44px";

    try {
      const response = await endpoints.aiChat({ message, history });
      const answer = response.answer?.trim();
      if (!response.status || !answer) throw new Error("L'assistente non ha restituito una risposta valida.");
      const action = response.action?.type === "confirm_booking" ? response.action : undefined;
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: answer, action, bookingStatus: action ? "idle" : undefined }]);
    } catch (error) {
      setMessages((current) => [...current, { id: nextId.current++, role: "error", text: assistantErrorMessage(error) }]);
    } finally {
      requestInFlightRef.current = false;
      setSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function clearChat() {
    if (requestInFlightRef.current || bookingInFlightRef.current.size) return;
    setMessages([initialMessage]);
    setDraft("");
    nextId.current = 1;
    if (inputRef.current) inputRef.current.style.height = "44px";
  }

  async function confirmBooking(messageId: number, action: AiConfirmBookingAction) {
    if (bookingInFlightRef.current.has(messageId)) return;
    bookingInFlightRef.current.add(messageId);
    setMessages((current) => current.map((item) => item.id === messageId ? { ...item, bookingStatus: "loading", bookingError: undefined } : item));

    try {
      const response = await endpoints.createBooking(action.payload);
      if (response.status === false) throw new Error(response.message || "Non è stato possibile confermare la prenotazione.");
      setMessages((current) => current.map((item) => item.id === messageId ? { ...item, bookingStatus: "success", bookingError: undefined } : item));
      if (response.booking) {
        queryClient.setQueryData<BookingsResponse>(queryKeys.bookings, (current) => ({ bookings: [response.booking!, ...(current?.bookings ?? []).filter((item) => item.id !== response.booking!.id)] }));
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings, refetchType: "all" });
    } catch (error) {
      setMessages((current) => current.map((item) => item.id === messageId ? { ...item, bookingStatus: "error", bookingError: bookingErrorMessage(error) } : item));
    } finally {
      bookingInFlightRef.current.delete(messageId);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const controls = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  if (typeof document === "undefined") return null;
  const bookingPending = messages.some((message) => message.bookingStatus === "loading");

  return createPortal(
    <>
      <AnimatePresence initial={false}>
        {!open && (
          <motion.button
            type="button"
            aria-label="Apri Assistente BarberApp"
            aria-haspopup="dialog"
            onClick={show}
            initial={{ opacity: 0, scale: .8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .8 }}
            whileTap={{ scale: .92 }}
            className="fixed bottom-[calc(6.4rem+env(safe-area-inset-bottom))] right-5 z-[45] grid size-14 place-items-center rounded-full bg-amber-300 text-zinc-950 shadow-[0_14px_38px_rgba(200,164,91,.28)] sm:right-[max(1.25rem,calc((100vw-42rem)/2+1.25rem))]"
          >
            <Bot className="size-6" />
            <span className="absolute -right-0.5 -top-0.5 rounded-full bg-zinc-950 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-amber-300 ring-1 ring-amber-300/30">AI</span>
          </motion.button>
        )}

        {open && (
          <>
            <motion.button type="button" aria-label="Chiudi Assistente BarberApp" onClick={close} className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm sm:bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-assistant-title"
              onKeyDown={trapFocus}
              initial={{ y: "100%", opacity: .6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 330, damping: 34 }}
              style={keyboardViewport ? { top: keyboardViewport.top, bottom: "auto", height: keyboardViewport.height } : undefined}
              className="fixed inset-x-0 bottom-0 z-[70] flex h-[min(82dvh,720px)] flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-zinc-900 shadow-2xl sm:inset-x-auto sm:bottom-[calc(6.4rem+env(safe-area-inset-bottom))] sm:right-[max(1.25rem,calc((100vw-42rem)/2+1.25rem))] sm:h-[min(620px,calc(100dvh-8rem))] sm:w-[390px] sm:rounded-[2rem]"
            >
              <header className="flex items-center gap-3 border-b border-white/8 p-4">
                <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300 text-zinc-950"><Bot className="size-5" /><Sparkles className="absolute -right-1 -top-1 size-3.5 text-amber-200" /></span>
                <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-300">Supporto intelligente</p><h2 id="ai-assistant-title" className="truncate text-lg font-semibold">Assistente BarberApp</h2></div>
                {messages.length > 1 && <button type="button" onClick={clearChat} disabled={sending || bookingPending} aria-label="Svuota conversazione" title="Svuota conversazione" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-zinc-400 transition hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="size-4" /></button>}
                <button type="button" onClick={close} aria-label="Chiudi assistente" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-zinc-300 transition hover:bg-white/10"><X className="size-5" /></button>
              </header>

              <div ref={messagesRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5" aria-live="polite" aria-relevant="additions">
                {messages.map((message) => <ChatMessage key={message.id} message={message} userAvatar={user?.avatar_url ?? user?.avatar} userName={[user?.name, user?.surname].filter(Boolean).join(" ")} onConfirmBooking={confirmBooking} />)}
                {messages.length === 1 && (
                  <div className="grid gap-2 pl-10" aria-label="Domande suggerite">
                    {suggestions.map((suggestion) => <button type="button" key={suggestion} disabled={sending} onClick={() => void sendMessage(suggestion)} className="min-h-10 rounded-xl border border-amber-300/15 bg-amber-300/[.04] px-3 text-left text-xs text-amber-100 transition hover:bg-amber-300/10 disabled:opacity-50">{suggestion}</button>)}
                  </div>
                )}
                {sending && <LoadingMessage />}
              </div>

              <form onSubmit={submit} className={`shrink-0 border-t border-white/8 bg-zinc-950/60 px-4 pt-3 sm:pb-4 ${keyboardViewport ? "pb-2" : "pb-[calc(1rem+env(safe-area-inset-bottom))]"}`}>
                <div className="flex items-end gap-2 rounded-[1.35rem] border border-white/10 bg-white/[.045] p-1.5 focus-within:border-amber-300/40 focus-within:ring-4 focus-within:ring-amber-300/[.06]">
                  <textarea
                    ref={inputRef}
                    value={draft}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={1}
                    disabled={sending}
                    aria-label="Scrivi un messaggio all'assistente"
                    aria-describedby="ai-character-count"
                    placeholder="Chiedi qualcosa a Lama..."
                    onKeyDown={handleInputKeyDown}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      event.currentTarget.style.height = "44px";
                      event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 96)}px`;
                    }}
                    className="min-h-11 max-h-24 flex-1 resize-none bg-transparent px-3 py-2.5 text-[16px] leading-6 text-white outline-none placeholder:text-zinc-600 disabled:opacity-60"
                  />
                  <button type="submit" disabled={sending || !draft.trim()} aria-label={sending ? "Invio in corso" : "Invia messaggio"} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300 text-zinc-950 transition hover:bg-amber-200 disabled:bg-white/5 disabled:text-zinc-600"><Send className="size-4" /></button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] text-zinc-600"><span>Contesto conversazione attivo</span><span id="ai-character-count" className={draft.length >= 780 ? "text-red-300" : draft.length >= 700 ? "text-amber-300" : undefined}>{draft.length}/{MAX_MESSAGE_LENGTH}</span></div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

function assistantErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const payloadMessage = error.payload && typeof error.payload === "object" && "message" in error.payload && typeof error.payload.message === "string" ? error.payload.message : "";
    if (payloadMessage) {
      if (error.status === 429) return `${payloadMessage} Attendi qualche momento prima di riprovare.`;
      return payloadMessage;
    }
    if (error.status === 401) return "La sessione è scaduta. Accedi nuovamente per usare l'assistente.";
    if (error.status === 403) return "Il tuo account non è attivo. Contatta Lama per ricevere assistenza.";
    if (error.status === 422) return "Controlla il messaggio: deve contenere una domanda valida entro 800 caratteri.";
    if (error.status === 429) return "Hai inviato troppe richieste. Attendi qualche momento prima di riprovare.";
    if (error.status === 503) return "L'assistente è temporaneamente non disponibile. Riprova più tardi.";
  }
  return apiErrorMessage(error);
}

function bookingErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Non è stato possibile confermare la prenotazione. Riprova.";
}

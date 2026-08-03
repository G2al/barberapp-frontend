import { AlertCircle, Bot, UserRound } from "lucide-react";

export type ChatMessageData = {
  id: number;
  role: "assistant" | "user" | "error";
  text: string;
};

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const user = message.role === "user";
  const error = message.role === "error";

  return (
    <article className={`flex items-end gap-2.5 ${user ? "justify-end" : "justify-start"}`}>
      {!user && (
        <span className={`grid size-8 shrink-0 place-items-center rounded-full ${error ? "bg-red-400/10 text-red-300" : "bg-amber-300/10 text-amber-300"}`} aria-hidden>
          {error ? <AlertCircle className="size-4" /> : <Bot className="size-4" />}
        </span>
      )}
      <div className={`max-w-[82%] rounded-[1.35rem] px-4 py-3 text-sm leading-6 ${user ? "rounded-br-md bg-amber-300 text-zinc-950" : error ? "rounded-bl-md border border-red-300/15 bg-red-400/[.07] text-red-100" : "rounded-bl-md bg-white/[.055] text-zinc-200"}`}>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
      {user && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-300 text-zinc-950" aria-hidden><UserRound className="size-4" /></span>}
    </article>
  );
}

export function LoadingMessage() {
  return (
    <div className="flex items-end gap-2.5" aria-label="L'assistente sta scrivendo" role="status">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-300/10 text-amber-300" aria-hidden><Bot className="size-4" /></span>
      <div className="flex h-11 items-center gap-1.5 rounded-[1.35rem] rounded-bl-md bg-white/[.055] px-4">
        {[0, 1, 2].map((item) => <span key={item} className="size-1.5 animate-bounce rounded-full bg-amber-300" style={{ animationDelay: `${item * 120}ms` }} />)}
      </div>
    </div>
  );
}

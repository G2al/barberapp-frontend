import Image from "next/image";
import { cn } from "@/lib/utils";
import { AuthForm } from "./auth-form";
import { InstallGuide } from "./install-guide";

type AuthMode = "login" | "register" | "forgot" | "reset";

export function AuthPage({
  mode,
  title,
  description,
}: {
  mode: AuthMode;
  title: string;
  description: string;
}) {
  const hasBarberBackground = mode === "login" || mode === "register";
  const compact = mode === "register";

  return (
    <main className="auth-page relative isolate overflow-x-clip" data-auth-background={hasBarberBackground ? "barber" : undefined}>
      {hasBarberBackground && (
        <div aria-hidden className="auth-background pointer-events-none" />
      )}

      <div className={cn("auth-content relative z-10 mx-auto flex w-full max-w-md flex-col justify-center has-[.install-guide]:justify-start", compact && "auth-content-compact")}>
        <div className={cn("relative mx-auto", compact ? "mb-2 size-20" : "mb-5 size-36")}>
          <Image
            src="/del-piano-logo.png"
            alt="Del Piano Luxury"
            fill
            sizes="144px"
            className="object-contain"
            loading="eager"
          />
        </div>

        <section className={cn("border border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-sm", compact ? "rounded-[1.6rem] p-4" : "rounded-[2rem] p-6")}>
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Area clienti Del Piano Luxury</p>
            <h1 className={cn("font-semibold tracking-tight", compact ? "mt-1 text-2xl" : "mt-3 text-3xl")}>{title}</h1>
            <p className={cn("text-zinc-400", compact ? "mb-3 mt-1 text-xs leading-5" : "mb-7 mt-2 text-sm leading-6")}>{description}</p>
          </header>
          <AuthForm mode={mode} />
        </section>
        {mode === "login" && <InstallGuide />}
      </div>
    </main>
  );
}

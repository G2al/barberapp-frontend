import Image from "next/image";
import { cn } from "@/lib/utils";
import { AuthForm } from "./auth-form";

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
    <main className="relative min-h-dvh overflow-x-hidden bg-[#0b0b0a]">
      {hasBarberBackground && (
        <>
          <Image
            src="/auth-background.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            fetchPriority="high"
            loading="eager"
          />
          <div aria-hidden className="absolute inset-0 bg-black/35" />
        </>
      )}

      <div className={cn("relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5", compact ? "py-4" : "py-10")}>
        <div className={cn("relative mx-auto overflow-hidden drop-shadow-[0_12px_32px_rgba(0,0,0,.5)]", compact ? "mb-1 h-16 w-52" : "mb-5 h-28 w-64")}>
          <Image
            src="/lama-logo-white.png"
            alt="Lama Barber App"
            fill
            sizes="256px"
            className={cn("object-contain", compact ? "scale-[1.9]" : "scale-[1.55]")}
            loading="eager"
          />
        </div>

        <section className={cn("border border-white/10 bg-zinc-950/90 shadow-2xl backdrop-blur-sm", compact ? "rounded-[1.6rem] p-4" : "rounded-[2rem] p-6")}>
          <header className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Area clienti Lama</p>
            <h1 className={cn("font-semibold tracking-tight", compact ? "mt-1 text-2xl" : "mt-3 text-3xl")}>{title}</h1>
            <p className={cn("text-zinc-400", compact ? "mb-3 mt-1 text-xs leading-5" : "mb-7 mt-2 text-sm leading-6")}>{description}</p>
          </header>
          <AuthForm mode={mode} />
        </section>
      </div>
    </main>
  );
}

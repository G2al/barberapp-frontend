import Image from "next/image";
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

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="relative mx-auto mb-5 h-28 w-64 overflow-hidden drop-shadow-[0_12px_32px_rgba(0,0,0,.5)]">
          <Image
            src="/lama-logo-white.png"
            alt="Lama Barber App"
            fill
            sizes="256px"
            className="scale-[1.55] object-contain"
            loading="eager"
          />
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/90 p-6 shadow-2xl backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Area clienti Lama</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-7 mt-2 text-sm leading-6 text-zinc-400">{description}</p>
          <AuthForm mode={mode} />
        </section>
      </div>
    </main>
  );
}

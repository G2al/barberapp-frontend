"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import { normalizePhone } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { FieldError, Input, Label } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";

type Mode = "login" | "register" | "forgot" | "reset";
const schemas = {
  login: z.object({ email: z.email("Inserisci un’email valida"), password: z.string().min(1, "Inserisci la password") }),
  forgot: z.object({ email: z.email("Inserisci un’email valida") }),
  register: z.object({ name: z.string().min(2, "Inserisci il nome"), surname: z.string().min(2, "Inserisci il cognome"), email: z.email("Inserisci un’email valida"), phone: z.string().min(6, "Inserisci il telefono"), password: z.string().min(8, "Almeno 8 caratteri"), password_confirmation: z.string() }).refine(v => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Le password non coincidono" }),
  reset: z.object({ password: z.string().min(8, "Almeno 8 caratteri"), password_confirmation: z.string() }).refine(v => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Le password non coincidono" }),
};
type Values = { name?: string; surname?: string; email?: string; phone?: string; password?: string; password_confirmation?: string };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter(); const params = useSearchParams(); const { setSession } = useAuth();
  const [show, setShow] = useState(false); const [serverError, setServerError] = useState(""); const [success, setSuccess] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Values>({ resolver: zodResolver(schemas[mode]) as Resolver<Values> });
  const missingResetData = mode === "reset" && (!params.get("token") || !params.get("email"));
  async function submit(values: Values) {
    setServerError(""); setSuccess("");
    try {
      if (mode === "login") { const response = await endpoints.login({ email: values.email!, password: values.password! }); setSession(response); router.replace("/home"); }
      if (mode === "register") { const response = await endpoints.register({ name: values.name!, surname: values.surname!, email: values.email!, phone: normalizePhone(values.phone!), password: values.password! }); setSession(response); router.replace("/home"); }
      if (mode === "forgot") { const response = await endpoints.forgotPassword(values.email!); setSuccess(response.message ?? "Se l’indirizzo è registrato, riceverai le istruzioni via email."); }
      if (mode === "reset") { const response = await endpoints.resetPassword({ token: params.get("token")!, email: params.get("email")!, password: values.password!, password_confirmation: values.password_confirmation! }); setSuccess(response.message ?? "Password aggiornata. Ora puoi accedere."); }
    } catch (error) {
      if (error instanceof ApiError && error.status === 422 && error.payload && typeof error.payload === "object" && "errors" in error.payload) {
        const fieldErrors = (error.payload as { errors?: Record<string, string[]> }).errors ?? {};
        Object.entries(fieldErrors).forEach(([key, messages]) => setError(key as keyof Values, { message: messages[0] }));
      } else setServerError(error instanceof ApiError && error.status === 403 ? "Il tuo account è stato disattivato. Contatta Lama." : apiErrorMessage(error));
    }
  }
  if (missingResetData) return <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">Il link non è valido: token o email mancanti. Richiedi una nuova email di recupero.</div>;
  return <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
    {mode === "register" && <div className="grid grid-cols-2 gap-3"><FormField label="Nome" name="name" register={register} error={errors.name?.message} autoComplete="given-name" /><FormField label="Cognome" name="surname" register={register} error={errors.surname?.message} autoComplete="family-name" /></div>}
    {mode !== "reset" && <FormField label="Email" name="email" type="email" register={register} error={errors.email?.message} autoComplete="email" />}
    {mode === "register" && <FormField label="Telefono" name="phone" type="tel" register={register} error={errors.phone?.message} autoComplete="tel" />}
    {(mode === "login" || mode === "register" || mode === "reset") && <div><Label htmlFor="password">{mode === "reset" ? "Nuova password" : "Password"}</Label><div className="relative"><Input id="password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} aria-invalid={!!errors.password} {...register("password")} /><button type="button" aria-label={show ? "Nascondi password" : "Mostra password"} onClick={() => setShow(!show)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-xl text-zinc-400">{show ? <EyeOff /> : <Eye />}</button></div><FieldError>{errors.password?.message}</FieldError></div>}
    {(mode === "register" || mode === "reset") && <FormField label="Conferma password" name="password_confirmation" type={show ? "text" : "password"} register={register} error={errors.password_confirmation?.message} autoComplete="new-password" />}
    {serverError && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{serverError}</p>}
    {success && <p role="status" className="rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}
    <SubmitButton pending={isSubmitting}>{mode === "login" ? "Accedi" : mode === "register" ? "Crea account" : mode === "forgot" ? "Invia istruzioni" : "Aggiorna password"}</SubmitButton>
    {mode === "login" && <div className="flex justify-between text-sm"><Link href="/password-dimenticata" className="text-zinc-400 hover:text-white">Password dimenticata?</Link><Link href="/registrazione" className="font-medium text-amber-300">Registrati</Link></div>}
    {mode !== "login" && <p className="text-center text-sm text-zinc-400"><Link href="/login" className="font-medium text-amber-300">Torna al login</Link></p>}
  </form>;
}

function FormField({ label, name, register, error, ...props }: { label: string; name: keyof Values; register: ReturnType<typeof useForm<Values>>["register"]; error?: string } & React.ComponentProps<"input">) { return <div><Label htmlFor={name}>{label}</Label><Input id={name} aria-invalid={!!error} {...props} {...register(name)} /><FieldError>{error}</FieldError></div>; }

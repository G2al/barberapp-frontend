"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { z } from "zod";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { authErrorFeedback, PASSWORD_MIN_LENGTH, type AuthField } from "@/lib/auth/form-feedback";
import { normalizePhone } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { Input, Label } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";

type Mode = "login" | "register" | "forgot" | "reset";
const schemas = {
  login: z.object({ email: z.email("Inserisci un’email valida"), password: z.string().min(1, "Inserisci la password") }),
  forgot: z.object({ email: z.email("Inserisci un’email valida") }),
  register: z.object({ name: z.string().trim().min(1, "Inserisci il nome").max(100, "Il nome può avere al massimo 100 caratteri"), surname: z.string().trim().min(1, "Inserisci il cognome").max(100, "Il cognome può avere al massimo 100 caratteri"), email: z.email("Inserisci un’email valida"), phone: z.string().transform(normalizePhone).refine(v => /^\d{1,20}$/.test(v), "Inserisci un telefono valido, con al massimo 20 cifre"), password: z.string().min(PASSWORD_MIN_LENGTH, "Almeno 6 caratteri"), password_confirmation: z.string().min(1, "Conferma la password") }).refine(v => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Le password non coincidono" }),
  reset: z.object({ password: z.string().min(PASSWORD_MIN_LENGTH, "Almeno 6 caratteri"), password_confirmation: z.string().min(1, "Conferma la password") }).refine(v => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Le password non coincidono" }),
};
type Values = { name?: string; surname?: string; email?: string; phone?: string; password?: string; password_confirmation?: string };

function ErrorText({ name, message }: { name: string; message?: string }) {
  return message ? <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-red-300">{message}</p> : null;
}

function PasswordRequirements({ password, confirmation }: { password: string; confirmation: string }) {
  const length = Array.from(password).length;
  const complete = length >= PASSWORD_MIN_LENGTH;
  return <div id="password-requirements" className="mt-2 space-y-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-400">
    <div className="flex items-center justify-between gap-2"><span className={complete ? "text-emerald-300" : ""}>{complete ? "✓ Lunghezza minima raggiunta" : `Almeno ${PASSWORD_MIN_LENGTH} caratteri`}</span><span>{length}/{PASSWORD_MIN_LENGTH} min.</span></div>
    <div role="progressbar" aria-label="Requisito lunghezza password" aria-valuemin={0} aria-valuemax={PASSWORD_MIN_LENGTH} aria-valuenow={Math.min(length, PASSWORD_MIN_LENGTH)} className="h-1 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none ${complete ? "bg-emerald-400" : "bg-amber-300"}`} style={{ width: `${Math.min(length / PASSWORD_MIN_LENGTH, 1) * 100}%` }} />
    </div>
    {confirmation && <p className={password === confirmation ? "text-emerald-300" : "text-zinc-400"}>{password === confirmation ? "✓ Le password coincidono" : "La conferma deve coincidere con la password"}</p>}
    <p>Per maggiore sicurezza, usa una password lunga e unica.</p>
  </div>;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter(); const params = useSearchParams(); const { setSession } = useAuth();
  const [show, setShow] = useState(false); const [serverError, setServerError] = useState(""); const [success, setSuccess] = useState("");
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, setError, setFocus } = useForm<Values>({ resolver: zodResolver(schemas[mode]) as Resolver<Values>, mode: "onTouched" });
  const password = useWatch({ control, name: "password", defaultValue: "" }) ?? "";
  const confirmation = useWatch({ control, name: "password_confirmation", defaultValue: "" }) ?? "";
  const sending = useRef(false);
  const missingResetData = mode === "reset" && (!params.get("token") || !params.get("email"));
  const compact = mode === "register";
  async function submit(values: Values) {
    if (sending.current) return;
    sending.current = true;
    setServerError(""); setSuccess("");
    try {
      if (mode === "login") { const response = await endpoints.login({ email: values.email!, password: values.password! }); setSession(response); router.replace("/home"); }
      if (mode === "register") { const response = await endpoints.register({ name: values.name!, surname: values.surname!, email: values.email!, phone: normalizePhone(values.phone!), password: values.password! }); setSession(response); router.replace("/home"); }
      if (mode === "forgot") { const response = await endpoints.forgotPassword(values.email!); setSuccess(response.message ?? "Se l’indirizzo è registrato, riceverai le istruzioni via email."); }
      if (mode === "reset") { const response = await endpoints.resetPassword({ token: params.get("token")!, email: params.get("email")!, password: values.password!, password_confirmation: values.password_confirmation! }); setSuccess(response.message ?? "Password aggiornata. Ora puoi accedere."); }
    } catch (error) {
      const feedback = error instanceof ApiError ? authErrorFeedback(error.status, error.payload, mode) : { fields: {}, message: "Si è verificato un errore inatteso. Riprova." };
      Object.entries(feedback.fields).forEach(([key, message]) => setError(key as AuthField, { type: "server", message }));
      setServerError(feedback.message);
      const firstField = Object.keys(feedback.fields)[0] as AuthField | undefined;
      if (firstField) setFocus(firstField);
    } finally { sending.current = false; }
  }
  if (missingResetData) return <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">Il link non è valido: token o email mancanti. Richiedi una nuova email di recupero.</div>;
  return <form onSubmit={event => { void handleSubmit(submit)(event); }} onChange={() => { setServerError(""); setSuccess(""); }} aria-busy={isSubmitting} className={compact ? "space-y-2.5" : "space-y-4"} noValidate>
    {mode === "register" && <div className="grid grid-cols-2 gap-2"><FormField compact label="Nome" name="name" register={register} error={errors.name?.message} autoComplete="given-name" /><FormField compact label="Cognome" name="surname" register={register} error={errors.surname?.message} autoComplete="family-name" /></div>}
    {mode !== "reset" && <FormField compact={compact} label="Email" name="email" type="email" register={register} error={errors.email?.message} autoComplete="email" />}
    {mode === "register" && <FormField compact label="Telefono" name="phone" type="tel" register={register} error={errors.phone?.message} autoComplete="tel" />}
    {(mode === "login" || mode === "register" || mode === "reset") && <div><Label htmlFor="password" className={compact ? "mb-1 text-xs" : undefined}>{mode === "reset" ? "Nuova password" : "Password"}</Label><div className="relative"><Input id="password" className={`${compact ? "h-10 rounded-xl px-3" : ""} pr-12 ${errors.password ? "border-red-400/60" : ""}`} type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} aria-invalid={!!errors.password} aria-describedby={`${mode !== "login" ? "password-requirements " : ""}${errors.password ? "password-error" : ""}`.trim() || undefined} {...register("password")} /><button type="button" aria-label={show ? "Nascondi password" : "Mostra password"} onClick={() => setShow(!show)} className="absolute right-0 top-0 grid size-10 place-items-center rounded-xl text-zinc-400">{show ? <EyeOff /> : <Eye />}</button></div><ErrorText name="password" message={errors.password?.message} />{mode !== "login" && <PasswordRequirements password={password} confirmation={confirmation} />}</div>}
    {(mode === "register" || mode === "reset") && <FormField compact={compact} label="Conferma password" name="password_confirmation" type={show ? "text" : "password"} register={register} error={errors.password_confirmation?.message} autoComplete="new-password" />}
    {serverError && <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{serverError}</p>}
    {success && <p role="status" className="rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{success}</p>}
    <SubmitButton pending={isSubmitting} className={compact ? "h-10 rounded-xl" : undefined}>{mode === "login" ? "Accedi" : mode === "register" ? "Crea account" : mode === "forgot" ? "Invia istruzioni" : "Aggiorna password"}</SubmitButton>
    {mode === "login" && <div className="flex justify-between text-sm"><Link href="/password-dimenticata" className="text-zinc-400 hover:text-white">Password dimenticata?</Link><Link href="/registrazione" className="font-medium text-amber-300">Registrati</Link></div>}
    {mode !== "login" && <p className={`text-center text-zinc-400 ${compact ? "text-xs" : "text-sm"}`}><Link href="/login" className="font-medium text-amber-300">Torna al login</Link></p>}
  </form>;
}

function FormField({ compact = false, label, name, register, error, ...props }: { compact?: boolean; label: string; name: keyof Values; register: ReturnType<typeof useForm<Values>>["register"]; error?: string } & React.ComponentProps<"input">) { return <div><Label htmlFor={name} className={compact ? "mb-1 text-xs" : undefined}>{label}</Label><Input id={name} className={`${compact ? "h-10 rounded-xl px-3" : ""} ${error ? "border-red-400/60" : ""}`} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} {...props} {...register(name)} /><ErrorText name={name} message={error} /></div>; }

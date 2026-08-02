"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Camera, ChevronDown, LockKeyhole, LogOut, Phone, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { z } from "zod";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError, apiErrorMessage } from "@/lib/api/client";
import { fullName, normalizePhone } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import type { User } from "@/types";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { LoyaltyPanel } from "./loyalty-panel";
import { PushControls } from "./push-panel";

const profileSchema = z.object({ name: z.string().min(2, "Inserisci il nome"), surname: z.string().min(2, "Inserisci il cognome"), email: z.email("Email non valida"), phone: z.string().min(6, "Telefono non valido") });
type ProfileValues = z.infer<typeof profileSchema>;
const passwordSchema = z.object({ current_password: z.string().min(1, "Inserisci la password attuale"), password: z.string().min(8, "Almeno 8 caratteri"), password_confirmation: z.string() }).refine((value) => value.password === value.password_confirmation, { path: ["password_confirmation"], message: "Le password non coincidono" });
type PasswordValues = z.infer<typeof passwordSchema>;
type Section = "profile" | "password" | "notifications";

const unwrap = (data: User | { user: User }) => "user" in data ? data.user : data;

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const profile = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name ?? "", surname: user?.surname ?? "", email: user?.email ?? "", phone: user?.phone ?? "" } });
  const password = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => { if (user) profile.reset({ name: user.name, surname: user.surname ?? "", email: user.email, phone: user.phone ?? "" }); }, [user, profile]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const update = useMutation({ mutationFn: (values: ProfileValues) => endpoints.updateProfile({ ...values, phone: normalizePhone(values.phone) }), onSuccess: async (data) => { setFailure(""); setNotice("Profilo aggiornato."); const next = unwrap(data); void next; await refreshUser(); }, onError: (error) => handleError(error, profile.setError, setFailure) });
  const avatar = useMutation({ mutationFn: (file: File) => { const body = new FormData(); body.append("avatar", file); return endpoints.uploadAvatar(body); }, onSuccess: async () => { setFailure(""); setNotice("Avatar aggiornato."); await refreshUser(); }, onError: (error) => setFailure(apiErrorMessage(error)) });
  const changePassword = useMutation({ mutationFn: endpoints.updatePassword, onSuccess: () => { setFailure(""); setNotice("Password aggiornata."); password.reset(); setOpenSection(null); }, onError: (error) => handleError(error, password.setError, setFailure) });

  function selectAvatar(file?: File) {
    setFailure("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setFailure("Usa un’immagine JPG, PNG o WebP."); return; }
    if (file.size > 4 * 1024 * 1024) { setFailure("L’immagine supera il limite di 4 MB."); return; }
    setPreview(URL.createObjectURL(file));
    avatar.mutate(file);
  }

  return <>
    <p className="mb-3 text-xs font-semibold uppercase tracking-[.22em] text-amber-300">Il tuo account</p>
    {notice && <p role="status" className="mb-3 rounded-2xl bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
    {failure && <p role="alert" className="mb-3 rounded-2xl bg-red-400/10 p-3 text-sm text-red-200">{failure}</p>}

    <section className="flex items-center gap-4 rounded-[1.6rem] border border-white/8 bg-card p-4 shadow-lg">
      <label className="relative block size-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-amber-300/35" aria-label="Cambia immagine profilo">
        <AppImage src={preview ?? user?.avatar_url ?? user?.avatar} alt={`Avatar di ${user?.name ?? "utente"}`} sizes="80px" />
        <span className="absolute bottom-0 right-0 z-10 grid size-7 place-items-center rounded-full bg-amber-300 text-zinc-950 shadow-lg"><Camera className="size-3.5" /></span>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={avatar.isPending} onChange={(event) => selectAvatar(event.target.files?.[0])} />
      </label>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-tight">{fullName(user) || user?.name}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400"><Phone className="size-3.5" />{user?.phone || "Telefono non inserito"}</p>
        <p className="mt-1 truncate text-xs text-zinc-600">{avatar.isPending ? "Caricamento immagine…" : user?.email}</p>
      </div>
    </section>

    <div id="loyalty" className="scroll-mt-20"><LoyaltyPanel /></div>

    <div className="mt-4 space-y-2">
      <ProfileSection id="profile" title="Dati personali" description="Nome, contatti ed email" icon={<UserRound />} open={openSection === "profile"} onToggle={() => setOpenSection(openSection === "profile" ? null : "profile")}>
        <form className="space-y-4" onSubmit={profile.handleSubmit((values) => update.mutate(values))}><ProfileField label="Nome" name="name" form={profile} /><ProfileField label="Cognome" name="surname" form={profile} /><ProfileField label="Email" name="email" type="email" form={profile} /><ProfileField label="Telefono" name="phone" type="tel" form={profile} /><SubmitButton pending={update.isPending}><Save />Salva modifiche</SubmitButton></form>
      </ProfileSection>
      <ProfileSection id="password" title="Sicurezza" description="Modifica la password" icon={<LockKeyhole />} open={openSection === "password"} onToggle={() => setOpenSection(openSection === "password" ? null : "password")}>
        <form className="space-y-4" onSubmit={password.handleSubmit((values) => changePassword.mutate(values))}><PasswordField label="Password attuale" name="current_password" form={password} /><PasswordField label="Nuova password" name="password" form={password} /><PasswordField label="Conferma nuova password" name="password_confirmation" form={password} /><SubmitButton pending={changePassword.isPending}>Aggiorna password</SubmitButton></form>
      </ProfileSection>
      <div id="notifiche" className="scroll-mt-20"><ProfileSection id="notifications" title="Notifiche" description="Conferme e promemoria" icon={<Bell />} open={openSection === "notifications"} onToggle={() => setOpenSection(openSection === "notifications" ? null : "notifications")}><PushControls /></ProfileSection></div>
    </div>

    <Button variant="destructive" onClick={() => { if (window.confirm("Vuoi uscire dal tuo account?")) { queryClient.clear(); void logout(); } }} className="mt-4 h-12 w-full rounded-2xl"><LogOut />Esci dall’account</Button>
  </>;
}

function ProfileSection({ id, title, description, icon, open, onToggle, children }: { id: string; title: string; description: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-white/8 bg-card"><button type="button" aria-expanded={open} aria-controls={`${id}-content`} onClick={onToggle} className="flex min-h-16 w-full items-center gap-3 px-4 text-left"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300 [&_svg]:size-5">{icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><span className="mt-0.5 block text-xs text-zinc-500">{description}</span></span><ChevronDown className={`size-5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} /></button><AnimatePresence initial={false}>{open && <motion.div id={`${id}-content`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .2, ease: "easeOut" }} className="overflow-hidden"><div className="border-t border-white/6 px-4 pb-4 pt-4">{children}</div></motion.div>}</AnimatePresence></section>;
}

function ProfileField({ label, name, type = "text", form }: { label: string; name: keyof ProfileValues; type?: string; form: ReturnType<typeof useForm<ProfileValues>> }) { return <div><Label htmlFor={`p-${name}`}>{label}</Label><Input id={`p-${name}`} type={type} aria-invalid={!!form.formState.errors[name]} {...form.register(name)} /><FieldError>{form.formState.errors[name]?.message}</FieldError></div>; }
function PasswordField({ label, name, form }: { label: string; name: keyof PasswordValues; form: ReturnType<typeof useForm<PasswordValues>> }) { return <div><Label htmlFor={`pw-${name}`}>{label}</Label><Input id={`pw-${name}`} type="password" autoComplete={name === "current_password" ? "current-password" : "new-password"} aria-invalid={!!form.formState.errors[name]} {...form.register(name)} /><FieldError>{form.formState.errors[name]?.message}</FieldError></div>; }
function handleError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, setFailure: (value: string) => void) { if (error instanceof ApiError && error.status === 422 && error.payload && typeof error.payload === "object" && "errors" in error.payload) { const errors = (error.payload as { errors?: Record<string, string[]> }).errors ?? {}; Object.entries(errors).forEach(([key, value]) => setError(key as Path<T>, { message: value[0] })); } else setFailure(apiErrorMessage(error)); }

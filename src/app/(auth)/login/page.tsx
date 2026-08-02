import { Suspense } from "react"; import { AuthPage } from "@/components/auth/auth-page";
export default function Page() { return <Suspense><AuthPage mode="login" title="Bentornato" description="Accedi per gestire appuntamenti, prodotti preferiti e vantaggi." /></Suspense>; }

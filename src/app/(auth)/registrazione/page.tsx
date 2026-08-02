import { Suspense } from "react"; import { AuthPage } from "@/components/auth/auth-page";
export default function Page() { return <Suspense><AuthPage mode="register" title="Il tuo spazio" description="Crea il profilo e prenota il prossimo appuntamento in pochi tocchi." /></Suspense>; }

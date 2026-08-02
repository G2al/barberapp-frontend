import { Suspense } from "react"; import { AuthPage } from "@/components/auth/auth-page";
export default function Page() { return <Suspense><AuthPage mode="forgot" title="Recupera l’accesso" description="Inserisci la tua email: riceverai le istruzioni se l’account è presente." /></Suspense>; }

import { Suspense } from "react"; import { AuthPage } from "@/components/auth/auth-page";
export default function Page() { return <Suspense><AuthPage mode="reset" title="Nuova password" description="Scegli una password sicura per proteggere il tuo account." /></Suspense>; }

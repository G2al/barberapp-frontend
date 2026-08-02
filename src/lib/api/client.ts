import { authStorage } from "@/lib/auth/storage";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError<T = unknown> extends Error {
  constructor(public status: number, public payload: T, message: string) { super(message); this.name = "ApiError"; }
}

type Options = { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown; headers?: HeadersInit; auth?: boolean; signal?: AbortSignal };

function endpointUrl(endpoint: string) {
  if (!API_URL) throw new ApiError(0, null, "Configurazione API mancante.");
  const clean = endpoint.replace(/^\/?api\//, "/").replace(/^([^/])/, "/$1");
  return `${API_URL}${clean}`;
}

function messageFrom(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") return payload.message;
  const known: Record<number, string> = { 401: "Sessione scaduta o credenziali non valide.", 403: "Accesso non consentito.", 404: "Risorsa non trovata.", 422: "Controlla i dati inseriti.", 429: "Troppi tentativi. Riprova più tardi.", 500: "Il servizio non è disponibile. Riprova." };
  return known[status] ?? "La richiesta non è riuscita.";
}

export async function api<T>(endpoint: string, options: Options = {}): Promise<T> {
  const token = options.auth === false ? null : authStorage.getToken();
  const formData = options.body instanceof FormData;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body != null && !formData) headers.set("Content-Type", "application/json");
  const requestBody: BodyInit | undefined = options.body == null ? undefined : formData ? options.body as FormData : JSON.stringify(options.body);
  let response: Response;
  try {
    response = await fetch(endpointUrl(endpoint), { method: options.method ?? "GET", headers, body: requestBody, signal: options.signal });
  } catch (cause) { throw new ApiError(0, cause, "Impossibile contattare il server. Controlla la connessione."); }
  const text = await response.text();
  let payload: unknown = null;
  if (text) { try { payload = JSON.parse(text); } catch { payload = text; } }
  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      authStorage.clear();
      window.dispatchEvent(new Event("barberapp:unauthorized"));
    }
    throw new ApiError(response.status, payload, messageFrom(payload, response.status));
  }
  return payload as T;
}

export function apiErrorMessage(error: unknown) { return error instanceof ApiError ? error.message : "Si è verificato un errore inatteso."; }

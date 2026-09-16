// Aligned with Del Piano's AuthController (register and resetPassword).
export const PASSWORD_MIN_LENGTH = 6;
export const authFields = ["name", "surname", "email", "phone", "password", "password_confirmation"] as const;
export type AuthField = typeof authFields[number];

const labels: Record<string, string> = { name: "nome", surname: "cognome", email: "email", phone: "telefono", password: "password", password_confirmation: "conferma password" };

export function readableAuthMessage(value: unknown, field?: string): string {
  const message = typeof value === "string" ? value.trim() : "";
  const label = labels[field ?? ""] ?? "campo";
  if (/validation\.unique|already (?:been )?taken|already (?:in use|registered)/i.test(message)) {
    return field === "email" ? "Email già in uso. Accedi oppure recupera la password." : field === "phone" ? "Questo numero di telefono è già registrato." : "Questo valore è già in uso.";
  }
  if (/validation\.required|field is required/i.test(message)) return `Inserisci ${label}.`;
  if (/validation\.email|must be a valid email/i.test(message)) return "Inserisci un indirizzo email valido.";
  if (/validation\.confirmed|confirmation does not match/i.test(message)) return "Le password non coincidono.";
  if (/validation\.min|must be at least/i.test(message) && field === "password") return `La password deve contenere almeno ${PASSWORD_MIN_LENGTH} caratteri.`;
  if (/validation\.max/i.test(message)) return `Il ${label} supera la lunghezza consentita.`;
  if (/auth\.failed|credentials do not match/i.test(message)) return "Email o password non corrette. Riprova.";
  if (/passwords\.(?:token|user)/i.test(message)) return "Link non valido o scaduto. Richiedi un nuovo recupero password.";
  if (/auth\.throttle|passwords\.throttled/i.test(message)) return "Troppi tentativi. Attendi qualche minuto prima di riprovare.";
  // Never expose untranslated keys, HTML, stack traces or database diagnostics.
  if (!message || /validation\.|auth\.|passwords\.|SQLSTATE|Exception|Stack trace|<[^>]+>|\(and \d+ more error/i.test(message)) return field ? `Controlla il ${label} inserito.` : "Controlla i dati inseriti e riprova.";
  if (/^the given data was invalid\.?$/i.test(message)) return "Controlla i dati inseriti e riprova.";
  return message;
}

export function authErrorFeedback(status: number, payload: unknown, mode: string) {
  const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const fields: Partial<Record<AuthField, string>> = {};
  if (status === 422 && data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    for (const [field, values] of Object.entries(data.errors)) {
      const visible = authFields.includes(field as AuthField) && (mode === "register" || (mode === "login" && ["email", "password"].includes(field)) || (mode === "forgot" && field === "email") || (mode === "reset" && ["password", "password_confirmation"].includes(field)));
      if (visible) fields[field as AuthField] = readableAuthMessage(Array.isArray(values) ? values[0] : values, field);
    }
  }
  const messages: Record<number, string> = {
    0: "Impossibile contattare il server. Controlla la connessione e riprova.",
    401: "Email o password non corrette. Riprova.",
    403: "Il tuo account è disattivato. Contatta Del Piano Luxury per assistenza.",
    419: "La sessione è scaduta. Ricarica la pagina e riprova.",
    429: "Troppi tentativi. Attendi qualche minuto prima di riprovare.",
  };
  const message = status >= 500 ? "Servizio temporaneamente non disponibile. Riprova tra poco." : messages[status] ?? (Object.keys(fields).length ? "Controlla i campi evidenziati." : readableAuthMessage(data.message));
  return { fields, message };
}

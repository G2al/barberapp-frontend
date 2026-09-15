export const BOOKING_NOTE_MAX = 1000;

export function adminNoteError(note: string): string | null {
  if (!note.trim()) return "Indica per chi stai prenotando prima di continuare.";
  if (Array.from(note.trim()).length > BOOKING_NOTE_MAX) return "La nota può contenere al massimo 1000 caratteri.";
  return null;
}

export function bookingNotePayload(role: string | undefined, note: string): { note?: string } {
  if (role !== "admin") return {};
  const error = adminNoteError(note);
  if (error) throw new Error(error);
  return { note: note.trim() };
}

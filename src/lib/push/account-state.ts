export const PUSH_STATUS_EVENT = "delpiano:push-status";
const OWNER_KEY = "delpiano:push-owner:v1";
type Owner = { userId: string; endpoint: string };
let memoryOwner: Owner | null = null;
const preferences = new Map<string, boolean>();
const preferenceKey = (userId: string) => `delpiano:push-enabled:v1:${userId}`;
export function readPushPreference(userId: string): boolean | null {
  try { const value = localStorage.getItem(preferenceKey(userId)); return value === "true" ? true : value === "false" ? false : null; }
  catch { return preferences.get(userId) ?? null; }
}
export function savePushPreference(userId: string, enabled: boolean) {
  preferences.set(userId, enabled);
  try { localStorage.setItem(preferenceKey(userId), String(enabled)); } catch { /* Session fallback. */ }
}
export function readPushOwner(): Owner | null {
  try { const value = JSON.parse(localStorage.getItem(OWNER_KEY) ?? "null"); return value && typeof value.userId === "string" && typeof value.endpoint === "string" ? value : null; } catch { return memoryOwner; }
}
export function savePushOwner(userId: string, endpoint: string) {
  memoryOwner = { userId, endpoint };
  try { localStorage.setItem(OWNER_KEY, JSON.stringify(memoryOwner)); } catch { /* Session fallback. */ }
}
export function clearPushOwner() {
  memoryOwner = null;
  try { localStorage.removeItem(OWNER_KEY); } catch { /* Storage unavailable. */ }
}
export function ownsPush(owner: Owner | null, userId: string, endpoint: string) { return owner?.userId === userId && owner.endpoint === endpoint; }
export function shouldOfferPush(input: { checked: boolean; supported: boolean; active: boolean; permission: string; enabled: boolean; decided: boolean }) {
  return input.checked && input.supported && !input.active && input.permission !== "denied" && input.enabled && !input.decided;
}

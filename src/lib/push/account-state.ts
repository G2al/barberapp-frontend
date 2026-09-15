export const PUSH_STATUS_EVENT = "mottolas:push-status";
const OWNER_KEY = "mottolas:push-owner:v1";
type Owner = { userId: string; endpoint: string };
let memoryOwner: Owner | null = null;
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

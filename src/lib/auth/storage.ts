import type { User } from "@/types";

const TOKEN_KEY = "barberapp_token";
const USER_KEY = "barberapp_user";

const isBrowser = () => typeof window !== "undefined";

export const authStorage = {
  getToken: () => isBrowser() ? window.localStorage.getItem(TOKEN_KEY) : null,
  getUser: (): User | null => {
    if (!isBrowser()) return null;
    try { return JSON.parse(window.localStorage.getItem(USER_KEY) ?? "null") as User | null; }
    catch { return null; }
  },
  save: (token: string, user: User) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  saveUser: (user: User) => { if (isBrowser()) window.localStorage.setItem(USER_KEY, JSON.stringify(user)); },
  clear: () => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

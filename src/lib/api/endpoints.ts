import { api } from "./client";
import type { AppConfig, AuthResponse, AvailabilityResponse, Booking, BookingsResponse, LoyaltySummary, Product, ProductsResponse, PushConfig, Service, Staff, User } from "@/types";

export const endpoints = {
  login: (body: { email: string; password: string }) => api<AuthResponse>("/auth/login", { method: "POST", body, auth: false }),
  register: (body: { name: string; surname: string; email: string; phone: string; password: string }) => api<AuthResponse>("/auth/register", { method: "POST", body, auth: false }),
  forgotPassword: (email: string) => api<{ status?: boolean; message?: string }>("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (body: { token: string; email: string; password: string; password_confirmation: string }) => api<{ status?: boolean; message?: string }>("/auth/reset-password", { method: "POST", body, auth: false }),
  me: () => api<User | { user: User }>("/auth/me"),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
  updateProfile: (body: Pick<User, "name" | "surname" | "email" | "phone">) => api<User | { user: User }>("/auth/profile", { method: "PUT", body }),
  updatePassword: (body: { current_password: string; password: string; password_confirmation: string }) => api<{ message?: string }>("/auth/password", { method: "PUT", body }),
  uploadAvatar: (body: FormData) => api<User | { user: User }>("/auth/avatar", { method: "POST", body }),
  config: () => api<AppConfig>("/app-config", { auth: false }),
  staff: () => api<Staff[]>("/staff", { auth: false }),
  servicesByStaff: (id: string | number) => api<Service[]>(`/services/by-staff/${id}`, { auth: false }),
  availability: (staff: string | number, date: string, service: string | number) => api<AvailabilityResponse>(`/availability/${staff}?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(service)}`, { auth: false }),
  bookings: async () => {
    const response = await api<BookingsResponse | Booking[] | { bookings: { data?: Booking[] } } | { data?: Booking[] }>("/bookings");
    if (Array.isArray(response)) return { bookings: response } satisfies BookingsResponse;
    if ("bookings" in response) return { ...response, bookings: Array.isArray(response.bookings) ? response.bookings : response.bookings?.data ?? [] } satisfies BookingsResponse;
    return { bookings: response.data ?? [] } satisfies BookingsResponse;
  },
  createBooking: (body: { staff_id: string | number; service_id: string | number; date: string; time: string }) => api<{ status?: boolean; booking?: Booking; message?: string }>("/bookings", { method: "POST", body }),
  cancelBooking: (id: string | number) => api<{ status?: boolean; message?: string }>(`/bookings/${id}/cancel`, { method: "POST" }),
  products: () => api<ProductsResponse>("/products"),
  favorites: () => api<Product[] | ProductsResponse | { favorites: Product[] }>("/favorites"),
  addFavorite: (id: string | number) => api<unknown>(`/favorites/${id}`, { method: "POST" }),
  removeFavorite: (id: string | number) => api<unknown>(`/favorites/${id}`, { method: "DELETE" }),
  loyalty: () => api<LoyaltySummary | { summary: LoyaltySummary }>("/loyalty/summary"),
  redeemReward: (id: string | number) => api<{ code?: string; message?: string }>(`/loyalty/rewards/${id}/redeem`, { method: "POST" }),
  pushConfig: () => api<PushConfig>("/push/config"),
  subscribePush: (body: unknown) => api<unknown>("/push/subscriptions", { method: "POST", body }),
  unsubscribePush: (body: unknown) => api<unknown>("/push/subscriptions", { method: "DELETE", body }),
};

import { api, ApiError } from "./client";
import type { AppConfig, AuthResponse, AvailabilityResponse, Booking, BookingsResponse, LoyaltyResponse, Product, ProductsResponse, PushConfig, RedeemRewardResponse, Service, Staff, User } from "@/types";

type RawBooking = Omit<Booking, "staff" | "service"> & {
  staff?: Booking["staff"] | string;
  service?: Booking["service"] | string;
  staff_image?: string | null;
  staff_phone?: string | null;
  service_duration?: number | string | null;
  service_price?: number | string | null;
};

function normalizeBooking(booking: RawBooking): Booking {
  const staff = typeof booking.staff === "string"
    ? { id: booking.staff_id ?? `staff-${booking.id}`, first_name: booking.staff, phone: booking.staff_phone, image_url: booking.staff_image }
    : booking.staff;
  const service = typeof booking.service === "string"
    ? { id: booking.service_id ?? `service-${booking.id}`, name: booking.service, duration: Number(booking.service_duration ?? 0), price: booking.service_price }
    : booking.service;
  return { ...booking, date: String(booking.date).slice(0, 10), time: String(booking.time).slice(0, 5), staff, service, phone: booking.phone ?? booking.staff_phone };
}

function normalizeBookings(bookings: RawBooking[]) { return bookings.map(normalizeBooking); }

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
    const response = await api<BookingsResponse | RawBooking[] | { bookings: { data?: RawBooking[] } | RawBooking[] } | { data?: RawBooking[] }>("/bookings");
    if (Array.isArray(response)) return { bookings: normalizeBookings(response) } satisfies BookingsResponse;
    if ("bookings" in response) {
      const items = Array.isArray(response.bookings) ? response.bookings : response.bookings?.data ?? [];
      return { ...response, bookings: normalizeBookings(items) } satisfies BookingsResponse;
    }
    return { bookings: normalizeBookings(response.data ?? []) } satisfies BookingsResponse;
  },
  createBooking: (body: { staff_id: string | number; service_id: string | number; date: string; time: string }) => api<{ status?: boolean; booking?: Booking; message?: string }>("/bookings", { method: "POST", body }),
  cancelBooking: (id: string | number) => api<{ status?: boolean; message?: string }>(`/bookings/${id}/cancel`, { method: "POST" }),
  products: () => api<ProductsResponse>("/products"),
  favorites: () => api<Product[] | ProductsResponse | { favorites: Product[] }>("/favorites"),
  addFavorite: (id: string | number) => api<unknown>(`/favorites/${id}`, { method: "POST" }),
  removeFavorite: (id: string | number) => api<unknown>(`/favorites/${id}`, { method: "DELETE" }),
  loyalty: async () => {
    const response = await api<LoyaltyResponse>("/loyalty/summary");
    if (!response.status || !response.loyalty) throw new ApiError(500, response, "Risposta loyalty non valida.");
    return response.loyalty;
  },
  redeemReward: (id: string | number) => api<RedeemRewardResponse>(`/loyalty/rewards/${id}/redeem`, { method: "POST" }),
  pushConfig: () => api<PushConfig>("/push/config"),
  subscribePush: (body: unknown) => api<unknown>("/push/subscriptions", { method: "POST", body }),
  unsubscribePush: (body: unknown) => api<unknown>("/push/subscriptions", { method: "DELETE", body }),
};

export type Id = number | string;

export interface User {
  id: Id;
  role?: string;
  name: string;
  surname?: string | null;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  active?: boolean;
}

export interface Staff {
  id: Id;
  first_name: string;
  last_name?: string | null;
  surname?: string | null;
  role?: string | null;
  phone?: string | null;
  image_url?: string | null;
}

export interface Service {
  id: Id;
  name: string;
  description?: string | null;
  price?: number | string | null;
  duration: number;
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export interface Booking {
  id: Id;
  date: string;
  time: string;
  status: BookingStatus;
  staff?: Staff | null;
  service?: Service | null;
  staff_id?: Id;
  service_id?: Id;
  phone?: string | null;
}

export interface Product {
  id: Id;
  name: string;
  category?: string | null;
  description?: string | null;
  price?: number | string | null;
  image?: string | null;
  image_url?: string | null;
  is_favorite?: boolean;
}

export interface AppConfig {
  name?: string;
  shop_name?: string;
  phone?: string;
  address?: string;
  location?: string;
  opening_hours?: unknown;
  [key: string]: unknown;
}

export interface AuthResponse { status: boolean; token: string; user: User; message?: string }
export interface BookingsResponse { status?: boolean; bookings: Booking[] }
export interface ProductsResponse { status?: boolean; products: Product[] }
export interface AvailabilityResponse {
  status?: boolean;
  slots: string[];
  waitlist_slots?: string[];
  service_duration?: number;
  date?: string;
  staff_id?: Id;
}

export type WaitlistStatus = "waiting" | "assigned";
export interface WaitlistEntry {
  id: Id;
  staff: { id: Id; name: string };
  service: { id: Id; name: string };
  date: string;
  time: string;
  status: WaitlistStatus;
  position?: number | null;
  booking_id?: Id | null;
}
export interface WaitlistResponse { status?: boolean; entries: WaitlistEntry[] }
export interface WaitlistCreateResponse { status?: boolean; message?: string; entry: WaitlistEntry }
export interface PushConfig { enabled: boolean; public_key?: string }

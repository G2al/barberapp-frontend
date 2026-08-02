export type Id = number | string;

export interface User {
  id: Id;
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
  loyalty_points?: number | null;
  points?: number | null;
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

export interface Reward {
  id: Id;
  name?: string;
  title?: string;
  description?: string;
  points?: number;
  points_required?: number;
  available?: boolean;
  redeemed?: boolean;
}

export interface LoyaltySummary {
  points?: number;
  balance?: number;
  points_balance?: number;
  level?: string;
  rewards?: Reward[];
  movements?: Array<Record<string, unknown>>;
  transactions?: Array<Record<string, unknown>>;
  rules?: unknown;
}

export interface AppConfig {
  name?: string;
  shop_name?: string;
  phone?: string;
  address?: string;
  opening_hours?: unknown;
  [key: string]: unknown;
}

export interface AuthResponse { status: boolean; token: string; user: User; message?: string }
export interface BookingsResponse { status?: boolean; bookings: Booking[] }
export interface ProductsResponse { status?: boolean; products: Product[] }
export interface AvailabilityResponse { status?: boolean; slots: string[]; service_duration?: number }
export interface PushConfig { enabled: boolean; public_key?: string }

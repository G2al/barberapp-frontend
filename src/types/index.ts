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
  title: string;
  description?: string | null;
  points_cost: number;
  status: "available" | "redeemed" | "expired" | string;
  code: string;
  service?: string | null;
  earned_at?: string | null;
  expires_at?: string | null;
}

export interface LoyaltyTransaction {
  id: Id;
  points: number;
  type: "earned" | "redeemed" | "adjustment" | string;
  description?: string | null;
  service?: string | null;
  created_at?: string | null;
}

export interface LoyaltyRule {
  id: Id;
  name: string;
  type: "points_threshold" | "service_count" | string;
  service?: string | null;
  reward_title: string;
  reward_description?: string | null;
  current: number;
  target: number;
  progress: number;
}

export interface LoyaltySummary {
  balance: number;
  lifetime_points: number;
  available_rewards_count: number;
  next_reward?: { name: string; points_required: number; points_missing: number; progress: number } | null;
  rewards: Reward[];
  transactions: LoyaltyTransaction[];
  rules: LoyaltyRule[];
}

export interface LoyaltyResponse { status: boolean; loyalty: LoyaltySummary }
export interface RedeemRewardResponse { status: boolean; message?: string; reward: { id: Id; title: string; status: string; code: string; redeemed_at?: string | null } }

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
export interface AvailabilityResponse { status?: boolean; slots: string[]; service_duration?: number }
export interface PushConfig { enabled: boolean; public_key?: string }

export interface AiChatRequest {
  message: string;
  history: AiChatHistoryMessage[];
}

export interface AiChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiBookingPayload {
  staff_id: Id;
  service_id: Id;
  date: string;
  time: string;
}

export interface AiBookingSummary {
  service: string;
  staff: string;
  date: string;
  time: string;
  duration_minutes: number;
  price_eur: string;
}

export interface AiConfirmBookingAction {
  type: "confirm_booking";
  label: string;
  method: "POST";
  url: string;
  payload: AiBookingPayload;
  summary: AiBookingSummary;
}

export interface AiChatUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface AiChatResponse {
  status: boolean;
  answer: string;
  usage?: AiChatUsage;
  action?: AiConfirmBookingAction;
}

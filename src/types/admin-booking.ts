import type { Id } from "@/types";

export interface BookingClient {
  id: Id;
  name: string;
  surname?: string | null;
  email: string;
  phone?: string | null;
}

export interface AdminBookingPayload {
  user_id: Id;
  staff_id: Id;
  service_id: Id;
  date: string;
  time: string;
  note: string;
}

// Frontend adapter contract, NOT an assertion about existing backend routes.
// Supply only after the dedicated admin API has been agreed and verified.
export interface AdminBookingIntegration {
  clients: () => Promise<BookingClient[]>;
  create: (payload: AdminBookingPayload) => Promise<{ status: boolean; message?: string }>;
  refreshBookings: () => Promise<void>;
}

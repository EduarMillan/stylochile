export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type SubscriptionStatus = "trialing" | "active" | "expired";

export type SalonSubscription = {
  id: string;
  salon_id: string;
  status: SubscriptionStatus;
  trial_starts_at: string;
  trial_ends_at: string;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  last_payment_at: string | null;
  last_payment_amount: number | null;
  last_payment_note: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformSettings = {
  trial_days: number;
  grace_period_days: number;
  monthly_price: number;
  currency: string;
  admin_whatsapp: string | null;
  updated_at: string;
};

export type DayHours = {
  closed: boolean;
  open: string;  // "HH:mm"
  close: string; // "HH:mm"
};

export type WeeklyHours = Record<DayKey, DayHours>;

export type Salon = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  calle: string | null;
  numero: string | null;
  entre_calle_a: string | null;
  entre_calle_b: string | null;
  reparto: string | null;
  municipio: string | null;
  provincia: string | null;
  phone: string | null;
  whatsapp: string | null;
  hours: WeeklyHours | null;
  cover_image: string | null;
  logo_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

export type SalonArea = {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type Service = {
  id: string;
  salon_id: string;
  area_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  duration_minutes: number | null;
  sort_order: number;
  created_at: string;
};

export type Staff = {
  id: string;
  salon_id: string;
  area_id: string | null;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  years_experience: number | null;
  instagram_handle: string | null;
  certifications: string | null;
  sort_order: number;
  created_at: string;
};

export const COMMON_ROLES = [
  "Estilista",
  "Peluquero/a",
  "Colorista",
  "Manicurista",
  "Pedicurista",
  "Esteticista",
  "Maquilladora",
  "Estomatólogo/a",
  "Masajista",
  "Recepción",
];

export type SalonFacilityPhoto = {
  id: string;
  salon_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  salon_id: string;
  area_id: string | null;
  title: string | null;
  description: string | null;
  before_url: string;
  after_url: string;
  sort_order: number;
  created_at: string;
};

export type Review = {
  id: string;
  salon_id: string;
  appointment_id: string | null;
  client_name: string;
  client_phone: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type MovementType = "in" | "out" | "adjustment";

export type InventoryItem = {
  id: string;
  salon_id: string;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number | null;
  currency: string;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryMovement = {
  id: string;
  item_id: string;
  salon_id: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  created_at: string;
};

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
};

export type Client = {
  id: string;
  salon_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientProgressPhoto = {
  id: string;
  client_id: string;
  salon_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  sort_order: number;
  created_at: string;
};

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type Appointment = {
  id: string;
  salon_id: string;
  area_id: string | null;
  service_id: string | null;
  client_name: string;
  client_phone: string;
  client_notes: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: "form" | "whatsapp";
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type BusySlot = {
  area_id: string | null;
  starts_at: string;
  ends_at: string;
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendiente",
  approved: "Confirmada",
  rejected: "Rechazada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const COMMON_AREAS = [
  "Peluquería",
  "Manicure y Pedicure",
  "Estética facial",
  "Estomatología",
  "Maquillaje",
  "Masajes",
  "Depilación",
];

export const DEFAULT_HOURS: WeeklyHours = {
  mon: { closed: false, open: "09:00", close: "18:00" },
  tue: { closed: false, open: "09:00", close: "18:00" },
  wed: { closed: false, open: "09:00", close: "18:00" },
  thu: { closed: false, open: "09:00", close: "18:00" },
  fri: { closed: false, open: "09:00", close: "18:00" },
  sat: { closed: false, open: "09:00", close: "16:00" },
  sun: { closed: true, open: "09:00", close: "18:00" },
};

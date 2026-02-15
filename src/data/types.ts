export interface EventTheme {
  primary: string;
  secondary: string;
  accent: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  textDark: string;
  textLight: string;
  headlineFont: string;
  bodyFont: string;
  backgroundPattern: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  urgencyText: string;
}

export interface CelebrationEvent {
  id: string;
  name: string;
  slug: string;
  date: number;
  launchDate: number;
  endDate: number;
  status: "upcoming" | "active" | "ended";
  theme: EventTheme;
  createdAt: number;
}

export interface MediaSlot {
  id: string;
  label: string;
  type: "photo" | "video";
  position: { x: number; y: number; width: number; height: number };
  required: boolean;
}

export interface TextSlotStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface TextSlot {
  id: string;
  label: string;
  placeholder: string;
  maxLength: number;
  position: { x: number; y: number; width: number; height: number };
  style: TextSlotStyle;
}

export interface Template {
  id: string;
  eventId: string;
  name: string;
  thumbnail: string;
  outputType: "image" | "video";
  mediaSlots: MediaSlot[];
  textSlots: TextSlot[];
  layers: string[];
  popularity: number;
  createdAt: number;
}

export interface Celebration {
  id: string;
  templateId: string;
  eventId: string;
  slug: string;
  email: string;
  userMedia: Record<string, string>;
  userText: Record<string, string>;
  removeWatermark: boolean;
  hasMusic: boolean;
  customLink: boolean;
  hdDownload: boolean;
  totalPaid: number;
  paymentStatus: "pending" | "paid" | "failed";
  views: number;
  createdAt: number;
}

export interface Admin {
  email: string;
  role: "super_admin" | "editor";
  createdAt: number;
}

export interface SaleRecord {
  id: string;
  celebrationId: string;
  eventId: string;
  templateId: string;
  amount: number;
  upsells: {
    removeWatermark: boolean;
    music: boolean;
    customLink: boolean;
    hdDownload: boolean;
  };
  date: number;
}

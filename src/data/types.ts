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
  headline_2?: string;
  subheadline_2?: string;
  headline_3?: string;
  subheadline_3?: string;
  ctaText: string;
  urgencyText: string;
  characters?: string[];
  musicTrackIds?: string[];
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
  /** Default pages used when this template is selected in the story editor */
  defaultPages?: StoryPage[];
}

export type SlideTransition = "fade" | "slide" | "zoom" | "flip";
export type FontSize = "small" | "medium" | "large";

export interface StoryPage {
  id: string;
  photoUrl?: string;
  text: string;
  fontFamily: string;
  fontSize: FontSize;
  textAlign: "left" | "center" | "right";
  textColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  transition: SlideTransition;
  backgroundPattern?: string;
  stickers: { emoji: string; x: number; y: number }[];
}

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number; // seconds
  url?: string;
  previewUrl?: string;
}

export interface Celebration {
  id: string;
  templateId: string;
  eventId: string;
  slug: string;
  email: string;
  pages: StoryPage[];
  musicTrackId?: string;
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

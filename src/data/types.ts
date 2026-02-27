export interface EventTheme {
  primary: string;
  secondary: string;
  accent: string;
  baseColor?: string;
  glowColor?: string;
  textDark: string;
  textLight: string;
  headlineFont: string;
  bodyFont: string;
  backgroundPattern: string;
  backgroundPatternColor?: string;
  backgroundPatternOpacity?: number;
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
  type?: "light" | "dark";
  textMode?: "auto" | "light" | "dark";
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



export type SlideTransition = "fade" | "slide" | "zoom" | "flip";
export interface ImageTransform {
  x: number;
  y: number;
  xp?: number;
  yp?: number;
  width: number;
  rotation: number;
}

export interface Photo {
  id: string;
  url: string;
  transform: ImageTransform;
}

export type FontSize = "small" | "medium" | "large";

export interface StoryPage {
  id: string;
  photoUrl?: string; // Legacy
  photos?: Photo[]; // New: support for up to 3 characters
  text: string;
  fontFamily: string;
  fontSize: FontSize;
  textAlign: "left" | "center" | "right";
  textColor: string;
  themeId?: string;
  baseColor: string;
  glowColor?: string;
  transition: SlideTransition;
  backgroundPattern?: string;
  stickers: { emoji: string; x: number; y: number }[];
  imageTransform?: ImageTransform; // Legacy
  type?: "light" | "dark";
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
  amount: number;
  upsells: {
    removeWatermark: boolean;
    music: boolean;
    customLink: boolean;
    hdDownload: boolean;
  };
  date: number;
}

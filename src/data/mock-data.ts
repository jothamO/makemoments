import type { CelebrationEvent, Template, Celebration, Admin, SaleRecord, StoryPage } from "./types";

export const mockEvents: CelebrationEvent[] = [
  {
    id: "evt-1",
    name: "International Women's Day",
    slug: "womens-day",
    date: new Date("2026-03-08").getTime(),
    launchDate: new Date("2026-02-20").getTime(),
    endDate: new Date("2026-03-15").getTime(),
    status: "active",
    theme: {
      primary: "#FF4081",
      secondary: "#FF8C7A",
      accent: "#FFD54F",
      bgGradientStart: "#FF4081",
      bgGradientEnd: "#FF8C7A",
      textDark: "#2D1B30",
      textLight: "#FFFFFF",
      headlineFont: "Playfair Display",
      bodyFont: "Montserrat",
      backgroundPattern: "floral",
      headline: "Celebrate Her Strength",
      subheadline: "Create a beautiful personalized card for the incredible women in your life",
      ctaText: "Create Your Card",
      urgencyText: "🌸 Women's Day is March 8th — Cards close in 21 days!",
    },
    createdAt: Date.now(),
  },
];

const defaultPage = (overrides: Partial<StoryPage> = {}): StoryPage => ({
  id: `page-${Math.random().toString(36).slice(2, 8)}`,
  text: "",
  fontFamily: "Playfair Display",
  fontSize: "medium",
  textAlign: "center",
  textColor: "#FFFFFF",
  bgGradientStart: "#FF4081",
  bgGradientEnd: "#FF8C7A",
  transition: "fade",
  stickers: [],
  ...overrides,
});

export const mockTemplates: Template[] = [
  {
    id: "tpl-1",
    eventId: "evt-1",
    name: "Magazine Cover",
    thumbnail: "/placeholder.svg",
    outputType: "image",
    mediaSlots: [
      { id: "ms-1", label: "Main Photo", type: "photo", position: { x: 0, y: 0, width: 100, height: 60 }, required: true },
      { id: "ms-2", label: "Small Photo", type: "photo", position: { x: 65, y: 65, width: 30, height: 30 }, required: false },
    ],
    textSlots: [
      { id: "ts-1", label: "Her Name", placeholder: "e.g. Sarah", maxLength: 30, position: { x: 5, y: 62, width: 55, height: 10 }, style: { fontSize: 36, fontFamily: "Playfair Display", color: "#FFFFFF" } },
      { id: "ts-2", label: "Your Message", placeholder: "Write something special...", maxLength: 120, position: { x: 5, y: 75, width: 55, height: 20 }, style: { fontSize: 16, fontFamily: "Montserrat", color: "#FFFFFF" } },
    ],
    layers: ["gradient-overlay", "floral-border"],
    popularity: 342,
    createdAt: Date.now(),
    defaultPages: [
      defaultPage({ text: "", bgGradientStart: "#FF4081", bgGradientEnd: "#C2185B" }),
      defaultPage({ text: "Happy Women's Day!", bgGradientStart: "#FF8C7A", bgGradientEnd: "#FF4081" }),
      defaultPage({ text: "You are incredible 💐", bgGradientStart: "#FFD54F", bgGradientEnd: "#FF8C7A" }),
    ],
  },
  {
    id: "tpl-2",
    eventId: "evt-1",
    name: "Photo Collage",
    thumbnail: "/placeholder.svg",
    outputType: "image",
    mediaSlots: [
      { id: "ms-3", label: "Photo 1", type: "photo", position: { x: 2, y: 2, width: 48, height: 48 }, required: true },
      { id: "ms-4", label: "Photo 2", type: "photo", position: { x: 52, y: 2, width: 48, height: 48 }, required: true },
      { id: "ms-5", label: "Photo 3", type: "photo", position: { x: 2, y: 52, width: 48, height: 48 }, required: false },
      { id: "ms-6", label: "Photo 4", type: "photo", position: { x: 52, y: 52, width: 48, height: 48 }, required: false },
    ],
    textSlots: [
      { id: "ts-3", label: "Title", placeholder: "Happy Women's Day!", maxLength: 40, position: { x: 25, y: 45, width: 50, height: 10 }, style: { fontSize: 28, fontFamily: "Playfair Display", color: "#FF4081" } },
    ],
    layers: ["frame-white"],
    popularity: 215,
    createdAt: Date.now(),
    defaultPages: [
      defaultPage({ bgGradientStart: "#E8D5E0", bgGradientEnd: "#F8E8F0" }),
      defaultPage({ text: "You inspire everyone 🌟", bgGradientStart: "#FF4081", bgGradientEnd: "#FF8C7A" }),
    ],
  },
  {
    id: "tpl-3",
    eventId: "evt-1",
    name: "Greeting Card",
    thumbnail: "/placeholder.svg",
    outputType: "image",
    mediaSlots: [
      { id: "ms-7", label: "Portrait Photo", type: "photo", position: { x: 25, y: 5, width: 50, height: 45 }, required: true },
    ],
    textSlots: [
      { id: "ts-4", label: "To", placeholder: "Dear Mom", maxLength: 30, position: { x: 10, y: 55, width: 80, height: 8 }, style: { fontSize: 24, fontFamily: "Playfair Display", color: "#2D1B30" } },
      { id: "ts-5", label: "Message", placeholder: "Thank you for everything...", maxLength: 200, position: { x: 10, y: 65, width: 80, height: 25 }, style: { fontSize: 14, fontFamily: "Montserrat", color: "#2D1B30" } },
    ],
    layers: ["watercolor-bg"],
    popularity: 189,
    createdAt: Date.now(),
    defaultPages: [
      defaultPage({ bgGradientStart: "#FFF3E0", bgGradientEnd: "#FFE0B2", textColor: "#2D1B30" }),
      defaultPage({ text: "Dear Mom", fontFamily: "Playfair Display", bgGradientStart: "#FFCCBC", bgGradientEnd: "#FF8A65", textColor: "#FFFFFF" }),
      defaultPage({ text: "Thank you for everything you do 💕", bgGradientStart: "#FF4081", bgGradientEnd: "#FF8C7A" }),
    ],
  },
];

export const mockCelebrations: Celebration[] = [
  {
    id: "cel-1",
    templateId: "tpl-1",
    eventId: "evt-1",
    slug: "sarah-mom-2026",
    email: "jane@example.com",
    pages: [
      defaultPage({ photoUrl: "/placeholder.svg", text: "", bgGradientStart: "#FF4081", bgGradientEnd: "#C2185B" }),
      defaultPage({ text: "Super Mom Sarah", fontFamily: "Playfair Display", bgGradientStart: "#FF8C7A", bgGradientEnd: "#FF4081", stickers: [{ emoji: "👑", x: 80, y: 10 }] }),
      defaultPage({ text: "You inspire everyone around you. Happy Women's Day! 💐", bgGradientStart: "#FFD54F", bgGradientEnd: "#FF8C7A" }),
    ],
    musicTrackId: "track-3",
    removeWatermark: true,
    hasMusic: true,
    customLink: true,
    hdDownload: false,
    totalPaid: 2500,
    paymentStatus: "paid",
    views: 47,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "cel-2",
    templateId: "tpl-3",
    eventId: "evt-1",
    slug: "happy-wd-tina",
    email: "mark@example.com",
    pages: [
      defaultPage({ photoUrl: "/placeholder.svg", bgGradientStart: "#FFF3E0", bgGradientEnd: "#FFE0B2", textColor: "#2D1B30" }),
      defaultPage({ text: "Dear Tina", fontFamily: "Playfair Display", bgGradientStart: "#FFCCBC", bgGradientEnd: "#FF8A65" }),
      defaultPage({ text: "Wishing you the most wonderful Women's Day! You are truly amazing.", bgGradientStart: "#FF4081", bgGradientEnd: "#FF8C7A" }),
    ],
    removeWatermark: false,
    hasMusic: false,
    customLink: false,
    hdDownload: false,
    totalPaid: 1000,
    paymentStatus: "paid",
    views: 12,
    createdAt: Date.now() - 86400000,
  },
];

export const mockAdmins: Admin[] = [
  { email: "admin@makemoments.xyz", role: "super_admin", createdAt: Date.now() },
];

const now = Date.now();
export const mockSales: SaleRecord[] = Array.from({ length: 15 }, (_, i) => ({
  id: `sale-${i + 1}`,
  celebrationId: i % 2 === 0 ? "cel-1" : "cel-2",
  eventId: "evt-1",
  templateId: i % 3 === 0 ? "tpl-1" : i % 3 === 1 ? "tpl-2" : "tpl-3",
  amount: 1000 + (i % 4) * 500,
  upsells: {
    removeWatermark: i % 3 === 0,
    music: i % 4 === 0,
    customLink: i % 5 === 0,
    hdDownload: i % 6 === 0,
  },
  date: now - 86400000 * (14 - i) + Math.random() * 86400000,
}));

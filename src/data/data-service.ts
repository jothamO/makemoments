import { mockEvents, mockTemplates, mockCelebrations, mockAdmins, mockSales } from "./mock-data";
import type { CelebrationEvent, Template, Celebration, SaleRecord } from "./types";

// ---- Events ----
export function getActiveEvent(): CelebrationEvent | undefined {
  return mockEvents.find((e) => e.status === "active");
}

export function getEventBySlug(slug: string): CelebrationEvent | undefined {
  return mockEvents.find((e) => e.slug === slug);
}

export function getAllEvents(): CelebrationEvent[] {
  return [...mockEvents];
}

export function getEventById(id: string): CelebrationEvent | undefined {
  return mockEvents.find((e) => e.id === id);
}

// ---- Templates ----
export function getTemplatesByEvent(eventId: string): Template[] {
  return mockTemplates.filter((t) => t.eventId === eventId);
}

export function getTemplateById(id: string): Template | undefined {
  return mockTemplates.find((t) => t.id === id);
}

export function getAllTemplates(): Template[] {
  return [...mockTemplates];
}

// ---- Celebrations ----
export function getCelebrationBySlug(slug: string): Celebration | undefined {
  return mockCelebrations.find((c) => c.slug === slug);
}

export function getAllCelebrations(): Celebration[] {
  return [...mockCelebrations];
}

export function createCelebration(data: Omit<Celebration, "id" | "createdAt" | "views">): Celebration {
  const celebration: Celebration = {
    ...data,
    id: `cel-${Date.now()}`,
    views: 0,
    createdAt: Date.now(),
  };
  mockCelebrations.push(celebration);
  return celebration;
}

export function incrementViews(slug: string): void {
  const c = mockCelebrations.find((cel) => cel.slug === slug);
  if (c) c.views++;
}

// ---- Admin ----
export function isAdmin(email: string): boolean {
  return mockAdmins.some((a) => a.email === email);
}

// ---- Sales / Stats ----
export function getAllSales(): SaleRecord[] {
  return [...mockSales];
}

export function getSalesInRange(start: number, end: number): SaleRecord[] {
  return mockSales.filter((s) => s.date >= start && s.date <= end);
}

export function getDashboardStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySales = mockSales.filter((s) => s.date >= todayStart.getTime());

  return {
    todayRevenue: todaySales.reduce((a, s) => a + s.amount, 0),
    totalCelebrations: mockCelebrations.length,
    activeEvent: getActiveEvent()?.name ?? "None",
    conversionRate: 68,
  };
}

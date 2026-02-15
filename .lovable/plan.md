

# MakeMoments — Celebration Card Creator Platform

A mobile-first celebration card platform where users create personalized cards for seasonal events, with dynamic theming that transforms the entire site based on the active event.

**Tech: React + Vite + TypeScript + Tailwind + Shadcn/ui + React Router**
**Data: Mock data with local state (Supabase-ready schema for later)**

---

## Phase 1: Foundation & Theming System

### Dynamic Theme Provider
- Create a ThemeProvider that applies CSS custom properties (--color-primary, --color-secondary, --color-accent, gradients, fonts) based on the active event
- Load Google Fonts dynamically based on theme.headlineFont and theme.bodyFont
- Wrap the entire app so all public pages automatically reflect the active event's look

### Mock Data Layer
- Create a data service with sample Women's Day event (Pink #FF4081 & Coral #FF8C7A, March 8 2026)
- 3 sample templates with dummy thumbnail URLs and slot configurations
- Sample celebrations, admin user, and sales data
- All data access through service functions that mirror future Supabase queries

### Routing Setup
- Public routes: `/`, `/create/:eventSlug`, `/create/:eventSlug/:templateId`, `/:slug`
- Admin routes: `/admin`, `/admin/events`, `/admin/events/new`, `/admin/events/:id/edit`, `/admin/templates`, `/admin/templates/new`, `/admin/templates/:id/edit`, `/admin/sales`, `/admin/celebrations`

---

## Phase 2: Public Pages (Core User Flow)

### 1. Homepage (`/`)
- Hero section with gradient background from active event theme
- Urgency badge, large headline, subheadline — all driven by theme data
- Animated CTA button with gradient from primary to secondary
- Grid of 3 example template cards with thumbnails
- Sticky header with logo and mobile hamburger menu
- Footer with links

### 2. Template Gallery (`/create/:eventSlug`)
- Header showing event name with themed styling
- Responsive grid of template cards (2 cols mobile, 3 tablet)
- Each card: thumbnail, template name, popularity badge
- Click navigates to template editor

### 3. Template Editor (`/create/:eventSlug/:templateId`)
- Two-column layout (stacked on mobile)
- Left: "Add Photos" section with upload buttons per media slot (mock uploads with placeholder images), "Add Text" section with labeled inputs, character counters
- Right: Live CSS/HTML preview (1080×1080 styled div) showing positioned photos and text, watermark overlay
- Updates in real-time as user types/uploads
- Sticky bottom bar with "Create — ₦1,000" button opening payment modal

### 4. Payment Modal
- Dialog overlay with preview thumbnail
- Base price ₦1,000 with 4 upsell checkboxes (remove watermark, music, custom link, HD download — each +₦500)
- Email input with validation
- Dynamic total that updates as checkboxes toggle
- "Pay with Card" button (UI only, simulates success)
- Stripe/Paystack toggle (visual only)
- On "payment success": redirect to celebration view

### 5. Celebration View (`/:slug`)
- Rendered celebration card (HTML/CSS preview)
- Music player UI (if purchased)
- Share buttons: Copy Link, Twitter, WhatsApp, Facebook
- "Made with MakeMoments" footer (if watermark not removed)
- "Create Your Own" CTA button
- View counter that increments on load

---

## Phase 3: Admin Dashboard

### Layout
- Sidebar navigation (collapsible) with sections: Dashboard, Events, Templates, Sales, Celebrations, Settings
- Desktop: persistent sidebar | Mobile: bottom nav or hamburger
- Protected by checking email against admins data
- Neutral gray + indigo accent design (independent of public theme)

### 6. Dashboard (`/admin`)
- 4 metric cards: Today's Revenue, Celebrations Created, Active Event, Conversion Rate
- Revenue line chart (last 7 days) using Recharts
- Recent celebrations table (10 rows)
- Quick action buttons

### 7. Events List (`/admin/events`)
- Table view (desktop) / Card view (mobile)
- Columns: Name, Date, Status badge, Templates count, Celebrations count, Revenue, Actions
- Create New Event button

### 8. Event Editor (`/admin/events/new` and `/admin/events/:id/edit`)
- Split view: form left, live homepage preview right (stacked on mobile)
- Event details: name, slug, dates, status
- Theme configuration: color pickers (react-colorful), gradient preview bar, font dropdowns, background pattern, copy fields
- Theme presets dropdown (Women's Day, Mother's Day, Father's Day, Easter, Christmas) that auto-fill all fields
- Live preview updates in real-time with device toggle (mobile/desktop)
- Save as Draft / Publish buttons

### 9. Templates List (`/admin/templates`)
- Grid view (2/3/4 cols responsive)
- Cards with thumbnail, name, event, usage count, revenue
- Filters: event, type (image/video), sort by
- Upload Template button

### 10. Template Editor (`/admin/templates/new` and `/admin/templates/:id/edit`)
- Basic info: name, event dropdown, output type, thumbnail
- Media slots builder: add/remove slots with label, type, required toggle, position fields (x, y, width, height)
- Text slots builder: add/remove with label, placeholder, max length, position, font styling
- Toggle between visual editor and JSON code editor
- Test preview with sample data
- Save button

### 11. Sales Overview (`/admin/sales`)
- Date range picker (Today, 7 days, 30 days, All time)
- 4 metric cards: Total Revenue, Total Sales, Avg Order Value, Conversion Rate
- Revenue line chart, Top Events bar chart, Top Templates bar chart
- Upsell conversion stats (4 cards with percentages)

### 12. Celebrations List (`/admin/celebrations`)
- Grid of celebration cards with thumbnail, event, template, email, views, amount paid
- Search by email/slug, event filter, date range
- Pagination
- Actions: View, Download, Delete

---

## Phase 4: Polish & Quality

- Form validation with Zod on all inputs
- Loading skeletons for all async states
- Toast notifications for all actions (success/error)
- Smooth page transitions
- Mobile-first responsive design verified across breakpoints (0-768, 768-1024, 1024+)
- Proper error boundaries and 404 handling

---

## Starter Data Included
- **Women's Day Event**: March 8 2026, Pink & Coral theme, active status
- **3 Templates**: Magazine Cover, Photo Collage, Greeting Card (with placeholder thumbnails)
- **Sample Celebrations**: Pre-built examples for the celebration view
- **Admin User**: admin@makemoments.xyz


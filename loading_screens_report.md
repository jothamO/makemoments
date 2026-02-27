# Loading Screens in Makemoments Codebase

This report outlines all the loading screens, states, and spinners found in the `makemoments` codebase. The vast majority of loaders utilize the `Loader2` icon component from `lucide-react` with Tailwind's `animate-spin` utility class, ensuring a consistent design system. Below is a breakdown of their specific usage contexts:

## 1. Full Page & Route Loading Screens
These loaders are displayed prominently (often centered) to the user when a page, route, or primary section is fetching its central data.

*   **Protected Routes (`src/components/auth/ProtectedRoute.tsx`)**: Displays an indeterminate `Loader2` while user authentication resolves. (Background: `bg-zinc-950`)
*   **MyMoments Dashboard (`src/pages/MyMoments.tsx`)**: Centered loader while `celebrations` data and auth state load. (Background: `bg-zinc-950`)
*   **Admin Dashboard & Subpages (`src/pages/admin/*`)**: Almost all analytical and management pages (`Dashboard.tsx`, `Sales.tsx`, `Events.tsx`, `Celebrations.tsx`, `Pricing.tsx`, `Payments.tsx`, `Mail.tsx`) use variations of `<Loader2 className="h-8 w-8 animate-spin text-zinc-500" />` (or `zinc-400`) within a flex-centered container while fetching their respective data. (Background: Transparent container, inherits `bg-zinc-50` from admin layout)
*   **Admin Event Editor (`src/pages/admin/EventEditor.tsx`)**: Centered loader when loading a specific event's data. (Background: Transparent container, inherits `bg-zinc-50` from admin layout)
*   **Global Asset Pickers (`src/components/admin/GlobalAssetPickers.tsx`)**: Five individual centered loader states are shown when assets (characters, tracks, themes, fonts, or patterns) are being loaded from the database. (Background: Transparent container)
*   **Create Page Engine (`src/pages/CreatePage.tsx`)**: Utilizes a prominent overlay/viewport loading state (`<Loader2 className="w-8 h-8 text-white/20 animate-spin" />`) while saving or generating visual content. It also implements a custom CSS-styled spinner (`<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />`). (Background: Initial state uses `bg-zinc-950`, while content loading secondary states use `bg-gray-50`)
*   **Celebration View (`src/pages/CelebrationView.tsx`)**: A custom CSS spinner (`<div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />`) is displayed while the media or configuration validates. (Background: `bg-black`)

## 2. Inline & Button Loading Spinners
These smaller loading states communicate action progress inline, usually tied to form submissions or saving preferences.

*   **Login Page (`src/pages/LoginPage.tsx`)**: The core "Sign In" button shows a spinner (`<Loader2 className="w-5 h-5 animate-spin" />`) disabled during the `isLoading` cycle.
*   **Files Page Uploads (`src/pages/admin/FilesPage.tsx`)**: Multiple buttons for uploading media files and registering fonts/tracks display loaders, triggered by an `isUploading` contextual state.
*   **Admin Settings & Configurations (`src/pages/admin/Pricing.tsx`, `Payments.tsx`, `Mail.tsx`)**: Save buttons seamlessly shift the action text/icon to a small loader when `isSaving` or `isSavingConfig` is true. *Note: `Payments.tsx` uniquely incorporates an `animate-spin-slow` custom animation for a secondary refresh status icon.*
*   **Public Notify Me Dialog (`src/components/public/NotifyMeDialog.tsx`)**: Displays a smaller spinner substituting the "Remind Me ✨" call-to-action during the `isSubmitting` phase.
*   **User Settings Modal (`src/components/auth/SettingsModal.tsx`)**: Multiple inline loaders animate next to or in place of toggles as specific preferences resolve their updates.
*   **Payment Modal (`src/components/PaymentModal.tsx`)**: Centered inline loaders animate while verifying gateway links and payment statuses.

## Implementation Details
1.  **Primary Framework**: The application heavily relies on `lucide-react`'s `Loader2` SVG icon, styled with Tailwind UI's standard rotation utility (`animate-spin`).
2.  **Custom Spinners**: The `CreatePage` and `CelebrationView` diverge by using native HTML `div` spinners uniquely styled with Tailwind borders (`border-t-transparent`, `border-t-white`) to adapt beautifully when floating over complex dynamic layouts (e.g., dark or photographic backgrounds).

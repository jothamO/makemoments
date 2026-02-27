import { Link } from "react-router-dom";

import { useEventTheme } from "@/contexts/ThemeContext";

export function PublicFooter() {
  const { event } = useEventTheme();
  return (
    <footer className="bg-foreground/5 border-t py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="mb-3">
              <img src="/assets/logo.webp" alt="MakeMoments" className="h-6 w-auto" />
            </div>
            <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
              Create personalized celebration cards for every special occasion.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to={`/${event?.slug || 'womens-day'}/create`} className="hover:underline">Create Card</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="cursor-pointer hover:underline">Help Center</span></li>
              <li><span className="cursor-pointer hover:underline">Contact Us</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="cursor-pointer hover:underline">Privacy Policy</span></li>
              <li><span className="cursor-pointer hover:underline">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MakeMoments. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

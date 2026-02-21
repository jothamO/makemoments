import { createRoot } from "react-dom/client";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import App from "./App.tsx";
import { CurrencyProvider } from "./contexts/CurrencyContext.tsx";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
    <ConvexProvider client={convex}>
        <CurrencyProvider>
            <App />
        </CurrencyProvider>
    </ConvexProvider>
);

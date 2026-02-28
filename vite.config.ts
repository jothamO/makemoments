import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/

// ── Environment Hardening ──
// Set to `false` and rebuild to temporarily restore console logs in production for debugging.
const STRIP_CONSOLE = true;

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'MakeMoments',
        short_name: 'MakeMoments',
        description: 'Celebrate special moments with beautiful digital cards.',
        theme_color: '#000000',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: false, // Never ship source maps to production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: STRIP_CONSOLE,
        drop_debugger: true,
        pure_funcs: STRIP_CONSOLE
          ? ['console.log', 'console.info', 'console.debug']
          : [],
      },
      mangle: {
        toplevel: true,
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

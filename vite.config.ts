import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "CashBook",
        short_name: "CashBook",
        description: "Offline-first daily income and expense ledger",
        theme_color: "#0B0D12",
        background_color: "#0B0D12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*$/,
            handler: "NetworkOnly",
            options: {
              backgroundSync: {
                name: "cashbook-sync-queue",
                options: { maxRetentionTime: 60 * 24 * 7 },
              },
            },
          },
        ],
      },
    }),
  ],
});

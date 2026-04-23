import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type PluginOption } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { checkinMenuApiPlugin } from "./vite-plugin-checkin-api";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checkinMenuApiPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "McFit",
        short_name: "McFit",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "transparent",
        background_color: "transparent",
        icons: [
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    }),
  ] as PluginOption[],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

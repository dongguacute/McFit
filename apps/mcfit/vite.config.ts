import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { checkinMenuApiPlugin } from "./vite-plugin-checkin-api";

export default defineConfig({
  plugins: [react(), tailwindcss(), checkinMenuApiPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

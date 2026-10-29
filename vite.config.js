import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const backendProxy = {
  target: "http://localhost:3000",
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": backendProxy,
      "/health": backendProxy,
      "/ping": backendProxy,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": backendProxy,
      "/health": backendProxy,
      "/ping": backendProxy,
    },
  },
});

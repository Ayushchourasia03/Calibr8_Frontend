import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_URL || "http://localhost:3000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: Number(env.PORT) || 5173,
      strictPort: true,
      allowedHosts: true,
      proxy: Object.fromEntries(
        [
          "/auth",
          "/health",
          "/me",
          "/onboarding",
          "/ping",
          "/topic",
          "/topics",
        ].map((route) => [route, { target: backendUrl, changeOrigin: true }]),
      ),
    },
  };
});

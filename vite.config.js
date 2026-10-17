import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_URL || "http://localhost:3000";
  let hasLoggedBackendConnection = false;

  const createBackendProxy = () => ({
    target: backendUrl,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on("proxyRes", (proxyResponse, request) => {
        if (
          !hasLoggedBackendConnection &&
          request.url?.split("?")[0] === "/health" &&
          proxyResponse.statusCode >= 200 &&
          proxyResponse.statusCode < 300
        ) {
          hasLoggedBackendConnection = true;
          console.log(
            `[Calibr8] Frontend connected to backend at ${backendUrl}`,
          );
        }
      });
    },
  });

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: Number(env.PORT) || 5173,
      strictPort: true,
      allowedHosts: true,
      proxy: Object.fromEntries(
        [
          "/api",
          "/auth",
          "/health",
          "/me",
          "/onboarding",
          "/ping",
          "/topic",
          "/topics",
        ].map((route) => [route, createBackendProxy()]),
      ),
    },
  };
});

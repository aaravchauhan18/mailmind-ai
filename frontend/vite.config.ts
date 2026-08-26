import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "..", "");
  const backend = env.VITE_BACKEND_URL;
  if (!backend) throw new Error("VITE_BACKEND_URL must be set in the repository-root .env file.");
  const port = Number(env.VITE_DEV_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("VITE_DEV_PORT must be a valid port in the repository-root .env file.");
  return {
    envDir: "..",
    plugins: [react()],
    server: { port, proxy: { "/api": backend, "/actuator": backend } },
  };
});

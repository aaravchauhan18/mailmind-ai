import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, "..", "");
  const backend = process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL;
  if (!backend) throw new Error("VITE_BACKEND_URL must be set in the repository-root .env file.");
  const rawPort = process.env.VITE_DEV_PORT || env.VITE_DEV_PORT;
  const port = Number(rawPort);
  if (command === "serve" && (!Number.isInteger(port) || port < 1 || port > 65535)) throw new Error("VITE_DEV_PORT must be a valid port in the repository-root .env file.");
  return {
    envDir: "..",
    plugins: [react()],
    server: command === "serve" ? { port, proxy: { "/api": backend, "/actuator": backend } } : undefined,
  };
});

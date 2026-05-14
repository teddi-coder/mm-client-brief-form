import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // VITE_WORKER_URL should be set in Cloudflare Pages env vars
  // pointing to the deployed Worker URL.
});

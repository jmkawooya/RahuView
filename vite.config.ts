import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  return {
    base: isProduction ? "/RahuView/" : "/",
    server: {
      open: true,
    },
  };
});



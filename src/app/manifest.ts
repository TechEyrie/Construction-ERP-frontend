import type { MetadataRoute } from "next";

/** README_32 — installable web app manifest (M17). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Owner Project Control Platform",
    short_name: "OPC",
    description: "Owner-side construction project control",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FAF8F4",
    theme_color: "#0F1E2E",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}

import type { MetadataRoute } from "next";
import { BRAND_INK_900, BRAND_SLATE_50 } from "@/config/brandColors";

/** README_32 — installable web app manifest (M17). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yamaloon",
    short_name: "Yamaloon",
    description: "Owner-side construction project control",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: BRAND_SLATE_50,
    theme_color: BRAND_INK_900,
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

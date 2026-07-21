import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/data";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BUSINESS.name,
    short_name: "Pastry Picasso",
    description: BUSINESS.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f1",
    theme_color: "#d6187c",
    icons: [
      {
        src: "/images/logo.png",
        sizes: "500x500",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

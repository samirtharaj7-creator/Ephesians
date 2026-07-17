import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ephesians Commentary",
    short_name: "Ephesians",
    description: "The King James text of Ephesians with verse-by-verse commentary.",
    start_url: "/",
    display: "standalone",
    background_color: "#071d33",
    theme_color: "#071d33",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}

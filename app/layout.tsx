/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import { GlobalFooter, GlobalShell } from "@/components/global-shell";
import { ReadingProgressBar } from "@/components/reading-progress";
import { RouteStyling } from "@/components/route-styling";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import "./global-shell.css";
import "./ephesians-theme.css";
import "./background-content.css";
import "./ephesians-reader.css";

export const metadata: Metadata = {
  title: {
    default: "Ephesians Commentary",
    template: "%s | Ephesians Commentary"
  },
  description: "A complete six-chapter study of Ephesians with the King James text and verse-by-verse commentary.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ephesians.mybibleexplorer.com"),
  alternates: {
    canonical: "/"
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "My Bible Explorer",
    title: "Ephesians Commentary",
    description: "Explore grace, unity, and life in Christ through the complete letter to the Ephesians.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Ephesians Commentary — Grace, unity, and life in Christ"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ephesians Commentary",
    description: "Explore grace, unity, and life in Christ through the complete letter to the Ephesians.",
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@400;500;600&display=swap"
        />
      </head>
      <body className="mbe-shell-managed" data-ephesians-route="home">
        <RouteStyling />
        <GlobalShell />
        <ReadingProgressBar />
        <SiteHeader />
        {children}
        <GlobalFooter />
      </body>
    </html>
  );
}

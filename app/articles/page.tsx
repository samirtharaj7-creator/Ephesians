import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Ephesians Articles",
  description: "Focused articles exploring the message, setting, and theology of Ephesians.",
  alternates: {
    canonical: "/articles/"
  },
  openGraph: {
    type: "website",
    url: "/articles/",
    siteName: "My Bible Explorer",
    title: "Ephesians Articles",
    description: "Focused articles exploring the message, setting, and theology of Ephesians.",
    images: ["/og.png"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ephesians Articles",
    description: "Focused articles exploring the message, setting, and theology of Ephesians.",
    images: ["/og.png"]
  }
};

export default function ArticlesPage() {
  return (
    <main className="articles-page">
      <section className="articles-hero" aria-labelledby="articles-title">
        <div className="articles-hero-copy">
          <p className="articles-kicker">Ephesians Study Library</p>
          <h1 id="articles-title">Articles</h1>
          <p>
            Focused studies on the historical setting, central themes, difficult passages,
            and practical message of Ephesians.
          </p>
        </div>
      </section>

      <section className="articles-shell" aria-label="Ephesians article library">
        <div className="articles-empty">
          <span className="article-list-icon" aria-hidden="true">
            <FileText className="h-5 w-5" />
          </span>
          <span className="article-list-eyebrow">Study Library</span>
          <h2>New articles coming soon.</h2>
          <p>Focused Ephesians studies will be added here as they become available.</p>
        </div>
      </section>
    </main>
  );
}

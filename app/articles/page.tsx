import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

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
          <h2>Follow the letter’s major movements.</h2>
          <p>
            Begin with grace and identity in chapters 1–3, then follow Paul’s call to unity,
            holy living, Christ-shaped relationships, and steadfast prayer in chapters 4–6.
          </p>
          <Link href="/ephesians/1/" className="articles-empty-link">
            Begin with Ephesians 1 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

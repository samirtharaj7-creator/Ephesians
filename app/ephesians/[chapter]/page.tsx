import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookChapterStrip } from "@/components/book-chapter-strip";
import { ChapterStudy, type PublicChapterContent } from "@/components/verse-accordion";
import { EPHESIANS, getEphesiansChapter, getEphesiansChapterAdjacency, getEphesiansStaticParams } from "@/lib/ephesians";
import { getReferencePreviewsForChapter } from "@/lib/reference-previews";
import type { ChapterContent } from "@/lib/schemas";

export function generateStaticParams() {
  return getEphesiansStaticParams();
}

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }): Promise<Metadata> {
  const { chapter } = await params;
  const content = getEphesiansChapter(chapter);
  if (!content) notFound();
  const title = `Ephesians ${content.chapterNumber}`;
  const description = `${title} with the King James text and verse-by-verse commentary.`;
  const url = `/ephesians/${content.chapterNumber}/`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: "My Bible Explorer",
      title,
      description,
      url,
      images: ["/og.png"]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"]
    }
  };
}

export default async function EphesiansChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter } = await params;
  const content = getEphesiansChapter(chapter);
  const adjacency = getEphesiansChapterAdjacency(chapter);
  if (!content || !adjacency) notFound();
  const publicContent = withoutAuditSources(content);
  const referencePreviews = getReferencePreviewsForChapter(content);
  return (
    <main className="reader-page">
      <BookChapterStrip
        activeChapter={content.chapterNumber}
        bookSlug={EPHESIANS.slug}
        bookName={EPHESIANS.name}
        chapterCount={EPHESIANS.chapterCount}
        verseCounts={EPHESIANS.verseCounts}
      />
      <ChapterStudy
        chapter={publicContent}
        bookName={EPHESIANS.name}
        referencePreviews={referencePreviews}
      />
      <nav className="reader-chapter-nav no-print" aria-label="Ephesians adjacent chapters">
        {adjacency.previous ? <Link href={`/ephesians/${adjacency.previous}`}><ChevronLeft className="h-4 w-4" />Ephesians {adjacency.previous}</Link> : <span />}
        {adjacency.next ? <Link href={`/ephesians/${adjacency.next}`}>Ephesians {adjacency.next}<ChevronRight className="h-4 w-4" /></Link> : null}
      </nav>
    </main>
  );
}

function withoutAuditSources(chapter: ChapterContent): PublicChapterContent {
  const privateKeys = new Set(["sources", "sourceAudit", "reviewStatus", "reviewFlags"]);
  return JSON.parse(JSON.stringify(chapter, (key, value) => privateKeys.has(key) ? undefined : value)) as PublicChapterContent;
}

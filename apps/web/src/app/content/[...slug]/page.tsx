import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/features/content-factory/components/coming-soon";
import { findFactoryItem, SOON_SLUGS } from "@/features/content-factory/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return SOON_SLUGS.map(slug => ({ slug: slug.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const item = findFactoryItem((await params).slug.join("/"));
  return { title: item ? item.title + " · Coming soon" : "Không tìm thấy" };
}

export default async function FactoryPlaceholderPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const item = findFactoryItem((await params).slug.join("/"));
  if (!item || item.status !== "soon") notFound();
  return <ComingSoon item={item} />;
}

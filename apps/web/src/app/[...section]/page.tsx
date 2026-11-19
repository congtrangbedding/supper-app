import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers3 } from "lucide-react";
import { Badge } from "@ecommerce-os/ui/components/badge";
import { Button } from "@ecommerce-os/ui/components/button";
import { destinations, getDestination } from "@/lib/workspace";

export const dynamicParams = false;
export function generateStaticParams() {
  return destinations.map(page => ({ section: page.path.split("/") }));
}
export default async function SectionPage({ params }: { params: Promise<{ section: string[] }> }) {
  const page = getDestination((await params).section.join("/"));
  if (!page) notFound();
  return <section className="empty"><Layers3 size={34}/><Badge variant="secondary">{page.status === "coming-soon" ? "Coming soon" : "Đang phát triển"}</Badge>
    <h1>{page.title}</h1><p>{page.description}</p><p>Chức năng đang được chuẩn bị.</p>
    <Button asChild variant="outline"><Link href="/"><ArrowLeft/> Về tổng quan</Link></Button></section>;
}

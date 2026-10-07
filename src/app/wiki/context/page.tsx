import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWikiDoc } from "@/lib/content";
import { DocPage } from "@/components/wiki/DocPage";

export const metadata: Metadata = { title: "EOE 现状与背景" };

export default async function ContextPage() {
  const doc = await getWikiDoc("eoe-context");
  if (!doc) notFound();
  return <DocPage doc={doc} eyebrow="EOE 现状" />;
}

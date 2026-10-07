import "server-only";
import { collectRefs, existingWikiFiles } from "@/lib/content";
import { briefs, getSources } from "@/lib/sources";
import type { WikiRemarkOptions } from "@/lib/wiki-remark";

/** 渲染某个成长百科文件需要的上下文：已存在的文件、来源编号、该页用到的来源卡片数据 */
export async function wikiRenderContext(file: string, markdown: string[]) {
  const [existing, sources] = await Promise.all([existingWikiFiles(), getSources()]);
  const ctx: WikiRemarkOptions = { file, existing, sourceIds: Object.keys(sources.byId) };
  const refs = new Set<string>();
  for (const md of markdown) collectRefs(md, refs);
  return { ctx, sources: briefs(sources, refs) };
}

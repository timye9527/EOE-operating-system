import type { WikiSection } from "@/lib/content";

// 成长百科各节的类型（决定怎么显示）。网站和手机小页面（scripts/build-mini-page.ts）共用这一份。
// 结构来自 Markdown 本身：第 0 节 / 9.2 是 EOE 已确认、第 5 节是 60/80/90、第 6 节是前人经验、第 8 节是「明天第一次做」。

export type SectionKind = "eoe" | "levels" | "stories" | "first" | "practice" | "plain";

export function sectionKind(s: Pick<WikiSection, "num" | "label">): SectionKind {
  // 有编号的节（角色页）只按编号判断，避免「会前清单」这类标题被误认成第 8 节
  if (s.num !== null) {
    const byNum: Partial<Record<number, SectionKind>> = { 0: "eoe", 5: "levels", 6: "stories", 8: "first", 9: "practice" };
    return byNum[s.num] ?? "plain";
  }
  // 没编号的节（交接指南、EOE 背景）按标题判断
  const t = s.label;
  if (t.includes("EOE") && t.includes("已确认")) return "eoe";
  if (/60\s*\/\s*80\s*\/\s*90/.test(t)) return "levels";
  if (t.includes("第一次做") || t.includes("清单")) return "first";
  return "plain";
}

/** 章节跳转条上的短标签 */
export function navLabel(s: Pick<WikiSection, "num" | "label">) {
  const short: Partial<Record<SectionKind, string>> = { levels: "60/80/90", first: "明天第一次做" };
  const label = short[sectionKind(s)] ?? s.label.replace(/（.*?）|\(.*?\)/g, "");
  return s.num !== null ? `${s.num} ${label}` : label;
}

/** 小节标题是否是「EOE 已确认」/「可选补充」 */
export const isConfirmedTitle = (t: string) => t.includes("EOE") && t.includes("已确认");
export const isOptionalTitle = (t: string) => t.includes("补充") && t.includes("可选");

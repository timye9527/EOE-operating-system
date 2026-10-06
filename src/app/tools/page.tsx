import type { Metadata } from "next";
import { getTools } from "@/lib/config";
import { isExternal, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "工具箱" };

export default async function ToolsPage() {
  const { categories, tools } = await getTools();
  const known = new Set(categories.map((c) => c.id));
  const groups = [
    ...categories,
    ...(tools.some((t) => !known.has(t.category)) ? [{ id: "__other", label: "其他", emoji: "📎" }] : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="工具箱"
        title="外部工具与资源"
        desc="EOE Club OS 是入口：接龙在微信群、协作在腾讯文档、投票用成熟的投票工具。这里把它们放在一起。"
      />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4">
        {groups.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="shrink-0 rounded-full border border-line bg-white px-3 py-1 text-sm text-ink-2"
          >
            {c.emoji} {c.label}
          </a>
        ))}
      </div>
      {groups.map((c) => {
        const list = tools.filter((t) => (c.id === "__other" ? !known.has(t.category) : t.category === c.id));
        if (!list.length) return null;
        return (
          <section key={c.id} id={c.id} className="mb-6">
            <h2 className="mb-2.5 text-base font-bold">
              {c.emoji} {c.label}
            </h2>
            <div className="space-y-2">
              {list.map((t) => (
                <div key={t.id} id={t.id} className="card p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {t.name}
                        {t.tool && <span className="ml-1.5 text-xs font-normal text-ink-3">· {t.tool}</span>}
                      </p>
                      {t.purpose && <p className="mt-0.5 text-sm text-ink-2">{t.purpose}</p>}
                      {t.note && <p className="mt-1 text-xs text-ink-3">{t.note}</p>}
                    </div>
                    {t.url ? (
                      <a
                        href={t.url}
                        {...(isExternal(t.url) ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white"
                      >
                        打开
                      </a>
                    ) : (
                      <span className="shrink-0 rounded-full bg-line/60 px-3 py-1.5 text-xs text-ink-3">待补充</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <p className="mt-6 text-center text-xs text-ink-3">
        增删工具 / 投票模板：编辑 <code>content/tools.yaml</code>
      </p>
    </>
  );
}

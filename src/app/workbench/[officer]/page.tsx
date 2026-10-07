import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuestSources, getTools, getWorkbench, type WorkbenchBlock } from "@/lib/config";
import { getWiki } from "@/lib/content";
import { wikiRenderContext } from "@/lib/wiki-context";
import { getStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import type { LinkItem } from "@/lib/types";
import { Checklist } from "@/components/Checklist";
import { GuestSourceBars } from "@/components/GuestSourceBars";
import { LinkTile, Markdown } from "@/components/ui";
import { SourceProvider } from "@/components/wiki/SourceSheet";
import { sectionKind, SectionView } from "@/components/wiki/Sections";
import { WikiMarkdown } from "@/components/wiki/WikiMarkdown";
import { HandoverBanner } from "@/components/wiki/HandoverBanner";

type Props = { params: Promise<{ officer: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = await getWorkbench((await params).officer);
  return { title: w ? `${w.title} 工作台` : "官员工作台" };
}

const asText = (i: string | LinkItem) => (typeof i === "string" ? i : i.label);
const asLink = (i: string | LinkItem): LinkItem => (typeof i === "string" ? { label: i } : i);

export default async function WorkbenchPage({ params }: Props) {
  const { officer } = await params;
  const w = await getWorkbench(officer);
  if (!w) notFound();

  // 成长百科里这位官员的页面（有的话）：第 8 节清单 + EOE 已确认的内容，直接搬到工作台顶部
  const [g, s] = (w.wiki ?? "").split("/");
  const wiki = w.wiki ? await getWiki(g, s) : null;
  const first = wiki?.sections.find((x) => sectionKind(x) === "first");
  const confirmed = wiki
    ? [
        ...wiki.sections.filter((x) => sectionKind(x) === "eoe").map((x) => x.body),
        ...wiki.sections.flatMap((x) =>
          x.subsections.filter((sub) => sub.title.includes("EOE") && sub.title.includes("已确认")).map((sub) => sub.body),
        ),
      ]
    : [];
  const render = wiki ? await wikiRenderContext(wiki.file, [first?.body ?? "", ...confirmed]) : null;

  return (
    <SourceProvider sources={render?.sources ?? {}}>
      <nav className="mb-3 text-sm text-ink-3">
        <Link href="/workbench" className="hover:text-brand-ink">
          官员工作台
        </Link>{" "}
        / {w.title}
      </nav>
      <header className="mb-5 rounded-3xl bg-brand p-5 text-white">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{w.emoji}</span>
          <div>
            <h1 className="text-2xl font-black">
              {w.title} <span className="text-base font-medium opacity-80">{w.nameZh}</span>
            </h1>
            <p className="text-sm opacity-90">{w.tagline}</p>
          </div>
        </div>
        {wiki && (
          <Link
            href={`/wiki/${w.wiki}`}
            className="mt-4 inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-ink"
          >
            📘 成长百科：{w.title} 的 60 / 80 / 90 分 →
          </Link>
        )}
      </header>

      {wiki && render && (
        <div className="mb-6 space-y-3">
          <p className="text-xs font-semibold tracking-wide text-ink-3">来自成长百科 · {wiki.nameZh}</p>
          {first && <SectionView s={first} ctx={render.ctx} />}
          {confirmed.length > 0 && (
            <section className="rounded-[1.25rem] border border-mint-ink/20 bg-mint p-4">
              <h2 className="mb-2 text-base font-bold text-mint-ink">EOE 已确认的做法</h2>
              {confirmed.map((md, i) => (
                <WikiMarkdown key={i} md={md} ctx={render.ctx} />
              ))}
            </section>
          )}
        </div>
      )}

      <div className="mb-6">
        <HandoverBanner compact />
      </div>

      <p className="mb-2 text-xs text-ink-3">
        下面是工作台的通用提醒，不是 EOE 已确认的规则{wiki ? "" : "；这个角色的成长百科页面还没写"}。
      </p>
      <div className="space-y-3">
        {w.blocks.map((b, i) => (
          <section key={i} className="card p-4">
            <h2 className="mb-1 text-base font-bold">{b.title}</h2>
            {b.hint && <p className="mb-2 text-xs text-ink-3">{b.hint}</p>}
            <div className="mt-2">
              <Block block={b} id={`${w.slug}:${i}:${b.title}`} />
            </div>
          </section>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-ink-3">
        这个工作台的内容在 <code>content/workbench/{w.slug}.yaml</code>
      </p>
    </SourceProvider>
  );
}

async function Block({ block: b, id }: { block: WorkbenchBlock; id: string }) {
  const items = b.items ?? [];
  switch (b.type) {
    case "checklist":
      return <Checklist id={id} items={items.map(asText)} reset={b.reset} />;
    case "list":
      return (
        <ul className="prose-eoe">
          {items.map((it, i) => (
            <li key={i}>{asText(it)}</li>
          ))}
        </ul>
      );
    case "text":
      return <Markdown>{b.text ?? ""}</Markdown>;
    case "links":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(asLink).map((l, i) => (
            <LinkTile key={i} label={l.label} url={l.url} sub={l.note ?? l.url} emoji="📄" />
          ))}
        </div>
      );
    case "tools": {
      const { tools } = await getTools();
      const picked = items.map(asText).map((tid) => tools.find((t) => t.id === tid)).filter((t) => !!t);
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {picked.map((t) => (
            <LinkTile key={t.id} label={t.name} url={t.url} sub={t.purpose} emoji="🔗" />
          ))}
          <LinkTile label="全部工具与资源" url="/tools" sub="工具箱" emoji="🧰" tone="sun" />
        </div>
      );
    }
    case "wiki": {
      const entries = await Promise.all(
        items.map(asText).map((ref) => {
          const [g, s] = ref.split("/");
          return getWiki(g, s);
        }),
      );
      return (
        <div className="flex flex-wrap gap-2">
          {entries
            .filter((e) => !!e)
            .map((e) => (
              <Link
                key={e.slug}
                href={`/wiki/${e.group}/${e.slug}`}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-brand"
              >
                {e.emoji} {e.title} <span className="text-ink-3">{e.nameZh}</span>
              </Link>
            ))}
        </div>
      );
    }
    case "guest-sources": {
      const store = await getStore();
      const stats = computeStats(await store.listRecords());
      if (stats.totalGuests === 0) {
        const options = await getGuestSources();
        return (
          <p className="text-sm text-ink-2">
            还没有嘉宾数据。每场会后在 <Link href="/records/new" className="text-brand-ink underline">会后记录</Link>{" "}
            里点一下嘉宾来源就会自动累计。当前可选来源：{options.join("、")}
          </p>
        );
      }
      return (
        <>
          <p className="mb-3 text-sm text-ink-2">
            {stats.meetings} 场例会，累计 <b className="text-ink">{stats.totalGuests}</b> 位嘉宾
          </p>
          <GuestSourceBars data={stats.guestSources} total={stats.totalGuests} limit={6} />
          <Link href="/dashboard" className="mt-3 inline-block text-sm text-brand-ink">
            完整运营看板 →
          </Link>
        </>
      );
    }
    default:
      return null;
  }
}

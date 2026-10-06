import Link from "next/link";

// 「运营」栏目下的两个页面：运营记录 / 运营看板
export function OpsTabs({ active }: { active: "records" | "dashboard" }) {
  const tab = (key: typeof active, href: string, label: string) => (
    <Link
      href={href}
      className={`flex-1 rounded-xl py-2 text-center text-sm font-semibold transition ${
        active === key ? "bg-white text-ink shadow-sm" : "text-ink-3"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="mb-5 flex gap-1 rounded-2xl bg-line/50 p-1">
      {tab("records", "/records", "📒 运营记录")}
      {tab("dashboard", "/dashboard", "📊 运营看板")}
    </div>
  );
}

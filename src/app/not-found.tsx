import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-xl font-bold">这里什么也没有</h1>
      <p className="mt-1 text-sm text-ink-2">可能链接写错了，或者这一页还没写。</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
        回到首页
      </Link>
    </div>
  );
}

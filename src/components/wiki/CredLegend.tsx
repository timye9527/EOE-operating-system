// 可信度图例：告诉读者三种标记分别是什么意思。

export function CredLegend({ compact }: { compact?: boolean }) {
  const items = [
    { el: <span className="cred-eoe">✓ EOE 已确认</span>, text: "EOE 自己的规则，优先级最高" },
    { el: <span className="cred-ref">V1</span>, text: "前人经验，点一下看来源；虚线框 = 只读到摘要" },
    {
      el: (
        <span className="cred-inf">
          <span className="cred-inf-tag">推论</span>
        </span>
      ),
      text: "综合多方资料的判断，不是原话",
    },
  ];
  return (
    <details className="rounded-2xl border border-line bg-white px-3.5 py-2.5 text-sm" open={!compact}>
      <summary className="cursor-pointer list-none text-ink-2">
        <span className="font-semibold text-ink">怎么读这一页</span> · 三种标记
      </summary>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="shrink-0">{it.el}</span>
            <span className="text-ink-2">{it.text}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

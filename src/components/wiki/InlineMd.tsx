// 资料总表单元格里的行内 Markdown（**粗体**、*斜体*）。
// 只做这两种：单元格是纯文字 + 杂志名斜体，用不着完整的 Markdown 渲染。
// 不带 "use client"，服务端页面和客户端弹层都能用。

export function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

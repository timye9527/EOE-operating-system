import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 内容（Markdown / YAML）在运行时从 content/ 和成长百科 docs/eoe-growth-wiki/ 读取，部署时需要一起打包
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./docs/eoe-growth-wiki/**/*"],
  },
};

export default nextConfig;

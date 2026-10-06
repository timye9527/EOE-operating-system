import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 内容（Markdown / YAML）在运行时从 content/ 读取，部署时需要一起打包
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;

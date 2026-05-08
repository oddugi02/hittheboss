import type { NextConfig } from "next";
import path from "node:path";

// GitHub project pages are served from https://<user>.github.io/<repo>/.
// Set BASE_PATH=/<repo> in CI (see .github/workflows/pages.yml). Omit for
// Vercel, localhost, or a user/org site at the domain root.
const raw = (process.env.BASE_PATH ?? "").trim();
const basePath =
  raw === "" || raw === "/"
    ? ""
    : raw.startsWith("/")
      ? raw.replace(/\/$/, "")
      : `/${raw.replace(/\/$/, "")}`;

const nextConfig: NextConfig = {
  output: "export",
  ...(basePath ? { basePath } : {}),
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: ["10.100.54.137", "*.local"],
};

export default nextConfig;

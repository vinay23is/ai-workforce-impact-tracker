import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // A stray lockfile elsewhere on the machine can make Next guess the wrong
  // workspace root; pin it to this project.
  outputFileTracingRoot: projectRoot,
  // Pages are prerendered at build time (SSG); this is not `output: 'export'`.
  // No image optimization service is used, so images are served unoptimized.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

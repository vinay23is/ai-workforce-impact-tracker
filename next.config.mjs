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
  // The site is fully static; no image optimization service is required for V1.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The domain package is TypeScript source consumed directly from the
  // monorepo workspace (no separate build step) — transpile it here.
  transpilePackages: ["@buff-not-bored/domain"],
  webpack: (config) => {
    // packages/domain's relative imports use ESM-style ".js" extensions
    // (the TS convention for NodeNext resolution) that point at ".ts"
    // source files. tsc/vitest resolve that automatically; webpack needs
    // to be told to fall back to ".ts"/".tsx" when the literal ".js" isn't
    // found, since there's no compiled dist/ for this workspace package.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
  },
};

export default nextConfig;

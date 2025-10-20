// import type { NextConfig } from "next";
//
// const nextConfig: NextConfig = {
//   /* config options here */
// };
//
// export default nextConfig;

const isProd = process.env.NODE_ENV === 'production';

const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Use SSG for static pages but allow dynamic routes
    // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
    output: isProd ? 'export' : undefined,
    // Note: This feature is required to use the Next.js Image component in SSG mode.
    // See https://nextjs.org/docs/messages/export-image-api for different workarounds.
    images: {
        unoptimized: true,
    },
    // Configure assetPrefix or else the server won't properly resolve your assets.
    assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
};

export default nextConfig;

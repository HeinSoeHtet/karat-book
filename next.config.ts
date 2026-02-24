import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
	/* config options here */
	turbopack: {
		root: "/home/hein/personal/karat-book",
	},
};

const wrappedConfig = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
})(nextConfig);

export default withNextIntl(wrappedConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

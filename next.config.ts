import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
	/* config options here */
	turbopack: {
		root: "/home/hein/personal/karat-book",
	},
	async redirects() {
		return [
			{
				source: "/",
				destination: "/invoice",
				permanent: false,
			},
		];
	},
};

const wrappedConfig = withBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
})(nextConfig);

export default wrappedConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

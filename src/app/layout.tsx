import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

import { SITE_CONFIG } from "@/lib/config";
import { SettingsProvider } from "@/context/SettingsContext";

export const metadata: Metadata = {
	title: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
	description: SITE_CONFIG.description,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<SettingsProvider>
					{children}
				</SettingsProvider>
				<Toaster position="top-right" />
			</body>
		</html>
	);
}

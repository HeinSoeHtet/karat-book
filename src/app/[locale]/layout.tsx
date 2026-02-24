import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

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

import { LocaleSync } from "@/components/LocaleSync";

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Ensure that the incoming `locale` is valid
	if (!routing.locales.includes(locale as any)) {
		notFound();
	}

	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<NextIntlClientProvider messages={messages} locale={locale}>
					<SettingsProvider>
						<LocaleSync locale={locale} />
						{children}
					</SettingsProvider>
					<Toaster position="top-right" />
				</NextIntlClientProvider>
			</body>
		</html>
	);
}

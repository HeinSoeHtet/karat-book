"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DailyMarketRate } from "@/types";

export async function getDailyMarketRatesAction(): Promise<{ success: boolean; data?: DailyMarketRate[]; error?: string }> {
    try {
        // Fetch from our internal API which has edge caching
        // Using an absolute URL isn't strictly necessary for internal fetch in Next.js 15
        // but since we are running in various environments (local vs Cloudflare), 
        // we can fetch from the relative path if executed on the server correctly.

        const { env }: { env: any } = await getCloudflareContext();
        const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/market-rate`, {
            method: 'GET',
            cache: 'no-store' // We let the API handle its own caching on the Edge
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from API: ${response.statusText}`);
        }

        const result = (await response.json()) as { success: boolean, data?: any[], error?: string };

        if (!result.success) {
            return { success: false, error: result.error || "Failed to fetch market rates" };
        }

        // Map API response to the action's expected return format
        const parsedData: DailyMarketRate[] = (result.data || []).map((r: any) => ({
            id: r.id,
            type: r.type as 'gold' | 'exchange_rate',
            hourlyRate: r.hourlyRate,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        }));

        return {
            success: true,
            data: parsedData
        };
    } catch (error) {
        console.error("Failed to fetch market rates via API:", error);
        return { success: false, error: "Failed to fetch market rates" };
    }
}

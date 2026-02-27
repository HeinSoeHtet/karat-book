"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DailyMarketRate } from "@/types";

export async function getDailyMarketRatesAction(): Promise<{ success: boolean; data?: DailyMarketRate[]; error?: string }> {
    try {
        const { env }: { env: any } = await getCloudflareContext();

        // Use external API URL from environment variable or default placeholder
        const apiBaseUrl = env.MARKET_RATE_API_URL.replace(/\/$/, "");
        const apiUrl = `${apiBaseUrl}/api/market-rate?t=${Date.now()}`;

        console.log(`[MarketAction] Fetching from external service: ${apiUrl}`);

        // Always send Service Token for external API access
        const response = await fetch(apiUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'CF-Access-Client-Id': (env.CF_ACCESS_CLIENT_ID || '').trim(),
                'CF-Access-Client-Secret': (env.CF_ACCESS_CLIENT_SECRET || '').trim(),
                'User-Agent': 'Cloudflare-Worker-Internal',
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}):`, errorText.substring(0, 200));
            throw new Error(`Failed to fetch from API: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const body = await response.text();
            console.error(`Received non-JSON response. Body snippet:`, body.substring(0, 300));
            throw new Error(`API returned non-JSON response. Check your Zero Trust Service Token policy.`);
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

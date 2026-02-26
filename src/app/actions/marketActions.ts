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

        // Debug logging for environment (safe for production)
        console.log(`[MarketAction] Fetching from: ${baseUrl}/api/market-rate`);
        // Check for required secrets
        if (!env.CF_ACCESS_CLIENT_ID || !env.CF_ACCESS_CLIENT_SECRET) {
            throw new Error('Cloudflare Access Service Token secrets (CF_ACCESS_CLIENT_ID/SECRET) are missing from the Worker environment. Please add them in the Cloudflare Dashboard.');
        }

        const response = await fetch(`${baseUrl}/api/market-rate`, {
            method: 'GET',
            cache: 'no-store', // We let the API handle its own caching on the Edge
            headers: {
                'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID || '',
                'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET || '',
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
            console.error('Expected JSON but received:', body.substring(0, 500));
            throw new Error('API returned non-JSON response (likely Cloudflare Access block)');
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

"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { dailyMarketRate } from "@/db/schema";
import { desc } from "drizzle-orm";
import { DailyMarketRate, HourlyRateEntry } from "@/types";

export async function getDailyMarketRatesAction(): Promise<{ success: boolean; data?: DailyMarketRate[]; error?: string }> {
    try {
        const context = await getCloudflareContext();
        const d1 = context.env.DB as D1Database;
        if (!d1) throw new Error("Database not found");

        const db = getDb(d1);
        const results = await db.select().from(dailyMarketRate).orderBy(desc(dailyMarketRate.createdAt)).limit(60);

        const parsedData: DailyMarketRate[] = results.map(r => ({
            id: r.id,
            type: r.type as 'gold' | 'exchange_rate',
            hourlyRate: JSON.parse(r.hourlyRate) as HourlyRateEntry[],
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        }));

        return {
            success: true,
            data: parsedData
        };
    } catch (error) {
        console.error("Failed to fetch market rates:", error);
        return { success: false, error: "Failed to fetch market rates" };
    }
}

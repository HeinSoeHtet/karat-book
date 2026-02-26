import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/db';
import { dailyMarketRate } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { HourlyRateEntry } from '@/types';

export const runtime = 'edge';

interface MarketRateRequestBody {
    usdt_mmk: number;
    gold_usd: number;
    timestamp: string;
}

export async function GET(request: NextRequest) {
    try {
        const { env, ctx } = await getCloudflareContext();
        const cache = (typeof globalThis !== 'undefined' && (globalThis as any).caches)
            ? (globalThis as any).caches.default
            : null;
        const cacheKey = request.url;

        // Try to get from cache if it exists
        if (cache) {
            try {
                const cachedResponse = await cache.match(cacheKey);
                if (cachedResponse) return cachedResponse;
            } catch (e) {
                console.warn('Cache match failed:', e);
            }
        }

        const db = getDb(env.DB);

        // Fetch latest 'gold' record
        const goldRate = await db.select()
            .from(dailyMarketRate)
            .where(eq(dailyMarketRate.type, 'gold'))
            .orderBy(desc(dailyMarketRate.createdAt))
            .limit(1);

        // Fetch latest 'exchange_rate' record
        const exchangeRate = await db.select()
            .from(dailyMarketRate)
            .where(eq(dailyMarketRate.type, 'exchange_rate'))
            .orderBy(desc(dailyMarketRate.createdAt))
            .limit(1);

        const rates = [...goldRate, ...exchangeRate];

        const responseData = {
            success: true,
            data: rates.map(r => ({
                id: r.id,
                type: r.type,
                hourlyRate: JSON.parse(r.hourlyRate),
                updatedAt: r.updatedAt,
                createdAt: r.createdAt
            }))
        };

        const response = NextResponse.json(responseData);

        // Cache for 1 hour on the edge, but tell browsers to revalidate every time
        response.headers.set('Cache-Control', 'public, no-cache, s-maxage=3600');

        // Store in Cloudflare cache if available
        if (cache) {
            try {
                ctx.waitUntil(cache.put(cacheKey, response.clone()));
            } catch (e) {
                console.warn('Cache put failed:', e);
            }
        }

        return response;
    } catch (error) {
        console.error('Market rate fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch market rates' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const context = await getCloudflareContext();

        const body = await request.json() as MarketRateRequestBody;
        const { usdt_mmk, gold_usd } = body;
        let { timestamp } = body;

        // Handle 12 AM to 0 AM conversion as requested
        if (timestamp === '12 AM') {
            timestamp = '0 AM';
        }

        // Validation
        if (!timestamp || gold_usd === undefined || usdt_mmk === undefined) {
            return NextResponse.json({
                error: 'Missing required fields. Expected: { usdt_mmk, gold_usd, timestamp }'
            }, { status: 400 });
        }

        if (typeof gold_usd !== 'number' || gold_usd <= 0) {
            return NextResponse.json({ error: 'gold_usd must be a positive number' }, { status: 400 });
        }

        if (typeof usdt_mmk !== 'number' || usdt_mmk <= 0) {
            return NextResponse.json({ error: 'usdt_mmk must be a positive number' }, { status: 400 });
        }

        const d1 = context.env.DB as D1Database;
        const db = getDb(d1);

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const processType = async (type: 'gold' | 'exchange_rate', value: number) => {
            const existing = await db.select()
                .from(dailyMarketRate)
                .where(and(
                    eq(dailyMarketRate.type, type),
                    gte(dailyMarketRate.createdAt, startOfDay),
                    lte(dailyMarketRate.createdAt, endOfDay)
                ))
                .limit(1);

            const newEntry: HourlyRateEntry = { time: timestamp, value: Number(value) };

            if (existing.length > 0) {
                const currentRates = JSON.parse(existing[0].hourlyRate) as HourlyRateEntry[];
                currentRates.push(newEntry);
                await db.update(dailyMarketRate)
                    .set({
                        hourlyRate: JSON.stringify(currentRates),
                        updatedAt: new Date()
                    })
                    .where(eq(dailyMarketRate.id, existing[0].id));
            } else {
                await db.insert(dailyMarketRate).values({
                    type,
                    hourlyRate: JSON.stringify([newEntry]),
                });
            }
        };

        await processType('gold', gold_usd);
        await processType('exchange_rate', usdt_mmk);

        // Clear Cloudflare cache for the GET request if available
        const { ctx } = await getCloudflareContext();
        const cache = (typeof globalThis !== 'undefined' && (globalThis as any).caches)
            ? (globalThis as any).caches.default
            : null;

        if (cache) {
            try {
                // Delete the current URL and the base URL (without query params) to be safe
                const baseUrl = request.url.split('?')[0];
                ctx.waitUntil(Promise.all([
                    cache.delete(request.url),
                    cache.delete(baseUrl)
                ]));
            } catch (e) {
                console.warn('Cache delete failed:', e);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Market rates updated successfully'
        });
    } catch (error) {
        console.error('Market rate update error:', error);
        return NextResponse.json({
            error: 'Failed to update market rate',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

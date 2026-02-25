import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/db';
import { dailyMarketRate } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { HourlyRateEntry } from '@/types';

interface MarketRateRequestBody {
    usdt_mmk: number;
    gold_usd: number;
    timestamp: string;
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

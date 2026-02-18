import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/db';
import { dailyMarketRate } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { HourlyRateEntry } from '@/types';

interface MarketRateRequestBody {
    time: string;
    gold_price: number;
    exchange_rate: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as MarketRateRequestBody;
        const { time, gold_price, exchange_rate } = body;

        // Validation
        if (!time || gold_price === undefined || exchange_rate === undefined) {
            return NextResponse.json({
                error: 'Missing required fields. Expected: { time, gold_price, exchange_rate }'
            }, { status: 400 });
        }

        if (typeof gold_price !== 'number' || gold_price <= 0) {
            return NextResponse.json({ error: 'gold_price must be a positive number' }, { status: 400 });
        }

        if (typeof exchange_rate !== 'number' || exchange_rate <= 0) {
            return NextResponse.json({ error: 'exchange_rate must be a positive number' }, { status: 400 });
        }

        const context = await getCloudflareContext();
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

            const newEntry: HourlyRateEntry = { time, value: Number(value) };

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

        await processType('gold', gold_price);
        await processType('exchange_rate', exchange_rate);

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

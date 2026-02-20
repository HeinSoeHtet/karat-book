"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, ArrowUp, ArrowDown, Coins, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { getDailyMarketRatesAction } from '@/app/actions/marketActions';
import { HourlyRateEntry } from '@/types';

interface HourlyGoldPrice {
    time: string;
    price: number;
    change: number;
}

interface HourlyExchangeRate {
    time: string;
    rate: number;
    change: number;
}

export default function NewsPage() {
    const [loading, setLoading] = useState(true);
    const [realGoldData, setRealGoldData] = useState<HourlyRateEntry[]>([]);
    const [realExchangeData, setRealExchangeData] = useState<HourlyRateEntry[]>([]);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            const result = await getDailyMarketRatesAction();
            if (result.success && result.data && result.data.length > 0) {
                const latestGold = result.data.find(d => d.type === 'gold');
                const latestExchange = result.data.find(d => d.type === 'exchange_rate');

                if (latestGold) setRealGoldData(latestGold.hourlyRate);
                if (latestExchange) setRealExchangeData(latestExchange.hourlyRate);

                const dates = [latestGold?.updatedAt, latestExchange?.updatedAt].filter(Boolean) as Date[];
                if (dates.length > 0) {
                    setLastUpdated(new Date(Math.max(...dates.map(d => d.getTime()))));
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // Process real data into formats
    const worldGoldHourlyPrices: HourlyGoldPrice[] = realGoldData.map((d, i) => ({
        time: d.time,
        price: d.value,
        change: i === 0 ? 0 : d.value - realGoldData[i - 1].value
    }));

    const usdToMmkHourlyRates: HourlyExchangeRate[] = realExchangeData.map((d, i) => ({
        time: d.time,
        rate: d.value,
        change: i === 0 ? 0 : d.value - realExchangeData[i - 1].value
    }));

    const currentWorldPrice = worldGoldHourlyPrices.length > 0
        ? worldGoldHourlyPrices[worldGoldHourlyPrices.length - 1]
        : { price: 0 };
    const dayStartPrice = worldGoldHourlyPrices.length > 0 ? worldGoldHourlyPrices[0].price : 0;
    const totalDayChange = dayStartPrice > 0 ? currentWorldPrice.price - dayStartPrice : 0;
    const totalDayChangePercent = dayStartPrice > 0 ? (totalDayChange / dayStartPrice) * 100 : 0;

    const currentExchangeRate = usdToMmkHourlyRates.length > 0
        ? usdToMmkHourlyRates[usdToMmkHourlyRates.length - 1]
        : { rate: 0 };
    const dayStartRate = usdToMmkHourlyRates.length > 0 ? usdToMmkHourlyRates[0].rate : 0;
    const totalRateChange = dayStartRate > 0 ? currentExchangeRate.rate - dayStartRate : 0;
    const totalRateChangePercent = dayStartRate > 0 ? (totalRateChange / dayStartRate) * 100 : 0;

    // Display versions in descending order
    const displayGoldPrices = [...worldGoldHourlyPrices].reverse();
    const displayExchangeRates = [...usdToMmkHourlyRates].reverse();

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-pulse">
                <div className="mb-6 sm:mb-10">
                    <div className="h-10 w-64 bg-amber-500/10 rounded-lg mb-4"></div>
                    <div className="h-6 w-96 bg-amber-500/5 rounded-lg"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-slate-800/20 border border-amber-500/5 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="h-6 w-48 bg-amber-500/10 rounded"></div>
                            </div>
                            <div className="h-4 w-32 bg-amber-500/5 rounded"></div>

                            {/* Summary Box Skeleton */}
                            <div className="p-5 bg-slate-900/40 rounded-xl border border-amber-500/5 h-24"></div>

                            {/* List Skeleton */}
                            <div className="space-y-3">
                                <div className="h-4 w-40 bg-amber-500/5 rounded mb-4"></div>
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="h-12 bg-slate-900/20 rounded-lg border border-amber-500/5"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6 sm:mb-10">
                <h2 className="text-2xl sm:text-4xl font-bold text-amber-50 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                    <Newspaper className="size-6 sm:size-8 text-amber-400" />
                    Market Rate
                </h2>
                <p className="text-amber-200/60 text-xs sm:text-lg">Real-time world gold price and currency exchange tracking</p>
            </div>

            {/* Gold Prices Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* World Gold Price - Hourly */}
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30 backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent"></div>
                    <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-amber-50 flex items-center gap-2">
                                <Coins className="size-6 text-amber-400" />
                                World Gold Price (24K)
                            </CardTitle>
                        </div>
                        <p className="text-xs text-amber-200/50 mt-2">
                            Last updated: {format(lastUpdated, 'MMM dd, yyyy hh:mm a')}
                        </p>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                        {/* Current Price Summary */}
                        <div className="p-5 bg-slate-900/50 rounded-xl border border-amber-500/30">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-amber-200/70 mb-1">Current Price</div>
                                    <div className="text-3xl font-bold text-amber-50">
                                        {currentWorldPrice.price.toFixed(2)} USD
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`flex items-center gap-1 text-lg font-semibold ${totalDayChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {totalDayChange >= 0 ? (
                                            <ArrowUp className="size-5" />
                                        ) : (
                                            <ArrowDown className="size-5" />
                                        )}
                                        {Math.abs(totalDayChange).toFixed(2)}
                                    </div>
                                    <div className={`text-sm ${totalDayChangePercent >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
                                        }`}>
                                        {totalDayChangePercent >= 0 ? '+' : ''}{totalDayChangePercent.toFixed(2)}% today
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hourly Prices */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-amber-200/70 mb-3">
                                <Clock className="size-4" />
                                <span>Hourly Price Movement</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {displayGoldPrices.length > 0 ? (
                                    displayGoldPrices.map((item, index) => (
                                        <div
                                            key={item.time}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0
                                                ? 'bg-amber-500/20 border-amber-500/40'
                                                : 'bg-slate-900/20 border-amber-500/10 hover:bg-slate-900/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${index === 0
                                                    ? 'bg-amber-500/30 text-amber-200'
                                                    : 'bg-slate-800/50 text-amber-200/60'
                                                    }`}>
                                                    {item.time}
                                                </div>
                                                <div className="text-amber-50 font-semibold">
                                                    {item.price.toFixed(2)}
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1 text-xs font-medium ${item.change > 0 ? 'text-emerald-400' :
                                                item.change < 0 ? 'text-red-400' :
                                                    'text-amber-200/50'
                                                }`}>
                                                {item.change > 0 && <ArrowUp className="size-3" />}
                                                {item.change < 0 && <ArrowDown className="size-3" />}
                                                {item.change !== 0 ? `${Math.abs(item.change).toFixed(2)}` : '—'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-amber-200/40 border border-dashed border-amber-500/20 rounded-xl">
                                        No gold price movements recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* USD to MMK Exchange Rate - Hourly */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 backdrop-blur-sm overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent"></div>
                    <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-amber-50 flex items-center gap-2">
                                <Coins className="size-6 text-blue-400" />
                                USD to MMK Exchange Rate
                            </CardTitle>
                        </div>
                        <p className="text-xs text-amber-200/50 mt-2">
                            Last updated: {format(lastUpdated, 'MMM dd, yyyy hh:mm a')}
                        </p>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                        {/* Current Rate Summary */}
                        <div className="p-5 bg-slate-900/50 rounded-xl border border-blue-500/30">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <div className="text-sm text-amber-200/70 mb-1">Current Rate</div>
                                    <div className="text-3xl font-bold text-amber-50">
                                        {currentExchangeRate.rate.toFixed(2)} MMK
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`flex items-center gap-1 text-lg font-semibold ${totalRateChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {totalRateChange >= 0 ? (
                                            <ArrowUp className="size-5" />
                                        ) : (
                                            <ArrowDown className="size-5" />
                                        )}
                                        {Math.abs(totalRateChange).toFixed(2)}
                                    </div>
                                    <div className={`text-sm ${totalRateChangePercent >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'
                                        }`}>
                                        {totalRateChangePercent >= 0 ? '+' : ''}{totalRateChangePercent.toFixed(2)}% today
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hourly Exchange Rates */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-amber-200/70 mb-3">
                                <Clock className="size-4" />
                                <span>Hourly Rate Movement</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {displayExchangeRates.length > 0 ? (
                                    displayExchangeRates.map((item, index) => (
                                        <div
                                            key={item.time}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${index === 0
                                                ? 'bg-blue-500/20 border-blue-500/40'
                                                : 'bg-slate-900/20 border-blue-500/10 hover:bg-slate-900/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${index === 0
                                                    ? 'bg-blue-500/30 text-blue-200'
                                                    : 'bg-slate-800/50 text-amber-200/60'
                                                    }`}>
                                                    {item.time}
                                                </div>
                                                <div className="text-amber-50 font-semibold">
                                                    {item.rate.toFixed(2)} MMK
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1 text-xs font-medium ${item.change > 0 ? 'text-emerald-400' :
                                                item.change < 0 ? 'text-red-400' :
                                                    'text-amber-200/50'
                                                }`}>
                                                {item.change > 0 && <ArrowUp className="size-3" />}
                                                {item.change < 0 && <ArrowDown className="size-3" />}
                                                {item.change !== 0 ? `${Math.abs(item.change).toFixed(2)}` : '—'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-blue-200/40 border border-dashed border-blue-500/20 rounded-xl">
                                        No rate movements recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

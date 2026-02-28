"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, HandCoins, TrendingUp, Diamond, AlertTriangle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart } from 'recharts';
import { Item, Invoice } from '@/types';
import { getItemsAction } from '@/app/actions/itemActions';

import { getInvoicesAction } from '@/app/actions/invoiceActions';

import { useTranslations, useFormatter } from 'next-intl';

export default function AnalyticsPage() {
    const t = useTranslations('analytics');
    const formatIntl = useFormatter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const invoicesRes = await getInvoicesAction();

                if (invoicesRes.success && invoicesRes.data) {
                    setInvoices(invoicesRes.data as unknown as Invoice[]);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Prepare monthly data for charts (Last 6 months including current)
    const today = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6Months.push({
            label: formatIntl.dateTime(d, { month: 'short' }),
            month: d.getMonth(),
            year: d.getFullYear()
        });
    }

    const monthlyData = last6Months.map(m => {
        const data = {
            month: m.label,
            pawnAmount: 0,
            pawnCount: 0,
            salesAmount: 0,
            salesCount: 0,
            buyAmount: 0,
            buyCount: 0
        };

        invoices.forEach(inv => {
            const invDate = new Date(inv.createdAt || inv.date);
            if (invDate.getMonth() === m.month && invDate.getFullYear() === m.year) {
                if (inv.type === 'pawn') {
                    data.pawnAmount += inv.total;
                    data.pawnCount += 1;
                } else if (inv.type === 'sales') {
                    data.salesAmount += inv.total;
                    data.salesCount += 1;
                } else if (inv.type === 'buy') {
                    data.buyAmount += inv.total;
                    data.buyCount += 1;
                }
            }
        });

        return data;
    });

    const pawnCount = invoices.filter(invoice => invoice.type === 'pawn').length;
    // const salesCount = invoices.filter(invoice => invoice.type === 'sales').length;
    // const buyCount = invoices.filter(invoice => invoice.type === 'buy').length;
    // const inventoryCount = dbItems.length;

    // Custom tooltip component
    interface CustomTooltipProps {
        active?: boolean;
        payload?: {
            name: string;
            value: number;
            color: string;
        }[];
        label?: string;
    }

    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800/95 backdrop-blur-sm border border-amber-500/30 p-3 rounded-lg shadow-xl">
                    <p className="text-amber-50 font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-10">
                <h2 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                    <TrendingUp className="size-6 sm:size-8 text-primary" />
                    {t('title')}
                </h2>
                <p className="text-muted-foreground text-xs sm:text-lg">{t('subtitle')}</p>
            </div>

            {isLoading ? (
                <div className="space-y-6 sm:space-y-10 animate-pulse">
                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-40 bg-muted/20 rounded-2xl border border-border shadow-inner"></div>
                        ))}
                    </div>

                    {/* Charts Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 bg-muted/10 rounded-2xl border border-border p-6 flex flex-col gap-4">
                                <div className="h-4 w-32 bg-primary/10 rounded"></div>
                                <div className="flex-1 bg-primary/5 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* Total Pawns Card (Primary) */}
                        <Card className="bg-card/50 backdrop-blur-sm border-border relative overflow-hidden group hover:border-primary/50 transition-colors shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    {t('totalPawns')}
                                </CardTitle>
                                <div className="bg-primary/10 p-2 sm:p-2.5 rounded-lg border border-primary/20">
                                    <HandCoins className="size-4 sm:size-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-end justify-between">
                                <div>
                                    <div className="text-2xl sm:text-4xl font-bold text-foreground">
                                        {pawnCount}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">{t('totalRecords')}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl sm:text-2xl font-bold text-primary">
                                        {invoices.filter(i => i.type === 'pawn').reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">{t('totalValue')}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {[
                            { status: 'active', label: t('activePawns'), color: 'emerald', icon: TrendingUp },
                            { status: 'overdue', label: t('overduePawns'), color: 'red', icon: AlertTriangle },
                            { status: 'expired', label: t('expiredPawns'), color: 'orange', icon: Clock }
                        ].map((s) => {
                            const filteredInvoices = invoices.filter(i => i.type === 'pawn' && i.status === s.status);
                            const count = filteredInvoices.length;
                            const total = filteredInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

                            const colorClasses = {
                                emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20',
                                red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/20',
                                orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20'
                            }[s.color as 'emerald' | 'red' | 'orange'];

                            return (
                                <Card key={s.status} className={`bg-card/50 backdrop-blur-sm border-border relative overflow-hidden group hover:border-foreground/20 transition-all shadow-sm`}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
                                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            {s.label}
                                        </CardTitle>
                                        <div className={`${colorClasses.split(' ').slice(4).join(' ')} p-2 rounded-lg border border-border/50`}>
                                            <s.icon className={`size-4 ${colorClasses.split(' ').slice(3, 4).join(' ')}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex items-end justify-between">
                                        <div>
                                            <div className="text-2xl sm:text-3xl font-bold text-foreground">
                                                {count}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 font-medium">{t('records')}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg sm:text-xl font-bold ${colorClasses.split(' ').slice(3, 4).join(' ')}`}>
                                                {total.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 font-medium">{t('value')}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Detailed Metrics Grid (6 Charts) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
                        {[
                            { key: 'salesAmount', label: t('monthlySalesVolume'), color: '#10b981', icon: TrendingUp, format: t('amount') },
                            { key: 'salesCount', label: t('monthlySalesTransactions'), color: '#10b981', icon: TrendingUp, format: t('count') },
                            { key: 'pawnAmount', label: t('monthlyPawnVolume'), color: '#fbbf24', icon: HandCoins, format: t('amount') },
                            { key: 'pawnCount', label: t('monthlyPawnTransactions'), color: '#fbbf24', icon: HandCoins, format: t('count') },
                            { key: 'buyAmount', label: t('monthlyBuyingVolume'), color: '#60a5fa', icon: Diamond, format: t('amount') },
                            { key: 'buyCount', label: t('monthlyBuyingTransactions'), color: '#60a5fa', icon: Diamond, format: t('count') }
                        ].map((chart) => (
                            <Card key={chart.key} className="bg-card/50 backdrop-blur-sm border-border overflow-hidden shadow-sm group hover:border-primary/30 transition-colors">
                                <CardHeader className="py-4 border-b border-border/50">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                                            <chart.icon className="size-4" style={{ color: chart.color }} />
                                            {chart.label}
                                        </CardTitle>
                                        <div className="text-xs font-bold text-muted-foreground">
                                            {chart.format}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={monthlyData}
                                                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke="currentColor"
                                                    opacity={0.5}
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="currentColor"
                                                    opacity={0.5}
                                                    fontSize={9}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) => chart.key.includes('Amount') && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                                />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: `${chart.color}08` }} />
                                                <Bar
                                                    dataKey={chart.key}
                                                    fill={chart.color}
                                                    radius={[4, 4, 0, 0]}
                                                    opacity={0.8}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )
            }
        </div >
    );
}

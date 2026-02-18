"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, HandCoins, TrendingUp, Diamond } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart } from 'recharts';
import { Item, Invoice } from '@/types';
import { getItemsAction } from '@/app/actions/itemActions';

import { getInvoicesAction } from '@/app/actions/invoiceActions';

export default function SalesPage() {
    const [dbItems, setDbItems] = useState<Item[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [itemsRes, invoicesRes] = await Promise.all([
                    getItemsAction(),
                    getInvoicesAction()
                ]);

                if (itemsRes.success && itemsRes.data) {
                    setDbItems(itemsRes.data);
                }
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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6Months.push({
            label: monthNames[d.getMonth()],
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
                <h2 className="text-2xl sm:text-4xl font-bold text-amber-50 mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                    <TrendingUp className="size-6 sm:size-8 text-amber-400" />
                    Sales Dashboard
                </h2>
                <p className="text-amber-200/60 text-sm sm:text-lg">Track your revenue and invoices</p>
            </div>

            {isLoading ? (
                <div className="space-y-6 sm:space-y-10 animate-pulse">
                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-40 bg-slate-800/40 rounded-2xl border border-amber-500/5 shadow-inner"></div>
                        ))}
                    </div>

                    {/* Charts Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 bg-slate-800/20 rounded-2xl border border-amber-500/5 p-6 flex flex-col gap-4">
                                <div className="h-4 w-32 bg-amber-500/10 rounded"></div>
                                <div className="flex-1 bg-amber-500/5 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Pawn Invoices Card with Value */}
                        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 backdrop-blur-sm relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-sm font-medium text-amber-200/70">
                                    Total Pawns
                                </CardTitle>
                                <div className="bg-amber-500/20 p-2.5 rounded-lg">
                                    <HandCoins className="size-5 text-amber-400" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex items-end justify-between">
                                <div>
                                    <div className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                                        {pawnCount}
                                    </div>
                                    <p className="text-xs text-amber-200/40 mt-1 uppercase tracking-wider font-bold">Active Records</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-amber-200">
                                        {invoices.filter(i => i.type === 'pawn').reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-amber-200/40 mt-1 uppercase tracking-wider font-bold">Total Value</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inventory Card */}
                        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-sm font-medium text-amber-200/70">
                                    Inventory Stock
                                </CardTitle>
                                <div className="bg-purple-500/20 p-2.5 rounded-lg">
                                    <Package className="size-5 text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-purple-500 bg-clip-text text-transparent">
                                    {dbItems.reduce((sum, item) => sum + (item.stock || 0), 0)}
                                </div>
                                <p className="text-xs text-amber-200/40 mt-1 uppercase tracking-wider font-bold">Total Units</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Metrics Grid (6 Charts) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
                        {[
                            { key: 'salesAmount', label: 'Monthly Sales Volume', color: '#10b981', icon: TrendingUp, format: 'amount' },
                            { key: 'salesCount', label: 'Monthly Sales Transactions', color: '#10b981', icon: TrendingUp, format: 'count' },
                            { key: 'pawnAmount', label: 'Monthly Pawn Volume', color: '#fbbf24', icon: HandCoins, format: 'amount' },
                            { key: 'pawnCount', label: 'Monthly Pawn Transactions', color: '#fbbf24', icon: HandCoins, format: 'count' },
                            { key: 'buyAmount', label: 'Monthly Buying Volume', color: '#60a5fa', icon: Diamond, format: 'amount' },
                            { key: 'buyCount', label: 'Monthly Buying Transactions', color: '#60a5fa', icon: Diamond, format: 'count' }
                        ].map((chart) => (
                            <Card key={chart.key} className="bg-slate-800/30 backdrop-blur-sm border-amber-500/20 overflow-hidden">
                                <CardHeader className="py-4 border-b border-amber-500/10">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-bold text-amber-200/80 flex items-center gap-2">
                                            <chart.icon className="size-4" style={{ color: chart.color }} />
                                            {chart.label}
                                        </CardTitle>
                                        <div className="text-xs font-medium text-amber-200/40 uppercase tracking-widest">
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
                                                <CartesianGrid strokeDasharray="3 3" stroke="#64748b11" vertical={false} />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke="#94a3b8"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#94a3b8"
                                                    fontSize={9}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) => chart.format === 'amount' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
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
            )}
        </div>
    );
}

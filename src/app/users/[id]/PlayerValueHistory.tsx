"use client"

import { trpc } from '@/app/_trpc/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Brush, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Spinner } from '@/components/icons';
import Error from '@/components/Error';
import { useMemo } from 'react';

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export default function PlayerValueHistory({ id }: { id: number }) {
    const res = trpc.getPlayerValueHistory.useQuery(id);

    const { chartData, valueMin, valueMax, padding, latestValue, latestRap } = useMemo(() => {
        if (!res.data?.history?.length) {
            return { chartData: [], valueMin: 0, valueMax: 0, padding: 100, latestValue: 0, latestRap: 0 };
        }

        const mapped = res.data.history
            .map(entry => ({
                date: new Date(entry.createdAt).getTime(),
                value: entry.totalValue,
                rap: entry.rap,
            }))
            .sort((a, b) => a.date - b.date);

        const allVals = mapped.flatMap(d => [d.value, d.rap]);
        const min = Math.min(...allVals);
        const max = Math.max(...allVals);
        const pad = (max - min) * 0.1 || max * 0.1 || 100;
        const last = mapped[mapped.length - 1];

        return { chartData: mapped, valueMin: min, valueMax: max, padding: pad, latestValue: last.value, latestRap: last.rap };
    }, [res.data]);

    const formatDate = (ts: number) => {
        return new Intl.DateTimeFormat(undefined, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
        }).format(new Date(ts));
    };

    return (
        <div className="border border-border rounded-md p-4">
            {res.isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner width="24" height="24" className="fill-primary" />
                </div>
            ) : res.error ? (
                <Error message={res.error.message} />
            ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-muted-foreground text-center">No value history available</p>
                </div>
            ) : (
                <div>
                    <div className="mb-4 flex gap-x-4 text-sm text-muted-foreground">
                        <p>Value: <span className="font-semibold text-foreground">{formatNumber(latestValue)}</span></p>
                        <p>RAP: <span className="font-semibold text-foreground">{formatNumber(latestRap)}</span></p>
                        {chartData.length > 1 && (
                            <>
                                <p>High: <span className="font-semibold text-foreground">{formatNumber(valueMax)}</span></p>
                                <p>Low: <span className="font-semibold text-foreground">{formatNumber(valueMin)}</span></p>
                            </>
                        )}
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ left: 24, right: 24, top: 24, bottom: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                scale="time"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={formatDate}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                domain={[valueMin - padding, valueMax + padding]}
                                tickFormatter={(value) => formatNumber(value)}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                width={80}
                            />
                            <Tooltip
                                labelFormatter={(label) => formatDate(label as number)}
                                formatter={(value: number, name: string) => [formatNumber(value), name]}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--popover))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    color: "hsl(var(--popover-foreground))",
                                }}
                            />
                            <Legend
                                formatter={(value: string) => {
                                    const labels: Record<string, string> = { value: "Value", rap: "RAP" };
                                    return <span className="text-foreground">{labels[value] || value}</span>;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(var(--chart-1))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="rap"
                                stroke="hsl(var(--chart-2))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                            <Brush
                                dataKey="date"
                                height={20}
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary)/0.1)"
                                travellerWidth={16}
                                tickFormatter={formatDate}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

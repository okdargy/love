"use client"

import { Bar, Brush, CartesianGrid, ComposedChart, Line, LineChart, XAxis, YAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    average: {
        label: "RAP",
        color: "hsl(var(--chart-1))",
    },
    volume: {
        label: "Volume",
        color: "hsl(var(--chart-2))",
    },
    bestPrice: {
        label: "Best Price",
        color: "hsl(var(--chart-3))",
    },
    listings: {
        label: "Listings",
        color: "hsl(var(--chart-4))",
    },
} satisfies ChartConfig

type GraphData = {
    res?: {
      success: boolean;
      data: {
        price: { x: number; y: number }[];
        volume: { x: number; y: number }[];
      };
    };
    listings: {
      created_at: number;
      bestPrice: number;
      sellers: number;
    }[];
  };

export default function Graph({ data }: { data: GraphData }) {
    let chartData = new Map()

    // Convert timestamps to dates and merge data points for the same date
    if(data.res && data.res.success) {
        data.res.data.price.forEach((point, i) => {
            const date = new Date(point.x)
            if (!chartData.has(date)) {
                chartData.set(date, {
                    date,
                    average: point.y,
                    volume: data.res ? data.res.data.volume[i].y : 0
                })
            }
        })
    }

    if(data.listings.length > 0) {
        data.listings.forEach(listing => {
            const date = new Date(listing.created_at)
            const existing = chartData.get(date) || { date }
    
            if (listing.sellers !== -1) {
                chartData.set(date, {
                    ...existing,
                    listings: listing.sellers,
                    bestPrice: listing.bestPrice
                })
            } else {
                chartData.set(date, {
                    ...existing,
                    bestPrice: listing.bestPrice
                })
            }
        })
    }

    // Convert to array and sort by date
    const sortedChartData = Array.from(chartData.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())


    return (
        <ChartContainer config={chartConfig}>
            <ComposedChart
                data={sortedChartData}
                margin={{
                    top: 12,
                    left: 12,
                    right: 12,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(date) => {
                        return new Intl.DateTimeFormat("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric"
                        }).format(new Date(date))
                    }}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                    dataKey="volume"
                    barSize={8}
                    stackId="a"
                    fill={chartConfig.volume.color}
                    opacity={0.5}
                />
                <Line
                    dataKey="average"
                    type="linear"
                    dot={false}
                    stroke={chartConfig.average.color}
                />
                <Line
                    dataKey="bestPrice"
                    type="linear"
                    dot={false}
                    stroke={chartConfig.bestPrice.color}
                />
                <Bar
                    dataKey="listings"
                    type="linear"
                    stackId="a"
                    fill={chartConfig.listings.color}
                    opacity={0.5}
                />
                <Brush
                    dataKey="date"
                    height={20}
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/0.1)"
                    travellerWidth={8}
                    startIndex={0}
                    tickFormatter={(date) => {
                        return new Intl.DateTimeFormat("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric"
                        }).format(new Date(date))
                    }}
                />
            </ComposedChart>
        </ChartContainer>
    )

}
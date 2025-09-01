"use client"

import { Bar, Brush, CartesianGrid, ComposedChart, Line, LineChart, XAxis, YAxis } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        price: { x: string; y: number }[];
        volume: { x: string; y: number }[];
      };
    };
    listings: {
      created_at: number;
      bestPrice: number;
      sellers: number;
    }[];
  };

export default function Graph({ data }: { data: GraphData }) {
    // Helper function to get date key
    const getDateKey = (date: Date) => {
        return date.toISOString()
    }
    
    // Prepare data for RAP & Volume chart
    const preparePriceVolumeData = () => {
        const chartData = new Map()
        
        if (data.res && data.res.success) {
            data.res.data.price.forEach((point, i) => {
                // point.x is in YYYY-MM-DD order
                const date = new Date(point.x + "T00:00:00")
                const dateKey = getDateKey(date)

                if (!chartData.has(dateKey)) {
                    chartData.set(dateKey, {
                        date,
                        average: point.y,
                        volume: data.res ? data.res.data.volume[i].y : 0
                    })
                }
            })
        }
        
        return Array.from(chartData.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
    }
    
    // Prepare data for Listings & Best Price chart
    const prepareListingsBestPriceData = () => {
        const chartData = new Map()
        
        if (data.listings.length > 0) {
            data.listings.forEach(listing => {
                const date = new Date(listing.created_at)
                const dateKey = getDateKey(date)

                const existing = chartData.get(dateKey) || { 
                    date
                }

                if (listing.sellers !== -1) {
                    chartData.set(dateKey, {
                        ...existing,
                        listings: listing.sellers,
                        bestPrice: listing.bestPrice
                    })
                } else {
                    chartData.set(dateKey, {
                        ...existing,
                        bestPrice: listing.bestPrice
                    })
                }
            })
        }
        
        return Array.from(chartData.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
    }
    
    // Generate the datasets
    const priceVolumeData = preparePriceVolumeData()
    const priceVolumeMin = Math.min(...priceVolumeData.map(d => d.average))
    const priceVolumeMax = Math.max(...priceVolumeData.map(d => d.average))

    const listingsBestPriceData = prepareListingsBestPriceData()
    const listingsBestPriceMin = Math.min(...listingsBestPriceData.map(d => d.bestPrice))
    const listingsBestPriceMax = Math.max(...listingsBestPriceData.map(d => d.bestPrice))

    const formatDate = (date: Date | string) => {

        const result = new Intl.DateTimeFormat("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric"
        }).format(new Date(date))
        return result;
    }

    return (
        <div className="w-full">
            <Tabs defaultValue="listingsBestPrice" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="listingsBestPrice">Best Price & Listings</TabsTrigger>
                    <TabsTrigger value="priceVolume">RAP & Volume</TabsTrigger>
                </TabsList>

                <TabsContent value="listingsBestPrice" className="w-full">
                    <ChartContainer config={chartConfig}>
                        <ComposedChart
                            data={listingsBestPriceData}
                            margin={{
                                left: 24,
                                right: 24,
                                top: 24,
                                bottom: 24,
                            }}
                            barSize={50}
                            barCategoryGap={1}
                            barGap={0}
                        >
                            <CartesianGrid vertical={true} />
                            <YAxis
                                orientation="left"
                                tickLine={false}
                                axisLine={false}
                                domain={[listingsBestPriceMin, listingsBestPriceMax]}
                                allowDataOverflow={false}
                                tickFormatter={(value) => `${value}`}
                                yAxisId="left"
                            />
                            <YAxis
                                orientation="right"
                                tickLine={false}
                                axisLine={false}
                                domain={[0, dataMax => dataMax * 2]}
                                allowDataOverflow={false}
                                tickFormatter={(value) => `${value}`}
                                yAxisId="right"
                            />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                scale="time"
                                tickMargin={8}
                                tickFormatter={formatDate}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <Bar
                                dataKey="listings"
                                fill={chartConfig.listings.color}
                                opacity={0.5}
                                yAxisId="right"
                            />
                            <Line
                                dataKey="bestPrice"
                                type="linear"
                                dot={true}
                                connectNulls={true}
                                stroke={chartConfig.bestPrice.color}
                                strokeWidth={2}
                                yAxisId="left"
                            />
                            <Brush
                                dataKey="date"
                                height={20}
                                alwaysShowText={false}
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary)/0.1)"
                                travellerWidth={8}
                                startIndex={0}
                                tickFormatter={formatDate}
                            />
                        </ComposedChart>
                    </ChartContainer>
                </TabsContent>

                <TabsContent value="priceVolume" className="w-full">
                    <ChartContainer config={chartConfig}>
                        <ComposedChart
                            data={priceVolumeData}
                            margin={{
                                left: 24,
                                right: 24,
                                top: 24,
                                bottom: 24,
                            }}
                            barSize={50}
                            barCategoryGap={1}
                            barGap={0}
                            
                        >
                            <CartesianGrid vertical={true} />
                            <YAxis
                                orientation="left"
                                tickLine={false}
                                axisLine={false}
                                domain={[priceVolumeMin, priceVolumeMax]}
                                allowDataOverflow={false}
                                tickFormatter={(value) => `${value}`}
                                yAxisId="left"
                            />
                            <YAxis
                                orientation="right"
                                tickLine={false}
                                axisLine={false}
                                domain={[0, dataMax => dataMax * 2]}
                                allowDataOverflow={false}
                                tickFormatter={(value) => `${value}`}
                                yAxisId="right"
                            />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                scale="time"
                                tickMargin={8}
                                tickFormatter={formatDate}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <Bar
                                dataKey="volume"
                                fill={chartConfig.volume.color}
                                opacity={0.5}
                                yAxisId="right"
                            />
                            <Line
                                dataKey="average"
                                type="linear"
                                dot={true}
                                connectNulls={true}
                                stroke={chartConfig.average.color}
                                strokeWidth={2}
                                yAxisId="left"
                            />
                            <Brush
                                dataKey="date"
                                height={20}
                                alwaysShowText={false}
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary)/0.1)"
                                travellerWidth={8}
                                startIndex={0}
                                tickFormatter={formatDate}
                            />
                        </ComposedChart>
                    </ChartContainer>
                </TabsContent>
            </Tabs>
        </div>
    )
}
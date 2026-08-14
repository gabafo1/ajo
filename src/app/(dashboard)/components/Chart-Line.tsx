"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
    monthly: {
        label: "Monthly Active Subscription",
        color: "hsl(var(--chart-1))"
    },
    yearly: {
        label: "Yearly Active Subscription",
        color: "hsl(var(--chart-2))"
    },
} satisfies ChartConfig;

type DataItem = {
    month: string | Date,
    monthLabel: string,
    yearlySubscriptions: number,
    monthlySubscriptions: number,
};

export function ChartLine({ data }: { data: DataItem[] }) {
    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>Subscription Trends</CardTitle>
                    <CardDescription>Yearly vs Monthly Subscriptions</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                <LineChart data={data} margin={{ top: 5, right: 10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
                    <Line dataKey="monthlySubscriptions" type="monotone" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                    <Line dataKey="yearlySubscriptions" type="monotone" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

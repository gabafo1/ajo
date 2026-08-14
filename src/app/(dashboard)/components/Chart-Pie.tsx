"use client";

import { Pie, PieChart, Label } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

type SubscriptionData = {
    plan: string;
    total: number | string;
};

interface ChartPieProps {
    data: SubscriptionData[];
}

export function ChartPie({ data }: ChartPieProps) {
    // ✅ Process data first, log before return
    const processData = data.map((item, i) => {
        console.log(item);
        const index = i + 1;
        return {
            ...item,
            total: parseInt(item.total as string, 10),
            fill: `hsl(var(--chart-${index}))`,
        };
    });

    // ✅ Calculate total subscriptions safely
    const totalSubs: number = processData.reduce(
        (acc, item) => acc + item.total,
        0
    );

    // ✅ Chart config with stricter typing
    const chartConfig: ChartConfig & Record<string, { label: string; color?: string }> = {
        total: {
            label: "Subscriptions",
        },
    };

    data.forEach((item, i) => {
        const index = i + 1;
        chartConfig[item.plan] = {
            label: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
            color: `hsl(var(--chart-${index}))`,
        };
    });

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Subscriptions Breakdown</CardTitle>
                <CardDescription className="text-xs md:text-normal">
                    Showing total subscriptions for all time
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart width={730} height={250}>
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                            cursor={false}
                        />
                        <Pie
                            data={processData}
                            dataKey="total"
                            nameKey="plan"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (
                                        viewBox &&
                                        "cx" in viewBox &&
                                        "cy" in viewBox
                                    ) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalSubs.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy ?? 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    Subscriptions
                                                </tspan>
                                            </text>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

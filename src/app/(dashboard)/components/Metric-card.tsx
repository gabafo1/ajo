import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ReactNode } from "react";

export type Metric = {
    title: string;
    value: string | number;
    change?: string;
    icon?: ReactNode;
};

export function MetricCards({ metrics }: { metrics: Metric[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
                <Card key={index} className="border border-black">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                        {metric.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metric.value}</div>
                        {metric.change && (
                            <p className="text-xs text-muted-foreground">{metric.change}</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

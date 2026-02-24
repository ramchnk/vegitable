
"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"


import { useLanguage } from "@/context/language-context"

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

export function RecentSalesChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    // This runs only on the client, after hydration
    const generateData = () => [
      { date: t('days.mon'), sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: t('days.tue'), sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: t('days.wed'), sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: t('days.thu'), sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: t('days.fri'), sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: t('days.sat'), sales: Math.floor(Math.random() * 2000) + 1000 },
      { date: t('days.sun'), sales: Math.floor(Math.random() * 2000) + 1000 },
    ];
    setData(generateData());
    setLoading(false);
  }, [t]);

  if (loading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  const dynamicChartConfig = {
    ...chartConfig,
    sales: {
      ...chartConfig.sales,
      label: t('dashboard.sales')
    }
  };

  return (
    <ChartContainer config={dynamicChartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

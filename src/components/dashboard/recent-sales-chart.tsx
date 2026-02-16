"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

const data = [
  { date: "Mon", sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: "Tue", sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: "Wed", sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: "Thu", sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: "Fri", sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: "Sat", sales: Math.floor(Math.random() * 2000) + 1000 },
  { date: "Sun", sales: Math.floor(Math.random() * 2000) + 1000 },
]

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

export function RecentSalesChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `₹${value / 1000}k`} />
          <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

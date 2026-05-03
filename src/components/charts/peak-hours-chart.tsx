"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface PeakHoursChartProps {
  data: Array<{ hour: string; hourNum: number; orders: number }>;
  height?: number;
}

function getHeatColor(count: number, max: number): string {
  if (max === 0) return "#e5e7eb";
  const pct = count / max;
  if (pct >= 0.8) return "#ef4444";
  if (pct >= 0.6) return "#f97316";
  if (pct >= 0.4) return "#eab308";
  if (pct >= 0.2) return "#22c55e";
  return "#86efac";
}

export function PeakHoursChart({ data, height = 200 }: PeakHoursChartProps) {
  if (!data || data.length === 0) return null;

  const maxOrders = Math.max(...data.map((d) => d.orders), 1);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value} commandes`, "Total"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getHeatColor(entry.orders, maxOrders)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

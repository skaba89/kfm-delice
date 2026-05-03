"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TopItemsChartProps {
  data: Array<{ name: string; quantity: number; revenue: number }>;
  height?: number;
  metric?: "quantity" | "revenue";
}

export function TopItemsChart({ data, height = 250, metric = "quantity" }: TopItemsChartProps) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => (metric === "quantity" ? d.quantity : d.revenue)), 1);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              metric === "revenue" ? `${(v / 1000).toFixed(0)}k` : `${v}`
            }
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              metric === "revenue" ? formatCurrency(value) : `${value} ventes`,
              metric === "revenue" ? "Revenu" : "Quantite",
            ]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey={metric}
            fill="#F97316"
            radius={[0, 4, 4, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

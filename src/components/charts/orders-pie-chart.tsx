"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface OrdersPieChartProps {
  data: Record<string, number>;
  colors?: Record<string, string>;
  height?: number;
}

const DEFAULT_COLORS: Record<string, string> = {
  DINE_IN: "#F97316",
  TAKEAWAY: "#22c55e",
  DELIVERY: "#8b5cf6",
  DRIVE_THRU: "#06b6d4",
};

const DEFAULT_LABELS: Record<string, string> = {
  DINE_IN: "Sur place",
  TAKEAWAY: "A emporter",
  DELIVERY: "Livraison",
  DRIVE_THRU: "Drive",
};

export function OrdersPieChart({ data, colors = DEFAULT_COLORS, height = 250 }: OrdersPieChartProps) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  const chartData = entries.map(([key, value]) => ({
    name: DEFAULT_LABELS[key] || key,
    value,
    color: colors[key] || "#94a3b8",
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} commandes`, "Total"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string, entry: any) => (
              <span style={{ color: entry?.color, fontSize: "12px", fontWeight: 500 }}>
                {value} ({Math.round(((chartData.find((d) => d.name === value)?.value || 0) / total) * 100)}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

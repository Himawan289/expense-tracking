"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatIDR } from "@/lib/format";
import type { CategorySpend } from "@/lib/types";

export function DonutChart({
  data,
  label,
  empty,
}: {
  data: CategorySpend[];
  label: string;
  empty: string;
}) {
  const total = data.reduce((s, d) => s + d.total, 0);

  if (total === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={3}
            cornerRadius={8}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.category_id} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatIDR(Number(v))}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px #0002" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold tabular-nums sm:text-xl">{formatIDR(total)}</p>
        </div>
      </div>
    </div>
  );
}

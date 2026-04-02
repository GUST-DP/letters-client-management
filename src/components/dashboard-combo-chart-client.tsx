"use client";

import { useEffect, useState } from "react";
import { DashboardComboChart } from "@/components/dashboard-charts";

interface Props {
  data: { month: string; amount: number }[];
  year: number;
}

export function DashboardComboChartClient({ data, year }: Props) {
  const [chartData, setChartData] = useState(data.map(d => ({ ...d, goal: 0 })));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`monthlyGoals_${year}`);
      if (raw) {
        const goals: Record<string, number> = JSON.parse(raw);
        setChartData(data.map((d, idx) => {
          const monthKey = String(idx + 1).padStart(2, "0");
          return { ...d, goal: goals[monthKey] || 0 };
        }));
      }
    } catch {}
  }, [data, year]);

  return <DashboardComboChart data={chartData} />;
}

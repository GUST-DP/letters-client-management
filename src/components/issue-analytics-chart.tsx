"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BarChart2, Users } from "lucide-react";

// ── 색상 팔레트 ──────────────────────────────────────────────────────────────
const CLIENT_ISSUE_COLORS = [
  "#ff5c39", "#f97316", "#eab308", "#a78bfa", "#06b6d4", "#64748b", "#ec4899", "#10b981",
];
const SERVICE_ISSUE_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#64748b", "#f43f5e", "#22c55e",
];
const CLIENT_BAR_COLORS = [
  "#ff5c39", "#f97316", "#eab308", "#10b981", "#3b82f6", "#a78bfa", "#ec4899", "#64748b",
];

interface ChartItem { name: string; value: number; }
type Period = "monthly" | "annual";

// ── 기간 토글 버튼 ────────────────────────────────────────────────────────────
function PeriodToggle({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5 flex-shrink-0">
      {(["monthly", "annual"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={[
            "text-[10px] font-black px-2 py-0.5 rounded-md transition-all",
            period === p
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          ].join(" ")}
        >
          {p === "monthly" ? "당월" : "연누적"}
        </button>
      ))}
    </div>
  );
}

// ── 가로형 도넛 카드 ──────────────────────────────────────────────────────────
function HorizontalDonutCard({
  title,
  icon,
  iconColor,
  annualData,
  monthlyData,
  colors,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  annualData: ChartItem[];
  monthlyData: ChartItem[];
  colors: string[];
}) {
  const [period, setPeriod] = useState<Period>("monthly");
  const data = period === "monthly" ? monthlyData : annualData;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="px-3 pt-1.5 pb-0">
        <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1.5">
          <span style={{ color: iconColor }}>{icon}</span>
          {title}
          <div className="ml-auto flex items-center gap-1.5">
            {total > 0 && (
              <span className="text-[11px] font-bold text-slate-400">총 {total}건</span>
            )}
            <PeriodToggle period={period} onChange={setPeriod} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {total === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-slate-300 text-xs font-bold">
            {period === "monthly" ? "당월 이슈 없음" : "등록된 이슈 없음"}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* 왼쪽: 범례 */}
            <div className="flex-1 min-w-0 space-y-2">
              {data.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: colors[i % colors.length] }}
                  />
                  <span className="text-[11px] font-bold text-slate-600 truncate" title={d.name}>
                    {d.name}
                  </span>
                  <span className="text-[11px] font-black text-slate-800 flex-shrink-0">
                    {d.value}건
                  </span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    ({total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              ))}
            </div>

            {/* 오른쪽: 도넛 차트 */}
            <div className="flex-shrink-0" style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="35%"
                    outerRadius="82%"
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, _: any, props: any) => [
                      `${value}건`,
                      props.payload?.name ?? "",
                    ]}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 고객사별 이슈 건수 바차트 카드 ───────────────────────────────────────────
function ClientIssueRankCard({
  annualData,
  monthlyData,
}: {
  annualData: ChartItem[];
  monthlyData: ChartItem[];
}) {
  const [period, setPeriod] = useState<Period>("monthly");
  const data = period === "monthly" ? monthlyData : annualData;
  const maxVal = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="px-3 pt-1.5 pb-0">
        <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1.5">
          <Users className="h-4 w-4 text-slate-500" />
          고객사별 이슈 건수
          <div className="ml-auto flex items-center gap-1.5">
            {data.length > 0 && (
              <span className="text-[11px] font-bold text-slate-400">전체 합산</span>
            )}
            <PeriodToggle period={period} onChange={setPeriod} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {data.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-slate-300 text-xs font-bold">
            {period === "monthly" ? "당월 이슈 없음" : "데이터 없음"}
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={{
                    background: i === 0 ? "#ff5c39" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : "#e2e8f0",
                    color: i < 3 ? "white" : "#64748b",
                  }}
                >
                  {i + 1}
                </div>
                <span className="w-[78px] text-[11px] font-bold text-slate-700 truncate flex-shrink-0" title={d.name}>
                  {d.name}
                </span>
                <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(d.value / maxVal) * 100}%`,
                      background: CLIENT_BAR_COLORS[i % CLIENT_BAR_COLORS.length],
                    }}
                  />
                </div>
                <span className="text-[11px] font-black text-slate-800 flex-shrink-0">
                  {d.value}건
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 메인 내보내기 ─────────────────────────────────────────────────────────────
export interface IssueAnalyticsProps {
  clientIssueByType: ChartItem[];
  clientIssueByTypeMonthly: ChartItem[];
  serviceIssueByType: ChartItem[];
  serviceIssueByTypeMonthly: ChartItem[];
  issueByClient: ChartItem[];
  issueByClientMonthly: ChartItem[];
}

export function IssueAnalyticsSection({
  clientIssueByType,
  clientIssueByTypeMonthly,
  serviceIssueByType,
  serviceIssueByTypeMonthly,
  issueByClient,
  issueByClientMonthly,
}: IssueAnalyticsProps) {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
      {/* ① 고객사 이슈 유형별 */}
      <HorizontalDonutCard
        title="고객사 이슈 유형별"
        icon={<AlertCircle className="h-4 w-4" />}
        iconColor="#ff5c39"
        annualData={clientIssueByType}
        monthlyData={clientIssueByTypeMonthly}
        colors={CLIENT_ISSUE_COLORS}
      />

      {/* ② 고객사별 이슈 건수 */}
      <ClientIssueRankCard
        annualData={issueByClient}
        monthlyData={issueByClientMonthly}
      />

      {/* ③ 서비스 이슈 유형별 */}
      <HorizontalDonutCard
        title="서비스 이슈 유형별"
        icon={<BarChart2 className="h-4 w-4" />}
        iconColor="#3b82f6"
        annualData={serviceIssueByType}
        monthlyData={serviceIssueByTypeMonthly}
        colors={SERVICE_ISSUE_COLORS}
      />
    </div>
  );
}

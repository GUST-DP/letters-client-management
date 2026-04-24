"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, LabelList, CartesianGrid,
} from "recharts";

// ── 색상 팔레트 ──────────────────────────────────────────────────────────────
const CLIENT_ISSUE_COLORS = [
  "#ff5c39", "#f97316", "#eab308", "#a78bfa", "#06b6d4", "#64748b", "#ec4899", "#10b981",
];
const SERVICE_ISSUE_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#64748b", "#f43f5e", "#22c55e",
];
const CLIENT_BAR_COLORS = [
  "#ff5c39", "#f97316", "#eab308", "#10b981", "#3b82f6", "#a78bfa", "#ec4899", "#06b6d4",
];

interface ChartItem { name: string; value: number; }

// ── 도넛 차트 ────────────────────────────────────────────────────────────────
function IssueDonutChart({
  data,
  colors,
  emptyLabel,
}: {
  data: ChartItem[];
  colors: string[];
  emptyLabel: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0)
    return (
      <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-bold">
        {emptyLabel}
      </div>
    );

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* 도넛 */}
      <div className="w-full" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="48%"
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
              formatter={(v: any) => [`${v}건`, ""]}
              contentStyle={{
                borderRadius: "10px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                fontSize: 11,
                fontWeight: "bold",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="space-y-1.5 px-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: colors[i % colors.length] }}
              />
              <span className="text-[11px] font-bold text-slate-600 truncate">{d.name}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[11px] font-black text-slate-800">{d.value}건</span>
              <span className="text-[10px] text-slate-400 w-7 text-right">
                ({total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 고객사별 이슈 가로 바차트 ────────────────────────────────────────────────
function ClientIssueBarChart({ data }: { data: ChartItem[] }) {
  if (data.length === 0)
    return (
      <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-bold">
        데이터 없음
      </div>
    );

  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div className="w-full space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* 순위 뱃지 */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
            style={{
              background: i === 0 ? "#ff5c39" : i === 1 ? "#f97316" : i === 2 ? "#eab308" : "#e2e8f0",
              color: i < 3 ? "white" : "#64748b",
            }}
          >
            {i + 1}
          </div>
          {/* 고객사명 */}
          <div className="w-[80px] flex-shrink-0">
            <span className="text-[11px] font-bold text-slate-700 truncate block" title={d.name}>
              {d.name}
            </span>
          </div>
          {/* 바 */}
          <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(d.value / maxVal) * 100}%`,
                background: CLIENT_BAR_COLORS[i % CLIENT_BAR_COLORS.length],
              }}
            />
          </div>
          {/* 건수 */}
          <span className="text-[11px] font-black text-slate-800 w-8 text-right flex-shrink-0">
            {d.value}건
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 메인 내보내기 ─────────────────────────────────────────────────────────────
export interface IssueAnalyticsProps {
  clientIssueByType: ChartItem[];   // 고객사 이슈 유형별
  serviceIssueByType: ChartItem[];  // 서비스 이슈 유형별
  issueByClient: ChartItem[];       // 고객사별 이슈 건수 (전체)
}

export function IssueAnalyticsSection({
  clientIssueByType,
  serviceIssueByType,
  issueByClient,
}: IssueAnalyticsProps) {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">

      {/* ① 고객사 이슈 유형별 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
          <div className="w-2 h-5 bg-[#ff5c39] rounded-full flex-shrink-0" />
          <span className="text-[12px] font-black text-slate-800 tracking-tight">고객사 이슈 유형별</span>
          <span className="ml-auto text-[10px] font-bold text-slate-400">
            총 {clientIssueByType.reduce((s, d) => s + d.value, 0)}건
          </span>
        </div>
        <IssueDonutChart
          data={clientIssueByType}
          colors={CLIENT_ISSUE_COLORS}
          emptyLabel="등록된 이슈 없음"
        />
      </div>

      {/* ② 서비스 이슈 유형별 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
          <div className="w-2 h-5 bg-[#3b82f6] rounded-full flex-shrink-0" />
          <span className="text-[12px] font-black text-slate-800 tracking-tight">서비스 이슈 유형별</span>
          <span className="ml-auto text-[10px] font-bold text-slate-400">
            총 {serviceIssueByType.reduce((s, d) => s + d.value, 0)}건
          </span>
        </div>
        <IssueDonutChart
          data={serviceIssueByType}
          colors={SERVICE_ISSUE_COLORS}
          emptyLabel="등록된 이슈 없음"
        />
      </div>

      {/* ③ 고객사별 이슈 건수 TOP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
          <div className="w-2 h-5 bg-slate-700 rounded-full flex-shrink-0" />
          <span className="text-[12px] font-black text-slate-800 tracking-tight">고객사별 이슈 건수</span>
          <span className="ml-auto text-[10px] font-bold text-slate-400">전체 합산</span>
        </div>
        <ClientIssueBarChart data={issueByClient} />
      </div>

    </div>
  );
}

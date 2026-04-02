"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
  ComposedChart,
  Line,
  Legend,
  Pie,
  PieChart,
} from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(v);

const fmtY = (v: number) => {
  if (v === 0) return "0";
  if (v >= 100000000) return `${(v / 100000000).toFixed(0)}억`;
  if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
  return String(v);
};

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(v);

// ─── 복합 차트 (막대=매출, 실선=목표) ─────────────────────────────────────────
export function DashboardComboChart({ data }: { data: { month: string; amount: number; goal?: number }[] }) {
  if (!data || data.length === 0)
    return <div className="h-[360px] w-full flex items-center justify-center text-gray-400 text-xs">매출 데이터가 없습니다.</div>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: -10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tickMargin={8} />
        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtY} width={52} />
        <Tooltip
          formatter={(v: any) => [fmt(Number(v)), ""]}
          labelFormatter={(label: any) => String(label)}
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: 11 }}
        />
        <Legend
          formatter={(val) => val === "amount" ? "월 매출" : "월 목표"}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="amount" fill="#8aa8e2" radius={[4, 4, 0, 0]} maxBarSize={36} name="amount">
          <LabelList
            dataKey="amount"
            position="top"
            formatter={(v: any) => (Number(v) > 0 ? fmtCompact(Number(v)) : "")}
            style={{ fontSize: 9, fill: "#475569", fontWeight: 700 }}
          />
        </Bar>
        {/* 실선 목표 (data에 goal이 있을 때만) */}
        {data.some(d => d.goal && d.goal > 0) && (
          <Line
            type="monotone"
            dataKey="goal"
            stroke="#eb5d49"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#eb5d49", strokeWidth: 1, stroke: "#fff" }}
            activeDot={{ r: 5 }}
            name="goal"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── 도넛차트 색상 팔레트 세트 ────────────────────────────────────────────────
const DONUT_PALETTE: Record<string, string[]> = {
  inflow:  ["#ff7550", "#58bf6f", "#8aa8e2", "#f59e0b", "#a78bfa", "#06b6d4"],  // 주황, 초록, 연파랑, 노랑, 연보라, 청록
  annual:  ["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#d946ef", "#14b8a6"],  // 빨강, 기본초록, 파랑, 진노랑, 자주, 틸
  monthly: ["#f43f5e", "#10b981", "#6366f1", "#f97316", "#8b5cf6", "#0ea5e9"],  // 로즈, 에메랄드, 인디고, 오렌지, 보라, 하늘
  default: ["#ff7550", "#58bf6f", "#8aa8e2", "#eb5d49", "#368261", "#4b5db2", "#895646", "#4c5468"],
};

interface DonutItem { name: string; value: number; }

export function DashboardDonutChart({ data, unit = "", colorSet = "default" }: { data: DonutItem[]; unit?: string; colorSet?: string }) {
  const COLORS = DONUT_PALETTE[colorSet] ?? DONUT_PALETTE.default;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const restTotal = rest.reduce((s, d) => s + d.value, 0);
  const chartData = restTotal > 0 ? [...top5, { name: "기타", value: restTotal }] : top5;
  const total = chartData.reduce((s, d) => s + d.value, 0);

  // 1위 항목에만 선과 텍스트를 그리는 커스텀 라벨
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, fill, percent, index, name } = props;
    if (index !== 0) return null; // 1위 항목만

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    
    // 지시선 계산
    const sx = cx + (outerRadius) * cos;
    const sy = cy + (outerRadius) * sin;
    const mx = cx + (outerRadius + 12) * cos;
    const my = cy + (outerRadius + 12) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 12;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    
    const shortName = name.length > 8 ? name.substring(0, 7) + "…" : name;
    const labelText = `${shortName} ${(percent * 100).toFixed(0)}%`;

    return (
      <g>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
        <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} fill={fill} fontSize="12px" fontWeight="900" textAnchor={textAnchor} dominantBaseline="central">
          {labelText}
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {/* 도넛 그래프 (빈 공간을 채우기 위해 flex-1 적용 및 margin 대폭 확대) */}
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 25, right: 45, bottom: 25, left: 45 }}>
            <Pie 
              data={chartData} 
              cx="50%" cy="50%" 
              innerRadius="55%" 
              outerRadius="95%" 
              paddingAngle={2} 
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false} // 커스텀 라벨에서 직접 그리므로 기본선 비활성화
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: any) => [unit ? fmtCompact(v) + unit : String(v), ""]}
              contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11, fontWeight: "bold" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 (도넛 아래 노출) */}
      <div className="w-full space-y-2.5 px-2 pb-1">
        {chartData.map((d, i) => (
          <div key={`${i}-${d.name}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-xs font-bold text-slate-700 truncate">{d.name}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
              <span className="text-xs font-black text-slate-800">{unit ? fmtCompact(d.value) : d.value}</span>
              {total > 0 && <span className="text-[11px] font-medium text-slate-500 w-8 text-right">({((d.value / total) * 100).toFixed(0)}%)</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 인입경로 가로 바차트 ──────────────────────────────────────────────────────
const BAR_COLORS = ["#ff7550", "#58bf6f", "#8aa8e2", "#eb5d49", "#368261", "#4b5db2", "#895646", "#4c5468"];

export function DashboardBarChart({ data }: { data: any[] }) {
  if (!data || data.length === 0)
    return <div className="h-[160px] flex items-center justify-center text-slate-400 text-xs">인입경로 데이터가 없습니다.</div>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(100, data.length * 22)}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 30, left: -10, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={90} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
          <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// DashboardAreaChart 호환성 유지
export function DashboardAreaChart({ data }: { data: any[] }) {
  return <DashboardComboChart data={data} />;
}

// DashboardCharts 호환성 유지
export function DashboardCharts({ data }: { data: any[] }) {
  return <DashboardComboChart data={data} />;
}

export function DashboardPieChart({ data }: { data: any[] }) {
  const COLORS = ["#ff7550", "#58bf6f", "#8aa8e2", "#eb5d49", "#368261"];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

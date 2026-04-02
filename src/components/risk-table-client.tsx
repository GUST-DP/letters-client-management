"use client";

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";

interface RiskRow {
  clientName: string;
  avgLeadDays: string;
  month: string;
  amount: number;
}

const fmtKRW = (n: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);

export function RiskTableClient({
  rows,
}: {
  rows: RiskRow[];
  totalRisk: number;
}) {
  const monthOptions = useMemo(() => {
    const months = [...new Set(rows.map(r => r.month))].sort().reverse();
    return months;
  }, [rows]);

  const currentMonthStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const defaultMonth = monthOptions.includes(currentMonthStr) ? currentMonthStr : (monthOptions[0] ?? "all");

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  const filtered = selectedMonth === "all" ? rows : rows.filter(r => r.month === selectedMonth);
  const filteredTotal = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      {/* 월 필터 - 드롭다운 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">발생월</span>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="h-7 px-2 text-[11px] font-bold border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
        >
          <option value="all">전체</option>
          {monthOptions.map(m => (
            <option key={m} value={m}>
              {m.replace(/^(\d{4})-(\d{2})$/, "$1년 $2월")}
              {m === currentMonthStr ? " (금월)" : ""}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-slate-400 font-medium">{filtered.length}건</span>
      </div>

      {filtered.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-[11px] text-slate-400 flex-col gap-1">
          <AlertCircle className="h-5 w-5 text-slate-200" />
          해당 월의 미수금 없음
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col" style={{ height: '310px' }}>
          <div className="overflow-y-auto custom-scrollbar flex-1 relative">
            <table className="w-full text-xs border-collapse table-fixed">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-slate-800 border-b border-slate-700">
                  <th className="text-left py-2 px-4 font-bold text-slate-200 border-r border-slate-700/50 text-[12px] whitespace-nowrap">고객사명</th>
                  <th className="text-center py-2 px-2 font-bold text-slate-200 border-r border-slate-700/50 w-24 text-[12px] whitespace-nowrap">평균 리드타임</th>
                  <th className="text-center py-2 px-2 font-bold text-slate-200 border-r border-slate-700/50 w-16 text-[12px] whitespace-nowrap">발생월</th>
                  <th className="text-right py-2 px-4 font-bold text-slate-200 w-32 text-[12px] whitespace-nowrap">미수금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 transition-all hover:bg-slate-50/50 group"
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap truncate text-[12px]">{r.clientName}</td>
                    <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-100 w-24 font-medium whitespace-nowrap text-[12px]">{r.avgLeadDays}일</td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-100 w-16">
                      <span className="bg-slate-100 text-slate-600 rounded-md px-1.5 py-0.5 text-[12px] font-bold border border-slate-200 whitespace-nowrap">
                        {r.month.replace(/^\d{4}-/, "")}월
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-800 w-32 text-[13px] whitespace-nowrap">{fmtKRW(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 합계 행 (고정) */}
          <div className="border-t-2 border-slate-200 bg-slate-50 shadow-inner">
            <table className="w-full text-xs border-collapse table-fixed">
              <tfoot>
                <tr>
                  <td className="py-2.5 px-4 font-black text-slate-600 border-r border-slate-200 uppercase tracking-tighter text-[12px] h-10">
                    RISK TOTAL ({filtered.length}건)
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-slate-800 text-[15px] w-32">
                    {fmtKRW(filteredTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

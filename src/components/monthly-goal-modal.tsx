"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthlyGoals { [month: string]: number; }

function formatWithComma(v: string): string {
  const num = v.replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("ko-KR");
}

export function MonthlyGoalModal({ year }: { year: number }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  const [rawValues, setRawValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    months.forEach(m => { init[m] = ""; });
    return init;
  });

  // Portal은 클라이언트 마운트 후에만 사용 가능
  useEffect(() => { setMounted(true); }, []);

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(`monthlyGoals_${year}`);
      if (raw) {
        const parsed: MonthlyGoals = JSON.parse(raw);
        const loaded: Record<string, string> = {};
        months.forEach(m => {
          loaded[m] = parsed[m] ? Number(parsed[m]).toLocaleString("ko-KR") : "";
        });
        setRawValues(loaded);
      }
    } catch {}
  }

  function handleChange(m: string, val: string) {
    const formatted = formatWithComma(val);
    setRawValues(prev => ({ ...prev, [m]: formatted }));
  }

  function handleSave() {
    const goals: MonthlyGoals = {};
    months.forEach(m => {
      const num = Number(rawValues[m].replace(/,/g, ""));
      if (!isNaN(num)) goals[m] = num;
    });
    try {
      localStorage.setItem(`monthlyGoals_${year}`, JSON.stringify(goals));
    } catch {}
    setOpen(false);
    window.location.reload();
  }

  const modal = open ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[460px] max-w-[95vw] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-900">{year}년 월별 매출 목표 설정</h2>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {months.map(m => (
            <div key={m} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 w-8 flex-shrink-0">{Number(m)}월</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={rawValues[m]}
                  onChange={e => handleChange(m, e.target.value)}
                  className="w-full h-8 text-xs pr-6 font-bold border border-slate-200 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">원</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="h-8 text-xs" onClick={() => setOpen(false)}>취소</Button>
          <Button className="h-8 text-xs bg-[#414344] text-white hover:bg-[#414344]/90" onClick={handleSave}>저장</Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        className="h-9 gap-2 shadow-sm font-bold text-xs bg-[#414344] text-white hover:bg-[#414344]/90"
        onClick={() => { loadFromStorage(); setOpen(true); }}
      >
        <Settings className="h-3.5 w-3.5" />
        월별 목표 입력
      </Button>

      {/* document.body에 포털로 렌더링 → 부모 z-index/overflow 영향 없음 */}
      {mounted && createPortal(modal, document.body)}
    </>
  );
}

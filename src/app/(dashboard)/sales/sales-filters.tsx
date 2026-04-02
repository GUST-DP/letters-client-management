"use client";

import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface SalesFilterProps {
  clients: string[];
  selectedMonth: string;
  selectedClient: string;
  onMonthChange: (val: string) => void;
  onClientChange: (val: string) => void;
  actions?: React.ReactNode;
}

export function SalesFilters({
  clients,
  selectedMonth,
  selectedClient,
  onMonthChange,
  onClientChange,
  actions
}: SalesFilterProps) {
  // Get current and past 6 months for selection
  const months = useMemo(() => {
    const res = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toISOString().substring(0, 7); // YYYY-MM
      res.push(m);
    }
    return res;
  }, []);

  return (
    <div className="space-y-3 mb-3">
      <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">정산월</label>
          <Select 
            value={selectedMonth} 
            onValueChange={(val) => val && onMonthChange(val)}
          >
            <SelectTrigger className="w-[140px] bg-white border-slate-200 h-9 font-medium text-sm">
              <SelectValue placeholder="정산월 선택">
                {selectedMonth === "all" ? "전체" : selectedMonth}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {months.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">고객사</label>
          <SearchableSelect
            options={[
              { value: "all", label: "전체" },
              ...clients.map(c => ({ value: c, label: c }))
            ]}
            value={selectedClient}
            onValueChange={(val) => onClientChange(val ?? "all")}
            placeholder="고객사명 검색..."
            className="w-[180px]"
          />
        </div>
      </div>

      {actions && (
        <div className="flex items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

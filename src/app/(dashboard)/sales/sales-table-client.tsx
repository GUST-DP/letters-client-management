"use client";

import { useState, useTransition } from "react";
import { DataTable } from "./data-table";
import { columns, SalesData } from "./columns";
import { SalesFilters } from "./sales-filters";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { deleteSalesAction } from "./actions";
import { toast } from "sonner";

interface SalesTableClientProps {
  initialData: SalesData[];
  actions?: React.ReactNode;
}

export function SalesTableClient({ initialData, actions }: SalesTableClientProps) {
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedClient, setSelectedClient] = useState("all");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const clients = Array.from(new Set(initialData.map(s => s.clients?.company_name).filter(Boolean))) as string[];

  const filteredData = initialData.filter(s => {
    const monthMatch = selectedMonth === "all" || s.sales_month === selectedMonth;
    const clientMatch = selectedClient === "all" || s.clients?.company_name === selectedClient;
    return monthMatch && clientMatch;
  });

  const handleExportExcel = () => {
    const headers = [
      "No", "발생월", "입금일자", "고객사명", "브랜드명", "코스트센터",
      "매출액", "입금액"
    ];

    const getDepositDateString = (sales_month: string, lead_time: number | null) => {
      if (lead_time === null) return "";
      const [year, month] = sales_month.split("-").map(Number);
      const endOfMonth = new Date(year, month, 0); // 달의 마지막 날
      endOfMonth.setDate(endOfMonth.getDate() + lead_time);
      // yyyy-mm-dd
      const tzOffset = endOfMonth.getTimezoneOffset() * 60000;
      return new Date(endOfMonth.getTime() - tzOffset).toISOString().split("T")[0];
    };

    const rows = filteredData.map((item, index) => {
      const total = item.total_amount || 0;
      const deposited = item.deposited_amount || 0;
      
      return [
        index + 1,
        `"${item.sales_month || ""}"`,
        `"${getDepositDateString(item.sales_month, item.payment_lead_time)}"`,
        `"${item.clients?.company_name || ""}"`,
        `"${item.clients?.brand_name || ""}"`,
        `"${item.clients?.cost_center?.name || ""}"`,
        total,
        deposited
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `매출및입금관리_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedIds = Object.keys(rowSelection).map(idx => filteredData[Number(idx)]?.id).filter(Boolean);

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("삭제할 매출을 선택해주세요.");
      return;
    }
    if (!confirm(`선택한 ${selectedIds.length}개의 매출 기록을 정말 삭제하시겠습니까?`)) return;

    startTransition(async () => {
      const result = await deleteSalesAction(selectedIds);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("성공적으로 삭제되었습니다.");
        setRowSelection({});
      }
    });
  };

  const totals = filteredData.reduce((acc, curr) => ({
    total_amount: acc.total_amount + (curr.total_amount || 0),
    deposited_amount: acc.deposited_amount + (curr.deposited_amount || 0),
    unpaid_amount: acc.unpaid_amount + ((curr.total_amount || 0) - (curr.deposited_amount || 0))
  }), { total_amount: 0, deposited_amount: 0, unpaid_amount: 0 });

  return (
    <div className="p-3">
      <SalesFilters 
        clients={clients}
        selectedMonth={selectedMonth}
        selectedClient={selectedClient}
        onMonthChange={setSelectedMonth}
        onClientChange={setSelectedClient}
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                key="delete-btn"
                type="button"
                variant="default"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="bg-[#414344] text-white hover:bg-rose-600 transition-colors gap-1.5 h-9 px-3 rounded-lg text-xs font-bold shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </Button>
            )}
            <Button
              key="export-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleExportExcel();
              }}
              className="h-9 px-3 rounded-lg text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors gap-1.5 flex items-center shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              엑셀 다운로드
            </Button>
            <div key="page-actions">{actions}</div>
          </div>
        }
      />
      <DataTable 
        columns={columns} 
        data={filteredData} 
        totals={totals}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}

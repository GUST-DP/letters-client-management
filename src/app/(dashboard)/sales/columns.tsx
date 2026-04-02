"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateSalesAction, updateSalesFieldAction } from "./actions";
import { toast } from "sonner";
import { useState, useEffect, useTransition } from "react";
import { differenceInDays, lastDayOfMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

export type SalesData = {
  id: string;
  clients: { 
    company_name: string; 
    brand_name: string | null;
    cost_center: { name: string } | null;
  } | null;
  sales_month: string;
  total_amount: number;
  deposited_amount: number | null;
  deposit_status: string;
  payment_lead_time: number | null;
  created_at: string;
  brand_name?: string;
  cost_center_name?: string;
};

// Formatting utilities
const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("ko-KR").format(num);
};

const parseNumber = (str: string) => {
  return parseFloat(str.replace(/,/g, "")) || 0;
};

// Inline Amount Editor Component (Supports both total_amount and deposited_amount)
const InlineAmountEditor = ({ 
  sale, 
  field, 
  colorClass = "" 
}: { 
  sale: SalesData, 
  field: "total_amount" | "deposited_amount",
  colorClass?: string
}) => {
  const initialValue = sale[field] ?? 0;
  const [displayValue, setDisplayValue] = useState(formatNumber(initialValue));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(formatNumber(sale[field] ?? 0));
    }
  }, [sale[field], isEditing, field]);

  const handleBlur = async () => {
    setIsEditing(false);
    const numValue = parseNumber(displayValue);
    
    if (isNaN(numValue) || numValue < 0) {
      toast.error("올바른 금액을 입력해주세요.");
      setDisplayValue(formatNumber(sale[field] ?? 0));
      return;
    }

    if (numValue === (sale[field] ?? 0)) {
      setDisplayValue(formatNumber(numValue));
      return;
    }

    const res = await updateSalesFieldAction(sale.id, field, numValue);
    if (res.error) {
      toast.error(res.error);
      setDisplayValue(formatNumber(sale[field] ?? 0));
    } else {
      toast.success(`${field === "total_amount" ? "매출액" : "입금액"}이 수정되었습니다.`);
      setDisplayValue(formatNumber(numValue));
    }
  };

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={(e) => setDisplayValue(e.target.value)}
      onFocus={() => {
        setIsEditing(true);
        setDisplayValue((sale[field] ?? 0).toString());
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={`h-8 w-32 text-right font-bold ${colorClass}`}
    />
  );
};

const DepositEditor = ({ sale }: { sale: SalesData }) => {
  const initialValue = sale.deposited_amount || 0;
  const [open, setOpen] = useState(false);
  const [depositAmountStr, setDepositAmountStr] = useState<string>(initialValue.toString());
  const [depositDate, setDepositDate] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setDepositAmountStr(initialValue.toString() === "0" ? "" : initialValue.toString());
      setDepositDate(new Date().toISOString().split("T")[0]); // 기본 오늘 날짜
    }
  }, [open, initialValue]);

  const handleSave = () => {
    const amount = Number(depositAmountStr.replace(/,/g, ""));
    if (isNaN(amount) || amount < 0) {
      toast.error("올바른 금액을 입력해주세요.");
      return;
    }
    if (!depositDate) {
      toast.error("입금일을 지정해주세요.");
      return;
    }

    // 리드타임 계산
    const [year, month] = sale.sales_month.split("-").map(Number);
    const endOfSalesMonth = lastDayOfMonth(new Date(year, month - 1, 1)); // 예: 2026-02-28
    const depDate = new Date(depositDate);
    const leadTime = differenceInDays(depDate, endOfSalesMonth);

    startTransition(async () => {
      const res = await updateSalesAction(sale.id, {
        deposited_amount: amount,
        payment_lead_time: leadTime,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("입금 정보가 등록되었습니다.");
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-end gap-2 group">
        <span className="font-bold text-emerald-600">
          {initialValue > 0 ? formatNumber(initialValue) : "-"}
        </span>
        <DialogTrigger render={<Button variant="outline" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />}>
          <Edit2 className="h-3 w-3 text-emerald-600" />
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>수기 입금 등록</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>입금액</Label>
            <Input 
              type="number"
              value={depositAmountStr}
              onChange={(e) => setDepositAmountStr(e.target.value)}
              placeholder="예: 5000000"
            />
          </div>
          <div className="space-y-2">
            <Label>입금일</Label>
            <Input 
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
            />
          </div>
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            입금일에 따라 해당 매출월 말일 기준 리드타임이 자동 역산됩니다.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>취소</Button>
          <Button onClick={handleSave} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const columns: ColumnDef<SalesData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomePageRowsSelected();
        }}
        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "index",
    header: "#",
    cell: ({ row }) => <div className="text-gray-400 text-xs w-4">{row.index + 1}</div>,
  },
  {
    accessorKey: "sales_month",
    header: "매출 월",
    cell: ({ row }) => <div className="font-medium">{row.getValue("sales_month")}</div>,
  },
  {
    id: "company_name",
    header: "고객사명",
    cell: ({ row }) => {
      const client = row.original.clients;
      return (
        <div>
          <span className="font-semibold text-gray-900">{client?.company_name || "알 수 없음"}</span>
        </div>
      );
    },
  },
  {
    id: "brand_name",
    header: "브랜드명",
    cell: ({ row }) => <div className="text-gray-600">{row.original.clients?.brand_name || "-"}</div>,
  },
  {
    id: "cost_center_name",
    header: "코스트센터",
    cell: ({ row }) => <div className="text-gray-500 text-xs">{row.original.clients?.cost_center?.name || "-"}</div>,
  },
  {
    accessorKey: "total_amount",
    header: "총 매출액",
    cell: ({ row }) => <InlineAmountEditor sale={row.original} field="total_amount" />,
  },
  {
    id: "deposited_amount",
    header: "입금액",
    cell: ({ row }) => <DepositEditor sale={row.original} />,
  },
  {
    id: "unpaid_amount",
    header: "미수액",
    cell: ({ row }) => {
      const total = row.original.total_amount;
      const deposited = row.original.deposited_amount ?? 0;
      const unpaid = Math.max(0, total - deposited);
      return (
        <div className={`text-right font-bold ${unpaid > 0 ? "text-red-600" : "text-gray-400"}`}>
          {formatNumber(unpaid)}
        </div>
      );
    },
  },
  {
    accessorKey: "deposit_status",
    header: "입금 상태",
    cell: ({ row }) => {
      const total = row.original.total_amount;
      const deposited = row.original.deposited_amount ?? 0;
      
      let status = "입금대기중";
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      
      if (deposited >= total && total > 0) {
        status = "입금완료";
        variant = "default";
      } else if (deposited > 0) {
        status = "미수금";
        variant = "destructive";
      }
      
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "payment_lead_time",
    header: "입금 리드타임(일)",
    cell: ({ row }) => {
      const lt = row.getValue("payment_lead_time") as number | null;
      return <div className="text-center">{lt !== null ? `${lt}일` : "-"}</div>;
    },
  },
  {
    id: "deposit_date",
    header: "입금 일자",
    cell: ({ row }) => {
      const lead_time = row.getValue("payment_lead_time") as number | null;
      if (lead_time === null) return <div className="text-gray-400">-</div>;
      
      const sales_month = row.getValue("sales_month") as string;
      if (!sales_month) return <div className="text-gray-400">-</div>;

      const [year, month] = sales_month.split("-").map(Number);
      const endOfMonth = new Date(year, month, 0); // 말일
      endOfMonth.setDate(endOfMonth.getDate() + lead_time);
      const tzOffset = endOfMonth.getTimezoneOffset() * 60000;
      const dateStr = new Date(endOfMonth.getTime() - tzOffset).toISOString().split("T")[0];
      
      return <div className="text-gray-600 font-medium">{dateStr}</div>;
    },
  },
];

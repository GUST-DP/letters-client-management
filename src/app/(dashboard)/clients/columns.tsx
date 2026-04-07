"use client";

import { useState, useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ensureAbsoluteUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateClientOpManager, updateClientSalesManager, triggerContractAction } from "./actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, 
  Trash2, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Calendar as CalendarIcon,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { TransitionLink } from "@/components/ui/transition-link";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";

export type ClientData = {
  id: string;
  company_name: string;
  brand_name: string | null;
  progress_status: string;
  contract_status: string;
  sales_manager_id: string | null;
  operation_manager_id: string | null;
  cost_center_id: string | null;
  rel_cost_center: { id: string; name: string } | null;
  service_types: { id: string; name: string } | null;
  profiles_sales: { id: string; full_name: string | null; email: string } | null;
  profiles_op: { id: string; full_name: string | null; email: string } | null;
  client_onboarding?: { sales_start_date: string | null; contract_date: string | null; contract_end_date: string | null }[] | { sales_start_date: string | null; contract_date: string | null; contract_end_date: string | null } | null;
  client_onboarding_tasks?: { id: string; is_completed: boolean }[];
  approval_link: string | null;
  lead_source: string | null;
  created_at: string;
};

// --- 진행상태 표시 컴포넌트 (읽기 전용) ---
function ProgressStatusBadge({ status }: { status: string }) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "운영중":
      case "운영준비완료": return "bg-green-100 text-green-800 border-green-200";
      case "협의중":
      case "입고대기": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "운영종료": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Badge variant="outline" className={`text-[11px] font-bold whitespace-nowrap ${getStatusColor(status)}`}>
      {status}
    </Badge>
  );
}

// (이전 ContractActionCell은 삭제됨 - 상단 버튼으로 이동)


// --- 계약상태 뱃지 컴포넌트 (읽기 전용) ---
function ContractStatusBadge({ status }: { status: string }) {
  let colorClass = "bg-gray-100 text-gray-800";
  if (status === "계약완료") colorClass = "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "계약진행중") colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (status === "계약해지") colorClass = "bg-red-100 text-red-800 border-red-200";

  return <Badge variant="outline" className={`text-[11px] font-bold whitespace-nowrap ${colorClass}`}>{status}</Badge>;
}

function ManagerCell({ 
  client, 
  managers, 
  type 
}: { 
  client: ClientData; 
  managers: any[];
  type: "op" | "sales";
}) {
  const [isPending, startTransition] = useTransition();

  // 현재 담당자의 ID 결정
  const currentId = type === "op" 
    ? (client.operation_manager_id) 
    : (client.sales_manager_id);

  // 화면에 표시할 텍스트(이메일) 결정
  const managerFromList = managers.find(m => m.id === currentId);
  const managerFromJoin = type === "op" ? client.profiles_op : client.profiles_sales;
  
  // 이름 우선, 없으면 이메일, 그것도 없으면 "미배정"
  const displayName =
    managerFromList?.full_name || managerFromJoin?.full_name ||
    managerFromList?.email || managerFromJoin?.email || "미배정";

  const handleManagerChange = (managerId: string | null) => {
    if (!managerId) return;
    startTransition(async () => {
      const value = managerId === "unassigned" ? null : managerId;
      const result = type === "op" 
        ? await updateClientOpManager(client.id, value)
        : await updateClientSalesManager(client.id, value);

      if (result?.error) {
        toast.error(result.error);
      } else {
        const typeStr = type === "op" ? "운영" : "영업";
        toast.success(`[${client.company_name}] ${typeStr} 담당자가 반영되었습니다.`);
      }
    });
  };

  return (
    <Select
      value={currentId || "unassigned"}
      onValueChange={handleManagerChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-[105px] h-8 text-xs">
        <SelectValue placeholder="미배정">
          {displayName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">미배정</SelectItem>
        {managers.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.full_name || m.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// 매니저 목록을 인자로 받아 컬럼을 생성하는 팩토리 함수 (동적렌더러)
export const getColumns = (managers: any[], totalTaskCount: number): ColumnDef<ClientData>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        className="w-4 h-4"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        className="w-4 h-4"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "company_name",
    header: "고객사",
    cell: ({ row }) => (
      <TransitionLink 
        href={`/clients/${row.original.id}`} 
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center h-8 px-3 rounded-md text-slate-800 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {row.getValue("company_name") as string}
        <ExternalLink className="w-3 h-3 text-slate-400" />
      </TransitionLink>
    ),
  },
  {
    id: "onboarding_status",
    header: "체크리스트",
    cell: ({ row }) => {
      const tasks = row.original.client_onboarding_tasks || [];
      const completedCount = tasks.filter(t => t.is_completed).length;
      const totalCount = tasks.length;
      const isAllDone = totalCount > 0 && completedCount === totalCount;
      
      return (
        <TransitionLink 
          href={`/clients/${row.original.id}/onboarding`}
          className={`inline-flex items-center justify-center h-8 px-3 rounded-md bg-white border border-slate-200 shadow-sm transition-colors gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap ${
            isAllDone 
              ? 'text-green-700 hover:bg-green-50 hover:border-green-200' 
              : 'text-rose-600 hover:bg-rose-50 hover:border-rose-200'
          }`}
        >
          {isAllDone ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-bold text-xs uppercase tracking-tight">작성완료 ({completedCount}/{totalCount})</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold text-xs uppercase tracking-tight">{totalCount === 0 ? "작성필요" : `작성중 (${completedCount}/${totalCount})`}</span>
            </>
          )}
        </TransitionLink>
      );
    }
  },
  {
    accessorKey: "brand_name",
    header: "브랜드명",
    cell: ({ row }) => (
      <div className="text-gray-700">{row.getValue("brand_name") || "-"}</div>
    ),
  },
  {
    accessorKey: "lead_source",
    header: "인입 경로",
    cell: ({ row }) => {
      const source = row.getValue("lead_source") as string;
      return source ? (
        <Badge variant="outline" className="text-[11px] font-bold whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200">
          {source}
        </Badge>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
  },
  {
    id: "cost_center", // Changed from "cost_center_column" to "cost_center"
    header: "코스트센터",
    cell: ({ row }) => {
      // 조인 에일리어스 또는 기본 테이블명을 모두 시도 (Supabase/PostgREST 대응)
      const ccData = (row.original as any).rel_cost_center || (row.original as any).cost_centers;
      const costCenter = Array.isArray(ccData) ? ccData[0] : ccData;
      return (
        costCenter?.name ? (
          <Badge variant="outline" className="text-[11px] font-bold whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200">
            {costCenter.name}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      );
    },
  },
  {
    accessorKey: "progress_status",
    header: "진행상태",
    cell: ({ row }) => <ProgressStatusBadge status={row.original.progress_status} />,
  },
  {
    accessorKey: "contract_status",
    header: "계약상태",
    cell: ({ row }) => <ContractStatusBadge status={row.original.contract_status} />,
  },
  {
    id: "approval_link",
    header: "계약품의",
    cell: ({ row }) => {
      const link = row.original.approval_link;
      return link ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="group inline-flex items-center justify-center h-8 px-3 rounded-lg text-[11px] font-black text-slate-600 bg-white border border-slate-200 shadow-sm hover:border-[#ff5c39] hover:text-[#ff5c39] hover:bg-[#ff5c39]/5 transition-all gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff5c39]"
          onClick={() => window.open(ensureAbsoluteUrl(link), '_blank')}
        >
          바로가기
          <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      ) : (
        <span className="text-gray-400 text-[11px]">-</span>
      );
    }
  },
  {
    id: "sales_start_date",
    header: "영업 시작일",
    accessorFn: (row) => {
      const onboarding = row.client_onboarding;
      // 배열인 경우와 객체인 경우 모두 대응
      const data: any = Array.isArray(onboarding) 
        ? (onboarding.length > 0 ? onboarding[0] : null)
        : onboarding;
      return data?.sales_start_date;
    },
    cell: ({ getValue }) => {
      const val = getValue() as string;
      if (!val) return <span className="text-gray-400">-</span>;
      try {
        return <div className="text-[11px] tracking-tighter text-slate-700 font-bold w-[76px] whitespace-nowrap text-center">{format(new Date(val), 'yyyy-MM-dd')}</div>;
      } catch (e) {
        return <span className="text-gray-400 text-xs">-</span>;
      }
    }
  },
  {
    id: "contract_date",
    header: "계약일",
    accessorFn: (row) => {
      const onboarding = row.client_onboarding;
      const data: any = Array.isArray(onboarding) 
        ? (onboarding.length > 0 ? onboarding[0] : null)
        : onboarding;
      return data?.contract_date;
    },
    cell: ({ getValue }) => {
      const val = getValue() as string;
      if (!val) return <span className="text-gray-400">-</span>;
      try {
        return <div className="text-[11px] tracking-tighter text-slate-700 font-bold w-[76px] whitespace-nowrap text-center">{format(new Date(val), 'yyyy-MM-dd')}</div>;
      } catch (e) {
        return <span className="text-gray-400 text-xs">-</span>;
      }
    }
  },
  {
    id: "contract_end_date",
    header: "계약해지일",
    accessorFn: (row) => {
      const onboarding = row.client_onboarding;
      const data: any = Array.isArray(onboarding) 
        ? (onboarding.length > 0 ? onboarding[0] : null)
        : onboarding;
      return data?.contract_end_date;
    },
    cell: ({ getValue }) => {
      const val = getValue() as string;
      if (!val) return <span className="text-gray-400">-</span>;
      try {
        return <div className="text-[11px] tracking-tighter text-slate-700 font-bold w-[76px] whitespace-nowrap text-center">{format(new Date(val), 'yyyy-MM-dd')}</div>;
      } catch (e) {
        return <span className="text-gray-400 text-xs">-</span>;
      }
    }
  },
  {
    id: "lead_time",
    header: "리드타임",
    accessorFn: (row) => {
      const onboarding = row.client_onboarding;
      const data: any = Array.isArray(onboarding) 
        ? (onboarding.length > 0 ? onboarding[0] : null)
        : onboarding;
      if (data?.sales_start_date && data?.contract_date) {
        return differenceInDays(new Date(data.contract_date), new Date(data.sales_start_date));
      }
      return null;
    },
    cell: ({ getValue }) => {
      const val = getValue() as number;
      if (val === null || val === undefined) return <span className="text-gray-400">-</span>;
      return <div className="text-sm font-bold text-orange-600">{val}일</div>;
    }
  },

  {
    accessorKey: "profiles_sales",
    header: "영업 담당자",
    cell: ({ row }) => <ManagerCell client={row.original} managers={managers} type="sales" />,
  },
  {
    accessorKey: "profiles_op",
    header: "운영 담당자",
    cell: ({ row }) => <ManagerCell client={row.original} managers={managers} type="op" />,
  },
];

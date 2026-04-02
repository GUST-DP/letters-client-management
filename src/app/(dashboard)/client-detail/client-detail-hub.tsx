"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Building2,
  Users,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  ChevronRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientDetailHubProps {
  clients: any[];
  serviceIssues: { client_id: string; status: string }[];
  opIssues: { client_id: string; status: string }[];
}

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  "계약완료": "bg-blue-50 text-blue-600 border-blue-200",
  "계약진행중": "bg-amber-50 text-amber-600 border-amber-200",
  "계약해지": "bg-red-50 text-red-500 border-red-200",
};

const PROGRESS_STATUS_COLORS: Record<string, string> = {
  "운영중": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "운영준비완료": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "협의중": "bg-yellow-50 text-yellow-600 border-yellow-200",
  "입고대기": "bg-orange-50 text-orange-600 border-orange-200",
  "운영종료": "bg-gray-100 text-gray-500 border-gray-200",
};

import { useLoading } from "@/components/providers/loading-provider";

export function ClientDetailHub({
  clients,
  serviceIssues,
  opIssues,
}: ClientDetailHubProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { startLoading, isLoading } = useLoading();
  const [search, setSearch] = useState("");
  const [filterContract, setFilterContract] = useState("all");
  const [filterProgress, setFilterProgress] = useState("all");

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    // 전역 로딩 팝업 표시
    startLoading();
    // 트랜지션 시작 (배경에서 로드하여 흰 화면 방지)
    startTransition(() => {
      router.push(href);
    });
  };

  // 고객사별 이슈 집계
  const issueMap = useMemo(() => {
    const map: Record<string, { service: number; serviceOpen: number; op: number; opOpen: number }> = {};
    serviceIssues.forEach((i) => {
      if (!map[i.client_id]) map[i.client_id] = { service: 0, serviceOpen: 0, op: 0, opOpen: 0 };
      map[i.client_id].service += 1;
      if (i.status !== "조치등록" && i.status !== "조치완료") map[i.client_id].serviceOpen += 1;
    });
    opIssues.forEach((i) => {
      if (!map[i.client_id]) map[i.client_id] = { service: 0, serviceOpen: 0, op: 0, opOpen: 0 };
      map[i.client_id].op += 1;
      if (i.status !== "처리완료") map[i.client_id].opOpen += 1;
    });
    return map;
  }, [serviceIssues, opIssues]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = search.trim().toLowerCase();
      if (q && !c.company_name?.toLowerCase().includes(q) && !c.brand_name?.toLowerCase().includes(q)) return false;
      if (filterContract !== "all" && c.contract_status !== filterContract) return false;
      if (filterProgress !== "all" && c.progress_status !== filterProgress) return false;
      return true;
    });
  }, [clients, search, filterContract, filterProgress]);

  const uniqueContractStatuses = [...new Set(clients.map((c) => c.contract_status).filter(Boolean))];
  const uniqueProgressStatuses = [...new Set(clients.map((c) => c.progress_status).filter(Boolean))];

  // 계약상태별 집계
  const totalCount = clients.length;
  const contractingCount = clients.filter(c => c.contract_status === "계약진행중").length;
  const contractedCount = clients.filter(c => c.contract_status === "계약완료").length;
  const terminatedCount = clients.filter(c => c.contract_status === "계약해지").length;

  return (
    <div className="space-y-4">
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">전체 고객사</p>
            <p className="text-2xl font-black text-slate-700">{totalCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider">계약진행중</p>
            <p className="text-2xl font-black text-amber-600">{contractingCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-400 uppercase tracking-wider">계약완료</p>
            <p className="text-2xl font-black text-blue-600">{contractedCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-[11px] font-black text-red-400 uppercase tracking-wider">계약해지</p>
            <p className="text-2xl font-black text-red-500">{terminatedCount}</p>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="고객사명 또는 브랜드명 검색..."
            className="pl-9 h-9 border-slate-200 bg-slate-50 text-sm"
          />
        </div>
        <Select value={filterContract} onValueChange={(v) => v && setFilterContract(v)}>
          <SelectTrigger className="w-[140px] h-9 border-slate-200 text-xs font-bold bg-white">
            <SelectValue>{filterContract === "all" ? "계약상태 전체" : filterContract}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">계약상태 전체</SelectItem>
            {uniqueContractStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterProgress} onValueChange={(v) => v && setFilterProgress(v)}>
          <SelectTrigger className="w-[140px] h-9 border-slate-200 text-xs font-bold bg-white">
            <SelectValue>{filterProgress === "all" ? "진행상태 전체" : filterProgress}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">진행상태 전체</SelectItem>
            {uniqueProgressStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs font-bold text-slate-400">
          {filteredClients.length}개 고객사
        </div>
      </div>

      {/* 카드 그리드 */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Building2 className="w-12 h-12 mb-3 opacity-20" />
          <p className="font-bold">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filteredClients.map((client) => {
            const costCenter = Array.isArray(client.rel_cost_center) ? client.rel_cost_center[0] : client.rel_cost_center;
            const onboarding = Array.isArray(client.client_onboarding) ? client.client_onboarding[0] : client.client_onboarding;
            const issues = issueMap[client.id] || { service: 0, serviceOpen: 0, op: 0, opOpen: 0 };

            return (
              <a 
                key={client.id} 
                href={`/clients/${client.id}`} 
                onClick={(e) => handleNavClick(e, `/clients/${client.id}`)}
              >
                <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#ff5c39]/30 transition-all duration-200 overflow-hidden cursor-pointer h-full">
                  {/* 카드 헤더 */}
                  <div className="px-5 pt-4 pb-3 border-b border-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 text-base truncate group-hover:text-[#ff5c39] transition-colors">
                          {client.company_name}
                        </h3>
                        {client.brand_name && (
                          <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{client.brand_name}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#ff5c39] shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      {client.contract_status && (
                        <Badge variant="outline" className={cn("text-[10px] font-bold", CONTRACT_STATUS_COLORS[client.contract_status] || "bg-gray-50 text-gray-500")}>
                          {client.contract_status}
                        </Badge>
                      )}
                      {client.progress_status && (
                        <Badge variant="outline" className={cn("text-[10px] font-bold", PROGRESS_STATUS_COLORS[client.progress_status] || "bg-gray-50 text-gray-500")}>
                          {client.progress_status}
                        </Badge>
                      )}
                      {costCenter?.name && (
                        <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-500 border-slate-200">
                          {costCenter.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 카드 바디 */}
                  <div className="px-5 py-3 space-y-2.5">
                    {/* 담당자 */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-blue-400" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium truncate">
                          영업: <span className="font-bold text-slate-700">
                            {client.profiles_sales?.full_name || client.profiles_sales?.email || "미배정"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium truncate">
                          운영: <span className="font-bold text-slate-700">
                            {client.profiles_op?.full_name || client.profiles_op?.email || "미배정"}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* 계약일 */}
                    {onboarding?.contract_date && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase w-14 shrink-0">계약일</span>
                        <span className="text-[11px] font-bold text-slate-600">{onboarding.contract_date}</span>
                      </div>
                    )}

                    {/* 이슈 현황 */}
                    <div className="flex items-center gap-2 pt-0.5 border-t border-slate-50">
                      <div className={cn(
                        "flex items-center gap-1 flex-1 justify-center rounded-lg py-1.5",
                        issues.serviceOpen > 0 ? "bg-orange-50" : "bg-slate-50"
                      )}>
                        <AlertTriangle className={cn("w-3 h-3", issues.service > 0 ? "text-orange-400" : "text-slate-300")} />
                        <span className={cn("text-[10px] font-black", issues.service > 0 ? "text-orange-600" : "text-slate-400")}>
                          서비스 이슈 {issues.service}건
                        </span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 flex-1 justify-center rounded-lg py-1.5",
                        issues.op > 0 ? "bg-red-50" : "bg-slate-50"
                      )}>
                        <ClipboardList className={cn("w-3 h-3", issues.op > 0 ? "text-red-400" : "text-slate-300")} />
                        <span className={cn("text-[10px] font-black", issues.op > 0 ? "text-red-600" : "text-slate-400")}>
                          고객사 이슈 {issues.op}건
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

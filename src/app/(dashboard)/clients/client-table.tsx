"use client";

import { useState, useMemo, useTransition } from "react";
import { DataTable } from "./data-table";
import { getColumns, ClientData } from "./columns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  AlertCircle, 
  Trash2, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Calendar as CalendarIcon,
  Download
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  deleteClientsAction, 
  triggerContractAction, 
  updateClientDetailsAction 
} from "./actions";

import { SearchableSelect } from "@/components/ui/searchable-select";
import { CreateClientDialog } from "./create-client-dialog";

interface ClientTableProps {
  data: ClientData[];
  profiles: any[];
  costCenters: { id: string; name: string }[];
  serviceTypes: { id: string; name: string }[];
  totalTaskCount: number;
}

export function ClientTable({ data, profiles, costCenters, serviceTypes, totalTaskCount }: ClientTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [isPending, startTransition] = useTransition();
  
  // 날짜 선택 모달 관련 상태
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [targetActionType, setTargetActionType] = useState<"complete" | "terminate" | null>(null);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split("T")[0]);

  // 품의 링크 모달 관련 상태
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  // 세부내역 수정 모달 관련 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLeadSource, setEditLeadSource] = useState<string | null>(null);
  const [editCostCenterId, setEditCostCenterId] = useState<string | null>(null);
  const [editSalesStartDate, setEditSalesStartDate] = useState<string>("");
  const [editContractDate, setEditContractDate] = useState<string>("");

  const columns = useMemo(() => getColumns(profiles, totalTaskCount), [profiles, totalTaskCount]);

  // 필터 상태
  const [filterClient, setFilterClient] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [filterContractStatus, setFilterContractStatus] = useState("all");

  const uniqueClients = useMemo(() => Array.from(new Set(data.map(d => d.company_name))).sort(), [data]);
  const uniqueBrands = useMemo(() => Array.from(new Set(data.filter(d => d.brand_name).map(d => d.brand_name as string))).sort(), [data]);
  
  const uniqueManagers = useMemo(() => {
    const managers = new Set<string>();
    data.forEach(d => {
      if (d.profiles_op?.full_name) managers.add(d.profiles_op.full_name);
      if (d.profiles_sales?.full_name) managers.add(d.profiles_sales.full_name);
    });
    return Array.from(managers).sort();
  }, [data]);

  const uniqueContractStatuses = useMemo(() => Array.from(new Set(data.map(d => d.contract_status))).sort(), [data]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (filterClient !== "all" && d.company_name !== filterClient) return false;
      if (filterBrand !== "all" && d.brand_name !== filterBrand) return false;
      if (filterContractStatus !== "all" && d.contract_status !== filterContractStatus) return false;
      if (filterManager !== "all") {
        const hasManager = d.profiles_op?.full_name === filterManager || d.profiles_sales?.full_name === filterManager;
        if (!hasManager) return false;
      }
      return true;
    });
  }, [data, filterClient, filterBrand, filterManager, filterContractStatus]);

  const handleExportExcel = () => {
    const headers = [
      "No", "고객사", "브랜드명", "인입 경로", "코스트센터", 
      "진행상태", "계약상태", "영업 시작일", "계약일", "계약해지일", 
      "영업 담당자", "운영 담당자"
    ];

    const rows = filteredData.map((item, index) => {
      const onboarding = item.client_onboarding;
      const onboardData: any = Array.isArray(onboarding) ? (onboarding.length > 0 ? onboarding[0] : null) : onboarding;
      const ccData = (item as any).rel_cost_center || (item as any).cost_centers;
      const cc = Array.isArray(ccData) ? ccData[0] : ccData;

      return [
        index + 1,
        `"${item.company_name || ""}"`,
        `"${item.brand_name || ""}"`,
        `"${item.lead_source || ""}"`,
        `"${cc?.name || ""}"`,
        `"${item.progress_status || ""}"`,
        `"${item.contract_status || ""}"`,
        `"${onboardData?.sales_start_date ? onboardData.sales_start_date.substring(0, 10) : ""}"`,
        `"${onboardData?.contract_date ? onboardData.contract_date.substring(0, 10) : ""}"`,
        `"${onboardData?.contract_end_date ? onboardData.contract_end_date.substring(0, 10) : ""}"`,
        `"${item.profiles_sales?.full_name || item.profiles_sales?.email || ""}"`,
        `"${item.profiles_op?.full_name || item.profiles_op?.email || ""}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `고객사계약관리_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 선택된 ID들 추출
  const selectedIds = Object.keys(rowSelection);

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("삭제할 고객사를 선택해주세요.");
      return;
    }
    if (!confirm(`선택한 ${selectedIds.length}개의 고객사를 정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.`)) return;

    startTransition(async () => {
      const result = await deleteClientsAction(selectedIds);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("성공적으로 삭제되었습니다.");
        setRowSelection({});
      }
    });
  };

  const handleContractActionRequest = (type: "terminate" | "complete") => {
    if (selectedIds.length === 0) {
      toast.error("변경할 고객사를 선택해주세요.");
      return;
    }

    // 모든 상태에서 계약해지/완료가 가능하도록 제약 제거
    setTargetActionType(type);
    setActionDate(new Date().toISOString().split("T")[0]); // 기본값 오늘
    setIsDateDialogOpen(true);
  };

  const executeContractAction = () => {
    if (!targetActionType || selectedIds.length === 0) return;
    
    const actionName = targetActionType === "complete" ? "계약완료" : "계약해지";
    const dateFieldName = targetActionType === "complete" ? "계약일" : "계약해지일";

    if (!confirm(`선택하신 ${dateFieldName}이 [${actionDate}] 이 맞습니까?\n확인을 누르면 상태변경 처리가 시작됩니다.`)) return;

    startTransition(async () => {
      const res = await triggerContractAction(selectedIds, targetActionType, actionDate);
      
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`선택한 ${selectedIds.length}개의 고객사가 ${actionName} 처리되었습니다.`);
        setRowSelection({});
        setIsDateDialogOpen(false);
        setTargetActionType(null);
      }
    });
  };

  const handleLinkUpdate = () => {
    if (selectedIds.length === 0) {
      toast.error("변경할 고객사를 선택해주세요.");
      return;
    }
    startTransition(async () => {
      const { updateApprovalLinkAction } = await import("./actions");
      const result = await updateApprovalLinkAction(selectedIds, linkValue);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`선택한 ${selectedIds.length}개 고객사의 품의 링크가 저장되었습니다.`);
        setRowSelection({});
        setIsLinkDialogOpen(false);
        setLinkValue("");
      }
    });
  };

  const selectedClientNames = useMemo(() => {
    return data
      .filter(c => selectedIds.includes(c.id))
      .map(c => c.company_name)
      .join(", ");
  }, [data, selectedIds]);

  return (
    <div className="p-3 space-y-3">
      {/* 필터 영역 */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 mb-3 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600 whitespace-nowrap">고객사</label>
          <SearchableSelect
            options={[
              { value: "all", label: "전체" },
              ...uniqueClients.map(c => ({ value: c, label: c }))
            ]}
            value={filterClient}
            onValueChange={setFilterClient}
            placeholder="고객사명 검색..."
            className="w-[180px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600 whitespace-nowrap">브랜드명</label>
          <Select value={filterBrand} onValueChange={(val) => val && setFilterBrand(val)}>
            <SelectTrigger className="w-[140px] bg-white border-slate-200 h-9 font-medium text-sm">
              <SelectValue placeholder="브랜드명 선택">
                {filterBrand === "all" ? "전체" : filterBrand}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600 whitespace-nowrap">담당자</label>
          <Select value={filterManager} onValueChange={(val) => val && setFilterManager(val)}>
            <SelectTrigger className="w-[120px] bg-white border-slate-200 h-9 font-medium text-sm">
              <SelectValue placeholder="담당자 선택">
                {filterManager === "all" ? "전체" : filterManager}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueManagers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600 whitespace-nowrap">계약상태</label>
          <Select value={filterContractStatus} onValueChange={(val) => val && setFilterContractStatus(val)}>
            <SelectTrigger className="w-[120px] bg-white border-slate-200 h-9 font-medium text-sm">
              <SelectValue placeholder="계약상태 선택">
                {filterContractStatus === "all" ? "전체" : filterContractStatus}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueContractStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 액션 바 */}
      <div className="flex items-center justify-end gap-2 mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExportExcel();
            }}
            className="h-8 px-3 rounded-lg text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 transition-colors gap-1.5 flex items-center shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            엑셀 다운로드
          </Button>
          <CreateClientDialog 
            costCenters={costCenters} 
            serviceTypes={serviceTypes}
            profiles={profiles}
          />
          <Button 
            size="sm" 
            className="h-8 bg-[#414344] text-white hover:bg-[#414344]/90"
            onClick={() => {
              if (selectedIds.length === 0) return toast.error("변경할 고객사를 선택해주세요.");
              setLinkValue("");
              setIsLinkDialogOpen(true);
            }}
            disabled={isPending}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
            품의링크등록
          </Button>
          <Button 
            size="sm" 
            className="h-8 bg-[#414344] text-white hover:bg-[#414344]/90"
            onClick={() => {
              if (selectedIds.length === 0) return toast.error("수정할 고객사를 선택해주세요.");
              const first = data.find(c => c.id === selectedIds[0]);
              setEditLeadSource(first?.lead_source || null);
              setEditCostCenterId(first?.cost_center_id || null);
              const onboarding = first?.client_onboarding;
              const onboardingData: any = Array.isArray(onboarding) ? onboarding[0] : onboarding;
              setEditSalesStartDate(onboardingData?.sales_start_date || "");
              setEditContractDate(onboardingData?.contract_date || "");
              setIsEditOpen(true);
            }}
            disabled={isPending}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
            세부내역 수정
          </Button>

          <Button 
            size="sm" 
            className="h-8 bg-[#414344] text-white hover:bg-[#414344]/90"
            onClick={() => handleContractActionRequest("complete")}
            disabled={isPending}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            계약완료
          </Button>
          <Button 
            size="sm" 
            className="h-8 bg-[#414344] text-white hover:bg-[#414344]/90"
            onClick={() => handleContractActionRequest("terminate")}
            disabled={isPending}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            계약해지
          </Button>
          <Button 
            size="sm" 
            className="h-8 bg-[#414344] text-white hover:bg-[#414344]/90"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1 text-red-400" />
            삭제
          </Button>
        </div>

      {/* 계약 날짜 선택 모달 */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {targetActionType === "complete" ? "계약 완료 처리" : "계약 해지 처리"}
            </DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.length}개 고객사의 {targetActionType === "complete" ? "계약일" : "계약해지일"}을 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action_date" className="text-sm font-medium">
                {targetActionType === "complete" ? "계약 완료일" : "계약 해지일"}
              </Label>
              <Input
                id="action_date"
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
              />
            </div>
            
            <p className="text-xs text-muted-foreground flex items-start gap-2 bg-gray-50 p-3 rounded-md border">
              <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                확인 버튼을 누르면 모든 선택된 고객사의 상태가 즉시 변경되며, 
                진행상태가 <strong>{targetActionType === "complete" ? "운영중" : "운영종료"}</strong>로 자동 업데이트됩니다.
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDateDialogOpen(false)} disabled={isPending}>
              취소
            </Button>
            <Button 
              onClick={executeContractAction} 
              disabled={isPending}
              className={targetActionType === "complete" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isPending ? "처리 중..." : "반영하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 세부내역 수정 모달 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>세부 내역 수정</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.length}개 고객사의 주요 정보를 일괄 수정합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">영업 인입 경로</Label>
                <Select value={editLeadSource || "none"} onValueChange={(v: any) => setEditLeadSource(v === "none" ? null : v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    <SelectItem value="네이버 풀필먼트 서비스신청">네이버 풀필먼트 서비스신청</SelectItem>
                    <SelectItem value="인적경로">인적경로</SelectItem>
                    <SelectItem value="홈페이지 문의">홈페이지 문의</SelectItem>
                    <SelectItem value="콜드메일 회신">콜드메일 회신</SelectItem>
                    <SelectItem value="박람회">박람회</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">코스트센터</Label>
                <Select value={editCostCenterId || "none"} onValueChange={(v: any) => setEditCostCenterId(v === "none" ? null : v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="선택 안함">
                      {editCostCenterId ? (costCenters.find(cc => cc.id === editCostCenterId)?.name || editCostCenterId) : "선택 안함"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {costCenters.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">영업 시작일</Label>
                <Input 
                  type="date" 
                  value={editSalesStartDate} 
                  onChange={(e) => setEditSalesStartDate(e.target.value)} 
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">계약 완료일</Label>
                <Input 
                  type="date" 
                  value={editContractDate} 
                  onChange={(e) => setEditContractDate(e.target.value)} 
                  className="h-9"
                />
              </div>
            </div>

            <div className="text-[11px] text-blue-600 bg-blue-50/50 p-2 rounded border border-blue-100">
              * 변경을 원치 않는 필드는 기존 값을 유지하거나 비워두세요.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isPending}>
              취소
            </Button>
            <Button 
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const res = await updateClientDetailsAction(selectedIds, {
                    lead_source: editLeadSource,
                    cost_center_id: editCostCenterId,
                    sales_start_date: editSalesStartDate || undefined,
                    contract_date: editContractDate || undefined,
                  });
                  if (res.error) {
                    toast.error(res.error);
                  } else {
                    toast.success("세부 정보가 반영되었습니다.");
                    setRowSelection({});
                    setIsEditOpen(false);
                  }
                });
              }}
            >
              {isPending ? "저장 중..." : "수정 완료"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 품의 링크 등록 모달 */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>계약 품의 링크 등록</DialogTitle>
            <DialogDescription>
              선택한 고객사들에 대한 그룹웨어 품의 링크 또는 외부 URL을 등록합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">선택된 고객사</Label>
              <div className="p-2 border rounded bg-gray-50 text-xs font-medium max-h-20 overflow-y-auto">
                {selectedClientNames || "선택된 고객사가 없습니다."}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval_link" className="text-sm font-medium">품의 링크 URL</Label>
              <Input
                id="approval_link"
                placeholder="https://..."
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
              />
              <p className="text-[11px] text-gray-400">
                * 해당 링크는 리스트의 &quot;바로가기&quot; 버튼과 연동됩니다.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)} disabled={isPending}>
              취소
            </Button>
            <Button onClick={handleLinkUpdate} disabled={isPending || !linkValue.trim()}>
              {isPending ? "저장 중..." : "링크 저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable 
        columns={columns} 
        data={filteredData} 
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}

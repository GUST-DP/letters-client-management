"use client";

import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddClientIssueModal, ClientIssueDetailModal } from "./add-client-issue-modal";
import { updateClientOperationIssue, deleteClientOperationIssue } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const ISSUE_CATEGORIES = [
  "입고지연", "바코드오부착", "상품오맵핑", "주문오등록",
  "불용재고회수지연", "입고누락", "입고팔렛트기준미준수", "기타",
];

const STATUS_OPTIONS = ["이슈등록", "조치등록"];

const CATEGORY_COLORS: Record<string, string> = {
  "입고지연": "bg-amber-50 text-amber-600 border-amber-200",
  "바코드오부착": "bg-orange-50 text-orange-600 border-orange-200",
  "상품오맵핑": "bg-rose-50 text-rose-600 border-rose-200",
  "주문오등록": "bg-red-50 text-red-600 border-red-200",
  "불용재고회수지연": "bg-purple-50 text-purple-600 border-purple-200",
  "입고누락": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "입고팔렛트기준미준수": "bg-slate-50 text-slate-600 border-slate-200",
  "기타": "bg-gray-50 text-gray-500 border-gray-200",
};

const STATUS_COLORS: Record<string, string> = {
  "이슈등록": "bg-rose-50 text-rose-600 border-rose-200",
  "조치등록": "bg-emerald-50 text-emerald-600 border-emerald-200",
};

interface ClientIssueTableProps {
  data: any[];
  clients: { id: string; company_name: string }[];
  userEmail: string;
  userName: string;
  onRowClick?: (issue: any) => void;
  selectedId?: string | null;
  onDeleteSuccess?: () => void;
}

export function ClientIssueTable({ 
  data, 
  clients, 
  userEmail, 
  userName, 
  onRowClick, 
  selectedId,
  onDeleteSuccess
}: ClientIssueTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterClient, setFilterClient] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailIssue, setDetailIssue] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const router = useRouter();

  const uniqueClients = useMemo(() =>
    Array.from(new Set(data.map(d => d.clients?.company_name).filter(Boolean))).sort(),
    [data]
  );

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterClient !== "all" && item.clients?.company_name !== filterClient) return false;
      if (filterCategory !== "all" && item.issue_category !== filterCategory) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (startDate && item.occurrence_date < startDate) return false;
      if (endDate && item.occurrence_date > endDate) return false;
      return true;
    });
  }, [data, filterClient, filterCategory, filterStatus, startDate, endDate]);

  const handleExport = () => {
    const headers = ["No", "발생일", "고객사", "이슈유형", "이슈내용", "책임주체", "진행상태", "조치내용", "등록자"];
    const rows = filteredData.map((item, i) => [
      i + 1,
      `"${item.occurrence_date || ""}"`,
      `"${item.clients?.company_name || ""}"`,
      `"${item.issue_category || ""}"`,
      `"${(item.issue_content || "").replace(/"/g, '""')}"`,
      `"${item.responsible_party || ""}"`,
      `"${item.status || ""}"`,
      `"${(item.action_taken || "").replace(/"/g, '""')}"`,
      `"${item.author_name || ""}"`,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `고객사이슈관리_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteClientOperationIssue(deleteTarget);
    setIsDeleting(false);
    setDeleteTarget(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("이슈가 삭제되었습니다.");
      onDeleteSuccess?.();
      router.refresh();
    }
  };

  const handleOpenDetail = (item: any) => {
    setDetailIssue(item);
    setIsDetailOpen(true);
  };

  return (
    <div className="p-3 space-y-3">
      {/* 이슈 내역 섹션 헤더 */}
      <div className="flex items-end justify-between px-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-slate-800 rounded-full" />
            <h2 className="text-sm font-black text-slate-800 tracking-tight">이슈 내역</h2>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-nowrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
            <label className="text-[11px] font-black text-slate-400 uppercase whitespace-nowrap">조회기간</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-8 px-2 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-slate-50 focus:outline-none w-[110px]"
              />
              <span className="text-slate-300 font-bold">-</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-8 px-2 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-slate-50 focus:outline-none w-[110px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
            <label className="text-[11px] font-black text-slate-400 uppercase whitespace-nowrap">고객사</label>
            <SearchableSelect
              options={[
                { value: "all", label: "전체" },
                ...uniqueClients.map(c => ({ value: c as string, label: c as string }))
              ]}
              value={filterClient}
              onValueChange={v => setFilterClient(v ?? "all")}
              placeholder="전체"
              className="w-[140px] h-8 bg-slate-50 border-slate-100 text-[11px] font-bold"
            />
          </div>

          <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
            <label className="text-[11px] font-black text-slate-400 uppercase whitespace-nowrap">이슈유형</label>
            <Select value={filterCategory} onValueChange={(v) => v && setFilterCategory(v)}>
              <SelectTrigger className="w-[120px] h-8 bg-slate-50 border-slate-100 text-[11px] font-bold">
                <SelectValue>{filterCategory === "all" ? "전체" : filterCategory}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {ISSUE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 min-w-max">
            <label className="text-[11px] font-black text-slate-400 uppercase whitespace-nowrap">상태</label>
            <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
              <SelectTrigger className="w-[90px] h-8 bg-slate-50 border-slate-100 text-[11px] font-bold">
                <SelectValue>{filterStatus === "all" ? "전체" : filterStatus}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 text-xs font-bold gap-1.5 border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            엑셀 다운로드
          </Button>
          {selectedId && (
            <Button
              variant="default"
              size="sm"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteTarget(selectedId);
              }}
              className="bg-[#414344] text-white hover:bg-rose-600 transition-colors gap-1.5 h-9 px-3 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              이슈 삭제
            </Button>
          )}
          <AddClientIssueModal clients={clients} userEmail={userEmail} userName={userName} />
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-max">
            <thead className="bg-slate-800">
              <tr>
                {["No", "발생일", "고객사", "이슈유형", "이슈내용(요약)", "첨부", "책임주체", "진행상태", "등록자"].map(h => (
                  <th key={h} className="h-12 px-4 text-center font-black text-slate-300 border-r border-slate-700/50 last:border-r-0 text-[12px] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-[220px] text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="font-bold text-slate-400">등록된 이슈 내역이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-slate-100 transition-colors cursor-pointer group animate-in fade-in duration-300",
                        isSelected ? "bg-orange-50/80 hover:bg-orange-50" : "hover:bg-slate-50/50"
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      <td className="py-2.5 px-4 border-r border-slate-100 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 text-center font-bold text-slate-700 whitespace-nowrap">{item.occurrence_date}</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 font-bold text-slate-800 whitespace-nowrap">{item.clients?.company_name || "-"}</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 text-center">
                        <Badge variant="outline" className={cn("font-bold text-[11px] whitespace-nowrap", CATEGORY_COLORS[item.issue_category] || "bg-gray-50 text-gray-500")}>
                          {item.issue_category}
                        </Badge>
                      </td>
                      <td 
                        className="py-2.5 px-4 border-r border-slate-100 font-bold text-slate-700 max-w-[200px] truncate hover:text-[#ff5c39] hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item);
                        }}
                      >
                        {item.title || item.issue_content?.substring(0, 30)}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-100 text-center">
                        {item.file_url ? (
                          <div className="flex justify-center">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                               <Paperclip className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-200">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 border-r border-slate-100 text-center text-slate-600 font-bold whitespace-nowrap">{item.responsible_party || "-"}</td>
                      <td className="py-2.5 px-4 border-r border-slate-100 text-center">
                        <Badge variant="outline" className={cn("font-bold text-[11px] whitespace-nowrap", STATUS_COLORS[item.status] || "")}>
                          {item.status || "이슈등록"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-500 whitespace-nowrap font-medium">{item.author_name || "-"}</td>
                    </tr>
                  )
                })
              )}
              {/* 하이라이트를 위해 공백 행 유지 (약간의 높이 확보) */}
              {filteredData.length > 0 && filteredData.length < 5 &&
                Array.from({ length: 5 - filteredData.length }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-slate-50 last:border-0 hover:bg-transparent">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-2.5 px-4 border-r border-slate-50 last:border-r-0 h-[45px]">&nbsp;</td>
                    ))}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 카운터 */}
      <div className="flex items-center justify-between px-2">
        <div className="bg-slate-100 px-3 py-1 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-tighter">
          Total {filteredData.length}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-black">
              <Trash2 className="w-5 h-5" /> 이슈 삭제 확인
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              해당 이슈를 삭제하면 복구할 수 없습니다. 계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="font-bold">취소</Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 rounded-xl"
            >
              {isDeleting ? "삭제 중..." : "위험 인지 후 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ClientIssueDetailModal 
        issue={detailIssue} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
      />
    </div>
  );
}

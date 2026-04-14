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
import { getIssueColumns } from "./issue-columns";
import { AddIssueModal, IssueDetailModal } from "./add-issue-modal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { deleteIssue } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FileText, ListFilter, Trash2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface IssueTableProps {
  data: any[];
  clients: { id: string; company_name: string }[];
  teams: string[];
  userEmail: string;
  userName: string;
  onRowClick?: (issue: any) => void;
  onDeleteSuccess?: () => void;
  selectedId?: string | null;
}

export function IssueTable({ data, clients, teams, userEmail, userName, onRowClick, onDeleteSuccess, selectedId }: IssueTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterClient, setFilterClient] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detailIssue, setDetailIssue] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  // Filtering
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 고객사 필터
      if (filterClient !== "all") {
        const clientName = item.client?.company_name;
        if (clientName !== filterClient) return false;
      }
      
      // 기간 조회 필터
      if (startDate && item.occurrence_date < startDate) return false;
      if (endDate && item.occurrence_date > endDate) return false;

      return true;
    });
  }, [data, filterClient, startDate, endDate]);

  const handleExportExcel = () => {
    const headers = [
      "No", "발생일", "진행상태", "고객사", "이슈유형", 
      "건명", "이슈내용", "발생주체", "발생원인", 
      "담당자 및 권역장", "시공팀", "이슈등록자"
    ];

    const rows = filteredData.map((item, index) => [
      index + 1,
      `"${item.occurrence_date || ""}"`,
      `"${item.status || ""}"`,
      `"${item.client?.company_name || ""}"`,
      `"${item.issue_type || ""}"`,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      `"${(item.issue_content || "").replace(/"/g, '""')}"`,
      `"${item.occurrence_subject || ""}"`,
      `"${item.root_cause || ""}"`,
      `"${item.manager_name || ""}"`,
      `"${item.construction_team || ""}"`,
      `"${item.author_name || ""}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `고객사이슈관리_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteIssue(id);
      if (result.error) {
        toast.error("삭제 실패: " + result.error);
      } else {
        toast.success("이슈가 삭제되었습니다.");
        onDeleteSuccess?.();
        router.refresh();
      }
    } catch (err: any) {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleOpenDetail = (issue: any) => {
    setDetailIssue(issue);
    setIsDetailOpen(true);
  };

  const columns = useMemo(() => getIssueColumns(handleOpenDetail, handleDelete), []);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      sorting,
    },
  });

  const uniqueClientNames = useMemo(() => {
    return Array.from(new Set(data.map(d => d.client?.company_name).filter(Boolean)));
  }, [data]);

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

      {/* 필터 및 액션 바 */}
      <div className="flex flex-nowrap items-center justify-between bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto min-w-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 shrink-0">
            <label className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">조회기간</label>
            <div className="flex items-center gap-1">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="h-8 px-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 bg-slate-50 focus:outline-none w-[100px]"
              />
              <span className="text-slate-300 font-bold">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="h-8 px-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 bg-slate-50 focus:outline-none w-[100px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">고객사</label>
            <SearchableSelect
              options={[
                { value: "all", label: "전체" },
                ...uniqueClientNames.map(c => ({ value: String(c), label: String(c) }))
              ]}
              value={filterClient}
              onValueChange={(val) => setFilterClient(val ?? "all")}
              placeholder="전체"
              className="w-[120px] h-8 bg-slate-50 border-slate-100 text-[10px] font-bold"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
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
          {selectedId && (
            <Button
              variant="default"
              size="sm"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
              className="bg-[#414344] text-white hover:bg-rose-600 transition-colors gap-1.5 h-8 px-3 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              이슈 삭제
            </Button>
          )}
          <AddIssueModal clients={clients} teams={teams} userEmail={userEmail} userName={userName} />
        </div>
      </div>

      {/* 테이블 영역과 페이징을 하나로 묶어 간격 축소 */}
      <div className="space-y-2">
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="overflow-x-auto">
          <Table className="text-[13px] min-w-max border-collapse">
            <TableHeader className="bg-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id}
                      className="h-12 text-center font-black text-slate-300 border-r border-slate-700/50 last:border-r-0 text-[12px] uppercase tracking-wider px-4 whitespace-nowrap"
                      style={{ 
                        width: header.getSize(), 
                        minWidth: header.getSize(), 
                        maxWidth: header.getSize() 
                      }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                <>
                  {table.getRowModel().rows.map((row) => {
                    const isSelected = selectedId === row.original.id;
                    return (
                      <TableRow
                        key={row.id}
                        onClick={() => onRowClick?.(row.original)}
                        className={cn(
                          "border-b border-slate-100 transition-all cursor-pointer group",
                          isSelected ? "bg-blue-50/80 hover:bg-blue-50" : "hover:bg-slate-50/50"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell 
                            key={cell.id}
                            className={cn(
                              "py-2.5 px-4 border-r border-slate-100 last:border-r-0 align-middle",
                              isSelected && "border-blue-100"
                            )}
                            style={{ width: cell.column.getSize(), minWidth: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {/* 공백 행 추가 (개수가 5개 미만일 경우) */}
                  {table.getRowModel().rows.length < 5 && (
                    Array.from({ length: 5 - table.getRowModel().rows.length }).map((_, i) => (
                      <TableRow key={`empty-${i}`} className="border-b border-slate-50 last:border-0 hover:bg-transparent">
                        {columns.map((_, colIdx) => (
                          <TableCell key={`empty-cell-${i}-${colIdx}`} className="py-2.5 px-4 border-r border-slate-50 last:border-r-0 h-[45px]">
                            &nbsp;
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-[225px] text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="font-bold text-slate-400">등록된 이슈 내역이 없습니다.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 페이징 컨트롤 */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 px-3 py-1 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-tighter">
            Total {filteredData.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg h-8 px-4 shadow-sm">
             <span className="text-[13px] font-black text-slate-800">{table.getState().pagination.pageIndex + 1}</span>
             <span className="text-[11px] font-bold text-slate-300 mx-2">/</span>
             <span className="text-[13px] font-bold text-slate-400">{table.getPageCount() || 1}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-rose-600 tracking-tight">
              <Trash2 className="w-5 h-5" />
              이슈 삭제 확인
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
              정말로 해당 이슈를 삭제하시겠습니까?<br/>
              삭제된 데이터는 <strong className="text-slate-800">영구적으로 복구할 수 없습니다.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-10 px-6 font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (selectedId) handleDelete(selectedId);
              }}
              disabled={isDeleting}
              className="h-10 px-6 font-black text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 w-auto rounded-xl transition-all"
            >
              {isDeleting ? "삭제 중..." : "위험성 인지 후 삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IssueDetailModal 
        issue={detailIssue} 
        clients={clients} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
      />
    </div>
  );
}

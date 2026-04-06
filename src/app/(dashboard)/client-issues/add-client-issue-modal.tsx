"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createClientOperationIssue } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ISSUE_CATEGORIES = [
  "입고지연",
  "바코드오부착",
  "상품오맵핑",
  "주문오등록",
  "불용재고회수지연",
  "입고누락",
  "입고팔렛트기준미준수",
  "기타",
];

const RESPONSIBLE_PARTIES = ["고객사", "레터스", "공동"];

interface AddClientIssueModalProps {
  clients: { id: string; company_name: string }[];
  userEmail: string;
  userName: string;
  defaultClientId?: string;
}

export function AddClientIssueModal({
  clients,
  userEmail,
  userName,
  defaultClientId,
}: AddClientIssueModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [issueCategory, setIssueCategory] = useState("");
  const [issueContent, setIssueContent] = useState("");
  const [responsibleParty, setResponsibleParty] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // 모달이 열릴 때마다 오늘 날짜로 동기화 (KST 등 현지 시간 기준)
  useEffect(() => {
    if (open) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setOccurrenceDate(`${year}-${month}-${day}`);
    }
  }, [open, defaultClientId]);

  const resetForm = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setOccurrenceDate(`${year}-${month}-${day}`);
    setClientId(defaultClientId ?? "");
    setIssueCategory("");
    setIssueContent("");
    setResponsibleParty("");
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !issueCategory || !issueContent) {
      toast.error("필수 항목(고객사, 이슈유형, 이슈내용)을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("client_id", clientId);
    fd.append("occurrence_date", occurrenceDate);
    fd.append("issue_category", issueCategory);
    fd.append("issue_content", issueContent);
    fd.append("responsible_party", responsibleParty);
    fd.append("author_name", userName);
    fd.append("author_email", userEmail);
    if (file) fd.append("file", file);

    const result = await createClientOperationIssue(fd);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("이슈가 등록되었습니다.");
      setOpen(false);
      resetForm();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-black ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#ff5c39] hover:bg-[#e04f32] text-white h-9 px-4 shadow-lg shadow-[#ff5c39]/20"
      >
        <Plus className="w-4 h-4" />
        이슈 신규등록
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl shadow-2xl border-0">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-2 h-5 bg-orange-500 rounded-full inline-block" />
            고객사 이슈 신규 등록
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                발생일 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={occurrenceDate}
                onChange={(e) => setOccurrenceDate(e.target.value)}
                className="h-10 border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                이슈유형 <span className="text-red-500">*</span>
              </Label>
              <Select value={issueCategory} onValueChange={(v) => v && setIssueCategory(v)} required>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="이슈 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                고객사 <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={clients.map((c) => ({ value: c.id, label: c.company_name }))}
                value={clientId}
                onValueChange={setClientId}
                placeholder="고객사 선택"
                className="h-10 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                책임주체
              </Label>
              <Select value={responsibleParty} onValueChange={(v) => v && setResponsibleParty(v)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="책임주체 선택" />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_PARTIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">
              이슈 내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={issueContent}
              onChange={(e) => setIssueContent(e.target.value)}
              placeholder="이슈 상세 내용을 입력하세요"
              className="min-h-[100px] border-slate-200 resize-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black text-slate-500 uppercase tracking-wider">
              첨부파일
            </Label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="h-10 border-slate-200 text-xs file:text-[10px] file:font-black file:bg-slate-100 file:border-0 file:rounded-md file:mr-2 file:px-2 file:py-1 cursor-pointer"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); resetForm(); }}
              className="font-bold"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#ff5c39] hover:bg-[#e04f32] text-white font-black px-8"
            >
              {isSubmitting ? "등록 중..." : "이슈 등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ClientIssueDetailModal({
  issue,
  open,
  onOpenChange,
}: {
  issue: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 relative">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-[#ff5c39]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#ff5c39]" />
             </div>
             <div className="flex flex-col">
               <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">이슈 상세 내용</DialogTitle>
               <DialogDescription className="text-xs font-bold text-slate-400">등록된 이슈의 전문을 확인하실 수 있습니다.</DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <div className="space-y-4">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">고객사 정보</span>
                 <span className="text-base font-black text-slate-800 bg-white border border-slate-100 px-4 py-2.5 rounded-xl shadow-sm inline-block">{issue.clients?.company_name}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">발생 일자</span>
                 <span className="text-sm font-bold text-slate-700 bg-white border border-slate-100 px-4 py-2.5 rounded-xl shadow-sm inline-block">{issue.occurrence_date}</span>
               </div>
            </div>
            <div className="space-y-4">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">이슈 유형</span>
                 <span className="text-sm font-bold text-slate-700 bg-white border border-slate-100 px-4 py-2.5 rounded-xl shadow-sm inline-block">{issue.issue_category}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">책임 주체</span>
                 <span className="text-sm font-bold text-slate-700 bg-white border border-slate-100 px-4 py-2.5 rounded-xl shadow-sm inline-block">{issue.responsible_party || "-"}</span>
               </div>
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-4 bg-[#ff5c39] rounded-full" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">이슈 상세 내용 (Issue Content)</h3>
             </div>
             <div className="bg-slate-50/30 border border-slate-100 p-6 rounded-3xl shadow-inner-sm">
                <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{issue.issue_content}</p>
             </div>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 text-slate-400">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-slate-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-tighter">등록자</span>
                      <span className="text-[11px] font-bold text-slate-600">{issue.author_name}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   {issue.file_url && (
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tighter">첨부파일</span>
                        <a 
                          href={issue.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          파일 확인하기 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                     </div>
                   )}
                </div>
             </div>
             <div className="text-[11px] font-bold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 uppercase tracking-tighter">
                STATUS: {issue.status || "이슈등록"}
             </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-slate-900 hover:bg-black text-white font-black h-12 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            대화창 닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

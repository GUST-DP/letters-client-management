"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, ExternalLink, Paperclip } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createClientOperationIssue } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const ISSUE_CATEGORIES = [
  "입출고 시간 미준수",
  "바코드 오/미부착",
  "상품오맵핑",
  "주문오등록",
  "불용재고회수지연",
  "수작업 입/출고",
  "이형 팔레트 입고",
  "입고 계획 오/미등록",
  "하자품입고",
  "부족분",
  "입고 높이 미준수",
  "입고 후 패킹",
];

const RESPONSIBLE_PARTIES = ["배송/조립팀", "물류작업가", "고객", "시스템"];

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
    
    try {
      let file_url = null;
      let file_name = null;

      // 클라이언트 측에서 Supabase Storage로 직접 업로드 (Vercel 페이로드 제한 우회)
      if (file) {
        // 파일 크기 제한 (예: 20MB)
        if (file.size > 20 * 1024 * 1024) {
          toast.error("파일 크기가 너무 큽니다. (최대 20MB)");
          setIsSubmitting(false);
          return;
        }

        const supabase = createClient();
        const fileExt = file.name.split(".").pop();
        const fileName = `op_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `operation_issues/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("issue_attachments")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("파일 업로드 중에 오류가 발생했습니다.");
        }

        const { data: { publicUrl } } = supabase.storage
          .from("issue_attachments")
          .getPublicUrl(filePath);

        file_url = publicUrl;
        file_name = file.name;
      }

      const fd = new FormData();
      fd.append("client_id", clientId);
      fd.append("occurrence_date", occurrenceDate);
      fd.append("issue_category", issueCategory);
      fd.append("issue_content", issueContent);
      fd.append("responsible_party", responsibleParty);
      fd.append("author_name", userName);
      fd.append("author_email", userEmail);
      if (file_url) fd.append("file_url", file_url);
      if (file_name) fd.append("file_name", file_name);

      const result = await createClientOperationIssue(fd);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("이슈가 등록되었습니다.");
        setOpen(false);
        resetForm();
        router.refresh();
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-black ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#ff5c39] hover:bg-[#e04f32] text-white h-9 px-4 shadow-lg shadow-[#ff5c39]/20"
      >
        <Plus className="w-4 h-4" />
        이슈등록
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
                발생주체
              </Label>
              <Select value={responsibleParty} onValueChange={(v) => v && setResponsibleParty(v)}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="발생주체 선택" />
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
            <Button type="submit" disabled={isSubmitting} className="h-10 bg-[#ff5c39] hover:bg-[#e04f32] text-white text-sm px-12 font-black shadow-lg shadow-[#ff5c39]/20 transition-all active:scale-95">
              {isSubmitting ? "처리 중..." : "이슈등록"}
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
      <DialogContent className="max-w-[800px] w-[90vw] max-h-[95vh] overflow-y-auto p-6 bg-white border border-slate-100 shadow-2xl rounded-2xl">
        <DialogHeader className="mb-4 text-left border-b pb-3">
          <div className="flex items-center gap-3">
             <div className="w-2 h-6 bg-slate-800 rounded-full" />
             <DialogTitle className="text-xl font-black tracking-tight text-slate-800">
               이슈 상세 내역 조회
             </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* 기본 정보 (4열 그리드) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">발생일</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.occurrence_date}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">고객사</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.clients?.company_name || "-"}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">이슈유형</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.issue_category}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">발생주체</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.responsible_party || "-"}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">등록자</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.author_name}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">진행상태</Label>
              {(() => {
                const val = issue.status || "이슈등록";
                const isCompleted = val === "조치등록" || val === "조치완료";
                return (
                  <div className={cn(
                    "h-9 flex items-center px-3 rounded-lg text-xs font-black",
                    isCompleted 
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-600" 
                      : "bg-rose-50 border border-rose-100 text-rose-600"
                  )}>
                    {isCompleted ? "조치등록" : "이슈등록"}
                  </div>
                );
              })()}
            </div>
            {issue.file_url && (
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">이슈 첨부파일</Label>
                <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                  <a 
                    href={issue.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors w-full group"
                  >
                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{issue.file_name || "첨부파일 보기"}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 hidden sm:block" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 이슈 상세 내용 */}
          <div className="pt-3 border-t border-slate-100">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">이슈 상세 내용</Label>
              <div className="min-h-[100px] p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
                {issue.issue_content}
              </div>
            </div>
          </div>

          {/* 조치내용 & 재발방지 대책 (데이터 있을 때만 표시) */}
          {(issue.action_taken || issue.preventive_measure) && (
            <div className="pt-3 border-t border-emerald-100 space-y-4">
              {issue.action_taken && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">상세 조치 내용</Label>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/30 border border-emerald-100 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                    {issue.action_taken}
                  </div>
                </div>
              )}
              
              {issue.preventive_measure && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    <Label className="text-[10px] font-black text-amber-600 uppercase tracking-wider">재발방지 대책</Label>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-100 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                    {issue.preventive_measure}
                  </div>
                </div>
              )}

              {issue.response_file_url && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-3.5">조치 증빙 첨부파일</Label>
                  <div className="h-9 flex items-center px-3 rounded-lg bg-emerald-50 border border-emerald-100 overflow-hidden mx-3.5">
                    <a 
                      href={issue.response_file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors w-full group"
                    >
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{issue.response_file_name || "증빙 파일 보기"}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end px-3.5">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase">
                  Updated: {issue.updated_at ? new Date(issue.updated_at).toLocaleDateString() : "-"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button type="button" onClick={() => onOpenChange(false)} className="h-9 bg-slate-900 hover:bg-black text-white px-8 font-black rounded-lg text-xs">
              확인 완료
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}


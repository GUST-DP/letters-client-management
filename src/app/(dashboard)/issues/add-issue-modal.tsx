"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Paperclip, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIssue } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface AddIssueModalProps {
  clients: { id: string; company_name: string }[];
  teams: string[];
  userEmail: string;
  userName: string;
}

const ISSUE_TYPES = [
  "조립/배송 스킬부족", "서비스 마인드 결여", "고객사 비하발언", "고객사와 트러블", "기준 미준수", "고객사유물파손", "작업누락", "기타"
];

const SUBJECTS = [
  "배송/조립 팀", "물류작업자", "고객", "시스템", "관리자"
];

const ROOT_CAUSES = [
  "관리미흡", "프로세스 부재", "교육부재", "기타"
];

export function AddIssueModal({ clients, teams, userEmail, userName }: AddIssueModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form states
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueContent, setIssueContent] = useState("");
  const [occurrenceSubject, setOccurrenceSubject] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [title, setTitle] = useState("");
  const [managerName, setManagerName] = useState("");
  const [constructionTeam, setConstructionTeam] = useState("");
  const [fuRequiredTeam, setFuRequiredTeam] = useState("");
  const [status, setStatus] = useState("이슈등록");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occurrenceDate || !clientId || !issueType || !issueContent || !occurrenceSubject || !rootCause || !title || !managerName || !constructionTeam) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    
    const fd = new FormData();
    fd.append('occurrence_date', occurrenceDate);
    fd.append('client_id', clientId);
    fd.append('issue_type', issueType);
    fd.append('issue_content', issueContent);
    fd.append('occurrence_subject', occurrenceSubject);
    fd.append('root_cause', rootCause);
    fd.append('title', title);
    fd.append('manager_name', managerName);
    fd.append('construction_team', constructionTeam);
    fd.append('fu_required_team', fuRequiredTeam);
    fd.append('author_name', userName);
    if (file) fd.append('file', file);

    const result = await createIssue(fd);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("이슈가 등록되었습니다.");
      setOpen(false);
      resetForm();
      router.refresh();
    }
    
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setOccurrenceDate("");
    setClientId("");
    setIssueType("");
    setIssueContent("");
    setOccurrenceSubject("");
    setRootCause("");
    setTitle("");
    setManagerName("");
    setConstructionTeam("");
    setFuRequiredTeam("");
    setStatus("이슈등록");
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm", variant: "default" }), "bg-[#414344] text-white hover:bg-[#ff5c39] transition-colors gap-1.5 h-8 px-3 rounded-lg text-sm cursor-pointer")}>
        <Plus className="w-4 h-4" />
        이슈 등록
      </DialogTrigger>
      <DialogContent className="max-w-[1000px] w-[90vw] max-h-[95vh] overflow-y-auto p-8 bg-white border border-slate-100 shadow-2xl rounded-2xl">
        <DialogHeader className="mb-6 text-left border-b pb-4">
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
            신규 이슈 등록
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 (4열 그리드) */}
          <div className="grid grid-cols-4 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">발생일 <span className="text-red-500">*</span></Label>
              <Input type="date" required value={occurrenceDate} onChange={e => setOccurrenceDate(e.target.value)} className="h-11 text-sm border-slate-200 shadow-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">고객사 <span className="text-red-500">*</span></Label>
              <SearchableSelect
                options={clients.map(c => ({ value: c.id, label: c.company_name }))}
                value={clientId}
                onValueChange={setClientId}
                placeholder="고객사 선택"
                className="h-11 shadow-sm w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">이슈유형 <span className="text-red-500">*</span></Label>
              <Select value={issueType} onValueChange={(val) => setIssueType(val || "")} required>
                <SelectTrigger className="h-11 text-sm border-slate-200 shadow-sm">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">발생주체 <span className="text-red-500">*</span></Label>
              <Select value={occurrenceSubject} onValueChange={(val) => setOccurrenceSubject(val || "")} required>
                <SelectTrigger className="h-11 text-sm border-slate-200 shadow-sm">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">발생원인 <span className="text-red-500">*</span></Label>
              <Select value={rootCause} onValueChange={(val) => setRootCause(val || "")} required>
                <SelectTrigger className="h-11 text-sm border-slate-200 shadow-sm">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {ROOT_CAUSES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">건명 <span className="text-red-500">*</span></Label>
              <Input placeholder="이슈 건명 입력" required value={title} onChange={e => setTitle(e.target.value)} className="h-11 text-sm font-semibold border-slate-200 shadow-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">담당자 및 권역장 <span className="text-red-500">*</span></Label>
              <Input placeholder="이름" required value={managerName} onChange={e => setManagerName(e.target.value)} className="h-11 text-sm border-slate-200 shadow-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">시공팀 <span className="text-red-500">*</span></Label>
              <Input placeholder="팀명" required value={constructionTeam} onChange={e => setConstructionTeam(e.target.value)} className="h-11 text-sm border-slate-200 shadow-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">이슈등록자</Label>
              <Input value={userName} disabled className="h-11 text-sm bg-slate-50 text-slate-600 font-bold border-slate-200" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">첨부파일</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="file-upload" 
                  type="file" 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} 
                  className="h-11 text-sm cursor-pointer file:text-xs file:font-bold border-slate-200 flex-1" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 whitespace-nowrap">F/U 필요팀</Label>
              <Select value={fuRequiredTeam} onValueChange={(val) => setFuRequiredTeam(val || "")}>
                <SelectTrigger className="h-11 text-sm border-slate-200 shadow-sm bg-blue-50/30">
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">이슈 상세 내용 <span className="text-red-500">*</span></Label>
              <Textarea placeholder="발생된 이슈를 육하원칙에 따라 상세히 기재해주세요." required value={issueContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIssueContent(e.target.value)} className="min-h-[150px] text-sm resize-none border-slate-200 shadow-sm focus:ring-1 focus:ring-[#ff5c39]/30" />
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-100">
            <div className="flex w-full items-center justify-between">
              <p className="text-[11px] text-slate-400 font-medium">* 필수 정보 입력 후 이슈를 등록해 주세요. 조치 사항은 목록에서 선택하여 입력 가능합니다.</p>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10 text-sm px-8 font-bold border-slate-200 hover:bg-slate-50 transition-all text-slate-600">
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting} className="h-10 bg-[#ff5c39] hover:bg-[#e04f32] text-white text-sm px-12 font-black shadow-lg shadow-[#ff5c39]/20 transition-all active:scale-95">
                  {isSubmitting ? "처리 중..." : "이슈 등록하기"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function IssueDetailModal({ issue, clients, open, onOpenChange }: { 
  issue: any, 
  clients: any[], 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  if (!issue) return null;
  
  const clientName = clients.find(c => c.id === issue.client_id)?.company_name || issue.client?.company_name || "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] w-[90vw] max-h-[95vh] overflow-y-auto p-6 bg-white border border-slate-100 shadow-2xl rounded-2xl">
        <DialogHeader className="mb-4 text-left border-b pb-3">
          <div className="flex items-center gap-3">
             <div className="w-2 h-6 bg-slate-800 rounded-full" />
             <DialogTitle className="text-xl font-black tracking-tight text-slate-800">
               이슈 상세 내역 조회
             </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">발생일</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.occurrence_date}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">고객사</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{clientName}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">이슈유형</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.issue_type}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">발생주체</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.occurrence_subject}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">발생원인</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.root_cause}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">건명</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.title}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">담당자 및 권역장</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.manager_name}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">시공팀</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.construction_team}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">이슈등록자</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.author_name}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">진행상태</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-blue-50 border border-blue-100 text-xs font-black text-blue-600">{issue.status}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase">F/U 필요팀</Label>
              <div className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">{issue.fu_required_team || "-"}</div>
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
            {issue.response_file_url && (
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">조치 증빙 첨부파일</Label>
                <div className="h-9 flex items-center px-3 rounded-lg bg-emerald-50 border border-emerald-100 overflow-hidden">
                  <a 
                    href={issue.response_file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors w-full group"
                  >
                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{issue.response_file_name || "첨부파일 보기"}</span>
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
            <div className="pt-3 border-t border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">조치 내역</span>
              </div>
              {issue.action_taken && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">조치내용</Label>
                  <div className="min-h-[80px] p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {issue.action_taken}
                  </div>
                </div>
              )}
              {issue.preventive_measure && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-amber-500 uppercase tracking-wider">재발방지 대책</Label>
                  <div className="min-h-[80px] p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {issue.preventive_measure}
                  </div>
                </div>
              )}
              {issue.responder_name && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-black text-slate-400">답변등록자</span>
                  <span className="font-bold text-slate-600">{issue.responder_name}</span>
                </div>
              )}
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


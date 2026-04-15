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
import { useEffect } from "react";
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
import { createClient } from "@/utils/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn, parseFiles } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface AddIssueModalProps {
  clients: { id: string; company_name: string }[];
  teams: string[];
  userEmail: string;
  userName: string;
}

const ISSUE_TYPES = [
  "배송/조립 스킬 미흡",
  "서비스품질 미흡",
  "고객사 이미지 훼손",
  "고객사와의 마찰",
  "프로세스 미준수",
  "고객사유물 파손",
];

const SUBJECTS = [
  "배송/조립팀",
  "물류작업자",
  "고객",
  "시스템",
];

const ROOT_CAUSES = [
  "관리미흡", "프로세스 부재", "교육부재", "기타"
];

export function AddIssueModal({ clients, teams, userEmail, userName }: AddIssueModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form states
  const [occurrenceDate, setOccurrenceDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [files, setFiles] = useState<File[]>([]);

  // 모달이 열릴 때마다 오늘 날짜로 동기화 (KST 등 현지 시간 기준)
  useEffect(() => {
    if (open) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setOccurrenceDate(`${year}-${month}-${day}`);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occurrenceDate || !clientId || !issueType || !issueContent || !occurrenceSubject || !rootCause || !title || !managerName || !constructionTeam) {
      toast.error("필수 항목을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let file_urls: string[] = [];
      let file_names: string[] = [];

      if (files.length > 0) {
        const supabase = createClient();

        await Promise.all(files.map(async (f) => {
          if (f.size > 20 * 1024 * 1024) {
             throw new Error(`파일 크기가 너무 큽니다. (최대 20MB): ${f.name}`);
          }
          const fileExt = f.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `issues/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('issue_attachments')
            .upload(filePath, f);

          if (uploadError) {
            console.error('File upload error:', uploadError);
            throw new Error(`파일 업로드 중에 오류가 발생했습니다: ${f.name}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('issue_attachments')
            .getPublicUrl(filePath);

          file_urls.push(publicUrl);
          file_names.push(f.name);
        }));
      }
      
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
      if (file_urls.length > 0) fd.append('file_url', JSON.stringify(file_urls));
      if (file_names.length > 0) fd.append('file_name', JSON.stringify(file_names));

      const result = await createIssue(fd);

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

  const resetForm = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setOccurrenceDate(`${year}-${month}-${day}`);
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
    setFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm", variant: "default" }), "bg-[#ff5c39] text-white hover:bg-[#e04f32] transition-colors gap-1.5 h-8 px-3 rounded-lg text-sm cursor-pointer shadow-lg shadow-[#ff5c39]/20")}>
        <Plus className="w-4 h-4" />
        이슈등록
      </DialogTrigger>
      <DialogContent className="max-w-[1000px] w-[90vw] max-h-[95vh] overflow-y-auto p-0 bg-white border-0 shadow-2xl rounded-2xl text-slate-900">
        <DialogHeader className="p-6 border-b border-slate-100">
          <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-2 h-5 bg-orange-500 rounded-full inline-block" />
            서비스 이슈 신규 등록
          </DialogTitle>
        </DialogHeader>
        <div className="p-8">
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
                <div className="flex flex-col gap-2">
                  <input 
                    id="file-upload" 
                    type="file" 
                    multiple
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const selected = Array.from(e.target.files || []);
                      setFiles(prev => {
                          const merged = [...prev, ...selected];
                          if (merged.length > 3) {
                              toast.error("첨부파일은 최대 3개까지만 가능합니다.");
                              return merged.slice(0, 3);
                          }
                          return merged;
                      });
                      e.target.value = '';
                    }} 
                    className="w-full h-11 border border-slate-200 rounded-md text-xs file:text-[10px] file:font-black file:bg-slate-100 file:border-0 file:rounded-md file:mr-2 file:px-2 file:py-1 cursor-pointer bg-white px-3 py-2.5" 
                  />
                  {files.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100 mt-1">
                       <p className="text-[10px] font-bold text-slate-500">📎 {files.length}개의 파일 선택됨</p>
                       <Button type="button" variant="ghost" size="sm" onClick={() => setFiles([])} className="h-5 px-2 text-[10px] text-white bg-slate-300 hover:bg-slate-400 hover:text-white rounded ml-auto font-black">
                         전체 삭제
                       </Button>
                    </div>
                  )}
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
                    {isSubmitting ? "처리 중..." : "이슈등록"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {parseFiles(issue.file_url, issue.file_name).map((f: any, i: number) => (
                    <div key={i} className="h-9 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                      <a 
                        href={f.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors w-full group"
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 hidden sm:block" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {issue.response_file_url && (
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">조치 증빙 첨부파일</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {parseFiles(issue.response_file_url, issue.response_file_name).map((f: any, i: number) => (
                    <div key={i} className="h-9 flex items-center px-3 rounded-lg bg-emerald-50 border border-emerald-100 overflow-hidden">
                      <a 
                        href={f.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors w-full group"
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 hidden sm:block" />
                      </a>
                    </div>
                  ))}
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


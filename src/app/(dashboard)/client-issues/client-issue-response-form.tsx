"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { updateClientOperationIssue } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  MessageSquarePlus, 
  MessageSquareText, 
  ShieldAlert, 
  UserCheck, 
  X, 
  Paperclip, 
  FileText, 
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientIssueResponseFormProps {
  selectedIssue: any | null;
  userEmail: string;
  userName: string;
}

const STATUS_OPTIONS = ["접수완료", "처리중", "처리완료"];

export function ClientIssueResponseForm({ selectedIssue, userEmail, userName }: ClientIssueResponseFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [actionTaken, setActionTaken] = useState("");
  const [preventiveMeasure, setPreventiveMeasure] = useState("");
  const [status, setStatus] = useState("접수완료");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedIssue) {
      setActionTaken(selectedIssue.action_taken || "");
      setPreventiveMeasure(selectedIssue.preventive_measure || "");
      setStatus(selectedIssue.status || "접수완료");
      setFile(null);
      setIsEditing(false);
    } else {
      setActionTaken("");
      setPreventiveMeasure("");
      setStatus("접수완료");
      setFile(null);
      setIsEditing(false);
    }
  }, [selectedIssue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (!actionTaken) {
      toast.error("조치내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    
    const fd = new FormData();
    fd.append('id', selectedIssue.id);
    fd.append('status', status);
    fd.append('action_taken', actionTaken);
    fd.append('preventive_measure', preventiveMeasure);
    if (file) fd.append('file', file);

    const result = await updateClientOperationIssue(fd);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("조치 사항이 저장되었습니다.");
      setIsEditing(false);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl min-h-[460px] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-orange-500 rounded-full" />
          <h2 className="text-base font-black text-slate-800 tracking-tight">상세 조치 내역</h2>
        </div>
        
        {selectedIssue && (
          !isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-slate-900 hover:bg-black text-white font-black px-6 gap-2 rounded-xl shadow-lg"
            >
              <MessageSquarePlus className="w-4 h-4" />
              조치사항 등록/수정
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="border-slate-200 text-slate-600 font-bold gap-2 rounded-xl hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              취소
            </Button>
          )
        )}
      </div>

      {!selectedIssue ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-50 rounded-2xl">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-sm font-bold">목록에서 이슈를 선택하면 상세 내용을 확인하고 조치사항을 등록할 수 있습니다.</p>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                <MessageSquareText className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-white text-[11px] font-black uppercase tracking-wider">조치사항 입력</span>
              </div>
              <div className="p-4">
                <Textarea 
                  placeholder="실제 조치된 상세 내용을 입력하세요." 
                  value={actionTaken} 
                  onChange={e => setActionTaken(e.target.value)} 
                  className="min-h-[140px] text-sm border-slate-100 focus:ring-orange-500/20 resize-none font-medium"
                />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white text-[11px] font-black uppercase tracking-wider">재발방지 대책 입력</span>
              </div>
              <div className="p-4">
                <Textarea 
                  placeholder="향후 동일 이슈 방지를 위한 대책을 입력하세요." 
                  value={preventiveMeasure} 
                  onChange={e => setPreventiveMeasure(e.target.value)} 
                  className="min-h-[140px] text-sm border-slate-100 focus:ring-emerald-500/20 resize-none font-medium"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100">
             <div className="flex items-center gap-8">
               <div className="flex flex-col gap-1.5">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">진행상태</Label>
                 <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                   <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 font-bold text-xs">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="h-12 w-px bg-slate-200" />

               <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">조치 증빙 첨부</Label>
                 <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="text-[11px] h-10 bg-white border-slate-200 file:bg-slate-100 file:border-0 file:text-[10px] file:font-black file:h-full file:mr-3"
                    />
                    {file && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)} className="text-slate-400 px-2 h-10">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                 </div>
               </div>
             </div>

             <Button 
               type="submit" 
               disabled={isSubmitting}
               className="bg-orange-500 hover:bg-orange-600 text-white font-black px-12 h-12 shadow-lg shadow-orange-500/20 rounded-xl"
             >
               {isSubmitting ? "저장 중..." : "조치 결과 저장하기"}
             </Button>
          </div>
        </form>
      ) : (
        /* 조회 모드 */
        <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 h-full">
            <div className="border-r border-slate-100 flex flex-col">
               <div className="bg-slate-800/90 text-white px-5 py-3 flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-orange-400" />
                  <span className="text-[12px] font-black uppercase tracking-widest">조치내용 (Action)</span>
               </div>
               <div className="p-6 flex-1 overflow-y-auto">
                 <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                   {selectedIssue.action_taken || <span className="text-slate-300 italic">아직 등록된 조치내용이 없습니다.</span>}
                 </p>
               </div>
            </div>
            <div className="flex flex-col">
               <div className="bg-slate-800/90 text-white px-5 py-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span className="text-[12px] font-black uppercase tracking-widest">재발방지 대책</span>
               </div>
               <div className="p-6 flex-1 overflow-y-auto">
                 <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                   {selectedIssue.preventive_measure || <span className="text-slate-300 italic">아직 등록된 재발방지대책이 없습니다.</span>}
                 </p>
               </div>
               <div className="mt-auto p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">진행상태</span>
                      <span className={cn(
                        "text-xs font-black",
                        selectedIssue.status === "처리완료" ? "text-emerald-600" : "text-orange-500"
                      )}>{selectedIssue.status || "접수완료"}</span>
                    </div>
                    {selectedIssue.response_file_url && (
                      <>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">첨부파일</span>
                          <a 
                            href={selectedIssue.response_file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            증빙 확인
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                     <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                     <span className="text-[11px] font-bold text-slate-600">{selectedIssue.responder_name || "담당자 미지정"}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

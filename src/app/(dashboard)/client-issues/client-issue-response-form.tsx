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
import { Badge } from "@/components/ui/badge";
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

const STATUS_OPTIONS = ["이슈등록", "조치등록"];

const STATUS_COLORS: Record<string, string> = {
  "이슈등록": "bg-rose-50 text-rose-600 border-rose-200",
  "조치등록": "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export function ClientIssueResponseForm({ selectedIssue, userEmail, userName }: ClientIssueResponseFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [actionTaken, setActionTaken] = useState("");
  const [preventiveMeasure, setPreventiveMeasure] = useState("");
  const [status, setStatus] = useState("이슈등록");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedIssue) {
      setActionTaken(selectedIssue.action_taken || "");
      setPreventiveMeasure(selectedIssue.preventive_measure || "");
      setStatus(selectedIssue.status || "이슈등록");
      setFile(null);
      setIsEditing(false);
    } else {
      setActionTaken("");
      setPreventiveMeasure("");
      setStatus("이슈등록");
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
    fd.append('status', '조치등록'); // 조치 내용 저장 시 무조건 '조치등록'으로 변경
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
          <div className="w-2 h-6 bg-[#ff5c39] rounded-full" />
          <h2 className="text-base font-black text-slate-800 tracking-tight">상세 조치 내역</h2>
        </div>
        
        {selectedIssue && (
          !isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-[#ff5c39] hover:bg-[#e04f32] text-white font-black px-6 gap-2 rounded-xl shadow-lg shadow-[#ff5c39]/20 transition-all active:scale-95"
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
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
            <FileText className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-sm font-bold">목록에서 이슈를 선택하면 상세 내용을 확인하고 조치사항을 등록할 수 있습니다.</p>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                <MessageSquareText className="w-3.5 h-3.5 text-[#ff5c39]" />
                <span className="text-white text-[11px] font-black uppercase tracking-wider">조치사항 입력</span>
              </div>
              <div className="p-4">
                <Textarea 
                  placeholder="실제 조치된 상세 내용을 입력하세요." 
                  value={actionTaken} 
                  onChange={e => setActionTaken(e.target.value)} 
                  className="min-h-[140px] text-sm border-slate-100 focus:ring-[#ff5c39]/20 resize-none font-medium"
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
          
          <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100 shadow-inner-sm">
             <div className="flex items-center gap-8">
               <div className="flex flex-col gap-1.5 opacity-50 grayscale pointer-events-none">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">진행상태 (자동변경)</Label>
                 <div className="w-[140px] h-10 bg-white border border-slate-200 rounded-lg flex items-center px-3 text-xs font-bold text-slate-500">
                   조치등록
                 </div>
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
               className="bg-slate-900 hover:bg-black text-white font-extrabold px-12 h-12 shadow-xl shadow-slate-200 rounded-xl transition-all active:scale-95"
             >
               {isSubmitting ? "저장 중..." : "조치 내용 저장하기"}
             </Button>
          </div>
        </form>
      ) : (
        /* 조회 모드: 표 형식 노출 (이슈 미선택 시에도 표 구조 유지) */
        <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-300">
          <table className="w-full border-collapse">
            <thead className="bg-slate-800">
              <tr className="border-b border-transparent">
                <th className="px-6 py-3 text-left text-[13px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 h-10">
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquareText className="w-3.5 h-3.5 text-orange-400" />
                    조치사항 (Action)
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[13px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 h-10">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                    재발방지 대책
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[13px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-32 h-10">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-400" />
                    진행상태
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[13px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-40 h-10">
                  <div className="flex items-center justify-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    답변등록자
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[13px] font-black text-slate-300 uppercase tracking-wider w-44 h-10">
                  <div className="flex items-center justify-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                    증빙파일
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-6 border-r border-slate-200 align-top max-w-sm">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedIssue?.action_taken || (
                      <span className="text-slate-300 italic">
                        {selectedIssue ? "내용이 없습니다." : "이슈를 선택하면 표시됩니다."}
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-6 py-6 border-r border-slate-200 align-top max-w-sm bg-emerald-50/5">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedIssue?.preventive_measure || (
                      <span className="text-slate-300 italic">
                        {selectedIssue ? "내용이 없습니다." : "이슈를 선택하면 표시됩니다."}
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-6 py-6 border-r border-slate-200 text-center w-32">
                  {selectedIssue && (
                    <Badge variant="outline" className={cn("font-bold text-[11px] whitespace-nowrap", STATUS_COLORS[selectedIssue.status] || "")}>
                      {selectedIssue.status || "이슈등록"}
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-6 align-top text-center border-r border-slate-200 w-40">
                  <div className="inline-flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <UserCheck className="w-5 h-5 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      {selectedIssue?.responder_name || "-"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 align-top w-44">
                  {selectedIssue?.response_file_url ? (
                    <div className="w-full text-left">
                      <a 
                        href={selectedIssue.response_file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all w-full group overflow-hidden shadow-sm"
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1 text-left text-xs font-bold">
                          증빙 확인
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 h-full py-2 opacity-30">
                      <Paperclip className="w-5 h-5 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400">파일 없음</span>
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

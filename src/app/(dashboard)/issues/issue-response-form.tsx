"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { updateIssueResponse } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, MessageSquareText, ShieldAlert, UserCheck, Users, X, Paperclip, ExternalLink } from "lucide-react";
import { cn, parseFiles } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface IssueResponseFormProps {
  selectedIssue: any | null;
  userEmail: string;
  userName: string;
}

export function IssueResponseForm({ selectedIssue, userEmail, userName }: IssueResponseFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [actionTaken, setActionTaken] = useState("");
  const [preventiveMeasure, setPreventiveMeasure] = useState("");
  const [responderName, setResponderName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedIssue) {
      setActionTaken(selectedIssue.action_taken || "");
      setPreventiveMeasure(selectedIssue.preventive_measure || "");
      setResponderName(selectedIssue.responder_name || userName || userEmail);
      setFiles([]);
      setIsEditing(false); // 이슈 선택 시 기본적으로 조회 모드
    } else {
      setActionTaken("");
      setPreventiveMeasure("");
      setResponderName("");
      setFiles([]);
      setIsEditing(false);
    }
  }, [selectedIssue, userEmail, userName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (!actionTaken) {
      toast.error("조치사항을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let file_urls: string[] = [];
      let file_names: string[] = [];

      // 클라이언트 측에서 Supabase Storage로 직접 업로드 (Vercel 페이로드 제한 우회)
      if (files.length > 0) {
        const supabase = createClient();

        await Promise.all(files.map(async (f) => {
          // 파일 크기 제한 (예: 20MB)
          if (f.size > 20 * 1024 * 1024) {
            throw new Error(`파일 크기가 너무 큽니다. (최대 20MB): ${f.name}`);
          }

          const fileExt = f.name.split('.').pop();
          const fileName = `res_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `responses/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('issue_attachments')
            .upload(filePath, f);

          if (uploadError) {
            console.error('Response file upload error:', uploadError);
            throw new Error(`증빙 파일 업로드 중에 오류가 발생했습니다: ${f.name}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('issue_attachments')
            .getPublicUrl(filePath);

          file_urls.push(publicUrl);
          file_names.push(f.name);
        }));
      }

      // FormData 방식으로 변환
      const fd = new FormData();
      fd.append('issueId', selectedIssue.id);
      fd.append('action_taken', actionTaken);
      fd.append('preventive_measure', preventiveMeasure);
      fd.append('responder_name', responderName);
      if (file_urls.length > 0) fd.append('response_file_url', JSON.stringify(file_urls));
      if (file_names.length > 0) fd.append('response_file_name', JSON.stringify(file_names));

      const result = await updateIssueResponse(fd);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("조치 사항이 등록되었습니다.");
        setIsEditing(false);
        router.refresh();
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-xl">
      {/* 헤더 액션 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-[#ff5c39] rounded-full" />
              <h2 className="text-sm font-black text-slate-800 tracking-tight">상세 조치 내역</h2>
            </div>
          </div>
        </div>
        
        {selectedIssue && (
          !isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-[#ff5c39] hover:bg-[#e04f32] text-white font-black px-6 gap-2 shadow-lg shadow-[#ff5c39]/20"
            >
              <MessageSquarePlus className="w-4 h-4" />
              조치사항 등록/수정
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="border-slate-300 text-slate-600 font-bold gap-2 bg-white hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              취소
            </Button>
          )
        )}
      </div>

      {isEditing ? (
        /* 입력 모드 */
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                <MessageSquareText className="w-3.5 h-3.5 text-[#ff5c39]" />
                <span className="text-white text-xs font-black uppercase tracking-wider">조치사항 입력</span>
              </div>
              <div className="p-4">
                <Textarea 
                  placeholder="조치한 상세 내용을 입력하세요" 
                  value={actionTaken} 
                  onChange={e => setActionTaken(e.target.value)} 
                  className="min-h-[120px] text-sm border-slate-200 focus:ring-[#ff5c39]/20 resize-none"
                />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-white text-xs font-black uppercase tracking-wider">재발방지 대책 입력</span>
              </div>
              <div className="p-4">
                <Textarea 
                  placeholder="향후 재발 방지를 위한 계획을 입력하세요" 
                  value={preventiveMeasure} 
                  onChange={e => setPreventiveMeasure(e.target.value)} 
                  className="min-h-[120px] text-sm border-slate-200 focus:ring-emerald-500/20 resize-none"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-6">
               <div className="flex flex-col gap-1">
                 <Label className="text-[11px] font-black text-slate-500 uppercase">최종 등록자</Label>
                 <Input 
                   value={responderName} 
                   onChange={e => setResponderName(e.target.value)} 
                   className="h-9 w-40 text-xs font-bold bg-slate-50"
                 />
               </div>

               <div className="h-10 w-px bg-slate-100 mx-2" />
               
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                   <Label className="text-[11px] font-black text-slate-500 uppercase">조치 증빙 첨부파일</Label>
                   {selectedIssue?.response_file_url && (
                     <span className="text-[10px] text-blue-600 flex items-center gap-1 font-bold">
                       기존 {parseFiles(selectedIssue.response_file_url, selectedIssue.response_file_name).length}개 파일 존재
                     </span>
                   )}
                 </div>
                 <div className="flex flex-col gap-2">
                   <input 
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
                     className="text-xs h-9 w-64 bg-slate-50 border border-slate-200 rounded-md file:text-[10px] file:font-black file:bg-slate-200 file:border-0 file:rounded-md file:mr-2 file:px-2 file:py-1 cursor-pointer pt-1 pl-1"
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
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-black text-white font-extrabold px-10 h-11 shadow-xl"
            >
              {isSubmitting ? "처리 중..." : "조치 내용 적용하기"}
            </Button>
          </div>
        </form>
      ) : (
        /* 조회 모드: 테이블 형식 노출 */
        <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-300">
          <table className="w-full border-collapse">
            <thead className="bg-slate-800">
              <tr className="border-b border-transparent">
                <th className="px-6 py-1 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-44 h-8">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    F/U 필요팀
                  </div>
                </th>
                <th className="px-6 py-1 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 h-8">
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquareText className="w-3.5 h-3.5 text-[#ff5c39]" />
                    조치사항
                  </div>
                </th>
                <th className="px-6 py-1 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 h-8">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                    재발방지 대책
                  </div>
                </th>
                <th className="px-6 py-1 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-40 h-8">
                  <div className="flex items-center justify-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    최종등록자
                  </div>
                </th>
                <th className="px-6 py-1 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider w-56 h-8">
                  <div className="flex items-center justify-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                    첨부파일
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-8 border-r border-slate-200 bg-slate-50/10">
                  <div className="flex items-center justify-center">
                    <span className="text-sm font-black text-slate-800 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                      {selectedIssue?.fu_required_team || "-"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-8 border-r border-slate-200 align-top">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedIssue?.action_taken || (
                      <span className="text-slate-300 italic">
                        {selectedIssue ? "내용이 없습니다." : "이슈를 선택하면 표시됩니다."}
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-6 py-8 border-r border-slate-200 align-top bg-emerald-50/5">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedIssue?.preventive_measure || (
                      <span className="text-slate-300 italic">
                        {selectedIssue ? "내용이 없습니다." : "이슈를 선택하면 표시됩니다."}
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-6 py-8 align-top text-center border-r border-slate-200 w-40">
                  <div className="inline-flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <UserCheck className="w-5 h-5 text-slate-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                      {selectedIssue?.responder_name || "-"}
                    </span>
                    {selectedIssue?.updated_at && selectedIssue.status === "조치등록" && (
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">
                        {new Date(selectedIssue.updated_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-8 align-top w-56">
                  {selectedIssue?.file_url && (
                    <div className="w-full text-left mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">이슈 기본 첨부파일</p>
                      <div className="flex flex-col gap-2">
                        {parseFiles(selectedIssue.file_url, selectedIssue.file_name).map((f: any, i: number) => (
                          <a 
                            key={i}
                            href={f.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors w-full group overflow-hidden border border-slate-200 shadow-sm"
                          >
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate flex-1 text-left">{f.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedIssue?.response_file_url && (
                    <div className="w-full text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">조치 등록 증빙 파일</p>
                      <div className="flex flex-col gap-2">
                        {parseFiles(selectedIssue.response_file_url, selectedIssue.response_file_name).map((f: any, i: number) => (
                          <a 
                            key={i}
                            href={f.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all w-full group overflow-hidden shadow-sm"
                          >
                            <Paperclip className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate flex-1 text-left text-xs font-bold">
                              {f.name}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedIssue?.file_url && !selectedIssue?.response_file_url && (
                    <div className="flex flex-col items-center justify-center gap-2 h-full py-4 opacity-50">
                      <Paperclip className="w-6 h-6 text-slate-300" />
                      <span className="text-xs font-bold text-slate-400">첨부파일 없음</span>
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

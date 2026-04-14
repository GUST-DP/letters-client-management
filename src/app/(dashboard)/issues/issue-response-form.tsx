"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { updateIssueResponse } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, MessageSquareText, ShieldAlert, UserCheck, Users, X, Paperclip, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (selectedIssue) {
      setActionTaken(selectedIssue.action_taken || "");
      setPreventiveMeasure(selectedIssue.preventive_measure || "");
      setResponderName(selectedIssue.responder_name || userName || userEmail);
      setFile(null);
      setIsEditing(false); // ?´ìŠˆ ? íƒ ??ê¸°ë³¸?ìœ¼ë¡?ì¡°íšŒ ëª¨ë“œ
    } else {
      setActionTaken("");
      setPreventiveMeasure("");
      setResponderName("");
      setFile(null);
      setIsEditing(false);
    }
  }, [selectedIssue, userEmail, userName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (!actionTaken) {
      toast.error("ì¡°ì¹˜?¬í•­???…ë ¥?´ì£¼?¸ìš”.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response_file_url = null;
      let response_file_name = null;

      // ?´ë¼?´ì–¸??ì¸¡ì—??Supabase Storageë¡?ì§ì ‘ ?…ë¡œ??(Vercel ?˜ì´ë¡œë“œ ?œí•œ ?°íšŒ)
      if (file) {
        // ?Œì¼ ?¬ê¸° ?œí•œ (?? 20MB)
        if (file.size > 20 * 1024 * 1024) {
          toast.error("?Œì¼ ?¬ê¸°ê°€ ?ˆë¬´ ?½ë‹ˆ?? (ìµœë? 20MB)");
          setIsSubmitting(false);
          return;
        }

        const supabase = createClient();
        const fileExt = file.name.split('.').pop();
        const fileName = `res_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `responses/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('issue_attachments')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Response file upload error:', uploadError);
          throw new Error('ì¦ë¹™ ?Œì¼ ?…ë¡œ??ì¤‘ì— ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('issue_attachments')
          .getPublicUrl(filePath);

        response_file_url = publicUrl;
        response_file_name = file.name;
      }

      // FormData ë°©ì‹?¼ë¡œ ?„í™˜
      const fd = new FormData();
      fd.append('issueId', selectedIssue.id);
      fd.append('action_taken', actionTaken);
      fd.append('preventive_measure', preventiveMeasure);
      fd.append('responder_name', responderName);
      if (response_file_url) fd.append('response_file_url', response_file_url);
      if (response_file_name) fd.append('response_file_name', response_file_name);

      const result = await updateIssueResponse(fd);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("ì¡°ì¹˜ ?¬í•­???€?¥ë˜?ˆìŠµ?ˆë‹¤.");
        setIsEditing(false);
        router.refresh();
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "?€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-xl">
      {/* ?¤ë” ë°??¡ì…˜ ë²„íŠ¼ */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-[#ff5c39] rounded-full" />
              <h2 className="text-sm font-black text-slate-800 tracking-tight">?ì„¸ ì¡°ì¹˜ ?´ì—­</h2>
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
              ì¡°ì¹˜?¬í•­ ?±ë¡/?˜ì •
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="border-slate-300 text-slate-600 font-bold gap-2 bg-white hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              ì·¨ì†Œ
            </Button>
          )
        )}
      </div>

      {isEditing ? (
        /* ?…ë ¥ ëª¨ë“œ: 2???…ë ¥ ??*/
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                <MessageSquareText className="w-3.5 h-3.5 text-[#ff5c39]" />
                <span className="text-white text-xs font-black uppercase tracking-wider">ì¡°ì¹˜?¬í•­ ?…ë ¥</span>
              </div>
              <div className="p-4">
                <Textarea 
                  placeholder="ì¡°ì¹˜???ì„¸ ?´ìš©???…ë ¥?˜ì„¸??" 
                  value={actionTaken} 
                  onChange={e => setActionTaken(e.target.value)} 
                  className="min-h-[120px] text-sm border-slate-200 focus:ring-[#ff5c39]/20 resize-none"
                />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-white text-xs font-black uppercase tracking-wider">?¬ë°œë°©ì? ?€ì±??…ë ¥</span>
              </div>
              <div className="p-4">
                <Textarea 
                  placeholder="?¥í›„ ?¬ë°œ ë°©ì?ë¥??„í•œ ê³„íš???…ë ¥?˜ì„¸??" 
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
                 <Label className="text-[11px] font-black text-slate-500 uppercase">?µë??±ë¡??/Label>
                 <Input 
                   value={responderName} 
                   onChange={e => setResponderName(e.target.value)} 
                   className="h-9 w-40 text-xs font-bold bg-slate-50"
                 />
               </div>

               <div className="h-10 w-px bg-slate-100 mx-2" />
               
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                   <Label className="text-[11px] font-black text-slate-500 uppercase">ì¡°ì¹˜ ì¦ë¹™ ì²¨ë??Œì¼</Label>
                   {selectedIssue?.response_file_url && (
                     <a href={selectedIssue.response_file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold">
                       <ExternalLink className="w-3 h-3 shrink-0" /> ê¸°ì¡´ ?Œì¼ ë³´ê¸°
                     </a>
                   )}
                 </div>
                 <div className="flex items-center gap-2">
                   <Input 
                     type="file" 
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
                     className="text-xs h-9 w-64 bg-slate-50 border-slate-200 file:text-[10px] file:font-black"
                   />
                   {file && (
                     <Button 
                       type="button" 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => setFile(null)}
                       className="h-9 w-9 p-0 text-slate-400 hover:text-rose-500"
                     >
                       <X className="w-4 h-4" />
                     </Button>
                   )}
                 </div>
               </div>
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-black text-white font-extrabold px-10 h-11 shadow-xl"
            >
              {isSubmitting ? "?€??ì¤?.." : "ì¡°ì¹˜ ?´ìš© ?€?¥í•˜ê¸?}
            </Button>
          </div>
        </form>
      ) : (
        /* ì¡°íšŒ ëª¨ë“œ: ???•ì‹ ?¸ì¶œ (?´ìŠˆ ë¯¸ì„ ???œì—????êµ¬ì¡° ? ì?) */
        <div className="border border-slate-200 rounded-2xl overflow-hidden animate-in fade-in duration-300">
          <table className="w-full border-collapse">
            <thead className="bg-slate-800">
              <tr className="border-b border-transparent">
                <th className="px-6 py-3 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-44 h-12">
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    F/U ?„ìš”?€
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 h-12">
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquareText className="w-3.5 h-3.5 text-[#ff5c39]" />
                    ì¡°ì¹˜?¬í•­
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 h-12">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                    ?¬ë°œë°©ì? ?€ì±?                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-40 h-12">
                  <div className="flex items-center justify-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    ?µë??±ë¡??                  </div>
                </th>
                <th className="px-6 py-3 text-left text-[12px] font-black text-slate-300 uppercase tracking-wider w-56 h-12">
                  <div className="flex items-center justify-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                    ì²¨ë??Œì¼
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
                        {selectedIssue ? "?´ìš©???†ìŠµ?ˆë‹¤." : "?´ìŠˆë¥?? íƒ?˜ë©´ ?œì‹œ?©ë‹ˆ??"}
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-6 py-8 border-r border-slate-200 align-top bg-emerald-50/5">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {selectedIssue?.preventive_measure || (
                      <span className="text-slate-300 italic">
                        {selectedIssue ? "?´ìš©???†ìŠµ?ˆë‹¤." : "?´ìŠˆë¥?? íƒ?˜ë©´ ?œì‹œ?©ë‹ˆ??"}
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
                    {selectedIssue?.updated_at && selectedIssue.status === "ì¡°ì¹˜?±ë¡" && (
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">
                        {new Date(selectedIssue.updated_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-8 align-top w-56">
                  {selectedIssue?.file_url && (
                    <div className="w-full text-left mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">?´ìŠˆ ?ë³¸ ì²¨ë??Œì¼</p>
                      <a 
                        href={selectedIssue.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors w-full group overflow-hidden border border-slate-200 shadow-sm"
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1 text-left">{selectedIssue.file_name || "ì²¨ë??Œì¼ ë³´ê¸°"}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                      </a>
                    </div>
                  )}

                  {selectedIssue?.response_file_url && (
                    <div className="w-full text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-2">ì¡°ì¹˜ ?±ë¡ ì¦ë¹™ ?Œì¼</p>
                      <a 
                        href={selectedIssue.response_file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all w-full group overflow-hidden shadow-sm"
                      >
                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1 text-left text-xs font-bold">
                          {selectedIssue.response_file_name || "ì²¨ë??Œì¼ ë³´ê¸°"}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                      </a>
                    </div>
                  )}

                  {!selectedIssue?.file_url && !selectedIssue?.response_file_url && (
                    <div className="flex flex-col items-center justify-center gap-2 h-full py-4 opacity-50">
                      <Paperclip className="w-6 h-6 text-slate-300" />
                      <span className="text-xs font-bold text-slate-400">ì²¨ë??Œì¼ ?†ìŒ</span>
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

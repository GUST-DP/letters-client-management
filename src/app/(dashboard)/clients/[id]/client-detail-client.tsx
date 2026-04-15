"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  AlertTriangle,
  ClipboardList,
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Briefcase,
  User,
  TrendingUp,
  Calendar,
  BarChart3,
  ExternalLink,
  MessageSquare,
  Send,
} from "lucide-react";
import Link from "next/link";
import { cn, ensureAbsoluteUrl, parseFiles } from "@/lib/utils";
import { TransitionLink } from "@/components/ui/transition-link";
import { upsertClientContact, deleteClientContact } from "./actions-contacts";
import { addClientNote, deleteClientNote } from "./actions-notes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { differenceInDays } from "date-fns";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  is_primary?: boolean;
}

interface ClientDetailClientProps {
  client: any;
  clientId: string;
  checklistTasks: any[];
  serviceIssues: any[];
  operationIssues: any[];
  contacts: Contact[];
  userEmail: string;
  userName: string;
  userRole: string;
  notes: { id: string; content: string; author_name: string; created_at: string }[];
  annualTotal: number;
  prevMonthSales: number | null;
  prevMonth: string;
  uncollectedAmount: number;
}

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  "계약완료": "bg-blue-50 text-blue-600 border-blue-200",
  "계약진행중": "bg-amber-50 text-amber-600 border-amber-200",
  "계약해지": "bg-red-50 text-red-500 border-red-200",
};

const PROGRESS_STATUS_COLORS: Record<string, string> = {
  "운영중": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "운영준비완료": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "협의중": "bg-yellow-50 text-yellow-600 border-yellow-200",
  "입고대기": "bg-orange-50 text-orange-600 border-orange-200",
  "운영종료": "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_COLORS: Record<string, string> = {
  "접수완료": "bg-rose-50 text-rose-600 border-rose-200",
  "처리중": "bg-amber-50 text-amber-600 border-amber-200",
  "처리완료": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "이슈등록": "bg-rose-50 text-rose-600 border-rose-200",
  "담당부서 확인 중": "bg-amber-50 text-amber-600 border-amber-200",
  "조치등록": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "조치완료": "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const CATEGORY_COLORS: Record<string, string> = {
  "입고지연": "bg-amber-50 text-amber-600 border-amber-200",
  "바코드오부착": "bg-orange-50 text-orange-600 border-orange-200",
  "상품오맵핑": "bg-rose-50 text-rose-600 border-rose-200",
  "주문오등록": "bg-red-50 text-red-600 border-red-200",
  "불용재고회수지연": "bg-purple-50 text-purple-600 border-purple-200",
  "입고누락": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "입고팔렛트기준미준수": "bg-slate-50 text-slate-600 border-slate-200",
};

function SectionCard({ title, icon: Icon, children, iconColor = "text-slate-700", action }: {
  title: string; icon: any; children: React.ReactNode; iconColor?: string; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-[#ff5c39] rounded-full" />
          <Icon className={cn("w-4 h-4", iconColor)} />
          <h2 className="text-sm font-black text-slate-800 tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export function ClientDetailClient({
  client,
  clientId,
  checklistTasks,
  serviceIssues,
  operationIssues,
  contacts: initialContacts,
  userEmail,
  userName,
  userRole,
  notes: initialNotes,
  annualTotal,
  prevMonthSales,
  prevMonth,
  uncollectedAmount,
}: ClientDetailClientProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [notes, setNotes] = useState(initialNotes);
  const [noteInput, setNoteInput] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showServiceIssues, setShowServiceIssues] = useState(true);
  const [showOpIssues, setShowOpIssues] = useState(true);

  // 담당자 모달
  const [contactModal, setContactModal] = useState<{ open: boolean; data: Partial<Contact> }>({ open: false, data: {} });
  const [isSaving, setIsSaving] = useState(false);

  // 이슈 상세 팝업
  const [selectedServiceIssue, setSelectedServiceIssue] = useState<any | null>(null);
  const [selectedOpIssue, setSelectedOpIssue] = useState<any | null>(null);

  // 담당자 목록을 서버 새로고침에 맞춰 동기화
  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const onboarding = Array.isArray(client.client_onboarding)
    ? client.client_onboarding[0]
    : client.client_onboarding;

  const costCenter = Array.isArray(client.rel_cost_center)
    ? client.rel_cost_center[0]
    : client.rel_cost_center;

  // 계약 경과일
  const contractElapsedDays = onboarding?.contract_date
    ? differenceInDays(new Date(), new Date(onboarding.contract_date))
    : null;

  const handleSaveContact = async () => {
    const { name, ...rest } = contactModal.data;
    if (!name?.trim()) {
      toast.error("담당자 이름을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    const result = await upsertClientContact(clientId, { name: name.trim(), ...rest });
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("담당자 정보가 저장되었습니다.");
      setContactModal({ open: false, data: {} });
      router.refresh();
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("담당자를 삭제하시겠습니까?")) return;
    const result = await deleteClientContact(contactId, clientId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("삭제되었습니다.");
      setContacts(prev => prev.filter(c => c.id !== contactId));
      router.refresh();
    }
  };

  const handleSubmitNote = async () => {
    if (!noteInput.trim()) return;
    setIsSubmittingNote(true);
    const result = await addClientNote(clientId, noteInput, userName);
    setIsSubmittingNote(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setNoteInput("");
      router.refresh();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("메모를 삭제하시겠습니까?")) return;
    const result = await deleteClientNote(noteId, clientId, userRole);
    if (result.error) toast.error(result.error);
    else {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      router.refresh();
    }
  };

  return (
    <div className="space-y-3">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3">
        <TransitionLink href="/client-detail">
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-500 hover:text-slate-800">
            <ChevronLeft className="w-4 h-4" />
            목록으로
          </Button>
        </TransitionLink>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-black text-slate-900">{client.company_name}</h1>
          {client.brand_name && (
            <span className="text-sm text-slate-400 font-medium">{client.brand_name}</span>
          )}
        </div>
      </div>

      {/* ── 기본 정보 + 상태 카드 ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <div className="w-1.5 h-5 bg-[#ff5c39] rounded-full" />
          <Building2 className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-black text-slate-800 tracking-tight">기본 정보</h2>
          {/* 상태 배지 — 헤더 오른쪽 */}
          <div className="ml-auto flex items-center gap-2">
            {client.contract_status && (
              <Badge variant="outline" className={cn("text-xs font-bold", CONTRACT_STATUS_COLORS[client.contract_status] || "bg-gray-50 text-gray-500")}>
                {client.contract_status}
              </Badge>
            )}
            {client.progress_status && (
              <Badge variant="outline" className={cn("text-xs font-bold", PROGRESS_STATUS_COLORS[client.progress_status] || "bg-gray-50 text-gray-500")}>
                {client.progress_status}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-sm">
            {[
              { label: "코스트센터", value: costCenter?.name },
              { label: "서비스형태", value: client.service_types?.name },
              { label: "영업 시작일", value: onboarding?.sales_start_date },
              { label: "계약일", value: onboarding?.contract_date },
              {
                label: "계약 경과일",
                value: contractElapsedDays !== null
                  ? <span className="text-[#ff5c39] font-black">{contractElapsedDays.toLocaleString()}일</span>
                  : null,
              },
              { label: "계약해지일", value: onboarding?.contract_end_date },
              { label: "인입경로", value: client.lead_source },
              { label: "영업담당자", value: client.profiles_sales?.full_name || client.profiles_sales?.email },
              { label: "운영담당자", value: client.profiles_op?.full_name || client.profiles_op?.email },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase w-24 shrink-0">{label}</span>
                <span className="font-bold text-slate-700">{value || <span className="text-slate-300 font-normal">-</span>}</span>
              </div>
            ))}
            {/* 품의링크 — 별도 렌더 */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase w-24 shrink-0">품의링크</span>
              {client.approval_link ? (
                <a
                  href={ensureAbsoluteUrl(client.approval_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-600 shadow-sm hover:border-[#ff5c39] hover:text-[#ff5c39] hover:bg-[#ff5c39]/5 transition-all"
                >
                  바로가기
                  <ExternalLink className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ) : (
                <span className="text-slate-300 font-normal text-sm">-</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ── 메모 ── */}
      <SectionCard title="담당자 메모" icon={MessageSquare} iconColor="text-emerald-500">
        {/* 입력 */}
        <div className="flex gap-2 mb-4">
          <textarea
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmitNote(); }}
            placeholder="이 고객사에 대한 메모를 남겨주세요... (Ctrl+Enter 로 등록)"
            rows={2}
            className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-200 placeholder:text-slate-300"
          />
          <Button
            onClick={handleSubmitNote}
            disabled={isSubmittingNote || !noteInput.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-3 self-end h-9 gap-1.5 shrink-0"
            size="sm"
          >
            <Send className="w-3.5 h-3.5" />
            등록
          </Button>
        </div>

        {/* 메모 목록 */}
        {notes.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">등록된 메모가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {notes.map(note => {
              const createdAt = new Date(note.created_at);
              const dateStr = `${createdAt.toLocaleDateString("ko-KR")} ${createdAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
              return (
                <div key={note.id} className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                    {userRole === "관리자" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-slate-300 hover:text-rose-500 shrink-0"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-black text-slate-500">{note.author_name}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── 매출 요약 ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{new Date().getFullYear()}년 연간 누계 매출</p>
            <p className="text-xl font-black text-blue-600">{fmt(annualTotal)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{prevMonth} 전월 매출</p>
            <p className="text-xl font-black text-purple-600">
              {fmt(prevMonthSales ?? 0)}
            </p>
          </div>
        </div>
        <div className={cn(
          "rounded-2xl border shadow-sm px-5 py-4 flex items-center gap-4",
          uncollectedAmount > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-100"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            uncollectedAmount > 0 ? "bg-red-100" : "bg-slate-50"
          )}>
            <AlertTriangle className={cn("w-5 h-5", uncollectedAmount > 0 ? "text-red-500" : "text-slate-300")} />
          </div>
          <div>
            <p className={cn("text-[11px] font-black uppercase tracking-wider", uncollectedAmount > 0 ? "text-red-400" : "text-slate-400")}>미수금 현황</p>
            <p className={cn("text-xl font-black", uncollectedAmount > 0 ? "text-red-600" : "text-slate-400")}>
              {uncollectedAmount > 0 ? fmt(uncollectedAmount) : "0원"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 고객사 담당자 ── */}
      <SectionCard
        title="고객사 담당자"
        icon={Users}
        iconColor="text-blue-500"
        action={
          <Button
            size="sm"
            variant="outline"
            className="border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 gap-1.5 h-7 text-xs"
            onClick={() => setContactModal({ open: true, data: {} })}
          >
            <Plus className="w-3 h-3" />
            추가
          </Button>
        }
      >
        <div className="space-y-2">
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-4">등록된 담당자가 없습니다.</p>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-sm">{c.name}</span>
                      {c.is_primary && (
                        <Badge className="h-4 text-[10px] bg-[#ff5c39]/10 text-[#ff5c39] border-[#ff5c39]/20 font-bold">주담당</Badge>
                      )}
                      {c.position && <span className="text-xs text-slate-400 font-medium">{c.position}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                      {c.department && <span className="flex items-center gap-1 text-xs text-slate-500"><Briefcase className="w-3 h-3" />{c.department}</span>}
                      {c.email && <span className="flex items-center gap-1 text-xs text-slate-500"><Mail className="w-3 h-3" />{c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3" />{c.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-[#ff5c39]"
                    onClick={() => setContactModal({ open: true, data: { ...c } })}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-300 hover:text-rose-500"
                    onClick={() => handleDeleteContact(c.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      {/* ── 계약 체크리스트 ── */}
      <SectionCard title="계약 체크리스트" icon={ClipboardList} iconColor="text-purple-500">
        <button
          onClick={() => setShowChecklist(v => !v)}
          className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3 hover:text-slate-700 transition-colors"
        >
          {showChecklist ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showChecklist ? "접기" : `${checklistTasks.length}개 항목 펼치기`}
        </button>
        {showChecklist && (
          <div className="flex flex-col">
            {checklistTasks.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">체크리스트 데이터가 없습니다.</p>
            ) : (
              <>
                {/* ── 열 제목 헤더 ── */}
                <div className="flex items-center gap-3 py-2 border-b-2 border-slate-100 mb-2 px-1">
                  <span className="w-24 text-[10px] font-black text-slate-400 text-center uppercase tracking-wider shrink-0">구분</span>
                  <span className="w-4 shrink-0" /> {/* 완료 아이콘 자리 */}
                  <span className="w-[180px] xl:w-[220px] text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">점검 항목</span>
                  <span className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[100px]">세부 내용 / 기준</span>
                  <span className="w-[300px] xl:w-[400px] text-[10px] font-black text-slate-400 uppercase tracking-wider text-right shrink-0 px-2 border-l border-transparent">비고</span>
                  <span className="w-20 xl:w-24 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center shrink-0">입력값</span>
                </div>
                <div className="space-y-1">
                  {checklistTasks.map((task) => {
                    const formatValue = (val: string) => {
                      if (!val) return "";
                      const num = Number(val.replace(/,/g, ''));
                      return !isNaN(num) && val.trim() !== '' ? num.toLocaleString() : val;
                    };
                    return (
                      <div key={task.id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0 px-1 hover:bg-slate-50/50 transition-colors">
                {/* 구분 — 맨 왼쪽 */}
                <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200 bg-slate-50 shrink-0 w-24 justify-center">
                  {task.category || "-"}
                </Badge>
                {/* 완료 아이콘 */}
                {task.is_completed
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-slate-200 shrink-0" />
                }
                {/* 항목명 */}
                <span className={cn("w-[180px] xl:w-[220px] text-xs font-bold shrink-0 truncate", task.is_completed ? "text-slate-700" : "text-slate-400")} title={task.task_name}>
                  {task.task_name}
                </span>
                {/* 세부내용 */}
                <span className="flex-1 text-[11px] text-slate-400 truncate min-w-[100px]" title={task.description}>
                  {task.description || "-"}
                </span>
                {/* 비고 — 우측 정렬 */}
                <div className="w-[300px] xl:w-[400px] shrink-0 border-l border-slate-100 px-2 flex justify-end">
                  {task.remarks ? (
                    <span className="text-[11px] font-medium text-slate-500 italic truncate" title={task.remarks}>
                      {task.remarks}
                    </span>
                  ) : <span className="text-slate-200">-</span>}
                </div>
                {/* 수기입력값 — 중앙 정렬 */}
                <div className="w-20 xl:w-24 shrink-0 flex justify-center">
                  {task.task_value ? (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100 max-w-full truncate block text-center">
                      {formatValue(task.task_value)}
                    </Badge>
                  ) : <span className="text-slate-200">-</span>}
                </div>
              </div>
            );
          })}
                </div>
              </>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── 서비스 이슈 ── */}
      <SectionCard title={`서비스 이슈 내역 (${serviceIssues.length}건)`} icon={AlertTriangle} iconColor="text-orange-500">
        <button
          onClick={() => setShowServiceIssues(v => !v)}
          className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3 hover:text-slate-700 transition-colors"
        >
          {showServiceIssues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showServiceIssues ? "접기" : "펼치기"}
        </button>
        {showServiceIssues && (
          <div className="overflow-x-auto">
            {serviceIssues.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">등록된 서비스 이슈가 없습니다.</p>
            ) : (
              <table className="w-full text-xs border-collapse min-w-max">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["발생일", "이슈유형", "건명", "이슈내용", "진행상태", "등록자"].map(h => (
                      <th key={h} className="py-2 px-3 text-left font-black text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {serviceIssues.map((issue) => (
                    <tr key={issue.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-600 whitespace-nowrap">{issue.occurrence_date}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-500">{issue.issue_type}</Badge>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-700 max-w-[150px] truncate">{issue.title}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedServiceIssue(issue)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1 max-w-[200px] truncate"
                          title={issue.issue_content}
                        >
                          <span className="text-[11px]">🔍</span>
                          <span className="truncate">{issue.issue_content || "-"}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={cn("text-[10px] font-bold", STATUS_COLORS[issue.status])}>{issue.status}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{issue.author_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── 고객사 이슈 ── */}
      <SectionCard title={`고객사 이슈 내역 (${operationIssues.length}건)`} icon={AlertTriangle} iconColor="text-red-500">
        <button
          onClick={() => setShowOpIssues(v => !v)}
          className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3 hover:text-slate-700 transition-colors"
        >
          {showOpIssues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showOpIssues ? "접기" : "펼치기"}
        </button>
        {showOpIssues && (
          <div className="overflow-x-auto">
            {operationIssues.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">등록된 고객사 이슈가 없습니다.</p>
            ) : (
              <table className="w-full text-xs border-collapse min-w-max">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["발생일", "이슈유형", "이슈내용", "책임주체", "진행상태", "등록자"].map(h => (
                      <th key={h} className="py-2 px-3 text-left font-black text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operationIssues.map((issue) => (
                    <tr key={issue.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-600 whitespace-nowrap">{issue.occurrence_date}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={cn("text-[10px] font-bold", CATEGORY_COLORS[issue.issue_category] || "bg-gray-50 text-gray-500")}>
                          {issue.issue_category}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedOpIssue(issue)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1 max-w-[200px] truncate"
                          title={issue.issue_content}
                        >
                          <span className="text-[11px]">🔍</span>
                          <span className="truncate">{issue.issue_content || "-"}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{issue.responsible_party || "-"}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className={cn("text-[10px] font-bold", STATUS_COLORS[issue.status])}>{issue.status}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{issue.author_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── 서비스 이슈 상세 팝업 ── */}
      <Dialog open={!!selectedServiceIssue} onOpenChange={v => !v && setSelectedServiceIssue(null)}>
        <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 font-black text-slate-900">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              서비스 이슈 상세
            </DialogTitle>
            {selectedServiceIssue && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs text-slate-500 font-medium">{selectedServiceIssue.occurrence_date}</span>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-500">{selectedServiceIssue.issue_type}</Badge>
                <Badge variant="outline" className={cn("text-[10px] font-bold", STATUS_COLORS[selectedServiceIssue?.status])}>{selectedServiceIssue?.status}</Badge>
              </div>
            )}
          </DialogHeader>
          {selectedServiceIssue && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase mb-1">건명</p>
                <p className="text-sm font-bold text-slate-800">{selectedServiceIssue.title}</p>
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase mb-1">이슈내용</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-3">
                  {selectedServiceIssue.issue_content || <span className="text-slate-300 italic">내용 없음</span>}
                </p>
              </div>
              {selectedServiceIssue.action_taken && (
                <div>
                  <p className="text-[11px] font-black text-emerald-500 uppercase mb-1">조치내용</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-emerald-50 rounded-xl p-3">
                    {selectedServiceIssue.action_taken}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-50">
                <span>발생주체: <strong className="text-slate-600">{selectedServiceIssue.occurrence_subject || "-"}</strong></span>
                <span>등록자: <strong className="text-slate-600">{selectedServiceIssue.author_name || "-"}</strong></span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 고객사 이슈 상세 팝업 ── */}
      <Dialog open={!!selectedOpIssue} onOpenChange={v => !v && setSelectedOpIssue(null)}>
        <DialogContent className="sm:max-w-[580px] bg-white rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 font-black text-slate-900">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              고객사 이슈 상세
            </DialogTitle>
            {selectedOpIssue && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs text-slate-500 font-medium">{selectedOpIssue.occurrence_date}</span>
                <Badge variant="outline" className={cn("text-[10px] font-bold", CATEGORY_COLORS[selectedOpIssue.issue_category] || "bg-gray-50 text-gray-500")}>{selectedOpIssue.issue_category}</Badge>
                <Badge variant="outline" className={cn("text-[10px] font-bold", STATUS_COLORS[selectedOpIssue?.status])}>{selectedOpIssue?.status}</Badge>
                {selectedOpIssue.responsible_party && <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-500">{selectedOpIssue.responsible_party}</Badge>}
              </div>
            )}
          </DialogHeader>
          {selectedOpIssue && (
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase mb-1">이슈내용</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-3">
                  {selectedOpIssue.issue_content || <span className="text-slate-300 italic">내용 없음</span>}
                </p>
              </div>
              {selectedOpIssue.file_url && (
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase mb-1">이슈 첨부파일</p>
                  <div className="flex flex-col gap-2">
                    {parseFiles(selectedOpIssue.file_url, selectedOpIssue.file_name).map((f: any, i: number) => (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm transition-all w-full truncate"
                      >
                        📎 <span className="truncate">{f.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedOpIssue.response_file_url && (
                <div>
                  <p className="text-[11px] font-black text-emerald-500 uppercase mb-1">조치 증빙 첨부파일</p>
                  <div className="flex flex-col gap-2">
                    {parseFiles(selectedOpIssue.response_file_url, selectedOpIssue.response_file_name).map((f: any, i: number) => (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-800 font-bold text-xs bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm transition-all w-full truncate"
                      >
                        📎 <span className="truncate">{f.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedOpIssue.action_taken && (
                <div>
                  <p className="text-[11px] font-black text-emerald-500 uppercase mb-1">조치내용</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-emerald-50 rounded-xl p-3">
                    {selectedOpIssue.action_taken}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-50">
                <span>등록자: <strong className="text-slate-600">{selectedOpIssue.author_name || "-"}</strong></span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 담당자 추가/수정 모달 ── */}
      <Dialog open={contactModal.open} onOpenChange={v => !v && setContactModal({ open: false, data: {} })}>
        <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="font-black text-slate-900">
              {contactModal.data.id ? "담당자 정보 수정" : "담당자 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-500 uppercase">이름 *</Label>
                <Input value={contactModal.data.name || ""} onChange={e => setContactModal(p => ({ ...p, data: { ...p.data, name: e.target.value } }))} placeholder="홍길동" className="h-9 border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-500 uppercase">직급</Label>
                <Input value={contactModal.data.position || ""} onChange={e => setContactModal(p => ({ ...p, data: { ...p.data, position: e.target.value } }))} placeholder="과장" className="h-9 border-slate-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-500 uppercase">이메일</Label>
                <Input type="email" value={contactModal.data.email || ""} onChange={e => setContactModal(p => ({ ...p, data: { ...p.data, email: e.target.value } }))} placeholder="example@email.com" className="h-9 border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black text-slate-500 uppercase">연락처</Label>
                <Input value={contactModal.data.phone || ""} onChange={e => setContactModal(p => ({ ...p, data: { ...p.data, phone: e.target.value } }))} placeholder="010-0000-0000" className="h-9 border-slate-200" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-black text-slate-500 uppercase">담당업무</Label>
              <Input value={contactModal.data.department || ""} onChange={e => setContactModal(p => ({ ...p, data: { ...p.data, department: e.target.value } }))} placeholder="물류팀 / CS / 정산 담당 등" className="h-9 border-slate-200" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_primary" checked={contactModal.data.is_primary || false} onChange={e => setContactModal(p => ({ ...p, data: { ...p.data, is_primary: e.target.checked } }))} className="w-4 h-4" />
              <label htmlFor="is_primary" className="text-sm font-bold text-slate-600 cursor-pointer">주담당자로 설정</label>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setContactModal({ open: false, data: {} })} className="font-bold">취소</Button>
            <Button onClick={handleSaveContact} disabled={isSaving} className="bg-[#ff5c39] hover:bg-[#e04f32] text-white font-black">
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "./actions";
import { Pencil, Check, X, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  team: string | null;
  menu_permissions: string[] | null;
};

const ALL_MENUS = [
  { key: "dashboard", label: "대시보드" },
  { key: "clients", label: "고객사 관리" },
  { key: "sales", label: "매출 및 입금관리" },
  { key: "settings", label: "기준관리" },
  { key: "accounts", label: "계정관리" },
];

const ROLES = ["관리자", "열람자", "운영담당자", "영업담당자"];

export function AccountTable({ 
  profiles, 
  title, 
  description 
}: { 
  profiles: Profile[]; 
  title: string; 
  description: string;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [isPending, startTransition] = useTransition();

  function startEdit(p: Profile) {
    setEditId(p.id);
    setForm({
      full_name: p.full_name ?? "",
      team: p.team ?? "",
      role: p.role ?? "",
      menu_permissions: p.menu_permissions ?? ALL_MENUS.map(m => m.key),
    });
  }

  function cancelEdit() { setEditId(null); setForm({}); }

  function toggleMenu(key: string) {
    const cur = (form.menu_permissions ?? []);
    setForm(f => ({
      ...f,
      menu_permissions: cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key],
    }));
  }

  function save(profileId: string) {
    startTransition(async () => {
      const res = await updateProfile(profileId, {
        full_name: form.full_name ?? "",
        team: form.team ?? "",
        role: form.role ?? "",
        menu_permissions: form.menu_permissions ?? [],
      });
      if (res?.error) {
        toast.error("저장 실패: " + res.error);
      } else {
        toast.success("저장되었습니다.");
        setEditId(null);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* 통합 헤더 영역 */}
      <div className="px-3 py-3 flex justify-between items-center border-b border-slate-100 bg-slate-50/30">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-slate-500 font-medium text-[11px] mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="font-bold text-slate-700">{profiles.length}</span>
            <span>개의 계정</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200" />
          <div className="text-slate-400 font-medium select-none">
            Supabase에서 계정 추가 가능
          </div>
        </div>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-800 border-none" style={{height:"28px"}}>
            <th className="px-3 text-center font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-16" style={{height:"28px",fontSize:"11px",lineHeight:"28px",padding:"0 12px"}}>#</th>
            <th className="px-3 text-center font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-32" style={{height:"28px",fontSize:"11px",lineHeight:"28px",padding:"0 12px"}}>이름</th>
            <th className="px-3 text-center font-black text-slate-300 text-[13px] uppercase tracking-wider border-r border-slate-700/50">이메일</th>
            <th className="px-3 text-center font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-32" style={{height:"28px",fontSize:"11px",lineHeight:"28px",padding:"0 12px"}}>팀명</th>
            <th className="px-3 text-center font-black text-slate-300 uppercase tracking-wider border-r border-slate-700/50 w-44" style={{height:"28px",fontSize:"11px",lineHeight:"28px",padding:"0 12px"}}>권한</th>
            <th className="px-3 text-center font-black text-slate-300 text-[13px] uppercase tracking-wider border-r border-slate-700/50">메뉴 권한</th>
            <th className="px-3 text-center font-black text-slate-300 text-[13px] uppercase tracking-wider w-32">관리</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p, i) => {
            const isEditing = editId === p.id;
            const perms = p.menu_permissions ?? ALL_MENUS.map(m => m.key);
            return (
              <tr 
                key={p.id} 
                className="border-b border-slate-100 transition-all hover:bg-slate-50/50 group"
              >
                {/* # 순번 */}
                <td className="border-r border-slate-100 align-middle text-center text-slate-400 font-bold" style={{height:"30px",fontSize:"11px",lineHeight:"30px",padding:"0 12px",overflow:"hidden"}}>
                  {i + 1}
                </td>

                {/* 이름 */}
                <td className="border-r border-slate-100 align-middle text-center" style={{height:"30px",fontSize:"11px",lineHeight:"30px",padding:"0 12px",overflow:"hidden"}}>
                  {isEditing ? (
                    <input
                      value={form.full_name ?? ""}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full h-6 px-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-center"
                      placeholder="이름"
                    />
                  ) : (
                    <span className="text-slate-800 font-bold">{p.full_name || <span className="text-slate-300 font-normal">-</span>}</span>
                  )}
                </td>

                {/* 이메일 */}
                <td className="border-r border-slate-100 align-middle" style={{height:"30px",fontSize:"11px",lineHeight:"30px",padding:"0 12px",overflow:"hidden"}}>
                  <span className="font-mono text-slate-500 font-medium">{p.email}</span>
                </td>

                {/* 팀명 */}
                <td className="border-r border-slate-100 align-middle text-center" style={{height:"30px",fontSize:"11px",lineHeight:"30px",padding:"0 12px",overflow:"hidden"}}>
                  {isEditing ? (
                    <input
                      value={form.team ?? ""}
                      onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                      className="w-full h-6 px-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-center"
                      placeholder="팀명"
                    />
                  ) : (
                    <span className="text-slate-600 font-bold">{p.team || <span className="text-slate-300 font-normal">-</span>}</span>
                  )}
                </td>

                {/* 권한 */}
                <td className="border-r border-slate-100 align-middle text-center" style={{height:"30px",fontSize:"11px",lineHeight:"30px",padding:"0 12px",overflow:"hidden"}}>
                  {isEditing ? (
                    <select
                      value={form.role ?? ""}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full h-6 px-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-center"
                    >
                      <option value="">권한 선택</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <div className="flex justify-center">
                      {p.role ? (
                        <Badge variant="outline" className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          p.role === "관리자" ? "bg-red-50 text-red-700 border-red-100" :
                          p.role === "열람자" ? "bg-slate-50 text-slate-600 border-slate-200" :
                          "bg-indigo-50 text-indigo-700 border-indigo-100"
                        }`}>
                          <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                          {p.role}
                        </Badge>
                      ) : (
                        <span className="text-slate-300 font-normal">-</span>
                      )}
                    </div>
                  )}
                </td>

                {/* 메뉴 권한 (가로 나열) */}
                <td className="border-r border-slate-100 align-middle" style={{height:"30px",fontSize:"11px",lineHeight:"30px",padding:"0 12px",overflow:"hidden"}}>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_MENUS.map(m => {
                        const on = (form.menu_permissions ?? []).includes(m.key);
                        return (
                          <button
                            key={m.key}
                            onClick={() => toggleMenu(m.key)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black border transition-all ${
                              on
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 items-center">
                      {ALL_MENUS.filter(m => perms.includes(m.key)).map(m => (
                        <Badge key={m.key} variant="outline" className="text-[9px] bg-slate-50 text-slate-500 border-slate-100 font-bold tracking-tighter shrink-0">
                          {m.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </td>

                {/* 버튼 */}
                <td className="text-center align-middle" style={{height:"30px",fontSize:"11px",lineHeight:"30px",padding:"0 12px",overflow:"hidden"}}>
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => save(p.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
                        title="저장"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all"
                        title="취소"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-blue-50 rounded-lg transition-all"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {profiles.length === 0 && (
        <div className="py-20 text-center text-slate-400 text-xs font-bold bg-slate-50/30">
          등록된 계정이 없습니다. Supabase에서 계정을 생성해주세요.
        </div>
      )}
    </div>
  );
}


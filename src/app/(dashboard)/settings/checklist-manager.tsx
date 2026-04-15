"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X
} from "lucide-react";
import { 
  addTaskAction, 
  updateTaskAction, 
  deleteTaskAction 
} from "./actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Task {
  id: string;
  category: string;
  task_name: string;
  target: string | null;
  description: string | null;
  is_input: boolean;
  created_at: string;
}

interface Props {
  initialTasks: Task[];
  title: string;
  description: string;
}

export function ChecklistManager({ initialTasks, title, description }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  // 추가 모달 관련 상태
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    category: "",
    task_name: "",
    target: "",
    description: "",
    is_input: false,
  });

  const handleEditStart = (task: Task) => {
    setEditingId(task.id);
    setEditForm(task);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editForm.category || !editForm.task_name) {
      toast.error("카테고리와 항목명은 필수입니다.");
      return;
    }

    startTransition(async () => {
      const result = await updateTaskAction(editingId, {
        category: editForm.category,
        task_name: editForm.task_name,
        target: editForm.target,
        description: editForm.description,
        is_input: editForm.is_input,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("항목이 수정되었습니다.");
        setEditingId(null);
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`[${name}] 항목을 정말 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;
    setIsDeleting(true);
    try {
      const result = await deleteTaskAction(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("항목이 삭제되었습니다.");
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdd = async () => {
    if (!newForm.category || !newForm.task_name) {
      toast.error("카테고리와 항목명은 필수입니다.");
      return;
    }

    startTransition(async () => {
      const result = await addTaskAction(newForm);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("새로운 체크리스트 항목이 추가되었습니다.");
        setIsAddOpen(false);
        setNewForm({ category: "", task_name: "", target: "", description: "", is_input: false });
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* 통합 헤더 영역 */}
        <div className="px-3 py-3 flex justify-between items-center border-b border-slate-100 bg-slate-50/30">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-slate-500 font-medium text-[11px] mt-1">{description}</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-[#414344] text-white hover:bg-[#414344]/90 shadow-md">
            <Plus className="w-4 h-4" />
            항목 추가
          </Button>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200">
          <table className="w-full border-collapse" style={{tableLayout:"fixed"}}>
            <thead style={{position:"sticky", top:0, zIndex:10, backgroundColor:"#1e293b"}}>
              <tr style={{height:"28px"}}>
                <th style={{width:"60px", height:"28px", padding:"0 10px", fontSize:"11px", lineHeight:"28px", color:"#cbd5e1", fontWeight:900, textAlign:"center", borderRight:"1px solid rgba(100,116,139,0.3)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap"}}>#</th>
                <th style={{width:"150px", height:"28px", padding:"0 10px", fontSize:"11px", lineHeight:"28px", color:"#cbd5e1", fontWeight:900, textAlign:"center", borderRight:"1px solid rgba(100,116,139,0.3)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap"}}>카테고리</th>
                <th style={{width:"200px", height:"28px", padding:"0 10px", fontSize:"11px", lineHeight:"28px", color:"#cbd5e1", fontWeight:900, textAlign:"left", borderRight:"1px solid rgba(100,116,139,0.3)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap"}}>점검 항목명</th>
                <th style={{width:"120px", height:"28px", padding:"0 10px", fontSize:"11px", lineHeight:"28px", color:"#cbd5e1", fontWeight:900, textAlign:"center", borderRight:"1px solid rgba(100,116,139,0.3)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap"}}>대상/값</th>
                <th style={{height:"28px", padding:"0 10px", fontSize:"11px", lineHeight:"28px", color:"#cbd5e1", fontWeight:900, textAlign:"left", borderRight:"1px solid rgba(100,116,139,0.3)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap"}}>세부 내용 / 기준</th>
                <th style={{width:"100px", height:"28px", padding:"0 10px", fontSize:"11px", lineHeight:"28px", color:"#cbd5e1", fontWeight:900, textAlign:"center", borderRight:"1px solid rgba(100,116,139,0.3)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap"}}>수기입력</th>
                <th style={{width:"120px", height:"28px", padding:"0 10px", fontSize:"11px", lineHeight:"28px", color:"#cbd5e1", fontWeight:900, textAlign:"center", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap"}}>관리</th>
              </tr>
            </thead>
            <tbody>
              {initialTasks.map((task, index) => (
                <tr key={task.id} style={{height:"30px", borderBottom:"1px solid #f1f5f9"}} className="hover:bg-slate-50/50 group transition-colors">
                  <td style={{height:"30px", padding:"0 10px", fontSize:"11px", lineHeight:"30px", overflow:"hidden", textAlign:"center", color:"#94a3b8", fontWeight:700, borderRight:"1px solid #f1f5f9", whiteSpace:"nowrap"}}>{index + 1}</td>
                  <td style={{height:"30px", padding:"0 10px", fontSize:"11px", lineHeight:"30px", overflow:"hidden", textAlign:"center", borderRight:"1px solid #f1f5f9", whiteSpace:"nowrap"}}>
                    {editingId === task.id ? (
                      <Input value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="h-6 text-xs text-center font-bold border-slate-200 rounded-lg" />
                    ) : (
                      <span style={{color:"#2563eb", fontWeight:700}}>{task.category}</span>
                    )}
                  </td>
                  <td style={{height:"30px", padding:"0 10px", fontSize:"11px", lineHeight:"30px", overflow:"hidden", borderRight:"1px solid #f1f5f9", whiteSpace:"nowrap"}}>
                    {editingId === task.id ? (
                      <Input value={editForm.task_name || ""} onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })} className="h-6 text-xs font-bold border-slate-200 rounded-lg" />
                    ) : (
                      <span style={{color:"#0f172a", fontWeight:700}}>{task.task_name}</span>
                    )}
                  </td>
                  <td style={{height:"30px", padding:"0 10px", fontSize:"11px", lineHeight:"30px", overflow:"hidden", textAlign:"center", borderRight:"1px solid #f1f5f9", whiteSpace:"nowrap"}}>
                    {editingId === task.id ? (
                      <Input value={editForm.target || ""} onChange={(e) => setEditForm({ ...editForm, target: e.target.value })} className="h-6 text-xs text-center border-slate-200 rounded-lg" placeholder="대상..." />
                    ) : (
                      <span style={{background:"#f1f5f9", padding:"1px 8px", borderRadius:"4px", color:"#475569", fontWeight:700, fontSize:"10px"}}>{task.target || "-"}</span>
                    )}
                  </td>
                  <td style={{height:"30px", padding:"0 10px", fontSize:"11px", lineHeight:"30px", overflow:"hidden", borderRight:"1px solid #f1f5f9", whiteSpace:"nowrap"}}>
                    {editingId === task.id ? (
                      <Input value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-6 text-xs border-slate-200 rounded-lg" />
                    ) : (
                      <span style={{color:"#64748b"}}>{task.description || "-"}</span>
                    )}
                  </td>
                  <td style={{height:"30px", padding:"0 10px", lineHeight:"30px", overflow:"hidden", textAlign:"center", borderRight:"1px solid #f1f5f9"}}>
                    <div style={{display:"flex", justifyContent:"center", alignItems:"center", height:"100%"}}>
                      {editingId === task.id ? (
                        <Checkbox checked={editForm.is_input} onCheckedChange={(val) => setEditForm({ ...editForm, is_input: !!val })} className="rounded-md" />
                      ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-offset-1 ${task.is_input ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-200 ring-slate-50'}`} />
                      )}
                    </div>
                  </td>
                  <td style={{height:"30px", padding:"0 10px", lineHeight:"30px", overflow:"hidden", textAlign:"center"}}>
                    <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", height:"100%"}}>
                      {editingId === task.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-emerald-600 hover:bg-emerald-50 rounded-lg" onClick={handleUpdate} disabled={isPending}><Save className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:bg-slate-50 rounded-lg" onClick={handleEditCancel}><X className="w-3.5 h-3.5" /></Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-400 hover:bg-blue-50 rounded-lg" onClick={() => handleEditStart(task)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDelete(task.id, task.task_name)} disabled={isDeleting}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 항목 추가 다이얼로그 */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 체크리스트 항목 추가</DialogTitle>
            <DialogDescription>
              온보딩 프로세스에 공통으로 적용될 새로운 점검 항목을 정의합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">카테고리</Label>
              <Input
                id="category"
                value={newForm.category}
                onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                className="col-span-3"
                placeholder="예: 마케팅 / 시스템"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task_name" className="text-right">항목명</Label>
              <Input
                id="task_name"
                value={newForm.task_name}
                onChange={(e) => setNewForm({ ...newForm, task_name: e.target.value })}
                className="col-span-3"
                placeholder="점검할 내용을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target" className="text-right">대상/값</Label>
              <Input
                id="target"
                value={newForm.target}
                onChange={(e) => setNewForm({ ...newForm, target: e.target.value })}
                className="col-span-3"
                placeholder="유형 또는 값"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">세부내용</Label>
              <Input
                id="description"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                className="col-span-3"
                placeholder="항목에 대한 보충 설명"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">수기입력 여부</Label>
              <div className="flex items-center gap-2 col-span-3">
                <Checkbox 
                  id="is_input"
                  checked={newForm.is_input}
                  onCheckedChange={(val) => setNewForm({ ...newForm, is_input: !!val })}
                />
                <Label htmlFor="is_input" className="text-xs text-gray-500 font-normal">
                  체크 시 사용자가 숫자를 직접 입력할 수 있습니다.
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>취소</Button>
            <Button onClick={handleAdd} disabled={isPending} className="bg-[#414344] text-white hover:bg-[#414344]/90">
              {isPending ? "추가 중..." : "항목 추가하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

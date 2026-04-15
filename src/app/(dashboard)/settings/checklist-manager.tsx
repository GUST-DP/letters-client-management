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

        <Table className="text-xs">
          <TableHeader className="bg-slate-800">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[60px] font-black text-slate-300 border-r border-slate-700/50 text-center text-[12px] uppercase tracking-wider px-3">#</TableHead>
              <TableHead className="w-[150px] font-black text-slate-300 border-r border-slate-700/50 text-center text-[12px] uppercase tracking-wider px-3">카테고리</TableHead>
              <TableHead className="w-[200px] font-black text-slate-300 border-r border-slate-700/50 text-[12px] uppercase tracking-wider px-3">점검 항목명</TableHead>
              <TableHead className="w-[120px] font-black text-slate-300 border-r border-slate-700/50 text-center text-[12px] uppercase tracking-wider px-3">대상/값</TableHead>
              <TableHead className="font-black text-slate-300 border-r border-slate-700/50 text-[12px] uppercase tracking-wider px-3">세부 내용 / 기준</TableHead>
              <TableHead className="w-[100px] font-black text-slate-300 border-r border-slate-700/50 text-center text-[12px] uppercase tracking-wider px-3">수기입력</TableHead>
              <TableHead className="w-[120px] font-black text-slate-300 text-center text-[12px] uppercase tracking-wider px-3">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialTasks.map((task, index) => (
              <TableRow key={task.id} className="border-b border-slate-100 transition-all hover:bg-slate-50/50 group">
                <TableCell className="py-0 px-3 border-r border-slate-100 text-center text-slate-400 font-bold">
                  {index + 1}
                </TableCell>
                <TableCell className="py-0 px-3 border-r border-slate-100 text-center align-middle">
                  {editingId === task.id ? (
                    <Input 
                      value={editForm.category || ""} 
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="h-6 text-xs text-center font-bold border-slate-200 rounded-lg"
                    />
                  ) : (
                    <span className="text-blue-600 font-bold">{task.category}</span>
                  )}
                </TableCell>
                <TableCell className="py-0 px-3 border-r border-slate-100 align-middle">
                  {editingId === task.id ? (
                    <Input 
                      value={editForm.task_name || ""} 
                      onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })}
                      className="h-6 text-xs font-bold border-slate-200 rounded-lg"
                    />
                  ) : (
                    <span className="text-slate-900 font-bold">{task.task_name}</span>
                  )}
                </TableCell>
                <TableCell className="py-0 px-3 border-r border-slate-100 text-center align-middle">
                  {editingId === task.id ? (
                    <Input 
                      value={editForm.target || ""} 
                      onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                      className="h-6 text-xs text-center border-slate-200 rounded-lg"
                      placeholder="대상..."
                    />
                  ) : (
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold text-[10px]">{task.target || "-"}</span>
                  )}
                </TableCell>
                <TableCell className="py-0 px-3 border-r border-slate-100 align-middle">
                  {editingId === task.id ? (
                    <Input 
                      value={editForm.description || ""} 
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="h-6 text-xs border-slate-200 rounded-lg"
                    />
                  ) : (
                    <span className="text-slate-500 font-medium line-clamp-1">{task.description || "-"}</span>
                  )}
                </TableCell>
                <TableCell className="py-0 px-3 border-r border-slate-100 text-center align-middle">
                  <div className="flex justify-center">
                    {editingId === task.id ? (
                      <Checkbox 
                        checked={editForm.is_input} 
                        onCheckedChange={(val) => setEditForm({ ...editForm, is_input: !!val })}
                        className="rounded-md"
                      />
                    ) : (
                      <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-offset-1 ${task.is_input ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-200 ring-slate-50'}`} />
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-0 px-3 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    {editingId === task.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          onClick= {handleUpdate}
                          disabled={isPending}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-slate-300 hover:bg-slate-50 rounded-lg"
                          onClick={handleEditCancel}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-blue-400 hover:bg-blue-50 rounded-lg"
                          onClick={() => handleEditStart(task)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          onClick={() => handleDelete(task.id, task.task_name)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

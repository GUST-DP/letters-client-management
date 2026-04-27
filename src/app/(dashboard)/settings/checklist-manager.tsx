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
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { 
  addTaskAction, 
  updateTaskAction, 
  deleteTaskAction,
  reorderTaskAction,
  type InputType,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  category: string;
  task_name: string;
  target: string | null;
  description: string | null;
  is_input: boolean;
  input_type: InputType;
  sort_order: number;
  created_at: string;
}

interface Props {
  initialTasks: Task[];
  title: string;
  description: string;
}

const INPUT_TYPE_LABELS: Record<string, string> = {
  "none":  "없음",
  "text":  "수기입력",
  "date":  "날짜선택",
  "file":  "첨부파일",
};

const INPUT_TYPE_BADGE: Record<string, string> = {
  "none": "bg-slate-100 text-slate-400",
  "text": "bg-blue-50 text-blue-600",
  "date": "bg-violet-50 text-violet-600",
  "file": "bg-amber-50 text-amber-600",
};

function toSelectVal(v: InputType): string {
  return v ?? "none";
}
function fromSelectVal(v: string | null | undefined): InputType {
  if (!v || v === "none") return null;
  return v as InputType;
}

export function ChecklistManager({ initialTasks, title, description }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  // 추가 모달
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    category: "",
    task_name: "",
    target: "",
    description: "",
    input_type: null as InputType,
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
        input_type: editForm.input_type,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("항목이 수정되었습니다.");
        setEditingId(null);
        router.refresh();
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
      const result = await addTaskAction({
        ...newForm,
        input_type: newForm.input_type,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("새로운 체크리스트 항목이 추가되었습니다.");
        setIsAddOpen(false);
        setNewForm({ category: "", task_name: "", target: "", description: "", input_type: null });
        router.refresh();
      }
    });
  };

  const handleReorder = (id: string, direction: "up" | "down") => {
    startTransition(async () => {
      const result = await reorderTaskAction(id, direction);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* 통합 헤더 */}
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
          <TableHeader className="bg-[#1B2A4E]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[60px] font-black text-blue-50 border-r border-[#2C3F6D] text-center text-[12px] uppercase tracking-wider px-2">순서</TableHead>
              <TableHead className="w-[50px] font-black text-blue-50 border-r border-[#2C3F6D] text-center text-[12px] uppercase tracking-wider px-2">#</TableHead>
              <TableHead className="w-[150px] font-black text-blue-50 border-r border-[#2C3F6D] text-center text-[12px] uppercase tracking-wider px-3">카테고리</TableHead>
              <TableHead className="w-[200px] font-black text-blue-50 border-r border-[#2C3F6D] text-[12px] uppercase tracking-wider px-3">점검 항목</TableHead>
              <TableHead className="w-[120px] font-black text-blue-50 border-r border-[#2C3F6D] text-center text-[12px] uppercase tracking-wider px-3">대상 및 값</TableHead>
              <TableHead className="font-black text-blue-50 border-r border-[#2C3F6D] text-[12px] uppercase tracking-wider px-3">세부내용(기준)</TableHead>
              <TableHead className="w-[110px] font-black text-blue-50 border-r border-[#2C3F6D] text-center text-[12px] uppercase tracking-wider px-3">입력 유형</TableHead>
              <TableHead className="w-[120px] font-black text-blue-50 text-center text-[12px] uppercase tracking-wider px-3">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialTasks.map((task, index) => (
              <TableRow key={task.id} className="border-b border-slate-100 transition-all hover:bg-slate-50/50 group">
                {/* 순서 변경 버튼 */}
                <TableCell className="py-1 px-1 border-r border-slate-100 text-center align-middle">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      onClick={() => handleReorder(task.id, "up")}
                      disabled={isPending || index === 0}
                      className="p-1 rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleReorder(task.id, "down")}
                      disabled={isPending || index === initialTasks.length - 1}
                      className="p-1 rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </TableCell>

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
                    <span className="text-slate-600 font-bold text-[11px]">{task.target || "-"}</span>
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

                {/* 입력 유형 */}
                <TableCell className="py-0 px-2 border-r border-slate-100 text-center align-middle">
                  {editingId === task.id ? (
                    <Select
                      value={toSelectVal(editForm.input_type ?? null)}
                      onValueChange={(v) => setEditForm({ ...editForm, input_type: fromSelectVal(v) })}
                    >
                      <SelectTrigger className="h-6 text-[10px] border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        <SelectItem value="text">수기입력</SelectItem>
                        <SelectItem value="date">날짜선택</SelectItem>
                        <SelectItem value="file">첨부파일</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${INPUT_TYPE_BADGE[toSelectVal(task.input_type)]}`}>
                      {INPUT_TYPE_LABELS[toSelectVal(task.input_type)]}
                    </span>
                  )}
                </TableCell>

                {/* 관리 버튼 */}
                <TableCell className="py-0 px-3 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    {editingId === task.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          onClick={handleUpdate}
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
        <DialogContent className="sm:max-w-[480px]">
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
                placeholder="예: Phase 1. 계약"
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
                placeholder="공통 / 고객사 / 레터스"
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
              <Label className="text-right">입력 유형</Label>
              <div className="col-span-3">
                <Select
                  value={toSelectVal(newForm.input_type)}
                  onValueChange={(v) => setNewForm({ ...newForm, input_type: fromSelectVal(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="입력 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음 (체크만)</SelectItem>
                    <SelectItem value="text">수기입력 (숫자/텍스트)</SelectItem>
                    <SelectItem value="date">날짜선택</SelectItem>
                    <SelectItem value="file">첨부파일</SelectItem>
                  </SelectContent>
                </Select>
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

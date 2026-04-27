"use client";

import { useState, useTransition, useMemo } from "react";
import {
  OnboardingTask,
  ClientOnboardingStatus,
  toggleOnboardingTaskAction,
  toggleAllOnboardingTasksAction,
} from "../../onboarding-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Save, ChevronRight, Paperclip, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ChecklistViewProps {
  clientId: string;
  tasks: OnboardingTask[];
  initialStatus: ClientOnboardingStatus[];
}

export function ChecklistView({ clientId, tasks, initialStatus }: ChecklistViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<ClientOnboardingStatus[]>(initialStatus);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const totalCount = tasks.length;
  const completedCount = status.filter(s => s.is_completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllSelected = completedCount === totalCount && totalCount > 0;

  // 카테고리별 RowSpan 계산
  const categorySpans = useMemo(() => {
    const spans: Record<number, number> = {};
    let currentCategory = "";
    let spanCount = 0;
    let firstIdx = 0;

    tasks.forEach((task, idx) => {
      if (task.category !== currentCategory) {
        if (spanCount > 0) {
          spans[firstIdx] = spanCount;
        }
        currentCategory = task.category;
        spanCount = 1;
        firstIdx = idx;
      } else {
        spanCount++;
      }
    });
    if (spanCount > 0) {
      spans[firstIdx] = spanCount;
    }
    return spans;
  }, [tasks]);

  const handleToggle = async (taskId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    const taskStatus = status.find(s => s.task_id === taskId);
    const prevStatus = [...status];

    let nextStatus = [...status];
    const existingIdx = status.findIndex(s => s.task_id === taskId);
    if (existingIdx > -1) {
      nextStatus[existingIdx] = { ...nextStatus[existingIdx], is_completed: newVal };
    } else {
      nextStatus.push({ task_id: taskId, is_completed: newVal, completed_at: newVal ? new Date().toISOString() : null, task_value: null, remarks: null });
    }
    setStatus(nextStatus);

    startTransition(async () => {
      const result = await toggleOnboardingTaskAction(
        clientId, taskId, newVal,
        taskStatus?.task_value || null,
        taskStatus?.remarks || null,
        taskStatus?.file_url || null,
        taskStatus?.file_name || null,
      );
      if ("error" in result) {
        toast.error(`업데이트 실패: ${result.error}`);
        setStatus(prevStatus);
      }
    });
  };

  const handleInputChange = (taskId: string, newValue: string) => {
    setStatus(prev => {
      const existingIdx = prev.findIndex(s => s.task_id === taskId);
      if (existingIdx > -1) {
        return prev.map((s, i) => i === existingIdx ? { ...s, task_value: newValue } : s);
      } else {
        return [...prev, { task_id: taskId, is_completed: false, completed_at: null, task_value: newValue, remarks: null }];
      }
    });
  };

  const handleInputBlur = async (taskId: string, isCompleted: boolean, value: string, remarks: string | null) => {
    startTransition(async () => {
      const ts = status.find(s => s.task_id === taskId);
      await toggleOnboardingTaskAction(clientId, taskId, isCompleted, value, remarks, ts?.file_url || null, ts?.file_name || null);
    });
  };

  const handleDateChange = (taskId: string, value: string) => {
    setStatus(prev => {
      const existingIdx = prev.findIndex(s => s.task_id === taskId);
      if (existingIdx > -1) {
        return prev.map((s, i) => i === existingIdx ? { ...s, task_value: value } : s);
      } else {
        return [...prev, { task_id: taskId, is_completed: false, completed_at: null, task_value: value, remarks: null }];
      }
    });
  };

  const handleDateBlur = async (taskId: string, isCompleted: boolean, value: string | null, remarks: string | null) => {
    const ts = status.find(s => s.task_id === taskId);
    startTransition(async () => {
      await toggleOnboardingTaskAction(clientId, taskId, isCompleted, value, remarks, ts?.file_url || null, ts?.file_name || null);
    });
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    setUploadingId(taskId);
    try {
      const supabase = createClient();
      const filePath = `onboarding/${clientId}/${taskId}_${Date.now()}_${file.name}`;
      
      const { error: upErr } = await supabase.storage
        .from("onboarding-files")
        .upload(filePath, file, { upsert: true });

      if (upErr) {
        toast.error(`파일 업로드 실패: ${upErr.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("onboarding-files")
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;
      const ts = status.find(s => s.task_id === taskId);

      // 상태 업데이트
      setStatus(prev => {
        const idx = prev.findIndex(s => s.task_id === taskId);
        if (idx > -1) {
          return prev.map((s, i) => i === idx ? { ...s, file_url: fileUrl, file_name: file.name } : s);
        } else {
          return [...prev, { task_id: taskId, is_completed: false, completed_at: null, task_value: null, remarks: null, file_url: fileUrl, file_name: file.name }];
        }
      });

      startTransition(async () => {
        await toggleOnboardingTaskAction(
          clientId, taskId,
          ts?.is_completed || false,
          ts?.task_value || null,
          ts?.remarks || null,
          fileUrl,
          file.name,
        );
      });
      toast.success("파일이 업로드되었습니다.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileRemove = async (taskId: string) => {
    const ts = status.find(s => s.task_id === taskId);
    setStatus(prev => prev.map(s => s.task_id === taskId ? { ...s, file_url: null, file_name: null } : s));
    startTransition(async () => {
      await toggleOnboardingTaskAction(
        clientId, taskId,
        ts?.is_completed || false,
        ts?.task_value || null,
        ts?.remarks || null,
        null, null,
      );
    });
  };

  const handleRemarkChange = (taskId: string, newRemark: string) => {
    setStatus(prev => {
      const existingIdx = prev.findIndex(s => s.task_id === taskId);
      if (existingIdx > -1) {
        return prev.map((s, i) => i === existingIdx ? { ...s, remarks: newRemark } : s);
      } else {
        return [...prev, { task_id: taskId, is_completed: false, completed_at: null, task_value: null, remarks: newRemark }];
      }
    });
  };

  const handleRemarkBlur = async (taskId: string, isCompleted: boolean, value: string | null, remarks: string) => {
    const ts = status.find(s => s.task_id === taskId);
    startTransition(async () => {
      await toggleOnboardingTaskAction(clientId, taskId, isCompleted, value, remarks, ts?.file_url || null, ts?.file_name || null);
    });
  };

  const handleSelectAll = async () => {
    const nextVal = !isAllSelected;
    const prevStatus = [...status];
    const nextStatus = tasks.map(t => {
      const existing = status.find(s => s.task_id === t.id);
      return {
        task_id: t.id,
        is_completed: nextVal,
        completed_at: nextVal ? new Date().toISOString() : null,
        task_value: existing?.task_value || null,
        remarks: existing?.remarks || null,
        file_url: existing?.file_url || null,
        file_name: existing?.file_name || null,
      };
    });
    setStatus(nextStatus);

    startTransition(async () => {
      const result = await toggleAllOnboardingTasksAction(clientId, nextVal);
      if ("error" in result) {
        toast.error(`업데이트 실패: ${result.error}`);
        setStatus(prevStatus);
      } else {
        toast.success(nextVal ? "모든 항목을 선택했습니다." : "모든 항목 선택을 해제했습니다.");
      }
    });
  };

  const formatNumberWithCommas = (value: string) => {
    if (!value) return "";
    const parts = value.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  return (
    <div className="space-y-3 pb-32 w-full">
      {/* 진행도 섹션 */}
      <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center justify-between gap-8">
        <div className="flex-1">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">전체 진행률</p>
              <h3 className="text-3xl font-black text-primary">{progressPercent}%</h3>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs font-bold mr-1">전체 {totalCount}개 중</span>
              <span className="text-gray-900 font-black text-xl">{completedCount}</span>
              <span className="text-gray-400 text-sm font-bold ml-1">개 완료</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-3 bg-gray-100" />
        </div>
        <div className="hidden md:block w-px h-12 bg-gray-100" />
        <div className="hidden md:flex items-center gap-4">
           <div className={`w-12 h-12 rounded-full flex items-center justify-center ${progressPercent === 100 ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              <CheckCircle2 className="w-6 h-6" />
           </div>
           <div>
              <p className="text-sm font-bold text-gray-900">{progressPercent === 100 ? '작성완료' : '운영 준비 중'}</p>
              <p className="text-xs text-gray-400">항목을 체크하면 실시간으로 저장됩니다.</p>
           </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[#1B2A4E]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[180px] font-bold text-blue-50 text-center border-r border-[#2C3F6D]">카테고리</TableHead>
              <TableHead className="w-[70px] p-0 border-r border-[#2C3F6D]">
                <div
                  className="flex items-center justify-center h-full w-full cursor-pointer select-none py-2 hover:bg-[#2A3E66] transition-colors"
                  onClick={handleSelectAll}
                >
                  <Checkbox
                    checked={isAllSelected}
                    className="w-4 h-4 border-2 border-blue-200 data-checked:bg-white data-checked:border-green-500 data-checked:text-green-600 text-transparent transition-all font-bold"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[240px] font-bold text-blue-50 border-r border-[#2C3F6D] px-6">점검 항목</TableHead>
              <TableHead className="w-[200px] font-bold text-blue-50 border-r border-[#2C3F6D] text-center">대상 및 값</TableHead>
              <TableHead className="font-bold text-blue-50 border-r border-[#2C3F6D] px-6">세부내용(기준)</TableHead>
              <TableHead className="w-[400px] font-bold text-blue-50 px-4 text-center">비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task, idx) => {
              const taskStatus = status.find(s => s.task_id === task.id);
              const isDone = taskStatus?.is_completed || false;
              const taskValue = taskStatus?.task_value || "";
              const rowSpan = categorySpans[idx];

              return (
                <TableRow
                  key={task.id}
                  className={`group transition-colors ${isDone ? 'bg-green-50/10' : 'hover:bg-gray-50/50'}`}
                >
                  {rowSpan && (
                    <TableCell
                      rowSpan={rowSpan}
                      className="border-r py-2 align-top bg-white text-primary group-hover:bg-gray-50/5 text-center"
                    >
                      <div className="sticky top-4">{task.category}</div>
                    </TableCell>
                  )}

                  <TableCell className="border-l text-center align-middle">
                    <Checkbox
                      id={task.id}
                      checked={isDone}
                      onCheckedChange={() => handleToggle(task.id, isDone)}
                      disabled={isPending}
                      className="w-5 h-5 mx-auto border-2 border-gray-300 data-checked:bg-white data-checked:border-green-500 data-checked:text-green-600 text-transparent transition-all font-bold"
                    />
                  </TableCell>

                  <TableCell className={`py-2 px-6 ${(isDone && !task.is_input) ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {task.task_name}
                  </TableCell>

                  {/* 대상 및 값 — input_type에 따라 분기 */}
                  <TableCell className="border-l py-2 text-center px-3">
                    {task.input_type === "text" && (
                      <Input
                        value={formatNumberWithCommas(taskValue)}
                        placeholder="기입..."
                        type="text"
                        inputMode="decimal"
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/,/g, '');
                          if (/^[0-9.]*$/.test(rawVal)) handleInputChange(task.id, rawVal);
                        }}
                        onBlur={(e) => handleInputBlur(task.id, isDone, e.target.value.replace(/,/g, ''), taskStatus?.remarks || null)}
                        className="h-7 text-[10px] text-center border-primary/20 focus:border-primary text-primary bg-blue-50/10 placeholder:text-[9px]"
                        disabled={isPending}
                      />
                    )}

                    {task.input_type === "date" && (
                      <input
                        type="date"
                        value={taskValue || ""}
                        onChange={(e) => handleDateChange(task.id, e.target.value)}
                        onBlur={(e) => handleDateBlur(task.id, isDone, e.target.value || null, taskStatus?.remarks || null)}
                        className="w-full h-7 text-[11px] text-center rounded-md border border-primary/20 bg-violet-50/20 text-violet-700 focus:outline-none focus:border-violet-400 px-1"
                        disabled={isPending}
                      />
                    )}

                    {task.input_type === "file" && (
                      <div className="flex flex-col items-center gap-1">
                        {taskStatus?.file_name ? (
                          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-[10px] text-amber-700 font-medium max-w-full">
                            <Paperclip className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{taskStatus.file_name}</span>
                            <button
                              onClick={() => handleFileRemove(task.id)}
                              className="ml-1 hover:text-red-500 flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className={`cursor-pointer flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded border border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors ${uploadingId === task.id ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Paperclip className="w-3 h-3" />
                            {uploadingId === task.id ? "업로드 중..." : "파일 첨부"}
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(task.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {!task.input_type && (
                      <span className={`${isDone ? 'text-gray-300' : 'text-gray-500'} text-[11px]`}>
                        {task.target || "-"}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className={`border-l py-2 px-6 leading-relaxed ${(isDone && !task.is_input) ? 'text-gray-300' : 'text-gray-500'}`}>
                    {task.description || "-"}
                  </TableCell>

                  <TableCell className="border-l py-2 px-4 shadow-sm">
                    <Input
                      value={taskStatus?.remarks || ""}
                      placeholder="특이사항..."
                      onChange={(e) => handleRemarkChange(task.id, e.target.value)}
                      onBlur={(e) => handleRemarkBlur(task.id, isDone, taskStatus?.task_value || null, e.target.value)}
                      className="h-7 text-[10px] border-gray-200 focus:border-blue-300 bg-white placeholder:text-[9px]"
                      disabled={isPending}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 하단 플로팅 버튼 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <Button
          onClick={() => router.push('/clients')}
          className="h-14 px-10 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg gap-3 transition-transform hover:scale-105 active:scale-95"
        >
          <Save className="w-5 h-5" />
          작성 완료 및 목록으로 이동
          <ChevronRight className="w-5 h-5 opacity-50" />
        </Button>
      </div>
    </div>
  );
}

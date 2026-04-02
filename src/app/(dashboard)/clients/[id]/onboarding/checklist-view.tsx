"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { OnboardingTask, ClientOnboardingStatus, toggleOnboardingTaskAction, toggleAllOnboardingTasksAction } from "../../onboarding-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Save, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
    const existingValue = taskStatus?.task_value || null;
    const existingRemarks = taskStatus?.remarks || null;
    
    // UI 즉시 업데이트
    const prevStatus = [...status];
    const existingIdx = status.findIndex(s => s.task_id === taskId);
    
    let nextStatus = [...status];
    if (existingIdx > -1) {
      nextStatus[existingIdx] = { ...nextStatus[existingIdx], is_completed: newVal };
    } else {
      nextStatus.push({ task_id: taskId, is_completed: newVal, completed_at: newVal ? new Date().toISOString() : null, task_value: null, remarks: null });
    }
    setStatus(nextStatus);

    startTransition(async () => {
      const result = await toggleOnboardingTaskAction(clientId, taskId, newVal, existingValue, existingRemarks);
      if ("error" in result) {
        toast.error(`업데이트 실패: ${result.error}`);
        setStatus(prevStatus);
      } else {
        if (completedCount + (newVal ? 1 : -1) === totalCount && newVal) {
           toast.success("축하합니다! 모든 온보딩이 완료되었습니다.", { position: "top-center" });
        }
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
      const result = await toggleOnboardingTaskAction(clientId, taskId, isCompleted, value, remarks);
      if ("error" in result) {
        toast.error(`입력값 저장 실패: ${result.error}`);
      }
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
    startTransition(async () => {
      const result = await toggleOnboardingTaskAction(clientId, taskId, isCompleted, value, remarks);
      if ("error" in result) {
        toast.error(`비고 저장 실패: ${result.error}`);
      }
    });
  };

  const handleSelectAll = async () => {
    const nextVal = !isAllSelected;
    const prevStatus = [...status];

    // UI 선반영
    const nextStatus = tasks.map(t => {
      const existing = status.find(s => s.task_id === t.id);
      return {
        task_id: t.id,
        is_completed: nextVal,
        completed_at: nextVal ? new Date().toISOString() : null,
        task_value: existing?.task_value || null,
        remarks: existing?.remarks || null
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

  // 숫자 천 단위 쉼표 포맷팅 함수
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

      {/* 스프레드시트 스타일 테이블 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-[180px] font-bold text-gray-900 text-center">카테고리</TableHead>
              <TableHead className="w-[70px] text-center font-bold text-gray-900 border-l p-1">
                <div 
                  className="flex flex-col items-center justify-center gap-1 cursor-pointer select-none py-1 hover:bg-gray-100/50 rounded-md transition-colors"
                  onClick={handleSelectAll}
                >
                  <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">전체</span>
                  <Checkbox 
                    checked={isAllSelected}
                    className="w-4 h-4 border-2 border-gray-300 data-checked:bg-white data-checked:border-green-500 data-checked:text-green-600 text-transparent transition-all font-bold"
                  />
                </div>
              </TableHead>
              <TableHead className="w-[280px] font-bold text-gray-900 border-l px-6">점검 항목</TableHead>
              <TableHead className="w-[150px] font-bold text-gray-900 border-l text-center">대상/값</TableHead>
              <TableHead className="font-bold text-gray-900 border-l px-6">세부 내용 / 기준</TableHead>
              <TableHead className="w-[400px] font-bold text-gray-900 border-l px-4 text-center">비고</TableHead>
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
                      <div className="sticky top-4">
                        {task.category}
                      </div>
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
                  <TableCell className="border-l py-2 text-center px-4">
                    {task.is_input ? (
                      <Input
                        value={formatNumberWithCommas(taskValue)}
                        placeholder="기입..."
                        type="text"
                        inputMode="decimal"
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/,/g, '');
                          if (/^[0-9.]*$/.test(rawVal)) {
                            handleInputChange(task.id, rawVal);
                          }
                        }}
                        onBlur={(e) => handleInputBlur(task.id, isDone, e.target.value.replace(/,/g, ''), taskStatus?.remarks || null)}
                        className="h-9 text-xs text-center border-primary/20 focus:border-primary text-primary bg-blue-50/10"
                        disabled={isPending}
                      />
                    ) : (
                      <span className={`px-2 py-1 rounded bg-gray-100 ${isDone ? 'text-gray-300' : 'text-gray-500'}`}>
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
                        className="h-8 text-[11px] border-gray-200 focus:border-blue-300 bg-white"
                        disabled={isPending}
                      />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 하단 플로팅 저장 버튼 */}
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

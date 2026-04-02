
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ChecklistView } from "./checklist-view";
import { seedOnboardingTasksAction, getClientOnboardingStatusAction } from "../../onboarding-actions";
import { Package, ChevronLeft } from "lucide-react";
import { TransitionLink } from "@/components/ui/transition-link";
import { Button } from "@/components/ui/button";

export default async function ClientOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. 고객사 기본 정보 조회
  const { data: client } = await supabase
    .from("clients")
    .select("company_name, progress_status")
    .eq("id", id)
    .single();

  if (!client) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold mb-4">고객사 정보를 찾을 수 없습니다.</h1>
        <p className="text-gray-500 mb-8">존재하지 않거나 삭제된 고객사일 수 있습니다. (ID: {id})</p>
        <TransitionLink href="/clients">
          <Button>목록으로 돌아가기</Button>
        </TransitionLink>
      </div>
    );
  }

  // 2. 마스터 데이터 시딩 (데이터가 없을 경우에만 작동)
  await seedOnboardingTasksAction();

  // 3. 온보딩 상태 조회
  const statusResult = await getClientOnboardingStatusAction(id);
  if ("error" in statusResult) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">데이터를 불러오는데 실패했습니다: {statusResult.error}</p>
      </div>
    );
  }

  const { tasks, status } = statusResult;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      {/* 서브 헤더 (고객사명 표시) */}
      <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff5c39]/10 w-9 h-9 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-[#ff5c39]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800 leading-tight">{client.company_name}</span>
            <span className="text-[11px] font-bold text-slate-400">현재 상태: {client.progress_status}</span>
          </div>
        </div>
        <TransitionLink href={`/clients/${id}`}>
          <Button variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5 border-slate-200">
            <ChevronLeft className="w-3.5 h-3.5" />
            고객사 상세로
          </Button>
        </TransitionLink>
      </div>

      <div className="px-1">
        <h2 className="text-xl font-black text-slate-800 mb-1 tracking-tight">운영 준비 체크리스트</h2>
        <p className="text-sm font-medium text-slate-400 mb-6">
          최종 운영 전환을 위해 모든 항목을 확인해 주세요. 모든 항목이 완료되면 자동으로 <span className="text-[#58bf6f] font-bold">'운영중'</span> 상태로 전환됩니다.
        </p>
        
        <ChecklistView 
          clientId={id} 
          tasks={tasks || []} 
          initialStatus={status || []} 
        />
      </div>
    </div>
  );
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type OnboardingTask = {
  id: string;
  category: string;
  task_name: string;
  description: string | null;
  target: string | null;
  sort_order: number;
  is_input: boolean;
};

export type ClientOnboardingStatus = {
  task_id: string;
  is_completed: boolean;
  completed_at: string | null;
  task_value?: string | null;
  remarks?: string | null;
};

// 체크리스트 마스터 데이터 초기화용 (최초 1회만 사용 권장)
const INITIAL_MASTER_TASKS = [
  { category: "계약/사전준비", name: "금액관련 세부 사항 계약 체결여부", desc: "용역단가/ 추가서비스단가/ 클레임 공제 등", target: "고객사", order: 1 },
  { category: "계약/사전준비", name: "재고보관료(PLT)", desc: "팔렛트당 재고보관료(원/팔렛)", target: "-", order: 2, is_input: true },
  { category: "계약/사전준비", name: "입고용역료(PLT)", desc: "펄랫트당 입고용역료(원/팔렛)", target: "-", order: 3, is_input: true },
  { category: "계약/사전준비", name: "입고용역료(컨테이너)", desc: "컨테이너 입고용역료 기타 포함)(원/분)", target: "-", order: 4, is_input: true },
  { category: "계약/사전준비", name: "초기물량 기반 셋팅 공헌이익률", desc: "초기물량 기반으로 셋팅 된 공헌이익률(%)", target: "-", order: 5, is_input: true },
  { category: "계약/사전준비", name: "NDA 및 개인정보 처리 합의", desc: "고객사 고객개인정보 활용 동의서", target: "고객사", order: 6 },
  { category: "계약/사전준비", name: "서비스 범위 확정", desc: "현장설치/ 풀필먼트/ 서비스 지역 등", target: "고객사", order: 7 },
  { category: "계약/사전준비", name: "정산기준관련 운영형태 확정", desc: "선수금 및 보험,입금기한 등", target: "고객사", order: 8 },
  { category: "계약/사전준비", name: "거래처 등록 품의", desc: "EP 거래처등록 ", target: "레터스", order: 9 },
  { category: "기준", name: "SLA 설정 및 합의 여부", desc: "고객만족율 / 정시배송율", target: "고객사/레터스", order: 10 },
  { category: "기준", name: "클레임/파손/분실 처리 기준 합의 여부", desc: "분실/파손 등 발생시 금액 청구기준", target: "고객사/레터스", order: 11 },
  { category: "사전교육 및 공유", name: "배송/설치 교육 메뉴얼 제작 및 내부 공유여부", desc: "품목 관련 라스트마일 부분 공유", target: "레터스", order: 12 },
  { category: "사전교육 및 공유", name: "OMS 사용법 교육 진행 여부", desc: "OMS 전반적인 기능 사용법 ", target: "고객사", order: 13 },
  { category: "사전교육 및 공유", name: "입출고 프로세스 교육 진행 여부", desc: "3센터 입고/출고 기준", target: "고객사", order: 14 },
  { category: "사전교육 및 공유", name: "물성 및 입고형태 예상물동량 내부 공유여부", desc: "컨/팔렛 입고 및 제품물성 물동량 등", target: "레터스", order: 15 },
  { category: "데이터/마스터 세팅(OMS)", name: "화주생성", desc: "거래처 등록 이후 OMS 화주생성", target: "고객사", order: 16 },
  { category: "데이터/마스터 세팅(OMS)", name: "화주 초기 계정생성(관리자/화주사)", desc: "화주사 생성이후 계정 생성", target: "레터스", order: 17 },
  { category: "데이터/마스터 세팅(OMS)", name: "초기 단품/세트 코드 셋팅 및 품목별 용역료 / 지급시공비 입력", desc: "OMS 품목별 용역료관리", target: "레터스", order: 18 },
  { category: "데이터/마스터 세팅(OMS)", name: "화주별 초기 운영팔렛 기준확인 및 생성", desc: "팔렛트 관리- 팔렛트 기준정보", target: "레터스", order: 19 },
  { category: "데이터/마스터 세팅(ERP)", name: "화주별 기준납기 셋팅", desc: "ERP 기준납기", target: "레터스", order: 20 },
  { category: "데이터/마스터 세팅(ERP)", name: "OMS 배송예약일 알림톡 맵핑", desc: "ERP SMS정보관리", target: "레터스", order: 21 },
  { category: "데이터/마스터 세팅(ERP)", name: "정산기준 정보 등록", desc: "추가서비스 포함(지급/청구)", target: "레터스", order: 22 },
  { category: "데이터/마스터 세팅(ERP)", name: "서명내용 등록", desc: "ERP 서명내용관리", target: "레터스", order: 23 },
  { category: "데이터/마스터 세팅(ERP)", name: "분해설치/폐기장 서비스 항목 등록", desc: "사다리차/계단반입비 계약내용기반 등록", target: "레터스", order: 24 },
  { category: "데이터/마스터 세팅(ERP)", name: "법정동코드 지역할당 및 작업일 오픈", desc: "서울/경인 및 지방 전체", target: "레터스", order: 25 },
  { category: "시스템 테스트", name: "주문등록/입고등록/반품등록 테스트 완료 여부", desc: "테스트 주문 등록", target: "레터스", order: 26 },
  { category: "운영 조직/커뮤니케이션", name: "고객사/레터스 담당자 매핑", desc: "운영 전반(주문/미출/반품/CS/정산 등)", target: "고객사/레터스", order: 27 },
  { category: "운영 조직/커뮤니케이션", name: "긴급 연락망 공유 여부", desc: "카톡방, 메일링 리스트", target: "고객사/레터스", order: 28 },
  { category: "입고/재고 관리", name: "최초 입고일 협의 및 확정여부", desc: "입고예정일 및 시간, 형태 물량 정보", target: "고객사/레터스", order: 29 },
  { category: "입고/재고 관리", name: "불용재고 처리 방식 및 기준", desc: "폐기, 회수, 이관 등", target: "고객사/레터스", order: 30 },
  { category: "고객사 운영수준", name: "[OMS] 반품 및 반품입고의뢰 등록 가능 여부", desc: "반품 문자 수신시 해당 업무진행가능여부", target: "고객사", order: 31 },
  { category: "고객사 운영수준", name: "[OMS] 재고보충 의뢰 등록 가능 여부", desc: "입고계획 생성 가능여부", target: "고객사", order: 32 },
  { category: "고객사 운영수준", name: "[OMS] 주문등록 가능여부", desc: "일반주문 및 일괄주문 등록가능여부", target: "고객사", order: 33 },
  { category: "고객사 운영수준", name: "바코드 체계 운영 및 출력 가능여부", desc: "단품/세트 코드운영 및 출력기능 보유여부", target: "고객사", order: 34 },
];

/**
 * 온보딩 마스터 데이터 시딩 (테이블이 비어있을 때만 작동)
 */
export async function seedOnboardingTasksAction() {
  const supabase = await createClient();
  
  const { count } = await supabase.from('onboarding_tasks').select('*', { count: 'exact', head: true });
  
  if (count && count > 0) {
    return { success: true };
  }
  
  console.log("No master tasks found. Initializing with default set...");

  const rows = INITIAL_MASTER_TASKS.map(task => ({
    category: task.category,
    task_name: task.name,
    description: task.desc,
    target: task.target,
    sort_order: task.order,
    is_input: task.is_input || false
  }));

  const { error } = await supabase.from('onboarding_tasks').insert(rows);
  if (error) {
    console.error("Master Initialization Error:", error.message);
    return { error: error.message };
  }
  
  return { success: true };
}

/**
 * 특정 고객사의 온보딩 상태 조회 (스냅샷 방식)
 */
export async function getClientOnboardingStatusAction(clientId: string) {
  const supabase = await createClient();
  
  // 1. 해당 고객사에 이미 할당된 테스크가 있는지 확인 (스냅샷 존재 여부)
  const { data: existingTasks, error: sErr } = await supabase
    .from('client_onboarding_tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('sort_order', { ascending: true });
    
  if (sErr) return { error: sErr.message };

  // 2. 만약 하나도 없다면 (최초 진입), 현재 마스터 테스크들을 스냅샷으로 복사하여 할당
  // "이 시점 이후부터의 고객만 변경적용" 요구사항 충족
  if (!existingTasks || existingTasks.length === 0) {
    const { data: masterTasks } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (masterTasks && masterTasks.length > 0) {
      const snapshotRows = masterTasks.map(mt => ({
        client_id: clientId,
        task_id: mt.id,
        is_completed: false,
        category: mt.category,
        task_name: mt.task_name,
        description: mt.description,
        target: mt.target,
        sort_order: mt.sort_order,
        is_input: mt.is_input,
        remarks: null
      }));
      
      const { data: newTasks, error: insErr } = await supabase
        .from('client_onboarding_tasks')
        .insert(snapshotRows)
        .select('*');
      
      if (insErr) {
        console.error("Snapshot creation failed:", insErr.message);
        return { error: `체크리스트 생성 실패: ${insErr.message}` };
      }

      return { 
        tasks: (newTasks || [])
          .map(t => ({
            ...t,
            id: t.task_id
          }))
          .sort((a, b) => a.sort_order - b.sort_order), 
        status: newTasks || [] 
      };
    } else {
      console.warn("No master tasks found in onboarding_tasks table.");
      return { error: "기준 데이터가 없습니다. '기준관리 > 체크리스트 관리'에서 표준 항목을 먼저 등록해주세요." };
    }
  }

  return { 
    tasks: (existingTasks || []).map(t => ({
      ...t,
      id: t.task_id // 컴포넌트 호환성을 위해 ID 매핑
    })), 
    status: existingTasks || [] 
  };
}

/**
 * 항목 상태 업데이트 (입력값 포함)
 */
export async function toggleOnboardingTaskAction(clientId: string, taskId: string, isCompleted: boolean, taskValue: string | null = null, remarks: string | null = null) {
  const supabase = await createClient();
  
  const updateData: any = {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    task_value: taskValue,
    remarks: remarks
  };

  const { error } = await supabase
    .from('client_onboarding_tasks')
    .update(updateData)
    .eq('client_id', clientId)
    .eq('task_id', taskId);

  if (error) return { error: error.message };

  // await checkAndSetOperatingStatus(clientId); // 자동 상태 변경 제거

  revalidatePath(`/clients/${clientId}/onboarding`);
  revalidatePath(`/clients`);
  return { success: true };
}

/**
 * 전제 선택/해제 액션 (스냅샷 대응)
 */
export async function toggleAllOnboardingTasksAction(clientId: string, isCompleted: boolean) {
  const supabase = await createClient();
  
  // 마스터가 아닌 해당 고객사의 스냅샷 항목들을 대상으로 수행
  const { data: tasks } = await supabase
    .from('client_onboarding_tasks')
    .select('task_id')
    .eq('client_id', clientId);

  if (!tasks || tasks.length === 0) return { error: "할당된 체크리스트 항목이 없습니다." };

  const timestamp = isCompleted ? new Date().toISOString() : null;
  const updateData = {
    is_completed: isCompleted,
    completed_at: timestamp,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('client_onboarding_tasks')
    .update(updateData)
    .eq('client_id', clientId);

  if (error) return { error: error.message };

  // await checkAndSetOperatingStatus(clientId); // 자동 상태 변경 제거

  revalidatePath(`/clients/${clientId}/onboarding`);
  revalidatePath(`/clients`);
  return { success: true };
}

async function checkAndSetOperatingStatus(clientId: string) {
  const supabase = await createClient();
  
  // 1. 해당 고객사에게 할당된 전체 테스크 개수 (Snapshot 기준)
  const { count: totalTasks, error: tErr } = await supabase
    .from('client_onboarding_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);
    
  // 2. 완료된 테스크 개수
  const { count: completedTasks, error: cErr } = await supabase
    .from('client_onboarding_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('is_completed', true);

  if (!tErr && !cErr && totalTasks && totalTasks > 0 && totalTasks === completedTasks) {
    await supabase.from('clients').update({ progress_status: '운영중' }).eq('id', clientId);
  }
}

/**
 * 체크리스트가 모두 완료되었는지 확인 (현재 할당된 태스크 기준)
 */
export async function isChecklistCompleteAction(clientId: string) {
  const supabase = await createClient();
  
  // 1. 해당 고객사에게 할당된 태스크 목록 조회
  const { data: tasks, error } = await supabase
    .from('client_onboarding_tasks')
    .select('is_completed')
    .eq('client_id', clientId);
    
  if (error || !tasks || tasks.length === 0) return false;

  // 2. 모든 태스크가 완료되었는지 확인
  const isAllDone = tasks.every(t => t.is_completed);
  return isAllDone;
}

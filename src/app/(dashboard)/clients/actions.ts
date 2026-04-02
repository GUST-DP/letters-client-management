"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { isChecklistCompleteAction } from "./onboarding-actions";

export async function createClientAction(formData: FormData) {
  const company_name = formData.get("company_name") as string;
  const brand_name = formData.get("brand_name") as string;
  const business_number = formData.get("business_number") as string;
  const cost_center_id = formData.get("cost_center_id") as string;
  const service_type_id = formData.get("service_type_id") as string;
  const product_category = formData.get("product_category") as string;
  const contract_type = formData.get("contract_type") as string;
  const remarks = formData.get("remarks") as string;
  const sales_manager_id = formData.get("sales_manager_id") as string;
  const operation_manager_id = formData.get("operation_manager_id") as string;
  const sales_start_date = formData.get("sales_start_date") as string;
  const lead_source = formData.get("lead_source") as string;

  if (!company_name) {
    return { error: "회사명은 필수입니다." };
  }

  const supabase = await createClient();

  // 1. clients 테이블 데이터 삽입
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert([
      {
        company_name,
        brand_name: brand_name || null,
        business_number: business_number || null,
        cost_center_id: cost_center_id || null,
        service_type_id: service_type_id || null,
        product_category: product_category || null,
        contract_type: contract_type || null,
        remarks: remarks || null,
        sales_manager_id: sales_manager_id || null,
        operation_manager_id: (operation_manager_id && operation_manager_id !== "unassigned") ? operation_manager_id : null,
        progress_status: "협의중", // 초기 진행상태
        contract_status: "계약진행중", // 초기 계약상태
        lead_source: lead_source || null,
      },
    ])
    .select()
    .single();

  if (clientError || !client) {
    console.error("고객사 등록 오류:", clientError);
    return { error: "고객사 등록에 실패했습니다." };
  }

  // 영업 시작일이 입력된 경우 온보딩 테이블에도 데이터 생성
  if (sales_start_date) {
    const { error: onboardingError } = await supabase.from("client_onboarding").insert({
      client_id: client.id,
      sales_start_date: sales_start_date,
    });
    if (onboardingError) {
      console.warn("온보딩 정보(영업시작일) 기록 실패:", onboardingError);
      // 메인 클라이언트 생성은 성공했으니 무시하고 진행
    }
  }

  revalidatePath("/clients");
  return { success: true };
}

// --- 인라인 업데이트 액션들 ---

export async function updateClientProgressStatus(clientId: string, newStatus: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ progress_status: newStatus })
    .eq("id", clientId);

  if (error) {
    console.error("진행 상태 업데이트 실패:", error);
    return { error: "진행 상태 변경에 실패했습니다." };
  }
  
  revalidatePath("/clients");
  return { success: true };
}

export async function triggerContractAction(clientIds: string[], action: "complete" | "terminate", customDate?: string) {
  const supabase = await createClient();
  
  if (!clientIds || clientIds.length === 0) return { error: "선택된 고객사가 없습니다." };

  // 계약해지 시 유효성 검사: 계약완료 상태인 고객사만 해지 가능
  /* 
  if (action === "terminate") {
    const { data: currentClients } = await supabase
      .from("clients")
      .select("id, company_name, contract_status")
      .in("id", clientIds);

    const invalidClients = currentClients?.filter(c => c.contract_status !== "계약완료");
    if (invalidClients && invalidClients.length > 0) {
      const names = invalidClients.map(c => c.company_name).join(", ");
      return { error: `계약완료 이후 계약해지가 가능합니다. (대상: ${names})` };
    }
  }
  */

  const dateToUse = customDate || new Date().toISOString().split("T")[0]; // 제공된 날짜가 없으면 오늘 사용
  
  let newProgressStatus = "";
  let newContractStatus = "";
  
  if (action === "complete") {
    // 체크리스트 완료 여부 검사
    for (const id of clientIds) {
      const isComplete = await isChecklistCompleteAction(id);
      if (!isComplete) {
        const { data: client } = await supabase.from("clients").select("company_name").eq("id", id).single();
        return { error: `체크리스트가 모두 작성되어야 계약완료가 가능합니다. (미작성: ${client?.company_name})` };
      }
    }
    newProgressStatus = "운영중";
    newContractStatus = "계약완료";
  } else {
    newProgressStatus = "운영종료";
    newContractStatus = "계약해지";
  }

  const { data: updatedClients, error: clientError } = await supabase
    .from("clients")
    .update({ 
      progress_status: newProgressStatus, 
      contract_status: newContractStatus 
    })
    .in("id", clientIds)
    .select();

  if (clientError) {
    console.error(`계약 ${action} 상태 업데이트 실패:`, clientError);
    return { error: `상태 변경 처리에 실패했습니다: ${clientError.message} (${clientError.code})` };
  }

  if (!updatedClients || updatedClients.length === 0) {
    console.warn(`[triggerContractAction] 업데이트된 행이 없습니다. (IDs: ${clientIds.join(",")})`);
    return { error: "업데이트 대상 고객사를 찾을 수 없거나 권한이 없습니다." };
  }

  // 업데이트 결과 로그 확인
  console.log(`[triggerContractAction] ${action} 반영 완료 - 대상:${updatedClients.length}건, 진행:${newProgressStatus}, 계약:${newContractStatus}`);

  // 2. Onboarding 테이블에 날짜(계약일 또는 해지일) Upsert 처리
  const upsertPromises = clientIds.map(clientId => {
    const upsertData: any = { client_id: clientId };
    if (action === "complete") {
      upsertData.contract_date = dateToUse;
    } else {
      upsertData.contract_end_date = dateToUse;
    }
    return supabase.from("client_onboarding").upsert(upsertData, { onConflict: "client_id" });
  });

  const results = await Promise.all(upsertPromises);
  results.forEach((result, index) => {
    if (result.error) {
      console.warn(`클라이언트 ID ${clientIds[index]}의 온보딩 정보(계약/해지일) 기록 실패:`, result.error);
    }
  });
  
  revalidatePath("/clients");
  return { success: true };
}

export async function updateClientOpManager(clientId: string, managerId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ operation_manager_id: managerId })
    .eq("id", clientId);

  if (error) {
    console.error("운영 담당자 업데이트 실패:", error);
    return { error: "담당자 변경에 실패했습니다." };
  }
  
  revalidatePath("/clients");
  return { success: true };
}

export async function updateClientSalesManager(clientId: string, managerId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ sales_manager_id: managerId })
    .eq("id", clientId);

  if (error) {
    console.error("영업 담당자 업데이트 실패:", error);
    return { error: "영업 담당자 변경에 실패했습니다." };
  }
  
  revalidatePath("/clients");
  return { success: true };
}

export async function deleteClientsAction(clientIds: string[]) {
  const supabase = await createClient();
  
  if (!clientIds || clientIds.length === 0) return { error: "선택된 고객사가 없습니다." };

  const { error } = await supabase
    .from("clients")
    .delete()
    .in("id", clientIds);

  if (error) {
    console.error("고객사 삭제 실패:", error);
    return { error: "삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/clients");
  return { success: true };
}

export async function updateApprovalLinkAction(clientIds: string[], link: string) {
  const supabase = await createClient();
  
  if (!clientIds || clientIds.length === 0) return { error: "선택된 고객사가 없습니다." };

  const { error } = await supabase
    .from("clients")
    .update({ approval_link: link || null })
    .in("id", clientIds);

  if (error) {
    console.error("품의 링크 업데이트 실패:", error);
    return { error: "품의 링크 저장 중 오류가 발생했습니다." };
  }

  revalidatePath("/clients");
  return { success: true };
}

export async function updateClientDetailsAction(
  clientIds: string[], 
  details: {
    lead_source?: string | null;
    cost_center_id?: string | null;
    sales_start_date?: string | null;
    contract_date?: string | null;
  }
) {
  const supabase = await createClient();
  
  if (!clientIds || clientIds.length === 0) return { error: "선택된 고객사가 없습니다." };

  // 1. clients 테이블 업데이트
  const clientUpdate: any = {};
  if (details.lead_source !== undefined) clientUpdate.lead_source = details.lead_source;
  if (details.cost_center_id !== undefined) clientUpdate.cost_center_id = details.cost_center_id;

  if (Object.keys(clientUpdate).length > 0) {
    const { error: clientError } = await supabase
      .from("clients")
      .update(clientUpdate)
      .in("id", clientIds);

    if (clientError) {
      console.error("고객사 세부 정보 업데이트 실패:", clientError);
      return { error: `기본 정보 수정 실패: ${clientError.message}` };
    }
  }

  // 2. client_onboarding 테이블 업데이트 (배열 순회하며 Upsert)
  if (details.sales_start_date !== undefined || details.contract_date !== undefined) {
    const upsertPromises = clientIds.map(id => {
      const upsertData: any = { client_id: id };
      if (details.sales_start_date !== undefined) upsertData.sales_start_date = details.sales_start_date || null;
      if (details.contract_date !== undefined) upsertData.contract_date = details.contract_date || null;
      
      return supabase
        .from("client_onboarding")
        .upsert(upsertData, { onConflict: "client_id" });
    });

    const results = await Promise.all(upsertPromises);
    const errorResult = results.find(r => r.error);
    if (errorResult && errorResult.error) {
      console.error("온보딩 정보 업데이트 실패:", errorResult.error);
      return { error: `날짜 정보 수정 실패: ${errorResult.error.message}` };
    }
  }

  revalidatePath("/clients");
  return { success: true };
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- 코스트센터 (cost_centers) 관련 액션 ---
export async function addCostCenterAction(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "코스트센터 명칭을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("cost_centers").insert({ name });

  if (error) {
    if (error.code === '23505') return { error: "이미 존재하는 코스트센터입니다." };
    return { error: "코스트센터 추가에 실패했습니다." };
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function updateCostCenterAction(id: string, name: string) {
  if (!name) return { error: "코스트센터 명칭을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("cost_centers").update({ name }).eq("id", id);

  if (error) {
    if (error.code === '23505') return { error: "이미 존재하는 코스트센터입니다." };
    return { error: "코스트센터 수정에 실패했습니다." };
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCostCenterAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cost_centers").delete().eq("id", id);
  
  if (error) {
    console.error(error);
    return { error: "삭제에 실패했습니다. 사용 중인 코스트센터일 수 있습니다." };
  }
  revalidatePath("/settings");
  return { success: true };
}

// --- 서비스 형태 (service_types) 관련 액션 ---
export async function addServiceTypeAction(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "서비스 형태 명칭을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("service_types").insert({ name });

  if (error) {
    if (error.code === '23505') return { error: "이미 존재하는 서비스 형태입니다." };
    return { error: "서비스 형태 추가에 실패했습니다." };
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function updateServiceTypeAction(id: string, name: string) {
  if (!name) return { error: "서비스 형태 명칭을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("service_types").update({ name }).eq("id", id);

  if (error) {
    if (error.code === '23505') return { error: "이미 존재하는 서비스 형태입니다." };
    return { error: "서비스 형태 수정에 실패했습니다." };
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteServiceTypeAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("service_types").delete().eq("id", id);
  
  if (error) {
    console.error(error);
    return { error: "삭제에 실패했습니다. 사용 중인 서비스 형태일 수 있습니다." };
  }
  revalidatePath("/settings");
  return { success: true };
}

// --- 체크리스트 마스터 (onboarding_tasks) 관련 액션 ---

export type InputType = "text" | "date" | "file" | null;

export async function addTaskAction(data: {
  category: string;
  task_name: string;
  target?: string;
  description?: string;
  input_type: InputType;
}) {
  const supabase = await createClient();

  // 현재 최대 sort_order 조회 후 +1 자동 부여
  const { data: maxRow } = await supabase
    .from("onboarding_tasks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("onboarding_tasks").insert([{
    category: data.category,
    task_name: data.task_name,
    target: data.target,
    description: data.description,
    input_type: data.input_type,
    is_input: !!data.input_type,
    sort_order: nextOrder,
  }]);

  if (error) {
    console.error("체크리스트 항목 추가 실패:", error);
    return { error: "항목 추가에 실패했습니다." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateTaskAction(id: string, data: {
  category?: string;
  task_name?: string;
  target?: string | null;
  description?: string | null;
  input_type?: InputType;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("onboarding_tasks")
    .update({
      ...data,
      is_input: !!data.input_type,
    })
    .eq("id", id);

  if (error) {
    console.error("체크리스트 항목 수정 실패:", error);
    return { error: "항목 수정에 실패했습니다." };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteTaskAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("onboarding_tasks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("체크리스트 항목 삭제 실패:", error);
    return { error: "항목 삭제에 실패했습니다." };
  }

  revalidatePath("/settings");
  return { success: true };
}

/**
 * ▲▼ 순서 변경: 해당 항목과 인접 항목의 sort_order 스왑
 */
export async function reorderTaskAction(id: string, direction: "up" | "down") {
  const supabase = await createClient();

  // 현재 항목의 sort_order 조회
  const { data: current } = await supabase
    .from("onboarding_tasks")
    .select("sort_order")
    .eq("id", id)
    .single();

  if (!current) return { error: "항목을 찾을 수 없습니다." };

  const currentOrder = current.sort_order;

  // 인접 항목 조회 (위 또는 아래)
  const { data: neighbor } = await supabase
    .from("onboarding_tasks")
    .select("id, sort_order")
    .eq("sort_order", direction === "up" ? currentOrder - 1 : currentOrder + 1)
    .single();

  if (!neighbor) return { error: "이미 맨 처음/끝 항목입니다." };

  // sort_order 스왑
  const { error: e1 } = await supabase
    .from("onboarding_tasks")
    .update({ sort_order: neighbor.sort_order })
    .eq("id", id);

  const { error: e2 } = await supabase
    .from("onboarding_tasks")
    .update({ sort_order: currentOrder })
    .eq("id", neighbor.id);

  if (e1 || e2) return { error: "순서 변경에 실패했습니다." };

  revalidatePath("/settings");
  return { success: true };
}

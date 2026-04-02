"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- (기존 추가 액션들 유지를 위해 가져오기) ---
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

export async function addTaskAction(data: {
  category: string;
  task_name: string;
  target?: string;
  description?: string;
  is_input: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_tasks").insert([data]);

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
  is_input?: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("onboarding_tasks")
    .update(data)
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

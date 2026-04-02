"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(profileId: string, data: {
  full_name: string;
  team: string;
  role: string;
  menu_permissions: string[];
}) {
  const supabase = await createClient();

  // full_name, role 저장 (항상 존재하는 컬럼)
  const { error: baseError } = await supabase
    .from("profiles")
    .update({ full_name: data.full_name, role: data.role })
    .eq("id", profileId);

  if (baseError) return { error: baseError.message };

  // team, menu_permissions 저장 (SQL 마이그레이션 + 스키마 캐시 갱신 필요)
  const { error: extError } = await supabase
    .from("profiles")
    .update({ team: data.team, menu_permissions: data.menu_permissions })
    .eq("id", profileId);

  if (extError) {
    if (
      extError.message.toLowerCase().includes("column") ||
      extError.message.toLowerCase().includes("schema")
    ) {
      return {
        error:
          "팀명/메뉴권한 컬럼을 찾을 수 없습니다.\nSupabase SQL Editor에서 아래를 실행해주세요:\nNOTIFY pgrst, 'reload schema';",
      };
    }
    return { error: extError.message };
  }

  revalidatePath("/settings/accounts");
  return { success: true };
}

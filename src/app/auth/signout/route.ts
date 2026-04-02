import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return new Response("로그아웃 중에 에러가 발생했습니다.", { status: 500 });
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

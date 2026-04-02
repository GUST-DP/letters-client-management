"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addClientNote(clientId: string, content: string, authorName: string) {
  if (!content.trim()) return { error: "내용을 입력해주세요." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("client_notes").insert({
    client_id: clientId,
    content: content.trim(),
    author_id: user.id,
    author_name: authorName,
  });

  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteClientNote(noteId: string, clientId: string, role: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 관리자만 삭제 가능
  if (role !== "관리자") return { error: "관리자만 삭제할 수 있습니다." };

  const { error } = await supabase.from("client_notes").delete().eq("id", noteId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

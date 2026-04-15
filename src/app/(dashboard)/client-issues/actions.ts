"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTeamsMessage, getKSTTimestamp } from "@/lib/teams";

export async function createClientOperationIssue(formData: FormData) {
  const supabase = await createClient();

  const client_id = formData.get("client_id") as string;
  const occurrence_date = formData.get("occurrence_date") as string;
  const issue_category = formData.get("issue_category") as string;
  const title = formData.get("title") as string;
  const issue_content = formData.get("issue_content") as string;
  const responsible_party = formData.get("responsible_party") as string;
  const author_name = formData.get("author_name") as string;
  const author_email = formData.get("author_email") as string;
  let file_url = formData.get("file_url") as string || null;
  const file_name = formData.get("file_name") as string || null;

  const { error } = await supabase.from("client_operation_issues").insert({
    client_id,
    occurrence_date,
    issue_category,
    title: title || issue_content.substring(0, 20),
    issue_content,
    responsible_party,
    status: "이슈등록",
    author_name,
    author_email,
    file_url,
  });

  if (error) return { error: error.message };

  // 팀즈 알림 전송 (배경 실행)
  (async () => {
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('company_name')
        .eq('id', client_id)
        .single();

      const timestamp = getKSTTimestamp(); // 한국 표준시(KST) 기준

      sendTeamsMessage({
        title: `🔔 새로운 [고객사]이슈가 등록되었습니다.`,
        subtitle: timestamp,
        buttonUrl: "https://letus-client-management.vercel.app/client-issues",
        buttonLabel: "고객사 이슈관리 바로가기",
        buttons: file_url ? [{ label: "첨부파일 보기", url: file_url }] : [],
        sections: [
          { "name": "고객사", "value": clientData?.company_name || "알수없음" },
          { "name": "이슈유형", "value": issue_category },
          { "name": "등록자", "value": author_name },
        ],
        lastSection: { "name": "이슈내용 요약", "value": issue_content },
      });
    } catch (err) {
      console.error("팀즈 알림 실패 (고객사 이슈 등록):", err);
    }
  })();

  revalidatePath("/client-issues");
  return { success: true };
}

export async function updateClientOperationIssue(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const action_taken = formData.get("action_taken") as string;
  const preventive_measure = formData.get("preventive_measure") as string;
  const responder_name = formData.get("responder_name") as string;
  let response_file_url = formData.get("response_file_url") as string || undefined;
  const response_file_name = formData.get("response_file_name") as string || undefined;

  const updateData: any = {
    status,
    action_taken,
    preventive_measure,
    responder_name,
    updated_at: new Date().toISOString()
  };

  if (response_file_url) {
    updateData.response_file_url = response_file_url;
    updateData.response_file_name = response_file_name;
  }

  const { error } = await supabase
    .from("client_operation_issues")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  // 팀즈 알림 전송 (배경 실행)
  (async () => {
    try {
      const { data: issueData } = await supabase
        .from('client_operation_issues')
        .select('*, clients(company_name)')
        .eq('id', id)
        .single();

      const timestamp = getKSTTimestamp(); // 한국 표준시(KST) 기준

      sendTeamsMessage({
        title: `✅ 조치사항이 등록되었습니다.`,
        subtitle: timestamp,
        buttonUrl: "https://letus-client-management.vercel.app/client-issues",
        buttonLabel: "고객사 이슈관리 바로가기",
        buttons: response_file_url ? [{ label: "증빙파일 보기", url: response_file_url }] : [],
        sections: [
          { "name": "고객사", "value": (issueData as any)?.clients?.company_name || "알수없음" },
          { "name": "이슈유형", "value": (issueData as any)?.issue_category || "-" },
          { "name": "상태", "value": status },
          { "name": "답변등록자", "value": responder_name },
        ],
        lastSections: [
          { "name": "이슈내용 요약", "value": (issueData as any)?.issue_content || "-" },
          { "name": "조치내용", "value": action_taken, "color": "Good" },
          { "name": "재발방지 대책", "value": preventive_measure || "-", "color": "Warning" },
        ],
      });
    } catch (err) {
      console.error("팀즈 알림 실패 (고객사 이슈 업데이트):", err);
    }
  })();

  revalidatePath("/client-issues");
  return { success: true };
}

export async function deleteClientOperationIssue(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("client_operation_issues")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/client-issues");
  return { success: true };
}

// ── 고객사 담당자 CRUD ──

export async function getClientContacts(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message };
  return { data: data || [] };
}

export async function upsertClientContact(
  clientId: string,
  contact: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    department?: string;
    is_primary?: boolean;
  }
) {
  const supabase = await createClient();

  if (contact.id) {
    const { error } = await supabase
      .from("client_contacts")
      .update({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        position: contact.position,
        department: contact.department,
        is_primary: contact.is_primary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contact.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("client_contacts").insert({
      client_id: clientId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      position: contact.position,
      department: contact.department,
      is_primary: contact.is_primary ?? false,
    });
    if (error) return { error: error.message };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteClientContact(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("client_contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

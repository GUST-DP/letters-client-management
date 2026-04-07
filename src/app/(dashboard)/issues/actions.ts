"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTeamsMessage } from "@/lib/teams";

export async function createIssue(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("client_issues").insert({
    occurrence_date: formData.get('occurrence_date') as string,
    client_id: formData.get('client_id') as string,
    issue_type: formData.get('issue_type') as string,
    issue_content: formData.get('issue_content') as string,
    occurrence_subject: formData.get('occurrence_subject') as string,
    root_cause: formData.get('root_cause') as string,
    title: formData.get('title') as string,
    manager_name: formData.get('manager_name') as string,
    construction_team: formData.get('construction_team') as string,
    fu_required_team: (formData.get('fu_required_team') as string) || null,
    author_name: formData.get('author_name') as string,
    status: (formData.get('status') as string) || '이슈등록',
    file_url: formData.get('file_url') as string || null,
    file_name: formData.get('file_name') as string || null
  });

  if (error) {
    console.error('Insert error:', error);
    return { error: error.message };
  }

  const file_url = formData.get('file_url') as string || null;
  const file_name = formData.get('file_name') as string || null;

  // 팀즈 알림 전송 (배경 실행)
  (async () => {
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('company_name')
        .eq('id', formData.get('client_id'))
        .single();

      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      sendTeamsMessage({
        title: `🔔 새로운 이슈가 등록되었습니다.`,
        subtitle: timestamp,
        subtitles: [`📌 건명: ${formData.get('title') || "-"}`],
        buttonUrl: "https://letus-client-management.vercel.app/issues",
        buttonLabel: "서비스 이슈관리 바로가기",
        buttons: file_url ? [{ label: "첨부파일 보기", url: file_url }] : [],
        sections: [
          { "name": "고객사", "value": clientData?.company_name || "알수없음" },
          { "name": "이슈유형", "value": formData.get('issue_type') as string },
          { "name": "권역장", "value": formData.get('manager_name') as string },
          { "name": "시공팀", "value": formData.get('construction_team') as string },
          { "name": "등록자", "value": formData.get('author_name') as string },
        ],
        lastSection: { "name": "이슈내용 요약", "value": formData.get('issue_content') as string },
      });
    } catch (err) {
      console.error("팀즈 알림 실패 (서비스 이슈 등록):", err);
    }
  })();

  revalidatePath("/issues");
  return { success: true };
}

export async function updateIssueResponse(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get('issueId') as string;
  const status = '조치완료';
  const action_taken = formData.get('action_taken') as string;
  const preventive_measure = formData.get('preventive_measure') as string;
  const responder_name = formData.get('responder_name') as string;
  const response_file_url = formData.get('response_file_url') as string || null;
  const response_file_name = formData.get('response_file_name') as string || null;

  const updateData: any = {
    action_taken,
    preventive_measure,
    responder_name,
    status,
    updated_at: new Date().toISOString()
  };

  if (response_file_url) {
    updateData.response_file_url = response_file_url;
    updateData.response_file_name = response_file_name;
  }

  const { error } = await supabase
    .from("client_issues")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error('Update response error:', error);
    return { error: error.message };
  }

  // 팀즈 알림 전송 (배경 실행)
  (async () => {
    try {
      const { data: issueData } = await supabase
        .from('client_issues')
        .select('*, clients(company_name)')
        .eq('id', id)
        .single();

      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      sendTeamsMessage({
        title: `✅ 조치등록이 완료되었습니다.`,
        subtitle: timestamp,
        buttonUrl: "https://letus-client-management.vercel.app/issues",
        buttonLabel: "고객사 이슈관리 바로가기",
        buttons: response_file_url ? [{ label: "증빙파일 보기", url: response_file_url }] : [],
        sections: [
          { "name": "고객사", "value": (issueData as any)?.clients?.company_name || "알수없음" },
          { "name": "이슈유형", "value": (issueData as any)?.issue_type || "-" },
          { "name": "건명", "value": (issueData as any)?.title || "-" },
          { "name": "권역장", "value": (issueData as any)?.manager_name || "-" },
          { "name": "시공팀", "value": (issueData as any)?.construction_team || "-" },
          { "name": "답변등록자", "value": responder_name },
        ],
        lastSections: [
          { "name": "조치내용", "value": action_taken, "color": "Good" },
          { "name": "재발방지 대책", "value": preventive_measure || "-", "color": "Warning" },
        ],
      });
    } catch (err) {
      console.error("팀즈 알림 실패 (서비스 이슈 조치 완료):", err);
    }
  })();

  revalidatePath("/issues");
  return { success: true };
}

export async function deleteIssue(issueId: string) {
  const supabase = await createClient();
  
  console.log(`[Delete] Attempting to delete issue ID: ${issueId}`);

  // 실제 삭제된 데이터를 반환받아 성공 여부를 확실히 체크
  const { data, error } = await supabase
    .from("client_issues")
    .delete()
    .eq("id", issueId)
    .select();

  if (error) {
    console.error('[Delete] Supabase error:', error);
    return { error: `삭제 실패: ${error.message}` };
  }

  if (!data || data.length === 0) {
    console.warn('[Delete] No data deleted. Check RLS or if ID exists.');
    return { error: "삭제할 데이터를 찾지 못했거나 권한이 없습니다." };
  }

  console.log(`[Delete] Successfully deleted row:`, data[0]);
  revalidatePath("/issues");
  return { success: true };
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendTeamsMessage } from "@/lib/teams";

export async function createIssue(formData: FormData) {
  const supabase = await createClient();

  const file = formData.get('file') as File;
  let file_url = null;
  let file_name = null;

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `issues/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('issue_attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return { error: '파일 업로드 실패' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('issue_attachments')
      .getPublicUrl(filePath);

    file_url = publicUrl;
    file_name = file.name;
  }

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
    file_url: file_url,
    file_name: file_name
  });

  if (error) {
    console.error('Insert error:', error);
    return { error: error.message };
  }

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
        title: `🔔 [서비스 이슈] 새로운 이슈가 등록되었습니다.`,
        subtitle: `${timestamp} | 등록자: ${formData.get('author_name')}`,
        buttonUrl: "https://letters-client-management.vercel.app/issues",
        buttonLabel: "🛡️ 서비스 이슈관리 바로가기",
        buttons: file_url ? [{ label: "📎 첨부파일 보기", url: file_url }] : [],
        sections: [
          { "name": "고객사", "value": clientData?.company_name || "알수없음" },
          { "name": "이슈유형", "value": formData.get('issue_type') as string },
          { "name": "권역장", "value": formData.get('manager_name') as string },
          { "name": "시공팀", "value": formData.get('construction_team') as string },
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

  const issueId = formData.get('issueId') as string;
  const file = formData.get('file') as File;
  
  let response_file_url = null;
  let response_file_name = null;

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `res_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `responses/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('issue_attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Response file upload error:', uploadError);
      return { error: '증빙 파일 업로드 실패' };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('issue_attachments')
      .getPublicUrl(filePath);

    response_file_url = publicUrl;
    response_file_name = file.name;
  }

  const updateData: any = {
    action_taken: formData.get('action_taken') as string,
    preventive_measure: formData.get('preventive_measure') as string,
    responder_name: formData.get('responder_name') as string,
    status: '조치완료',
    updated_at: new Date().toISOString()
  };

  if (response_file_url) {
    updateData.response_file_url = response_file_url;
    updateData.response_file_name = response_file_name;
  }

  const { error } = await supabase
    .from("client_issues")
    .update(updateData)
    .eq("id", issueId);

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
        .eq('id', issueId)
        .single();

      const now = new Date();
      const timestamp = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      sendTeamsMessage({
        title: `✅ [서비스 이슈] 조치등록이 완료되었습니다.`,
        subtitle: `${timestamp} | 답변등록자: ${formData.get('responder_name')}`,
        buttonUrl: "https://letters-client-management.vercel.app/issues",
        buttonLabel: "🛡️ 서비스 이슈관리 바로가기",
        buttons: response_file_url ? [{ label: "📎 증빙파일 보기", url: response_file_url }] : [],
        sections: [
          { "name": "고객사", "value": (issueData as any)?.clients?.company_name || "알수없음" },
          { "name": "이슈유형", "value": (issueData as any)?.issue_type || "-" },
          { "name": "권역장", "value": (issueData as any)?.manager_name || "-" },
          { "name": "시공팀", "value": (issueData as any)?.construction_team || "-" },
        ],
        lastSections: [
          { "name": "조치내용", "value": formData.get('action_taken') as string, "color": "Good" },
          { "name": "재발방지 대책", "value": formData.get('preventive_measure') as string || "-", "color": "Warning" },
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

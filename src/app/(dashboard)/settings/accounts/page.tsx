import { createClient } from "@/utils/supabase/server";
import { AccountTable } from "./account-table";
import { Users2, Info } from "lucide-react";

export default async function AccountsPage() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, team, menu_permissions")
    .order("created_at", { ascending: true });

  if (error) console.error("profiles 조회 오류:", error.message);

  const typedProfiles = (profiles ?? []).map((p: any) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name ?? null,
    role: p.role ?? null,
    team: p.team ?? null,
    menu_permissions: p.menu_permissions ?? null,
  }));


  return (
    <div className="animate-in fade-in duration-500">
      {/* 테이블 */}
      <div className="w-full">
        <AccountTable 
          profiles={typedProfiles} 
          title="계정관리"
          description="시스템에 등록된 계정의 권한 및 정보를 관리합니다."
        />
      </div>

      {/* 안내 카드 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-[11px] text-blue-700 space-y-1 shadow-sm">
        <div className="font-bold text-xs text-blue-800 mb-1">메뉴 권한 안내</div>
        <div>• <strong>대시보드</strong>: 매출 현황, KPI 카드, 차트 열람</div>
        <div>• <strong>고객사 관리</strong>: 고객사 목록, 체크리스트 열람/편집</div>
        <div>• <strong>매출 및 입금</strong>: 매출 데이터 열람/입력</div>
        <div>• <strong>기준관리</strong>: 코스트센터, 서비스 형태, 체크리스트 항목 관리</div>
        <div>• <strong>계정관리</strong>: 계정 권한 설정 (이 페이지)</div>
        <div className="pt-1 text-blue-500">⚠ SQL 마이그레이션 실행 후 팀명/메뉴권한 편집 기능이 활성화됩니다.</div>
      </div>
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CostCenterManager } from "./cost-center-manager";
import { ServiceTypeManager } from "./service-type-manager";
import { ChecklistManager } from "./checklist-manager";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const currentTab = tab || "costcenter";
  const supabase = await createClient();

  // 코스트센터 목록 조회
  const { data: costCenters } = await supabase
    .from("cost_centers")
    .select("*")
    .order("created_at", { ascending: false });

  // 서비스 형태 목록 조회
  const { data: serviceTypes } = await supabase
    .from("service_types")
    .select("*")
    .order("created_at", { ascending: false });

  // 체크리스트(마스터 테스크) 목록 조회
  const { data: tasks } = await supabase
    .from("onboarding_tasks")
    .select("*")
    .order("category", { ascending: true })
    .order("id", { ascending: true });

  const renderContent = () => {
    switch (currentTab) {
      case "costcenter":
        return (
          <CostCenterManager 
            initialData={costCenters || []} 
            title="코스트센터 관리" 
            description="신규 고객사 등록 시 분류 체계로 사용되는 코스트센터 목록입니다."
          />
        );
      case "servicetype":
        return (
          <ServiceTypeManager 
            initialData={serviceTypes || []} 
            title="서비스 형태 관리" 
            description="고객사가 제공받는 서비스의 유형을 정의하며, 정산 및 운영 기준이 됩니다."
          />
        );
      case "checklist":
        return (
          <ChecklistManager 
            initialTasks={tasks || []} 
            title="체크리스트 관리" 
            description="시스템에서 공통으로 사용되는 표준 체크리스트 항목을 관리합니다."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
}

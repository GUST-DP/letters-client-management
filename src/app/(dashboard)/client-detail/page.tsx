import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ClientDetailHub } from "./client-detail-hub";

export default async function ClientDetailPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id,
      company_name,
      brand_name,
      progress_status,
      contract_status,
      lead_source,
      rel_cost_center:cost_centers (id, name),
      service_types (id, name),
      profiles_sales:sales_manager_id (id, full_name, email),
      profiles_op:operation_manager_id (id, full_name, email),
      client_onboarding (sales_start_date, contract_date, contract_end_date)
    `)
    .order("company_name");

  // 고객사별 서비스이슈 건수
  const { data: serviceIssuesCounts } = await supabase
    .from("client_issues")
    .select("client_id, status");

  // 고객사별 고객사이슈 건수
  const { data: opIssuesCounts } = await supabase
    .from("client_operation_issues")
    .select("client_id, status");

  return (
    <>
      <div className="space-y-3 w-full pb-8">
        <ClientDetailHub
          clients={(clients as any[]) || []}
          serviceIssues={serviceIssuesCounts || []}
          opIssues={opIssuesCounts || []}
        />
      </div>
    </>
  );
}

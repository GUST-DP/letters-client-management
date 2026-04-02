import { createClient } from "@/utils/supabase/server";
import { Database } from "@/types/database.types";
import { ClientTable } from "./client-table";
import { ClientData } from "./columns";

// Supabase Join Query Return Type
export type ClientWithRelations = Database['public']['Tables']['clients']['Row'] & {
  cost_centers: Database['public']['Tables']['cost_centers']['Row'] | null;
  service_types: Database['public']['Tables']['service_types']['Row'] | null;
  profiles_sales: Database['public']['Tables']['profiles']['Row'] | null;
  profiles_op: Database['public']['Tables']['profiles']['Row'] | null;
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 병렬 데이터 페칭으로 성능 최적화
  const [
    { data: clients, error },
    { data: costCenters },
    { data: serviceTypes },
    { data: profiles },
    { count: totalTaskCount }
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(`
        *,
        rel_cost_center:cost_centers (id, name),
        service_types (id, name),
        profiles_sales:sales_manager_id (id, full_name, email),
        profiles_op:operation_manager_id (id, full_name, email),
        client_onboarding (sales_start_date, contract_date, contract_end_date),
        client_onboarding_tasks (id, is_completed)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("cost_centers").select("id, name").order("name"),
    supabase.from("service_types").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
    supabase.from("onboarding_tasks").select("*", { count: 'exact', head: true })
  ]);

  const typedClients = (clients as unknown as ClientData[]) || [];

  return (
    <>
      <div className="space-y-3 w-full pb-3">
        {/* 헤더 섹션 */}
        <div className="bg-white p-0 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <ClientTable 
            data={typedClients} 
            profiles={profiles || []} 
            costCenters={costCenters || []} 
            serviceTypes={serviceTypes || []}
            totalTaskCount={totalTaskCount || 0}
          />
        </div>
      </div>
    </>
  );
}

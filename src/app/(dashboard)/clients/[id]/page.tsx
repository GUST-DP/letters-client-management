import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ClientDetailClient } from "./client-detail-client";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select(`
      *,
      rel_cost_center:cost_centers (id, name),
      service_types (id, name),
      profiles_sales:sales_manager_id (id, full_name, email),
      profiles_op:operation_manager_id (id, full_name, email),
      client_onboarding (sales_start_date, contract_date, contract_end_date)
    `)
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: checklistTasks } = await supabase
    .from("client_onboarding_tasks")
    .select("*")
    .eq("client_id", id)
    .order("sort_order", { ascending: true });

  const { data: serviceIssues } = await supabase
    .from("client_issues")
    .select("*")
    .eq("client_id", id)
    .order("occurrence_date", { ascending: false })
    .limit(30);

  const { data: operationIssues } = await supabase
    .from("client_operation_issues")
    .select("*")
    .eq("client_id", id)
    .order("occurrence_date", { ascending: false })
    .limit(30);

  const { data: contacts } = await supabase
    .from("client_contacts")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: true });

  // 메모
  const { data: notes } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  // 현재 사용자 role
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // 매출 데이터
  const currentYear = new Date().getFullYear();
  const prevMonth = (() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  })();

  const { data: salesData } = await supabase
    .from("sales")
    .select("sales_month, total_amount, deposit_status")
    .eq("client_id", id)
    .gte("sales_month", `${currentYear}-01`)
    .lte("sales_month", `${currentYear}-12`);

  const annualTotal = (salesData || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const prevMonthSales = (salesData || []).find(s => s.sales_month === prevMonth)?.total_amount ?? null;

  // 미수금: 전체 기간 deposit_status='미수금'인 건의 total_amount 합산
  const { data: uncollectedData } = await supabase
    .from("sales")
    .select("total_amount")
    .eq("client_id", id)
    .eq("deposit_status", "미수금");
  const uncollectedAmount = (uncollectedData || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);

  return (
    <>
      <div className="space-y-3 w-full pb-8">
        <ClientDetailClient
          client={client as any}
          clientId={id}
          checklistTasks={checklistTasks || []}
          serviceIssues={serviceIssues || []}
          operationIssues={operationIssues || []}
          contacts={contacts || []}
          userEmail={user.email!}
          userName={profile?.full_name || user.email!}
          userRole={profile?.role || ""}
          notes={notes || []}
          annualTotal={annualTotal}
          prevMonthSales={prevMonthSales}
          prevMonth={prevMonth}
          uncollectedAmount={uncollectedAmount}
        />
      </div>
    </>
  );
}

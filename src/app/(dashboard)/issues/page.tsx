import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { IssuesClient } from "./issues-client";

export default async function IssuesPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 병렬 데이터 페칭으로 성능 최적화
  const [
    { data: issues },
    { data: clients },
    { data: profileTeams },
    { data: profile }
  ] = await Promise.all([
    supabase
      .from("client_issues")
      .select(`
        *,
        client:clients(company_name)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, company_name")
      .order("company_name"),
    supabase
      .from("profiles")
      .select("team"),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
  ]);
    
  const teams = Array.from(new Set(profileTeams?.map(p => p.team).filter(Boolean))) as string[];

  return (
    <>
      <div className="space-y-3 w-full pb-3">
        <IssuesClient 
          initialIssues={issues || []} 
          clients={clients || []} 
          teams={teams}
          userEmail={user.email!}
          userName={profile?.full_name || user.email!}
        />
      </div>
    </>
  );
}

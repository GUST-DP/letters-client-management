import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ClientIssuesClient } from "./client-issues-client";

export default async function ClientIssuesPage() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const [
    { data: issuesData },
    { data: clientsData },
    { data: profileData }
  ] = await Promise.all([
    supabase
      .from("client_operation_issues")
      .select(`
        *,
        clients(company_name)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, company_name")
      .order("company_name"),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", authUser.id)
      .single()
  ]);

  return (
    <ClientIssuesClient
      issues={issuesData || []}
      clients={clientsData || []}
      userEmail={authUser.email || ""}
      userName={profileData?.full_name || authUser.email || ""}
    />
  );
}

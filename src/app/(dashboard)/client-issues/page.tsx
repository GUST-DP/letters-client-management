"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ClientIssueTable } from "./client-issues-table";
import { ClientIssueResponseForm } from "./client-issue-response-form";

export default function ClientIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    setUser(authUser);

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

    setIssues(issuesData || []);
    setClients(clientsData || []);
    setProfile(profileData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return null;

  const currentSelectedIssue = selectedIssue ? issues.find(i => i.id === selectedIssue.id) || selectedIssue : null;

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* 상단: 목록 영역 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <ClientIssueTable
          data={issues}
          clients={clients}
          userEmail={user?.email || ""}
          userName={profile?.full_name || user?.email || ""}
          onRowClick={(issue) => setSelectedIssue(issue)}
          selectedId={selectedIssue?.id}
          onDeleteSuccess={() => setSelectedIssue(null)}
        />
      </div>

      {/* 하단: 상세 조치 영역 */}
      <div className="flex-none h-[460px]">
        <ClientIssueResponseForm 
          selectedIssue={currentSelectedIssue}
          userEmail={user?.email || ""}
          userName={profile?.full_name || user?.email || ""}
        />
      </div>
    </div>
  );
}

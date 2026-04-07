"use client";

import { useState } from "react";
import { ClientIssueTable } from "./client-issues-table";
import { ClientIssueResponseForm } from "./client-issue-response-form";

interface ClientIssuesClientProps {
  issues: any[];
  clients: { id: string; company_name: string }[];
  userEmail: string;
  userName: string;
}

export function ClientIssuesClient({
  issues,
  clients,
  userEmail,
  userName,
}: ClientIssuesClientProps) {
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  const currentSelectedIssue = selectedIssue 
    ? issues.find(i => i.id === selectedIssue.id) || selectedIssue 
    : null;

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* 상단: 목록 영역 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <ClientIssueTable
          data={issues}
          clients={clients}
          userEmail={userEmail}
          userName={userName}
          onRowClick={(issue) => setSelectedIssue(issue)}
          selectedId={selectedIssue?.id}
          onDeleteSuccess={() => setSelectedIssue(null)}
        />
      </div>

      {/* 하단: 상세 조치 영역 */}
      <div className="flex-none h-[460px]">
        <ClientIssueResponseForm 
          selectedIssue={currentSelectedIssue}
          userEmail={userEmail}
          userName={userName}
        />
      </div>
    </div>
  );
}

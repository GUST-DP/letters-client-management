"use client";

import { useState } from "react";
import { IssueTable } from "./issue-table";
import { IssueResponseForm } from "./issue-response-form";

interface IssuesClientProps {
  initialIssues: any[];
  clients: { id: string; company_name: string }[];
  teams: string[];
  userEmail: string;
  userName: string;
}

export function IssuesClient({ initialIssues, clients, teams, userEmail, userName }: IssuesClientProps) {
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  const handleRowClick = (issue: any) => {
    setSelectedIssue(issue);
  };

  return (
    <div className="flex flex-col gap-3 pb-10">
      {/* 상단: 마스터 그리드 (이슈 목록) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <IssueTable 
          data={initialIssues} 
          clients={clients} 
          teams={teams}
          userEmail={userEmail} 
          userName={userName}
          onRowClick={handleRowClick}
          onDeleteSuccess={() => setSelectedIssue(null)}
          selectedId={selectedIssue?.id}
        />
      </div>

      {/* 하단: 디테일 섹션 (조치 사항 입력) */}
      <div className="flex-none h-[400px]">
        <IssueResponseForm 
          selectedIssue={selectedIssue} 
          userEmail={userEmail} 
          userName={userName}
        />
      </div>
    </div>
  );
}

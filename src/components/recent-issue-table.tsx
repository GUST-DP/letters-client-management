"use client";

import { useState } from "react";
import { IssueDetailModal } from "@/app/issues/add-issue-modal";

interface RecentIssueTableProps {
  issues: any[];
  clients: any[];
}

export function RecentIssueTable({ issues, clients }: RecentIssueTableProps) {
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetail = (issue: any) => {
    setSelectedIssue(issue);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full border-collapse table-fixed">
          <thead className="bg-slate-800 border-b border-slate-700 text-[13px]">
            <tr>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[58px] whitespace-nowrap border-r border-slate-600">날짜</th>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[95px] whitespace-nowrap border-r border-slate-600">고객사</th>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[90px] whitespace-nowrap border-r border-slate-600">건명</th>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[105px] whitespace-nowrap border-r border-slate-600">이슈유형</th>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[156px] border-r border-slate-600">이슈내용</th>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[65px] whitespace-nowrap border-r border-slate-600">권역장</th>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[65px] whitespace-nowrap border-r border-slate-600">시공팀</th>
              <th className="py-2 px-2 text-center font-bold text-slate-200 w-[76px] whitespace-nowrap">상태</th>
            </tr>
          </thead>
          <tbody>
            {(issues.length > 0 ? issues : Array(5).fill(null)).map((issue, idx) => (
              <tr key={issue?.id || idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                {issue ? (
                  <>
                    <td className="py-2 px-2 text-center text-slate-500 font-medium whitespace-nowrap text-[12px]">{issue.occurrence_date.slice(5)}</td>
                    <td className="py-2 px-2 text-center text-slate-800 font-bold whitespace-nowrap truncate text-[12px]">{issue.clients?.company_name}</td>
                    <td className="py-2 px-2 text-center text-slate-600 whitespace-nowrap truncate font-medium text-[12px]" title={issue.title}>{issue.title}</td>
                    <td className="py-2 px-2 text-center text-slate-500 whitespace-nowrap truncate text-[12px]">{issue.issue_type || "-"}</td>
                    <td className="py-2 px-2 text-left max-w-0">
                      <div
                        onClick={() => handleOpenDetail(issue)}
                        className="text-blue-600 font-bold truncate cursor-pointer hover:text-blue-800 hover:underline transition-all flex items-center gap-1 text-[12px]"
                        title={issue.issue_content}
                      >
                        <span className="text-[13px] shrink-0">🔍</span>
                        <span className="truncate">{issue.issue_content || "-"}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center text-slate-500 whitespace-nowrap truncate text-[12px]">{issue.manager_name || "-"}</td>
                    <td className="py-2 px-2 text-center text-slate-500 whitespace-nowrap truncate text-[12px]">{issue.construction_team || "-"}</td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                        (issue.status === "조치등록" || issue.status === "조치완료")
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-rose-50 text-rose-600 border border-rose-100"
                      }`}>
                        {(issue.status === "조치등록" || issue.status === "조치완료") ? "조치완료" : "이슈등록"}
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td colSpan={8} className="py-2 px-2 text-slate-300 italic text-center text-[12px]">-</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <IssueDetailModal
        issue={selectedIssue}
        clients={clients}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

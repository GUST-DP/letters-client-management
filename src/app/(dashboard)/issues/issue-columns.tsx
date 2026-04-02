"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const getIssueColumns = (
  onDetail: (issue: any) => void,
  onDelete: (id: string) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "id",
    header: "No",
    cell: ({ row }) => {
      return <div className="text-center text-slate-500 font-code">{row.index + 1}</div>;
    },
    size: 50,
  },
  {
    accessorKey: "occurrence_date",
    header: "발생일",
    cell: ({ row }) => {
      const val = row.getValue("occurrence_date") as string;
      return <div className="text-center font-bold text-slate-700">{val}</div>;
    },
    size: 100,
  },
  {
    accessorKey: "status",
    header: "진행상태",
    cell: ({ getValue }) => {
      const val = getValue() as string;
      const isCompleted = val === "조치등록" || val === "조치완료";
      let className = "font-bold text-[11.5px]";
      
      if (val === "이슈등록") {
        className += " bg-rose-50 text-rose-600 border-rose-200";
      } else if (val === "담당부서 확인 중") {
        className += " bg-amber-50 text-amber-600 border-amber-200";
      } else if (isCompleted) {
        className += " bg-emerald-50 text-emerald-600 border-emerald-200";
      }

      return (
        <div className="text-center">
          <Badge variant="outline" className={className}>
            {isCompleted ? "조치등록" : (val || "이슈등록")}
          </Badge>
        </div>
      );
    },
    size: 95,
  },
  {
    id: "client_name",
    accessorFn: (row) => row.client?.company_name,
    header: "고객사",
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return <div className="font-bold text-slate-700 truncate">{val || "-"}</div>;
    },
    size: 130,
  },
  {
    accessorKey: "issue_type",
    header: "이슈유형",
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return (
        <div className="text-center truncate">
          <Badge variant="outline" className="bg-slate-50 text-slate-600 font-medium whitespace-nowrap">
            {val}
          </Badge>
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: "title",
    header: "건명",
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return <div className="w-[130px] font-bold text-slate-800 truncate" title={val}>{val}</div>;
    },
    size: 130,
  },
  {
    accessorKey: "issue_content",
    header: "이슈내용",
    cell: ({ row, getValue }) => {
      const val = getValue() as string;
      return (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDetail(row.original);
          }}
          className="w-[320px] text-blue-600 hover:text-blue-800 hover:underline text-[13px] font-bold truncate text-left flex items-center gap-1 group"
          title="상세 보기"
        >
          <span className="text-[11.5px] group-hover:scale-110 transition-transform shrink-0">🔍</span>
          <span className="truncate">{val || "-"}</span>
        </button>
      );
    },
    size: 320,
  },
  {
    accessorKey: "occurrence_subject",
    header: "발생주체",
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return <div className="text-center text-slate-600 truncate">{val}</div>;
    },
    size: 110,
  },
  {
    accessorKey: "root_cause",
    header: "발생원인",
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return <div className="text-center text-slate-600 truncate">{val}</div>;
    },
    size: 110,
  },
  {
    accessorKey: "manager_name",
    header: "담당자 및 권역장",
    cell: ({ getValue }) => <div className="text-center truncate">{getValue() as string}</div>,
    size: 130,
  },
  {
    accessorKey: "construction_team",
    header: "시공팀",
    cell: ({ getValue }) => <div className="text-center truncate">{getValue() as string}</div>,
    size: 110,
  },
  {
    id: "attachment",
    header: "첨부파일",
    cell: ({ row }) => {
      const fileUrl = row.original.file_url;
      if (!fileUrl) return <div className="text-center text-slate-300">-</div>;
      return (
        <div className="text-center">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 px-2 items-center justify-center text-slate-500 hover:text-[#ff5c39] transition-colors" title={row.original.file_name || "첨부파일 보기"}>
            <Paperclip className="h-4 w-4" />
          </a>
        </div>
      );
    },
    size: 65,
  },
  {
    accessorKey: "author_name",
    header: "이슈등록자",
    cell: ({ getValue }) => <div className="text-center text-slate-500 truncate">{getValue() as string}</div>,
    size: 110,
  },
];

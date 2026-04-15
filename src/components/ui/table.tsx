"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// 고객사 계약관리 기준 통일 행높이
// 핵심: td 내부를 fixed-height div로 감싸서 강제 클리핑
// → CSS height/max-height가 tr/td에서 무시되는 브라우저 동작 우회
// ─────────────────────────────────────────────
const ROW_H = 30       // 데이터 행 높이 (px)
const HEAD_H = 28      // 헤더 행 높이 (px)

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom border-collapse", className)}
        {...props}
      />
    </div>
  )
}

// sticky 헤더 (틀고정)
function TableHeader({ className, style, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      style={{ position: "sticky", top: 0, zIndex: 10, ...style }}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, style, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, style, children, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-center align-middle font-black whitespace-nowrap border-r border-slate-700/40 last:border-r-0 uppercase tracking-wider [&:has([role=checkbox])]:pr-0",
        className
      )}
      style={{
        padding: 0,
        height: `${HEAD_H}px`,
        fontSize: "11px",
        ...style,
      }}
      {...props}
    >
      {/* 내부 wrapper로 높이 강제 고정 */}
      <div
        style={{
          height: `${HEAD_H}px`,
          lineHeight: `${HEAD_H}px`,
          padding: "0 10px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </th>
  )
}

function TableCell({ className, style, children, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "align-middle border-r border-slate-100 last:border-r-0 [&:has([role=checkbox])]:pr-0",
        className
      )}
      style={{
        padding: 0,
        height: `${ROW_H}px`,
        fontSize: "11px",
        ...style,
      }}
      {...props}
    >
      {/* 내부 wrapper로 높이 강제 고정 — 어떤 내부 요소도 이 높이를 초과 불가 */}
      <div
        style={{
          height: `${ROW_H}px`,
          lineHeight: `${ROW_H}px`,
          padding: "0 10px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </td>
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

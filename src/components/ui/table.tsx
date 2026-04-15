"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// 고객사 계약관리 기준 통일 행높이 (inline style)
// CSS 클래스로는 td/tr에 max-height가 무시되므로
// inline style + line-height 조합으로 강제 적용
// ─────────────────────────────────────────────
const ROW_HEIGHT = 30          // 데이터 행 높이 (px)
const HEADER_HEIGHT = 28       // 헤더 행 높이 (px)
const CELL_FONT = "11px"       // 셀 폰트 크기

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

// sticky 헤더 (틀고정) 적용
function TableHeader({ className, style, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        ...style,
      }}
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
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
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
      style={{
        height: `${ROW_HEIGHT}px`,
        ...style,
      }}
      {...props}
    />
  )
}

function TableHead({ className, style, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "px-3 text-center align-middle font-black whitespace-nowrap text-foreground border-r border-slate-700/40 last:border-r-0 [&:has([role=checkbox])]:pr-0 uppercase tracking-wider",
        className
      )}
      style={{
        height: `${HEADER_HEIGHT}px`,
        fontSize: "11px",
        lineHeight: `${HEADER_HEIGHT}px`,
        padding: "0 12px",
        ...style,
      }}
      {...props}
    />
  )
}

function TableCell({ className, style, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 align-middle whitespace-nowrap border-r border-slate-100 last:border-r-0 [&:has([role=checkbox])]:pr-0",
        className
      )}
      style={{
        height: `${ROW_HEIGHT}px`,
        fontSize: CELL_FONT,
        lineHeight: `${ROW_HEIGHT}px`,
        padding: "0 12px",
        overflow: "hidden",
        ...style,
      }}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
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

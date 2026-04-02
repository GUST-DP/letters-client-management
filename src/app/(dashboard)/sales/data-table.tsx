"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  totals?: {
    total_amount: number;
    deposited_amount: number;
    unpaid_amount: number;
  };
  rowSelection?: any;
  onRowSelectionChange?: any;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totals,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange,
  })

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Table className="text-xs">
        <TableHeader className="bg-slate-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead 
                    key={header.id}
                    className="h-12 text-center font-black text-slate-300 border-r border-slate-700/50 last:border-r-0 text-[13px] uppercase tracking-wider px-4 font-black"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-b border-slate-100 transition-all hover:bg-slate-50/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id}
                    className="py-1.5 px-4 border-r border-slate-100 last:border-r-0 align-middle text-xs"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center font-bold text-slate-400">
                조회된 매출 데이터가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {totals && data.length > 0 && (
          <tfoot className="bg-slate-50/50 border-t-2 border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="text-center font-black text-slate-700 h-12 uppercase tracking-tighter text-[10px]">TOTAL SUMMARY</TableCell>
              <TableCell className="text-right font-black text-blue-600 text-[13px] border-r border-slate-200/50">
                {new Intl.NumberFormat("ko-KR").format(totals.total_amount)}
              </TableCell>
              <TableCell className="text-right font-black text-emerald-600 text-[13px] border-r border-slate-200/50">
                {new Intl.NumberFormat("ko-KR").format(totals.deposited_amount)}
              </TableCell>
              <TableCell className="text-right font-black text-rose-600 text-[13px]">
                {new Intl.NumberFormat("ko-KR").format(totals.unpaid_amount)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
          </tfoot>
        )}
      </Table>
    </div>
  )
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import { UploadedSalesData, uploadSalesBulk } from "./actions";
import { Download } from "lucide-react";

// DB 컬럼과 매핑하기 위한 맵 정의
const columnMapping: Record<string, keyof UploadedSalesData> = {
  "고객사명": "client_name",
  "매출월": "sales_month",
  "매출액": "total_amount",
  "입금액": "deposited_amount",
  "입금일자": "deposit_date",
};

export function BulkUploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewCount, setPreviewCount] = useState<number>(0);
  const [parsedData, setParsedData] = useState<UploadedSalesData[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["고객사명", "매출월", "매출액", "입금액", "입금일자"];
    const csvContent = "\uFEFF" + headers.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `매출일괄업로드양식.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseExcel = async (file: File) => {
    setErrorMsg("");
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const rawJson = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
      
      if (rawJson.length === 0) {
        throw new Error("파일에 데이터가 없습니다.");
      }

      // 맵핑 로직: 한글 헤더를 영문 key로 변환
      const mappedData: UploadedSalesData[] = rawJson.map(row => {
        const newRow: any = {};
        for (const [key, value] of Object.entries(row)) {
          const mappedKey = columnMapping[key];
          if (mappedKey) {
             let finalValue = value;
             // 엑셀에서 날짜 서식으로 입력 시 시리얼 넘버로 넘어오는 현상 방어
             if (typeof value === "number" && (mappedKey === "sales_month" || mappedKey === "deposit_date")) {
               // 엑셀의 현대 날짜 시리얼 번호는 보통 30000 (1982년) ~ 70000 (2091년) 사이입니다.
               // 사용자가 2024.01 처럼 소수로 입력한 것도 number로 잡히므로 분기처리.
               if (value > 30000 && value < 70000) {
                 try {
                   const dt = XLSX.SSF.parse_date_code(value);
                   if (dt) {
                     if (mappedKey === "sales_month") {
                       finalValue = `${dt.y}-${String(dt.m).padStart(2, '0')}`;
                     } else {
                       finalValue = `${dt.y}-${String(dt.m).padStart(2, '0')}-${String(dt.d).padStart(2, '0')}`;
                     }
                   }
                 } catch(e) { /* ignore fallback */ }
               } else {
                 finalValue = String(value); // 2024.01 처럼 단순 숫자로 적었을 경우
               }
             }
             if (typeof finalValue === "string") {
               if (mappedKey === "sales_month" || mappedKey === "deposit_date") {
                 // 1. 공백 제거
                 finalValue = finalValue.trim().replace(/\s+/g, '');
                 // 2. 점(.)이나 슬래시(/)를 하이픈(-)으로 변경
                 finalValue = finalValue.replace(/[\.\/]/g, '-');
                 // 3. 끝에 하이픈이 남아있으면 제거 (예: 2025-01-)
                 if (finalValue.endsWith('-')) finalValue = finalValue.slice(0, -1);
               }
             }

             newRow[mappedKey] = finalValue;
          }
        }
        return newRow as UploadedSalesData;
      });

      // 필수값 및 날짜 형식 검증
      for (let i = 0; i < mappedData.length; i++) {
        const r = mappedData[i];
        if (!r.client_name || !r.sales_month || r.total_amount === undefined) {
          throw new Error(`${i + 1}번째 데이터에 필수 컬럼(고객사명, 매출월, 매출액)이 누락되었습니다.`);
        }

        // 매출월 형식 검증 (YYYY-MM)
        const smRegex = /^\d{4}-\d{2}$/;
        if (!smRegex.test(r.sales_month)) {
          throw new Error(`${i + 1}번째 건: 매출월 형식이 올바르지 않습니다. (입력값: ${r.sales_month}, 권장: YYYY-MM)`);
        }

        // 입금일자 형식 검증 (YYYY-MM-DD)
        if (r.deposit_date) {
          const ddRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!ddRegex.test(r.deposit_date)) {
            throw new Error(`${i + 1}번째 건: 입금일자 형식이 올바르지 않습니다. (입력값: ${r.deposit_date}, 권장: YYYY-MM-DD)`);
          }
        }
      }

      setParsedData(mappedData);
      setPreviewCount(mappedData.length);

    } catch (err: any) {
      setErrorMsg(err.message || "엑셀 파일을 처리하는 중 오류가 발생했습니다.");
      setParsedData([]);
      setPreviewCount(0);
    }
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) return;

    setPending(true);
    setErrorMsg("");

    const result = await uploadSalesBulk(parsedData);
    
    setPending(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      alert(`${result.count}건의 매출 데이터가 성공적으로 등록되었습니다.`);
      setOpen(false);
      setFile(null);
      setParsedData([]);
      setPreviewCount(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-8 bg-[#414344] text-white hover:bg-[#414344]/90 px-3 font-bold text-xs" />}>
        CSV/Excel 일괄 업로드
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>매출 데이터 일괄 업로드</DialogTitle>
          <DialogDescription>
            지정된 양식의 Excel 또는 CSV 파일을 업로드하여 대량의 매출 건을 업데이트합니다.
            첫 행은 헤더(고객사명, 매출월, 매출액, 입금액, 입금일자)여야 합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-600 font-medium">업로드 전 템플릿(양식)이 필요하신가요?</span>
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} className="h-7 text-xs flex gap-1 items-center px-2">
              <Download className="w-3 h-3" />
              양식 다운로드
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file_upload">파일 선택</Label>
            <Input 
              id="file_upload" 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              disabled={pending}
            />
          </div>
          
          {previewCount > 0 && !errorMsg && (
            <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-md">
              <span className="font-semibold">{previewCount}건</span>의 유효한 데이터를 발견했습니다. 등록을 진행하시겠습니까?
            </div>
          )}

          {errorMsg && <p className="text-sm text-destructive font-medium">{errorMsg}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>취소</Button>
            <Button onClick={handleSubmit} disabled={pending || parsedData.length === 0}>
              {pending ? "등록 중..." : "일괄 등록"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

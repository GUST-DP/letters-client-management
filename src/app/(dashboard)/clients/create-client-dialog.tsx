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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientAction } from "./actions";

interface Props {
  costCenters: { id: string; name: string }[];
  serviceTypes: { id: string; name: string }[];
  profiles: { id: string; full_name: string | null; email: string }[];
}

export function CreateClientDialog({ costCenters, serviceTypes, profiles }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Select 필드 상태 관리 (ID 노출 방지 위함) - string | null 타입으로 변경하여 Lint 해결
  const [ccId, setCcId] = useState<string | null>(null);
  const [stId, setStId] = useState<string | null>(null);
  const [smId, setSmId] = useState<string | null>(null);
  const [omId, setOmId] = useState<string | null>(null);
  const [leadSource, setLeadSource] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    // Select 값들을 FormData에 명시적으로 추가
    formData.set("cost_center_id", ccId || "");
    formData.set("service_type_id", stId || "");
    formData.set("sales_manager_id", smId || "");
    formData.set("operation_manager_id", omId || "");
    formData.set("lead_source", leadSource || "");

    const result = await createClientAction(formData);

    setPending(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else if (result.success) {
      setOpen(false);
      // 상태 초기화
      setCcId(null);
      setStId(null);
      setSmId(null);
      setOmId(null);
      setLeadSource(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="h-8 bg-[#414344] text-white hover:bg-[#414344]/90 px-3" />}>
        신규 고객사 등록
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>신규 고객사 등록</DialogTitle>
          <DialogDescription>
            새로운 고객사(화주사)의 기본 정보를 입력해주세요. 등록 시 상태는 '협의중'으로 시작됩니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-red-500">회사명(필수)</Label>
            <Input id="company_name" name="company_name" required placeholder="예: (주)퍼시스" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brand_name">브랜드명</Label>
            <Input id="brand_name" name="brand_name" placeholder="예: 시디즈" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead_source">영업 인입 경로</Label>
            <Select 
              name="lead_source" 
              value={leadSource} 
              onValueChange={(val) => setLeadSource(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="인입 경로를 선택하세요">
                  {leadSource}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="네이버 풀필먼트 서비스신청">네이버 풀필먼트 서비스신청</SelectItem>
                <SelectItem value="인적경로">인적경로</SelectItem>
                <SelectItem value="홈페이지 문의">홈페이지 문의</SelectItem>
                <SelectItem value="콜드메일 회신">콜드메일 회신</SelectItem>
                <SelectItem value="박람회">박람회</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_number">사업자번호</Label>
            <Input id="business_number" name="business_number" placeholder="000-00-00000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_center_id">코스트센터(분류)</Label>
            <Select 
              name="cost_center_id" 
              value={ccId} 
              onValueChange={(val) => setCcId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="코스트센터를 선택하세요">
                  {costCenters.find(c => c.id === ccId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {costCenters.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_type_id">서비스 형태</Label>
            <Select 
              name="service_type_id" 
              value={stId} 
              onValueChange={(val) => setStId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="서비스 형태를 선택하세요">
                  {serviceTypes.find(s => s.id === stId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_manager_id">영업 담당자</Label>
            <Select 
              name="sales_manager_id" 
              value={smId} 
              onValueChange={(val) => setSmId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="영업 담당자 배정">
                  {profiles.find(p => p.id === smId) ? (profiles.find(p => p.id === smId)?.full_name ? `${profiles.find(p => p.id === smId)?.full_name} (${profiles.find(p => p.id === smId)?.email})` : profiles.find(p => p.id === smId)?.email) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name ? `${p.full_name} (${p.email})` : p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operation_manager_id">운영 담당자</Label>
            <Select 
              name="operation_manager_id" 
              value={omId} 
              onValueChange={(val) => setOmId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="운영 담당자 배정 (선택)">
                  {profiles.find(p => p.id === omId) ? (profiles.find(p => p.id === omId)?.full_name ? `${profiles.find(p => p.id === omId)?.full_name} (${profiles.find(p => p.id === omId)?.email})` : profiles.find(p => p.id === omId)?.email) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">미배정</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name ? `${p.full_name} (${p.email})` : p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sales_start_date">영업 시작일</Label>
            <Input 
              id="sales_start_date" 
              name="sales_start_date" 
              type="date" 
              defaultValue={new Date().toISOString().split('T')[0]} 
            />
          </div>

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={pending}>
              {pending ? "등록 중..." : "등록 완료"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

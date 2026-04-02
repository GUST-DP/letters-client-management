"use client";

import { useState, useTransition } from "react";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSalesAction } from "./actions";
import { SalesData } from "./columns";

interface EditSalesDialogProps {
  sale: SalesData;
}

export function EditSalesDialog({ sale }: EditSalesDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // State-based form for zero dependencies
  const [formData, setFormData] = useState({
    sales_month: sale.sales_month,
    total_amount: sale.total_amount,
    deposit_status: sale.deposit_status,
    payment_lead_time: sale.payment_lead_time,
  });

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSave() {
    // Basic validation
    if (!/^\d{4}-\d{2}$/.test(formData.sales_month)) {
      toast.error("매출 월 형식이 올바르지 않습니다. (YYYY-MM)");
      return;
    }

    startTransition(async () => {
      const result = await updateSalesAction(sale.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("매출 정보가 성공적으로 수정되었습니다.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center rounded-md h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors focus-visible:outline-none"
      >
        <Edit2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>매출 데이터 수기 수정</DialogTitle>
          <DialogDescription>
            {sale.clients?.company_name}의 매출 정보를 직접 수정합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sales_month">매출 월 (YYYY-MM)</Label>
            <Input 
              id="sales_month"
              placeholder="2026-03" 
              value={formData.sales_month}
              onChange={(e) => handleChange("sales_month", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total_amount">총 매출액 (원)</Label>
            <Input 
              id="total_amount"
              type="number" 
              value={formData.total_amount}
              onChange={(e) => handleChange("total_amount", Number(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>입금 상태</Label>
            <Select 
              value={formData.deposit_status} 
              onValueChange={(val) => handleChange("deposit_status", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="대기중">대기중</SelectItem>
                <SelectItem value="입금완료">입금완료</SelectItem>
                <SelectItem value="미수금">미수금</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment_lead_time">입금 리드타임 (일)</Label>
            <Input 
              id="payment_lead_time"
              type="number" 
              value={formData.payment_lead_time || ""}
              onChange={(e) => handleChange("payment_lead_time", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave}
            disabled={isPending} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? "저장 중..." : "수정 완료"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

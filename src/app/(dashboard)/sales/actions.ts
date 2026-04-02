"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { differenceInDays, lastDayOfMonth } from "date-fns";

export type UploadedSalesData = {
  client_name: string;
  sales_month: string; // YYYY-MM
  total_amount: number;
  deposited_amount?: number;
  deposit_date?: string;
};

export async function uploadSalesBulk(data: UploadedSalesData[]) {
  if (!data || data.length === 0) {
    return { error: "업로드할 데이터가 없습니다." };
  }

  const supabase = await createClient();

  // 1. 고객사명 매핑 검증
  const clientNames = [...new Set(data.map(d => d.client_name))];
  const { data: clientsData, error: clientsError } = await supabase
    .from("clients")
    .select("id, company_name")
    .in("company_name", clientNames);

  if (clientsError) {
    return { error: "고객사 정보를 조회하는 중 오류가 발생했습니다." };
  }

  const insertData = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const clientMatch = clientsData?.find(c => c.company_name === row.client_name);
    
    if (!clientMatch) {
      return { error: `${i + 1}행: 등록되지 않은 고객사명입니다. (${row.client_name})` };
    }

    let leadTime = null;
    if (row.deposit_date) {
      const salesMonthStr = String(row.sales_month);
      let year = NaN, month = NaN;
      if (salesMonthStr.includes("-")) {
        [year, month] = salesMonthStr.split("-").map(Number);
      } else if (salesMonthStr.length >= 6) {
        year = Number(salesMonthStr.substring(0, 4));
        month = Number(salesMonthStr.substring(salesMonthStr.length - 2));
      }
      
      if (!isNaN(year) && !isNaN(month)) {
        const endOfSalesMonth = lastDayOfMonth(new Date(year, month - 1, 1));
        const depDate = new Date(row.deposit_date);
        if (!isNaN(depDate.getTime())) {
          leadTime = differenceInDays(depDate, endOfSalesMonth);
        }
      }
    }

    const deposited = row.deposited_amount || 0;
    let status = "입금대기중";
    if (deposited >= row.total_amount && row.total_amount > 0) {
      status = "입금완료";
    } else if (deposited > 0) {
      status = "미수금";
    }

    insertData.push({
      client_id: clientMatch.id,
      sales_month: String(row.sales_month),
      total_amount: Number(row.total_amount),
      deposited_amount: deposited,
      deposit_status: status,
      payment_lead_time: leadTime,
    });
  }

  // 2. 중복 검증
  const salesMonths = [...new Set(insertData.map(d => d.sales_month))];
  const clientIds = [...new Set(insertData.map(d => d.client_id))];

  const { data: existingSales, error: fetchError } = await supabase
    .from("sales")
    .select("sales_month, client_id, total_amount")
    .in("sales_month", salesMonths)
    .in("client_id", clientIds);

  if (!fetchError && existingSales) {
    for (const newItem of insertData) {
      const isDuplicate = existingSales.some(
        oldItem => 
          oldItem.sales_month === newItem.sales_month &&
          oldItem.client_id === newItem.client_id &&
          oldItem.total_amount === newItem.total_amount
      );
      if (isDuplicate) {
        return { error: "이미 동일한 월의 동일 매출 건이 업로드 되어있습니다. (중복 방지)" };
      }
    }
  }

  // 3. bulk insert
  const { error } = await supabase.from("sales").insert(insertData);

  if (error) {
    console.error("Bulk Insert Error:", error);
    return { error: "매출 데이터 일괄 등록 중 오류가 발생했습니다." };
  }

  revalidatePath("/sales");
  return { success: true, count: data.length };
}

export async function updateSalesAction(id: string, data: Partial<UploadedSalesData & { deposited_amount: number; payment_lead_time: number | null }>) {
  const supabase = await createClient();

  // 1. 현재 데이터 가져오기 (상태 계산용)
  const { data: current, error: fetchError } = await supabase
    .from("sales")
    .select("total_amount, deposited_amount")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("Fetch Sales Error Details:", fetchError);
    return { error: `데이터 조회 실패: ${fetchError.message} (ID: ${id})` };
  }

  if (!current) {
    console.error(`Sales record not found for ID: ${id}`);
    return { error: `기존 데이터를 찾을 수 없습니다. (ID: ${id})` };
  }

  const total = data.total_amount ?? current.total_amount;
  const deposited = data.deposited_amount ?? current.deposited_amount ?? 0;

  // 2. 입금 상태 자동 결정
  let newStatus = "대기중";
  if (deposited >= total && total > 0) {
    newStatus = "입금완료";
  } else if (deposited > 0) {
    newStatus = "미수금";
  }

  // 3. 업데이트 수행
  const { error } = await supabase
    .from("sales")
    .update({
      sales_month: data.sales_month,
      total_amount: total,
      deposited_amount: deposited,
      deposit_status: newStatus,
      payment_lead_time: data.payment_lead_time,
    })
    .eq("id", id);

  if (error) {
    console.error("Update Sales Error Details:", error);
    return { error: `데이터 수정 실패: ${error.message} (ID: ${id})` };
  }

  revalidatePath("/sales");
  revalidatePath("/"); // 대시보드 갱신
  return { success: true };
}

export async function updateSalesFieldAction(id: string, field: string, value: any) {
  // 개별 필드 업데이트 시에도 상태 자동 계산 로직 적용을 위해 updateSalesAction 호출로 우회
  return updateSalesAction(id, { [field]: value });
}

export async function deleteSalesAction(ids: string[]) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sales")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("Delete Sales Error:", error);
    return { error: "매출 삭제 중 오류가 발생했습니다." };
  }

  revalidatePath("/sales");
  revalidatePath("/");
  return { success: true };
}

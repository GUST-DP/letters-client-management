import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { columns, SalesData } from "./columns";
import { BulkUploadDialog } from "./bulk-upload-dialog";
import { FileSpreadsheet, Download } from "lucide-react";
import { SalesTableClient } from "./sales-table-client";

export default async function SalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 병렬 데이터 페칭으로 성능 최적화
  const [
    { data: sales, error }
  ] = await Promise.all([
    supabase
      .from("sales")
      .select(`
        id, created_at, sales_month, total_amount, deposited_amount, deposit_status, payment_lead_time,
        clients (
          company_name, 
          brand_name,
          cost_center:cost_center_id (name)
        )
      `)
      .order("sales_month", { ascending: false })
      .order("created_at", { ascending: false })
  ]);

  const typedSales = (sales as unknown as SalesData[]) || [];

  return (
    <>
      <div className="space-y-3 w-full pb-3">
        {/* 헤더 섹션 제거됨 */}

        <div className="bg-white p-0 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <SalesTableClient 
            initialData={typedSales} 
            actions={
              <div key="page-actions-container" className="flex gap-3 ml-auto">
                <BulkUploadDialog key="bulk-upload-dialog" />
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}

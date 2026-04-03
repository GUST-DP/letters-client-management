import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, Users, FileText, Wallet, CalendarDays, Calculator, ListFilter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardDonutChart } from "@/components/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { MonthlyGoalModal } from "@/components/monthly-goal-modal";
import { DashboardComboChartClient } from "@/components/dashboard-combo-chart-client";
import { RiskTableClient } from "@/components/risk-table-client";
import { RecentIssueTable } from "@/components/recent-issue-table";
import { TransitionLink } from "@/components/ui/transition-link";

// 숫자 포맷 (원 단위, 쉼표)
const fmtKRW = (n: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(n);

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(n);

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 데이터 페칭
  const { data: salesRaw } = await supabase
    .from("sales")
    .select("*, clients(company_name)");
  const { data: clientsRaw } = await supabase
    .from("clients")
    .select("*, client_onboarding(sales_start_date, contract_date)");
  const { data: issuesRaw } = await supabase
    .from("client_issues")
    .select("*, clients(company_name)");

  const salesData = salesRaw ?? [];
  const clientsData = clientsRaw ?? [];
  const issuesData = issuesRaw ?? [];
  const issueCount = issuesData.length;
  const completedIssueCount = issuesData.filter(i => i.status === "조치등록" || i.status === "조치완료").length;

  // ── 이슈 통계 고도화 (신규)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  // 최근 1개월(30일) 이슈 필터링
  const recentMonthIssues = issuesData.filter(i => i.occurrence_date >= thirtyDaysAgoStr);
  const recentSummaryList = [...recentMonthIssues]
    .sort((a, b) => b.occurrence_date.localeCompare(a.occurrence_date))
    .slice(0, 5);

  // 1. 고객사별 이슈 건수 TOP 5
  const issueByClient: Record<string, number> = {};
  issuesData.forEach(i => {
    const name = i.clients?.company_name || "알 수 없음";
    issueByClient[name] = (issueByClient[name] || 0) + 1;
  });
  const issueByClientData = Object.entries(issueByClient)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 2. 이슈유형별 분포
  const issueByType: Record<string, number> = {};
  issuesData.forEach(i => {
    const type = i.issue_type || "기타";
    issueByType[type] = (issueByType[type] || 0) + 1;
  });
  const issueByTypeData = Object.entries(issueByType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 3. 발생주체별 분포
  const issueBySubject: Record<string, number> = {};
  issuesData.forEach(i => {
    const subject = i.occurrence_subject || "기타";
    issueBySubject[subject] = (issueBySubject[subject] || 0) + 1;
  });
  const issueBySubjectData = Object.entries(issueBySubject)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // ── 금월 / 전월 매출
  const totalCurrentSales = salesData.filter(s => s.sales_month === currentMonthStr).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalLastSales = salesData.filter(s => s.sales_month === lastMonthStr).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const salesMoM = totalLastSales > 0 ? ((totalCurrentSales - totalLastSales) / totalLastSales * 100).toFixed(1) : "0.0";

  const MONTHLY_GOAL = 2500000000;
  const YEARLY_GOAL = 30000000000;
  const monthlyAchievement = (totalCurrentSales / MONTHLY_GOAL * 100).toFixed(1);

  // ── 월별 미수금
  const unpaidByMonth: Record<string, number> = {};
  salesData.forEach(s => {
    const unpaidAmt = Number(s.total_amount) - Number(s.deposited_amount || 0);
    if (unpaidAmt > 0) {
      unpaidByMonth[s.sales_month] = (unpaidByMonth[s.sales_month] || 0) + unpaidAmt;
    }
  });
  const sortedUnpaidMonths = Object.entries(unpaidByMonth).sort((a, b) => b[0].localeCompare(a[0]));
  const totalUnpaid = Object.values(unpaidByMonth).reduce((a, b) => a + b, 0);

  // ── 계약 고객사 현황 (contract_status 기준)
  // contract_status: "계약완료"(운영중), "계약진행중"(진행중), "계약해지"(해지)
  const activeClients = clientsData.filter(c => (c.contract_status ?? "") === "계약완료");
  const progressClients = clientsData.filter(c => (c.contract_status ?? "") === "계약진행중");
  const terminatedClients = clientsData.filter(c => (c.contract_status ?? "") === "계약해지");
  const contractTotal = activeClients.length + progressClients.length + terminatedClients.length;

  // ── 연간 누적
  const yearlyCumulativeSales = salesData
    .filter(s => s.sales_month?.startsWith(String(currentYear)))
    .reduce((sum, s) => sum + Number(s.total_amount), 0);
  const yearlyAchievement = (yearlyCumulativeSales / YEARLY_GOAL * 100).toFixed(1);

  // ── 계약 리드타임 (영업시작일 → 계약일), client_onboarding 기준
  const leadTimes: number[] = [];
  clientsData.forEach(c => {
    const obList = Array.isArray(c.client_onboarding)
      ? c.client_onboarding
      : c.client_onboarding ? [c.client_onboarding] : [];
    const ob = obList[0];
    const salesStart = ob?.sales_start_date;
    const contractDate = ob?.contract_date;
    if (salesStart && contractDate) {
      const diff = new Date(contractDate).getTime() - new Date(salesStart).getTime();
      if (diff >= 0) leadTimes.push(Math.ceil(diff / 86400000));
    }
  });
  const avgLeadTime = leadTimes.length > 0
    ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1)
    : "-";

  // ── 연도별 매출 차트 데이터
  const yearlySales: Record<string, number> = {};
  for (let i = 1; i <= 12; i++) yearlySales[`${currentYear}-${String(i).padStart(2, "0")}`] = 0;
  salesData.forEach(s => {
    if (s.sales_month?.startsWith(String(currentYear)))
      yearlySales[s.sales_month] = (yearlySales[s.sales_month] || 0) + Number(s.total_amount);
  });
  const comboBaseData = Object.entries(yearlySales).map(([month, amount]) => ({
    month: `${month.split("-")[1]}월`,
    amount,
  }));

  // ── 인입경로
  const inflowPaths: Record<string, number> = {};
  clientsData.forEach(c => {
    // lead_source 또는 inflow_path 등 다양한 필드를 시도
    const src = (c.lead_source ?? c.inflow_path ?? c.inflowPath ?? "기타") as string;
    inflowPaths[src] = (inflowPaths[src] || 0) + 1;
  });
  const barChartData = Object.entries(inflowPaths)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ── TOP 고객사 (연간 & 전월)
  const clientSalesMap: Record<string, { name: string; annual: number; lastMonth: number }> = {};
  salesData.forEach(s => {
    const id = s.client_id;
    const name = s.clients?.company_name || "알 수 없음";
    if (!clientSalesMap[id]) clientSalesMap[id] = { name, annual: 0, lastMonth: 0 };
    clientSalesMap[id].annual += Number(s.total_amount);
    if (s.sales_month === lastMonthStr) clientSalesMap[id].lastMonth += Number(s.total_amount);
  });
  const clientsList = Object.values(clientSalesMap);
  const annualDonutData = [...clientsList].sort((a, b) => b.annual - a.annual).map(c => ({ name: c.name, value: c.annual }));
  const monthlyDonutData = [...clientsList].sort((a, b) => b.lastMonth - a.lastMonth).filter(c => c.lastMonth > 0).map(c => ({ name: c.name, value: c.lastMonth }));

  // ── 고객사별 평균 입금 리드타임 계산
  const avgPaymentLeadTimeMap: Record<string, number[]> = {};
  salesData.forEach(s => {
    if (s.payment_lead_time !== null && s.payment_lead_time !== undefined) {
      if (!avgPaymentLeadTimeMap[s.client_id]) avgPaymentLeadTimeMap[s.client_id] = [];
      avgPaymentLeadTimeMap[s.client_id].push(Number(s.payment_lead_time));
    }
  });

  const clientAvgLeadTime: Record<string, string> = {};
  Object.entries(avgPaymentLeadTimeMap).forEach(([clientId, times]) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    clientAvgLeadTime[clientId] = avg.toFixed(1);
  });

  // ── 미수금 RAW 데이터 (고객사명 / 평균입금리드타임 / 발생월 / 미수금액 각 행)
  interface RiskRow { clientName: string; avgLeadDays: string; month: string; amount: number }
  const riskRows: RiskRow[] = [];
  salesData.forEach(s => {
    const unpaidAmt = Number(s.total_amount) - Number(s.deposited_amount || 0);
    if (unpaidAmt > 0) {
      riskRows.push({
        clientName: s.clients?.company_name || "알 수 없음",
        avgLeadDays: clientAvgLeadTime[s.client_id] || "-",
        month: s.sales_month,
        amount: unpaidAmt,
      });
    }
  });
  riskRows.sort((a, b) => b.amount - a.amount || b.month.localeCompare(a.month));
  const totalRisk = riskRows.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <div className="space-y-3 w-full pb-3">

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-extrabold tracking-tight text-[#414344] flex items-center gap-3">
              DASHBOARD <span className="text-[#ff5c39]">INSIGHTS</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium">데이터 기반 실시간 운영 지표 분석 리포트</p>
          </div>
          <MonthlyGoalModal year={currentYear} />
        </div>

        {/* ── KPI 6 카드 ── */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

          {/* 전월 매출현황 */}
          <Card className="border-none shadow-sm bg-[#414344] text-white overflow-hidden">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[13px] font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-white" /> 전월 매출현황</span>
                <Badge className="bg-white/10 text-white border-none text-[9px] h-4 px-1 py-0">{lastMonthDate.getMonth() + 1}월</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-[10px] font-bold text-white text-right mb-0">원(KRW)</div>
              <div className="text-[28px] font-black tracking-tighter font-mono text-[#ff5c39] leading-none text-right mb-1">
                {fmtKRW(totalLastSales)}
              </div>
              <div className="flex flex-col gap-1.5 mt-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span>전월 대비 증감</span>
                  <span className={Number(salesMoM) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {Number(salesMoM) >= 0 ? "▲" : "▼"} {Math.abs(Number(salesMoM))}%
                  </span>
                </div>
                <div className="text-[9px] text-white/50 text-right italic">
                  MoM Comparison
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 월별 미수금액 */}
          <Card className="border-none shadow-sm bg-[#414344] text-white overflow-hidden">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[13px] font-bold text-white flex items-center gap-1">
                <Calculator className="h-3.5 w-3.5 text-white" /> 월별 미수금액
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-[10px] font-bold text-white text-right mb-0">원(KRW)</div>
              <div className="text-[28px] font-black tracking-tighter font-mono text-[#ff5c39] leading-none text-right mb-1">
                {fmtKRW(totalUnpaid)}
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {sortedUnpaidMonths.length === 0 && (
                  <span className="text-[10px] text-white">미수금 없음</span>
                )}
                {sortedUnpaidMonths.slice(0, 3).map(([m, amt]) => (
                  <Badge key={m} variant="secondary" className="text-[9px] bg-white/10 text-white border-none px-1 h-3.5 font-bold">
                    {m.replace(/^\d{4}-/, "")}월: {fmtCompact(amt)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 연간 누적 매출현황 */}
          <Card className="border-none shadow-sm bg-[#414344] text-white overflow-hidden">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[13px] font-bold text-white flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5 text-white" /> 연간 누적 매출현황
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="text-[10px] font-bold text-white text-right mb-0">원(KRW)</div>
              <div className="text-[28px] font-black tracking-tighter font-mono text-[#ff5c39] leading-none text-right mb-1">
                {fmtKRW(yearlyCumulativeSales)}
              </div>
              <div className="flex flex-col gap-1.5 mt-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span>목표: {fmtCompact(YEARLY_GOAL)}</span>
                  <span>{yearlyAchievement}%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#ff5c39] h-full rounded-full" style={{ width: `${Math.min(Number(yearlyAchievement), 100)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계약고객사 */}
          <Card className="border-none shadow-sm bg-[#414344] text-white overflow-hidden">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[13px] font-bold text-white flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-white" /> 계약고객사
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col justify-center items-center h-full">
              <div className="text-[28px] font-black tracking-tight leading-none mb-2 text-white flex items-baseline justify-center">
                {contractTotal}
                <span className="text-[11px] font-bold text-white ml-0.5 shrink-0">사</span>
              </div>
              <div className="flex justify-center gap-2">
                <div className="text-center">
                  <div className="text-[9px] text-white font-medium">운영중</div>
                  <div className="text-[13px] font-black text-[#ff5c39]">{activeClients.length}</div>
                </div>
                <div className="h-5 w-px bg-white/20 my-auto" />
                <div className="text-center">
                  <div className="text-[9px] text-white font-medium">계약진행</div>
                  <div className="text-[13px] font-black text-white">{progressClients.length}</div>
                </div>
                <div className="h-5 w-px bg-white/20 my-auto" />
                <div className="text-center">
                  <div className="text-[9px] text-white font-medium">해지</div>
                  <div className="text-[13px] font-black text-white">{terminatedClients.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계약 리드타임 */}
          <Card className="border-none shadow-sm bg-[#414344] text-white overflow-hidden">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[13px] font-bold text-white flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-white" /> 계약 리드타임
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col justify-center items-center h-full">
              <div className="text-[28px] font-black text-[#ff5c39] tracking-tight leading-none mb-2 flex items-baseline justify-center">
                {avgLeadTime}
                <span className="text-[11px] font-bold text-white ml-0.5 shrink-0">일</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-white/80">
                <Clock className="h-2.5 w-2.5" />
                <span>인입 ~ 계약 평균 ({leadTimes.length}건)</span>
              </div>
              {leadTimes.length === 0 && clientsData.length > 0 && (
                <div className="text-[9px] text-white/80 mt-1 text-center">계약일 정보 없음</div>
              )}
            </CardContent>
          </Card>

          {/* 서비스 이슈관리 */}
          <Card className="border-none shadow-sm bg-[#414344] text-white overflow-hidden">
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[13px] font-bold text-white flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-white" /> 고객사 이슈현황
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col justify-center items-center h-full">
              <div className="text-[26px] font-black tracking-tight leading-none mb-3 text-white flex items-baseline justify-center">
                <span className="text-[10px] font-bold text-white mr-1.5 shrink-0">전체 이슈</span>
                {issueCount}
                <span className="text-[10px] font-bold text-white ml-0.5 shrink-0">건</span>
              </div>
              <div className="flex items-center justify-center gap-3 w-full border-t border-white/10 pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] text-white/70">이슈건수: </span>
                  <span className="text-[12px] font-bold text-[#ff5c39]">{issueCount}건</span>
                </div>
                <div className="w-px h-2.5 bg-white/20" />
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] text-white/70">조치완료: </span>
                  <span className="text-[12px] font-bold text-white">{completedIssueCount}건</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 차트 섹션: 복합차트 + 이슈 분석 (신규) ── */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-[35%_1fr]">

          {/* 복합 차트 (매출 추이) */}
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="px-3 pt-1.5 pb-0">
              <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#8aa8e2]" /> {currentYear}년도 월별 매출 추이
                <span className="ml-2 text-xs font-medium text-slate-400">■ 막대: 매출 ／ — 실선: 목표</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <DashboardComboChartClient data={comboBaseData} year={currentYear} />
            </CardContent>
          </Card>

          {/* 최근 등록 이슈 현황 분석 (신규) */}
          <Card className="border-none shadow-sm overflow-hidden h-full">
            <CardHeader className="px-3 pt-1.5 pb-0">
              <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-[#eb5d49]" /> 최근 1개월 고객사 이슈 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <RecentIssueTable issues={recentSummaryList} clients={clientsData} />
            </CardContent>
          </Card>
        </div>

        {/* ── 하단: 미수금 + 인입경로 + 매출 TOP 5 (균형 잡힌 높이 유지) ── */}
        <div className="flex flex-col lg:flex-row gap-3 w-full items-stretch">

          {/* 미수금 발생 고객사 현황 (35%) */}
          <div className="lg:flex-[0_0_35%] min-w-0">
            <Card className="h-full border-none shadow-sm border-l-4 border-l-[#eb5d49] flex flex-col min-h-[340px]">
              <CardHeader className="px-3 pt-1.5 pb-0">
                <div className="flex items-center justify-between">
                  <TransitionLink href="/sales" className="group">
                    <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1 transition-colors group-hover:text-[#eb5d49]">
                      <AlertCircle className="h-4 w-4 text-[#eb5d49]" />
                      미수금 발생 고객사
                      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#eb5d49] transition-colors" />
                    </CardTitle>
                  </TransitionLink>
                  {riskRows.length > 0 && (
                    <span className="text-[10px] font-bold text-[#eb5d49]">
                      {riskRows.length}건
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 flex-1 overflow-hidden">
                {riskRows.length > 0 ? (
                  <RiskTableClient rows={riskRows} totalRisk={totalRisk} />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 flex-col gap-1.5">
                    <AlertCircle className="h-6 w-6 text-slate-200" />
                    미수금 없음
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
            {/* 인입경로 요약 */}
            <Card className="border-none shadow-sm flex flex-col h-full min-h-[340px]">
              <CardHeader className="px-3 pt-1.5 pb-0">
                <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1.5">
                  <ListFilter className="h-4 w-4 text-slate-400" /> 인입경로 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pt-2 pb-3 flex-1 flex flex-col justify-center">
                <DashboardDonutChart 
                  data={barChartData.length > 0 ? barChartData : [{ name: "데이터 없음", value: 1 }]} 
                  unit="건"
                  colorSet="inflow"
                />
              </CardContent>
            </Card>

            {/* 연매출 TOP 5 */}
            <Card className="border-none shadow-sm flex flex-col h-full min-h-[340px]">
              <CardHeader className="px-3 pt-1.5 pb-0">
                <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#ff7550]" /> 연매출 TOP 5
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pt-2 pb-3 flex-1 flex flex-col justify-center">
                <DashboardDonutChart
                  data={annualDonutData.length > 0 ? annualDonutData : [{ name: "데이터 없음", value: 1 }]}
                  unit="원"
                  colorSet="annual"
                />
              </CardContent>
            </Card>

            {/* 전월 TOP 5 */}
            <Card className="border-none shadow-sm flex flex-col h-full min-h-[340px]">
              <CardHeader className="px-3 pt-1.5 pb-0">
                <CardTitle className="text-sm font-bold text-[#414344] flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#58bf6f]" /> 전월 TOP 5
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pt-2 pb-3 flex-1 flex flex-col justify-center">
                <DashboardDonutChart
                  data={monthlyDonutData.length > 0 ? monthlyDonutData : [{ name: "데이터 없음", value: 1 }]}
                  unit="원"
                  colorSet="monthly"
                />
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </>
  );
}

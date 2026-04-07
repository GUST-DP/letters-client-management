"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { 
  Package, 
  LayoutDashboard, 
  Users, 
  Calculator, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  ChevronDown,
  AlertTriangle,
  ClipboardList,
  FileText,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { createClient } from "@/utils/supabase/client";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

import { useLoading } from "@/components/providers/loading-provider";

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isLoading, startLoading } = useLoading();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hasNew, setHasNew] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  // 하이드레이션 방지 및 신규 알람 체크
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }

    // 신규 데이터 체크 실행
    checkForNewData();

    // 1분마다 주기적으로 체크 (실시간성 확보)
    const interval = setInterval(checkForNewData, 60000);
    return () => clearInterval(interval);
  }, []);

  // 탭 이동 시에도 체크 (다른 탭에서 방문했을 수 있으므로)
  useEffect(() => {
    checkForNewData();
  }, [pathname]);

  const checkForNewData = async () => {
    const supabase = createClient();
    
    // 로컬 스토리지에서 마지막 방문 시간 가져오기 (없으면 아주 옛날 시간)
    const lastVisited = {
      clients: localStorage.getItem("last_visited_/clients") || new Date(0).toISOString(),
      clientIssues: localStorage.getItem("last_visited_/client-issues") || new Date(0).toISOString(),
      serviceIssues: localStorage.getItem("last_visited_/issues") || new Date(0).toISOString(),
    };

    try {
      const [clientRes, opIssueRes, svIssueRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).gt('created_at', lastVisited.clients),
        supabase.from('client_operation_issues').select('id', { count: 'exact', head: true }).gt('created_at', lastVisited.clientIssues),
        supabase.from('client_issues').select('id', { count: 'exact', head: true }).gt('created_at', lastVisited.serviceIssues),
      ]);

      setHasNew({
        "/clients": (clientRes.count || 0) > 0,
        "/client-detail": (clientRes.count || 0) > 0,
        "/client-issues": (opIssueRes.count || 0) > 0,
        "/issues": (svIssueRes.count || 0) > 0,
      });
    } catch (err) {
      console.error("New data check error:", err);
    }
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();

    // 방문 시간 기록 및 즉시 뱃지 제거
    localStorage.setItem(`last_visited_${href}`, new Date().toISOString());
    setHasNew(prev => ({ ...prev, [href]: false }));

    // 전역 로딩 팝업 표시
    startLoading();
    // 트랜지션 시작 (배경에서 로드하여 흰 화면 방지)
    startTransition(() => {
      router.push(href);
    });
  };

  // 로딩 상태 결정 (전역 isLoading 또는 현재 트랜지션 로딩 isPending)
  const showLoading = isLoading || isPending;

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const navItems = [
    { name: "대시보드", href: "/", icon: LayoutDashboard },
    { name: "고객사 계약관리", href: "/clients", icon: Users },
    { name: "고객사 세부정보", href: "/client-detail", icon: FileText },
    { name: "고객사 이슈관리", href: "/client-issues", icon: ClipboardList },
    { name: "서비스 이슈관리", href: "/issues", icon: AlertTriangle },
    { name: "매출 및 입금관리", href: "/sales", icon: Calculator },
  ];

  const adminItems = [
    { name: "코스트센터 관리", href: "/settings?tab=costcenter", tab: "costcenter", path: null },
    { name: "서비스 형태 관리", href: "/settings?tab=servicetype", tab: "servicetype", path: null },
    { name: "체크리스트 관리", href: "/settings?tab=checklist", tab: "checklist", path: null },
    { name: "계정 관리", href: "/settings/accounts", tab: null, path: "/settings/accounts" },
  ];

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[#f5eee8]">
        {/* Placeholder or empty to avoid hydration mismatch */}
        <div className="w-[240px] bg-[#414344] shrink-0" />
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f5eee8] w-full font-sans text-slate-900 selection:bg-[#ff5c39]/10">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#414344] text-[#ececec] flex flex-col transition-all duration-300 sticky top-0 h-screen z-50 shadow-xl overflow-hidden",
          isCollapsed ? "w-16" : "w-48"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-[61px] flex items-center justify-center px-2 border-b border-[#ececec]/10 shrink-0 select-none">
          <a
            href="/"
            onClick={(e) => handleNavClick(e, "/")}
            className="flex items-center justify-center w-full h-full overflow-hidden focus:outline-none focus:ring-0 select-none cursor-pointer"
          >
            <img 
              src="/letus-logo.png" 
              alt="LETUS Logo"
              draggable={false} 
              className={cn(
                "brightness-0 invert object-contain transition-all duration-300 pointer-events-none select-none", 
                isCollapsed ? "h-10 w-auto scale-[1.35]" : "h-16 w-auto scale-[2]"
              )} 
            />
          </a>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-0.5 scrollbar-hide pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.25 rounded-md transition-all group relative cursor-pointer",
                  isActive 
                    ? "bg-[#ececec]/10 text-white font-extrabold shadow-sm" 
                    : "text-[#ececec]/80 hover:bg-[#ececec]/5 hover:text-white",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-[#ff5c39]" : "text-[#ececec]/60 group-hover:text-[#ff5c39]")} />
                
                {/* 신규 알림 뱃지 (왼쪽 배치) */}
                {hasNew[item.href] && (
                  <span className={cn(
                    "bg-[#ff5c39] text-white font-black flex items-center justify-center animate-pulse shadow-sm shadow-[#ff5c39]/40 shrink-0",
                    isCollapsed 
                      ? "absolute top-1.5 right-1.5 w-2 h-2 rounded-full" 
                      : "w-3.5 h-3.5 rounded-full text-[8px]"
                  )}>
                    {!isCollapsed && "N"}
                  </span>
                )}

                {!isCollapsed && <span className="text-[12px] truncate flex-1">{item.name}</span>}

                {isCollapsed && isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
              </a>
            );
          })}

          <div className="pt-1">
            {isCollapsed ? (
              <a
                href="/settings"
                onClick={(e) => handleNavClick(e, "/settings")}
                className={cn(
                  "flex items-center justify-center p-3 rounded-md hover:bg-[#ececec]/5 transition-all text-[#ececec]/80 cursor-pointer",
                  pathname.startsWith("/settings") ? "bg-[#ececec]/10 text-white border border-[#ececec]/20" : ""
                )}
              >
                <Settings className={cn("w-5 h-5 transition-colors", pathname.startsWith("/settings") ? "text-[#ff5c39]" : "text-[#ececec]/60")} />
              </a>
            ) : (
              <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                <CollapsibleTrigger
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.25 rounded-md transition-all group cursor-pointer w-full text-left",
                    pathname.startsWith("/settings") 
                      ? "bg-[#ececec]/10 text-white font-extrabold shadow-sm" 
                      : "text-[#ececec]/80 hover:bg-[#ececec]/5 hover:text-white"
                  )}
                >
                  <Settings className={cn("w-5 h-5 shrink-0 transition-colors", pathname.startsWith("/settings") ? "text-[#ff5c39]" : "text-[#ececec]/60 group-hover:text-[#ff5c39]")} />
                  <span className="text-[12px] flex-1 truncate">기준관리</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0 outline-none border-none", isAdminOpen ? "" : "-rotate-90")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-0.5">
                  {adminItems.map((item) => (
                    <AdminLink key={item.href} item={item} onClick={handleNavClick} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </nav>
  
        {/* Sidebar Footer - Empty or simple padding */}
        <div className="h-4 bg-[#414344] shrink-0" />
      </aside>
  
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[61px] bg-white border-b border-slate-200 flex items-center justify-between px-3 sticky top-0 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 text-slate-500 hover:text-[#ff5c39] hover:bg-[#ff5c39]/5 transition-all rounded-full"
                onClick={toggleSidebar}
              >
                <Menu className="w-6 h-6" />
              </Button>
              
              <div className="w-[1.5px] h-5 bg-[#ff5c39]/30 rounded-full" />
              
              <h2 className="text-[18px] font-black text-slate-800 tracking-tight">
                {pathname === "/" && "Dashboard"}
                {pathname === "/clients" && "고객사 계약관리"}
                {pathname === "/client-detail" && "고객사 세부정보"}
                {pathname.includes("/onboarding") && "운영준비 체크리스트"}
                {pathname.startsWith("/clients/") && !pathname.includes("/onboarding") && "고객사 세부정보"}
                {pathname === "/client-issues" && "고객사 이슈관리"}
                {pathname === "/issues" && "서비스 이슈관리"}
                {pathname === "/sales" && "매출 및 입금관리"}
                {pathname.startsWith("/settings") && "기준관리"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">User Account</span>
              <span className="text-sm font-extrabold text-slate-700">{userEmail}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-white hover:bg-[#ff5c39] gap-2 transition-all border border-slate-200 hover:border-[#ff5c39] rounded-lg h-9 px-4">
                <LogOut className="w-4 h-4" />
                <span className="font-bold text-xs">로그아웃</span>
              </Button>
            </form>
          </div>
        </header>

        {/* Page Content - NO MAX WIDTH */}
        <main className="flex-1 px-3 pt-3 pb-8 w-full overflow-y-auto relative">
          {children}

          {/* 전역 로딩 팝업 (isPending이 끝날 때까지 기존 화면 유지) */}
          {showLoading && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/5 backdrop-blur-[1px] animate-in fade-in duration-200">
                <div className="bg-white p-[30px] rounded-2xl shadow-[0_20px_70px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col items-center gap-[16px] scale-100 animate-in zoom-in-95 duration-500">
                <div className="relative w-[60px] h-[60px]">
                  <div className="absolute top-0 left-0 w-full h-full border-[3px] border-slate-50 rounded-full" />
                  <div className="absolute top-0 left-0 w-full h-full border-[3px] border-[#ff5c39] rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[12px] font-black text-[#ff5c39] uppercase tracking-widest animate-pulse">LETUS</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[16px] font-black text-slate-600 tracking-tight">잠시만 기다려주세요</p>
                  <div className="flex gap-1 mt-0.5">
                    <span className="w-1 h-1 bg-[#ff5c39] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-[#ff5c39] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-[#ff5c39] rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminLink({ item, onClick }: { item: { name: string; href: string; tab: string | null; path?: string | null }; onClick?: (e: React.MouseEvent, href: string) => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  
  // path 기반(계정관리) 또는 tab 기반(기존) 활성화 판단
  const isActive = item.path
    ? pathname === item.path
    : pathname === "/settings" && currentTab === item.tab;

  return (
    <a
      href={item.href}
      onClick={(e) => onClick?.(e, item.href)}
      className={cn(
        "flex items-center gap-3 pl-9 pr-3 py-2 rounded-md text-[11px] transition-all group cursor-pointer",
        isActive ? "text-[#ff5c39] font-extrabold bg-[#ececec]/5 shadow-sm" : "text-[#ececec]/70 hover:text-white hover:bg-[#ececec]/5"
      )}
    >
      <span className="truncate">{item.name}</span>
    </a>
  );
}


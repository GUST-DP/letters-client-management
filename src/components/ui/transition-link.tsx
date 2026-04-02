"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLoading } from "@/components/providers/loading-provider";

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function TransitionLink({
  href,
  children,
  className,
  onClick,
  ...props
}: TransitionLinkProps) {
  const router = useRouter();
  const currentPathname = usePathname();
  const currentSearchParams = useSearchParams();
  const { startLoading, stopLoading } = useLoading();
  const [isPending, startTransition] = useTransition();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 기존 onClick이 있으면 먼저 실행
    if (onClick) onClick(e);
    
    // 기본 동작(페이지 즉시 이동) 방지
    e.preventDefault();

    // 현재 경로와 동일한 경우 (쿼리 스트링 포함)를 체크
    const targetUrl = new URL(href, window.location.origin);
    const isSamePage = targetUrl.pathname === currentPathname && 
                       targetUrl.search === currentSearchParams.toString();

    // 전역 로딩 팝업 표시
    startLoading();

    // 트랜지션 시작 (배경에서 로드)
    startTransition(() => {
      router.push(href);
      
      // 만약 동일 페이지라면 pathname 체인지가 발생하지 않으므로 강제 해제
      if (isSamePage) {
        setTimeout(() => stopLoading(), 300);
      }
    });
  };

  return (
    <a
      href={href}
      onClick={handleLinkClick}
      className={cn(className, "cursor-pointer")}
      {...props}
    >
      {children}
    </a>
  );
}

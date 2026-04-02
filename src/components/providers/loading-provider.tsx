"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 페이지 이동 완료 시(경로 또는 쿼리 변경 시) 로딩 해제 (미세 지연 추가하여 깜빡임 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingCount(0);
    }, 250); // 250ms 지연 후 초기화

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // 안전장치 (10초 이상 로딩 시 강제 해제)
  useEffect(() => {
    if (loadingCount > 0) {
      const safetyTimer = setTimeout(() => {
        setLoadingCount(0);
      }, 10000); // 10초 후 강제 해제
      return () => clearTimeout(safetyTimer);
    }
  }, [loadingCount]);

  const startLoading = () => {
    setLoadingCount(prev => prev + 1);
  };
  
  const stopLoading = () => {
    setLoadingCount(0); // 즉시 해제
  };

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading: () => {}, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

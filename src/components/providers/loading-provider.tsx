"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// useSearchParams를 안전하게 사용하기 위한 내부 핸들러 컴포넌트
function LoadingHandler({ onRouteComplete }: { onRouteComplete: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onRouteComplete();
  }, [pathname, searchParams, onRouteComplete]);

  return null;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = () => {
    setLoadingCount(prev => prev + 1);
  };
  
  const stopLoading = () => {
    setLoadingCount(0);
  };

  const handleRouteComplete = () => {
    const timer = setTimeout(() => {
      setLoadingCount(0);
    }, 250);
    return () => clearTimeout(timer);
  };

  // 안전장치 (10초 이상 로딩 시 강제 해제)
  useEffect(() => {
    if (loadingCount > 0) {
      const safetyTimer = setTimeout(() => {
        setLoadingCount(0);
      }, 10000);
      return () => clearTimeout(safetyTimer);
    }
  }, [loadingCount]);

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading: () => {}, startLoading, stopLoading }}>
      <Suspense fallback={null}>
        <LoadingHandler onRouteComplete={handleRouteComplete} />
      </Suspense>
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

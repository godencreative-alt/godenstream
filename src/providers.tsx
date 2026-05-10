"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import RuntimeSettingsProvider from "@/components/runtime/RuntimeSettingsProvider";
import AdAndAntiAdblock from "@/components/runtime/AdAndAntiAdblock";

function AuthInit({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [init, initialized]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeSettingsProvider>
        <AuthInit>
          {children}
          <AdAndAntiAdblock />
        </AuthInit>
      </RuntimeSettingsProvider>
    </QueryClientProvider>
  );
}

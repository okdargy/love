"use client";

import { useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";

import { trpc } from "@/app/_trpc/client";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: false,
        staleTime: 1000 * 60 * 5,
      }
    }
  }));
  
  const [trpcClient] = useState(
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
        }),
      ],
      transformer: undefined
    })
  );
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}

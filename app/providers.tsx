"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WarehouseProvider } from "@/shared/context/warehouse-context";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL. Define it in .env.local");
}

const convex = new ConvexReactClient(convexUrl);

/**
 * Envuelve la app con todos los proveedores necesarios.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ConvexAuthProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          <WarehouseProvider>
            {children}
            <ToastProvider placement="top-right" />
          </WarehouseProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </ConvexAuthProvider>
  );
}

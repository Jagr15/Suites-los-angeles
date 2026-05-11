"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Instancia del cliente de Convex (Fija para producción)
const convexUrl = "https://fantastic-spoonbill-554.convex.cloud";

// Instancia del cliente de Convex
const convex = new ConvexReactClient(convexUrl);

/**
 * Envuelve la app con todos los proveedores necesarios.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Inicializamos QueryClient con un hook
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ConvexAuthProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          {children}
          <ToastProvider placement="top-right" />
        </HeroUIProvider>
      </QueryClientProvider>
    </ConvexAuthProvider>
  );
}

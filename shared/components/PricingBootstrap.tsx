"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Asegura que los niveles fijos de pricing existan apenas arranca la app.
 * Esto evita que la UI arranque sin opciones hasta que se abra alguna pantalla
 * que haga la sincronización manualmente.
 */
export function PricingBootstrap() {
  const syncFixedCustomerLevels = useMutation(api.pricing.mutations.syncFixedCustomerLevels);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;
    void syncFixedCustomerLevels().catch((error) => {
      console.warn("PricingBootstrap: syncFixedCustomerLevels failed", error);
    });
  }, [syncFixedCustomerLevels]);

  return null;
}

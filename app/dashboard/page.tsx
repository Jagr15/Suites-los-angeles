"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardPage } from "@/features/dashboard";
import { useRoles } from "@/shared/hooks";

export default function Page() {
  const router = useRouter();
  const { isLoading, isAuthenticated, isBodega } = useRoles();

  useEffect(() => {
    if (!isLoading && isAuthenticated && isBodega) {
      router.replace("/dashboard/bodega");
    }
  }, [isLoading, isAuthenticated, isBodega, router]);

  if (isBodega) return null;

  return <DashboardPage />;
}

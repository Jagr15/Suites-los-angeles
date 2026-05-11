"use client";

import { useRoles } from "@/shared/hooks";
import { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[]; // Ej: ["admin", "staff"]
  requireAdmin?: boolean;  // Acceso rápido solo para Admin
  fallback?: ReactNode;    // Qué mostrar si no tiene permiso (opcional)
}

/**
 * Componente para proteger elementos de la UI basados en el rol.
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  requireAdmin = false, 
  fallback = null 
}: RoleGuardProps) {
  const { user, isAdmin, isLoading, isAuthenticated } = useRoles();

  // Mientras carga no mostramos nada (o un spinner si prefieres)
  if (isLoading) return null;

  // Si no está autenticado, fuera
  if (!isAuthenticated) return fallback;

  // Si requiere ser admin y no lo es
  if (requireAdmin && !isAdmin) return fallback;

  // Si hay una lista de roles permitidos
  if (allowedRoles && !allowedRoles.includes(user?.role || "")) {
    // Si no es admin (que ve todo) y no está en la lista permitida
    if (!isAdmin) return fallback;
  }

  return <>{children}</>;
}

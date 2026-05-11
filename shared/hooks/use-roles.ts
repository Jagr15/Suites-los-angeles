import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook para gestionar permisos y roles en el frontend.
 */
export function useRoles() {
  const user = useQuery(api.users.queries.current);
  
  const isLoading = user === undefined;
  const isAuthenticated = !!user;
  
  const roleName = (user?.roleData?.name || user?.role || "").trim();
  const normalizedRole = roleName.toLowerCase();

  // Verificamos roles específicos
  const isAdmin = normalizedRole === "admin" || normalizedRole === "administrador";
  const isBodega = normalizedRole === "bodega" || normalizedRole === "bodeguero";
  const isVendedor = normalizedRole === "vendedor";
  
  /**
   * Verifica si el usuario tiene un permiso específico o un rol que lo incluya.
   */
  const hasPermission = (permission: string) => {
    if (isAdmin) return true;
    
    // Si tenemos una lista de permisos en el objeto del usuario, la consultamos
    const userPermissions = user?.roleData?.permissions || [];
    if (userPermissions.includes("all")) return true;
    
    return userPermissions.includes(permission);
  };

  /**
   * Verifica si el usuario tiene alguno de los roles permitidos.
   */
  const hasRole = (roles: string[]) => {
    if (isAdmin) return true;
    return roles.some(r => r.toLowerCase() === normalizedRole);
  };

  return {
    user,
    role: roleName,
    isAdmin,
    isBodega,
    isVendedor,
    isActive: user?.isActive ?? true,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasRole,
  };
}

import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook para gestionar permisos y roles en el frontend.
 */
export function useRoles() {
  const { isAuthenticated: hasSession, isLoading: isAuthLoading } = useConvexAuth();
  const user = useQuery(api.users.queries.current, hasSession ? {} : "skip");

  const isLoading = isAuthLoading || (hasSession && user === undefined);
  const isAuthenticated = hasSession && !!user;
  
  const roleName = (user?.roleData?.name || user?.role || "").trim();
  const normalizedRole = roleName.toLowerCase();

  // Verificamos roles específicos
  const isAdmin =
    normalizedRole === "admin" ||
    normalizedRole === "administrador" ||
    normalizedRole === "superadmin" ||
    normalizedRole === "super admin";
  const isSuperAdmin = normalizedRole === "superadmin" || normalizedRole === "super admin";
  const isBodega = normalizedRole === "bodega" || normalizedRole === "bodeguero";
  const isVendedor = normalizedRole === "vendedor";

  const canAccessPath = (pathname: string) => {
    if (!pathname.startsWith("/dashboard")) return true;
    if (isAdmin) return true;

    if (pathname.startsWith("/dashboard/configuracion")) return false;
    if (pathname.startsWith("/dashboard/finanzas")) return false;

    if (isBodega) {
      return (
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/productos") ||
        pathname.startsWith("/dashboard/proveedores") ||
        pathname.startsWith("/dashboard/bodega") ||
        pathname.startsWith("/dashboard/cuenta")
      );
    }

    if (isVendedor) {
      return (
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/rutas") ||
        pathname.startsWith("/dashboard/clientes") ||
        pathname.startsWith("/dashboard/cuenta")
      );
    }

    return pathname.startsWith("/dashboard/cuenta");
  };
  
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
    isSuperAdmin,
    isAdmin,
    isBodega,
    isVendedor,
    isActive: user?.isActive ?? true,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasRole,
    canAccessPath,
  };
}

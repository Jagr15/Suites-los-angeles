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
  const userPermissions = user?.effectivePermissions || user?.roleData?.permissions || [];
  const hasAllPermissions = userPermissions.includes("all");

  const hasPermission = (permission: string) => {
    if (isAdmin) return true;
    if (hasAllPermissions) return true;
    return userPermissions.includes(permission);
  };

  const canAccessPath = (pathname: string) => {
    if (!pathname.startsWith("/dashboard")) return true;
    if (isAdmin) return true;

    // Bodeguero: acceso exclusivo a Bodega y Mi Cuenta.
    if (isBodega) {
      return pathname.startsWith("/dashboard/bodega") || pathname.startsWith("/dashboard/cuenta");
    }

    if (pathname.startsWith("/dashboard/configuracion")) {
      return hasPermission("settings:view") || hasPermission("settings:manage") || hasPermission("users:view") || hasPermission("users:manage");
    }
    if (pathname.startsWith("/dashboard/finanzas")) {
      return hasPermission("finance:view") || hasPermission("finance:manage");
    }
    if (pathname.startsWith("/dashboard/productos")) {
      return hasPermission("products:view") || hasPermission("products:manage");
    }
    if (pathname.startsWith("/dashboard/proveedores")) {
      return hasPermission("suppliers:view") || hasPermission("suppliers:manage");
    }
    if (pathname.startsWith("/dashboard/rutas")) {
      return hasPermission("routes:view") || hasPermission("routes:manage");
    }
    if (pathname.startsWith("/dashboard/clientes")) {
      return hasPermission("clients:view") || hasPermission("clients:manage");
    }
    if (pathname.startsWith("/dashboard/bodega")) {
      return hasPermission("warehouse:view") || hasPermission("warehouse:manage");
    }
    if (pathname.startsWith("/dashboard/cuenta")) return true;

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

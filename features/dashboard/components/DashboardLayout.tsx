"use client";

import { useConvexAuth } from "convex/react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { SidebarProvider, useSidebarContext } from "./layout/layout-context";
import { useRoles } from "@/shared/hooks";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const SIDEBAR_WIDTH = 272;
const SIDEBAR_WIDTH_COLLAPSED = 80;

function DashboardLayoutInner({ children, isBodega }: { children: React.ReactNode; isBodega: boolean }) {
  const { collapsed } = useSidebarContext();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const user = useQuery(api.users.queries.current);
  const marginLeft = isBodega ? 0 : collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen bg-default-100">
      {!isBodega && <DashboardSidebar />}
      <div
        className="flex min-w-0 flex-1 flex-col transition-[margin] duration-300"
        style={{ marginLeft }}
      >
        {isBodega && (
          <header className="sticky top-0 z-20 border-b border-default-200 bg-content1/95 px-4 py-3 backdrop-blur md:px-5">
            <div className="flex items-center justify-end">
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button variant="flat" endContent={<ChevronDownIcon className="size-4" />}>
                    {user?.name || "Usuario"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Acciones de cuenta">
                  <DropdownItem key="account" onPress={() => router.push("/dashboard/cuenta")}>Mi cuenta</DropdownItem>
                  <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                    Cerrar sesión
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </header>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { isActive, isBodega, isVendedor, isLoading: isRolesLoading, canAccessPath } = useRoles();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = isAuthLoading || isRolesLoading;

  useEffect(() => {
    // Solo redirigimos si ya terminó de cargar Y estamos seguros de que NO hay sesión
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccessPath(pathname)) {
      router.replace(isBodega ? "/dashboard/bodega" : "/dashboard");
    }
  }, [isLoading, isAuthenticated, canAccessPath, pathname, isBodega, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isVendedor) {
      signOut().finally(() => {
        router.replace("/login");
      });
    }
  }, [isLoading, isAuthenticated, isVendedor, signOut, router]);

  // Pantalla de carga mientras verificamos la identidad
  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-white/50 text-sm animate-pulse">Iniciando entorno seguro...</p>
      </div>
    );
  }

  // Si no está autenticado, no mostramos nada mientras ocurre la redirección del useEffect
  if (!isAuthenticated) {
    return null;
  }

  if (!canAccessPath(pathname)) {
    return null;
  }

  // Verificación de cuenta activa
  if (!isActive) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-6 text-center">
        <div className="size-20 rounded-full bg-danger/10 flex items-center justify-center mb-6">
          <div className="size-10 rounded-full bg-danger animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Cuenta Suspendida</h1>
        <p className="text-white/60 max-w-md mb-8">
          Tu acceso al sistema ha sido desactivado por un administrador. 
          Contacta con soporte si crees que esto es un error.
        </p>
        <Button 
          color="danger" 
          variant="flat" 
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          Cerrar Sesión
        </Button>
      </div>
    );
  }

  // Restricción para Vendedores en esta aplicación web
  if (isVendedor) {
    return null;
  }

  // Si llegamos aquí, es que estamos autenticados
  return (
    <SidebarProvider>
      <DashboardLayoutInner isBodega={isBodega}>{children}</DashboardLayoutInner>
    </SidebarProvider>
  );
}

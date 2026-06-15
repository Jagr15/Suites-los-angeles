"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { ShieldExclamationIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useRoles } from "@/shared/hooks";

export function VendorWebLimitedPage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isLoading, isAuthenticated, isVendedor, user } = useRoles();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!isVendedor) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, isVendedor, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isVendedor) return null;

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(2,132,199,0.15),_transparent_40%),linear-gradient(135deg,_#08111f,_#0f172a_45%,_#111827)] p-4">
      <Card className="w-full max-w-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
        <CardHeader className="flex flex-col items-start gap-4 border-b border-white/10 px-6 py-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            <ShieldExclamationIcon className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-white">Acceso web limitado</h1>
            <p className="max-w-xl text-sm text-white/70">
              Tu perfil de vendedor está activo. Para operar rutas, ventas y visitas debes ingresar desde la aplicación móvil.
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-5 px-6 py-6">
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
            <p>
              <span className="font-semibold text-white">Usuario:</span> {user?.name || "Sin nombre"}
            </p>
            <p>
              <span className="font-semibold text-white">Correo:</span> {user?.email || "Sin correo"}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              color="danger"
              variant="flat"
              startContent={<ArrowRightOnRectangleIcon className="size-4" />}
              onPress={handleLogout}
            >
              Cerrar sesión
            </Button>
            <Button
              color="primary"
              variant="bordered"
              onPress={() => router.replace("/dashboard/cuenta")}
            >
              Ir a mi cuenta
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

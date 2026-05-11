"use client";

import { useConvexAuth } from "convex/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link, Divider, Spinner } from "@heroui/react";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side: Image */}
      <div className="hidden lg:flex w-1/2 relative bg-primary overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-110"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-primary font-black text-xl">L</span>
            </div>
            <span className="text-2xl font-black tracking-tighter">LOS ÁNGELES</span>
          </div>

          <div>
            <h1 className="text-6xl font-black mb-6 leading-tight">
              Gestión Inteligente de <br />
              <span className="text-primary-400">Distribución.</span>
            </h1>
            <p className="text-xl text-white/80 max-w-lg leading-relaxed font-medium">
              Optimiza tus rutas, gestiona proveedores y controla tus finanzas en una sola plataforma robusta y elegante.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-white/60">
            <span>© 2024 Los Ángeles S.A.</span>
            <Link href="#" className="text-white/60 hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="text-white/60 hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>

      {/* Right side: Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-content1 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-black tracking-tight text-foreground mb-2">Bienvenido</h2>
            <p className="text-default-500 font-medium tracking-tight">Ingresa tus credenciales para acceder</p>
          </div>

          {/* Componente de Formulario Extraído */}
          <LoginForm />

          <div className="flex items-center gap-4 py-2">
            <Divider className="flex-1 opacity-50" />
            <span className="text-tiny text-default-400 uppercase font-bold tracking-widest text-center">Software de POS</span>
            <Divider className="flex-1 opacity-50" />
          </div>

          <p className="text-center text-default-500 font-medium pt-4">
            ¿No tienes cuenta?{" "}
            <Link href="#" className="font-bold text-primary">Contáctanos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

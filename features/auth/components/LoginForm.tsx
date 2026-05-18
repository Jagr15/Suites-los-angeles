"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Input, 
  Button, 
  Checkbox, 
  Link, 
  addToast 
} from "@heroui/react";
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon 
} from "@heroicons/react/24/outline";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

// Esquema de validación con Zod
const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthActions();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const toggleVisibility = () => setIsVisible(!isVisible);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    try {
      const loginPromise = signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signIn",
      });
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Tiempo de espera agotado. Verifica conexión con Convex."));
        }, 12000);
      });

      // Solo permitimos Iniciar Sesión (signIn). La cuenta DEBE existir previamente (creada por Admin o Seed).
      await Promise.race([loginPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);

      addToast({
        title: "¡Bienvenido de nuevo!",
        description: "Has iniciado sesión correctamente.",
        color: "success",
      });

      router.replace("/dashboard");

      // Diagnóstico de fallback para casos donde App Router no navega por estado intermedio.
      setTimeout(() => {
        if (window.location.pathname.startsWith("/login")) {
          window.location.href = "/dashboard";
        }
      }, 900);
    } catch (error) {
      addToast({
        title: "Error de acceso",
        description:
          error instanceof Error
            ? error.message
            : "Revisa tus credenciales e intenta de nuevo. Si eres nuevo, el administrador debe habilitar tu cuenta.",
        color: "danger",
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const onInvalid = () => {};

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        void handleSubmit(onSubmit, onInvalid)(event);
      }}
    >
      <div className="space-y-4">
        <Input
          {...register("email")}
          type="email"
          label="Correo electrónico"
          placeholder="tu@correo.com"
          variant="bordered"
          labelPlacement="outside"
          radius="lg"
          isInvalid={!!errors.email}
          errorMessage={errors.email?.message}
          startContent={<EnvelopeIcon className="size-5 text-default-400" />}
          classNames={{
            label: "text-default-700 font-bold",
            inputWrapper: "h-14 border-default-200 focus-within:border-primary",
          }}
        />
        <Input
          {...register("password")}
          label="Contraseña"
          variant="bordered"
          placeholder="********"
          labelPlacement="outside"
          radius="lg"
          isInvalid={!!errors.password}
          errorMessage={errors.password?.message}
          startContent={<LockClosedIcon className="size-5 text-default-400" />}
          endContent={
            <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
              {isVisible ? (
                <EyeSlashIcon className="size-5 text-default-400 pointer-events-none" />
              ) : (
                <EyeIcon className="size-5 text-default-400 pointer-events-none" />
              )}
            </button>
          }
          type={isVisible ? "text" : "password"}
          classNames={{
            label: "text-default-700 font-bold",
            inputWrapper: "h-14 border-default-200 focus-within:border-primary",
          }}
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <Checkbox 
          {...register("remember")}
          size="sm" 
          classNames={{ label: "text-default-500 font-medium" }}
        >
          Recordarme
        </Checkbox>
        <Link href="#" size="sm" className="font-bold text-primary hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button 
        type="submit"
        color="primary" 
        className="w-full h-14 text-lg font-bold"
        size="lg"
        isLoading={isLoading}
      >
        Iniciar Sesión
      </Button>
    </form>
  );
}

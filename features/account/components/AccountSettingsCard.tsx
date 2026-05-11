"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Divider,
  addToast,
  Avatar,
} from "@heroui/react";
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function AccountSettingsCard() {
  const currentUser = useQuery(api.users.queries.current);
  const updateMe = useMutation(api.users.mutations.updateMe);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempImage, setTempImage] = useState<string | null>(null);

  // Sync temp states when currentUser loads
  useEffect(() => {
    if (currentUser) {
      setTempName(currentUser.name || "");
      setTempEmail(currentUser.email || "");
      setTempPhone(currentUser.phone || "");
      setTempImage(currentUser.image || null);
    }
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 700 * 1024) { // Convex has 1MB limit, base64 adds ~33% overhead. 700KB is safe.
        addToast({
          title: "Imagen demasiado pesada",
          description: "La imagen debe pesar menos de 700KB para poder guardarse.",
          color: "warning",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleUpdateAccount = async () => {
    // Validations
    if (!tempName || !tempEmail) {
      addToast({
        title: "Error",
        description: "El nombre y el correo son obligatorios.",
        color: "danger",
      });
      return;
    }

    // Password logic (security verification)
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        addToast({
          title: "Seguridad",
          description: "Debes ingresar tu contraseña actual para autorizar el cambio.",
          color: "warning",
        });
        return;
      }
      if (newPassword.length < 8) {
        addToast({
          title: "Contraseña Débil",
          description: "La nueva contraseña debe tener al menos 8 caracteres.",
          color: "danger",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        addToast({
          title: "Error",
          description: "La nueva contraseña y su confirmación no coinciden.",
          color: "danger",
        });
        return;
      }
    }

    setIsSaving(true);
    
    try {
      await updateMe({
        name: tempName,
        email: tempEmail,
        phone: tempPhone,
        image: tempImage,
        password: newPassword || undefined,
        currentPassword: currentPassword || undefined,
      });

      // Clear passwords
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      addToast({
        title: "Cuenta Actualizada",
        description: "Tus datos se han guardado correctamente.",
        color: "success",
      });
    } catch (error: any) {
      let errorMessage = error.message || "Ocurrió un problema.";
      
      // Limpiar el mensaje de error de Convex si es necesario
      if (errorMessage.includes("Uncaught Error: ")) {
        errorMessage = errorMessage.split("Uncaught Error: ")[1];
      } else if (errorMessage.includes("Error: ")) {
        errorMessage = errorMessage.split("Error: ")[1];
      }
      
      if (errorMessage.includes("Value is too large")) {
        errorMessage = "La imagen es demasiado pesada para el sistema (máx ~700KB). Intenta con una más pequeña.";
      }

      addToast({
        title: "Error al actualizar",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (currentUser === undefined) {
    return <div className="flex justify-center p-10 text-default-500">Cargando datos...</div>;
  }

  return (
    <Card className="max-w-4xl mx-auto border border-default-200 shadow-xl bg-content1 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-gradient-x" />
      
      <CardHeader className="flex flex-col items-start px-8 pt-8 pb-4">
        <div className="flex items-center gap-4 w-full">
          <div className="relative group">
            <Avatar 
              src={tempImage || undefined} 
              className="w-20 h-20 text-large border-2 border-primary/20 p-1"
              isBordered
              color="primary"
              showFallback
            />
            {tempImage && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="flat"
                className="absolute -top-1 -right-1 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={() => setTempImage(null)}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            )}
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
               <CameraIcon className="w-5 h-5 text-white shadow-sm" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Configuración de Cuenta</h3>
            <p className="text-default-500 font-medium italic">@{currentUser?.email?.split("@")[0] || "usuario"}</p>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-1 text-success font-semibold px-3 py-1 bg-success-50 rounded-full border border-success-100">
               <CheckCircleIcon className="w-4 h-4" />
               <span className="text-tiny">SESIÓN ACTIVA</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <Divider className="opacity-50" />

      <CardBody className="px-8 py-8 space-y-10">
        {/* Basic Info Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary-50 rounded-lg text-primary">
               <UserCircleIcon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-foreground">Información Básica</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre Completo"
              placeholder="Juan Pérez"
              variant="bordered"
              labelPlacement="outside"
              radius="lg"
              classNames={{
                label: "text-default-700 font-semibold",
                inputWrapper: "h-12 border-default-200 focus-within:border-primary",
              }}
              value={tempName}
              onValueChange={setTempName}
            />
            <Input
              label="Teléfono"
              placeholder="+51 999 999 999"
              variant="bordered"
              labelPlacement="outside"
              radius="lg"
              classNames={{
                label: "text-default-700 font-semibold",
                inputWrapper: "h-12 border-default-200 focus-within:border-primary",
              }}
              value={tempPhone}
              onValueChange={setTempPhone}
            />
            <Input
              label="Correo Electrónico"
              placeholder="admin@supraasolutions.com"
              type="email"
              variant="bordered"
              labelPlacement="outside"
              radius="lg"
              startContent={<EnvelopeIcon className="w-4 h-4 text-default-400" />}
              classNames={{
                label: "text-default-700 font-semibold",
                inputWrapper: "h-12 border-default-200 focus-within:border-primary",
              }}
              value={tempEmail}
              onValueChange={setTempEmail}
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-warning-50 rounded-lg text-warning">
               <LockClosedIcon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-foreground">Seguridad y Contraseña</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Contraseña Actual"
              placeholder="••••••••"
              type="password"
              variant="bordered"
              labelPlacement="outside"
              radius="lg"
              classNames={{
                label: "text-default-700 font-semibold",
                inputWrapper: "h-12 border-default-200 focus-within:border-primary",
              }}
              value={currentPassword}
              onValueChange={setCurrentPassword}
            />
            <Input
              label="Nueva Contraseña"
              placeholder="••••••••"
              type="password"
              variant="bordered"
              labelPlacement="outside"
              radius="lg"
              description="Mínimo 8 caracteres"
              classNames={{
                label: "text-default-700 font-semibold",
                inputWrapper: "h-12 border-default-200 focus-within:border-primary",
              }}
              value={newPassword}
              onValueChange={setNewPassword}
            />
            <Input
              label="Confirmar Contraseña"
              placeholder="••••••••"
              type="password"
              variant="bordered"
              labelPlacement="outside"
              radius="lg"
              classNames={{
                label: "text-default-700 font-semibold",
                inputWrapper: "h-12 border-default-200 focus-within:border-primary",
              }}
              value={confirmPassword}
              onValueChange={setConfirmPassword}
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 gap-2">
          <Button 
            variant="light" 
            onPress={() => {
              setTempName(currentUser?.name || "");
              setTempEmail(currentUser?.email || "");
              setTempPhone(currentUser?.phone || "");
              setTempImage(currentUser?.image || null);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            isDisabled={isSaving}
          >
            Descartar cambios
          </Button>
          <Button 
            color="primary" 
            className="font-semibold shadow-md"
            onPress={handleUpdateAccount}
            isLoading={isSaving}
            startContent={!isSaving && <CheckCircleIcon className="w-5 h-5" />}
          >
            Guardar cambios
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

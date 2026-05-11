"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { UserTable } from "./UserTable";
import { UserModal } from "./UserModal";
import { useUsers } from "./use-users";
import { useProfiles } from "../profiles/use-profiles";
import { ConfirmModal } from "@/shared/components";
import { User } from "./types";
import { userSchema } from "../../schemas/user-schema";

export function UserManagementCard() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { users, roles, isLoading: isUsersLoading, addUser, updateUser, deleteUser } = useUsers();
  const { profiles, isLoading: isProfilesLoading } = useProfiles();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // State for form fields
  const [formState, setFormState] = useState<Partial<User & { roleId?: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    // Buscamos el roleId correspondiente al nombre del rol para el modal
    const roleId = roles?.find(r => r.name === user.role)?._id;
    setFormState({ ...user, roleId });
    onOpen();
  };

  const handleAdd = () => {
    if (!profiles || profiles.length === 0) {
      addToast({
        title: "Perfiles requeridos",
        description: "No hay perfiles disponibles. Crea primero un perfil de personal.",
        color: "warning",
      });
      return;
    }
    const firstRole = roles?.[0];
    setSelectedUser(null);
    setFormState({
      isActive: true,
      role: firstRole?.name || "Vendedor",
      profileName: "",
      email: "",
      roleId: firstRole?._id,
      profileId: "",
    });
    onOpen();
  };

  const handleSave = async () => {
    // Validar usando Zod
    const validation = userSchema.safeParse(formState);
    
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Datos inválidos";
      addToast({
        title: "Error de validación",
        description: firstError,
        color: "danger",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, formState);
      } else {
        await addUser(formState);
      }

      addToast({
        title: selectedUser ? "Usuario Actualizado" : "Usuario Creado",
        description: `El acceso para ${formState.email} ha sido guardado.`,
        color: "success",
      });
      onOpenChange(); // Close modal
    } catch (error) {
      console.error("Error saving user:", error);
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la configuración del usuario.";
      addToast({
        title: "Error",
        description: message,
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      addToast({
        title: "Usuario Eliminado",
        description: `El acceso de ${userToDelete.email} ha sido borrado permanentemente.`,
        color: "danger",
      });
      setUserToDelete(null);
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo eliminar el usuario.",
        color: "danger",
      });
    }
  };

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h3 className="text-medium font-semibold text-foreground">
            Gestión de Usuarios y Accesos
          </h3>
          <p className="text-small text-default-500">
            Control de credenciales y permisos del sistema
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          className="font-semibold"
          startContent={<UserPlusIcon className="size-4" />}
          onPress={handleAdd}
        >
          Crear Usuario
        </Button>
      </CardHeader>
      <CardBody className="px-6 pb-8">
        <UserTable 
          items={users} 
          onEdit={handleEdit} 
          onDelete={handleDeleteRequest} 
        />

        <UserModal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          selectedUser={selectedUser}
          formState={formState}
          setFormState={setFormState}
          onSave={handleSave}
          onClose={onOpenChange}
          isLoading={isSaving}
          profiles={profiles || []}
        />

        <ConfirmModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar usuario permanentemente?"
          description={`Esta acción borrará el acceso de "${userToDelete?.email}". No se puede deshacer.`}
          confirmLabel="Borrar Acceso"
          variant="danger"
          requirePassword={true}
        />
      </CardBody>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Tabs,
  Tab,
  Chip,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Profile } from "./types";
import { ProfileTable } from "./ProfileTable";
import { ProfileModal } from "./ProfileModal";
import { ConfirmModal } from "@/shared/components";
import { useProfiles } from "./use-profiles";

export function ProfilesManagementCard() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { profiles, isLoading, addProfile, updateProfile, deleteProfile } = useProfiles();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  
  // State for form fields
  const [formState, setFormState] = useState<Partial<Profile>>({});
  const [isSaving, setIsSaving] = useState(false);

  const activeProfiles = profiles.filter((p) => p.status === "Activo");
  const inactiveProfiles = profiles.filter((p) => p.status === "Inactivo");

  const handleEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setFormState(profile);
    onOpen();
  };

  const handleAdd = () => {
    setSelectedProfile(null);
    setFormState({
      fullName: "",
      position: "",
      status: "Activo",
      isEmployee: true,
      bloodType: "O+",
      hireDate: new Date().toISOString().split("T")[0],
    });
    onOpen();
  };

  const handleSave = async () => {
    // Validation before save
    if (!formState.fullName || !formState.position) {
      addToast({
        title: "Campos Requeridos",
        description: "El nombre y el puesto son obligatorios.",
        color: "danger",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (selectedProfile) {
        // Update
        await updateProfile(selectedProfile.id, formState as Partial<Profile>);
      } else {
        // Create
        await addProfile(formState as Omit<Profile, "id">);
      }
      
      addToast({
        title: selectedProfile ? "Perfil Actualizado" : "Perfil Creado",
        description: `El perfil de ${formState.fullName} se ha guardado correctamente.`,
        color: "success",
      });
      
      onClose(); // Explicitly close modal
    } catch (error) {
      console.error("Error saving profile:", error);
      addToast({
        title: "Error",
        description: "No se pudo guardar el perfil.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) setProfileToDelete(profile);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    try {
      await deleteProfile(profileToDelete.id);
      addToast({
        title: "Empleado de Baja",
        description: `${profileToDelete.fullName} ahora está en el historial de inactivos.`,
        color: "warning",
      });
      setProfileToDelete(null);
    } catch (error) {
       addToast({
        title: "Error",
        description: "No se pudo procesar la baja.",
        color: "danger",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-default-200 shadow-sm bg-content1">
        <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h3 className="text-medium font-semibold text-foreground">
              Perfiles de Recursos Humanos
            </h3>
            <p className="text-small text-default-500">
              Gestión de plantillas y datos laborales
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
            Añadir Perfil
          </Button>
        </CardHeader>
        <CardBody className="px-6 pb-8">
          <Tabs 
            variant="underlined" 
            aria-label="Tabs perfiles"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-10",
              tabContent: "group-data-[selected=true]:text-primary",
            }}
          >
            <Tab 
              key="activos" 
              title={
                <div className="flex items-center gap-2">
                  <span>Activos</span>
                  <Chip size="sm" variant="flat" color="primary">{activeProfiles.length}</Chip>
                </div>
              }
            >
              <div className="mt-4">
                <ProfileTable 
                  items={activeProfiles} 
                  label="Tabla empleados activos" 
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                  isLoading={isLoading}
                />
              </div>
            </Tab>
            <Tab 
              key="inactivos" 
              title={
                <div className="flex items-center gap-2">
                  <span>Inactivos / Bajas</span>
                  <Chip size="sm" variant="flat">{inactiveProfiles.length}</Chip>
                </div>
              }
            >
              <div className="mt-4">
                <ProfileTable 
                  items={inactiveProfiles} 
                  label="Tabla empleados inactivos" 
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                  isLoading={isLoading}
                />
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      <ProfileModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        selectedProfile={selectedProfile}
        formState={formState}
        setFormState={setFormState}
        onSave={handleSave}
        onClose={onClose}
        isLoading={isSaving}
      />

      <ConfirmModal
        isOpen={!!profileToDelete}
        onClose={() => setProfileToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Dar de baja empleado?"
        description={`Esta acción moverá a "${profileToDelete?.fullName}" al historial de inactivos.`}
        confirmLabel="Confirmar Baja"
        variant="warning"
        requirePassword={true}
      />
    </div>
  );
}

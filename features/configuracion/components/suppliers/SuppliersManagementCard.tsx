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
import { PlusIcon } from "@heroicons/react/24/outline";
import { SupplierTable } from "./SupplierTable";
import { SupplierModal } from "./SupplierModal";
import { ConfirmModal } from "@/shared/components";
import { useSuppliers } from "./hooks/use-suppliers";
import { Supplier } from "./types";

export function SuppliersManagementCard() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [formState, setFormState] = useState<Partial<Supplier>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormState(supplier);
    onOpen();
  };

  const handleAdd = () => {
    setSelectedSupplier(null);
    setFormState({
      businessName: "",
      rfc: "",
      creditDays: 30,
      contacts: [],
      bankAccounts: [],
    });
    onOpen();
  };

  const handleDeleteRequest = (id: string) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (supplier) setSupplierToDelete(supplier);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(supplierToDelete.id);
      addToast({
        title: "Proveedor Eliminado",
        description: "El registro ha sido removido con éxito.",
        color: "success",
      });
      setSupplierToDelete(null);
      onClose();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      addToast({
        title: "Error",
        description: "No se pudo eliminar el proveedor.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!formState.businessName || !formState.rfc) {
      addToast({
        title: "Campos Requeridos",
        description: "Razón social y RFC son obligatorios.",
        color: "danger",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Limpiar campos internos de Convex antes de enviar
      const { _id, _creationTime, ...cleanData } = formState as any;

      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, cleanData);
        addToast({
          title: "Proveedor Actualizado",
          description: "Los cambios se guardaron correctamente.",
          color: "success",
        });
      } else {
        await addSupplier(cleanData);
        addToast({
          title: "Proveedor Creado",
          description: "El nuevo proveedor se registró con éxito.",
          color: "success",
        });
      }
      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Hubo un problema al procesar la solicitud.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h3 className="text-medium font-semibold text-foreground tracking-tight">
            Gestión de Proveedores
          </h3>
          <p className="text-small text-default-500">
            Control de cuentas por pagar y catálogos de suministro
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          className="font-semibold bg-primary/10 text-primary hover:bg-primary/20"
          startContent={<PlusIcon className="size-4" />}
          onPress={handleAdd}
        >
          Añadir Proveedor
        </Button>
      </CardHeader>
      <CardBody className="px-6 pb-8 overflow-x-auto">
        <SupplierTable 
          items={suppliers}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          isLoading={isLoading}
        />
      </CardBody>

      <SupplierModal 
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        selectedSupplier={selectedSupplier}
        formState={formState}
        setFormState={setFormState}
        onSave={handleSave}
        onClose={onClose}
        onDelete={handleDeleteRequest}
        isLoading={isSaving}
      />

      <ConfirmModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar proveedor?"
        description={`Esta acción eliminará permanentemente a "${supplierToDelete?.businessName}".`}
        confirmLabel="Eliminar"
        variant="danger"
        requirePassword={true}
        adminPassword="admin123456"
        isConfirming={isDeleting}
      />
    </Card>
  );
}

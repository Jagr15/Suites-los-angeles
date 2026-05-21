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
import { Client } from "./types";
import { ClientTable } from "./ClientTable";
import { ClientModal } from "./ClientModal";
import { ConfirmModal } from "@/shared/components";
import { useClients } from "./use-clients";

export function ClientsManagementCard() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { clients, isLoading, addClient, updateClient, deleteClient } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    onOpen();
  };

  const handleAdd = () => {
    setSelectedClient(null);
    onOpen();
  };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, data);
      } else {
        await addClient(data);
      }

      addToast({
        title: selectedClient ? "Cliente Actualizado" : "Cliente Registrado",
        description: `Los datos comerciales de ${data.commercialName} han sido guardados.`,
        color: "success",
      });
      onOpenChange(); // Close modal
    } catch (error) {
      console.error("Error saving client:", error);
      const message = error instanceof Error ? error.message : "No se pudo guardar la información del cliente.";
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
    const client = clients.find(c => c.id === id);
    if (client) setClientToDelete(client);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient(clientToDelete.id);
      addToast({
        title: "Cliente Eliminado",
        description: `El cliente ${clientToDelete.commercialName} fue removido del catálogo.`,
        color: "danger",
      });
      setClientToDelete(null);
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        color: "danger",
      });
    }
  };

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h3 className="text-medium font-semibold text-foreground">
            Catálogo de Clientes
          </h3>
          <p className="text-small text-default-500">
            Administración de puntos de venta y rutas asignadas
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          className="font-semibold"
          startContent={<PlusIcon className="size-4" />}
          onPress={handleAdd}
        >
          Nuevo Cliente
        </Button>
      </CardHeader>
      <CardBody className="px-6 pb-8">
        <ClientTable 
          items={clients} 
          onEdit={handleEdit} 
          onDelete={handleDeleteRequest} 
        />

        <ClientModal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          selectedClient={selectedClient}
          onSave={handleSave}
          onClose={onOpenChange}
          isLoading={isSaving}
        />

        <ConfirmModal
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar cliente?"
          description={`Esta acción eliminará permanentemente a "${clientToDelete?.commercialName}".`}
          confirmLabel="Eliminar"
          variant="danger"
          requirePassword={true}
        />
      </CardBody>
    </Card>
  );
}

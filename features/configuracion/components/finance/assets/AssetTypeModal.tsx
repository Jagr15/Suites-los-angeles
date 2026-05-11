"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Checkbox,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  addToast,
} from "@heroui/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

interface AssetTypeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetTypeModal({ isOpen, onOpenChange }: AssetTypeModalProps) {
  const assetTypes = useQuery(api.fixedAssetTypes.list);
  const createType = useMutation(api.fixedAssetTypes.create);
  const deleteType = useMutation(api.fixedAssetTypes.remove);

  const [newName, setNewName] = useState("");
  const [requiresModel, setRequiresModel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddType = async () => {
    if (!newName) return;
    setIsSubmitting(true);
    try {
      await createType({ name: newName, requiresModel });
      setNewName("");
      setRequiresModel(false);
      addToast({
        title: "Tipo Creado",
        description: "El nuevo tipo de activo se ha guardado.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo crear el tipo.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteType({ id });
      addToast({ title: "Eliminado", color: "success" });
    } catch (e) {
      addToast({ title: "Error al eliminar", color: "danger" });
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Gestionar Tipos de Activos</ModalHeader>
            <ModalBody className="space-y-6">
              {/* Form to add new type */}
              <div className="bg-default-50 p-4 rounded-xl space-y-4 border border-default-200">
                <p className="text-sm font-semibold">Agregar Nuevo Tipo</p>
                <div className="flex flex-col gap-3">
                  <Input 
                    label="Nombre del Tipo" 
                    placeholder="Ej. Mobiliario" 
                    variant="bordered"
                    value={newName}
                    onValueChange={setNewName}
                  />
                  <Checkbox 
                    isSelected={requiresModel} 
                    onValueChange={setRequiresModel}
                  >
                    ¿Requiere campo de Modelo?
                  </Checkbox>
                  <Button 
                    color="primary" 
                    className="w-full font-semibold"
                    startContent={<PlusIcon className="size-4" />}
                    onPress={handleAddType}
                    isLoading={isSubmitting}
                  >
                    Añadir a la lista
                  </Button>
                </div>
              </div>

              {/* List of existing types */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">Tipos Existentes</p>
                <Table aria-label="Tabla de tipos de activos" removeWrapper>
                  <TableHeader>
                    <TableColumn>NOMBRE</TableColumn>
                    <TableColumn>MODELO</TableColumn>
                    <TableColumn>ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody items={assetTypes || []} emptyContent="No hay tipos registrados.">
                    {(item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.requiresModel ? "Sí" : "No"}</TableCell>
                        <TableCell>
                          <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light" 
                            color="danger"
                            onPress={() => handleDelete(item._id)}
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" variant="flat" onPress={onClose}>Cerrar</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

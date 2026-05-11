"use client";

import React, { useState } from "react";
import { Button, useDisclosure, addToast } from "@heroui/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AssetTable } from "./AssetTable";
import { AssetForm } from "./AssetForm";
import { AssetTypeModal } from "./AssetTypeModal";
import { ConfirmModal } from "@/shared/components";
import { Modal, ModalContent, useDisclosure as useBaseDisclosure } from "@heroui/react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

// --- Types handled by Convex ---

// --- Mock data removed ---

export function FixedAssetsTab() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { 
    isOpen: isTypeModalOpen, 
    onOpen: onOpenTypeModal, 
    onOpenChange: onOpenChangeTypeModal 
  } = useBaseDisclosure();

  // Convex integration
  const assets = useQuery(api.assets.queries.list);
  const createAsset = useMutation(api.assets.mutations.create);
  const removeAsset = useMutation(api.assets.mutations.remove);

  const [assetToDelete, setAssetToDelete] = useState<any | null>(null);

  const handleSaveAsset = async (data: any) => {
    try {
      await createAsset(data);
      addToast({
        title: "Activo Registrado",
        description: "El activo se ha guardado en la base de datos.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo guardar el activo.",
        color: "danger",
      });
    }
  };

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      await removeAsset({ id: assetToDelete._id });
      addToast({
        title: "Activo Eliminado",
        color: "success",
      });
      setAssetToDelete(null);
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo eliminar el activo.",
        color: "danger",
      });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Control de Activos Fijos</h4>
          <p className="text-tiny text-default-400">Inventario contable y depreciación</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="flat" 
            startContent={<Cog6ToothIcon className="size-4"/>} 
            onPress={onOpenTypeModal}
          >
            Gestionar Tipos
          </Button>
          <Button 
            size="sm" 
            color="primary" 
            variant="flat" 
            startContent={<PlusIcon className="size-4"/>} 
            onPress={onOpen}
          >
            Nuevo Activo
          </Button>
        </div>
      </div>

      <AssetTable 
        assets={assets || []} 
        onDelete={(asset) => setAssetToDelete(asset)} 
      />

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <AssetForm onClose={onClose} onSave={handleSaveAsset} />
          )}
        </ModalContent>
      </Modal>

      <AssetTypeModal 
        isOpen={isTypeModalOpen} 
        onOpenChange={onOpenChangeTypeModal} 
      />

      <ConfirmModal
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmDeleteAsset}
        title="¿Eliminar activo fijo?"
        description={`Esta acción eliminará "${assetToDelete?.name}" del catálogo contable.`}
        confirmLabel="Eliminar"
        variant="danger"
        requirePassword={true}
        adminPassword="admin123456"
      />
    </div>
  );
}

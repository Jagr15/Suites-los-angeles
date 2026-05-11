"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Chip,
  addToast,
} from "@heroui/react";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AssetModal } from "./AssetModal";
import { ConfirmModal } from "@/shared/components";
import { useAssets } from "./use-assets";
import { Asset } from "./types";

export function AssetsManagementCard() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { assets, isLoading, deleteAsset } = useAssets();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    onOpen();
  };

  const handleAdd = () => {
    setSelectedAsset(null);
    onOpen();
  };

  const handleDeleteRequest = (asset: Asset) => {
    setAssetToDelete(asset);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      await deleteAsset(assetToDelete._id);
      addToast({
        title: "Activo Eliminado",
        description: "El activo ha sido removido del catálogo.",
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

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(val);

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h3 className="text-medium font-semibold text-foreground tracking-tight">
            Gestión de Activos Fijos
          </h3>
          <p className="text-small text-default-500">
            Inventario, categorías y depreciación de recursos
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          className="font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          startContent={<PlusIcon className="size-4" />}
          onPress={handleAdd}
        >
          Nuevo Activo
        </Button>
      </CardHeader>
      <CardBody className="px-6 pb-8 overflow-x-auto">
        <Table aria-label="Tabla de activos" removeWrapper>
          <TableHeader>
            <TableColumn>ACTIVO</TableColumn>
            <TableColumn>CATEGORÍA</TableColumn>
            <TableColumn>VALOR</TableColumn>
            <TableColumn>ESTADO</TableColumn>
            <TableColumn>ACCIONES</TableColumn>
          </TableHeader>
          <TableBody 
            items={assets} 
            isLoading={isLoading}
            emptyContent={isLoading ? "Cargando..." : "No hay activos registrados"}
          >
            {(item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-small font-medium">{item.name}</span>
                    <span className="text-tiny text-default-400">{item.serialNumber || "S/N"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color="secondary">
                    {item.category}
                  </Chip>
                </TableCell>
                <TableCell>{formatCurrency(item.acquisitionValue)}</TableCell>
                <TableCell>
                  <Chip 
                    size="sm" 
                    variant="dot" 
                    color={item.status === "Activo" ? "success" : item.status === "Mantenimiento" ? "warning" : "default"}
                  >
                    {item.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Editar">
                      <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(item)}>
                        <PencilSquareIcon className="size-5 text-default-400" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Eliminar" color="danger">
                      <Button isIconOnly size="sm" variant="light" onPress={() => handleDeleteRequest(item)}>
                        <TrashIcon className="size-5 text-danger" />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <AssetModal 
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          selectedAsset={selectedAsset}
          onClose={onClose}
        />

        <ConfirmModal
          isOpen={!!assetToDelete}
          onClose={() => setAssetToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar activo?"
          description={`Esta acción eliminará "${assetToDelete?.name}" permanentemente.`}
          confirmLabel="Eliminar"
          variant="danger"
          requirePassword={true}
        />
      </CardBody>
    </Card>
  );
}

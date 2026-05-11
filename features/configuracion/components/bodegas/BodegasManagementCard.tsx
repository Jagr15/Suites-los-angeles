"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Switch,
  Divider,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  addToast,
} from "@heroui/react";
import {
  BuildingStorefrontIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { BodegaModal } from "./BodegaModal";
import { ConfirmModal } from "@/shared/components";
import type { Almacen, AlmacenFormValues } from "@/shared/schemas";

export function BodegasManagementCard() {
  const [filterValue, setFilterValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bodegaToEdit, setBodegaToEdit] = useState<Almacen | null>(null);
  const [bodegaToDelete, setBodegaToDelete] = useState<Almacen | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bodegas = useQuery(api.bodegas.queries.list);
  const createBodega = useMutation(api.bodegas.mutations.create);
  const updateBodega = useMutation(api.bodegas.mutations.update);
  const removeBodega = useMutation(api.bodegas.mutations.remove);

  const filteredItems = useMemo(() => {
    if (!bodegas) return [];
    return bodegas.filter((item) =>
      item.name.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [bodegas, filterValue]);

  const handleOpenModal = (bodega?: Almacen) => {
    setBodegaToEdit(bodega || null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: AlmacenFormValues) => {
    setIsSubmitting(true);
    try {
      if (bodegaToEdit) {
        await updateBodega({ id: bodegaToEdit._id as any, ...values });
        addToast({
          title: "Bodega actualizada",
          description: `Se guardaron los cambios en ${values.name}.`,
          color: "success",
        });
      } else {
        await createBodega(values);
        addToast({
          title: "Bodega creada",
          description: `Se registró la nueva bodega ${values.name}.`,
          color: "success",
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo guardar la bodega.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bodegaToDelete) return;
    setIsDeleting(true);
    try {
      await removeBodega({ id: bodegaToDelete._id as any });
      addToast({
        title: "Bodega eliminada",
        description: `Se eliminó la bodega ${bodegaToDelete.name}.`,
        color: "success",
      });
      setBodegaToDelete(null);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo eliminar la bodega.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="border border-default-200 shadow-sm bg-content1">
        <CardHeader className="flex flex-col gap-4 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BuildingStorefrontIcon className="size-6 text-primary" />
                Gestión de Bodegas
              </h3>
              <p className="text-small text-default-500">
                Administra los puntos de almacenamiento y distribución
              </p>
            </div>
            <Button
              color="primary"
              variant="flat"
              size="sm"
              className="font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              startContent={<PlusIcon className="size-5 stroke-[3]" />}
              onPress={() => handleOpenModal()}
            >
              Nueva Bodega
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            <Input
              isClearable
              className="w-full md:max-w-[44%]"
              placeholder="Buscar por nombre..."
              startContent={<MagnifyingGlassIcon className="size-4 text-default-400" />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onValueChange={setFilterValue}
            />
          </div>
        </CardHeader>

        <CardBody className="px-6 pb-6">
          <Table
            aria-label="Tabla de bodegas"
            classNames={{
              wrapper: "shadow-none border border-default-100 p-0 rounded-xl overflow-hidden",
              th: "bg-default-50 text-default-600 font-bold uppercase text-tiny px-6 py-4 border-b border-default-100",
              td: "px-6 py-4",
            }}
          >
            <TableHeader>
              <TableColumn>NOMBRE</TableColumn>
              <TableColumn>UBICACIÓN / DESCRIPCIÓN</TableColumn>
              <TableColumn>ESTADO</TableColumn>
              <TableColumn align="center">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={bodegas === undefined ? "Cargando..." : "No se encontraron bodegas."}
            >
              {filteredItems.map((item) => (
                <TableRow key={item._id} className="hover:bg-default-50 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        {item.name}
                      </span>
                      <span className="text-tiny text-default-400 font-mono">
                        ID: {item._id.slice(-6)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-default-700">
                        {item.address || "Sin dirección"}
                      </span>
                      <span className="text-tiny text-default-500 italic">
                        {item.description || "Sin descripción"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={item.isActive ? "success" : "danger"}
                      className="font-bold"
                    >
                      {item.isActive ? "ACTIVO" : "INACTIVO"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip content="Editar bodega">
                        <Button isIconOnly size="sm" variant="light" color="primary" onPress={() => handleOpenModal(item)}>
                          <PencilIcon className="size-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Eliminar bodega" color="danger">
                        <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => setBodegaToDelete(item)}>
                          <TrashIcon className="size-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </CardBody>
      </Card>

      <BodegaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bodega={bodegaToEdit}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmModal
        isOpen={!!bodegaToDelete}
        onClose={() => setBodegaToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Bodega"
        description={`¿Estás seguro de que deseas eliminar la bodega "${bodegaToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </>
  );
}

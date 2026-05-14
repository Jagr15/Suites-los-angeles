"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Chip,
} from "@heroui/react";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

interface FixedAsset {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  acquisitionValue: number;
  usefulLifeYears: number;
  acquisitionDate?: string;
  description?: string;
  serialNumber?: string;
  year?: string;
  status?: "Activo" | "Inactivo" | "Mantenimiento";
  model?: string;
  brand?: string;
  plate?: string;
}

interface AssetTableProps {
  assets: FixedAsset[];
  onEdit: (asset: FixedAsset) => void;
  onDelete: (asset: FixedAsset) => void;
}

export function AssetTable({ assets, onEdit, onDelete }: AssetTableProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(val);

  return (
    <Table aria-label="Tabla de activos fijos" removeWrapper>
      <TableHeader>
        <TableColumn>ACTIVO</TableColumn>
        <TableColumn>CATEGORÍA</TableColumn>
        <TableColumn>VALOR ADQUISICIÓN</TableColumn>
        <TableColumn>VIDA ÚTIL</TableColumn>
        <TableColumn>ACCIONES</TableColumn>
      </TableHeader>
      <TableBody items={assets} emptyContent="No hay activos registrados.">
        {(item: any) => (
          <TableRow key={item._id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-default-700">{item.name}</span>
                <div className="flex gap-2">
                  {item.brand && <span className="text-tiny text-default-400">{item.brand}</span>}
                  {item.model && <span className="text-tiny text-default-400">{item.model}</span>}
                  {item.plate && <Chip size="sm" variant="flat" className="h-4 text-[10px] uppercase">{item.plate}</Chip>}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Chip size="sm" variant="flat" color="secondary" className="capitalize">
                {item.category.toLowerCase()}
              </Chip>
            </TableCell>
            <TableCell>{formatCurrency(item.acquisitionValue)}</TableCell>
            <TableCell>{item.usefulLifeYears} Años</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Tooltip content="Editar">
                  <PencilSquareIcon
                    className="size-5 text-default-400 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onEdit(item)}
                  />
                </Tooltip>
                <Tooltip content="Eliminar" color="danger">
                  <TrashIcon 
                    className="size-5 text-default-400 cursor-pointer hover:text-danger transition-colors" 
                    onClick={() => onDelete(item)}
                  />
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

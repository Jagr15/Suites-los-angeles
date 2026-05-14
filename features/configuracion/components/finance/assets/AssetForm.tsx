"use client";

import React, { useState } from "react";
import {
  Input,
  Select,
  SelectItem,
  Button,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AssetFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any | null;
  mode?: "create" | "edit";
}

export function AssetForm({ onClose, onSave, initialData, mode = "create" }: AssetFormProps) {
  const assetTypes = useQuery(api.fixedAssetTypes.list);
  const [category, setCategory] = useState<string>(initialData?.category || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [model, setModel] = useState(initialData?.model || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [plate, setPlate] = useState(initialData?.plate || "");
  const [year, setYear] = useState(initialData?.year || "");
  const [acquisitionDate, setAcquisitionDate] = useState(
    initialData?.acquisitionDate || new Date().toISOString().split("T")[0]
  );
  const [acquisitionValue, setAcquisitionValue] = useState(
    initialData?.acquisitionValue?.toString() || ""
  );
  const [usefulLifeYears, setUsefulLifeYears] = useState(
    initialData?.usefulLifeYears?.toString() || ""
  );
  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber || "");
  const [status, setStatus] = useState<string>(initialData?.status || "Activo");

  const selectedType = assetTypes?.find(t => t.name === category);
  const isTransport = category === "Equipo de Transporte";
  const isCompute = category === "Equipo de Cómputo";
  const showModelField = selectedType?.requiresModel || isTransport || isCompute;

  const handleSave = () => {
    onSave({
      name,
      description: description || undefined,
      category,
      model,
      brand,
      plate,
      year,
      acquisitionDate,
      acquisitionValue: Number(acquisitionValue),
      usefulLifeYears: Number(usefulLifeYears),
      serialNumber: serialNumber || undefined,
      status: status as "Activo" | "Inactivo" | "Mantenimiento",
    });
    onClose();
  };

  return (
    <>
      <ModalHeader>{mode === "edit" ? "Editar Activo Fijo" : "Registro de Activo Fijo"}</ModalHeader>
      <ModalBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <Select 
            label="Tipo de Activo" 
            variant="bordered" 
            labelPlacement="outside"
            placeholder={assetTypes ? "Selecciona una categoría" : "Cargando categorías..."}
            selectedKeys={category ? [category] : []}
            onSelectionChange={(keys) => setCategory(Array.from(keys)[0] as string)}
            className="md:col-span-2"
            isDisabled={!assetTypes}
          >
            {(assetTypes || []).map((cat) => (
              <SelectItem key={cat.name} textValue={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </Select>

          {category && (
            <>
              <Input 
                label="Nombre / Descripción" 
                placeholder="Ej. Laptop Dell Latitude" 
                variant="bordered" 
                labelPlacement="outside" 
                className="md:col-span-2"
                value={name}
                onValueChange={setName}
              />
              <Input
                label="Notas / Descripción"
                placeholder="Observaciones del activo"
                variant="bordered"
                labelPlacement="outside"
                className="md:col-span-2"
                value={description}
                onValueChange={setDescription}
              />
              
              {/* Dynamic fields based on category */}
              {showModelField && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Marca" 
                    placeholder="Ej. Isuzu / Dell" 
                    variant="bordered" 
                    labelPlacement="outside"
                    value={brand}
                    onValueChange={setBrand}
                  />
                  <Input 
                    label="Modelo / Versión" 
                    placeholder="Ej. NPR 2023 / XPS 13" 
                    variant="bordered" 
                    labelPlacement="outside"
                    value={model}
                    onValueChange={setModel}
                  />
                </div>
              )}

              {isTransport && (
                <>
                  <Input 
                    label="Placas" 
                    placeholder="ABC-1234" 
                    variant="bordered" 
                    labelPlacement="outside"
                    value={plate}
                    onValueChange={setPlate}
                  />
                  <Input 
                    label="Año" 
                    placeholder="2023" 
                    variant="bordered" 
                    labelPlacement="outside"
                    value={year}
                    onValueChange={setYear}
                  />
                </>
              )}

              <Input 
                label="Valor de Adquisición" 
                placeholder="0.00" 
                variant="bordered" 
                labelPlacement="outside" 
                startContent={<span className="text-default-400">$</span>}
                value={acquisitionValue}
                onValueChange={setAcquisitionValue}
              />
              
              <Input 
                label="Fecha de Adquisición" 
                type="date"
                variant="bordered" 
                labelPlacement="outside" 
                value={acquisitionDate}
                onValueChange={setAcquisitionDate}
              />

              <Input 
                label="Años de Vida Útil" 
                placeholder="5" 
                variant="bordered" 
                labelPlacement="outside" 
                type="number"
                value={usefulLifeYears}
                onValueChange={setUsefulLifeYears}
              />

              <Input 
                label="Número de Serie / VIN" 
                placeholder="Ej. VIN12345678" 
                variant="bordered" 
                labelPlacement="outside" 
                value={serialNumber}
                onValueChange={setSerialNumber}
              />

              <Select
                label="Estado del Activo"
                variant="bordered"
                labelPlacement="outside"
                selectedKeys={[status]}
                onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as string)}
              >
                <SelectItem key="Activo">Activo</SelectItem>
                <SelectItem key="Inactivo">Inactivo</SelectItem>
                <SelectItem key="Mantenimiento">Mantenimiento</SelectItem>
              </Select>
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="light" color="danger" onPress={onClose}>
          Cancelar
        </Button>
        <Button 
          color="primary" 
          onPress={handleSave}
          isDisabled={!category || !name || !acquisitionValue}
        >
          {mode === "edit" ? "Guardar Cambios" : "Guardar Activo"}
        </Button>
      </ModalFooter>
    </>
  );
}

import React from 'react';
import { Select, SelectItem } from "@heroui/react";
import { useCities } from "@/shared/hooks/useLocations";

interface CitySelectorProps {
  stateId?: string;
  selectedKey?: string;
  onSelectionChange: (cityId: string, cityName: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const CitySelector = ({ 
  stateId,
  selectedKey, 
  onSelectionChange, 
  label = "Municipio", 
  placeholder = "Selecciona un municipio",
  className
}: CitySelectorProps) => {
  const { data, isLoading } = useCities(stateId ? parseInt(stateId) : null);

  return (
    <Select
      label={label}
      placeholder={!stateId ? "Primero selecciona un estado" : isLoading ? "Cargando municipios..." : placeholder}
      variant="bordered"
      labelPlacement="outside"
      isLoading={isLoading}
      isDisabled={!stateId}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onSelectionChange={(keys) => {
        const id = Array.from(keys)[0] as string;
        const city = data?.cities.find(c => c.id.toString() === id);
        if (id && city) {
          onSelectionChange(id, city.name);
        }
      }}
      className={className}
    >
      {(data?.cities || []).map((city) => (
        <SelectItem key={city.id.toString()} textValue={city.name}>
          {city.name}
        </SelectItem>
      ))}
    </Select>
  );
};

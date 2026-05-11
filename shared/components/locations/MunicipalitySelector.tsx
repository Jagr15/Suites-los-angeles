import { Select, SelectItem } from "@heroui/react";
import { useMunicipalities } from "@/shared/hooks/useLocations";

interface MunicipalitySelectorProps {
  stateId?: string; // En este caso el stateId es el NOMBRE del estado (string)
  selectedKey?: string;
  onSelectionChange: (municipalityId: string, municipalityName: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const MunicipalitySelector = ({ 
  stateId,
  selectedKey, 
  onSelectionChange, 
  label = "Municipio", 
  placeholder = "Selecciona un municipio",
  className
}: MunicipalitySelectorProps) => {
  
  const { data, isLoading } = useMunicipalities(stateId || null);

  const municipalities = data?.municipalities || [];

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
        const mun = municipalities.find(m => m.id.toString() === id);
        if (id && mun) {
          onSelectionChange(id, mun.name);
        }
      }}
      className={className}
    >
      {municipalities.map((mun) => (
        <SelectItem key={mun.id.toString()} textValue={mun.name}>
          {mun.name}
        </SelectItem>
      ))}
    </Select>
  );
};

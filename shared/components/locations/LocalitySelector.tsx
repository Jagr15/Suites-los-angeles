import { Select, SelectItem } from "@heroui/react";
import { useLocalities } from "@/shared/hooks/useLocations";

interface LocalitySelectorProps {
  stateId: string | null;
  municipalityId: string | null;
  selectedKey?: string;
  onSelectionChange: (localityId: string, localityName: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const LocalitySelector = ({ 
  stateId,
  municipalityId,
  selectedKey, 
  onSelectionChange, 
  label = "Localidad / Pueblo", 
  placeholder = "Selecciona localidad",
  className
}: LocalitySelectorProps) => {
  const { data: localities, isLoading } = useLocalities(stateId, municipalityId);

  return (
    <Select
      label={label}
      placeholder={!municipalityId ? "Primero selecciona municipio" : isLoading ? "Cargando localidades..." : placeholder}
      variant="bordered"
      labelPlacement="outside"
      isLoading={isLoading}
      isDisabled={!municipalityId}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onSelectionChange={(keys) => {
        const id = Array.from(keys)[0] as string;
        const loc = localities?.find(l => l.id === id);
        if (id && loc) {
          onSelectionChange(id, loc.name);
        }
      }}
      className={className}
    >
      {(localities || []).map((loc) => (
        <SelectItem key={loc.id} textValue={loc.name}>
          {loc.name}
        </SelectItem>
      ))}
    </Select>
  );
};

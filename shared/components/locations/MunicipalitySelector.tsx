import { Autocomplete, AutocompleteItem } from "@heroui/react";
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
    <Autocomplete
      label={label}
      placeholder={!stateId ? "Primero selecciona un estado" : isLoading ? "Cargando municipios..." : placeholder}
      variant="bordered"
      labelPlacement="outside"
      isLoading={isLoading}
      isDisabled={!stateId}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (!key) return;
        const id = key.toString();
        const mun = municipalities.find(m => m.id.toString() === id);
        if (mun) {
          onSelectionChange(id, mun.name);
        }
      }}
      className={className}
      items={municipalities}
    >
      {(mun) => (
        <AutocompleteItem key={mun.id.toString()} textValue={mun.name}>
          {mun.name}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
};

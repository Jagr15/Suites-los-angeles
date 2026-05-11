import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { useStates } from "@/shared/hooks/useLocations";

interface StateSelectorProps {
  selectedKey?: string;
  onSelectionChange: (stateId: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const StateSelector = ({ 
  selectedKey, 
  onSelectionChange, 
  label = "Estado", 
  placeholder = "Selecciona un estado",
  className
}: StateSelectorProps) => {
  const { data, isLoading } = useStates();

  return (
    <Autocomplete
      label={label}
      placeholder={isLoading ? "Cargando estados..." : placeholder}
      variant="bordered"
      labelPlacement="outside"
      isLoading={isLoading}
      selectedKey={selectedKey}
      onSelectionChange={(key) => {
        if (key) onSelectionChange(key.toString());
      }}
      className={className}
      items={data?.states || []}
    >
      {(state) => (
        <AutocompleteItem key={state.id.toString()} textValue={state.name}>
          {state.name}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
};

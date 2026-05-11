import { Select, SelectItem } from "@heroui/react";
import { useStates } from "@/shared/hooks/useLocations";

interface StateSelectorProps {
  selectedKey?: string;
  onSelectionChange: (stateId: string, stateName: string) => void;
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
  const states = data?.states || [];

  return (
    <Select
      label={label}
      placeholder={isLoading ? "Cargando estados..." : placeholder}
      variant="bordered"
      labelPlacement="outside"
      isLoading={isLoading}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onSelectionChange={(keys) => {
        const id = Array.from(keys)[0] as string;
        const state = states.find((s) => s.id.toString() === id);
        if (id && state) {
          onSelectionChange(id, state.name);
        }
      }}
      className={className}
    >
      {states.map((state) => (
        <SelectItem key={state.id.toString()} textValue={state.name}>
          {state.name}
        </SelectItem>
      ))}
    </Select>
  );
};

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { Profile } from "./types";

interface ProfileModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  selectedProfile: Profile | null;
  formState: Partial<Profile>;
  setFormState: (state: Partial<Profile>) => void;
  onSave: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ProfileModal({
  isOpen,
  onOpenChange,
  selectedProfile,
  formState,
  setFormState,
  onSave,
  onClose,
  isLoading,
}: ProfileModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(internalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {selectedProfile ? "Editar Perfil" : "Crear Nuevo Perfil"}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  placeholder="Ej. Juan Pérez"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.fullName || ""}
                  onValueChange={(v) => setFormState({ ...formState, fullName: v })}
                />
                <Input
                  label="RFC"
                  placeholder="ABCJ123456XXX"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.rfc || ""}
                  onValueChange={(v) => setFormState({ ...formState, rfc: v })}
                />
                <Input
                  label="CURP"
                  placeholder="ABCD123456HXXXXX01"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.curp || ""}
                  onValueChange={(v) => setFormState({ ...formState, curp: v })}
                />
                <Input
                  label="NSS"
                  placeholder="1234567890"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.nss || ""}
                  onValueChange={(v) => setFormState({ ...formState, nss: v })}
                />
                <Input
                  label="Teléfono Personal"
                  placeholder="555-0000"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.personalPhone || ""}
                  onValueChange={(v) =>
                    setFormState({ ...formState, personalPhone: v })
                  }
                />
                <Input
                  label="Teléfono de Emergencia"
                  placeholder="555-1111"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.emergencyPhone || ""}
                  onValueChange={(v) =>
                    setFormState({ ...formState, emergencyPhone: v })
                  }
                />
                <Input
                  label="Tipo de Sangre / Alergias"
                  placeholder="O+ / Ninguna"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.bloodType || ""}
                  onValueChange={(v) => setFormState({ ...formState, bloodType: v })}
                />
                <Input
                  type="date"
                  label="Fecha de Ingreso"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.hireDate || ""}
                  onValueChange={(v) => setFormState({ ...formState, hireDate: v })}
                />
                <Input
                  label="Puesto"
                  placeholder="Ej. Vendedor"
                  variant="bordered"
                  labelPlacement="outside"
                  value={formState.position || ""}
                  onValueChange={(v) => setFormState({ ...formState, position: v })}
                />
                <Input
                  type="number"
                  label="Sueldo Base"
                  placeholder="0.00"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">$</span>
                    </div>
                  }
                  value={formState.baseSalary?.toString() || ""}
                  onValueChange={(v) =>
                    setFormState({ ...formState, baseSalary: parseFloat(v) || 0 })
                  }
                />
                <Select
                  label="Estado"
                  variant="bordered"
                  labelPlacement="outside"
                  selectedKeys={new Set(formState.status ? [formState.status] : ["Activo"])}
                  onSelectionChange={(v) => {
                    const status = Array.from(v)[0] as "Activo" | "Inactivo";
                    if (status) setFormState({ ...formState, status });
                  }}
                >
                  <SelectItem key="Activo" textValue="Activo">
                    Activo
                  </SelectItem>
                  <SelectItem key="Inactivo" textValue="Inactivo">
                    Inactivo
                  </SelectItem>
                </Select>
                <div className="flex items-center gap-2 mt-4">
                  <Switch
                    isSelected={formState.isEmployee ?? true}
                    onValueChange={(v) => setFormState({ ...formState, isEmployee: v })}
                    classNames={{
                      label: "text-small text-default-500",
                    }}
                  >
                    Empleado
                  </Switch>
                </div>

                <div className="col-span-1 md:col-span-2 mt-4">
                  <div className="flex flex-col gap-1 mb-4">
                    <p className="text-sm font-bold uppercase tracking-wider text-primary">Horario Laboral</p>
                    <p className="text-xs text-default-500">Configura el horario de entrada, salida y días permitidos</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="time"
                      label="Hora de Entrada"
                      variant="bordered"
                      labelPlacement="outside"
                      value={formState.workStart || ""}
                      onValueChange={(v) => setFormState({ ...formState, workStart: v })}
                    />
                    <Input
                      type="time"
                      label="Hora de Salida"
                      variant="bordered"
                      labelPlacement="outside"
                      value={formState.workEnd || ""}
                      onValueChange={(v) => setFormState({ ...formState, workEnd: v })}
                    />
                    <Select
                      label="Días Laborales"
                      placeholder="Selecciona días"
                      variant="bordered"
                      labelPlacement="outside"
                      selectionMode="multiple"
                      selectedKeys={new Set(formState.workDays || [])}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys) as string[];
                        setFormState({ ...formState, workDays: val });
                      }}
                      className="col-span-1 md:col-span-2"
                    >
                      <SelectItem key="L" textValue="Lunes">Lunes</SelectItem>
                      <SelectItem key="M" textValue="Martes">Martes</SelectItem>
                      <SelectItem key="X" textValue="Miércoles">Miércoles</SelectItem>
                      <SelectItem key="J" textValue="Jueves">Jueves</SelectItem>
                      <SelectItem key="V" textValue="Viernes">Viernes</SelectItem>
                      <SelectItem key="S" textValue="Sábado">Sábado</SelectItem>
                      <SelectItem key="D" textValue="Domingo">Domingo</SelectItem>
                    </Select>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} isDisabled={isLoading}>
                Cancelar
              </Button>
              <Button color="primary" onPress={onSave} isLoading={isLoading}>
                {selectedProfile ? "Actualizar" : "Guardar"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

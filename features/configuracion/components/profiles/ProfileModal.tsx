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

const WEEK_DAYS = [
  { key: "L", label: "Lunes" },
  { key: "M", label: "Martes" },
  { key: "X", label: "Miércoles" },
  { key: "J", label: "Jueves" },
  { key: "V", label: "Viernes" },
  { key: "S", label: "Sábado" },
  { key: "D", label: "Domingo" },
];

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
  const schedule = formState.workSchedule && formState.workSchedule.length > 0
    ? formState.workSchedule
    : WEEK_DAYS.map((d) => ({
        day: d.key,
        start: formState.workStart || "08:00",
        end: formState.workEnd || "17:00",
        enabled: (formState.workDays || ["L", "M", "X", "J", "V"]).includes(d.key),
      }));

  const updateSchedule = (day: string, patch: Partial<{ start: string; end: string; enabled: boolean }>) => {
    const next = schedule.map((item) =>
      item.day === day ? { ...item, ...patch } : item
    );
    setFormState({
      ...formState,
      workSchedule: next,
      workDays: next.filter((i) => i.enabled).map((i) => i.day),
    });
  };

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
                <div className="col-span-1 md:col-span-2 mt-4">
                  <div className="flex flex-col gap-1 mb-4">
                    <p className="text-sm font-bold uppercase tracking-wider text-primary">Configuración Laboral</p>
                    <p className="text-xs text-default-500">Define si es empleado y su jornada semanal</p>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
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
                  {formState.isEmployee !== false && (
                    <div className="space-y-4">
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
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-default-500">
                          Horario por día
                        </p>
                        {WEEK_DAYS.map((day) => {
                          const dayConfig = schedule.find((s) => s.day === day.key)!;
                          return (
                            <div key={day.key} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-4">
                                <Switch
                                  size="sm"
                                  isSelected={dayConfig.enabled}
                                  onValueChange={(enabled) => updateSchedule(day.key, { enabled })}
                                >
                                  {day.label}
                                </Switch>
                              </div>
                              <Input
                                className="col-span-4"
                                type="time"
                                size="sm"
                                labelPlacement="outside"
                                value={dayConfig.start}
                                onValueChange={(start) => updateSchedule(day.key, { start })}
                                isDisabled={!dayConfig.enabled}
                              />
                              <Input
                                className="col-span-4"
                                type="time"
                                size="sm"
                                labelPlacement="outside"
                                value={dayConfig.end}
                                onValueChange={(end) => updateSchedule(day.key, { end })}
                                isDisabled={!dayConfig.enabled}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

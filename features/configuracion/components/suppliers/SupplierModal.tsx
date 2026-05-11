"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Divider,
  Tooltip,
} from "@heroui/react";
import {
  UserCircleIcon,
  BanknotesIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Supplier, BankAccount, Contact } from "./types";

interface SupplierModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedSupplier: Supplier | null;
  formState: Partial<Supplier>;
  setFormState: (state: Partial<Supplier>) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function SupplierModal({
  isOpen,
  onOpenChange,
  selectedSupplier,
  formState,
  setFormState,
  onSave,
  onClose,
  onDelete,
  isLoading,
}: SupplierModalProps) {
  const contacts = formState.contacts || [];
  const bankAccounts = formState.bankAccounts || [];

  // --- Contact Handlers ---
  const handleAddContact = () => {
    const newContact: Contact = { name: "", phone: "", email: "" };
    setFormState({
      ...formState,
      contacts: [...contacts, newContact],
    });
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    setFormState({
      ...formState,
      contacts: newContacts,
    });
  };

  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setFormState({
      ...formState,
      contacts: newContacts,
    });
  };

  // --- Bank Account Handlers ---
  const handleAddAccount = () => {
    const newAccount: BankAccount = { bankName: "", accountNumber: "", clabe: "" };
    setFormState({
      ...formState,
      bankAccounts: [...bankAccounts, newAccount],
    });
  };

  const handleRemoveAccount = (index: number) => {
    const newAccounts = bankAccounts.filter((_, i) => i !== index);
    setFormState({
      ...formState,
      bankAccounts: newAccounts,
    });
  };

  const handleAccountChange = (index: number, field: keyof BankAccount, value: string) => {
    const newAccounts = [...bankAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setFormState({
      ...formState,
      bankAccounts: newAccounts,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
      backdrop="blur"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeIn" },
          },
        },
      }}
    >
      <ModalContent>
        {(internalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {selectedSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
              <span className="text-tiny text-default-500 font-normal">
                {selectedSupplier ? "Actualiza los datos del proveedor seleccionado" : "Crea un nuevo registro de proveedor en el sistema"}
              </span>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6 py-2">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Razón Social / Nombre Comercial"
                    placeholder="Ej. Suministros Industriales"
                    variant="bordered"
                    labelPlacement="outside"
                    className="md:col-span-2"
                    value={formState.businessName || ""}
                    onValueChange={(v) => setFormState({ ...formState, businessName: v })}
                    isRequired
                  />
                  <Input
                    label="RFC"
                    placeholder="ABCJ123456XXX"
                    variant="bordered"
                    labelPlacement="outside"
                    value={formState.rfc || ""}
                    onValueChange={(v) => setFormState({ ...formState, rfc: v })}
                    isRequired
                  />
                  <Input
                    type="number"
                    label="Días de Crédito"
                    placeholder="30"
                    variant="bordered"
                    labelPlacement="outside"
                    value={formState.creditDays?.toString() || ""}
                    onValueChange={(v) => setFormState({ ...formState, creditDays: parseInt(v) || 0 })}
                  />
                </div>

                <Divider />
                
                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-small font-semibold flex items-center gap-2">
                      <UserCircleIcon className="size-4 text-primary" />
                      Contactos Principales
                    </h4>
                    <Button 
                      size="sm" 
                      variant="flat" 
                      color="primary" 
                      startContent={<PlusIcon className="size-4" />}
                      onPress={handleAddContact}
                    >
                      Añadir Contacto
                    </Button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-divider rounded-xl bg-default-50 text-default-400">
                      <UserCircleIcon className="size-8 mb-2 opacity-50" />
                      <p className="text-tiny">No hay contactos registrados</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contacts.map((contact, index) => (
                        <div key={index} className="relative p-4 rounded-xl border border-divider bg-content2/30 space-y-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-tiny font-bold text-primary uppercase tracking-wider">Contacto #{index + 1}</span>
                            <Tooltip content="Eliminar contacto" color="danger">
                              <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light" 
                                color="danger"
                                onPress={() => handleRemoveContact(index)}
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Nombre"
                              placeholder="Juan Manuel"
                              variant="bordered"
                              labelPlacement="outside"
                              value={contact.name}
                              onValueChange={(v) => handleContactChange(index, "name", v)}
                            />
                            <Input
                              label="Teléfono"
                              placeholder="555-0000"
                              variant="bordered"
                              labelPlacement="outside"
                              value={contact.phone}
                              onValueChange={(v) => handleContactChange(index, "phone", v)}
                            />
                            <Input
                              label="Correo"
                              placeholder="contacto@empresa.com"
                              variant="bordered"
                              labelPlacement="outside"
                              value={contact.email}
                              onValueChange={(v) => handleContactChange(index, "email", v)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Divider />

                {/* Bank Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-small font-semibold flex items-center gap-2">
                      <BanknotesIcon className="size-4 text-primary" />
                      Cuentas Bancarias
                    </h4>
                    <Button 
                      size="sm" 
                      variant="flat" 
                      color="primary" 
                      startContent={<PlusIcon className="size-4" />}
                      onPress={handleAddAccount}
                    >
                      Añadir Cuenta
                    </Button>
                  </div>
                  
                  {bankAccounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-divider rounded-xl bg-default-50 text-default-400">
                      <BanknotesIcon className="size-8 mb-2 opacity-50" />
                      <p className="text-tiny">No hay cuentas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bankAccounts.map((account, index) => (
                        <div key={index} className="relative p-4 rounded-xl border border-divider bg-content2/30 space-y-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-tiny font-bold text-primary uppercase tracking-wider">Cuenta #{index + 1}</span>
                            <Tooltip content="Eliminar cuenta" color="danger">
                              <Button 
                                isIconOnly 
                                size="sm" 
                                variant="light" 
                                color="danger"
                                onPress={() => handleRemoveAccount(index)}
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Banco"
                              placeholder="Ej. BBVA"
                              variant="bordered"
                              labelPlacement="outside"
                              value={account.bankName}
                              onValueChange={(v) => handleAccountChange(index, "bankName", v)}
                            />
                            <Input
                              label="Número de Cuenta"
                              placeholder="1234567890"
                              variant="bordered"
                              labelPlacement="outside"
                              value={account.accountNumber}
                              onValueChange={(v) => handleAccountChange(index, "accountNumber", v)}
                            />
                            <Input
                              label="CLABE"
                              placeholder="012345678901234567"
                              variant="bordered"
                              labelPlacement="outside"
                              value={account.clabe}
                              onValueChange={(v) => handleAccountChange(index, "clabe", v)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-divider py-4">
              <Button color="danger" variant="light" onPress={onClose} isDisabled={isLoading}>
                Cancelar
              </Button>
              {selectedSupplier && onDelete && (
                <Button 
                  color="danger" 
                  variant="flat" 
                  onPress={() => onDelete(selectedSupplier.id)}
                  isDisabled={isLoading}
                >
                  Eliminar
                </Button>
              )}
              <Button color="primary" onPress={onSave} isLoading={isLoading} className="font-semibold px-8 shadow-lg shadow-primary/30 ml-auto">
                {selectedSupplier ? "Actualizar" : "Guardar Proveedor"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

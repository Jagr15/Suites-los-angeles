"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useState, useEffect, useCallback } from "react";

export type ConfirmModalVariant = "default" | "danger" | "warning";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmModalVariant;
  /** Si true, el botón de confirmar muestra un loading (útil para acciones async). */
  isConfirming?: boolean;
  /** Si true, requiere que el usuario ingrese la contraseña de administrador. */
  requirePassword?: boolean;
  /** Contraseña de confirmación opcional; si no se define, no se valida por contraseña. */
  adminPassword?: string;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  isConfirming = false,
  requirePassword = false,
  adminPassword
}: ConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requirePassword && adminPassword && password !== adminPassword) {
      setError(true);
      return;
    }
    
    try {
      await onConfirm();
      onClose();
    } catch (e: any) {
      console.error("Error in confirmation:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isConfirming) {
      handleConfirm();
    }
  };

  const confirmColor = variant === "danger" ? "danger" : variant === "warning" ? "warning" : "primary";

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-default-600 mb-4">{description}</p>
          {requirePassword && (
            <div className="space-y-2">
              <Input
                label="Contraseña de Administrador"
                placeholder="Ingrese la contraseña"
                type="password"
                variant="bordered"
                value={password}
                onValueChange={(v) => {
                  setPassword(v);
                  if (error) setError(false);
                }}
                isInvalid={error}
                errorMessage={error ? "Contraseña incorrecta" : ""}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <p className="text-[10px] text-default-400 italic font-medium">
                Solo usuarios con rol de administrador pueden realizar esta acción.
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button color={confirmColor} onPress={handleConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

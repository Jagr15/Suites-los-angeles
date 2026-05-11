"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  addToast,
} from "@heroui/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CategoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id: string) => void;
}

export function CategoryModal({ isOpen, onOpenChange, onSuccess }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createCategory = useMutation(api.product_categories.functions.createCategory);

  useEffect(() => {
    if (isOpen) setName("");
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const id = await createCategory({ name: name.trim() });
      addToast({
        title: "Categoría creada",
        color: "success",
      });
      onSuccess?.(id);
      onOpenChange(false);
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Nueva Categoría</ModalHeader>
        <ModalBody>
          <Input
            label="Nombre de la categoría"
            placeholder="Ej. Abarrotes"
            value={name}
            onValueChange={setName}
            autoFocus
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
            Crear
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

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
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface SubcategoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  onSuccess?: (id: string) => void;
}

export function SubcategoryModal({ isOpen, onOpenChange, categoryId, onSuccess }: SubcategoryModalProps) {
  const [name, setName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const categories = useQuery(api.product_categories.functions.listCategories);
  const createSubcategory = useMutation(api.product_categories.functions.createSubcategory);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedCatId(categoryId || "");
    }
  }, [isOpen, categoryId]);

  const handleSubmit = async () => {
    if (!name.trim() || !selectedCatId) return;
    setIsLoading(true);
    try {
      const id = await createSubcategory({ 
        name: name.trim(), 
        categoryId: selectedCatId as Id<"product_categories"> 
      });
      addToast({
        title: "Subcategoría creada",
        color: "success",
      });
      onSuccess?.(id);
      onOpenChange(false);
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo crear la subcategoría.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>Nueva Subcategoría</ModalHeader>
        <ModalBody className="gap-4">
          <Select
            label="Categoría"
            placeholder="Selecciona categoría"
            selectedKeys={selectedCatId ? [selectedCatId] : []}
            onSelectionChange={(keys) => setSelectedCatId(Array.from(keys)[0] as string)}
            isDisabled={!!categoryId} // Si ya viene una, la bloqueamos
          >
            {(categories || []).map((cat) => (
              <SelectItem key={cat._id} textValue={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </Select>
          <Input
            label="Nombre de la subcategoría"
            placeholder="Ej. Aceites"
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

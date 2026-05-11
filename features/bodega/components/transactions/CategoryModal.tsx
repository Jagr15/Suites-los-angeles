import React, { useState } from "react";
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
import { Id } from "@/convex/_generated/dataModel";

interface CategoryModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  type: "ingreso" | "egreso";
  parentCategoryId?: Id<"bodega_categorias">;
  parentName?: string;
  categoryToEdit?: { _id: Id<"bodega_categorias">; name: string };
}

export function CategoryModal({
  isOpen,
  onOpenChange,
  type,
  parentCategoryId,
  parentName,
  categoryToEdit,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCategory = useMutation(api.bodega_transactions.mutations.createCategory);
  const updateCategory = useMutation(api.bodega_transactions.mutations.updateCategory);
  const removeCategory = useMutation(api.bodega_transactions.mutations.removeCategory);

  // Sync name when categoryToEdit changes
  React.useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
    } else {
      setName("");
    }
  }, [categoryToEdit]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (categoryToEdit) {
        await updateCategory({ id: categoryToEdit._id, name: name.trim() });
        addToast({ title: "Categoría actualizada", color: "success" });
      } else {
        await createCategory({
          name: name.trim(),
          type,
          parentCategoryId,
          isActive: true,
        });
        addToast({
          title: parentCategoryId ? "Subcategoría creada" : "Categoría creada",
          color: "success",
        });
      }
      setName("");
      onOpenChange();
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo guardar la categoría",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToEdit) return;
    if (!confirm("¿Estás seguro de desactivar esta categoría? No aparecerá en los nuevos registros.")) return;

    setIsSubmitting(true);
    try {
      await removeCategory({ id: categoryToEdit._id });
      addToast({ title: "Categoría desactivada", color: "success" });
      onOpenChange();
    } catch (error) {
      console.error(error);
      addToast({ title: "Error", color: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {categoryToEdit 
                ? `Editar ${parentCategoryId ? "Subcategoría" : "Categoría"}`
                : parentCategoryId 
                  ? `Nueva Subcategoría para "${parentName}"` 
                  : `Nueva Categoría de ${type === "ingreso" ? "Ingreso" : "Egreso"}`}
            </ModalHeader>
            <ModalBody>
              <Input
                label="Nombre"
                placeholder="Ej. Gasolina, Mantenimiento..."
                value={name}
                onValueChange={setName}
                variant="bordered"
              />
            </ModalBody>
            <ModalFooter className="justify-between">
              <div>
                {categoryToEdit && (
                  <Button color="danger" variant="light" onPress={handleDelete} isLoading={isSubmitting}>
                    Eliminar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="flat" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSave} 
                  isLoading={isSubmitting}
                  isDisabled={!name.trim()}
                >
                  {categoryToEdit ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

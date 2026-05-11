"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Tabs,
  Tab,
  Divider,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { productoSchema, type ProductoFormValues } from "@/shared/schemas";
import { PRODUCTO_STATUS } from "@/shared/types/producto";
import type { ProductoCreate } from "@/shared/types/producto";
import { Product } from "../hooks/use-products";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CategoryModal } from "./categories/CategoryModal";
import { SubcategoryModal } from "./categories/SubcategoryModal";

const LISTA_KEYS = [
  "lista1",
  "lista2",
  "lista3",
  "lista4",
  "lista5",
  "lista6",
  "lista7",
  "lista8",
  "lista9",
  "lista10",
  "lista11",
  "lista12",
  "lista13",
  "lista14",
  "lista15",
] as const;

const defaultValues: ProductoFormValues = {
  sku: "",
  codigo: "",
  producto: "",
  cantidadEmpaque: "1",
  categoria: "",
  subcategoria: "",
  status: "Activo",
  ...Object.fromEntries(LISTA_KEYS.map((k) => [k, ""])),
};

/** Convierte un Product a valores del formulario para edición. */
function productoToFormValues(p: Product): ProductoFormValues {
  return {
    sku: p.sku,
    codigo: p.codigo,
    producto: p.producto,
    cantidadEmpaque: p.cantidadEmpaque,
    categoria: (p as any).categoriaId ?? p.categoria,
    subcategoria: (p as any).subcategoriaId ?? p.subcategoria,
    status: p.status as "Activo" | "Inactivo",
    ...Object.fromEntries(
      LISTA_KEYS.map((k) => {
        const val = p[k] ?? "";
        // Quitamos el signo de pesos para que el input type="number" lo acepte
        const cleanVal = typeof val === "string" ? val.replace("$", "") : val;
        return [k, cleanVal];
      })
    ),
  };
}

type ProductoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Si se pasa, el modal está en modo edición. */
  producto?: Product | null;
  /** (datos, id si es edición) */
  onSubmit?: (data: ProductoCreate, editId?: string) => void;
  isReadOnly?: boolean;
};

/** Convierte valores del formulario (precios opcionales) a ProductoCreate (todos string). */
function toProductoCreate(data: ProductoFormValues): ProductoCreate {
  return {
    sku: data.sku,
    codigo: data.codigo,
    producto: data.producto,
    cantidadEmpaque: data.cantidadEmpaque,
    categoria: data.categoria,
    subcategoria: data.subcategoria,
    status: data.status,
    ...Object.fromEntries(
      LISTA_KEYS.map((k) => {
        const val = data[k] ?? "";
        // Agregamos el signo de pesos si no lo tiene
        const valWithSign = typeof val === "string" && val && !val.startsWith("$") ? `$${val}` : val;
        return [k, valWithSign];
      })
    ),
  } as ProductoCreate;
}

export function ProductoModal({ isOpen, onClose, producto, onSubmit, isReadOnly }: ProductoModalProps) {
  const isEdit = !!producto;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues,
  });

  const selectedCategoryId = watch("categoria");
  
  const categories = useQuery(api.product_categories.functions.listCategories);
  const subcategories = useQuery(api.product_categories.functions.listSubcategories, 
    selectedCategoryId && selectedCategoryId.length > 10 // Simple check if it looks like an ID
      ? { categoryId: selectedCategoryId as Id<"product_categories"> } 
      : {}
  );

  const { 
    isOpen: isCatOpen, 
    onOpen: onCatOpen, 
    onOpenChange: onCatOpenChange 
  } = useDisclosure();
  
  const { 
    isOpen: isSubOpen, 
    onOpen: onSubOpen, 
    onOpenChange: onSubOpenChange 
  } = useDisclosure();

  const handleAddCategory = () => {
    onCatOpen();
  };

  const handleAddSubcategory = () => {
    if (!selectedCategoryId) {
      addToast({
        title: "Selección requerida",
        description: "Selecciona una categoría primero.",
        color: "warning",
      });
      return;
    }
    onSubOpen();
  };

  useEffect(() => {
    if (!isOpen) return;
    reset(producto ? productoToFormValues(producto) : defaultValues);
  }, [isOpen, producto, reset]);

  const onFormSubmit = (data: ProductoFormValues) => {
    if (isReadOnly) return;
    onSubmit?.(toProductoCreate(data), producto?.id);
    reset(defaultValues);
    onClose();
  };

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const title = isReadOnly ? "Detalles del producto" : isEdit ? "Editar producto" : "Crear producto";

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} size="3xl" scrollBehavior="inside">
      <ModalContent className="overflow-hidden">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex min-h-0 flex-col">
          <ModalHeader className="shrink-0">{title}</ModalHeader>
          <ModalBody className="max-h-[70vh] shrink overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <Input
                    label="SKU"
                    placeholder="Ej. A0001"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.sku}
                    errorMessage={errors.sku?.message}
                    isReadOnly={isReadOnly}
                  />
                )}
              />
              <Controller
                name="codigo"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Código"
                    placeholder="Ej. 0004"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.codigo}
                    errorMessage={errors.codigo?.message}
                    isReadOnly={isReadOnly}
                  />
                )}
              />
              <Controller
                name="producto"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Producto"
                    placeholder="Nombre del producto"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="sm:col-span-2"
                    isInvalid={!!errors.producto}
                    errorMessage={errors.producto?.message}
                    isReadOnly={isReadOnly}
                  />
                )}
              />
              <Controller
                name="cantidadEmpaque"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Cantidad por empaque"
                    placeholder="1"
                    type="number"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    isInvalid={!!errors.cantidadEmpaque}
                    errorMessage={errors.cantidadEmpaque?.message}
                    isReadOnly={isReadOnly}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Status"
                    selectedKeys={field.value ? [field.value] : []}
                    onSelectionChange={(s) => field.onChange(Array.from(s)[0] ?? "Activo")}
                    onBlur={field.onBlur}
                    isDisabled={isReadOnly}
                  >
                    {PRODUCTO_STATUS.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                )}
              />
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <div className="flex items-end gap-2">
                    <Select
                      label="Categoría"
                      placeholder="Selecciona categoría"
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        field.onChange(val);
                        setValue("subcategoria", ""); // Reset subcategory when category changes
                      }}
                      onBlur={field.onBlur}
                      isInvalid={!!errors.categoria}
                      errorMessage={errors.categoria?.message}
                      isDisabled={isReadOnly}
                      className="flex-1"
                    >
                      {(categories || []).map((cat) => (
                        <SelectItem key={cat._id} textValue={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </Select>
                    {!isReadOnly && (
                      <Button isIconOnly size="md" variant="flat" onPress={handleAddCategory} className="mb-1">
                        <PlusIcon className="size-5" />
                      </Button>
                    )}
                  </div>
                )}
              />
              <Controller
                name="subcategoria"
                control={control}
                render={({ field }) => (
                  <div className="flex items-end gap-2">
                    <Select
                      label="Subcategoría"
                      placeholder="Selecciona subcategoría"
                      selectedKeys={field.value ? [field.value] : []}
                      onSelectionChange={(keys) => field.onChange(Array.from(keys)[0] as string)}
                      onBlur={field.onBlur}
                      isInvalid={!!errors.subcategoria}
                      errorMessage={errors.subcategoria?.message}
                      isDisabled={isReadOnly || !selectedCategoryId}
                      className="flex-1"
                    >
                      {(subcategories || []).map((sub) => (
                        <SelectItem key={sub._id} textValue={sub.name}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </Select>
                    {!isReadOnly && (
                      <Button isIconOnly size="md" variant="flat" onPress={handleAddSubcategory} className="mb-1">
                        <PlusIcon className="size-5" />
                      </Button>
                    )}
                  </div>
                )}
              />
            </div>
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1 px-1">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">Gestión de Precios</p>
                <p className="text-xs text-default-500 font-medium">Define los costos y precios de venta del producto</p>
              </div>
              
              <Divider className="my-1" />

              <Tabs 
                aria-label="Categorías de precios" 
                color="primary" 
                variant="underlined"
                classNames={{
                  tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-0 h-12",
                  tabContent: "group-data-[selected=true]:text-primary font-bold text-default-500 uppercase text-xs tracking-widest"
                }}
              >
                <Tab key="costo" title="Costo">
                  <div className="grid gap-4 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {LISTA_KEYS.slice(0, 5).map((key, i) => (
                      <Controller
                        key={key}
                        name={key}
                        control={control}
                        render={({ field }) => (
                          <Input
                            label={`Costo ${i + 1}`}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            variant="bordered"
                            startContent={<span className="text-default-400 font-medium">$</span>}
                            isReadOnly={isReadOnly}
                          />
                        )}
                      />
                    ))}
                  </div>
                </Tab>
                <Tab key="mayoreo" title="Mayoreo">
                  <div className="grid gap-4 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {LISTA_KEYS.slice(5, 10).map((key, i) => (
                      <Controller
                        key={key}
                        name={key}
                        control={control}
                        render={({ field }) => (
                          <Input
                            label={`Mayoreo ${i + 1}`}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            variant="bordered"
                            startContent={<span className="text-default-400 font-medium">$</span>}
                            isReadOnly={isReadOnly}
                          />
                        )}
                      />
                    ))}
                  </div>
                </Tab>
                <Tab key="venta" title="Venta">
                  <div className="grid gap-4 pt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {LISTA_KEYS.slice(10, 15).map((key, i) => (
                      <Controller
                        key={key}
                        name={key}
                        control={control}
                        render={({ field }) => (
                          <Input
                            label={`Precio Venta ${i + 1}`}
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            variant="bordered"
                            startContent={<span className="text-default-400 font-medium">$</span>}
                            isReadOnly={isReadOnly}
                          />
                        )}
                      />
                    ))}
                  </div>
                </Tab>
              </Tabs>
            </div>
          </ModalBody>
          <ModalFooter className="shrink-0 flex-wrap gap-2">
            <Button type="button" variant="light" onPress={handleClose}>
              {isReadOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!isReadOnly && (
              <Button
                color="primary"
                type="submit"
                startContent={isEdit ? <PencilSquareIcon className="size-5" /> : <PlusIcon className="size-5" />}
              >
                {isEdit ? "Guardar cambios" : "Crear producto"}
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>

      <CategoryModal 
        isOpen={isCatOpen} 
        onOpenChange={onCatOpenChange} 
        onSuccess={(id) => setValue("categoria", id)}
      />
      
      <SubcategoryModal 
        isOpen={isSubOpen} 
        onOpenChange={onSubOpenChange} 
        categoryId={selectedCategoryId}
        onSuccess={(id) => setValue("subcategoria", id)}
      />
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { productoSchema, type ProductoFormValues } from "@/shared/schemas";
import { PRODUCTO_STATUS } from "@/shared/types/producto";
import type { ProductoCreate } from "@/shared/types/producto";
import { Product } from "../hooks/use-products";
import { useMutation, useQuery } from "convex/react";
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

const COST_KEY = "lista1";
const COST_MIRROR_KEYS = ["lista1", "lista2", "lista3", "lista4", "lista5"] as const;
const SALE_KEY = "lista11";
const SALE_MIRROR_KEYS = ["lista11", "lista12", "lista13", "lista14", "lista15"] as const;

type ProductTierDraft = {
  id?: string;
  upperLimit: string;
  basePrice: string;
};

type ProductTierEditorProps = {
  productId?: string;
  initialRows: ProductTierDraft[];
  isReadOnly?: boolean;
};

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
  const product = p as Product & { categoriaId?: string; subcategoriaId?: string };
  return {
    sku: p.sku,
    codigo: p.codigo,
    producto: p.producto,
    cantidadEmpaque: p.cantidadEmpaque,
    categoria: product.categoriaId ?? p.categoria,
    subcategoria: product.subcategoriaId ?? p.subcategoria,
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
  const costValue = data[COST_KEY] ?? "";
  const saleValue = data[SALE_KEY] ?? "";

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
        const sourceValue = COST_MIRROR_KEYS.includes(k as typeof COST_MIRROR_KEYS[number])
          ? costValue
          : SALE_MIRROR_KEYS.includes(k as typeof SALE_MIRROR_KEYS[number])
            ? saleValue
            : data[k] ?? "";
        const val = sourceValue ?? "";
        // Agregamos el signo de pesos si no lo tiene
        const valWithSign = typeof val === "string" && val && !val.startsWith("$") ? `$${val}` : val;
        return [k, valWithSign];
      })
    ),
  } as ProductoCreate;
}

function ProductTierEditor({ productId, initialRows, isReadOnly }: ProductTierEditorProps) {
  const syncProductPriceRanges = useMutation(api.pricing.mutations.syncProductPriceRanges);
  const [tierRows, setTierRows] = useState<ProductTierDraft[]>(initialRows);

  const hasTierChanges = JSON.stringify(tierRows) !== JSON.stringify(initialRows);

  const handleTierChange = (index: number, field: keyof ProductTierDraft, value: string) => {
    setTierRows((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const handleAddTier = () => {
    setTierRows((prev) => [...prev, { upperLimit: "", basePrice: "" }]);
  };

  const handleRemoveTier = (index: number) => {
    setTierRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSaveTiers = async () => {
    if (!productId || isReadOnly) return;

    const normalizedRanges = tierRows.map((row) => ({
      id: row.id as Id<"pricingProductTiers"> | undefined,
      upperLimit: Number(row.upperLimit),
      basePrice: Number(row.basePrice),
    }));

    for (const range of normalizedRanges) {
      if (!Number.isFinite(range.upperLimit) || range.upperLimit <= 0) {
        addToast({
          title: "Validación",
          description: "Cada tope debe ser un número mayor a 0.",
          color: "warning",
        });
        return;
      }
      if (!Number.isFinite(range.basePrice) || range.basePrice < 0) {
        addToast({
          title: "Validación",
          description: "Cada precio debe ser un número igual o mayor a 0.",
          color: "warning",
        });
        return;
      }
    }

    const orderedRanges = [...normalizedRanges].sort((a, b) => a.upperLimit - b.upperLimit);
    for (let i = 1; i < orderedRanges.length; i++) {
      if (orderedRanges[i].upperLimit <= orderedRanges[i - 1].upperLimit) {
        addToast({
          title: "Validación",
          description: "Los topes deben ser ascendentes y sin duplicados.",
          color: "warning",
        });
        return;
      }
    }

    try {
      await syncProductPriceRanges({
        productId: productId as Id<"products">,
        ranges: orderedRanges,
      });
      addToast({
        title: "Rangos guardados",
        description: "Los rangos por cantidad se actualizaron correctamente.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron guardar los rangos.",
        color: "danger",
      });
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-default-200 bg-content1 p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">Rangos por cantidad</p>
          <p className="text-xs text-default-500 font-medium">
            Cada producto maneja sus propios topes y precios sin huecos entre tramos.
          </p>
        </div>
        {!isReadOnly && !!productId && (
          <Button color="primary" variant="flat" startContent={<PlusIcon className="size-4" />} onPress={handleAddTier}>
            Agregar rango
          </Button>
        )}
      </div>

      <Divider className="my-1" />

      {!productId ? (
        <div className="rounded-xl border border-default-200 bg-default-50 px-4 py-3 text-sm text-default-600">
          Guarda el producto primero para configurar sus rangos por cantidad.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-default-500 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto] md:gap-3">
            <span>Rango</span>
            <span>Precio</span>
            <span className="text-right">Acciones</span>
          </div>

          {tierRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-default-300 px-4 py-6 text-center text-sm text-default-500">
              No hay rangos configurados para este producto.
            </div>
          ) : (
            tierRows.map((row, index) => {
              const previousUpperLimit = index === 0 ? "0" : (tierRows[index - 1]?.upperLimit || "0");
              return (
                <div
                  key={row.id || `draft-${index}`}
                  className="grid grid-cols-1 gap-4 rounded-2xl border border-default-200 bg-default-50/70 p-4 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto] md:items-end md:p-5"
                >
                  <div className="space-y-2 min-w-0">
                    <p className="text-xs font-medium text-default-500">
                      {index === 0 ? `0 a ${row.upperLimit || "..."}` : `Más de ${previousUpperLimit} a ${row.upperLimit || "..."}`}
                    </p>
                    <Input
                      label="Rango máximo"
                      placeholder="Ej. 10 o 0.5"
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.upperLimit}
                      onValueChange={(value) => handleTierChange(index, "upperLimit", value)}
                      isReadOnly={isReadOnly}
                      variant="bordered"
                      classNames={{
                        base: "w-full",
                        inputWrapper: "min-h-12 h-12 px-4",
                        input: "text-base font-medium tabular-nums",
                      }}
                    />
                  </div>
                  <Input
                    label="Precio"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.basePrice}
                    onValueChange={(value) => handleTierChange(index, "basePrice", value)}
                    startContent={<span className="text-default-400 font-medium">$</span>}
                    isReadOnly={isReadOnly}
                    variant="bordered"
                    classNames={{
                      base: "w-full",
                      inputWrapper: "min-h-12 h-12 px-4",
                      input: "text-right text-base font-medium tabular-nums",
                    }}
                  />
                  <div className="flex items-start justify-end md:items-end">
                    {!isReadOnly && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleRemoveTier(index)}
                        aria-label="Eliminar rango"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {!isReadOnly && (
            <div className="flex justify-end">
              <Button color="primary" onPress={() => void handleSaveTiers()} isDisabled={!hasTierChanges}>
                Guardar rangos
              </Button>
            </div>
          )}

          <p className="px-1 text-xs text-default-500">
            Los topes se ordenan al guardar. No se permiten negativos, duplicados ni precios menores a 0.
          </p>
        </div>
      )}
    </div>
  );
}

export function ProductoModal({ isOpen, onClose, producto, onSubmit, isReadOnly }: ProductoModalProps) {
  const isEdit = !!producto;
  const productTiersQuery = useQuery(api.pricing.queries.listProductTiers);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues,
  });

  const selectedCategoryId = useWatch({ control, name: "categoria" });
  
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
  const productTierRows = (productTiersQuery || [])
    .filter((tier) => String(tier.productId) === String(producto?.id || ""))
    .sort((a, b) => a.minQty - b.minQty);

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
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} size="4xl" scrollBehavior="inside">
      <ModalContent className="overflow-hidden">
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex min-h-0 flex-col">
          <ModalHeader className="shrink-0">{title}</ModalHeader>
          <ModalBody className="max-h-[75vh] shrink overflow-y-auto">
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
                  <div className="pt-4">
                    <div className="max-w-2xl">
                      <div className="rounded-2xl border border-default-200 bg-default-50/70 p-4 md:p-5">
                        <Controller
                          name={COST_KEY}
                          control={control}
                          render={({ field }) => (
                            <Input
                              label="Costo"
                              placeholder="0.00"
                              type="number"
                              step="0.01"
                              min="0"
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                              variant="bordered"
                              classNames={{
                                base: "w-full min-w-0",
                                inputWrapper: "min-h-12 h-12 px-4",
                                input: "text-end text-base font-medium tabular-nums",
                              }}
                              startContent={<span className="text-default-400 font-medium">$</span>}
                              isReadOnly={isReadOnly}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Tab>
                <Tab key="venta" title="Venta">
                  <div className="pt-4">
                    <div className="max-w-2xl">
                      <div className="rounded-2xl border border-default-200 bg-default-50/70 p-4 md:p-5">
                        <Controller
                          name={SALE_KEY}
                          control={control}
                          render={({ field }) => (
                            <Input
                              label="Venta"
                              placeholder="0.00"
                              type="number"
                              step="0.01"
                              min="0"
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                              variant="bordered"
                              classNames={{
                                base: "w-full min-w-0",
                                inputWrapper: "min-h-12 h-12 px-4",
                                input: "text-end text-base font-medium tabular-nums",
                              }}
                              startContent={<span className="text-default-400 font-medium">$</span>}
                              isReadOnly={isReadOnly}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </div>

            <ProductTierEditor
              key={`${producto?.id || "new"}:${productTierRows.map((tier) => `${tier._id}:${tier.maxQty ?? ""}:${tier.basePrice}`).join("|")}`}
              productId={producto?.id}
              initialRows={productTierRows.map((tier) => ({
                id: String(tier._id),
                upperLimit: typeof tier.maxQty === "number" ? String(tier.maxQty) : "",
                basePrice: String(tier.basePrice ?? 0),
              }))}
              isReadOnly={isReadOnly}
            />
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

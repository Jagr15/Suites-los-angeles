"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { addToast, Button } from "@heroui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ConfirmModal } from "@/shared/components";
import { DashboardHeader, DashboardBreadcrumb } from "@/features/dashboard/components";
import { ProductosHeader, ProductosToolbar, ProductosTable, ProductoModal } from "../components";
import { useProducts, type Product } from "../hooks/use-products";
import { useRoles } from "@/shared/hooks";
import type { ProductoCreate } from "@/shared/types/producto";
import * as XLSX from "xlsx";

type ProductoRow = Product;

function toProductoRow(data: ProductoCreate | Record<string, any>, id: string): ProductoRow {
  const base = {
    id,
    sku: data.sku || "",
    codigo: data.codigo || "",
    producto: data.producto || "",
    cantidadEmpaque: data.cantidadEmpaque || "1",
    categoria: data.categoria || "",
    subcategoria: data.subcategoria || "",
    status: data.status || "Activo",
  };

  const listas: Record<string, string> = {};
  for (let i = 1; i <= 15; i++) {
    const key = `lista${i}`;
    listas[key] = (data as any)[key] || "$0.00";
  }

  return { ...base, ...listas } as ProductoRow;
}

export function ProductosPage() {
  const { products, isLoading, addProduct, updateProduct, deleteProduct, bulkUpsert } = useProducts();
  const { hasPermission, isAdmin } = useRoles();
  const hideCostAndMargin = !isAdmin && hasPermission("products:hide_cost_and_margin");
  const canEditPrices = isAdmin || hasPermission("sales:allow_price_edit");
  const visibleTabs = hideCostAndMargin ? ["mayoreo", "venta"] : ["costo", "mayoreo", "venta"];
  const [activeTab, setActiveTab] = useState("venta");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<string, Partial<Record<string, string>>>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProductos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => 
      p.producto.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      p.codigo.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const displayProductos = useMemo(
    () => filteredProductos.map((p) => ({ ...p, ...pendingEdits[p.id] })),
    [filteredProductos, pendingEdits]
  );

  useEffect(() => {
    if (hideCostAndMargin && activeTab === "costo") {
      setActiveTab("mayoreo");
    }
  }, [activeTab, hideCostAndMargin]);

  const hasPendingEdits = Object.keys(pendingEdits).length > 0;

  const handlePriceChange = useCallback((productId: string, field: string, value: string) => {
    setPendingEdits((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  }, []);

  const handleGuardarCambios = useCallback(async () => {
    try {
      for (const [id, fields] of Object.entries(pendingEdits)) {
        const formattedFields = { ...fields };
        // Aseguramos que los precios tengan el signo $ antes de guardar
        Object.keys(formattedFields).forEach(key => {
          if (key.startsWith("lista")) {
            const val = formattedFields[key];
            if (val && !val.startsWith("$")) {
              formattedFields[key] = `$${val}`;
            }
          }
        });
        await updateProduct(id, formattedFields as any);
      }
      setPendingEdits({});
      addToast({
        title: "Cambios guardados",
        description: "Los precios se actualizaron correctamente.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudieron actualizar los precios.",
        color: "danger",
      });
    }
  }, [pendingEdits, updateProduct]);

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsViewOnly(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (producto: Product) => {
    setProductToEdit(producto);
    setIsViewOnly(false);
    setModalOpen(true);
  };

  const handleOpenView = (producto: Product) => {
    setProductToEdit(producto);
    setIsViewOnly(true);
    setModalOpen(true);
  };

  const handleSubmit = useCallback(
    async (data: ProductoCreate, editId?: string) => {
      try {
        if (editId) {
          await updateProduct(editId, data as any);
          addToast({
            title: "Producto actualizado",
            description: `Se actualizó "${data.producto}".`,
            color: "success",
          });
        } else {
          await addProduct(data as any);
          addToast({
            title: "Producto creado",
            description: `Se creó "${data.producto}".`,
            color: "success",
          });
        }
        setProductToEdit(null);
        setModalOpen(false);
      } catch (error) {
        addToast({
          title: "Error",
          description: "No se pudo guardar el producto.",
          color: "danger",
        });
      }
    },
    [addProduct, updateProduct]
  );

  const handleConfirmBorrar = useCallback(async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[productToDelete.id];
        return next;
      });
      addToast({
        title: "Producto eliminado",
        description: `Se eliminó "${productToDelete.producto}".`,
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        color: "danger",
      });
    }
    setProductToDelete(null);
  }, [productToDelete, deleteProduct]);

  const handleImportExcel = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const bstr = e.target?.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const itemsToUpsert = data.map((row: any) => {
        const mappedData: any = {
          sku: String(row["Sku"] ?? row["sku"] ?? ""),
          codigo: String(row["Código"] ?? row["codigo"] ?? ""),
          producto: String(row["Producto"] ?? row["producto"] ?? ""),
          cantidadEmpaque: String(row["Cantidad"] ?? row["cantidad"] ?? "1"),
          categoria: String(row["Categoría"] ?? row["categoria"] ?? ""),
          subcategoria: String(row["Subcategoría"] ?? row["subcategoria"] ?? ""),
          status: (row["Status"] ?? row["status"] ?? "Activo") as "Activo" | "Inactivo",
        };

        // Mapear precios
        for (let i = 1; i <= 15; i++) {
          const excelKey = `Precio ${i}`;
          const val = row[excelKey];
          if (val !== undefined) {
            mappedData[`lista${i}`] = typeof val === 'number' ? `$${val.toFixed(2)}` : String(val);
          } else {
            mappedData[`lista${i}`] = "$0.00";
          }
        }

        return mappedData;
      });

      try {
        const result = await bulkUpsert(itemsToUpsert);
        addToast({
          title: "Importación completada",
          description: `Se crearon ${result.created} y se actualizaron ${result.updated} productos.`,
          color: "success",
        });
      } catch (error) {
        addToast({
          title: "Error de importación",
          description: "Hubo un problema al procesar el archivo.",
          color: "danger",
        });
      }
    };
    reader.readAsBinaryString(file);
  }, [bulkUpsert]);

  return (
    <div className="flex flex-col">
      <DashboardHeader />
      <div className="space-y-4 p-4 md:p-5">
        <DashboardBreadcrumb module="Productos" submodule="Catálogo" />
        <ProductosHeader activeTab={activeTab} onTabChange={setActiveTab} visibleTabs={visibleTabs} />
        <ProductosToolbar 
          onAgregar={handleOpenCreate} 
          onImportExcel={handleImportExcel}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
        {hasPendingEdits && canEditPrices && (
          <div className="flex justify-end pt-1">
            <Button
              color="primary"
              startContent={<CheckIcon className="size-5" />}
              onPress={handleGuardarCambios}
            >
              Guardar cambios
            </Button>
          </div>
        )}
        <ProductosTable
          productos={displayProductos}
          onVer={handleOpenView}
          onEditar={handleOpenEdit}
          onBorrar={setProductToDelete}
          onPriceChange={handlePriceChange}
          activeTab={activeTab}
          canEditPrices={canEditPrices}
        />
      </div>
      <ProductoModal
        isOpen={isModalOpen}
        isReadOnly={isViewOnly}
        onClose={() => { setModalOpen(false); setProductToEdit(null); }}
        producto={productToEdit}
        onSubmit={handleSubmit}
      />
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmBorrar}
        title="¿Borrar producto?"
        description={
          productToDelete
            ? `Se eliminará "${productToDelete.producto}". Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        variant="danger"
        requirePassword={true}
      />
    </div>
  );
}

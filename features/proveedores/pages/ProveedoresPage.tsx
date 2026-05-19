"use client";

import { useState, useCallback, useMemo } from "react";
import { addToast, Button } from "@heroui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { ConfirmModal } from "@/shared/components";
import { DashboardHeader } from "@/features/dashboard/components";
import {
  ProveedoresHeader,
  ProveedoresToolbar,
  ComprasTable,
  CompraForm,
  PresupuestoCompras,
  EstadoCuentaView,
  EstadosDeCuentaCards,
} from "../components";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePurchases } from "../hooks/use-purchases";
import { Purchase } from "../hooks/use-purchases";
import { useRoles } from "@/shared/hooks";
import { mockPresupuestoCompras, type CompraRow, type EstadoCuentaRow } from "@/shared/mocks";
import * as XLSX from "xlsx";

type TabKey = "compras" | "presupuesto-compras" | "estados-de-cuenta";

export function ProveedoresPage() {
  const suppliers = useQuery(api.suppliers.queries.listWithMetrics);
  const { hasPermission, isAdmin } = useRoles();
  const canDeleteRecords = isAdmin || !hasPermission("records:restrict_delete");
  const [activeTab, setActiveTab] = useState<TabKey>("compras");
  const { purchases, isLoading: loadingPurchases, addPurchase, updatePurchase, deletePurchase } = usePurchases();

  const realEstadosDeCuenta = useMemo(() => {
    return (suppliers || []).map(s => ({
      id: s._id,
      proveedor: s.businessName,
      total: `$${(s.metrics?.outstandingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      fechaPago: "Próximo vencimiento",
      montoAPagar: `$${(s.metrics?.outstandingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    })) as EstadoCuentaRow[];
  }, [suppliers]);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [compraToEdit, setCompraToEdit] = useState<Purchase | null>(null);
  const [compraToDelete, setCompraToDelete] = useState<Purchase | null>(null);
  const [supplierIdForEstadoCuenta, setSupplierIdForEstadoCuenta] = useState<string | null>(null);
  const [selectedEstadoCuentaDetails, setSelectedEstadoCuentaDetails] = useState<EstadoCuentaRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const displayCompras = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return purchases;
    return purchases.filter(c => 
      (c.supplierName || "").toLowerCase().includes(q) || 
      (c.folio && c.folio.toLowerCase().includes(q))
    );
  }, [purchases, searchQuery]);

  const handleConfirmBorrar = useCallback(async () => {
    if (!compraToDelete) return;
    await deletePurchase(compraToDelete.id);
    addToast({
      title: "Compra eliminada",
      description: `Se eliminó el registro "${compraToDelete.folio}".`,
      color: "success",
    });
    setCompraToDelete(null);
  }, [compraToDelete, deletePurchase]);

  const handleAgregar = useCallback(() => {
    setCompraToEdit(null);
    setIsFormVisible(true);
  }, []);

  const handleEditar = useCallback((item: Purchase) => {
    setCompraToEdit({
      ...item,
      proveedor: item.supplierId,
      almacen: item.bodegaId,
      fecha: item.date,
      recepcion: item.receptionStatus,
      monto: item.totalAmount.toString(),
      nota: item.notes || "",
      productos: (item.items || []).map((p: any) => ({
        id: p.productId,
        sku: p.sku || "",
        descripcion: p.name || "Producto",
        categoria: p.category || "",
        subcategoria: "",
        cantidad: p.quantity,
        costo: p.unitCost,
        total: p.totalCost,
        stockAnterior: 0,
        stockNuevo: 0,
      })),
    } as any);
    setIsFormVisible(true);
  }, []);

  const handleSelectPresupuesto = useCallback((item: any) => {
    setCompraToEdit({
      id: "",
      folio: `PRE-${item.id}`,
      proveedor: item.proveedor,
      fecha: new Date().toISOString().split("T")[0],
      recepcion: "Completa",
      revision: "Revisar",
      status: "Pendiente",
      monto: item.monto.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      nota: `Presupuesto base: ${item.id}`,
      productos: item.productos || []
    } as any);
    setIsFormVisible(true);
  }, []);

  const handleSubmitCompra = useCallback(
    async (row: any, editId?: string) => {
      try {
        if (!row.proveedor) throw new Error("Selecciona un proveedor.");
        if (!row.almacen) throw new Error("Selecciona una bodega de destino.");
        if (!row.productos || row.productos.length === 0) throw new Error("Agrega al menos un producto a la compra.");

        const normalizedItems = (row.productos || []).map((p: any) => ({
          productId: p.productId || p.id,
          quantity: Number(p.cantidad),
          unitCost: Number(p.costo),
          totalCost: Number(p.total),
        }));
        const canEditPayment = isAdmin || hasPermission("purchases:edit_payment_status");
        const canEditReception = isAdmin || hasPermission("purchases:edit_reception_status");
        const canEditDate = isAdmin || hasPermission("purchases:edit_date");

        if (editId) {
          const previous = purchases.find((p) => p.id === editId);
          const nextStatus = canEditPayment ? (row.status as any) : (previous?.status as any);
          const nextReception = canEditReception ? (row.recepcion as any) : (previous?.receptionStatus as any);
          const nextDate = canEditDate ? row.fecha : (previous?.date || row.fecha);
          await updatePurchase(editId, {
            supplierId: row.proveedor,
            bodegaId: row.almacen,
            date: nextDate,
            totalAmount: typeof row.monto === 'number' ? row.monto : (parseFloat(row.monto?.toString().replace(/[$,]/g, "")) || 0),
            status: nextStatus,
            receptionStatus: nextReception,
            notes: row.nota,
            items: normalizedItems,
          });
          addToast({
            title: "Compra actualizada",
            description: `Registro de "${row.folio}" actualizado.`,
            color: "success",
          });
        } else {
          await addPurchase({
            supplierId: row.proveedor,
            bodegaId: row.almacen,
            date: row.fecha,
            totalAmount: typeof row.monto === 'number' ? row.monto : (parseFloat(row.monto?.toString().replace(/[$,]/g, "")) || 0),
            status: row.status as any,
            receptionStatus: row.recepcion as any,
            notes: row.nota,
            items: normalizedItems,
          });
          addToast({
            title: "Compra registrada",
            description: `Se registró la compra "${row.folio}".`,
            color: "success",
          });
        }
        setCompraToEdit(null);
        setIsFormVisible(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo guardar la compra.";
        addToast({
          title: "Error",
          description: message,
          color: "danger",
        });
      }
    },
    [addPurchase, hasPermission, isAdmin, purchases, updatePurchase]
  );

  const handleTabChange = useCallback((key: React.Key) => {
    setActiveTab(key as TabKey);
    if (key !== "estados-de-cuenta") setSupplierIdForEstadoCuenta(null);
  }, []);

  const handleVerEstadoCuenta = useCallback((item: Purchase) => {
    setSupplierIdForEstadoCuenta(item.supplierId);
    setActiveTab("estados-de-cuenta");
    // Buscar automáticamente los detalles para abrir la vista
    const details = realEstadosDeCuenta.find(m => m.id === item.supplierId);
    if (details) {
      setSelectedEstadoCuentaDetails(details);
    }
  }, [realEstadosDeCuenta]);

  const handleSelectEstadoCuenta = useCallback((item: EstadoCuentaRow) => {
    setSelectedEstadoCuentaDetails(item);
  }, []);

  const handleProviderChange = useCallback((supplierId: string) => {
    const details = realEstadosDeCuenta.find(m => m.id === supplierId);
    if (details) {
      setSelectedEstadoCuentaDetails(details);
    } else {
      setSelectedEstadoCuentaDetails(null);
    }
  }, [realEstadosDeCuenta]);

  const handleBackFromEstadoCuenta = useCallback(() => {
    setSelectedEstadoCuentaDetails(null);
  }, []);
  
  const handleImportExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target?.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const importedCompras = data.map((row: any, index: number) => {
        const folio = String(row["NO. COMPRA"] ?? row["folio"] ?? row["N. Compra"] ?? "");
        const proveedor = String(row["PROVEEDOR"] ?? row["proveedor"] ?? "");
        const fecha = String(row["FECHA"] ?? row["fecha"] ?? "");
        const recepcion = String(row["RECEPCIÓN"] ?? row["recepción"] ?? row["recepcion"] ?? "Completa");
        const status = String(row["ESTADO"] ?? row["estado"] ?? row["status"] ?? "Recibido");
        let monto = String(row["MONTO"] ?? row["monto"] ?? "0");

        // Normalizar monto
        monto = monto.replace(/[$,]/g, "");
        const montoNum = parseFloat(monto);
        if (!isNaN(montoNum)) {
          monto = montoNum.toLocaleString("en-US", { minimumFractionDigits: 2 });
        }

        return {
          id: String(Date.now() + index),
          folio,
          proveedorId: "1", // ID genérico por defecto
          proveedor,
          fecha,
          recepcion: (recepcion === "Faltante" || recepcion === "Completa") ? recepcion : "Completa",
          revision: "Revisar",
          status,
          monto,
          productos: [],
        } as CompraRow;
      });

      // importedCompras could be saved to Convex here in a loop
      addToast({
        title: "Importación completada",
        description: `Se procesaron ${importedCompras.length} registros. (Persistencia en Convex pendiente de implementación masiva)`,
        color: "success",
      });
    };
    reader.readAsBinaryString(file);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-default-50/50">
      <DashboardHeader />
      <div className="p-4 md:p-5 space-y-4">
        {!isFormVisible && !selectedEstadoCuentaDetails && (
          <ProveedoresHeader
            selectedKey={activeTab}
            onSelectionChange={handleTabChange}
          />
        )}

        {isFormVisible ? (
          <CompraForm
            compra={compraToEdit as any}
            onSubmit={handleSubmitCompra}
            canEditPaymentStatus={isAdmin || hasPermission("purchases:edit_payment_status")}
            canEditReceptionStatus={isAdmin || hasPermission("purchases:edit_reception_status")}
            canEditDate={isAdmin || hasPermission("purchases:edit_date")}
            onCancel={() => {
              setIsFormVisible(false);
              setCompraToEdit(null);
            }}
          />
        ) : (
          <>
            {activeTab === "compras" && (
              <div className="space-y-4">
                <ProveedoresToolbar
                  onAgregar={() => setIsFormVisible(true)}
                  onImportExcel={handleImportExcel}
                  agregarLabel="Nueva compra"
                  buscarPlaceholder="Buscar compra..."
                  searchValue={searchQuery}
                  onSearchChange={setSearchQuery}
                />
                
                <ComprasTable
                  compras={displayCompras}
                  onVerEstadoCuenta={handleVerEstadoCuenta}
                  onEditar={handleEditar}
                  onBorrar={setCompraToDelete}
                  canDelete={canDeleteRecords}
                />
              </div>
            )}
            {activeTab === "estados-de-cuenta" && (
              <>
                {selectedEstadoCuentaDetails ? (
                  <EstadoCuentaView 
                    key={selectedEstadoCuentaDetails.id}
                    estadoCuenta={selectedEstadoCuentaDetails} 
                    onBack={handleBackFromEstadoCuenta} 
                    onProviderChange={handleProviderChange}
                  />
                ) : (
                  <EstadosDeCuentaCards
                    items={realEstadosDeCuenta}
                    supplierIdSeleccionado={supplierIdForEstadoCuenta}
                    onSelect={handleSelectEstadoCuenta}
                  />
                )}
              </>
            )}
            {activeTab === "presupuesto-compras" && (
              <PresupuestoCompras items={mockPresupuestoCompras} onSelect={handleSelectPresupuesto} />
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!compraToDelete}
        onClose={() => setCompraToDelete(null)}
        onConfirm={handleConfirmBorrar}
        title="¿Eliminar registro de compra?"
        description={
          compraToDelete
            ? `Se eliminará el registro "${compraToDelete.folio}" del proveedor ${compraToDelete.supplierName}. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Modal only kept for potential other uses, but primary view is now inline */}
      {/* <EstadoCuentaModal
        isOpen={!!selectedEstadoCuentaDetails}
        onClose={() => setSelectedEstadoCuentaDetails(null)}
        estadoCuenta={selectedEstadoCuentaDetails}
      /> */}
    </div>
  );
}

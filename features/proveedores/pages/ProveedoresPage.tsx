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
import { mockEstadosDeCuenta, mockPresupuestoCompras, type CompraRow, type EstadoCuentaRow } from "@/shared/mocks";
import * as XLSX from "xlsx";

type TabKey = "compras" | "presupuesto-compras" | "estados-de-cuenta";

export function ProveedoresPage() {
  const suppliers = useQuery(api.suppliers.queries.list);
  const [activeTab, setActiveTab] = useState<TabKey>("compras");
  const { purchases, isLoading: loadingPurchases, addPurchase, updatePurchase, deletePurchase } = usePurchases();

  const realEstadosDeCuenta = useMemo(() => {
    return (suppliers || []).map(s => ({
      id: s._id,
      proveedor: s.name || s.businessName,
      total: `$${(s.currentBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      fechaPago: "Próximo vencimiento",
      montoAPagar: `$${(s.currentBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` // Por ahora mostramos el total como pendiente
    })) as EstadoCuentaRow[];
  }, [suppliers]);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [compraToEdit, setCompraToEdit] = useState<Purchase | null>(null);
  const [compraToDelete, setCompraToDelete] = useState<Purchase | null>(null);
  const [proveedorParaEstadoCuenta, setProveedorParaEstadoCuenta] = useState<string | null>(null);
  const [selectedEstadoCuentaDetails, setSelectedEstadoCuentaDetails] = useState<EstadoCuentaRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const displayCompras = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return purchases;
    return purchases.filter(c => 
      c.supplierName.toLowerCase().includes(q) || 
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
    setCompraToEdit(item);
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
      console.log("📦 PURCHASE PAYLOAD:", { row, editId });
      try {
        if (editId) {
          await updatePurchase(editId, {
            supplierId: row.proveedor,
            bodegaId: row.almacen,
            folio: row.folio,
            date: row.fecha,
            totalAmount: typeof row.monto === 'number' ? row.monto : (parseFloat(row.monto?.toString().replace(/[$,]/g, "")) || 0),
            status: row.status as any,
            receptionStatus: row.recepcion as any,
            notes: row.nota,
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
            folio: row.folio,
            date: row.fecha,
            totalAmount: typeof row.monto === 'number' ? row.monto : (parseFloat(row.monto?.toString().replace(/[$,]/g, "")) || 0),
            status: row.status as any,
            receptionStatus: row.recepcion as any,
            notes: row.nota,
            items: row.productos?.map((p: any) => ({
              productId: p.id,
              quantity: p.cantidad,
              unitCost: p.costo,
              totalCost: p.total,
            })),
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
        addToast({
          title: "Error",
          description: "No se pudo guardar la compra.",
          color: "danger",
        });
      }
    },
    [addPurchase, updatePurchase]
  );

  const handleTabChange = useCallback((key: React.Key) => {
    setActiveTab(key as TabKey);
    if (key !== "estados-de-cuenta") setProveedorParaEstadoCuenta(null);
  }, []);

  const handleVerEstadoCuenta = useCallback((item: Purchase) => {
    setProveedorParaEstadoCuenta(item.supplierName);
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

  const handleProviderChange = useCallback((providerName: string) => {
    const details = realEstadosDeCuenta.find(m => m.proveedor === providerName);
    if (details) {
      setSelectedEstadoCuentaDetails(details);
    } else {
      // Mock details for other providers not in the initial mock list
      setSelectedEstadoCuentaDetails({
        id: providerName,
        proveedor: providerName,
        total: "$15,240.00",
        fechaPago: "25 de feb",
        montoAPagar: "$8,500.00"
      });
    }
  }, []);

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
      <div className="p-6 space-y-6">
        {!isFormVisible && !selectedEstadoCuentaDetails && (
          <ProveedoresHeader
            selectedKey={activeTab}
            onSelectionChange={handleTabChange}
          />
        )}

        {isFormVisible ? (
          <CompraForm
            compra={compraToEdit}
            onSubmit={handleSubmitCompra}
            onCancel={() => {
              setIsFormVisible(false);
              setCompraToEdit(null);
            }}
          />
        ) : (
          <>
            {activeTab === "compras" && (
              <div className="space-y-6">
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
                />
              </div>
            )}
            {activeTab === "estados-de-cuenta" && (
              <>
                {selectedEstadoCuentaDetails ? (
                  <EstadoCuentaView 
                    estadoCuenta={selectedEstadoCuentaDetails} 
                    onBack={handleBackFromEstadoCuenta} 
                    onProviderChange={handleProviderChange}
                  />
                ) : (
                  <EstadosDeCuentaCards
                    items={realEstadosDeCuenta}
                    proveedorSeleccionado={proveedorParaEstadoCuenta}
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

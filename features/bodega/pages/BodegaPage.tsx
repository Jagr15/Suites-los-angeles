"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { addToast, Button, useDisclosure } from "@heroui/react";
import { ConfirmModal } from "@/shared/components";
import { useRoles } from "@/shared/hooks";
import { BodegaHeader, BodegaToolbar, BodegaTable, BodegaEntradasTable, BodegaSalidaForm, BodegaEntradaForm, BodegaInventory, BodegaNominas, BodegaSalidas, BodegaGastos, BodegaIngresos, BodegaDeudas, BodegaInventoryForm, BodegaIngresoForm, BodegaGastoForm } from "../components";
import { BodegaModal as BodegaCatalogModal } from "@/features/configuracion/components/bodegas/BodegaModal";
import { mockNominas, mockSalidas, mockGastos, mockIngresos, type NominaRow, type SalidaRow, type GastoRow, type IngresoRow } from "@/shared/mocks";
import { PlusIcon } from "@heroicons/react/24/outline";

type TabKey = "entradas" | "salidas" | "inventario" | "ingresos" | "egresos" | "nominas" | "catalogo";

const TIPO_LABELS: Record<TabKey, string> = {
  entradas: "Entradas",
  salidas: "Salidas",
  inventario: "Inventario",
  ingresos: "Ingresos",
  egresos: "Egresos",
  nominas: "Nóminas",
  catalogo: "Catálogo",
};

export function BodegaPage() {
  const [view, setView] = useState<"list" | "form">("list");
  const [activeTab, setActiveTab] = useState<TabKey>("entradas");
  // Convex Data
  const bodegas = useQuery(api.bodegas.queries.list);
  const purchases = useQuery(api.purchases.queries.list);
  const suppliers = useQuery(api.suppliers.queries.list);
  const products = useQuery(api.products.queries.list);
  const salidas = useQuery(api.salidas.queries.list);
  const createSalida = useMutation(api.salidas.mutations.create);
  const updateSalida = useMutation(api.salidas.mutations.update);
  const removeSalida = useMutation(api.salidas.mutations.remove);
  const updateReceptionStatus = useMutation(api.purchases.mutations.updateReceptionStatus);
  const { hasPermission, isAdmin, isSuperAdmin } = useRoles();
  const canViewInventoryTab = isAdmin || hasPermission("warehouse:allow_inventory_tab");
  const canAdjustInventory = isAdmin || hasPermission("inventory:allow_manual_adjustments");
  const canAssignRouteResponsible =
    isAdmin ||
    hasPermission("warehouse_outputs:allow_edit_assigned_outputs") ||
    hasPermission("warehouse_outputs:assign_route_responsible");
  const canViewPayroll = isAdmin || hasPermission("payroll:allow_view");
  const canDeleteRecords = isAdmin || !hasPermission("records:restrict_delete");
  const canShowDailyTotals = isAdmin || hasPermission("warehouse_money:show_daily_totals");
  const canCreateIngresos = isAdmin || hasPermission("warehouse_money:allow_income");
  const canCreateEgresos = isAdmin || hasPermission("warehouse_money:allow_expense");
  const visibleTabs = useMemo(() => {
    const base: TabKey[] = ["entradas", "salidas", "ingresos", "egresos", "catalogo"];
    if (canViewInventoryTab) base.splice(2, 0, "inventario");
    if (canViewPayroll) base.push("nominas");
    return base;
  }, [canViewInventoryTab, canViewPayroll]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] || "entradas");
      setView("list");
    }
  }, [activeTab, visibleTabs]);

  const [nominas] = useState<NominaRow[]>(() => mockNominas);
  const [gastos] = useState<GastoRow[]>(() => mockGastos);
  const [ingresos] = useState<IngresoRow[]>(() => mockIngresos);
  
  // Convex Bodegas
  const [selectedBodega, setSelectedBodega] = useState<any>(null);
  const { isOpen: isBodegaModalOpen, onOpen: onOpenBodegaModal, onClose: onCloseBodegaModal } = useDisclosure();
  const [bodegaToDeleteRecord, setBodegaToDeleteRecord] = useState<any>(null);
  
  const createBodega = useMutation(api.bodegas.mutations.create);
  const updateBodega = useMutation(api.bodegas.mutations.update);
  const removeBodega = useMutation(api.bodegas.mutations.remove);

  const createPurchase = useMutation(api.purchases.mutations.create);
  const updatePurchase = useMutation(api.purchases.mutations.update);
  const removePurchase = useMutation(api.purchases.mutations.remove);

  const adjustInventory = useMutation(api.inventory.mutations.adjust);

  const [bodegaToEdit, setBodegaToEdit] = useState<any>(null);
  const [salidaToEdit, setSalidaToEdit] = useState<any | null>(null);
  const [bodegaToDelete, setBodegaToDelete] = useState<any>(null);
  const [salidaToDelete, setSalidaToDelete] = useState<SalidaRow | null>(null);
  const [selectedNomina, setSelectedNomina] = useState<NominaRow | null>(null);
  const [selectedCarga, setSelectedCarga] = useState<any>(null);

  const handleAgregar = useCallback(() => {
    setBodegaToEdit(null);
    setView("form");
  }, []);

  const handleVer = useCallback((item: any) => {
    setSelectedCarga(item);
    setActiveTab("inventario");
  }, []);

  const handleEditar = useCallback((item: any) => {
    setBodegaToEdit(item);
    setView("form");
  }, []);

  const handleSubmitEntrada = useCallback(
    async (values: any, editId?: string) => {
      try {
        const cleanItems = (values.items || []).map((it: any) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost,
          totalCost: it.totalCost,
        }));

        // Limpiar el objeto principal para enviar solo lo que el schema espera
        const { supplierId, bodegaId, date, totalAmount, status, receptionStatus, notes } = values;
        const existing = editId ? (purchases || []).find((p: any) => p._id === editId) : null;
        const canEditPayment = isAdmin || hasPermission("purchases:edit_payment_status");
        const canEditReception = isAdmin || hasPermission("purchases:edit_reception_status");
        const canEditDate = isAdmin || hasPermission("purchases:edit_date");
        const cleanValues = {
          supplierId,
          bodegaId,
          date: editId ? (canEditDate ? date : existing?.date) : date,
          totalAmount,
          status: editId ? (canEditPayment ? status : existing?.status) : status,
          receptionStatus: editId ? (canEditReception ? receptionStatus : existing?.receptionStatus) : receptionStatus,
          notes,
          items: cleanItems
        };

        if (editId) {
          await updatePurchase({ id: editId as any, ...cleanValues });
          addToast({ title: "Entrada actualizada", color: "success" });
        } else {
          await createPurchase(cleanValues);
          addToast({ title: "Entrada registrada", color: "success" });
        }
        setBodegaToEdit(null);
        setView("list");
      } catch (error) {
        console.error("Error en handleSubmitEntrada:", error);
        addToast({ title: "Error", description: "No se pudo guardar la entrada", color: "danger" });
      }
    },
    [createPurchase, hasPermission, isAdmin, purchases, updatePurchase]
  );

  const handleSubmitSalida = useCallback(
    async (values: any, editId?: string) => {
      try {
        const cleanItems = (values.productos || []).map((it: any) => ({
          productId: it.productId || it.id,
          quantity: Number(it.cantidad),
          price: Number(it.precio),
          subtotal: Number(it.cantidad) * Number(it.precio),
        }));

        const totalAmount = cleanItems.reduce((acc: number, it: any) => acc + it.subtotal, 0);

        const currentSalida = editId
          ? (salidas || []).find((s: any) => String(s._id || s.id) === String(editId))
          : null;
        const payload = {
          numeroSalida: isSuperAdmin && editId
            ? values.numeroCarga
            : (currentSalida?.numeroSalida || values.numeroCarga || "Se genera al guardar"),
          fecha: values.fecha,
          status: values.status,
          responsable: values.responsable,
          tipoEntrega: values.tipoEntrega,
          almacen: values.almacen || "",
          agente: values.agente || values.responsable || "",
          clienteDireccion: values.clienteDireccion || "",
          ruta: values.ruta || "",
          destino: values.destino || "",
          totalAmount,
          tipo: values.tipo || "carga",
          items: cleanItems,
        };

        if (editId) {
          await updateSalida({ id: editId as any, ...payload });
          addToast({ title: "Salida actualizada", color: "success" });
        } else {
          await createSalida(payload);
          addToast({ title: "Salida creada", color: "success" });
        }
        setSalidaToEdit(null);
        setView("list");
      } catch (error) {
        console.error("Error al procesar salida:", error);
        addToast({ title: "Error", description: String(error), color: "danger" });
      }
    },
    [createSalida, isSuperAdmin, salidas, updateSalida]
  );

  const handleSubmitInventoryAdjustment = useCallback(
    async (values: any) => {
      if (!canAdjustInventory) {
        addToast({ title: "Sin permiso", description: "No puedes realizar ajustes manuales.", color: "warning" });
        return;
      }
      try {
        await adjustInventory({
          bodegaId: values.bodegaId,
          items: values.items.map((it: any) => ({
            productId: it.productId,
            quantity: it.quantity,
            newStock: it.newStock,
            reason: it.reason,
          })),
          notes: values.notes,
        });
        addToast({ title: "Inventario ajustado", color: "success" });
        setView("list");
      } catch (error) {
        console.error(error);
        addToast({ title: "Error", description: "No se pudo ajustar el inventario", color: "danger" });
      }
    },
    [adjustInventory, canAdjustInventory]
  );

  const handleConfirmBorrar = useCallback(async () => {
    if (!bodegaToDelete) return;
    try {
      await removePurchase({ id: (bodegaToDelete as any)._id });
      addToast({
        title: "Entrada eliminada",
        color: "success",
      });
    } catch (error) {
      addToast({ title: "Error", description: "No se pudo eliminar", color: "danger" });
    }
    setBodegaToDelete(null);
  }, [bodegaToDelete, removePurchase]);

  const handlePasarASalida = useCallback((item: any) => {
    const payload = {
      numeroSalida: `SAL-${item.folio || Math.floor(Math.random() * 1000)}`,
      responsable: "Bodega",
      fecha: new Date().toISOString().split("T")[0],
      status: "Creado",
      tipo: "venta",
      totalAmount: item.totalAmount || 0,
      tipoEntrega: "Local",
      almacen: item.bodegaName || "Local",
      agente: "Sistema",
      clienteDireccion: "N/A",
      items: [], // En una implementación real, aquí se pasarían los items de la entrada
    };
    
    createSalida(payload);
    setActiveTab("salidas");

    addToast({
      title: "Salida Generada",
      description: `La carga ${item.numeroCarga || "seleccionada"} pasó a salidas exitosamente.`,
      color: "success"
    });
  }, [createSalida, setActiveTab]);

  const handleAvanzarEntrada = useCallback(async (item: any) => {
    try {
      await updateReceptionStatus({
        id: item._id,
        receptionStatus: "Completa"
      });
      addToast({
        title: "Recepción Completa",
        description: `La entrada ${item.folio || "seleccionada"} se marcó como completa.`,
        color: "success"
      });
    } catch (error) {
      addToast({ title: "Error", description: "No se pudo actualizar el estado", color: "danger" });
    }
  }, [updateReceptionStatus]);

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 md:p-5">
        {view === "list" ? (
          <div className="mx-auto space-y-4">
            <BodegaHeader
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as TabKey)}
              visibleTabs={visibleTabs}
            />
            {(activeTab === "entradas" || (activeTab === "nominas" && canViewPayroll)) && (
              <BodegaToolbar
                onAgregar={handleAgregar}
                agregarLabel={activeTab === "entradas" ? "Nueva entrada" : "Nueva nómina"}
              />
            )}
            {activeTab === "entradas" ? (
              <BodegaEntradasTable 
                items={(purchases || []) as any} 
                onPasarASalida={handlePasarASalida}
                onBorrar={(item) => setBodegaToDelete(item)}
                canDelete={canDeleteRecords}
                onEditar={(item) => {
                  setBodegaToEdit(item as any);
                  setView("form");
                }}
                onAvanzarEstado={handleAvanzarEntrada}
              />
            ) : activeTab === "catalogo" ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-default-500 italic">Administración de bodegas y almacenes físicos</p>
                  <Button 
                    color="primary" 
                    size="sm" 
                    startContent={<PlusIcon className="size-4" />}
                    onPress={() => { setSelectedBodega(null); onOpenBodegaModal(); }}
                  >
                    Nueva Bodega
                  </Button>
                </div>
                <BodegaTable 
                  items={bodegas || []} 
                  onEdit={(b) => { setSelectedBodega(b); onOpenBodegaModal(); }} 
                  onDelete={setBodegaToDeleteRecord} 
                  canDelete={canDeleteRecords}
                  isLoading={bodegas === undefined}
                />
              </div>
            ) : activeTab === "salidas" ? (
              <BodegaSalidas 
                items={(salidas || []) as any} 
                onAgregar={() => { setSalidaToEdit(null); setView("form"); }}
                onEditar={(item) => { setSalidaToEdit(item); setView("form"); }}
                onBorrar={setSalidaToDelete}
                canDelete={canDeleteRecords}
              />
            ) : activeTab === "inventario" ? (
              <BodegaInventory
                items={(purchases || []) as any}
                selectedCarga={selectedCarga}
                onClearSelection={() => setSelectedCarga(null)}
                onNuevo={() => setView("form")}
                onAjustar={() => setView("form")}
                canAdjust={canAdjustInventory}
              />
            ) : activeTab === "egresos" ? (
              <BodegaGastos
                canShowDailyTotals={canShowDailyTotals}
                canDelete={canDeleteRecords}
                canCreate={canCreateEgresos}
              />
            ) : activeTab === "nominas" && canViewPayroll ? (
              selectedNomina ? (
                <BodegaDeudas 
                  empleado={selectedNomina.empleado} 
                  onBack={() => setSelectedNomina(null)} 
                />
              ) : (
                <BodegaNominas items={nominas} onSelect={(item) => setSelectedNomina(item)} />
              )
            ) : activeTab === "ingresos" ? (
              <BodegaIngresos
                canShowDailyTotals={canShowDailyTotals}
                canDelete={canDeleteRecords}
                canCreate={canCreateIngresos}
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-divider">
                <p className="text-default-500">
                  Vista de {TIPO_LABELS[activeTab]} en desarrollo
                </p>
              </div>
            )}
          </div>
        ) : (
          activeTab === "salidas" || salidaToEdit ? (
            <BodegaSalidaForm
              key={salidaToEdit?._id || "new-salida"}
              salida={salidaToEdit}
              onSubmit={handleSubmitSalida}
              canAssignResponsible={canAssignRouteResponsible}
              onCancel={() => {
                setBodegaToEdit(null);
                setSalidaToEdit(null);
                setView("list");
              }}
            />
          ) : activeTab === "inventario" ? (
            <BodegaInventoryForm
              onSubmit={handleSubmitInventoryAdjustment}
              onCancel={() => setView("list")}
            />
          ) : activeTab === "ingresos" ? (
            <BodegaIngresoForm
              onSuccess={() => setView("list")}
              onCancel={() => setView("list")}
            />
          ) : activeTab === "egresos" ? (
            <BodegaGastoForm
              onSuccess={() => setView("list")}
              onCancel={() => setView("list")}
            />
          ) : (
            <BodegaEntradaForm
              key={bodegaToEdit?._id || "new-entrada"}
              entrada={bodegaToEdit}
              onSubmit={handleSubmitEntrada}
              canEditPaymentStatus={isAdmin || hasPermission("purchases:edit_payment_status")}
              canEditReceptionStatus={isAdmin || hasPermission("purchases:edit_reception_status")}
              canEditDate={isAdmin || hasPermission("purchases:edit_date")}
              onCancel={() => {
                setBodegaToEdit(null);
                setSalidaToEdit(null);
                setView("list");
              }}
            />
          )
        )}
      </div>

      <ConfirmModal
        isOpen={!!bodegaToDelete || !!salidaToDelete}
        onClose={() => { setBodegaToDelete(null); setSalidaToDelete(null); }}
        onConfirm={() => {
          if (bodegaToDelete) handleConfirmBorrar();
          if (salidaToDelete) {
            if (!canDeleteRecords) return;
            removeSalida({ id: salidaToDelete._id as any });
            addToast({ title: "Salida eliminada", description: `Se eliminó "${salidaToDelete.numeroSalida}".`, color: "success" });
            setSalidaToDelete(null);
          }
        }}
        title={bodegaToDelete ? "¿Borrar carga?" : "¿Borrar salida?"}
        description={
          bodegaToDelete
            ? `Se eliminará la carga "${bodegaToDelete.numeroCarga}". Esta acción no se puede deshacer.`
            : salidaToDelete
            ? `Se eliminará la salida "${salidaToDelete.numeroSalida}". Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <BodegaCatalogModal
        isOpen={isBodegaModalOpen}
        onClose={onCloseBodegaModal}
        bodega={selectedBodega}
        onSubmit={async (values) => {
          if (selectedBodega) {
            await updateBodega({ id: selectedBodega._id, ...values });
            addToast({ title: "Bodega actualizada", color: "success" });
          } else {
            await createBodega(values);
            addToast({ title: "Bodega creada", color: "success" });
          }
        }}
      />

      {canDeleteRecords ? (
        <ConfirmModal
          isOpen={!!bodegaToDeleteRecord}
          onClose={() => setBodegaToDeleteRecord(null)}
          onConfirm={async () => {
            if (bodegaToDeleteRecord) {
              await removeBodega({ id: bodegaToDeleteRecord._id });
              addToast({ title: "Bodega eliminada", color: "danger" });
              setBodegaToDeleteRecord(null);
            }
          }}
          title="¿Eliminar bodega?"
          description={`Se eliminará permanentemente la bodega "${bodegaToDeleteRecord?.name}".`}
          confirmLabel="Eliminar"
          variant="danger"
        />
      ) : null}
    </div>
  );
}

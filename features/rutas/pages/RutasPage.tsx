"use client";

import { useState, useCallback, useMemo } from "react";
import { addToast, Button, Tabs, Tab } from "@heroui/react";
import { ConfirmModal } from "@/shared/components";
import { RutasHeader, RutaModal, RutasGastos, RutasCreditos, RutasVentas, RutasMapa, RutasCargasTable, RutasInventarioTable, RutasCardGrid } from "../components";
import { mockRutaCargas, mockBodega } from "@/shared/mocks";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRoutes } from "@/features/configuracion/components/routes/use-routes";
import { Route } from "@/features/configuracion/components/routes/types";

function normalizeText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function routeDestinationLabel(route: Route) {
  return route.destination?.trim() || route.name?.trim() || "Ruta";
}

function routeTabLabel(route: Route) {
  return route.name?.trim() || route.destination?.trim() || "Ruta";
}

function routeCode(route: Route) {
  const source = route.name || "";
  const match = source.match(/(\d+)/);
  return match ? match[1] : "";
}

export function RutasPage() {
  const [activeTab, setActiveTab] = useState<string>("cargas");
  const { routes: convexRoutes = [], isLoading, deleteRoute } = useRoutes();
  const [selectedRutaId, setSelectedRutaId] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [rutaToEdit, setRutaToEdit] = useState<Route | null>(null);
  const [rutaToDelete, setRutaToDelete] = useState<Route | null>(null);

  const handleEditar = useCallback((item: Route) => {
    setRutaToEdit(item);
    setModalOpen(true);
  }, []);

  const selectedRuta = useMemo(
    () => (selectedRutaId ? convexRoutes.find((route) => route.id === selectedRutaId) || null : null),
    [convexRoutes, selectedRutaId]
  );

  const routeTabs = useMemo(() => {
    return convexRoutes.map((route) => ({
      key: route.id,
      label: routeTabLabel(route),
      route,
    }));
  }, [convexRoutes]);

  const selectedRouteCode = useMemo(() => (selectedRuta ? routeCode(selectedRuta) : ""), [selectedRuta]);
  const selectedRouteLabel = useMemo(
    () => (selectedRuta ? routeDestinationLabel(selectedRuta) : ""),
    [selectedRuta]
  );
  const selectedRouteResponsible = useMemo(() => {
    if (!selectedRuta) return "";
    return selectedRuta.assignedProfileName?.trim() || selectedRuta.assignedUserName?.trim() || "Sin responsable";
  }, [selectedRuta]);

  const handleSubmitRuta = useCallback(
    async (_row: unknown, _editId?: string) => {
      // Por ahora mantenemos esta lógica simple o la conectamos a useRoutes
      // Para efectos del requerimiento "que salgan las reales", ya estamos usando convexRoutes arriba.
      setModalOpen(false);
      setRutaToEdit(null);
    },
    []
  );

  const handleConfirmBorrar = useCallback(async () => {
    if (!rutaToDelete) return;
    try {
      await deleteRoute(rutaToDelete.id);
      addToast({
        title: "Ruta eliminada",
        description: `Se eliminó "${rutaToDelete.name}".`,
        color: "success",
      });
      setRutaToDelete(null);
    } catch (_error) {
      addToast({
        title: "Error",
        description: "No se pudo eliminar la ruta.",
        color: "danger",
      });
    }
  }, [rutaToDelete, deleteRoute]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="space-y-4 p-4 md:p-5">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <span className="text-default-500 font-medium animate-pulse">Cargando rutas operativas...</span>
          </div>
        ) : !selectedRuta ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <RutasCardGrid
              items={convexRoutes}
              onEditar={handleEditar}
              onBorrar={setRutaToDelete}
              onSelect={(r) => {
                setSelectedRutaId(r.id);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Button
                  isIconOnly
                  variant="flat"
                  onPress={() => setSelectedRutaId(null)}
                  radius="full"
                  className="bg-content1 border border-default-200 shadow-sm"
                >
                  <ArrowLeftIcon className="size-5" />
                </Button>
                <div className="grid flex-1 gap-3 rounded-xl border border-default-200 bg-content1 p-3 sm:grid-cols-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">Ruta</p>
                    <p className="truncate text-sm font-bold uppercase text-foreground">{selectedRuta.name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">Destino</p>
                    <p className="truncate text-sm font-semibold text-foreground">{selectedRouteLabel}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">Responsable</p>
                    <p className="truncate text-sm font-semibold text-foreground">{selectedRouteResponsible}</p>
                  </div>
                </div>
              </div>

              <div className="px-1">
                <Tabs 
                    variant="underlined"
                    aria-label="Accesos rápidos por ruta"
                    selectedKey={selectedRuta.id}
                    onSelectionChange={(key) => {
                      const next = convexRoutes.find((r) => r.id === String(key));
                      if (next) setSelectedRutaId(next.id);
                    }}
                    classNames={{
                        base: "w-full",
                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-0 h-10",
                        tabContent: "group-data-[selected=true]:text-primary font-bold text-default-500 uppercase text-xs tracking-widest"
                    }}
                >
                    {routeTabs.map((r) => (
                        <Tab key={r.key} title={r.label} />
                    ))}
                </Tabs>
              </div>

              {/* Main Navigation Tabs */}
              <RutasHeader
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
                showTitle={false}
              />
            </div>

            <div className="mt-4">
              {activeTab === "cargas" && (
                <RutasCargasTable 
                  items={mockRutaCargas.filter(c => 
                    normalizeText(c.destino) === normalizeText(selectedRouteLabel) ||
                    normalizeText(c.destino) === normalizeText(selectedRuta.name)
                  )} 
                />
              )}

              {activeTab === "gastos" && (
                <RutasGastos selectedRoute={selectedRuta} allRoutes={convexRoutes} />
              )}
              {activeTab === "creditos" && <RutasCreditos selectedRutaName={selectedRouteLabel} />}
              {activeTab === "ventas" && (
                <RutasVentas
                  selectedDestination={selectedRouteLabel}
                  selectedRouteCode={selectedRouteCode}
                />
              )}
              {activeTab === "inventario" && (
                <RutasInventarioTable 
                  items={mockBodega.filter(i => 
                    normalizeText(i.destino) === normalizeText(selectedRouteLabel) ||
                    normalizeText(i.ruta) === normalizeText(selectedRouteCode) ||
                    normalizeText(i.ruta) === normalizeText(selectedRuta.name)
                  )} 
                  selectedRuta={selectedRouteLabel} 
                />
              )}

              {activeTab === "mapa" && <RutasMapa selectedRuta={selectedRuta} />}
            </div>
          </div>
        )}
      </div>

      <RutaModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false);
          setRutaToEdit(null);
        }}
        ruta={rutaToEdit}
        onSubmit={handleSubmitRuta}
      />
      <ConfirmModal
        isOpen={!!rutaToDelete}
        onClose={() => setRutaToDelete(null)}
        onConfirm={handleConfirmBorrar}
        title="¿Borrar ruta?"
        description={
          rutaToDelete
            ? `Se eliminará "${rutaToDelete.name}". Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}

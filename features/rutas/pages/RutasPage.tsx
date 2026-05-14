"use client";

import { useState, useCallback, useMemo } from "react";
import { addToast, Button, Tabs, Tab } from "@heroui/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ConfirmModal } from "@/shared/components";
import { DashboardHeader } from "@/features/dashboard/components";
import { RutasHeader, RutaModal, RutasGastos, RutasCreditos, RutasVentas, RutasMapa, RutasCargasTable, RutasInventarioTable, RutasCardGrid } from "../components";
import { mockRutaCargas, mockBodega } from "@/shared/mocks";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRoutes } from "@/features/configuracion/components/routes/use-routes";
import { Route } from "@/features/configuracion/components/routes/types";

export function RutasPage() {
  const [activeTab, setActiveTab] = useState<string>("cargas");
  const { routes: convexRoutes = [], isLoading, deleteRoute } = useRoutes();
  const [selectedRuta, setSelectedRuta] = useState<Route | null>(null);
  const [selectedResponsable, setSelectedResponsable] = useState("Todos");
  const [isModalOpen, setModalOpen] = useState(false);
  const [rutaToEdit, setRutaToEdit] = useState<Route | null>(null);
  const [rutaToDelete, setRutaToDelete] = useState<Route | null>(null);

  const handleEditar = useCallback((item: Route) => {
    setRutaToEdit(item);
    setModalOpen(true);
  }, []);

  const responsibles = useMemo(() => {
    if (!selectedRuta || !convexRoutes) return ["Todos"];
    
    // Buscamos todas las rutas en Convex que compartan el mismo destino
    const rutasAlMismoDestino = convexRoutes.filter(
      (r) => r.destination === selectedRuta.destination
    );
    
    // Extraemos los nombres de los responsables asignados en el sistema
    const nombres = rutasAlMismoDestino.map((r) => r.assignedProfileName);
    
    // Devolvemos "Todos" más la lista de nombres únicos
    const unicos = Array.from(new Set(nombres));
    
    return ["Todos", ...unicos];
  }, [selectedRuta, convexRoutes]);

  const handleSubmitRuta = useCallback(
    async (row: any, editId?: string) => {
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
    } catch (error) {
      addToast({
        title: "Error",
        description: "No se pudo eliminar la ruta.",
        color: "danger",
      });
    }
  }, [rutaToDelete, deleteRoute]);

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
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
                setSelectedRuta(r);
                setSelectedResponsable("Todos");
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
                  onPress={() => setSelectedRuta(null)}
                  radius="full"
                  className="bg-content1 border border-default-200 shadow-sm"
                >
                  <ArrowLeftIcon className="size-5" />
                </Button>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">
                    {selectedRuta.name}
                  </h1>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider mt-1">
                    Destino: {selectedRuta.destination}
                  </span>
                </div>
              </div>

              {/* Responsables Filter Tabs - Top Level */}
              <div className="px-1">
                <Tabs 
                    variant="underlined"
                    aria-label="Filtro por responsable"
                    selectedKey={selectedResponsable}
                    onSelectionChange={(key) => setSelectedResponsable(key as string)}
                    classNames={{
                        base: "w-full",
                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-0 h-10",
                        tabContent: "group-data-[selected=true]:text-primary font-bold text-default-500 uppercase text-xs tracking-widest"
                    }}
                >
                    {responsibles.map((r) => (
                        <Tab key={r} title={r} />
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
                    c.destino === selectedRuta.destination && 
                    (selectedResponsable === "Todos" || c.responsable === selectedResponsable)
                  )} 
                />
              )}

              {activeTab === "gastos" && <RutasGastos />}
              {activeTab === "creditos" && <RutasCreditos selectedRutaName={selectedRuta.name} />}
              {activeTab === "ventas" && <RutasVentas selectedRutaName={selectedRuta.name} />}
              {activeTab === "inventario" && (
                <RutasInventarioTable 
                  items={mockBodega.filter(i => 
                    i.ruta === selectedRuta.name && 
                    (selectedResponsable === "Todos" || i.responsable === selectedResponsable)
                  )} 
                  selectedRuta={selectedRuta.name} 
                />
              )}

              {activeTab === "mapa" && <RutasMapa selectedRuta={selectedRuta as any} />}
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

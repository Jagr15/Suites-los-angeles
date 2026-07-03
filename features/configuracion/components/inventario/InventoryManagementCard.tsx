"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  addToast,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
  QueueListIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type ProductDoc = Doc<"products">;
type InventoryDoc = Doc<"inventory">;

export function InventoryManagementCard() {
  const [selectedBodegaId, setSelectedBodegaId] = useState<string>("");
  const [filterValue, setFilterValue] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("stock");
  const [stockPage, setStockPage] = useState(1);
  const [stockRowsPerPage, setStockRowsPerPage] = useState(15);
  
  // Modal states for manual adjustment
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [newStock, setNewStock] = useState<string>("");
  const [adjustmentReason, setAdjustmentReason] = useState("Ajuste físico");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const bodegasQuery = useQuery(api.bodegas.queries.list);
  const bodegas = useMemo(() => bodegasQuery ?? [], [bodegasQuery]);
  const activeBodegas = useMemo(() => bodegas.filter(b => b.isActive), [bodegas]);

  const effectiveBodegaId = selectedBodegaId || String(activeBodegas[0]?._id || "");

  const productsQuery = useQuery(api.products.queries.list);
  const products = useMemo(() => (productsQuery ?? []) as ProductDoc[], [productsQuery]);
  const inventoryRowsQuery = useQuery(
    api.inventory.queries.listByBodega,
    effectiveBodegaId ? { bodegaId: effectiveBodegaId as Id<"bodegas"> } : "skip"
  );
  const inventoryRows = useMemo(
    () => (inventoryRowsQuery ?? []) as InventoryDoc[],
    [inventoryRowsQuery]
  );
  
  const movementLogsQuery = useQuery(
    api.inventoryLogs.queries.listByBodega,
    effectiveBodegaId ? { bodegaId: effectiveBodegaId as Id<"bodegas"> } : "skip"
  );
  const movementLogs = useMemo(() => movementLogsQuery ?? [], [movementLogsQuery]);

  // Mutation
  const adjustInventory = useMutation(api.inventory.mutations.adjust);

  // Stock Map
  const stockMap = useMemo(() => {
    return new Map(inventoryRows.map((inv) => [String(inv.productId), inv.quantity]));
  }, [inventoryRows]);

  // Combined stock list
  const stockList = useMemo(() => {
    if (products.length === 0) return [];
    return products.map((p) => {
      const stock = stockMap.get(String(p._id)) ?? 0;
      return {
        id: String(p._id),
        sku: p.sku || p.codigo || "",
        producto: p.producto,
        categoria: p.categoria || "General",
        subcategoria: p.subcategoria || "",
        stock,
        costo: p.lista1 || "0",
        venta: p.lista11 || "0",
      };
    });
  }, [products, stockMap]);

  // Filtered Stock items
  const filteredStockItems = useMemo(() => {
    const query = filterValue.toLowerCase().trim();
    if (!query) return stockList;
    return stockList.filter((item) =>
      item.producto.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query)
    );
  }, [stockList, filterValue]);

  const stockTotalRows = filteredStockItems.length;
  const stockTotalPages = Math.max(1, Math.ceil(stockTotalRows / stockRowsPerPage));
  const currentStockPage = Math.min(stockPage, stockTotalPages);

  const paginatedStockItems = useMemo(() => {
    const start = (currentStockPage - 1) * stockRowsPerPage;
    return filteredStockItems.slice(start, start + stockRowsPerPage);
  }, [filteredStockItems, currentStockPage, stockRowsPerPage]);

  const stockStartItem = stockTotalRows === 0 ? 0 : (currentStockPage - 1) * stockRowsPerPage + 1;
  const stockEndItem = stockTotalRows === 0 ? 0 : Math.min(currentStockPage * stockRowsPerPage, stockTotalRows);

  // Selected Product for adjustment previous stock lookup
  const selectedProductPreviousStock = useMemo(() => {
    if (!selectedProductId) return 0;
    return stockMap.get(selectedProductId) ?? 0;
  }, [selectedProductId, stockMap]);

  const handleAdjustStock = async () => {
    if (!effectiveBodegaId || !selectedProductId || newStock === "") return;
    const finalNewStock = parseFloat(newStock);
    if (isNaN(finalNewStock)) return;

    setIsSubmitting(true);
    try {
      const delta = finalNewStock - selectedProductPreviousStock;
      await adjustInventory({
        bodegaId: effectiveBodegaId as Id<"bodegas">,
        items: [
          {
            productId: selectedProductId as Id<"products">,
            quantity: delta,
            newStock: finalNewStock,
            reason: adjustmentReason,
          },
        ],
        notes: adjustmentNotes,
      });

      addToast({
        title: "Ajuste aplicado",
        description: "El stock se actualizó correctamente.",
        color: "success",
      });
      
      // Reset modal state
      setSelectedProductId("");
      setNewStock("");
      setAdjustmentReason("Ajuste físico");
      setAdjustmentNotes("");
      onClose();
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "No se pudo realizar el ajuste.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-white/10 bg-neutral-900/50 shadow-xl backdrop-blur-md">
      <CardHeader className="flex flex-col gap-4 px-6 pt-6">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <BuildingStorefrontIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Administración de Inventario</h2>
              <p className="text-xs text-white/50">Consulta stock, realiza ajustes manuales y audita movimientos.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {effectiveBodegaId && (
              <Button
                color="primary"
                radius="full"
                startContent={<PlusIcon className="size-4" />}
                onPress={onOpen}
              >
                Ajustar Stock
              </Button>
            )}
          </div>
        </div>

        {/* Bodega Select & Tabs */}
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <div className="w-full max-w-xs shrink-0">
            <Select
              label="Bodega / Almacén"
              size="sm"
              selectedKeys={effectiveBodegaId ? [effectiveBodegaId] : []}
              onSelectionChange={(keys) => {
                setSelectedBodegaId(String(Array.from(keys)[0] || ""));
                setStockPage(1);
              }}
              classNames={{
                trigger: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                label: "text-white/50",
                value: "text-white font-semibold",
              }}
            >
              {activeBodegas.map((bodega) => (
                <SelectItem key={bodega._id} textValue={bodega.name}>
                  {bodega.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="flex-1">
            <Tabs
              aria-label="Vistas de inventario"
              selectedKey={activeSubTab}
              onSelectionChange={(k) => setActiveSubTab(String(k))}
              color="primary"
              variant="underlined"
              classNames={{
                tabList: "border-b border-white/10 p-0 gap-6",
                cursor: "bg-primary",
                tab: "max-w-fit px-0 h-10 text-white/60 hover:text-white group-data-[selected=true]:text-primary font-bold",
              }}
            >
              <Tab
                key="stock"
                title={
                  <div className="flex items-center gap-2">
                    <QueueListIcon className="size-4" />
                    <span>Existencias</span>
                  </div>
                }
              />
              <Tab
                key="movimientos"
                title={
                  <div className="flex items-center gap-2">
                    <ClockIcon className="size-4" />
                    <span>Movimientos (Historial)</span>
                  </div>
                }
              />
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardBody className="px-6 pb-6">
        {activeSubTab === "stock" ? (
          <div className="space-y-4">
            {/* Search filter */}
            <div className="flex w-full max-w-md items-center">
              <Input
                placeholder="Buscar por descripción o SKU..."
                value={filterValue}
                onValueChange={setFilterValue}
                size="sm"
                startContent={<MagnifyingGlassIcon className="size-4 text-white/40" />}
                classNames={{
                  inputWrapper: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                  input: "text-white",
                }}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/40 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
              <Table
                aria-label="Tabla de existencias en almacén"
                removeWrapper
                className="bg-transparent text-white"
                classNames={{
                  wrapper: "bg-transparent p-0",
                }}
              >
                <TableHeader>
                  <TableColumn className="bg-slate-950/95 text-[10px] uppercase tracking-[0.22em] text-slate-400">Código</TableColumn>
                  <TableColumn className="bg-slate-950/95 text-[10px] uppercase tracking-[0.22em] text-slate-400">Producto</TableColumn>
                  <TableColumn className="bg-slate-950/95 text-[10px] uppercase tracking-[0.22em] text-slate-400">Categoría</TableColumn>
                  <TableColumn className="bg-slate-950/95 text-[10px] uppercase tracking-[0.22em] text-slate-400 text-right">Costo</TableColumn>
                  <TableColumn className="bg-slate-950/95 text-[10px] uppercase tracking-[0.22em] text-slate-400 text-right">Venta (T1)</TableColumn>
                  <TableColumn className="bg-slate-950/95 text-[10px] uppercase tracking-[0.22em] text-slate-400 text-center">Stock Actual</TableColumn>
                </TableHeader>
                <TableBody items={paginatedStockItems} emptyContent="No hay productos en esta bodega.">
                  {(item) => (
                    <TableRow key={item.id} className="border-b border-white/5 bg-white/[0.02] hover:bg-sky-500/5 data-[odd=true]:bg-white/[0.04]">
                      <TableCell className="font-mono text-xs text-slate-400">{item.sku}</TableCell>
                      <TableCell className="font-semibold text-slate-100">{item.producto}</TableCell>
                      <TableCell className="text-slate-300">{item.categoria}</TableCell>
                      <TableCell className="text-right font-mono text-slate-300">${parseFloat(item.costo).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-400 font-mono">${parseFloat(item.venta).toFixed(2)}</TableCell>
                      <TableCell className="text-center font-bold text-sm">
                        <span className={item.stock <= 10 ? "text-red-400" : item.stock <= 30 ? "text-orange-400" : "text-green-400"}>
                          {item.stock}
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-100">
                  {stockTotalRows} productos encontrados
                </p>
                <p className="text-xs text-slate-400">
                  Mostrando {stockStartItem}-{stockEndItem} de {stockTotalRows}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="w-full sm:w-40">
                  <Select
                    label="Mostrar"
                    size="sm"
                    selectedKeys={[String(stockRowsPerPage)]}
                    onSelectionChange={(keys) => {
                      const next = Number(Array.from(keys)[0]);
                      if (!Number.isFinite(next)) return;
                      setStockRowsPerPage(next);
                      setStockPage(1);
                    }}
                    classNames={{
                      trigger: "bg-slate-950/60 border border-white/10 hover:bg-slate-900/80 text-white shadow-inner shadow-black/20",
                      label: "text-slate-400",
                      value: "text-slate-100 font-semibold",
                    }}
                  >
                    {[10, 15].map((option) => (
                      <SelectItem key={String(option)} textValue={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {stockTotalPages > 1 && (
                  <div className="flex justify-end rounded-xl border border-white/10 bg-slate-950/50 p-2 shadow-inner shadow-black/20">
                    <Pagination
                      showControls
                      page={currentStockPage}
                      total={stockTotalPages}
                      onChange={setStockPage}
                      classNames={{
                        cursor: "bg-primary font-semibold shadow-lg shadow-primary/20",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <Table aria-label="Historial de movimientos de inventario" removeWrapper className="bg-transparent text-white">
              <TableHeader>
                <TableColumn className="bg-neutral-800 text-white/60">Fecha</TableColumn>
                <TableColumn className="bg-neutral-800 text-white/60">Producto</TableColumn>
                <TableColumn className="bg-neutral-800 text-white/60 text-center">Operación</TableColumn>
                <TableColumn className="bg-neutral-800 text-white/60 text-center">Cantidad</TableColumn>
                <TableColumn className="bg-neutral-800 text-white/60 text-center">Previo → Nuevo</TableColumn>
                <TableColumn className="bg-neutral-800 text-white/60">Concepto / Motivo</TableColumn>
              </TableHeader>
              <TableBody items={movementLogs} emptyContent="No hay movimientos registrados para esta bodega.">
                {(log) => {
                  const prod = products.find(p => p._id === log.productId);
                  const isPositive = log.quantity > 0;
                  return (
                    <TableRow key={log._id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell className="text-xs text-white/50 font-mono">
                        {new Date(log.date).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{prod?.producto || "Producto Desconocido"}</span>
                          <span className="text-[10px] text-white/40 font-mono">SKU: {prod?.sku || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          log.type === "entrada" 
                            ? "bg-green-500/10 text-green-400" 
                            : log.type === "salida" 
                              ? "bg-red-500/10 text-red-400" 
                              : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {log.type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className={`text-center font-bold font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? `+${log.quantity}` : log.quantity}
                      </TableCell>
                      <TableCell className="text-center text-xs text-white/60 font-mono">
                        {log.previousStock} → {log.newStock}
                      </TableCell>
                      <TableCell className="text-sm italic text-white/60">
                        {log.reason}
                      </TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          </div>
        )}
      </CardBody>

      {/* Manual Stock Adjustment Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" classNames={{
        base: "bg-neutral-900 border border-white/10 text-white rounded-3xl",
        header: "border-b border-white/5 font-bold",
        footer: "border-t border-white/5",
      }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-primary" />
                <span>Ajustar Stock Manualmente</span>
              </ModalHeader>
              <ModalBody className="py-6 space-y-4">
                {/* Autocomplete Product selector */}
                <div className="w-full">
                  <Autocomplete
                    label="Seleccionar Producto"
                    placeholder="Escribe nombre o SKU..."
                    selectedKey={selectedProductId || null}
                    onSelectionChange={(key) => setSelectedProductId(String(key || ""))}
                    classNames={{
                      popoverContent: "bg-neutral-800 text-white border border-white/10",
                    }}
                    inputProps={{
                      classNames: {
                        inputWrapper: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                        input: "text-white font-semibold",
                        label: "text-white/50",
                      }
                    }}
                  >
                    {products.map((p) => (
                      <AutocompleteItem key={p._id} textValue={p.producto} className="text-white hover:bg-white/5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{p.producto}</span>
                          <span className="text-[10px] text-white/50 font-mono">SKU: {p.sku || ""}</span>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </div>

                {selectedProductId && (
                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 border border-white/5 text-sm">
                    <span className="text-white/60">Stock actual en sistema:</span>
                    <span className="font-bold text-primary">{selectedProductPreviousStock} unidades</span>
                  </div>
                )}

                <Input
                  type="number"
                  label="Nuevo Stock Real"
                  placeholder="Ej: 150"
                  value={newStock}
                  onValueChange={setNewStock}
                  isDisabled={!selectedProductId}
                  classNames={{
                    inputWrapper: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                    input: "text-white font-bold",
                    label: "text-white/50",
                  }}
                />

                <Input
                  label="Motivo del Ajuste"
                  placeholder="Ej: Corrección de stock inicial / Merma"
                  value={adjustmentReason}
                  onValueChange={setAdjustmentReason}
                  isDisabled={!selectedProductId}
                  classNames={{
                    inputWrapper: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                    input: "text-white",
                    label: "text-white/50",
                  }}
                />

                <Input
                  label="Notas adicionales"
                  placeholder="Opcional..."
                  value={adjustmentNotes}
                  onValueChange={setAdjustmentNotes}
                  isDisabled={!selectedProductId}
                  classNames={{
                    inputWrapper: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                    input: "text-white",
                    label: "text-white/50",
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleAdjustStock}
                  isLoading={isSubmitting}
                  isDisabled={!selectedProductId || newStock === ""}
                >
                  Confirmar Ajuste
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
}

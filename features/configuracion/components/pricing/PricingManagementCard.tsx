"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  addToast,
} from "@heroui/react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { StateSelector, MunicipalitySelector } from "@/shared/components/locations";

type TierDraft = {
  id?: string;
  productId: string;
  minQty: string;
  maxQty: string;
  basePrice: string;
  active: boolean;
  ruleVersion: string;
  notes: string;
};

type ZoneDraft = {
  id?: string;
  stateId: string;
  stateName: string;
  municipalityId: string;
  municipalityName: string;
  zoneKey: "Zona 1" | "Zona 2" | "Zona 3";
  zoneName: string;
  marginAmount: string;
  active: boolean;
  ruleVersion: string;
  notes: string;
};

type LevelDraft = {
  id?: string;
  code: string;
  name: string;
  minMonthlyAmount: string;
  discountPct: string;
  active: boolean;
  ruleVersion: string;
  description: string;
};

type PricingSetting = {
  _id: string;
  key: string;
  value: string;
  updatedAt: string;
};

type ProductOption = {
  _id: string;
  producto: string;
  sku: string;
};

type PricingProductTierItem = {
  _id: string;
  productId: string;
  productName: string;
  minQty: number;
  maxQty?: number;
  basePrice: number;
  active: boolean;
  ruleVersion: number;
  notes?: string;
};

type PricingZoneMarginItem = {
  _id: string;
  stateId?: string;
  stateName?: string;
  municipalityId?: string;
  municipalityName?: string;
  zoneKey?: "Zona 1" | "Zona 2" | "Zona 3";
  zoneName?: string;
  marginType?: "fijo";
  marginAmount: number;
  active: boolean;
  ruleVersion: number;
  notes?: string;
};

type PricingCustomerLevelItem = {
  _id: string;
  code: string;
  name: string;
  minMonthlyAmount?: number;
  discountPct: number;
  active: boolean;
  ruleVersion: number;
  description?: string;
};

const defaultTierDraft: TierDraft = {
  productId: "",
  minQty: "",
  maxQty: "",
  basePrice: "",
  active: true,
  ruleVersion: "",
  notes: "",
};

const defaultZoneDraft: ZoneDraft = {
  stateId: "",
  stateName: "",
  municipalityId: "",
  municipalityName: "",
  zoneKey: "Zona 1",
  zoneName: "Zona 1",
  marginAmount: "",
  active: true,
  ruleVersion: "",
  notes: "",
};

const defaultLevelDraft: LevelDraft = {
  code: "",
  name: "",
  minMonthlyAmount: "",
  discountPct: "",
  active: true,
  ruleVersion: "",
  description: "",
};

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRequiredNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value || 0);
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export function PricingManagementCard() {
  const productsRaw = useQuery(api.products.queries.list) || [];
  const productTiers = (useQuery(api.pricing.queries.listProductTiers) || []) as PricingProductTierItem[];
  const zoneMargins = (useQuery(api.pricing.queries.listZoneMargins) || []) as PricingZoneMarginItem[];
  const customerLevels = (useQuery(api.pricing.queries.listCustomerLevels) || []) as PricingCustomerLevelItem[];
  const settings = (useQuery(api.pricing.queries.listSettings) || []) as PricingSetting[];

  const upsertTier = useMutation(api.pricing.mutations.upsertProductTier);
  const removeTier = useMutation(api.pricing.mutations.removeProductTier);
  const upsertZone = useMutation(api.pricing.mutations.upsertZoneMargin);
  const removeZone = useMutation(api.pricing.mutations.removeZoneMargin);
  const upsertLevel = useMutation(api.pricing.mutations.upsertCustomerLevel);
  const removeLevel = useMutation(api.pricing.mutations.removeCustomerLevel);
  const setSetting = useMutation(api.pricing.mutations.setPricingSetting);

  const products = useMemo<ProductOption[]>(() => {
    return productsRaw.map((product) => ({
      _id: String(product._id),
      producto: String(product.producto || ""),
      sku: String(product.sku || ""),
    }));
  }, [productsRaw]);

  const [activeTab, setActiveTab] = useState("tiers");
  const [tierDraft, setTierDraft] = useState<TierDraft | null>(null);
  const [zoneDraft, setZoneDraft] = useState<ZoneDraft | null>(null);
  const [levelDraft, setLevelDraft] = useState<LevelDraft | null>(null);
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?._id || "");
  const effectiveProductId = selectedProductId || products[0]?._id || "";

  const productTierRows = useMemo(() => {
    if (!effectiveProductId) return productTiers;
    return productTiers.filter((tier) => String(tier.productId) === effectiveProductId);
  }, [productTiers, effectiveProductId]);

  const settingsMap = useMemo(() => {
    return new Map<string, PricingSetting>(settings.map((item) => [item.key, item]));
  }, [settings]);

  const dynamicEnabled = settingsMap.get("dynamicPricingEnabled")?.value !== "false";
  const legacyFallbackEnabled = settingsMap.get("legacyFallbackEnabled")?.value !== "false";

  const handleSaveTier = async () => {
    if (!tierDraft?.productId) {
      addToast({ title: "Producto requerido", description: "Selecciona un producto.", color: "warning" });
      return;
    }
    const minQty = parseRequiredNumber(tierDraft.minQty);
    const maxQty = parseOptionalNumber(tierDraft.maxQty);
    const basePrice = parseRequiredNumber(tierDraft.basePrice);
    if (minQty <= 0) {
      addToast({ title: "Validación", description: "La cantidad mínima debe ser mayor a 0.", color: "warning" });
      return;
    }
    if (typeof maxQty === "number" && maxQty < minQty) {
      addToast({ title: "Validación", description: "La cantidad máxima debe ser mayor o igual a la mínima.", color: "warning" });
      return;
    }
    if (basePrice < 0) {
      addToast({ title: "Validación", description: "El precio base no puede ser negativo.", color: "warning" });
      return;
    }

    try {
      await upsertTier({
        id: (tierDraft.id || undefined) as Id<"pricingProductTiers"> | undefined,
        productId: tierDraft.productId as Id<"products">,
        minQty,
        maxQty,
        basePrice,
        active: tierDraft.active,
        ruleVersion: parseOptionalNumber(tierDraft.ruleVersion),
        notes: tierDraft.notes || undefined,
      });
      setTierDraft(null);
      addToast({ title: "Rango guardado", color: "success" });
    } catch (error) {
      addToast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el rango.", color: "danger" });
    }
  };

  const handleSaveZone = async () => {
    if (!zoneDraft?.stateId || !zoneDraft.municipalityId) {
      addToast({ title: "Ubicación requerida", description: "Selecciona estado y municipio.", color: "warning" });
      return;
    }
    const marginAmount = parseRequiredNumber(zoneDraft.marginAmount);
    if (marginAmount < 0) {
      addToast({ title: "Validación", description: "El margen no puede ser negativo.", color: "warning" });
      return;
    }
    try {
      await upsertZone({
        id: (zoneDraft.id || undefined) as Id<"pricingZoneMargins"> | undefined,
        stateId: zoneDraft.stateId,
        stateName: zoneDraft.stateName,
        municipalityId: zoneDraft.municipalityId,
        municipalityName: zoneDraft.municipalityName,
        zoneKey: zoneDraft.zoneKey,
        zoneName: zoneDraft.zoneName,
        marginType: "fijo",
        marginAmount,
        active: zoneDraft.active,
        ruleVersion: parseOptionalNumber(zoneDraft.ruleVersion),
        notes: zoneDraft.notes || undefined,
      });
      setZoneDraft(null);
      addToast({ title: "Zona guardada", color: "success" });
    } catch (error) {
      addToast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar la zona.", color: "danger" });
    }
  };

  const handleSaveLevel = async () => {
    const discountPct = parseRequiredNumber(levelDraft?.discountPct || "0");
    const minMonthlyAmount = parseOptionalNumber(levelDraft?.minMonthlyAmount || "");
    if (!levelDraft?.code.trim()) {
      addToast({ title: "Código requerido", description: "El código del nivel es obligatorio.", color: "warning" });
      return;
    }
    if (discountPct < 0 || discountPct > 100) {
      addToast({ title: "Validación", description: "El descuento debe estar entre 0 y 100.", color: "warning" });
      return;
    }
    if (typeof minMonthlyAmount === "number" && minMonthlyAmount < 0) {
      addToast({ title: "Validación", description: "La meta mensual no puede ser negativa.", color: "warning" });
      return;
    }
    try {
      await upsertLevel({
        id: (levelDraft?.id || undefined) as Id<"pricingCustomerLevels"> | undefined,
        code: levelDraft.code.trim(),
        name: levelDraft.name.trim(),
        minMonthlyAmount,
        discountPct,
        active: levelDraft.active,
        ruleVersion: parseOptionalNumber(levelDraft.ruleVersion),
        description: levelDraft.description || undefined,
      });
      setLevelDraft(null);
      addToast({ title: "Nivel guardado", color: "success" });
    } catch (error) {
      addToast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el nivel.", color: "danger" });
    }
  };

  const handleSettingToggle = async (key: string, active: boolean) => {
    try {
      await setSetting({ key, value: active ? "true" : "false" });
      addToast({ title: "Configuración guardada", color: "success" });
    } catch {
      addToast({ title: "Error", description: "No se pudo actualizar la configuración.", color: "danger" });
    }
  };

  const tierForm = tierDraft ? (
      <Card className="border border-primary/20 bg-primary/5">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Producto"
              variant="bordered"
              selectedKeys={tierDraft.productId ? [tierDraft.productId] : []}
              onSelectionChange={(keys) => setTierDraft({ ...tierDraft, productId: String(Array.from(keys)[0] || "") })}
            >
              {products.map((product) => (
                <SelectItem key={product._id} textValue={`${product.producto} (${product.sku})`}>
                  {product.producto} ({product.sku})
                </SelectItem>
              ))}
            </Select>
            <Input
              label="Versión"
              variant="bordered"
              type="number"
              value={tierDraft.ruleVersion}
              onValueChange={(value) => setTierDraft({ ...tierDraft, ruleVersion: value })}
            />
            <Input
              label="Cantidad mínima"
              variant="bordered"
              type="number"
              value={tierDraft.minQty}
              onValueChange={(value) => setTierDraft({ ...tierDraft, minQty: value })}
            />
            <Input
              label="Cantidad máxima"
              variant="bordered"
              type="number"
              value={tierDraft.maxQty}
              onValueChange={(value) => setTierDraft({ ...tierDraft, maxQty: value })}
            />
            <Input
              label="Precio base"
              variant="bordered"
              type="number"
              value={tierDraft.basePrice}
              onValueChange={(value) => setTierDraft({ ...tierDraft, basePrice: value })}
              startContent={<span className="text-default-400">$</span>}
            />
            <Input
              label="Notas"
              variant="bordered"
              value={tierDraft.notes}
              onValueChange={(value) => setTierDraft({ ...tierDraft, notes: value })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Switch isSelected={tierDraft.active} onValueChange={(value) => setTierDraft({ ...tierDraft, active: value })}>
              Activo
            </Switch>
            <div className="flex gap-2">
              <Button variant="flat" onPress={() => setTierDraft(null)}>Cancelar</Button>
              <Button color="primary" onPress={handleSaveTier}>Guardar rango</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    ) : null;

  const zoneForm = zoneDraft ? (
      <Card className="border border-primary/20 bg-primary/5">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StateSelector
              selectedKey={zoneDraft.stateId}
              onSelectionChange={(id, name) => setZoneDraft({
                ...zoneDraft,
                stateId: id,
                stateName: name,
                municipalityId: "",
                municipalityName: "",
              })}
            />
            <MunicipalitySelector
              stateId={zoneDraft.stateId || undefined}
              selectedKey={zoneDraft.municipalityId}
              onSelectionChange={(id, name) => setZoneDraft({ ...zoneDraft, municipalityId: id, municipalityName: name })}
            />
            <Select
              label="Zona"
              variant="bordered"
              selectedKeys={zoneDraft.zoneKey ? [zoneDraft.zoneKey] : []}
              onSelectionChange={(keys) => {
                const zoneKey = String(Array.from(keys)[0] || "Zona 1") as ZoneDraft["zoneKey"];
                setZoneDraft({ ...zoneDraft, zoneKey, zoneName: zoneKey });
              }}
            >
              <SelectItem key="Zona 1">Zona 1</SelectItem>
              <SelectItem key="Zona 2">Zona 2</SelectItem>
              <SelectItem key="Zona 3">Zona 3</SelectItem>
            </Select>
            <Input
              label="Margen"
              variant="bordered"
              type="number"
              value={zoneDraft.marginAmount}
              onValueChange={(value) => setZoneDraft({ ...zoneDraft, marginAmount: value })}
              startContent={<span className="text-default-400">$</span>}
            />
            <Input
              label="Versión"
              variant="bordered"
              type="number"
              value={zoneDraft.ruleVersion}
              onValueChange={(value) => setZoneDraft({ ...zoneDraft, ruleVersion: value })}
            />
            <Input
              label="Notas"
              variant="bordered"
              value={zoneDraft.notes}
              onValueChange={(value) => setZoneDraft({ ...zoneDraft, notes: value })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Switch isSelected={zoneDraft.active} onValueChange={(value) => setZoneDraft({ ...zoneDraft, active: value })}>
              Activo
            </Switch>
            <div className="flex gap-2">
              <Button variant="flat" onPress={() => setZoneDraft(null)}>Cancelar</Button>
              <Button color="primary" onPress={handleSaveZone}>Guardar zona</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    ) : null;

  const levelForm = levelDraft ? (
      <Card className="border border-primary/20 bg-primary/5">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código"
              variant="bordered"
              value={levelDraft.code}
              onValueChange={(value) => setLevelDraft({ ...levelDraft, code: value })}
              placeholder="BRONCE / PLATA / ORO"
            />
            <Input
              label="Nombre"
              variant="bordered"
              value={levelDraft.name}
              onValueChange={(value) => setLevelDraft({ ...levelDraft, name: value })}
              placeholder="Bronce"
            />
            <Input
              label="Meta mensual"
              variant="bordered"
              type="number"
              value={levelDraft.minMonthlyAmount}
              onValueChange={(value) => setLevelDraft({ ...levelDraft, minMonthlyAmount: value })}
              startContent={<span className="text-default-400">$</span>}
            />
            <Input
              label="Descuento %"
              variant="bordered"
              type="number"
              value={levelDraft.discountPct}
              onValueChange={(value) => setLevelDraft({ ...levelDraft, discountPct: value })}
            />
            <Input
              label="Versión"
              variant="bordered"
              type="number"
              value={levelDraft.ruleVersion}
              onValueChange={(value) => setLevelDraft({ ...levelDraft, ruleVersion: value })}
            />
            <Input
              label="Descripción"
              variant="bordered"
              value={levelDraft.description}
              onValueChange={(value) => setLevelDraft({ ...levelDraft, description: value })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Switch isSelected={levelDraft.active} onValueChange={(value) => setLevelDraft({ ...levelDraft, active: value })}>
              Activo
            </Switch>
            <div className="flex gap-2">
              <Button variant="flat" onPress={() => setLevelDraft(null)}>Cancelar</Button>
              <Button color="primary" onPress={handleSaveLevel}>Guardar nivel</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    ) : null;

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h3 className="text-medium font-semibold text-foreground">Precios Dinámicos</h3>
          <p className="text-small text-default-500">Configuración de reglas sin afectar el pricing legacy.</p>
        </div>
      </CardHeader>
      <CardBody className="px-6 pb-8">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
          aria-label="Administración de precios dinámicos"
          color="primary"
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-10",
            tabContent: "group-data-[selected=true]:text-primary font-medium text-default-500",
          }}
        >
          <Tab
            key="tiers"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <PresentationChartLineIcon className="size-4" />
                <span>Rangos por producto</span>
              </div>
            }
          >
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-72">
                  <Select
                    label="Producto"
                    variant="bordered"
                    selectedKeys={effectiveProductId ? [effectiveProductId] : []}
                    onSelectionChange={(keys) => setSelectedProductId(String(Array.from(keys)[0] || ""))}
                  >
                    {products.map((product) => (
                      <SelectItem key={product._id} textValue={`${product.producto} (${product.sku})`}>
                        {product.producto} ({product.sku})
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <Button color="primary" variant="flat" startContent={<PlusIcon className="size-4" />} onPress={() => setTierDraft({ ...defaultTierDraft, productId: effectiveProductId })}>
                  Nuevo rango
                </Button>
              </div>
              {tierForm}
              <Table aria-label="Rangos por producto" removeWrapper>
                <TableHeader>
                  <TableColumn>PRODUCTO</TableColumn>
                  <TableColumn>MIN</TableColumn>
                  <TableColumn>MAX</TableColumn>
                  <TableColumn>BASE</TableColumn>
                  <TableColumn>VERSIÓN</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody items={productTierRows} emptyContent="No hay rangos configurados para este producto.">
                  {(item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.minQty}</TableCell>
                      <TableCell>{item.maxQty ?? "∞"}</TableCell>
                      <TableCell>{formatCurrency(item.basePrice)}</TableCell>
                      <TableCell>{item.ruleVersion}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={item.active ? "success" : "default"}>
                          {item.active ? "Activo" : "Inactivo"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Editar">
                            <Button isIconOnly size="sm" variant="light" onPress={() => setTierDraft({
                              id: item._id,
                              productId: String(item.productId),
                              minQty: String(item.minQty),
                              maxQty: item.maxQty === undefined ? "" : String(item.maxQty),
                              basePrice: String(item.basePrice),
                              active: item.active,
                              ruleVersion: String(item.ruleVersion || ""),
                              notes: item.notes || "",
                            })}>
                              <PencilSquareIcon className="size-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Eliminar" color="danger">
                            <Button isIconOnly size="sm" variant="light" onPress={async () => {
                              try {
                                await removeTier({ id: item._id as Id<"pricingProductTiers"> });
                                addToast({ title: "Rango eliminado", color: "success" });
                              } catch {
                                addToast({ title: "Error", description: "No se pudo eliminar el rango.", color: "danger" });
                              }
                            }}>
                              <TrashIcon className="size-4 text-danger" />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tab>

          <Tab
            key="zones"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <MapPinIcon className="size-4" />
                <span>Zonas logísticas</span>
              </div>
            }
          >
            <div className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button color="primary" variant="flat" startContent={<PlusIcon className="size-4" />} onPress={() => setZoneDraft({ ...defaultZoneDraft })}>
                  Nueva zona
                </Button>
              </div>
              {zoneForm}
              <Table aria-label="Zonas logísticas" removeWrapper>
                <TableHeader>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>MUNICIPIO</TableColumn>
                  <TableColumn>ZONA</TableColumn>
                  <TableColumn>MARGEN</TableColumn>
                  <TableColumn>TIPO</TableColumn>
                  <TableColumn>VERSIÓN</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody items={zoneMargins} emptyContent="No hay zonas configuradas.">
                  {(item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.stateName || item.stateId}</TableCell>
                      <TableCell>{item.municipalityName || item.municipalityId}</TableCell>
                      <TableCell>{item.zoneName || item.zoneKey || "Zona"}</TableCell>
                      <TableCell>{formatCurrency(item.marginAmount)}</TableCell>
                      <TableCell>{item.marginType || "fijo"}</TableCell>
                      <TableCell>{item.ruleVersion}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={item.active ? "success" : "default"}>
                          {item.active ? "Activo" : "Inactivo"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Editar">
                            <Button isIconOnly size="sm" variant="light" onPress={() => setZoneDraft({
                              id: item._id,
                              stateId: item.stateId || "",
                              stateName: item.stateName || "",
                              municipalityId: item.municipalityId || "",
                              municipalityName: item.municipalityName || "",
                              zoneKey: (item.zoneKey || "Zona 1") as ZoneDraft["zoneKey"],
                              zoneName: item.zoneName || item.zoneKey || "Zona 1",
                              marginAmount: String(item.marginAmount),
                              active: item.active,
                              ruleVersion: String(item.ruleVersion || ""),
                              notes: item.notes || "",
                            })}>
                              <PencilSquareIcon className="size-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Eliminar" color="danger">
                            <Button isIconOnly size="sm" variant="light" onPress={async () => {
                              try {
                                await removeZone({ id: item._id as Id<"pricingZoneMargins"> });
                                addToast({ title: "Zona eliminada", color: "success" });
                              } catch {
                                addToast({ title: "Error", description: "No se pudo eliminar la zona.", color: "danger" });
                              }
                            }}>
                              <TrashIcon className="size-4 text-danger" />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tab>

          <Tab
            key="levels"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <CurrencyDollarIcon className="size-4" />
                <span>Niveles de cliente</span>
              </div>
            }
          >
            <div className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button color="primary" variant="flat" startContent={<PlusIcon className="size-4" />} onPress={() => setLevelDraft({ ...defaultLevelDraft })}>
                  Nuevo nivel
                </Button>
              </div>
              {levelForm}
              <Table aria-label="Niveles de cliente" removeWrapper>
                <TableHeader>
                  <TableColumn>CÓDIGO</TableColumn>
                  <TableColumn>NOMBRE</TableColumn>
                  <TableColumn>META</TableColumn>
                  <TableColumn>DESCUENTO</TableColumn>
                  <TableColumn>VERSIÓN</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody items={customerLevels} emptyContent="No hay niveles configurados.">
                  {(item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.minMonthlyAmount ? formatCurrency(item.minMonthlyAmount) : "—"}</TableCell>
                      <TableCell>{formatPercent(item.discountPct)}</TableCell>
                      <TableCell>{item.ruleVersion}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={item.active ? "success" : "default"}>
                          {item.active ? "Activo" : "Inactivo"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Editar">
                            <Button isIconOnly size="sm" variant="light" onPress={() => setLevelDraft({
                              id: item._id,
                              code: item.code,
                              name: item.name,
                              minMonthlyAmount: item.minMonthlyAmount === undefined ? "" : String(item.minMonthlyAmount),
                              discountPct: String(item.discountPct),
                              active: item.active,
                              ruleVersion: String(item.ruleVersion || ""),
                              description: item.description || "",
                            })}>
                              <PencilSquareIcon className="size-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Eliminar" color="danger">
                            <Button isIconOnly size="sm" variant="light" onPress={async () => {
                              try {
                                await removeLevel({ id: item._id as Id<"pricingCustomerLevels"> });
                                addToast({ title: "Nivel eliminado", color: "success" });
                              } catch {
                                addToast({ title: "Error", description: "No se pudo eliminar el nivel.", color: "danger" });
                              }
                            }}>
                              <TrashIcon className="size-4 text-danger" />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tab>

          <Tab
            key="settings"
            title={
              <div className="flex items-center space-x-2 text-sm">
                <Cog6ToothIcon className="size-4" />
                <span>Configuración</span>
              </div>
            }
          >
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-default-200">
                  <CardBody className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Motor dinámico</p>
                        <p className="text-tiny text-default-500">Activa o desactiva el cálculo dinámico.</p>
                      </div>
                      <Switch isSelected={dynamicEnabled} onValueChange={(value) => handleSettingToggle("dynamicPricingEnabled", value)}>
                        {dynamicEnabled ? "Activo" : "Inactivo"}
                      </Switch>
                    </div>
                  </CardBody>
                </Card>
                <Card className="border border-default-200">
                  <CardBody className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Fallback legacy</p>
                        <p className="text-tiny text-default-500">Mantiene compatibilidad con precios existentes.</p>
                      </div>
                      <Switch isSelected={legacyFallbackEnabled} onValueChange={(value) => handleSettingToggle("legacyFallbackEnabled", value)}>
                        {legacyFallbackEnabled ? "Activo" : "Inactivo"}
                      </Switch>
                    </div>
                  </CardBody>
                </Card>
              </div>
              <Table aria-label="Configuración de pricing" removeWrapper>
                <TableHeader>
                  <TableColumn>LLAVE</TableColumn>
                  <TableColumn>VALOR</TableColumn>
                  <TableColumn>ACTUALIZADO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody items={settings as PricingSetting[]} emptyContent="No hay configuraciones registradas.">
                  {(item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.key}</TableCell>
                      <TableCell>{item.value}</TableCell>
                      <TableCell>{item.updatedAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Input
                            size="sm"
                            variant="bordered"
                            value={settingDrafts[item.key] ?? item.value}
                            onValueChange={(value) => setSettingDrafts((prev) => ({ ...prev, [item.key]: value }))}
                          />
                          <Button size="sm" color="primary" onPress={async () => {
                            try {
                              await setSetting({ key: item.key, value: settingDrafts[item.key] ?? item.value });
                              addToast({ title: "Configuración actualizada", color: "success" });
                            } catch {
                              addToast({ title: "Error", description: "No se pudo guardar la configuración.", color: "danger" });
                            }
                          }}>
                            Guardar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

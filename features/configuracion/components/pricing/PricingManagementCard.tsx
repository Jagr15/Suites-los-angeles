"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
import {
  FIXED_CUSTOMER_LEVEL_LABELS,
  FIXED_CUSTOMER_LEVEL_ORDER,
  FIXED_CUSTOMER_LEVELS,
  type FixedCustomerLevelCode,
} from "@/shared/pricing/customer-levels";

type TierDraft = {
  id?: string;
  upperLimit: string;
  basePrice: string;
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
  monthlyLimit?: number;
  minMonthlyAmount?: number;
  discountPct: number;
  active: boolean;
  ruleVersion: number;
  description?: string;
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

type LevelDraftState = { monthlyLimit: string; discountPct: string };

type LevelEditDraft = {
  code: FixedCustomerLevelCode;
  monthlyLimit: string;
  discountPct: string;
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

export function PricingManagementCard() {
  const productsRawQuery = useQuery(api.products.queries.list);
  const productTiersQuery = useQuery(api.pricing.queries.listProductTiers);
  const zoneMarginsQuery = useQuery(api.pricing.queries.listZoneMargins);
  const customerLevelsQuery = useQuery(api.pricing.queries.listCustomerLevels);
  const settingsQuery = useQuery(api.pricing.queries.listSettings);

  const syncProductPriceRanges = useMutation(api.pricing.mutations.syncProductPriceRanges);
  const upsertZone = useMutation(api.pricing.mutations.upsertZoneMargin);
  const removeZone = useMutation(api.pricing.mutations.removeZoneMargin);
  const upsertLevel = useMutation(api.pricing.mutations.upsertCustomerLevel);
  const syncFixedCustomerLevels = useMutation(api.pricing.mutations.syncFixedCustomerLevels);
  const setSetting = useMutation(api.pricing.mutations.setPricingSetting);

  const products = useMemo<ProductOption[]>(() => {
    return (productsRawQuery || []).map((product) => ({
      _id: String(product._id),
      producto: String(product.producto || ""),
      sku: String(product.sku || ""),
    }));
  }, [productsRawQuery]);

  const productTiers = useMemo(
    () => (productTiersQuery || []) as PricingProductTierItem[],
    [productTiersQuery]
  );
  const zoneMargins = useMemo(
    () => (zoneMarginsQuery || []) as PricingZoneMarginItem[],
    [zoneMarginsQuery]
  );
  const customerLevels = useMemo(
    () => (customerLevelsQuery || []) as PricingCustomerLevelItem[],
    [customerLevelsQuery]
  );
  const settings = useMemo(
    () => (settingsQuery || []) as PricingSetting[],
    [settingsQuery]
  );

  const [activeTab, setActiveTab] = useState("tiers");
  const [tierDraft, setTierDraft] = useState<TierDraft | null>(null);
  const [zoneDraft, setZoneDraft] = useState<ZoneDraft | null>(null);
  const [levelDraftOverrides, setLevelDraftOverrides] = useState<Partial<Record<FixedCustomerLevelCode, LevelDraftState>>>({});
  const [levelEditDraft, setLevelEditDraft] = useState<LevelEditDraft | null>(null);
  const [settingDrafts, setSettingDrafts] = useState<Record<string, string>>({});
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?._id || "");
  const effectiveProductId = selectedProductId || products[0]?._id || "";
  const hasSyncedFixedLevels = useRef(false);

  const productTierRows = useMemo(() => {
    if (!effectiveProductId) return [];
    return [...productTiers]
      .filter((tier) => String(tier.productId) === effectiveProductId)
      .sort((a, b) => a.minQty - b.minQty);
  }, [productTiers, effectiveProductId]);

  const settingsMap = useMemo(() => {
    return new Map<string, PricingSetting>(settings.map((item) => [item.key, item]));
  }, [settings]);

  const dynamicEnabled = settingsMap.get("dynamicPricingEnabled")?.value !== "false";
  const legacyFallbackEnabled = settingsMap.get("legacyFallbackEnabled")?.value !== "false";

  useEffect(() => {
    if (hasSyncedFixedLevels.current) return;
    hasSyncedFixedLevels.current = true;
    void syncFixedCustomerLevels();
  }, [syncFixedCustomerLevels]);

  const fixedLevelRows = useMemo(() => {
    const byCode = new Map(customerLevels.map((item) => [String(item.code).trim().toUpperCase(), item]));
    return FIXED_CUSTOMER_LEVELS.map((fixed) => {
      const item = byCode.get(fixed.code);
      return {
        fixed,
        item,
        monthlyLimit: item?.monthlyLimit ?? item?.minMonthlyAmount ?? fixed.monthlyLimit,
        discountPct: item?.discountPct ?? 0,
      };
    });
  }, [customerLevels]);

  const levelDrafts = useMemo(() => {
    const next: Record<FixedCustomerLevelCode, LevelDraftState> = {
      BRONCE: { monthlyLimit: "", discountPct: "0" },
      PLATA: { monthlyLimit: "", discountPct: "0" },
      ORO: { monthlyLimit: "", discountPct: "0" },
      DIAMANTE: { monthlyLimit: "", discountPct: "0" },
      ULTRA: { monthlyLimit: "", discountPct: "0" },
    };

    for (const row of fixedLevelRows) {
      next[row.fixed.code] = {
        monthlyLimit: typeof row.monthlyLimit === "number" ? String(row.monthlyLimit) : "",
        discountPct: String(row.discountPct ?? 0),
      };
    }

    for (const code of FIXED_CUSTOMER_LEVEL_ORDER) {
      const override = levelDraftOverrides[code];
      if (!override) continue;
      next[code] = {
        monthlyLimit: override.monthlyLimit ?? next[code].monthlyLimit,
        discountPct: override.discountPct ?? next[code].discountPct,
      };
    }

    return next;
  }, [fixedLevelRows, levelDraftOverrides]);

  const updateLevelDraft = (
    code: FixedCustomerLevelCode,
    field: keyof LevelDraftState,
    value: string
  ) => {
    setLevelDraftOverrides((prev) => {
      const base = levelDrafts[code] ?? { monthlyLimit: "", discountPct: "0" };
      return {
        ...prev,
        [code]: {
          monthlyLimit: field === "monthlyLimit" ? value : (prev[code]?.monthlyLimit ?? base.monthlyLimit),
          discountPct: field === "discountPct" ? value : (prev[code]?.discountPct ?? base.discountPct),
        },
      };
    });
  };

  const openLevelEditor = (code: FixedCustomerLevelCode) => {
    const draft = levelDrafts[code] ?? { monthlyLimit: "", discountPct: "0" };
    setLevelEditDraft({
      code,
      monthlyLimit: draft.monthlyLimit,
      discountPct: draft.discountPct,
    });
  };

  const handleSaveTier = async () => {
    if (!effectiveProductId) {
      addToast({ title: "Producto requerido", description: "Selecciona un producto.", color: "warning" });
      return;
    }
    const upperLimit = parseRequiredNumber(tierDraft?.upperLimit || "");
    const basePrice = parseRequiredNumber(tierDraft?.basePrice || "");
    if (upperLimit <= 0) {
      addToast({ title: "Validación", description: "El límite superior debe ser mayor a 0.", color: "warning" });
      return;
    }
    if (basePrice < 0) {
      addToast({ title: "Validación", description: "El precio base no puede ser negativo.", color: "warning" });
      return;
    }

    const nextRanges: Array<{ id?: string; upperLimit: number; basePrice: number; notes?: string }> = productTierRows.map((tier) => ({
      id: String(tier._id),
      upperLimit: typeof tier.maxQty === "number" ? tier.maxQty : tier.minQty,
      basePrice: tier.basePrice,
      notes: tier.notes || undefined,
    }));

    const draftRange = {
      id: tierDraft?.id as string | undefined,
      upperLimit,
      basePrice,
      notes: undefined,
    };

    const existingIndex = draftRange.id
      ? nextRanges.findIndex((tier) => tier.id === draftRange.id)
      : -1;
    if (existingIndex >= 0) {
      nextRanges[existingIndex] = draftRange;
    } else {
      nextRanges.push(draftRange);
    }

    const ordered = [...nextRanges].sort((a, b) => a.upperLimit - b.upperLimit);
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].upperLimit <= ordered[i - 1].upperLimit) {
        addToast({ title: "Validación", description: "Los límites deben ser ascendentes y sin empates.", color: "warning" });
        return;
      }
    }

    try {
      await syncProductPriceRanges({
        productId: effectiveProductId as Id<"products">,
        ranges: ordered.map((range) => ({
          id: range.id as Id<"pricingProductTiers"> | undefined,
          upperLimit: range.upperLimit,
          basePrice: range.basePrice,
          notes: range.notes,
        })),
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

  const handleSaveLevel = async (code: FixedCustomerLevelCode) => {
    const draft = (levelEditDraft?.code === code ? levelEditDraft : levelDrafts[code]) ?? {
      monthlyLimit: "",
      discountPct: "0",
    };
    const discountPct = parseRequiredNumber(draft?.discountPct || "0");
    const monthlyLimit = code === "ULTRA" ? undefined : parseOptionalNumber(draft?.monthlyLimit || "");

    if (discountPct < 0 || discountPct > 100) {
      addToast({ title: "Validación", description: "El descuento debe estar entre 0 y 100.", color: "warning" });
      return;
    }
    if (code !== "ULTRA" && (typeof monthlyLimit !== "number" || monthlyLimit <= 0)) {
      addToast({ title: "Validación", description: "El límite debe ser mayor a 0.", color: "warning" });
      return;
    }

    const nextDrafts = { ...levelDrafts, [code]: draft };
    const orderedLimits = FIXED_CUSTOMER_LEVEL_ORDER.map((fixedCode) => {
      const raw = nextDrafts[fixedCode]?.monthlyLimit;
      return fixedCode === "ULTRA" ? undefined : parseOptionalNumber(raw || "");
    });
    if (
      (orderedLimits[0] !== undefined && orderedLimits[1] !== undefined && orderedLimits[1] <= orderedLimits[0]) ||
      (orderedLimits[1] !== undefined && orderedLimits[2] !== undefined && orderedLimits[2] <= orderedLimits[1]) ||
      (orderedLimits[2] !== undefined && orderedLimits[3] !== undefined && orderedLimits[3] <= orderedLimits[2])
    ) {
      addToast({ title: "Validación", description: "Los límites deben ser ascendentes y sin empates.", color: "warning" });
      return;
    }

    try {
      await upsertLevel({
        code,
        monthlyLimit,
        discountPct,
      });
      setLevelDraftOverrides((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
      setLevelEditDraft(null);
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

  const selectedProduct = products.find((product) => product._id === effectiveProductId) || null;

  const tierForm = tierDraft ? (
    <Card className="border border-primary/20 bg-primary/5">
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">
              {tierDraft.id ? "Editar rango" : "Nuevo rango"}
            </p>
            <p className="text-tiny text-default-500">
              {selectedProduct ? `${selectedProduct.producto} (${selectedProduct.sku})` : "Selecciona un producto para editar rangos."}
            </p>
          </div>
          <Button variant="light" onPress={() => setTierDraft(null)}>
            Cerrar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Límite superior"
            variant="bordered"
            type="number"
            step="0.01"
            value={tierDraft.upperLimit}
            onValueChange={(value) => setTierDraft({ ...tierDraft, upperLimit: value })}
          />
          <Input
            label="Precio"
            variant="bordered"
            type="number"
            step="0.01"
            value={tierDraft.basePrice}
            onValueChange={(value) => setTierDraft({ ...tierDraft, basePrice: value })}
            startContent={<span className="text-default-400">$</span>}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={() => setTierDraft(null)}>Cancelar</Button>
          <Button color="primary" onPress={handleSaveTier}>Guardar rango</Button>
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

  const levelForm = null;
  const editingLevelRow = levelEditDraft
    ? fixedLevelRows.find((row) => row.fixed.code === levelEditDraft.code) ?? null
    : null;

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
                <Button color="primary" variant="flat" startContent={<PlusIcon className="size-4" />} onPress={() => setTierDraft({ upperLimit: "", basePrice: "" })}>
                  Nuevo rango
                </Button>
              </div>
              {tierForm}
              <Table aria-label="Rangos por producto" removeWrapper>
                <TableHeader>
                  <TableColumn>RANGO</TableColumn>
                  <TableColumn>PRECIO</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody items={productTierRows} emptyContent="No hay rangos configurados para este producto.">
                  {(item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {item.minQty} - {typeof item.maxQty === "number" ? item.maxQty : "∞"}
                          </span>
                          <span className="text-tiny text-default-500">
                            {selectedProduct ? selectedProduct.producto : "Producto"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.basePrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Editar">
                            <Button isIconOnly size="sm" variant="light" onPress={() => setTierDraft({
                              id: item._id,
                              upperLimit: item.maxQty === undefined ? "" : String(item.maxQty),
                              basePrice: String(item.basePrice),
                            })}>
                              <PencilSquareIcon className="size-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Eliminar" color="danger">
                            <Button isIconOnly size="sm" variant="light" onPress={async () => {
                              try {
                                await syncProductPriceRanges({
                                  productId: effectiveProductId as Id<"products">,
                                  ranges: productTierRows
                                    .filter((tier) => tier._id !== item._id)
                                    .map((tier) => ({
                                      id: tier._id as Id<"pricingProductTiers">,
                                      upperLimit: typeof tier.maxQty === "number" ? tier.maxQty : tier.minQty,
                                      basePrice: tier.basePrice,
                                      notes: tier.notes,
                                    })),
                                });
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
              {levelForm}
              <div className="rounded-xl border border-default-200 overflow-hidden">
                <Table aria-label="Niveles fijos de cliente" removeWrapper>
                  <TableHeader>
                    <TableColumn>NIVEL</TableColumn>
                    <TableColumn>LÍMITE DE RANGO</TableColumn>
                    <TableColumn>DESCUENTO / MARGEN</TableColumn>
                    <TableColumn>ACCIONES</TableColumn>
                  </TableHeader>
                  <TableBody items={fixedLevelRows} emptyContent="No hay niveles configurados.">
                    {(row) => {
                      const isUltra = row.fixed.code === "ULTRA";
                      return (
                        <TableRow key={row.fixed.code}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold">{FIXED_CUSTOMER_LEVEL_LABELS[row.fixed.code]}</span>
                              <span className="text-tiny text-default-500">Código: {row.fixed.code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isUltra ? <Chip size="sm" variant="flat" color="default">Sin tope</Chip> : formatCurrency(row.monthlyLimit ?? 0)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span>{row.discountPct ?? 0}%</span>
                              <p className="text-tiny text-default-500">
                                {row.fixed.code === "ULTRA" ? "Solo mayoristas" : "Nombre fijo"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                color="primary"
                                variant="flat"
                                onPress={() => openLevelEditor(row.fixed.code)}
                              >
                                Editar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }}
                  </TableBody>
                </Table>
              </div>
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
      <Modal isOpen={!!levelEditDraft} onOpenChange={(open) => { if (!open) setLevelEditDraft(null); }}>
        <ModalContent>
          {() => {
            const row = editingLevelRow;
            if (!row || !levelEditDraft) return null;
            const isUltra = row.fixed.code === "ULTRA";
            return (
              <>
                <ModalHeader>Editar nivel {FIXED_CUSTOMER_LEVEL_LABELS[row.fixed.code]}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre del nivel"
                    variant="bordered"
                    value={FIXED_CUSTOMER_LEVEL_LABELS[row.fixed.code]}
                    isReadOnly
                  />
                  {isUltra ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Límite de rango</p>
                      <Chip size="sm" variant="flat" color="default">Sin tope</Chip>
                      <p className="text-tiny text-default-500">Solo mayoristas</p>
                    </div>
                  ) : (
                    <Input
                      label="Nuevo límite de rango"
                      variant="bordered"
                      type="text"
                      inputMode="decimal"
                      value={levelEditDraft.monthlyLimit}
                      onValueChange={(value) => {
                        updateLevelDraft(row.fixed.code, "monthlyLimit", value);
                        setLevelEditDraft((prev) => prev ? { ...prev, monthlyLimit: value } : prev);
                      }}
                      startContent={<span className="text-default-400">$</span>}
                    />
                  )}
                  <Input
                    label="Nuevo descuento / margen"
                    variant="bordered"
                    type="text"
                    inputMode="decimal"
                    value={levelEditDraft.discountPct}
                    onValueChange={(value) => {
                      updateLevelDraft(row.fixed.code, "discountPct", value);
                      setLevelEditDraft((prev) => prev ? { ...prev, discountPct: value } : prev);
                    }}
                    endContent={<span className="text-default-400">%</span>}
                  />
                  <p className="text-tiny text-default-500">
                    {isUltra ? "Solo mayoristas" : "Nombre fijo"}
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={() => setLevelEditDraft(null)}>Cancelar</Button>
                  <Button color="primary" onPress={() => void handleSaveLevel(row.fixed.code)}>Guardar</Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </Card>
  );
}

import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type SummaryBucket = "created" | "existing" | "updated" | "omitted" | "errors";

type DemoSummary = Record<SummaryBucket, Record<string, number>> & {
  notes: string[];
  finalCounts: Record<string, number>;
};

type PurchaseItemInput = {
  productId: Id<"products">;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

type SupplierDoc = NonNullable<Awaited<ReturnType<MutationCtx["db"]["get"]>>>;

const TABLES_TO_COUNT = [
  "suppliers",
  "clients",
  "products",
  "bodegas",
  "inventory",
  "purchases",
  "purchase_items",
  "routes",
  "vehicles",
  "salidas",
  "bodega_ingresos",
  "bodega_egresos",
  "loans",
  "credits",
  "finance_accounts",
  "assets",
  "fixedAssetTypes",
  "supplierTransactions",
] as const;

function emptySummary(): DemoSummary {
  return {
    created: {},
    existing: {},
    updated: {},
    omitted: {},
    errors: {},
    notes: [],
    finalCounts: {},
  };
}

function bump(summary: DemoSummary, bucket: SummaryBucket, key: string) {
  summary[bucket][key] = (summary[bucket][key] || 0) + 1;
}

function normalize(value?: string | null) {
  return (value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function addDaysISO(date: string, days: number) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

function demoDate(daysAgo: number) {
  const next = new Date();
  next.setUTCDate(next.getUTCDate() - daysAgo);
  return next.toISOString().split("T")[0];
}

function parseLatLngFromMapsUrl(url?: string | null): { lat: number; lng: number } | null {
  if (!url) return null;
  const decoded = decodeURIComponent(url);
  const qMatch = decoded.match(/[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (qMatch) {
    const lat = Number(qMatch[1]);
    const lng = Number(qMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  const atMatch = decoded.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

async function finalCounts(ctx: MutationCtx) {
  const counts: Record<string, number> = {};
  counts.suppliers = (await ctx.db.query("suppliers").collect()).length;
  counts.clients = (await ctx.db.query("clients").collect()).length;
  counts.products = (await ctx.db.query("products").collect()).length;
  counts.bodegas = (await ctx.db.query("bodegas").collect()).length;
  counts.inventory = (await ctx.db.query("inventory").collect()).length;
  counts.purchases = (await ctx.db.query("purchases").collect()).length;
  counts.purchase_items = (await ctx.db.query("purchase_items").collect()).length;
  counts.routes = (await ctx.db.query("routes").collect()).length;
  counts.vehicles = (await ctx.db.query("vehicles").collect()).length;
  counts.salidas = (await ctx.db.query("salidas").collect()).length;
  counts.bodega_ingresos = (await ctx.db.query("bodega_ingresos").collect()).length;
  counts.bodega_egresos = (await ctx.db.query("bodega_egresos").collect()).length;
  counts.loans = (await ctx.db.query("loans").collect()).length;
  counts.credits = (await ctx.db.query("credits").collect()).length;
  counts.finance_accounts = (await ctx.db.query("finance_accounts").collect()).length;
  counts.assets = (await ctx.db.query("assets").collect()).length;
  counts.fixedAssetTypes = (await ctx.db.query("fixedAssetTypes").collect()).length;
  counts.supplierTransactions = (await ctx.db.query("supplierTransactions").collect()).length;
  return counts;
}

async function ensureSupplier(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    businessName: string;
    name: string;
    rfc: string;
    creditDays: number;
    creditLimit: number;
    contact: { name: string; phone: string; email: string };
    bank: { bankName: string; accountNumber: string; clabe: string };
  }
) {
  const suppliers = await ctx.db.query("suppliers").collect();
  const existing = suppliers.find(
    (supplier) =>
      normalize(supplier.rfc) === normalize(input.rfc) ||
      normalize(supplier.businessName) === normalize(input.businessName) ||
      (normalize(input.businessName).startsWith("mdmx") && normalize(supplier.businessName) === "mdmx")
  );

  if (existing) {
    const patch: Partial<typeof existing> = {};
    if (!existing.name) patch.name = input.name;
    if (!Array.isArray(existing.contacts) || existing.contacts.length === 0) patch.contacts = [input.contact];
    if (!Array.isArray(existing.bankAccounts) || existing.bankAccounts.length === 0) patch.bankAccounts = [input.bank];
    if (typeof existing.creditDays !== "number" || existing.creditDays <= 0) patch.creditDays = input.creditDays;
    if (existing.creditLimit === undefined) patch.creditLimit = input.creditLimit;
    if (existing.currentBalance === undefined) patch.currentBalance = 0;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
      bump(summary, "updated", "suppliers");
      return { ...(existing as object), ...patch, _id: existing._id } as typeof existing;
    }

    bump(summary, "existing", "suppliers");
    return existing;
  }

  const id = await ctx.db.insert("suppliers", {
    businessName: input.businessName,
    name: input.name,
    rfc: input.rfc,
    creditDays: input.creditDays,
    creditLimit: input.creditLimit,
    currentBalance: 0,
    contacts: [input.contact],
    bankAccounts: [input.bank],
  });
  bump(summary, "created", "suppliers");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear proveedor ${input.businessName}`);
  return created;
}

async function ensureBodega(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: { name: string; description: string; address: string; manager: string; phone: string }
) {
  const bodegas = await ctx.db.query("bodegas").collect();
  const existing = bodegas.find((bodega) => normalize(bodega.name) === normalize(input.name));
  if (existing) {
    const patch: Partial<typeof existing> = {};
    const trimmedName = existing.name.trim();
    if (existing.name !== trimmedName) patch.name = trimmedName;
    if (!existing.description) patch.description = input.description;
    if (!existing.address) patch.address = input.address;
    if (!existing.manager) patch.manager = input.manager;
    if (!existing.phone) patch.phone = input.phone;
    if (existing.isActive !== true) patch.isActive = true;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
      bump(summary, "updated", "bodegas");
      return { ...(existing as object), ...patch, _id: existing._id } as typeof existing;
    }

    bump(summary, "existing", "bodegas");
    return existing;
  }

  const id = await ctx.db.insert("bodegas", {
    ...input,
    isActive: true,
  });
  bump(summary, "created", "bodegas");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear bodega ${input.name}`);
  return created;
}

async function ensureFixedAssetType(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: { name: string; description: string; requiresModel: boolean }
) {
  const types = await ctx.db.query("fixedAssetTypes").collect();
  const existing = types.find((type) => normalize(type.name) === normalize(input.name));
  if (existing) {
    bump(summary, "existing", "fixedAssetTypes");
    return existing;
  }
  const id = await ctx.db.insert("fixedAssetTypes", input);
  bump(summary, "created", "fixedAssetTypes");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear tipo de activo ${input.name}`);
  return created;
}

async function ensureVehicle(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: { name: string; brand: string; model: string; plate: string; year: string; acquisitionValue: number }
) {
  const existing = await ctx.db
    .query("vehicles")
    .withIndex("by_plate", (q) => q.eq("plate", input.plate))
    .first();

  if (existing) {
    if (!existing.assetId) {
      const assetId = await ctx.db.insert("assets", {
        name: `Vehiculo: ${input.name}`,
        category: "Equipo de Transporte",
        brand: input.brand,
        model: input.model,
        plate: input.plate,
        year: input.year,
        acquisitionValue: input.acquisitionValue,
        acquisitionDate: todayISO(),
        usefulLifeYears: 5,
        serialNumber: `DEMO-${input.plate}`,
        status: "Activo",
        vehicleId: existing._id,
      });
      await ctx.db.patch(existing._id, { assetId });
      bump(summary, "updated", "vehicles");
      return { ...existing, assetId };
    }
    bump(summary, "existing", "vehicles");
    return existing;
  }

  const vehicleId = await ctx.db.insert("vehicles", {
    ...input,
    isActive: true,
    acquisitionDate: todayISO(),
    usefulLifeYears: 5,
  });
  const assetId = await ctx.db.insert("assets", {
    name: `Vehiculo: ${input.name}`,
    category: "Equipo de Transporte",
    brand: input.brand,
    model: input.model,
    plate: input.plate,
    year: input.year,
    acquisitionValue: input.acquisitionValue,
    acquisitionDate: todayISO(),
    usefulLifeYears: 5,
    serialNumber: `DEMO-${input.plate}`,
    status: "Activo",
    vehicleId,
  });
  await ctx.db.patch(vehicleId, { assetId });
  bump(summary, "created", "vehicles");
  bump(summary, "created", "assets");
  const created = await ctx.db.get(vehicleId);
  if (!created) throw new Error(`No se pudo crear vehiculo ${input.plate}`);
  return created;
}

async function ensureCategory(ctx: MutationCtx, summary: DemoSummary, name: string) {
  const categories = await ctx.db.query("product_categories").collect();
  const existing = categories.find((category) => normalize(category.name) === normalize(name));
  if (existing) {
    bump(summary, "existing", "product_categories");
    return existing;
  }
  const id = await ctx.db.insert("product_categories", { name });
  bump(summary, "created", "product_categories");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear categoria ${name}`);
  return created;
}

async function ensureProduct(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    sku: string;
    codigo: string;
    producto: string;
    categoria: string;
    costo: string;
    mayoreo: string;
    venta: string;
  }
) {
  const bySku = await ctx.db.query("products").withIndex("by_sku", (q) => q.eq("sku", input.sku)).first();
  const byCodigo = await ctx.db
    .query("products")
    .withIndex("by_codigo", (q) => q.eq("codigo", input.codigo))
    .first();
  const existing = bySku || byCodigo;

  if (existing) {
    const patch: Partial<typeof existing> = {};
    if (existing.status !== "Activo") patch.status = "Activo";
    if (!existing.categoria) patch.categoria = input.categoria;
    if (!existing.lista1) patch.lista1 = input.costo;
    if (!existing.lista6) patch.lista6 = input.mayoreo;
    if (!existing.lista11) patch.lista11 = input.venta;
    if (existing.stock === undefined) patch.stock = 0;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
      bump(summary, "updated", "products");
      return { ...(existing as object), ...patch, _id: existing._id } as typeof existing;
    }
    bump(summary, "existing", "products");
    return existing;
  }

  const id = await ctx.db.insert("products", {
    sku: input.sku,
    codigo: input.codigo,
    producto: input.producto,
    cantidadEmpaque: "Pieza",
    categoria: input.categoria,
    subcategoria: "",
    status: "Activo",
    lista1: input.costo,
    lista2: input.costo,
    lista3: input.costo,
    lista4: input.costo,
    lista5: input.costo,
    lista6: input.mayoreo,
    lista7: input.mayoreo,
    lista8: input.mayoreo,
    lista9: input.mayoreo,
    lista10: input.mayoreo,
    lista11: input.venta,
    lista12: input.venta,
    lista13: input.venta,
    lista14: input.venta,
    lista15: input.venta,
    stock: 0,
  });
  bump(summary, "created", "products");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear producto ${input.sku}`);
  return created;
}

async function pickOperationalUsers(ctx: MutationCtx) {
  const users = await ctx.db.query("users").collect();
  const vendedor =
    users.find((user) => normalize(user.role) === "vendedor" && user.isActive !== false) ||
    users.find((user) => normalize(user.role) === "bodeguero" && user.isActive !== false) ||
    users.find((user) => user.isActive !== false);
  const bodeguero =
    users.find((user) => normalize(user.role) === "bodeguero" && user.isActive !== false) || vendedor;
  return { vendedor, bodeguero };
}

async function ensureRoute(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    name: string;
    destination: string;
    assignedUserId?: Id<"users">;
    assignedProfileId?: Id<"profiles">;
    assetId?: Id<"assets">;
    startLat: number;
    startLng: number;
    stops: { name: string; lat: number; lng: number }[];
  }
) {
  const existing = await ctx.db.query("routes").withIndex("by_name", (q) => q.eq("name", input.name)).first();
  if (existing) {
    const patch: Partial<typeof existing> = {};
    if (!existing.assignedUserId && input.assignedUserId) patch.assignedUserId = input.assignedUserId;
    if (!existing.assignedProfileId && input.assignedProfileId) patch.assignedProfileId = input.assignedProfileId;
    if (!existing.assetId && input.assetId) patch.assetId = input.assetId;
    if (existing.isActive !== true) patch.isActive = true;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
      bump(summary, "updated", "routes");
      return { ...(existing as object), ...patch, _id: existing._id } as typeof existing;
    }
    bump(summary, "existing", "routes");
    return existing;
  }

  const id = await ctx.db.insert("routes", {
    name: input.name,
    destination: input.destination,
    deliveryType: "sucursal",
    assignedUserId: input.assignedUserId,
    assignedProfileId: input.assignedProfileId,
    assetId: input.assetId,
    operationDays: ["L", "M", "X", "J", "V"],
    loadDay: "L",
    isActive: true,
    requireGpsValidation: true,
    gpsRadiusLimit: 100,
    allowLocationUpdate: true,
    requireKmTracking: true,
    allowOffHoursSales: false,
    requireVisitOrder: true,
    allowNoSaleCheckIn: true,
    requireMinVisitTime: true,
    minVisitTimeMinutes: 5,
    startLat: input.startLat,
    startLng: input.startLng,
    stops: input.stops,
  });
  bump(summary, "created", "routes");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear ruta ${input.name}`);
  return created;
}

async function patchExistingRoutesWithProfiles(ctx: MutationCtx, summary: DemoSummary) {
  const routes = await ctx.db.query("routes").collect();
  for (const route of routes) {
    if (!route.assignedUserId || route.assignedProfileId) continue;
    const user = await ctx.db.get(route.assignedUserId);
    if (!user?.profileId) continue;
    await ctx.db.patch(route._id, { assignedProfileId: user.profileId });
    bump(summary, "updated", "routes");
  }
}

async function ensureClient(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    commercialName: string;
    buyerName: string;
    businessName: string;
    rfc: string;
    mapsUrl: string;
    stateId: string;
    stateName: string;
    municipalityId: string;
    municipalityName: string;
    townId: string;
    townName: string;
    lat: number;
    lng: number;
    creditLimit: number;
    creditDays: number;
    assignedRouteId?: Id<"routes">;
    assignedRouteName?: string;
    visitOrder: number;
  }
) {
  const clients = await ctx.db.query("clients").collect();
  const existing = clients.find(
    (client) =>
      normalize(client.commercialName) === normalize(input.commercialName) ||
      (input.rfc && normalize(client.rfc) === normalize(input.rfc))
  );
  if (existing) {
    const patch: Partial<typeof existing> = {};
    if (typeof existing.lat !== "number") patch.lat = input.lat;
    if (typeof existing.lng !== "number") patch.lng = input.lng;
    if (!existing.assignedRouteId && input.assignedRouteId) patch.assignedRouteId = input.assignedRouteId;
    if (!existing.assignedRouteName && input.assignedRouteName) patch.assignedRouteName = input.assignedRouteName;
    if (!existing.businessName) patch.businessName = input.businessName;
    if (!existing.rfc) patch.rfc = input.rfc;
    if (existing.creditLimit === undefined) patch.creditLimit = input.creditLimit;
    if (existing.creditDays === undefined) patch.creditDays = input.creditDays;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(existing._id, patch);
      bump(summary, "updated", "clients");
      return { ...(existing as object), ...patch, _id: existing._id } as typeof existing;
    }
    bump(summary, "existing", "clients");
    return existing;
  }

  const id = await ctx.db.insert("clients", {
    commercialName: input.commercialName,
    buyerName: input.buyerName,
    requiresInvoice: true,
    businessName: input.businessName,
    rfc: input.rfc,
    taxRegime: "RESICO",
    mapsUrl: input.mapsUrl,
    townId: input.townId,
    townName: input.townName,
    municipalityId: input.municipalityId,
    municipalityName: input.municipalityName,
    stateId: input.stateId,
    stateName: input.stateName,
    visitFrequency: "Semanal",
    assignedRouteId: input.assignedRouteId,
    assignedRouteName: input.assignedRouteName,
    creditLimit: input.creditLimit,
    creditDays: input.creditDays,
    availableScheduleStart: "09:00",
    availableScheduleEnd: "18:00",
    lat: input.lat,
    lng: input.lng,
    visitOrder: input.visitOrder,
  });
  bump(summary, "created", "clients");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear cliente ${input.commercialName}`);
  return created;
}

async function patchExistingClientsLocation(ctx: MutationCtx, summary: DemoSummary) {
  const clients = await ctx.db.query("clients").collect();
  const fallbackByMunicipality: Record<string, { lat: number; lng: number }> = {
    colima: { lat: 19.2433, lng: -103.7247 },
    "villa de alvarez": { lat: 19.2676, lng: -103.7465 },
    tecoman: { lat: 18.9172, lng: -103.8778 },
  };
  const fallbackPoints = [
    { lat: 19.6415, lng: -98.9122 },
    { lat: 19.6379, lng: -98.9246 },
  ];
  let index = 0;
  for (const client of clients) {
    if (typeof client.lat === "number" && typeof client.lng === "number") continue;
    const mapsPoint = parseLatLngFromMapsUrl(client.mapsUrl);
    const municipalityPoint = fallbackByMunicipality[normalize(client.municipalityName)];
    const point = mapsPoint || municipalityPoint || fallbackPoints[index % fallbackPoints.length];
    index += 1;
    await ctx.db.patch(client._id, {
      lat: point.lat,
      lng: point.lng,
    });
    bump(summary, "updated", "clients");
  }
}

async function nextPurchaseFolio(ctx: MutationCtx) {
  const existing = await ctx.db
    .query("sequences")
    .withIndex("by_key", (q) => q.eq("key", "purchase_folio"))
    .unique();
  if (existing) {
    const next = existing.value + 1;
    await ctx.db.patch(existing._id, { value: next });
    return { folioNumber: next, folio: `C-${String(next).padStart(5, "0")}` };
  }

  const purchases = await ctx.db.query("purchases").collect();
  let maxLegacy = 0;
  for (const purchase of purchases) {
    const folioNumber = purchase.folioNumber || Number((purchase.folio || "").match(/(\d+)$/)?.[1] || 0);
    if (Number.isFinite(folioNumber) && folioNumber > maxLegacy) maxLegacy = folioNumber;
  }
  const next = maxLegacy + 1;
  await ctx.db.insert("sequences", { key: "purchase_folio", value: next });
  return { folioNumber: next, folio: `C-${String(next).padStart(5, "0")}` };
}

async function applyInventoryDelta(
  ctx: MutationCtx,
  summary: DemoSummary,
  args: {
    bodegaId: Id<"bodegas">;
    items: PurchaseItemInput[];
    folio: string;
    purchaseId: Id<"purchases">;
  }
) {
  for (const item of args.items) {
    const existingInventory = await ctx.db
      .query("inventory")
      .withIndex("by_product_bodega", (q) =>
        q.eq("productId", item.productId).eq("bodegaId", args.bodegaId)
      )
      .unique();

    const previousStock = existingInventory?.quantity || 0;
    const newStock = previousStock + item.quantity;
    if (existingInventory) {
      await ctx.db.patch(existingInventory._id, { quantity: newStock });
      bump(summary, "updated", "inventory");
    } else {
      await ctx.db.insert("inventory", {
        productId: item.productId,
        bodegaId: args.bodegaId,
        quantity: newStock,
      });
      bump(summary, "created", "inventory");
    }

    const product = await ctx.db.get(item.productId);
    if (product) {
      await ctx.db.patch(item.productId, { stock: (product.stock || 0) + item.quantity });
      bump(summary, "updated", "products");
    }

    await ctx.db.insert("inventoryLogs", {
      productId: item.productId,
      bodegaId: args.bodegaId,
      type: "entrada",
      previousStock,
      quantity: item.quantity,
      newStock,
      reason: `Entrada por compra Folio: ${args.folio}`,
      referenceId: args.purchaseId,
      date: new Date().toISOString(),
    });
    bump(summary, "created", "inventoryLogs");
  }
}

async function recomputeSupplierBalance(ctx: MutationCtx, supplierId: Id<"suppliers">) {
  const transactions = await ctx.db
    .query("supplierTransactions")
    .withIndex("by_supplierId", (q) => q.eq("supplierId", supplierId))
    .collect();
  const sorted = [...transactions].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a._creationTime - b._creationTime;
  });

  let running = 0;
  for (const tx of sorted) {
    running += tx.type === "Cargo" ? tx.amount : -tx.amount;
    if (tx.balanceAfter !== running) {
      await ctx.db.patch(tx._id, { balanceAfter: running });
    }
  }
  await ctx.db.patch(supplierId, { currentBalance: running });
}

async function ensurePurchase(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    marker: string;
    supplierId: Id<"suppliers">;
    bodegaId: Id<"bodegas">;
    supplierCreditDays: number;
    date: string;
    status: "Pendiente" | "Pagado" | "Cancelado" | "Vencido";
    receptionStatus: "Completa" | "Faltante" | "Pendiente";
    items: PurchaseItemInput[];
  }
) {
  const existing = (await ctx.db.query("purchases").collect()).find((purchase) =>
    (purchase.notes || "").includes(input.marker)
  );
  if (existing) {
    bump(summary, "existing", "purchases");
    return existing;
  }

  const totalAmount = input.items.reduce((acc, item) => acc + item.totalCost, 0);
  const folio = await nextPurchaseFolio(ctx);
  const purchaseId = await ctx.db.insert("purchases", {
    supplierId: input.supplierId,
    bodegaId: input.bodegaId,
    folio: folio.folio,
    folioNumber: folio.folioNumber,
    date: input.date,
    dueDate: addDaysISO(input.date, input.supplierCreditDays),
    totalAmount,
    remainingAmount: input.status === "Pagado" || input.status === "Cancelado" ? 0 : totalAmount,
    stockApplied: input.status !== "Cancelado" && input.receptionStatus === "Completa",
    status: input.status,
    receptionStatus: input.receptionStatus,
    notes: `${input.marker} | Compra demo idempotente`,
  });
  bump(summary, "created", "purchases");

  for (const item of input.items) {
    await ctx.db.insert("purchase_items", {
      purchaseId,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
    });
    bump(summary, "created", "purchase_items");
  }

  if (input.status !== "Cancelado" && input.receptionStatus === "Completa") {
    await applyInventoryDelta(ctx, summary, {
      bodegaId: input.bodegaId,
      items: input.items,
      folio: folio.folio,
      purchaseId,
    });
  }

  if (input.status !== "Cancelado") {
    await ctx.db.insert("supplierTransactions", {
      supplierId: input.supplierId,
      date: input.date,
      type: "Cargo",
      amount: totalAmount,
      balanceAfter: 0,
      status: input.status,
      category: "Compra",
      description: `Compra Folio: ${folio.folio}`,
      referenceId: purchaseId,
    });
    bump(summary, "created", "supplierTransactions");
  }

  await recomputeSupplierBalance(ctx, input.supplierId);
  const created = await ctx.db.get(purchaseId);
  if (!created) throw new Error(`No se pudo crear compra ${input.marker}`);
  return created;
}

async function ensureBodegaCategory(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: { name: string; type: "ingreso" | "egreso" }
) {
  const categories = await ctx.db
    .query("bodega_categorias")
    .withIndex("by_type", (q) => q.eq("type", input.type))
    .collect();
  const existing = categories.find((category) => normalize(category.name) === normalize(input.name));
  if (existing) {
    if (existing.isActive !== true) {
      await ctx.db.patch(existing._id, { isActive: true });
      bump(summary, "updated", "bodega_categorias");
    } else {
      bump(summary, "existing", "bodega_categorias");
    }
    return existing;
  }
  const id = await ctx.db.insert("bodega_categorias", {
    name: input.name,
    type: input.type,
    isActive: true,
  });
  bump(summary, "created", "bodega_categorias");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear categoria de bodega ${input.name}`);
  return created;
}

async function ensureIngreso(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    marker: string;
    bodegaId: Id<"bodegas">;
    categoryId: Id<"bodega_categorias">;
    amount: number;
    date: string;
    responsibleId?: Id<"profiles">;
    responsibleName: string;
    responsibleGroup: string;
    clientName?: string;
  }
) {
  const existing = (await ctx.db.query("bodega_ingresos").collect()).find((ingreso) =>
    (ingreso.notes || "").includes(input.marker)
  );
  if (existing) {
    bump(summary, "existing", "bodega_ingresos");
    return existing;
  }
  const id = await ctx.db.insert("bodega_ingresos", {
    bodegaId: input.bodegaId,
    amount: input.amount,
    categoryId: input.categoryId,
    date: input.date,
    responsibleId: input.responsibleId,
    responsibleName: input.responsibleName,
    responsibleGroup: input.responsibleGroup,
    clientName: input.clientName,
    notes: `${input.marker} | Ingreso demo`,
  });
  bump(summary, "created", "bodega_ingresos");
  return await ctx.db.get(id);
}

async function ensureEgreso(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    marker: string;
    bodegaId: Id<"bodegas">;
    categoryId: Id<"bodega_categorias">;
    amount: number;
    date: string;
    responsibleId?: Id<"profiles">;
    responsibleName: string;
    responsibleGroup: string;
    provider?: string;
  }
) {
  const existing = (await ctx.db.query("bodega_egresos").collect()).find((egreso) =>
    (egreso.notes || "").includes(input.marker)
  );
  if (existing) {
    bump(summary, "existing", "bodega_egresos");
    return existing;
  }
  const id = await ctx.db.insert("bodega_egresos", {
    bodegaId: input.bodegaId,
    amount: input.amount,
    categoryId: input.categoryId,
    date: input.date,
    responsibleId: input.responsibleId,
    responsibleName: input.responsibleName,
    responsibleGroup: input.responsibleGroup,
    provider: input.provider,
    notes: `${input.marker} | Egreso demo`,
  });
  bump(summary, "created", "bodega_egresos");
  return await ctx.db.get(id);
}

async function ensureSalida(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    numeroSalida: string;
    bodegaId: Id<"bodegas">;
    fecha: string;
    responsable: string;
    almacen: string;
    agente: string;
    ruta: string;
    destino: string;
    items: PurchaseItemInput[];
  }
) {
  const existing = await ctx.db
    .query("salidas")
    .withIndex("by_numeroSalida", (q) => q.eq("numeroSalida", input.numeroSalida))
    .first();
  if (existing) {
    bump(summary, "existing", "salidas");
    return existing;
  }

  const id = await ctx.db.insert("salidas", {
    numeroSalida: input.numeroSalida,
    bodegaId: input.bodegaId,
    fecha: input.fecha,
    status: "Creado",
    responsable: input.responsable,
    tipoEntrega: "Ruta",
    almacen: input.almacen,
    agente: input.agente,
    totalAmount: input.items.reduce((acc, item) => acc + item.totalCost, 0),
    tipo: "carga",
    ruta: input.ruta,
    destino: input.destino,
    items: input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.unitCost,
      subtotal: item.totalCost,
    })),
  });
  bump(summary, "created", "salidas");
  const created = await ctx.db.get(id);
  if (!created) throw new Error(`No se pudo crear salida ${input.numeroSalida}`);
  return created;
}

async function ensureLoan(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    type: "Otorgado" | "Recibido";
    subject: string;
    amount: number;
    interestRate: number;
    termMonths: number;
    frequency: "Semanal" | "Quincenal" | "Mensual";
    startDate: string;
    status: "Activo" | "Liquidado" | "Vencido";
    notes: string;
  }
) {
  const existing = (await ctx.db.query("loans").collect()).find(
    (loan) => normalize(loan.subject) === normalize(input.subject) && loan.amount === input.amount
  );
  if (existing) {
    bump(summary, "existing", "loans");
    return existing;
  }
  const id = await ctx.db.insert("loans", input);
  bump(summary, "created", "loans");
  return await ctx.db.get(id);
}

async function ensureCredit(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    institution: string;
    totalAmount: number;
    downPayment: number;
    remainingCapital: number;
    interestRate: number;
    termMonths: number;
    closingDay: number;
    startDate: string;
    type: "Hipotecario" | "Automotriz" | "Personal" | "Arrendamiento";
  }
) {
  const existing = (await ctx.db.query("credits").collect()).find(
    (credit) => normalize(credit.institution) === normalize(input.institution) && credit.totalAmount === input.totalAmount
  );
  if (existing) {
    bump(summary, "existing", "credits");
    return existing;
  }
  const id = await ctx.db.insert("credits", input);
  bump(summary, "created", "credits");
  return await ctx.db.get(id);
}

async function ensureFinanceAccount(
  ctx: MutationCtx,
  summary: DemoSummary,
  input: {
    alias: string;
    type: "Débito" | "Crédito" | "Caja Chica" | "Caja Fuerte";
    initialBalance: number;
    currentBalance: number;
    currency: string;
  }
) {
  const existing = (await ctx.db.query("finance_accounts").collect()).find(
    (account) => normalize(account.alias) === normalize(input.alias)
  );
  if (existing) {
    bump(summary, "existing", "finance_accounts");
    return existing;
  }
  const id = await ctx.db.insert("finance_accounts", {
    ...input,
    isActive: true,
  });
  bump(summary, "created", "finance_accounts");
  return await ctx.db.get(id);
}

export const createMinimumDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const summary = emptySummary();

    try {
      const { vendedor, bodeguero } = await pickOperationalUsers(ctx);
      if (!vendedor) throw new Error("No hay usuario operativo para asignar rutas demo.");

      const suppliers = await Promise.all([
        ensureSupplier(ctx, summary, {
          businessName: "MDMX Distribuciones",
          name: "MDMX",
          rfc: "MDX240101AA1",
          creditDays: 30,
          creditLimit: 50000,
          contact: { name: "Daniel Mendoza", phone: "555-010-1100", email: "compras@mdmx.demo" },
          bank: { bankName: "BBVA", accountNumber: "0101010101", clabe: "012180001010101011" },
        }),
        ensureSupplier(ctx, summary, {
          businessName: "Hugos Suministros",
          name: "Hugos",
          rfc: "HSU240101BB2",
          creditDays: 15,
          creditLimit: 35000,
          contact: { name: "Hugo Sanchez", phone: "555-010-1200", email: "ventas@hugos.demo" },
          bank: { bankName: "Santander", accountNumber: "0202020202", clabe: "014180002020202022" },
        }),
        ensureSupplier(ctx, summary, {
          businessName: "Proveedor Logistico del Pacifico",
          name: "Pacifico",
          rfc: "PLP240101CC3",
          creditDays: 45,
          creditLimit: 80000,
          contact: { name: "Tatiana Rios", phone: "555-010-1300", email: "logistica@pacifico.demo" },
          bank: { bankName: "Banorte", accountNumber: "0303030303", clabe: "072180003030303033" },
        }),
      ]);

      const bodegas = await Promise.all([
        ensureBodega(ctx, summary, {
          name: "Centro de Distribucion",
          description: "Bodega principal para compras y cargas demo.",
          address: "Av. Principal 100, Colima, Col.",
          manager: "Salvador Ortega",
          phone: "555-010-2100",
        }),
        ensureBodega(ctx, summary, {
          name: "Bodega Norte",
          description: "Punto de apoyo para ruta norte.",
          address: "Blvd. Norte 220, Colima, Col.",
          manager: "Tatiana Ramirez",
          phone: "555-010-2200",
        }),
        ensureBodega(ctx, summary, {
          name: "Bodega Sur",
          description: "Punto de apoyo para ruta sur.",
          address: "Av. Sur 330, Colima, Col.",
          manager: "Daniel Ortega",
          phone: "555-010-2300",
        }),
      ]);

      await Promise.all([
        ensureFixedAssetType(ctx, summary, {
          name: "Equipo de Transporte",
          description: "Unidades usadas para reparto y ruta.",
          requiresModel: true,
        }),
        ensureFixedAssetType(ctx, summary, {
          name: "Equipo de Computo",
          description: "Computadoras, terminales y equipo administrativo.",
          requiresModel: true,
        }),
        ensureFixedAssetType(ctx, summary, {
          name: "Mobiliario",
          description: "Mobiliario operativo y de bodega.",
          requiresModel: false,
        }),
      ]);

      const vehicles = await Promise.all([
        ensureVehicle(ctx, summary, {
          name: "Camioneta LA-001",
          brand: "Nissan",
          model: "NP300",
          plate: "LA-001",
          year: "2023",
          acquisitionValue: 385000,
        }),
        ensureVehicle(ctx, summary, {
          name: "Camioneta LA-002",
          brand: "Toyota",
          model: "Hilux",
          plate: "LA-002",
          year: "2022",
          acquisitionValue: 420000,
        }),
        ensureVehicle(ctx, summary, {
          name: "Camion LA-003",
          brand: "Isuzu",
          model: "Elf",
          plate: "LA-003",
          year: "2021",
          acquisitionValue: 610000,
        }),
      ]);

      const bebidas = await ensureCategory(ctx, summary, "Bebidas");
      const abarrotes = await ensureCategory(ctx, summary, "Abarrotes");

      const products = await Promise.all([
        ensureProduct(ctx, summary, {
          sku: "DEMO-AGUA-600",
          codigo: "AGUA600",
          producto: "Agua 600ml",
          categoria: String(bebidas._id),
          costo: "$5.20",
          mayoreo: "$7.00",
          venta: "$10.00",
        }),
        ensureProduct(ctx, summary, {
          sku: "DEMO-COLA-355",
          codigo: "COLA355",
          producto: "Refresco Cola 355ml",
          categoria: String(bebidas._id),
          costo: "$8.50",
          mayoreo: "$11.00",
          venta: "$15.00",
        }),
        ensureProduct(ctx, summary, {
          sku: "DEMO-BOTANA-045",
          codigo: "BOTANA45",
          producto: "Botana Mix 45g",
          categoria: String(abarrotes._id),
          costo: "$6.80",
          mayoreo: "$9.50",
          venta: "$13.00",
        }),
      ]);

      const vendedorProfileId = vendedor.profileId;
      const routes = await Promise.all([
        ensureRoute(ctx, summary, {
          name: "Ruta Centro",
          destination: "Colima Centro",
          assignedUserId: vendedor._id,
          assignedProfileId: vendedorProfileId,
          assetId: vehicles[0].assetId,
          startLat: 19.2433,
          startLng: -103.7247,
          stops: [{ name: "Jardin Libertad", lat: 19.2437, lng: -103.7252 }],
        }),
        ensureRoute(ctx, summary, {
          name: "Ruta Norte",
          destination: "Villa de Alvarez",
          assignedUserId: vendedor._id,
          assignedProfileId: vendedorProfileId,
          assetId: vehicles[1].assetId,
          startLat: 19.2676,
          startLng: -103.7465,
          stops: [{ name: "Av. Benito Juarez", lat: 19.2712, lng: -103.7428 }],
        }),
        ensureRoute(ctx, summary, {
          name: "Ruta Sur",
          destination: "Tecoman",
          assignedUserId: vendedor._id,
          assignedProfileId: vendedorProfileId,
          assetId: vehicles[2].assetId,
          startLat: 18.9172,
          startLng: -103.8778,
          stops: [{ name: "Centro Tecoman", lat: 18.9148, lng: -103.8751 }],
        }),
      ]);
      await patchExistingRoutesWithProfiles(ctx, summary);

      await patchExistingClientsLocation(ctx, summary);
      const clients = await Promise.all([
        ensureClient(ctx, summary, {
          commercialName: "Abarrotes Daniel",
          buyerName: "Daniel Ortega",
          businessName: "Abarrotes Daniel SA de CV",
          rfc: "ADA240101DD4",
          mapsUrl: "https://www.google.com/maps?q=19.2437,-103.7252",
          stateId: "06",
          stateName: "Colima",
          municipalityId: "002",
          municipalityName: "Colima",
          townId: "0001",
          townName: "Colima",
          lat: 19.2437,
          lng: -103.7252,
          creditLimit: 12000,
          creditDays: 15,
          assignedRouteId: routes[0]._id,
          assignedRouteName: routes[0].name,
          visitOrder: 1,
        }),
        ensureClient(ctx, summary, {
          commercialName: "Mini Super Tatiana",
          buyerName: "Tatiana Rios",
          businessName: "Mini Super Tatiana",
          rfc: "MST240101EE5",
          mapsUrl: "https://www.google.com/maps?q=19.2712,-103.7428",
          stateId: "06",
          stateName: "Colima",
          municipalityId: "010",
          municipalityName: "Villa de Alvarez",
          townId: "0001",
          townName: "Villa de Alvarez",
          lat: 19.2712,
          lng: -103.7428,
          creditLimit: 18000,
          creditDays: 21,
          assignedRouteId: routes[1]._id,
          assignedRouteName: routes[1].name,
          visitOrder: 1,
        }),
        ensureClient(ctx, summary, {
          commercialName: "Tienda Pacifico Sur",
          buyerName: "Laura Perez",
          businessName: "Tienda Pacifico Sur",
          rfc: "TPS240101FF6",
          mapsUrl: "https://www.google.com/maps?q=18.9148,-103.8751",
          stateId: "06",
          stateName: "Colima",
          municipalityId: "009",
          municipalityName: "Tecoman",
          townId: "0001",
          townName: "Tecoman",
          lat: 18.9148,
          lng: -103.8751,
          creditLimit: 15000,
          creditDays: 15,
          assignedRouteId: routes[2]._id,
          assignedRouteName: routes[2].name,
          visitOrder: 1,
        }),
      ]);

      await ensurePurchase(ctx, summary, {
        marker: "DEMO-SEED-COMPRA-001",
        supplierId: suppliers[0]._id,
        bodegaId: bodegas[0]._id,
        supplierCreditDays: suppliers[0].creditDays,
        date: demoDate(7),
        status: "Pendiente",
        receptionStatus: "Completa",
        items: [
          { productId: products[0]._id, quantity: 120, unitCost: 5.2, totalCost: 624 },
          { productId: products[1]._id, quantity: 90, unitCost: 8.5, totalCost: 765 },
        ],
      });
      await ensurePurchase(ctx, summary, {
        marker: "DEMO-SEED-COMPRA-002",
        supplierId: suppliers[1]._id,
        bodegaId: bodegas[0]._id,
        supplierCreditDays: suppliers[1].creditDays,
        date: demoDate(5),
        status: "Pendiente",
        receptionStatus: "Completa",
        items: [
          { productId: products[2]._id, quantity: 160, unitCost: 6.8, totalCost: 1088 },
          { productId: products[0]._id, quantity: 60, unitCost: 5.2, totalCost: 312 },
        ],
      });
      await ensurePurchase(ctx, summary, {
        marker: "DEMO-SEED-COMPRA-003",
        supplierId: suppliers[2]._id,
        bodegaId: bodegas[1]._id,
        supplierCreditDays: suppliers[2].creditDays,
        date: demoDate(3),
        status: "Pendiente",
        receptionStatus: "Completa",
        items: [
          { productId: products[1]._id, quantity: 75, unitCost: 8.5, totalCost: 637.5 },
          { productId: products[2]._id, quantity: 100, unitCost: 6.8, totalCost: 680 },
        ],
      });

      const ingresoCategoria = await ensureBodegaCategory(ctx, summary, { name: "Venta de ruta", type: "ingreso" });
      const cobranzaCategoria = await ensureBodegaCategory(ctx, summary, { name: "Cobranza", type: "ingreso" });
      const combustibleCategoria = await ensureBodegaCategory(ctx, summary, { name: "Combustible", type: "egreso" });
      const mantenimientoCategoria = await ensureBodegaCategory(ctx, summary, { name: "Mantenimiento", type: "egreso" });

      await ensureIngreso(ctx, summary, {
        marker: "DEMO-SEED-INGRESO-001",
        bodegaId: bodegas[0]._id,
        categoryId: ingresoCategoria._id,
        amount: 2450,
        date: demoDate(2),
        responsibleId: vendedor.profileId,
        responsibleName: vendedor.name || "Vendedor Demo",
        responsibleGroup: "Ventas",
        clientName: clients[0].commercialName,
      });
      await ensureIngreso(ctx, summary, {
        marker: "DEMO-SEED-INGRESO-002",
        bodegaId: bodegas[1]._id,
        categoryId: ingresoCategoria._id,
        amount: 3180,
        date: demoDate(1),
        responsibleId: vendedor.profileId,
        responsibleName: vendedor.name || "Vendedor Demo",
        responsibleGroup: "Ventas",
        clientName: clients[1].commercialName,
      });
      await ensureIngreso(ctx, summary, {
        marker: "DEMO-SEED-INGRESO-003",
        bodegaId: bodegas[2]._id,
        categoryId: cobranzaCategoria._id,
        amount: 1850,
        date: todayISO(),
        responsibleId: vendedor.profileId,
        responsibleName: vendedor.name || "Vendedor Demo",
        responsibleGroup: "Ventas",
        clientName: clients[2].commercialName,
      });

      await ensureEgreso(ctx, summary, {
        marker: "DEMO-SEED-EGRESO-001",
        bodegaId: bodegas[0]._id,
        categoryId: combustibleCategoria._id,
        amount: 980,
        date: demoDate(2),
        responsibleId: bodeguero?.profileId,
        responsibleName: bodeguero?.name || "Bodeguero Demo",
        responsibleGroup: "Bodega",
        provider: "Gasolinera Demo",
      });
      await ensureEgreso(ctx, summary, {
        marker: "DEMO-SEED-EGRESO-002",
        bodegaId: bodegas[1]._id,
        categoryId: mantenimientoCategoria._id,
        amount: 1450,
        date: demoDate(1),
        responsibleId: bodeguero?.profileId,
        responsibleName: bodeguero?.name || "Bodeguero Demo",
        responsibleGroup: "Bodega",
        provider: "Taller Demo",
      });
      await ensureEgreso(ctx, summary, {
        marker: "DEMO-SEED-EGRESO-003",
        bodegaId: bodegas[2]._id,
        categoryId: combustibleCategoria._id,
        amount: 760,
        date: todayISO(),
        responsibleId: bodeguero?.profileId,
        responsibleName: bodeguero?.name || "Bodeguero Demo",
        responsibleGroup: "Bodega",
        provider: "Gasolinera Demo",
      });

      await Promise.all([
        ensureSalida(ctx, summary, {
          numeroSalida: "DEMO-SAL-001",
          bodegaId: bodegas[0]._id,
          fecha: todayISO(),
          responsable: vendedor.name || "Vendedor Demo",
          almacen: bodegas[0].name,
          agente: vendedor.name || "Vendedor Demo",
          ruta: routes[0].name,
          destino: routes[0].destination || "Colima Centro",
          items: [
            { productId: products[0]._id, quantity: 24, unitCost: 10, totalCost: 240 },
            { productId: products[1]._id, quantity: 12, unitCost: 15, totalCost: 180 },
          ],
        }),
        ensureSalida(ctx, summary, {
          numeroSalida: "DEMO-SAL-002",
          bodegaId: bodegas[1]._id,
          fecha: todayISO(),
          responsable: vendedor.name || "Vendedor Demo",
          almacen: bodegas[1].name,
          agente: vendedor.name || "Vendedor Demo",
          ruta: routes[1].name,
          destino: routes[1].destination || "Villa de Alvarez",
          items: [
            { productId: products[2]._id, quantity: 36, unitCost: 13, totalCost: 468 },
          ],
        }),
        ensureSalida(ctx, summary, {
          numeroSalida: "DEMO-SAL-003",
          bodegaId: bodegas[2]._id,
          fecha: todayISO(),
          responsable: vendedor.name || "Vendedor Demo",
          almacen: bodegas[2].name,
          agente: vendedor.name || "Vendedor Demo",
          ruta: routes[2].name,
          destino: routes[2].destination || "Tecoman",
          items: [
            { productId: products[0]._id, quantity: 18, unitCost: 10, totalCost: 180 },
            { productId: products[2]._id, quantity: 24, unitCost: 13, totalCost: 312 },
          ],
        }),
      ]);

      await Promise.all([
        ensureLoan(ctx, summary, {
          type: "Otorgado",
          subject: "Prestamo empleado Daniel",
          amount: 5000,
          interestRate: 0,
          termMonths: 5,
          frequency: "Quincenal",
          startDate: demoDate(10),
          status: "Activo",
          notes: "DEMO-SEED-LOAN-001",
        }),
        ensureLoan(ctx, summary, {
          type: "Recibido",
          subject: "Capital operativo Tatiana",
          amount: 25000,
          interestRate: 2.5,
          termMonths: 12,
          frequency: "Mensual",
          startDate: demoDate(20),
          status: "Activo",
          notes: "DEMO-SEED-LOAN-002",
        }),
        ensureLoan(ctx, summary, {
          type: "Otorgado",
          subject: "Anticipo ruta norte",
          amount: 3500,
          interestRate: 0,
          termMonths: 3,
          frequency: "Semanal",
          startDate: demoDate(5),
          status: "Activo",
          notes: "DEMO-SEED-LOAN-003",
        }),
      ]);

      await Promise.all([
        ensureCredit(ctx, summary, {
          institution: "BBVA Demo",
          totalAmount: 150000,
          downPayment: 20000,
          remainingCapital: 130000,
          interestRate: 18.5,
          termMonths: 24,
          closingDay: 15,
          startDate: demoDate(60),
          type: "Personal",
        }),
        ensureCredit(ctx, summary, {
          institution: "Banorte Vehicular Demo",
          totalAmount: 420000,
          downPayment: 80000,
          remainingCapital: 340000,
          interestRate: 14.2,
          termMonths: 48,
          closingDay: 20,
          startDate: demoDate(90),
          type: "Automotriz",
        }),
        ensureCredit(ctx, summary, {
          institution: "Arrendadora Pacifico Demo",
          totalAmount: 260000,
          downPayment: 50000,
          remainingCapital: 210000,
          interestRate: 16,
          termMonths: 36,
          closingDay: 5,
          startDate: demoDate(45),
          type: "Arrendamiento",
        }),
      ]);

      await Promise.all([
        ensureFinanceAccount(ctx, summary, {
          alias: "Caja Chica Centro",
          type: "Caja Chica",
          initialBalance: 10000,
          currentBalance: 10000,
          currency: "MXN",
        }),
        ensureFinanceAccount(ctx, summary, {
          alias: "Cuenta Operativa BBVA",
          type: "Débito",
          initialBalance: 75000,
          currentBalance: 75000,
          currency: "MXN",
        }),
        ensureFinanceAccount(ctx, summary, {
          alias: "Caja Fuerte Principal",
          type: "Caja Fuerte",
          initialBalance: 50000,
          currentBalance: 50000,
          currency: "MXN",
        }),
      ]);

      summary.finalCounts = await finalCounts(ctx);
      summary.notes.push("Seed demo ejecutado de forma idempotente. No borra datos existentes.");
      summary.notes.push("Campos no existentes en schema se mapearon a estructuras reales compatibles.");
      return summary;
    } catch (error) {
      bump(summary, "errors", "createMinimumDemoData");
      summary.notes.push(error instanceof Error ? error.message : "Error desconocido al crear datos demo.");
      summary.finalCounts = await finalCounts(ctx);
      return summary;
    }
  },
});

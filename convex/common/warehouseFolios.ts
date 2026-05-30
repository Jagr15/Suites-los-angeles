import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export type WarehouseMovementType = "entrada" | "salida" | "ingreso" | "egreso";

export function numberToWarehouseCode(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "A";
  let x = Math.floor(n);
  let code = "";
  while (x > 0) {
    x -= 1;
    code = String.fromCharCode(65 + (x % 26)) + code;
    x = Math.floor(x / 26);
  }
  return code;
}

export async function ensureWarehouseCode(
  ctx: MutationCtx,
  bodegaId: Id<"bodegas">
): Promise<string> {
  const bodega = await ctx.db.get(bodegaId);
  if (!bodega) throw new Error("Bodega no encontrada.");
  if ((bodega as any).code) return String((bodega as any).code);

  const allBodegas = await ctx.db.query("bodegas").collect();
  const ordered = [...allBodegas].sort((a, b) => a._creationTime - b._creationTime);
  const index = ordered.findIndex((b) => String(b._id) === String(bodegaId));
  const code = numberToWarehouseCode(index + 1);
  await ctx.db.patch(bodegaId, { code });
  return code;
}

export async function getNextWarehouseMovementFolio(
  ctx: MutationCtx,
  bodegaId: Id<"bodegas">,
  type: WarehouseMovementType
): Promise<{ folio: string; folioNumber: number; warehouseCode: string }> {
  const warehouseCode = await ensureWarehouseCode(ctx, bodegaId);
  const key = `warehouse_folio:${String(bodegaId)}:${type}`;
  const seq = await ensureWarehouseMovementSequence(ctx, bodegaId, type);
  const next = seq.value + 1;
  await ctx.db.patch(seq._id, { value: next });
  return { folio: `${warehouseCode}-${next}`, folioNumber: next, warehouseCode };
}

export async function ensureWarehouseMovementSequence(
  ctx: MutationCtx,
  bodegaId: Id<"bodegas">,
  type: WarehouseMovementType
): Promise<{ _id: Id<"sequences">; key: string; value: number }> {
  const warehouseCode = await ensureWarehouseCode(ctx, bodegaId);
  const key = `warehouse_folio:${String(bodegaId)}:${type}`;
  const existing = await ctx.db
    .query("sequences")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) return existing as any;

  let maxLegacy = 0;
  const regex = new RegExp(`^${warehouseCode}-(\\d+)$`, "i");
  if (type === "entrada") {
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_bodegaId", (q) => q.eq("bodegaId", bodegaId))
      .collect();
    for (const row of purchases) {
      const parsed = Number((row.folio || "").match(regex)?.[1] || 0);
      if (parsed > maxLegacy) maxLegacy = parsed;
      if ((row.folioNumber || 0) > maxLegacy) maxLegacy = row.folioNumber || 0;
    }
  } else if (type === "salida") {
    const salidas = await ctx.db
      .query("salidas")
      .withIndex("by_bodegaId", (q) => q.eq("bodegaId", bodegaId))
      .collect();
    for (const row of salidas) {
      const parsed = Number((row.numeroSalida || "").match(regex)?.[1] || 0);
      if (parsed > maxLegacy) maxLegacy = parsed;
      if (((row as any).folioNumber || 0) > maxLegacy) maxLegacy = (row as any).folioNumber || 0;
    }
  } else if (type === "ingreso") {
    const ingresos = await ctx.db
      .query("bodega_ingresos")
      .withIndex("by_bodegaId", (q) => q.eq("bodegaId", bodegaId))
      .collect();
    for (const row of ingresos) {
      const parsed = Number(((row as any).folio || "").match(regex)?.[1] || 0);
      if (parsed > maxLegacy) maxLegacy = parsed;
      if (((row as any).folioNumber || 0) > maxLegacy) maxLegacy = (row as any).folioNumber || 0;
    }
  } else {
    const egresos = await ctx.db
      .query("bodega_egresos")
      .withIndex("by_bodegaId", (q) => q.eq("bodegaId", bodegaId))
      .collect();
    for (const row of egresos) {
      const parsed = Number(((row as any).folio || "").match(regex)?.[1] || 0);
      if (parsed > maxLegacy) maxLegacy = parsed;
      if (((row as any).folioNumber || 0) > maxLegacy) maxLegacy = (row as any).folioNumber || 0;
    }
  }

  const id = await ctx.db.insert("sequences", { key, value: maxLegacy });
  const created = await ctx.db.get(id);
  return created as any;
}

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type Purchase = {
  id: string;
  supplierId: string;
  supplierName: string;
  bodegaId: string;
  bodegaName: string;
  folio: string;
  date: string;
  totalAmount: number;
  status: "Pendiente" | "Pagado" | "Cancelado" | "Vencido";
  receptionStatus: "Completa" | "Faltante" | "Pendiente";
  notes?: string;
  items?: PurchaseItem[];
};

export type PurchaseItem = {
  productId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

export function usePurchases() {
  const convexPurchases = useQuery(api.purchases.queries.list);
  const createMutation = useMutation(api.purchases.mutations.create);
  const updateMutation = useMutation(api.purchases.mutations.update);
  const deleteMutation = useMutation(api.purchases.mutations.remove);

  const purchases = (convexPurchases || []).map((p) => ({
    ...p,
    id: String(p._id),
    supplierName: p.supplierName || "Proveedor desconocido",
    bodegaName: p.bodegaName || "Bodega desconocida",
    folio: p.folio || "Sin folio",
    items: p.items || [],
  })) as Purchase[];

  const addPurchase = useCallback(async (purchase: Omit<Purchase, "id" | "supplierName" | "bodegaName" | "folio"> & { items?: PurchaseItem[] }) => {
    return await createMutation({
      supplierId: purchase.supplierId as Id<"suppliers">,
      bodegaId: purchase.bodegaId as Id<"bodegas">,
      date: purchase.date,
      totalAmount: purchase.totalAmount,
      status: purchase.status,
      receptionStatus: purchase.receptionStatus,
      notes: purchase.notes,
      items: purchase.items?.map(item => ({
        ...item,
        productId: item.productId as Id<"products">
      })),
    });
  }, [createMutation]);

  const updatePurchase = useCallback(async (id: string, purchase: Partial<Purchase> & { items?: PurchaseItem[] }) => {
    const { id: _, supplierName: __, bodegaName: ___, ...fields } = purchase;
    return await updateMutation({ 
      id: id as Id<"purchases">, 
      ...fields,
      supplierId: fields.supplierId ? (fields.supplierId as Id<"suppliers">) : undefined,
      bodegaId: fields.bodegaId ? (fields.bodegaId as Id<"bodegas">) : undefined,
      items: fields.items?.map((item) => ({
        ...item,
        productId: item.productId as Id<"products">,
      })),
    } as any);
  }, [updateMutation]);

  const deletePurchase = useCallback(async (id: string) => {
    return await deleteMutation({ id: id as Id<"purchases"> });
  }, [deleteMutation]);

  return {
    purchases,
    isLoading: convexPurchases === undefined,
    addPurchase,
    updatePurchase,
    deletePurchase,
  };
}

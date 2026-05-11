import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export type Product = {
  id: string;
  sku: string;
  codigo: string;
  producto: string;
  cantidadEmpaque: string;
  categoria: string;
  subcategoria: string;
  status: "Activo" | "Inactivo";
  lista1?: string;
  lista2?: string;
  lista3?: string;
  lista4?: string;
  lista5?: string;
  lista6?: string;
  lista7?: string;
  lista8?: string;
  lista9?: string;
  lista10?: string;
  lista11?: string;
  lista12?: string;
  lista13?: string;
  lista14?: string;
  lista15?: string;
};

export function useProducts() {
  const convexProducts = useQuery(api.products.queries.list);
  const createMutation = useMutation(api.products.mutations.create);
  const updateMutation = useMutation(api.products.mutations.update);
  const deleteMutation = useMutation(api.products.mutations.remove);
  const bulkUpsertMutation = useMutation(api.products.mutations.bulkUpsert);

  const products = (convexProducts || []).map(p => ({
    ...p,
    id: p._id as string,
  })) as Product[];

  const addProduct = useCallback(async (product: Omit<Product, "id">) => {
    return await createMutation(product as any);
  }, [createMutation]);

  const updateProduct = useCallback(async (id: string, product: Partial<Product>) => {
    const { id: _, ...fields } = product;
    return await updateMutation({ id: id as Id<"products">, ...fields } as any);
  }, [updateMutation]);

  const deleteProduct = useCallback(async (id: string) => {
    return await deleteMutation({ id: id as Id<"products"> });
  }, [deleteMutation]);

  const bulkUpsert = useCallback(async (items: any[]) => {
    return await bulkUpsertMutation({ items });
  }, [bulkUpsertMutation]);

  return {
    products,
    isLoading: convexProducts === undefined,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkUpsert,
  };
}

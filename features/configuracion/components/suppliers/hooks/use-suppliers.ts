import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Supplier } from "../types";

export function useSuppliers() {
  const convexSuppliers = useQuery(api.suppliers.queries.list);
  const createMutation = useMutation(api.suppliers.mutations.create);
  const updateMutation = useMutation(api.suppliers.mutations.update);
  const deleteMutation = useMutation(api.suppliers.mutations.remove);

  const suppliers = (convexSuppliers || []).map(s => ({
    ...s,
    id: s._id as string,
  })) as Supplier[];

  const addSupplier = useCallback(async (supplier: Omit<Supplier, "id">) => {
    const { ...fields } = supplier;
    return await createMutation(fields as any);
  }, [createMutation]);

  const updateSupplier = useCallback(async (id: string, supplier: Partial<Supplier>) => {
    const { id: _, ...fields } = supplier;
    return await updateMutation({ id: id as Id<"suppliers">, ...fields } as any);
  }, [updateMutation]);

  const deleteSupplier = useCallback(async (id: string) => {
    return await deleteMutation({ id: id as Id<"suppliers"> });
  }, [deleteMutation]);

  return {
    suppliers,
    isLoading: convexSuppliers === undefined,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  };
}

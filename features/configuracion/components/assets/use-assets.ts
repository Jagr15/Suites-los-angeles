import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Asset } from "./types";

export function useAssets() {
  const convexAssets = useQuery(api.assets.queries.list);
  const createMutation = useMutation(api.assets.mutations.create);
  const updateMutation = useMutation(api.assets.mutations.update);
  const deleteMutation = useMutation(api.assets.mutations.remove);

  const assets = (convexAssets || []).map(a => ({
    ...a,
    id: a._id,
  })) as (Asset & { id: string })[];

  const addAsset = useCallback(async (asset: any) => {
    return await createMutation(asset);
  }, [createMutation]);

  const updateAsset = useCallback(async (id: string, asset: any) => {
    const { id: _, ...fields } = asset;
    return await updateMutation({ id: id as Id<"assets">, ...fields });
  }, [updateMutation]);

  const deleteAsset = useCallback(async (id: string) => {
    return await deleteMutation({ id: id as Id<"assets"> });
  }, [deleteMutation]);

  return {
    assets,
    isLoading: convexAssets === undefined,
    addAsset,
    updateAsset,
    deleteAsset,
  };
}

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Route } from "./types";

export function useRoutes() {
  const convexRoutes = useQuery(api.routes.queries.list);
  const createMutation = useMutation(api.routes.mutations.create);
  const updateMutation = useMutation(api.routes.mutations.update);
  const deleteMutation = useMutation(api.routes.mutations.remove);

  const routes = (convexRoutes || []).map(r => ({
    ...r,
    routeType: r.routeType || "Interna",
    id: r._id,
  })) as Route[];

  const addRoute = useCallback(async (route: Omit<Route, "id" | "assignedUserName" | "assignedProfileName" | "vehicleInfo">) => {
    const { ...fields } = route;
    const payload = {
      ...fields,
      destination: fields.destination,
      deliveryType: fields.deliveryType,
      assignedUserId: fields.assignedUserId as Id<"users">,
      assetId: fields.assetId as Id<"assets">,
    } as any;
    return await createMutation(payload);
  }, [createMutation]);

  const updateRoute = useCallback(async (id: string, route: Partial<Route>) => {
    const { id: _, assignedUserName: __, assignedProfileName: ___, vehicleInfo: ____, ...fields } = route;
    const payload = {
      id: id as Id<"routes">,
      ...fields,
      ...(fields.destination ? { destination: fields.destination } : {}),
      ...(fields.deliveryType ? { deliveryType: fields.deliveryType } : {}),
      ...(fields.assignedUserId ? { assignedUserId: fields.assignedUserId as Id<"users"> } : {}),
      ...("assetId" in fields ? { assetId: fields.assetId as Id<"assets"> } : {}),
    } as any;
    return await updateMutation(payload);
  }, [updateMutation]);

  const deleteRoute = useCallback(async (id: string) => {
    return await deleteMutation({ id: id as Id<"routes"> });
  }, [deleteMutation]);

  return {
    routes,
    isLoading: convexRoutes === undefined,
    addRoute,
    updateRoute,
    deleteRoute,
  };
}

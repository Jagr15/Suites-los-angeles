import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Client } from "./types";
import { Id } from "@/convex/_generated/dataModel";

export function useClients() {
  const rawClients = useQuery(api.clients.queries.list);
  
  const createClientMutation = useMutation(api.clients.mutations.create);
  const updateClientMutation = useMutation(api.clients.mutations.update);
  const deleteClientMutation = useMutation(api.clients.mutations.remove);

  const clients: Client[] = (rawClients || []).map((c) => ({
    id: c._id,
    commercialName: c.commercialName,
    buyerName: c.buyerName,
    requiresInvoice: c.requiresInvoice,
    businessName: c.businessName,
    rfc: c.rfc,
    taxRegime: c.taxRegime,
    mapsUrl: c.mapsUrl,
    townId: c.townId,
    townName: c.townName,
    municipalityId: c.municipalityId,
    municipalityName: c.municipalityName,
    stateId: c.stateId,
    stateName: c.stateName,
    visitFrequency: c.visitFrequency,
    assignedRouteId: c.assignedRouteId ? String(c.assignedRouteId) : "",
    assignedRouteName: c.assignedRouteName || "",
    creditLimit: c.creditLimit,
    creditDays: c.creditDays,
    lat: c.lat,
    lng: c.lng,
    availableScheduleStart: c.availableScheduleStart,
    availableScheduleEnd: c.availableScheduleEnd,
  }));

  const addClient = async (client: Omit<Client, "id">) => {
    // Extraer campos que no existen en el validador del servidor
    const { _id, _creationTime, ...fields } = client as any;
    
    const cleanData = {
      ...fields,
      // Garantizar que los strings requeridos existan siempre
      commercialName: fields.commercialName || "",
      buyerName: fields.buyerName || "",
      municipalityId: fields.municipalityId || "",
      municipalityName: fields.municipalityName || "",
      stateId: fields.stateId || "",
      stateName: fields.stateName || "",
      townId: fields.townId || "",
      townName: fields.townName || "",
      mapsUrl: fields.mapsUrl || "",
      
      // Garantizar booleanos y números
      requiresInvoice: !!fields.requiresInvoice,
      creditLimit: Number(fields.creditLimit) || 0,
      creditDays: Number(fields.creditDays) || 0,
      visitFrequency: fields.visitFrequency || "Semanal",

      // Manejo especial de IDs opcionales de Convex
      assignedRouteId: (fields.assignedRouteId === "" || !fields.assignedRouteId) ? undefined : fields.assignedRouteId,
    };

    return await createClientMutation(cleanData as any);
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    const { id: _, _id, _creationTime, ...data } = client as any;
    
    const cleanData = {
      ...data,
      // Garantizar que los strings requeridos existan siempre
      commercialName: data.commercialName || "",
      buyerName: data.buyerName || "",
      municipalityId: data.municipalityId || "",
      municipalityName: data.municipalityName || "",
      townId: data.townId || "",
      townName: data.townName || "",
      mapsUrl: data.mapsUrl || "",
      
      // Garantizar booleanos y números
      requiresInvoice: !!data.requiresInvoice,
      creditLimit: Number(data.creditLimit) || 0,
      creditDays: Number(data.creditDays) || 0,
      visitFrequency: data.visitFrequency || "Semanal",

      // Manejo de IDs
      assignedRouteId: (data.assignedRouteId === "" || !data.assignedRouteId) ? undefined : data.assignedRouteId,
    };

    return await updateClientMutation({
      id: id as Id<"clients">,
      ...cleanData,
    } as any);
  };

  const deleteClient = async (id: string) => {
    return await deleteClientMutation({ id: id as Id<"clients"> });
  };

  return {
    clients,
    isLoading: rawClients === undefined,
    addClient,
    updateClient,
    deleteClient,
  };
}

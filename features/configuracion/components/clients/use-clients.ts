import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Client } from "./types";
import { Id } from "@/convex/_generated/dataModel";
import { getGoogleMapsLink } from "./location-utils";

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeMapsUrl(lat?: number, lng?: number, mapsUrl?: string): string {
  return getGoogleMapsLink(lat, lng, mapsUrl || "");
}

export function useClients() {
  const rawClients = useQuery(api.clients.queries.list);
  
  const createClientMutation = useMutation(api.clients.mutations.create);
  const updateClientMutation = useMutation(api.clients.mutations.update);
  const deleteClientMutation = useMutation(api.clients.mutations.remove);
  const syncFixedCustomerLevels = useMutation(api.pricing.mutations.syncFixedCustomerLevels);
  const hasSyncedFixedLevels = useRef(false);

  useEffect(() => {
    if (hasSyncedFixedLevels.current) return;
    hasSyncedFixedLevels.current = true;
    void syncFixedCustomerLevels();
  }, [syncFixedCustomerLevels]);

  const clients: Client[] = (rawClients || []).map((c) => ({
    id: c._id,
    clientType: c.clientType || "commercial",
    commercialName: c.commercialName,
    buyerName: c.buyerName,
    responsable: c.responsable || c.buyerName,
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
    pricingCustomerLevelId: c.pricingCustomerLevelId,
    visitFrequency: c.visitFrequency,
    tipoEntrega: c.tipoEntrega,
    diaEntrega: c.diaEntrega,
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
    const fields = client as Omit<Client, "id">;
    
    const lat = toOptionalNumber(fields.lat);
    const lng = toOptionalNumber(fields.lng);
    const clientType = fields.clientType || "commercial";
    const isWholesaler = clientType === "wholesaler";
    const diaEntrega = isWholesaler ? (fields.diaEntrega || "Lunes") : undefined;
    const tipoEntrega = isWholesaler ? (fields.tipoEntrega || "pickup") : undefined;
    const visitFrequency = fields.visitFrequency || "Semanal";
    const cleanData = {
      ...fields,
      // Garantizar que los strings requeridos existan siempre
      clientType,
      commercialName: fields.commercialName || "",
      buyerName: fields.buyerName || "",
      responsable: fields.responsable || fields.buyerName || "",
      municipalityId: fields.municipalityId || "",
      municipalityName: fields.municipalityName || "",
      stateId: fields.stateId || "",
      stateName: fields.stateName || "",
      townId: fields.townId || "",
      townName: fields.townName || "",
      mapsUrl: normalizeMapsUrl(lat, lng, fields.mapsUrl),
      diaEntrega,
      tipoEntrega,
      
      // Garantizar booleanos y números
      requiresInvoice: !!fields.requiresInvoice,
      creditLimit: Number(fields.creditLimit) || 0,
      creditDays: Number(fields.creditDays) || 0,
      visitFrequency,
      lat,
      lng,

      // Manejo especial de IDs opcionales de Convex
      assignedRouteId: (fields.assignedRouteId === "" || !fields.assignedRouteId) ? undefined : fields.assignedRouteId,
    };

    return await createClientMutation(cleanData as Parameters<typeof createClientMutation>[0]);
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    const data = client as Partial<Client>;
    
    const lat = toOptionalNumber(data.lat);
    const lng = toOptionalNumber(data.lng);
    const clientType = data.clientType || "commercial";
    const isWholesaler = clientType === "wholesaler";
    const diaEntrega = isWholesaler ? (data.diaEntrega || "Lunes") : undefined;
    const tipoEntrega = isWholesaler ? (data.tipoEntrega || "pickup") : undefined;
    const visitFrequency = data.visitFrequency || "Semanal";
    const cleanData = {
      ...data,
      // Garantizar que los strings requeridos existan siempre
      clientType,
      commercialName: data.commercialName || "",
      buyerName: data.buyerName || "",
      responsable: data.responsable || data.buyerName || "",
      stateId: data.stateId || "",
      stateName: data.stateName || "",
      municipalityId: data.municipalityId || "",
      municipalityName: data.municipalityName || "",
      townId: data.townId || "",
      townName: data.townName || "",
      mapsUrl: normalizeMapsUrl(lat, lng, data.mapsUrl),
      diaEntrega,
      tipoEntrega,
      
      // Garantizar booleanos y números
      requiresInvoice: !!data.requiresInvoice,
      creditLimit: Number(data.creditLimit) || 0,
      creditDays: Number(data.creditDays) || 0,
      visitFrequency,
      lat,
      lng,

      // Manejo de IDs
      assignedRouteId: (data.assignedRouteId === "" || !data.assignedRouteId) ? undefined : data.assignedRouteId,
    };

    return await updateClientMutation({
      id: id as Id<"clients">,
      ...cleanData,
    } as Parameters<typeof updateClientMutation>[0]);
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

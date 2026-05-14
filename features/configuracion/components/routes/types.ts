export * from "../../schemas/route-schema";
export * from "../../schemas/vehicle-schema";

export interface Vehicle {
  _id: string;
  name: string;
  brand?: string;
  model?: string;
  plate: string;
  year?: string;
  isActive: boolean;
}

export interface Route {
  _id?: string;
  id: string; // ID interno usado en la UI
  name: string;
  destination: string;
  deliveryType: "sucursal" | "envio";
  assignedUserId: string;
  assignedUserName: string;
  assignedProfileId?: string;
  assignedProfileName?: string;
  assetId: string;
  vehicleInfo: string;
  operationDays: string[];
  loadDay: string;
  isActive: boolean;
  requireGpsValidation?: boolean;
  gpsRadiusLimit?: number;
  allowLocationUpdate?: boolean;
  requireKmTracking?: boolean;
  allowOffHoursSales?: boolean;
  requireVisitOrder?: boolean;
  allowNoSaleCheckIn?: boolean;
  requireMinVisitTime?: boolean;
  minVisitTimeMinutes?: number;
  startLat?: number;
  startLng?: number;
  stops?: { name: string; lat: number; lng: number }[];
}

export const DAYS = [
  { key: "L", label: "Lunes" },
  { key: "M", label: "Martes" },
  { key: "X", label: "Miércoles" },
  { key: "J", label: "Jueves" },
  { key: "V", label: "Viernes" },
  { key: "S", label: "Sábado" },
  { key: "D", label: "Domingo" },
];

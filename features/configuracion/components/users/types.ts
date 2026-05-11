export type Role = "SuperAdmin" | "Admin" | "Bodega" | "Rutas" | "Finanzas" | string;

export interface UserPermissions {
  ventas: boolean;
  inventario: boolean;
  rutas: boolean;
  finanzas: boolean;
  configuracion: boolean;
}

export interface User {
  id: string;
  profileId: string;
  profileName: string;
  email: string;
  role: Role;
  isActive: boolean;
  permissions: UserPermissions;
}

export const INITIAL_USERS: User[] = [
  {
    id: "1",
    profileId: "1",
    profileName: "Juan Pérez García",
    email: "juan.perez@angelos.com",
    role: "SuperAdmin",
    isActive: true,
    permissions: {
      ventas: true,
      inventario: true,
      rutas: true,
      finanzas: true,
      configuracion: true,
    },
  },
  {
    id: "2",
    profileId: "2",
    profileName: "María López Sánchez",
    email: "maria.lopez@angelos.com",
    role: "Finanzas",
    isActive: true,
    permissions: {
      ventas: false,
      inventario: false,
      rutas: false,
      finanzas: true,
      configuracion: false,
    },
  },
];

export const PROFILES = [
  { id: "1", name: "Juan Pérez García" },
  { id: "2", name: "María López Sánchez" },
  { id: "3", name: "Carlos Mendoza" },
];

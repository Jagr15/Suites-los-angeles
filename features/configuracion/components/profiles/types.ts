export interface Profile {
  id: string; // En el frontend usamos 'id' para mapear '_id'
  userId?: string;
  fullName: string;
  rfc?: string;
  curp?: string;
  nss?: string;
  personalPhone?: string;
  emergencyPhone?: string;
  bloodType?: string;
  hireDate?: string;
  position?: string;
  baseSalary?: number;
  status: "Activo" | "Inactivo";
  isEmployee: boolean;
  workStart?: string;
  workEnd?: string;
  workDays?: string[];
  workSchedule?: Array<{
    day: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  group?: "Administración" | "Ventas" | "Bodega" | "Sistemas";
  workplaceType?: "Casa" | "Bodega" | "Ruta" | "Ventas";
  assignedBodegaId?: string;
  image?: string;
}

export const INITIAL_PROFILES: Profile[] = [
  {
    id: "1",
    fullName: "Juan Pérez García",
    rfc: "PEGJ800101XXX",
    curp: "PEGJ800101HXXXXX01",
    nss: "1234567890",
    personalPhone: "555-0123",
    emergencyPhone: "555-9999",
    bloodType: "O+",
    hireDate: "2023-01-15",
    position: "Vendedor Senior",
    baseSalary: 12000.0,
    status: "Activo",
    isEmployee: true,
  },
  {
    id: "2",
    fullName: "María López Sánchez",
    rfc: "LOSM850505XXX",
    curp: "LOSM850505MXXXXX02",
    nss: "0987654321",
    personalPhone: "555-0124",
    emergencyPhone: "555-8888",
    bloodType: "A+",
    hireDate: "2023-03-20",
    position: "Contadora",
    baseSalary: 15000.0,
    status: "Activo",
    isEmployee: true,
  },
];

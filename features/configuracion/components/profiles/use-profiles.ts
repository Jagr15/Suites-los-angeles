import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Profile } from "./types";
import { Id } from "@/convex/_generated/dataModel";

export function useProfiles() {
  // Queries
  const rawProfiles = useQuery(api.profiles.queries.listAll);

  // Mutations
  const createProfileMutation = useMutation(api.profiles.mutations.create);
  const updateProfileMutation = useMutation(api.profiles.mutations.update);
  const deleteProfileMutation = useMutation(api.profiles.mutations.remove);

  // Mapeamos los perfiles de Convex a nuestro formato de UI
  const profiles: Profile[] = (rawProfiles || []).map((p) => ({
    id: p._id,
    userId: p.userId ? String(p.userId) : undefined,
    fullName: p.fullName,
    rfc: p.rfc,
    curp: p.curp,
    nss: p.nss,
    personalPhone: p.personalPhone,
    emergencyPhone: p.emergencyPhone,
    bloodType: p.bloodType,
    hireDate: p.hireDate,
    position: p.position,
    baseSalary: p.baseSalary,
    status: p.status,
    isEmployee: p.isEmployee ?? true,
    workStart: p.workStart,
    workEnd: p.workEnd,
    workDays: p.workDays,
    workSchedule: p.workSchedule,
    group: p.group,
    workplaceType: p.workplaceType,
    assignedBodegaId: p.assignedBodegaId,
    image: p.image,
  }));

  const addProfile = async (profile: Omit<Profile, "id">) => {
    return await createProfileMutation({
      ...(profile as any),
      userId: undefined,
      assignedBodegaId: (profile as any).assignedBodegaId
        ? ((profile as any).assignedBodegaId as any)
        : undefined,
    } as any);
  };

  const updateProfile = async (id: string, profile: Partial<Profile>) => {
    const { id: _, ...data } = profile;
    return await updateProfileMutation({
      id: id as Id<"profiles">,
      // Pasamos los campos que existen en la mutación
      fullName: data.fullName || "",
      rfc: data.rfc,
      curp: data.curp,
      nss: data.nss,
      personalPhone: data.personalPhone,
      emergencyPhone: data.emergencyPhone,
      bloodType: data.bloodType,
      hireDate: data.hireDate,
      position: data.position,
      baseSalary: data.baseSalary,
      status: data.status || "Activo",
      isEmployee: data.isEmployee ?? true,
      workStart: data.workStart,
      workEnd: data.workEnd,
      workDays: data.workDays,
      workSchedule: data.workSchedule,
      group: data.group,
      workplaceType: data.workplaceType,
      assignedBodegaId: data.assignedBodegaId ? (data.assignedBodegaId as any) : undefined,
      image: data.image,
    } as any);
  };

  const deleteProfile = async (id: string) => {
    return await deleteProfileMutation({ id: id as Id<"profiles"> });
  };

  return {
    profiles,
    isLoading: rawProfiles === undefined,
    addProfile,
    updateProfile,
    deleteProfile,
  };
}

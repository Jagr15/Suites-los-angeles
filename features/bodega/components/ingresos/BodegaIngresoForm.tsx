"use client";

import { useState } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Divider,
    Select,
    SelectItem,
    addToast,
} from "@heroui/react";
import {
    ArrowLeftIcon,
    CheckIcon,
    PhotoIcon,
    TrashIcon as TrashIconOutline,
} from "@heroicons/react/24/outline";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDisclosure } from "@heroui/react";
import { CategoryModal } from "../transactions/CategoryModal";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Id } from "@/convex/_generated/api";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bodegaIngresoSchema, type BodegaIngresoFormValues } from "../../schemas/ingreso";

type BodegaIngresoFormProps = {
    onSuccess?: () => void;
    onCancel: () => void;
};

export function BodegaIngresoForm({ onSuccess, onCancel }: BodegaIngresoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // React Hook Form Setup
    const { 
        control, 
        handleSubmit, 
        watch, 
        setValue, 
        formState: { errors } 
    } = useForm<BodegaIngresoFormValues>({
        resolver: zodResolver(bodegaIngresoSchema),
        defaultValues: {
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            responsibleName: "",
            categoryId: "",
            subcategoryId: "",
            notes: "",
        }
    });

    const formData = watch();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [modalConfig, setModalConfig] = useState<{
        parentCategoryId?: Id<"bodega_categorias">;
        parentName?: string;
        categoryToEdit?: { _id: Id<"bodega_categorias">; name: string };
    }>({});

    // Queries & Mutations
    const allCategories = useQuery(api.bodega_transactions.queries.listCategories, { type: "ingreso" }) || [];
    const mainCategories = allCategories.filter(c => !c.parentCategoryId);
    const subCategories = allCategories.filter(c => c.parentCategoryId === formData.categoryId);
    
    const generateUploadUrl = useMutation(api.common.mutations.generateUploadUrl);
    const createIngresoMutation = useMutation(api.bodega_transactions.mutations.createIngreso);
    
    const routes = useQuery(api.routes.queries.list) || [];
    const profiles = useQuery(api.profiles.queries.listAll) || [];
    const assignedProfileIds = new Set(routes.map(r => r.assignedProfileId));
    const routeStaff = profiles.filter(p => assignedProfileIds.has(p._id));

    const handleOnSubmit = async (data: BodegaIngresoFormValues) => {
        setIsSubmitting(true);
        try {
            let evidenceStorageId = undefined;

            // 1. Subir imagen si existe
            if (data.evidence instanceof File) {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": data.evidence.type },
                    body: data.evidence,
                });
                const { storageId } = await result.json();
                evidenceStorageId = storageId;
            }

            // 2. Crear el ingreso
            await createIngresoMutation({
                amount: data.amount,
                categoryId: data.categoryId as Id<"bodega_categorias">,
                subcategoryId: data.subcategoryId as Id<"bodega_categorias">,
                date: data.date,
                responsibleId: data.responsibleId as Id<"profiles">,
                responsibleName: data.responsibleName,
                clientName: data.clientName,
                evidenceStorageId,
                notes: data.notes,
            });

            addToast({
                title: "Éxito",
                description: "Ingreso registrado correctamente",
                color: "success",
            });
            onSuccess?.();
        } catch (error) {
            console.error(error);
            addToast({
                title: "Error",
                description: "No se pudo registrar el ingreso",
                color: "danger",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleOnSubmit)} className="mx-auto w-full space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button isIconOnly variant="flat" onPress={onCancel}>
                        <ArrowLeftIcon className="size-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-success-600">Nuevo Ingreso de Bodega</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="flat" color="danger" onPress={onCancel} isDisabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        color="success"
                        className="text-white font-bold"
                        type="submit"
                        isLoading={isSubmitting}
                        startContent={!isSubmitting && <CheckIcon className="size-5" />}
                    >
                        Registrar Ingreso
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Categoría y Monto */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-sm border-none bg-content1">
                        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
                            <h3 className="text-sm font-bold text-default-500 uppercase tracking-widest leading-none">Monto del Ingreso</h3>
                        </CardHeader>
                        <CardBody className="px-6 pb-6 mt-2">
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={field.value?.toString()}
                                        startContent={<span className="text-success-500 font-bold">$</span>}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        isInvalid={!!errors.amount}
                                        errorMessage={errors.amount?.message}
                                        classNames={{
                                            input: "text-2xl font-bold text-center text-success-700",
                                            inputWrapper: "h-20 bg-success-50/50 border-2 border-success-100 focus-within:border-success-400",
                                        }}
                                        variant="bordered"
                                        radius="lg"
                                    />
                                )}
                            />
                        </CardBody>
                    </Card>

                    <Card className="shadow-sm border-none bg-content1">
                        <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
                            <h3 className="text-lg font-bold text-success-600 tracking-tight">Detalles del Ingreso</h3>
                            <p className="text-xs text-default-500 italic">Clasificación y tiempo</p>
                        </CardHeader>
                        <CardBody className="space-y-6 px-6 pb-6 mt-4">
                            <div className="flex items-end gap-2">
                                <Controller
                                    name="categoryId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            label="Categoría"
                                            placeholder="Selecciona categoría"
                                            variant="bordered"
                                            radius="lg"
                                            selectedKeys={field.value ? [field.value] : []}
                                            className="flex-1"
                                            isInvalid={!!errors.categoryId}
                                            errorMessage={errors.categoryId?.message}
                                            onSelectionChange={(keys) => {
                                                const val = Array.from(keys)[0] as string;
                                                field.onChange(val);
                                                setValue("subcategoryId", "");
                                            }}
                                        >
                                            {mainCategories.map((cat) => (
                                                <SelectItem key={cat._id} textValue={cat.name}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <div className="flex gap-1 mb-[2px]">
                                    <Button isIconOnly variant="flat" size="lg" onPress={onOpen}>
                                        <PlusIcon className="size-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-end gap-2">
                                <Controller
                                    name="subcategoryId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            label="Subcategoría"
                                            placeholder="Selecciona subcategoría"
                                            variant="bordered"
                                            radius="lg"
                                            selectedKeys={field.value ? [field.value] : []}
                                            className="flex-1"
                                            isInvalid={!!errors.subcategoryId}
                                            errorMessage={errors.subcategoryId?.message}
                                            isDisabled={!formData.categoryId}
                                            onSelectionChange={(keys) => {
                                                const val = Array.from(keys)[0] as string;
                                                field.onChange(val);
                                            }}
                                        >
                                            {subCategories.map((sub) => (
                                                <SelectItem key={sub._id} textValue={sub.name}>
                                                    {sub.name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                            </div>

                            <Controller
                                name="date"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        label="Fecha del Ingreso"
                                        type="date"
                                        {...field}
                                        variant="bordered"
                                        radius="lg"
                                        isInvalid={!!errors.date}
                                        errorMessage={errors.date?.message}
                                    />
                                )}
                            />

                            <Divider />

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-default-500 uppercase ml-1">Evidencia (Foto)</label>
                                <Controller
                                    name="evidence"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="flex flex-col gap-3">
                                            <input
                                                type="file"
                                                id="evidencia-input"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                                            />
                                            {!field.value ? (
                                                <Button
                                                    as="label"
                                                    htmlFor="evidencia-input"
                                                    variant="flat"
                                                    color="success"
                                                    className="w-full h-14 font-bold border-2 border-dashed border-success/30 bg-success/5 hover:bg-success/10 cursor-pointer text-success-600"
                                                    startContent={<PhotoIcon className="size-6" />}
                                                >
                                                    Subir Comprobante
                                                </Button>
                                            ) : (
                                                <div className="flex items-center justify-between p-3 rounded-xl border-2 border-success-200 bg-success-50">
                                                    <span className="text-xs font-bold text-success-700 truncate flex-1 mr-2">{field.value.name}</span>
                                                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => field.onChange(null)}>
                                                        <TrashIconOutline className="size-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Responsable Selection */}
                <Card className="shadow-sm lg:col-span-2 border-none bg-content1">
                    <CardHeader className="flex flex-col items-start px-6 pt-6 pb-0">
                        <h3 className="text-lg font-bold text-success-600 uppercase tracking-wide">¿Quién recibió el ingreso?</h3>
                        <p className="text-xs text-default-500">Solo personal con rutas asignadas</p>
                    </CardHeader>
                    <CardBody className="px-6 pb-6 mt-4">
                        <Controller
                            name="responsibleId"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                        {routeStaff.map((persona) => (
                                            <button
                                                key={persona._id}
                                                type="button"
                                                onClick={() => {
                                                    field.onChange(persona._id);
                                                    setValue("responsibleName", persona.fullName);
                                                }}
                                                className={`text-base transition-all px-4 py-2 rounded-full border-2 ${field.value === persona._id
                                                    ? "border-success bg-success-50 text-success-700 font-bold shadow-sm"
                                                    : "border-default-100 text-default-500 font-medium hover:border-default-200"
                                                }`}
                                            >
                                                {persona.fullName}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.responsibleId && (
                                        <p className="text-xs text-danger font-bold uppercase">{errors.responsibleId.message}</p>
                                    )}
                                </div>
                            )}
                        />
                    </CardBody>
                </Card>
            </div>

            <CategoryModal 
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                type="ingreso"
                parentCategoryId={modalConfig.parentCategoryId}
                parentName={modalConfig.parentName}
                categoryToEdit={modalConfig.categoryToEdit}
            />
        </form>
    );
}

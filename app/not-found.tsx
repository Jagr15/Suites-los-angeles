"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { HomeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0B] text-white">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px]" />

            <div className="relative z-10 flex flex-col items-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-[120px] font-black leading-none tracking-tighter sm:text-[180px]">
                        <span className="bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">
                            404
                        </span>
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-4 max-w-md"
                >
                    <h2 className="text-2xl font-bold sm:text-3xl">Página no encontrada</h2>
                    <p className="mt-4 text-default-500">
                        Lo sentimos, la página que estás buscando no existe o ha sido movida.
                        Verifica la URL o regresa al inicio.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-4"
                >
                    <Button
                        as={Link}
                        href="/"
                        color="primary"
                        variant="shadow"
                        size="lg"
                        className="rounded-full font-bold h-12 px-8"
                        startContent={<HomeIcon className="size-5" />}
                    >
                        Ir al Inicio
                    </Button>

                    <Button
                        onPress={() => window.history.back()}
                        variant="flat"
                        size="lg"
                        className="rounded-full font-semibold h-12 px-8 bg-white/5 hover:bg-white/10"
                        startContent={<ArrowLeftIcon className="size-5" />}
                    >
                        Regresar
                    </Button>
                </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        </div>
    );
}

"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { HomeIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function NoExistePage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0B] text-white">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[60%] rounded-full bg-purple-600/10 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[120px]" />

            <div className="relative z-10 flex flex-col items-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-8"
                >
                    <div className="relative inline-block">
                        <SparklesIcon className="absolute -top-12 -right-12 size-24 text-primary/40 animate-pulse" />
                        <h1 className="text-[80px] font-black leading-none tracking-tighter sm:text-[120px]">
                            <span className="bg-gradient-to-r from-primary via-white to-blue-400 bg-clip-text text-transparent">
                                VACÍO
                            </span>
                        </h1>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="max-w-xl"
                >
                    <h2 className="text-3xl font-bold sm:text-4xl mb-4">Esta página no existe</h2>
                    <p className="text-lg text-default-500 leading-relaxed">
                        Has llegado a un lugar que aún no ha sido explorado.
                        Nuestros ingenieros están trabajando en expandir las fronteras del sistema.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-12"
                >
                    <Button
                        as={Link}
                        href="/dashboard"
                        color="primary"
                        variant="shadow"
                        size="lg"
                        className="rounded-full font-bold h-14 px-10 text-lg shadow-primary/30"
                        startContent={<HomeIcon className="size-6" />}
                    >
                        Volver al Panel
                    </Button>
                </motion.div>
            </div>

            {/* Decorative lines */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12" />
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-12" />
            </div>
        </div>
    );
}

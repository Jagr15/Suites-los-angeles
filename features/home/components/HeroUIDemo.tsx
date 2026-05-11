"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";

export function HeroUIDemo() {
  return (
    <section className="mb-8 w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        HeroUI instalado correctamente
      </h2>
      <p className="mb-4 text-gray-700 dark:text-gray-300">
        El botón de abajo es de HeroUI. Usa colores y estilos de la librería.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="primary" size="lg">
          Botón HeroUI Primary
        </Button>
        <Button color="secondary" variant="flat">
          Secondary
        </Button>
        <Button color="success" variant="bordered">
          Success
        </Button>
      </div>
      <Card className="mt-6 max-w-md border border-gray-200 dark:border-gray-700">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="font-semibold text-gray-900 dark:text-white">Card de HeroUI</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Si ves esto con buen contraste, HeroUI está funcionando.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-gray-700 dark:text-gray-300">
            Los botones de arriba son componentes de HeroUI con sus colores (primary, secondary,
            success).
          </p>
        </CardBody>
      </Card>
    </section>
  );
}

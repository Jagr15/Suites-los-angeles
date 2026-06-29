"use client";

import React from "react";
import { Card, CardBody } from "@heroui/react";

type Props = {
  title: string;
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class DashboardErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Dashboard section failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border border-warning/30 bg-warning/5">
          <CardBody className="gap-2 p-5">
            <p className="font-semibold text-warning-700">{this.props.title}</p>
            <p className="text-sm text-default-600">
              No fue posible cargar esta sección por ahora. Puedes recargar la página o continuar con otras áreas.
            </p>
          </CardBody>
        </Card>
      );
    }

    return this.props.children;
  }
}

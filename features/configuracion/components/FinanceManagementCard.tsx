import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  BanknotesIcon,
  CreditCardIcon,
  ArrowTrendingDownIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { FixedAssetsTab } from "./finance/assets/FixedAssetsTab";
import { LoansTab } from "./finance/loans/LoansTab";
import { CreditsTab } from "./finance/credits/CreditsTab";
import { AccountsTab } from "./finance/accounts/AccountsTab";

export function FinanceManagementCard() {
  const [activeTab, setActiveTab] = useState("loans");

  return (
    <Card className="border border-default-200 shadow-sm bg-content1">
      <CardHeader className="flex flex-col items-start px-6 pt-6 pb-2">
        <h3 className="text-medium font-semibold text-foreground">Configuración Financiera</h3>
        <p className="text-small text-default-500">Gestión de capital, activos y cuentas operativas</p>
      </CardHeader>
      <CardBody className="px-6 pb-8">
        <Tabs 
          aria-label="Subsecciones de finanzas" 
          variant="bordered" 
          color="primary"
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="mb-4"
          selectedKey={activeTab}
        >
          {/* A. PRÉSTAMOS */}
          <Tab
            key="loans"
            title={
              <div className="flex items-center space-x-2">
                <BanknotesIcon className="size-4" />
                <span>Préstamos</span>
              </div>
            }
          >
            <LoansTab />
          </Tab>

          {/* B. CRÉDITOS */}
          <Tab
            key="credits"
            title={
              <div className="flex items-center space-x-2">
                <CreditCardIcon className="size-4" />
                <span>Créditos</span>
              </div>
            }
          >
            <CreditsTab />
          </Tab>

          {/* C. CUENTAS Y CAJAS */}
          <Tab
            key="accounts"
            title={
              <div className="flex items-center space-x-2">
                <ArrowTrendingDownIcon className="size-4" />
                <span>Cuentas y Cajas</span>
              </div>
            }
          >
            <AccountsTab />
          </Tab>

          {/* D. ACTIVOS FIJOS */}
          <Tab
            key="assets"
            title={
              <div className="flex items-center space-x-2">
                <BriefcaseIcon className="size-4" />
                <span>Activos Fijos</span>
              </div>
            }
          >
            <FixedAssetsTab />
          </Tab>
        </Tabs>
      </CardBody>
    </Card>
  );
}

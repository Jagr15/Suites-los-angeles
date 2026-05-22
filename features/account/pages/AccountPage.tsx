"use client";

import React from "react";
import { AccountSettingsCard } from "../components/AccountSettingsCard";

export function AccountPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col p-6">
        <div>
          <AccountSettingsCard />
        </div>
      </div>
    </div>
  );
}

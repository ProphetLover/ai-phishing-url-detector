"use client";
import React from "react";
import { AppShell } from "@/components/AppShell";
import { useGlobal } from "@/lib/store";
import { DashboardView } from "@/components/Views/DashboardView";
import { HistoryView } from "@/components/Views/HistoryView";
import { HowItWorksView } from "@/components/Views/HowItWorksView";
import { SettingsView } from "@/components/Views/SettingsView";

export default function Page() {
  const { activeView } = useGlobal();

  return (
    <AppShell>
      {activeView === "dashboard" && <DashboardView />}
      {activeView === "history" && <HistoryView />}
      {activeView === "howItWorks" && <HowItWorksView />}
      {activeView === "settings" && <SettingsView />}
    </AppShell>
  );
}

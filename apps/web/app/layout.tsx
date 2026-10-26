import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { loadWeightUnit } from "@/lib/settings";
import { WeightUnitProvider } from "@/lib/weight-unit";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buff, Not Bored",
  description: "A full-body strength programme that adapts to you.",
};

// Your weight unit is read from the database on every visit (S-006).
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const weightUnit = await loadWeightUnit();
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <WeightUnitProvider unit={weightUnit}>
          {/* Keyed by unit: switching remounts the screens, so no box keeps a number typed in the old unit. */}
          <AppShell key={weightUnit}>{children}</AppShell>
        </WeightUnitProvider>
      </body>
    </html>
  );
}

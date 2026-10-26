"use client";

/**
 * Your weight unit (kg or lb, S-006), loaded once by the root layout and
 * read by any client component that shows or takes a weight. Defaults to kg,
 * which is also what renders when no provider is present (tests).
 */

import type { DisplayUnit } from "@buff-not-bored/domain";
import { createContext, useContext, type ReactNode } from "react";

const WeightUnitContext = createContext<DisplayUnit>("kg");

export function WeightUnitProvider({ unit, children }: { unit: DisplayUnit; children: ReactNode }) {
  return <WeightUnitContext.Provider value={unit}>{children}</WeightUnitContext.Provider>;
}

export function useWeightUnit(): DisplayUnit {
  return useContext(WeightUnitContext);
}

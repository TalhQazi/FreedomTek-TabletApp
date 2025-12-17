import React, { createContext, useContext, useState, useMemo } from 'react';

export const PLAN_NONE = null;

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
  const [currentPlan, setCurrentPlan] = useState(PLAN_NONE); // 'bronze' | 'silver' | 'gold' | null
  const [balance, setBalance] = useState(0);

  const value = useMemo(
    () => ({ currentPlan, setCurrentPlan, balance, setBalance }),
    [currentPlan, balance]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return ctx;
}

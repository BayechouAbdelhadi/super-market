"use client";

import { createContext, useContext } from "react";
import type { OpeningHours } from "@/lib/store/opening-hours";

const OpeningHoursContext = createContext<OpeningHours | null>(null);

/**
 * Makes the admin-configured opening hours available to client components of the public site
 * (the live open/closed pill), without threading them through every server component in between.
 */
export function OpeningHoursProvider({ hours, children }: { hours: OpeningHours; children: React.ReactNode }) {
  return <OpeningHoursContext.Provider value={hours}>{children}</OpeningHoursContext.Provider>;
}

/** Opening hours from the nearest provider, or null outside the public site shell. */
export function useOpeningHours(): OpeningHours | null {
  return useContext(OpeningHoursContext);
}

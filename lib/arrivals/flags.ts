/**
 * Feature flags of the arrivals feature, read on the server at request time.
 * Off unless the variable is exactly "true" (see .env.example).
 */

/** Customer side: home section, arrival pages, reserving, "Mes réservations" and the checkout handover. */
export function isArrivalsCustomerEnabled(): boolean {
  return process.env.ARRIVALS_CUSTOMER_ENABLED === "true";
}

/** Admin side: /admin/arrivals and its API. */
export function isArrivalsAdminEnabled(): boolean {
  return process.env.ARRIVALS_ADMIN_ENABLED === "true";
}

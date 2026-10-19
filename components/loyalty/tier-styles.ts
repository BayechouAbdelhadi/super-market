/** Avatar gradient, text and border of each loyalty tier (theme tier tokens). */
const TIER_AVATAR_CLASSES: Record<string, string> = {
  bronze: "from-tier-bronze/20 to-tier-bronze/10 text-tier-bronze-text border-tier-bronze/40",
  silver: "from-tier-silver/20 to-tier-silver/10 text-tier-silver-text border-tier-silver/40",
  gold: "from-tier-gold/30 to-tier-gold/15 text-tier-gold-text border-tier-gold",
  vip: "from-tier-vip to-tier-vip/85 text-background border-tier-vip",
};

const DEFAULT_AVATAR_CLASSES =
  "from-[var(--color-surface-hover)] to-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]";

/** Classes for a customer avatar (`bg-gradient-to-br` + border), from the customer's tier. */
export function tierAvatarClasses(tier: string | null | undefined): string {
  return TIER_AVATAR_CLASSES[(tier || "").toLowerCase()] || DEFAULT_AVATAR_CLASSES;
}

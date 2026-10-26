import type { LoyaltyTier } from "@/lib/loyalty/types";

/**
 * Tier colors shared by the loyalty card and the customer bottom bar. `gradient` and `border` are the card surface;
 * `barGradient` is a deeper shade of the same hue so the bar stays visible below a rendered card,
 * `barBorder` the color of the line along its top edge (a raw color: it feeds a CSS filter, not a class),
 * `barText` / `barTextActive` the icon and label colors of its items, dark enough to read on `barGradient`,
 * `barSelected` the pill behind the icon of the current item.
 */
export const TIER_SURFACE: Record<LoyaltyTier, { gradient: string; border: string; barGradient: string; barBorder: string; barText: string; barTextActive: string; barSelected: string }> = {
  GOLD: { gradient: "from-[#fffdf5] via-[#fef7e2] to-[#faeec7]", border: "border-[#ebd18f]", barGradient: "from-[#fbe9b7] via-[#f5d98a] to-[#ebc463]", barBorder: "#d4a93f", barText: "text-[#6b4a10]", barTextActive: "text-[#3d2604]", barSelected: "bg-[#b47a16]/20" },
  SILVER: { gradient: "from-[#ffffff] via-[#f8fafc] to-[#e2e8f0]", border: "border-slate-300", barGradient: "from-[#e2e8f0] via-[#cbd5e1] to-[#b8c4d4]", barBorder: "#94a3b8", barText: "text-slate-600", barTextActive: "text-slate-900", barSelected: "bg-slate-500/20" },
  BRONZE: { gradient: "from-[#fffaf5] via-[#ffedd5] to-[#fbdcb9]", border: "border-[#f5c7a3]", barGradient: "from-[#fcd9b6] via-[#f8c08f] to-[#f0a96f]", barBorder: "#e08a4a", barText: "text-[#7c2d12]", barTextActive: "text-[#431407]", barSelected: "bg-[#c2410c]/20" },
  VIP: { gradient: "from-[#fdfaff] via-[#f5e8ff] to-[#edd3fc]", border: "border-purple-200", barGradient: "from-[#ecd5fb] via-[#ddb8f7] to-[#cc9cf0]", barBorder: "#b57ee8", barText: "text-[#6b21a8]", barTextActive: "text-[#3b0764]", barSelected: "bg-[#7e22ce]/20" },
};

'use client'

import React from 'react'
import Image from 'next/image'
import { StatusBadge } from './StatusBadge'
import { LoyaltyTier } from '@/lib/loyalty/types'

interface DigitalLoyaltyCardProps {
  fullName: string
  phone?: string
  email?: string
  points: number
  tier: LoyaltyTier
  userId?: string
  createdAt?: string
}

export function DigitalLoyaltyCard({
  fullName,
  phone,
  email,
  points,
  tier = 'BRONZE',
  userId = '',
  createdAt,
}: DigitalLoyaltyCardProps) {
  // Real Member reference from actual Supabase ID (first 8 hex characters, no invented numbers)
  const memberNumber = userId
    ? userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
    : 'CLIENT'

  // Real join date formatted as MM/YYYY from actual account creation date
  const joinDate = createdAt ? new Date(createdAt) : null
  const memberSince = joinDate && !isNaN(joinDate.getTime())
    ? `${String(joinDate.getMonth() + 1).padStart(2, '0')}/${joinDate.getFullYear()}`
    : '2026'

  // Euro discount value (real formula: 100 points = 5 €)
  const euroDiscount = (points * 0.05).toFixed(2)

  // Authentic light luxury colors that match the tier with crisp, darker text
  const tierThemes = {
    GOLD: {
      cardBg: 'from-[#fffdf5] via-[#fef7e2] to-[#faeec7]',
      border: 'border-[#ebd18f]',
      shadow: 'shadow-[0_12px_32px_rgba(180,122,22,0.12)]',
      glow: 'from-amber-200/40 via-yellow-100/30 to-amber-200/20',
      textColor: 'text-[#241704]',
      labelColor: 'text-[#855409]',
      subtextColor: 'text-[#573507]',
      pointsColor: 'text-[#92400e]',
      divider: 'border-[#ecd59e]',
      nfcColor: 'text-[#855409]/80',
      chipGradient: 'from-amber-100 via-yellow-200 to-amber-400',
      chipBorder: 'border-amber-600/30',
    },
    SILVER: {
      cardBg: 'from-[#ffffff] via-[#f8fafc] to-[#e2e8f0]',
      border: 'border-slate-300',
      shadow: 'shadow-[0_12px_32px_rgba(100,116,139,0.12)]',
      glow: 'from-slate-200/40 via-slate-100/30 to-slate-200/20',
      textColor: 'text-slate-900',
      labelColor: 'text-slate-500',
      subtextColor: 'text-slate-700',
      pointsColor: 'text-slate-900',
      divider: 'border-slate-200',
      nfcColor: 'text-slate-400',
      chipGradient: 'from-slate-100 via-slate-200 to-slate-400',
      chipBorder: 'border-slate-400/40',
    },
    BRONZE: {
      cardBg: 'from-[#fffaf5] via-[#ffedd5] to-[#fbdcb9]',
      border: 'border-[#f5c7a3]',
      shadow: 'shadow-[0_12px_32px_rgba(194,65,12,0.12)]',
      glow: 'from-orange-200/40 via-orange-100/30 to-amber-100/20',
      textColor: 'text-[#2f1005]',
      labelColor: 'text-[#9a3412]',
      subtextColor: 'text-[#6a250e]',
      pointsColor: 'text-[#b45309]',
      divider: 'border-[#f5ceb0]',
      nfcColor: 'text-[#9a3412]/80',
      chipGradient: 'from-amber-100 via-yellow-200 to-amber-500',
      chipBorder: 'border-amber-700/30',
    },
    VIP: {
      cardBg: 'from-[#fdfaff] via-[#f5e8ff] to-[#edd3fc]',
      border: 'border-purple-200',
      shadow: 'shadow-[0_12px_32px_rgba(126,34,206,0.12)]',
      glow: 'from-purple-200/40 via-fuchsia-100/30 to-purple-200/20',
      textColor: 'text-[#22073d]',
      labelColor: 'text-[#7e22ce]',
      subtextColor: 'text-[#581c87]',
      pointsColor: 'text-[#6b21a8]',
      divider: 'border-purple-200',
      nfcColor: 'text-[#7e22ce]/80',
      chipGradient: 'from-amber-100 via-yellow-200 to-amber-400',
      chipBorder: 'border-amber-600/30',
    },
  }

  const theme = tierThemes[tier] || tierThemes.BRONZE

  return (
    <div className="relative w-full select-none">
      {/* Dynamic Ambient Glow Behind Card */}
      <div
        className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${theme.glow} blur-xl opacity-70`}
      />

      {/* Main Physical Bank Card (Light pearlescent body with crisp darker text) */}
      <div
        className={`relative w-full rounded-2xl bg-gradient-to-br ${theme.cardBg} ${theme.border} border p-5 sm:p-6 ${theme.shadow} ${theme.textColor} overflow-hidden flex flex-col justify-between aspect-[1.586/1] min-h-[220px] transition-transform duration-300 hover:scale-[1.02]`}
      >
        {/* Specular Diagonal Sheen (Real Plastic/Metal Card Reflection) */}
        <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/50 to-transparent rotate-12" />

        {/* Top Header: Logo + Contactless Symbol + Status */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-white/90 p-1 border border-black/10 shadow-xs overflow-hidden shrink-0 flex items-center justify-center">
              <Image
                src="/logo-hq.png"
                alt="Super Market Calais Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <span className={`font-black text-xs sm:text-sm tracking-widest uppercase block ${theme.textColor}`}>
                SUPER MARKET CALAIS
              </span>
              <span className={`text-[10px] font-bold tracking-wider uppercase block ${theme.labelColor}`}>
                CARTE DE FIDÉLITÉ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* NFC Contactless Wave Symbol */}
            <div className={theme.nfcColor} title="Sans contact">
              <svg
                className="w-5 h-5 stroke-current rotate-90"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M5 12a7 7 0 0 1 14 0" />
                <path d="M8.5 12a3.5 3.5 0 0 1 7 0" />
                <path d="M12 12h.01" />
              </svg>
            </div>
            <StatusBadge status={tier} size="sm" />
          </div>
        </div>

        {/* Middle Section: Real EMV Smart Chip + Real Member Identifier */}
        <div className="flex items-center justify-between relative z-10 my-2">
          {/* Authentic Metallic EMV Chip with Circuit Lines */}
          <div
            className={`w-11 h-8 rounded-md bg-gradient-to-br ${theme.chipGradient} ${theme.chipBorder} border shadow-xs flex flex-col justify-between p-1 relative overflow-hidden`}
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
            <div className="absolute inset-y-0 left-1/3 w-px bg-black/25" />
            <div className="absolute inset-y-0 right-1/3 w-px bg-black/25" />
            <div className="w-2.5 h-1.5 rounded-xs border border-black/25 mx-auto mt-0.5" />
          </div>

          {/* Real Customer Identifier */}
          <div className="text-right">
            <span className={`text-[9px] uppercase tracking-widest font-bold block ${theme.labelColor}`}>
              IDENTIFIANT CLIENT
            </span>
            <span className={`font-mono text-xs sm:text-sm tracking-widest font-black ${theme.textColor}`}>
              #{memberNumber}
            </span>
          </div>
        </div>

        {/* Real Customer Information: Full Name + Phone */}
        <div className="relative z-10 space-y-0.5">
          <span className={`text-[9px] uppercase tracking-widest font-bold block ${theme.labelColor}`}>
            TITULAIRE DE LA CARTE
          </span>
          <div className={`text-sm sm:text-base font-black tracking-wide uppercase truncate ${theme.textColor}`}>
            {fullName}
          </div>
          {phone ? (
            <div className={`text-xs font-mono font-semibold tracking-wider ${theme.subtextColor}`}>
              {phone}
            </div>
          ) : email ? (
            <div className={`text-[11px] font-medium truncate ${theme.subtextColor}`}>
              {email}
            </div>
          ) : null}
        </div>

        {/* Bottom Section: Real Join Date + Real Points Balance */}
        <div className={`flex items-end justify-between relative z-10 pt-2 border-t ${theme.divider}`}>
          <div>
            <span className={`text-[9px] uppercase tracking-widest font-bold block ${theme.labelColor}`}>
              MEMBRE DEPUIS
            </span>
            <span className={`text-xs font-bold font-mono ${theme.textColor}`}>
              {memberSince}
            </span>
          </div>

          <div className="text-right">
            <span className={`text-[9px] uppercase tracking-widest font-bold block ${theme.labelColor}`}>
              SOLDE DISPONIBLE
            </span>
            <div className={`text-base sm:text-lg font-black tracking-tight ${theme.pointsColor}`}>
              {points.toLocaleString('fr-FR')} <span className="text-xs font-bold">PTS</span>
            </div>
            <div className={`text-[10px] font-bold ${theme.subtextColor}`}>
              ({euroDiscount} € en caisse)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

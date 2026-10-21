"use client";
/* eslint-disable @next/next/no-img-element -- printable poster: plain <img> elements are captured as-is by print and PNG export */
import React, { forwardRef } from "react";

interface FidelityPosterProps {
  qrDataUrl: string;
  finalUrl?: string;
  storeName?: string;
  storeAddress?: string;
  siteUrl?: string;
  className?: string;
}

export const FidelityPoster = forwardRef<HTMLDivElement, FidelityPosterProps>(
  function FidelityPoster(
    {
      qrDataUrl,
      className = "",
    },
    ref
  ) {
    return (
      <div
        id="printable-qr-flyer"
        ref={ref}
        className={`w-full max-w-[460px] mx-auto bg-white rounded-[24px] border border-slate-200/90 shadow-2xl relative overflow-hidden select-none ${className}`}
        style={{
          boxSizing: "border-box",
        }}
      >
        {/* Authentic Official Graphic Poster Template */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1024 / 1536",
          }}
        >
          <img
            src="/template-fidelity-qr-base.jpeg"
            alt="Affiche Fidélité Super Market"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Dynamic Live QR Code Overlay positioned precisely in the center frame */}
          <div
            className="absolute flex items-center justify-center pointer-events-auto"
            style={{
              left: "34.375%",
              top: "40.69%",
              width: "31.25%",
              height: "22.78%",
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code d'inscription fidélité"
                className="w-[82%] h-[82%] object-contain block mx-auto drop-shadow-2xs"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-mono">
                Génération...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default FidelityPoster;

"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
  /** Absolute URL to share. */
  url: string;
  className?: string;
}

/**
 * "Partager": the phone's share sheet (WhatsApp, Messenger…) where available, otherwise copies the link.
 */
export function ShareButton({ title, url, className }: ShareButtonProps) {
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Closed by the visitor: nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié : collez-le pour le partager.");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  return (
    <Button variant="secondary" size="lg" onClick={share} className={className}>
      <Share2 aria-hidden />
      Partager
    </Button>
  );
}

import { PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/** Shown in place of an arrivals screen while its feature flag is off (lib/arrivals/flags.ts). */
export function ArrivalsComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <Card padded="lg" className="items-center gap-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-hover text-text">
        <PackageOpen aria-hidden className="size-6" />
      </span>
      <Badge variant="info" size="md">
        Bientôt disponible
      </Badge>
      <h2 className="text-xl font-bold tracking-tight text-text">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-text-muted">{description}</p>
    </Card>
  );
}

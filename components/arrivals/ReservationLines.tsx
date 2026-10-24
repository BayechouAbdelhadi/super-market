import type { ReservationLine } from "@/lib/arrivals/types";
import { formatEuro } from "./format";

/** What was reserved, line by line, and the amount to pay at pickup. */
export function ReservationLines({ lines, totalAmount }: { lines: ReservationLine[]; totalAmount: number }) {
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border">
        {lines.map((line) => (
          <li key={line.itemId} className="flex items-baseline justify-between gap-4 py-2 text-sm">
            <span className="min-w-0 text-text">
              <strong className="font-semibold tabular-nums">{line.quantity} ×</strong> {line.itemName}{" "}
              <span className="text-text-muted">
                ({line.unitLabel}, {formatEuro(line.unitPrice)})
              </span>
            </span>
            <span className="shrink-0 tabular-nums text-text">{formatEuro(line.unitPrice * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold text-text">Total à régler au retrait</span>
        <span className="text-lg font-bold tabular-nums text-text">{formatEuro(totalAmount)}</span>
      </div>
    </div>
  );
}

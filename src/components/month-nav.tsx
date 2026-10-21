import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth, shiftMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MonthNav({
  ym,
  base,
  extra,
  className,
}: {
  ym: string;
  base: string;
  extra?: Record<string, string>;
  className?: string;
}) {
  const href = (m: string) => `${base}?${new URLSearchParams({ ...extra, month: m })}`;
  const btn = "grid size-8 place-items-center rounded-full hover:bg-black/5";

  return (
    <nav
      aria-label="Pilih bulan"
      className={cn("inline-flex items-center gap-1 rounded-full bg-white/60 p-1 text-sm", className)}
    >
      <Link href={href(shiftMonth(ym, -1))} aria-label="Bulan sebelumnya" className={btn}>
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-32 text-center font-medium">{formatMonth(ym)}</span>
      <Link href={href(shiftMonth(ym, 1))} aria-label="Bulan berikutnya" className={btn}>
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}

import {
  Banknote,
  Car,
  CircleDollarSign,
  Ellipsis,
  Gift,
  Receipt,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  Makanan: Utensils,
  Transportasi: Car,
  Tagihan: Receipt,
  Belanja: ShoppingBag,
  "Lain-lain": Ellipsis,
  Gaji: Banknote,
  Bonus: Gift,
};

export function CategoryIcon({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  const Icon = icons[name] ?? CircleDollarSign;
  return (
    <span
      className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", className)}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

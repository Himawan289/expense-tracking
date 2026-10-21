"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/report", label: "Laporan", icon: BarChart3 },
  { href: "/plan", label: "Rencana", icon: Target },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-white/70 p-5 backdrop-blur lg:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 text-white shadow-md shadow-blue-500/30">
            <Wallet className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Dompetku</span>
        </div>
        <nav className="space-y-1" aria-label="Menu utama">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-700",
                active(href) && "bg-blue-100 text-blue-700",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="pb-24 lg:pb-10">{children}</div>

      <nav
        aria-label="Menu utama"
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 rounded-2xl border bg-white/90 p-1.5 shadow-lg backdrop-blur lg:hidden"
      >
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium text-muted-foreground",
              active(href) && "bg-blue-100 text-blue-700",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

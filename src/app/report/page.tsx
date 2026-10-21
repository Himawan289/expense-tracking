import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { CategoryIcon } from "@/components/category-icon";
import { MonthNav } from "@/components/month-nav";
import { DonutChart } from "@/components/spending-chart";
import { getMonthData, spendByCategory } from "@/lib/data";
import { currentMonth, formatIDR, isMonth, shiftMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ month?: string; tab?: string }> };

export default function ReportPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-10 text-center text-sm text-muted-foreground">Memuat…</p>}>
      <Report searchParams={searchParams} />
    </Suspense>
  );
}

async function Report({ searchParams }: Props) {
  await connection();
  const { month, tab } = await searchParams;
  const ym = isMonth(month) ? month : currentMonth();
  const type = tab === "income" ? "income" : "expense";

  const [cur, prev] = await Promise.all([getMonthData(ym), getMonthData(shiftMonth(ym, -1))]);
  const data = spendByCategory(cur.rows, cur.categories, type);
  const prevByCat = new Map(
    spendByCategory(prev.rows, prev.categories, type).map((d) => [d.category_id, d.total]),
  );
  const total = data.reduce((s, d) => s + d.total, 0);
  const isExpense = type === "expense";

  const tabHref = (t: string) => `/report?${new URLSearchParams({ month: ym, tab: t })}`;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
        <MonthNav ym={ym} base="/report" extra={{ tab: type }} className="bg-white shadow-sm" />
      </header>

      <div role="tablist" className="grid grid-cols-2 rounded-full bg-muted p-1.5 sm:max-w-md">
        {[
          { id: "expense", label: "Pengeluaran" },
          { id: "income", label: "Pemasukan" },
        ].map((t) => (
          <Link
            key={t.id}
            href={tabHref(t.id)}
            role="tab"
            aria-selected={type === t.id}
            className={cn(
              "rounded-full py-2 text-center text-sm font-medium text-muted-foreground",
              type === t.id && "bg-white text-foreground shadow-sm",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-6 text-lg font-semibold">
            Laporan {isExpense ? "Pengeluaran" : "Pemasukan"}
          </h2>
          <DonutChart
            data={data}
            label={isExpense ? "Total Pengeluaran" : "Total Pemasukan"}
            empty={`Belum ada ${isExpense ? "pengeluaran" : "pemasukan"} bulan ini.`}
          />
        </section>

        <section className="space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold">
              Semua {isExpense ? "Pengeluaran" : "Pemasukan"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Total <b className="text-base font-semibold text-foreground">{formatIDR(total)}</b>
            </p>
          </div>
          {data.length === 0 && (
            <p className="rounded-3xl bg-white p-8 text-center text-sm text-muted-foreground">
              Tidak ada data.
            </p>
          )}
          {data.map((d) => {
            const before = prevByCat.get(d.category_id) ?? 0;
            const change = before > 0 ? ((d.total - before) / before) * 100 : null;
            const good = change !== null && (isExpense ? change <= 0 : change >= 0);
            const share = (d.total / total) * 100;
            return (
              <div key={d.category_id} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <CategoryIcon name={d.name} color={d.color} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{d.name}</p>
                    <p className="text-sm text-muted-foreground">{share.toFixed(1)}% dari total</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{formatIDR(d.total)}</p>
                    <p className="text-xs text-muted-foreground">
                      {change === null ? (
                        "tidak ada data bulan lalu"
                      ) : (
                        <>
                          <span
                            className={cn(
                              "mr-1 rounded-md px-1.5 py-0.5 font-medium",
                              good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                            )}
                          >
                            {change >= 0 ? "+" : ""}
                            {change.toFixed(0)}%
                          </span>
                          vs bulan lalu
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

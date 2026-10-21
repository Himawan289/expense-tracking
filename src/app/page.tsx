import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { Modal } from "@/components/modal";
import { MonthNav } from "@/components/month-nav";
import { DonutChart } from "@/components/spending-chart";
import { TransactionForm } from "@/components/transaction-form";
import { getBalance, getMonthData, getMonthTransactions, getRangeData } from "@/lib/data";
import {
  addDays,
  currentMonth,
  formatDayLong,
  formatIDR,
  isMonth,
  todayISO,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";

type Props = { searchParams: Promise<{ month?: string }> };

export default function Home({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-10 text-center text-sm text-muted-foreground">Memuat…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

function groupByDay(items: Transaction[]) {
  const days = new Map<string, Transaction[]>();
  for (const t of items) days.set(t.occurred_on, [...(days.get(t.occurred_on) ?? []), t]);
  return [...days.entries()];
}

async function Dashboard({ searchParams }: Props) {
  await connection();
  const { month } = await searchParams;
  const ym = isMonth(month) ? month : currentMonth();
  const today = todayISO();

  const [balance, week, { categories, summary, spend, budgets }, transactions] = await Promise.all([
    getBalance(),
    getRangeData(addDays(today, -6), addDays(today, 1)),
    getMonthData(ym),
    getMonthTransactions(ym),
  ]);

  const expenseTotal = spend.reduce((s, d) => s + d.total, 0);
  const top = spend[0];
  const weekDelta = week.summary.balance;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-sky-300 p-6 text-white shadow-xl shadow-blue-500/20 sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <MonthNav ym={ym} base="/" className="bg-white/20 text-white [&_a:hover]:bg-white/20" />
          <Modal
            title="Catat transaksi"
            trigger={
              <>
                <Plus /> Tambah transaksi
              </>
            }
            variant="secondary"
            triggerClassName="bg-white text-blue-700 hover:bg-white/90"
          >
            <TransactionForm categories={categories} />
          </Modal>
        </div>
        <div className="relative mt-10 text-center">
          <p className="text-sm text-white/80">Saldo Saat Ini</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-6xl">
            {formatIDR(balance)}
          </p>
          <p className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-sm">
            {weekDelta >= 0 ? "+" : "−"}
            {formatIDR(Math.abs(weekDelta))} dalam 7 hari terakhir
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <section aria-labelledby="money">
            <h2 id="money" className="mb-3 text-lg font-semibold">
              Uang Saya
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Pemasukan", value: summary.income, income: true },
                { label: "Pengeluaran", value: summary.expense, income: false },
              ].map((c) => (
                <div key={c.label} className="rounded-3xl bg-white p-5 shadow-sm">
                  <span
                    className={`mb-4 grid size-10 place-items-center rounded-2xl ${
                      c.income ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {c.income ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </span>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
                    {formatIDR(c.value)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Link
            href={`/report?month=${ym}`}
            className="flex items-center gap-3 rounded-full bg-neutral-900 px-5 py-3.5 text-sm text-white shadow-lg"
          >
            <Sparkles className="size-4 shrink-0 text-blue-300" />
            <span className="flex-1">
              {top
                ? `Pengeluaran terbesar: ${top.name} (${((top.total / expenseTotal) * 100).toFixed(0)}% dari total)`
                : "Belum ada pengeluaran bulan ini"}
            </span>
            <span className="flex items-center gap-1 text-white/70">
              Laporan <ArrowRight className="size-4" />
            </span>
          </Link>

          <section aria-labelledby="tx">
            <h2 id="tx" className="mb-3 text-lg font-semibold">
              Transaksi
            </h2>
            {transactions.length === 0 ? (
              <p className="rounded-3xl bg-white p-8 text-center text-sm text-muted-foreground">
                Belum ada transaksi bulan ini.
              </p>
            ) : (
              <div className="space-y-5">
                {groupByDay(transactions).map(([day, items]) => {
                  const dayExpense = items
                    .filter((t) => t.type === "expense")
                    .reduce((s, t) => s + t.amount, 0);
                  return (
                    <div key={day} className="space-y-2">
                      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
                        <span>{formatDayLong(day)}</span>
                        <span>
                          Keluar{" "}
                          <b className="font-semibold text-foreground">{formatIDR(dayExpense)}</b>
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {items.map((t) => (
                          <li key={t.id} className="flex items-center gap-3 rounded-3xl bg-white p-3.5 shadow-sm">
                            <CategoryIcon name={t.category.name} color={t.category.color} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{t.category.name}</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {t.note || (t.type === "income" ? "Pemasukan" : "Pengeluaran")}
                              </p>
                            </div>
                            <span
                              className={`font-semibold tabular-nums ${
                                t.type === "income" ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {t.type === "income" ? "+" : "−"}
                              {formatIDR(t.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Alokasi Pengeluaran</h2>
            <DonutChart data={spend} label="Total Pengeluaran" empty="Belum ada pengeluaran bulan ini." />
            <ul className="mt-5 space-y-2 text-sm">
              {spend.map((d) => (
                <li key={d.category_id} className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="text-muted-foreground">
                    {((d.total / expenseTotal) * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Anggaran</h2>
              <Link href="/plan" className="text-sm text-blue-600 hover:underline">
                Kelola
              </Link>
            </div>
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada batas anggaran.</p>
            ) : (
              <ul className="space-y-4">
                {budgets.slice(0, 4).map((b) => (
                  <li key={b.category_id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{b.name}</span>
                      <span className="tabular-nums text-muted-foreground">{b.pct.toFixed(0)}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Anggaran ${b.name}`}
                      aria-valuenow={Math.round(b.pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className={`h-full rounded-full ${
                          b.pct >= 100 ? "bg-rose-500" : b.pct >= 80 ? "bg-amber-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

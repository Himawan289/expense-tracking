import { Suspense } from "react";
import { connection } from "next/server";
import { Plus, Trash2 } from "lucide-react";
import { addToGoal, deleteBudget, deleteGoal } from "@/app/actions";
import { BudgetForm } from "@/components/budget-form";
import { GoalForm } from "@/components/goal-form";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGoals, getMonthData } from "@/lib/data";
import { currentMonth, formatDate, formatIDR, todayISO } from "@/lib/format";
import type { Goal } from "@/lib/types";
import { CategoryIcon } from "@/components/category-icon";

export default function PlanPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center text-sm text-muted-foreground">Memuat…</p>}>
      <Plan />
    </Suspense>
  );
}


/** Persentase waktu yang sudah berjalan menuju target tanggal. */
function expectedPct(goal: Goal, today: string) {
  if (!goal.target_date) return null;
  const start = new Date(goal.created_at).getTime();
  const end = new Date(`${goal.target_date}T00:00:00`).getTime();
  const now = new Date(`${today}T00:00:00`).getTime();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

function Ring({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      role="img"
      aria-label={`${pct.toFixed(0)} persen`}
      className="grid size-14 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${Math.min(pct, 100) * 3.6}deg, #eee 0)` }}
    >
      <span className="grid size-11 place-items-center rounded-full bg-white text-xs font-semibold tabular-nums">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

async function Plan() {
  await connection();
  const today = todayISO();
  const [goals, { categories, budgets }] = await Promise.all([getGoals(), getMonthData(currentMonth())]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Rencana Saya</h1>
      </header>

      <section aria-labelledby="goals" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="goals" className="text-lg font-semibold">
            Tujuan
          </h2>
          <Modal title="Tujuan baru" trigger={<><Plus /> Tujuan baru</>}>
            <GoalForm />
          </Modal>
        </div>

        {goals.length === 0 && (
          <p className="rounded-3xl bg-white p-8 text-center text-sm text-muted-foreground">
            Belum ada tujuan tabungan.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const actual = Math.min(100, (g.saved_amount / g.target_amount) * 100);
            const expected = expectedPct(g, today);
            const done = g.saved_amount >= g.target_amount;
            const gap = expected === null ? 0 : expected - actual;
            return (
              <article key={g.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{g.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {g.target_date ? `Target ${formatDate(g.target_date)}` : "Tanpa batas waktu"}
                      </p>
                    </div>
                    <form action={deleteGoal.bind(null, g.id)}>
                      <Button type="submit" variant="ghost" size="icon-sm" aria-label={`Hapus ${g.name}`}>
                        <Trash2 />
                      </Button>
                    </form>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatIDR(g.saved_amount)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      dari {formatIDR(g.target_amount)}
                    </span>
                  </p>
                  <div>
                    <div
                      role="progressbar"
                      aria-label={`Progres ${g.name}`}
                      aria-valuenow={Math.round(actual)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="relative h-2.5 rounded-full bg-blue-100"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                        style={{ width: `${actual}%` }}
                      />
                      {expected !== null && !done && (
                        <span
                          title="Posisi yang seharusnya"
                          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-600 bg-white"
                          style={{ left: `${expected}%` }}
                        />
                      )}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Progres Anda</span>
                      <span>Sisa {formatIDR(Math.max(0, g.target_amount - g.saved_amount))}</span>
                    </div>
                  </div>
                  <form action={addToGoal} className="flex gap-2">
                    <input type="hidden" name="goal_id" value={g.id} />
                    <Input
                      name="amount"
                      type="number"
                      min={1}
                      step="any"
                      required
                      placeholder="Tambah tabungan (Rp)"
                      aria-label={`Tambah tabungan ${g.name}`}
                    />
                    <Button type="submit" variant="outline" className="rounded-full">
                      Tambah
                    </Button>
                  </form>
                </div>
                {done ? (
                  <p className="bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white">
                    Target tercapai!
                  </p>
                ) : expected === null ? null : gap >= 5 ? (
                  <p className="bg-blue-600 px-5 py-2.5 text-sm font-medium text-white">
                    Anda tertinggal {gap.toFixed(0)}% dari jadwal.
                  </p>
                ) : (
                  <p className="bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white">
                    Sesuai jadwal.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="budgets" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="budgets" className="text-lg font-semibold">
            Anggaran Bulanan
          </h2>
          <Modal title="Atur anggaran" trigger={<><Plus /> Atur anggaran</>} variant="outline">
            <BudgetForm categories={categories} />
          </Modal>
        </div>
        {budgets.length === 0 && (
          <p className="rounded-3xl bg-white p-8 text-center text-sm text-muted-foreground">
            Belum ada batas anggaran.
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {budgets.map((b) => (
            <div key={b.category_id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm">
              <CategoryIcon name={b.name} color={b.color} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{b.name}</p>
                <p className="text-sm tabular-nums">
                  <b>{formatIDR(b.spent)}</b>{" "}
                  <span className="text-muted-foreground">dari {formatIDR(b.limit)}</span>
                </p>
              </div>
              <Ring pct={b.pct} color={b.pct >= 100 ? "#f43f5e" : b.pct >= 80 ? "#f59e0b" : b.color} />
              <form action={deleteBudget.bind(null, b.category_id)}>
                <Button type="submit" variant="ghost" size="icon-sm" aria-label={`Hapus anggaran ${b.name}`}>
                  <Trash2 />
                </Button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

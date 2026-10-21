import { db } from "@/lib/supabase";
import { monthRange } from "@/lib/format";
import type {
  BudgetStatus,
  Category,
  CategorySpend,
  Goal,
  Transaction,
  TxType,
} from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await db().from("categories").select("*").order("name");
  if (error) throw error;
  return data as Category[];
}

type Row = { amount: number; type: TxType; category_id: string };

// PostgREST membatasi 1000 baris per request, jadi ambil per halaman.
async function fetchRows(start?: string, end?: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db().from("transactions").select("amount, type, category_id");
    if (start) q = q.gte("occurred_on", start);
    if (end) q = q.lt("occurred_on", end);
    const { data, error } = await q.order("id").range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Row[]);
    if (!data || data.length < 1000) return out;
  }
}

const rowsBetween = (start: string, end: string) => fetchRows(start, end);

/** Saldo seluruh waktu (pemasukan - pengeluaran). */
export async function getBalance() {
  return totals(await fetchRows()).balance;
}

export function totals(rows: Row[]) {
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { income, expense, balance: income - expense };
}

export function spendByCategory(
  rows: Row[],
  categories: Category[],
  type: TxType = "expense",
): CategorySpend[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const sums = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== type) continue;
    sums.set(r.category_id, (sums.get(r.category_id) ?? 0) + r.amount);
  }
  return [...sums.entries()]
    .map(([id, total]) => ({
      category_id: id,
      name: byId.get(id)?.name ?? "?",
      color: byId.get(id)?.color ?? "#64748b",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getBudgetStatuses(
  rows: Row[],
  categories: Category[],
): Promise<BudgetStatus[]> {
  const { data, error } = await db().from("budgets").select("category_id, monthly_limit");
  if (error) throw error;
  const spent = new Map(spendByCategory(rows, categories).map((s) => [s.category_id, s.total]));
  const byId = new Map(categories.map((c) => [c.id, c]));
  return (data ?? [])
    .map((b) => {
      const limit = Number(b.monthly_limit);
      const s = spent.get(b.category_id) ?? 0;
      const c = byId.get(b.category_id);
      return {
        category_id: b.category_id,
        name: c?.name ?? "?",
        color: c?.color ?? "#64748b",
        limit,
        spent: s,
        pct: (s / limit) * 100,
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  const { data, error } = await db()
    .from("transactions")
    .select("id, amount, type, occurred_on, note, category:categories(id, name, color)")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as unknown as Transaction[];
}

export async function getMonthData(ym: string) {
  const { start, end } = monthRange(ym);
  const [rows, categories] = await Promise.all([rowsBetween(start, end), getCategories()]);
  return {
    categories,
    rows,
    summary: totals(rows),
    spend: spendByCategory(rows, categories),
    budgets: await getBudgetStatuses(rows, categories),
  };
}

export async function getRangeData(start: string, endExclusive: string) {
  const [rows, categories] = await Promise.all([
    rowsBetween(start, endExclusive),
    getCategories(),
  ]);
  return { rows, categories, summary: totals(rows), spend: spendByCategory(rows, categories) };
}

/** Transaksi satu bulan, terbaru dulu. */
export async function getMonthTransactions(ym: string, limit = 100): Promise<Transaction[]> {
  const { start, end } = monthRange(ym);
  const { data, error } = await db()
    .from("transactions")
    .select("id, amount, type, occurred_on, note, category:categories(id, name, color)")
    .gte("occurred_on", start)
    .lt("occurred_on", end)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as unknown as Transaction[];
}

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await db().from("goals").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map((g) => ({
    ...g,
    target_amount: Number(g.target_amount),
    saved_amount: Number(g.saved_amount),
  })) as Goal[];
}

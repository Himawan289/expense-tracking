"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { checkBudgetAlert, resetAlerts } from "@/lib/alerts";
import { currentMonth } from "@/lib/format";

export type FormState = { ok: boolean; message: string } | null;

const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export async function createTransaction(_: FormState, form: FormData): Promise<FormState> {
  const amount = Number(form.get("amount"));
  const type = form.get("type");
  const categoryId = form.get("category_id");
  const date = String(form.get("occurred_on") ?? "");
  const note = String(form.get("note") ?? "").trim() || null;

  if (!(amount > 0)) return { ok: false, message: "Nominal harus lebih dari 0" };
  if (type !== "expense" && type !== "income") return { ok: false, message: "Tipe tidak valid" };
  if (!isUuid(categoryId)) return { ok: false, message: "Pilih kategori" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Tanggal tidak valid" };

  const { error } = await db().from("transactions").insert({
    amount,
    type,
    category_id: categoryId,
    occurred_on: date,
    note,
  });
  if (error) return { ok: false, message: `Gagal menyimpan: ${error.message}` };

  if (type === "expense") {
    try {
      await checkBudgetAlert(categoryId, date.slice(0, 7));
    } catch (e) {
      console.error("checkBudgetAlert gagal", e);
    }
  }

  revalidatePath("/");
  revalidatePath("/report");
  revalidatePath("/plan");
  return { ok: true, message: "Transaksi tersimpan" };
}

export async function setBudget(_: FormState, form: FormData): Promise<FormState> {
  const categoryId = form.get("category_id");
  const limit = Number(form.get("monthly_limit"));
  if (!isUuid(categoryId)) return { ok: false, message: "Pilih kategori" };
  if (!(limit > 0)) return { ok: false, message: "Batas harus lebih dari 0" };

  const { error } = await db()
    .from("budgets")
    .upsert({ category_id: categoryId, monthly_limit: limit }, { onConflict: "category_id" });
  if (error) return { ok: false, message: `Gagal menyimpan: ${error.message}` };

  await resetAlerts(categoryId, currentMonth());
  try {
    await checkBudgetAlert(categoryId, currentMonth());
  } catch (e) {
    console.error("checkBudgetAlert gagal", e);
  }

  revalidatePath("/");
  revalidatePath("/plan");
  return { ok: true, message: "Anggaran tersimpan" };
}

export async function deleteBudget(categoryId: string) {
  if (!isUuid(categoryId)) return;
  await db().from("budgets").delete().eq("category_id", categoryId);
  revalidatePath("/");
  revalidatePath("/plan");
}

export async function createGoal(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const target = Number(form.get("target_amount"));
  const saved = Number(form.get("saved_amount") || 0);
  const date = String(form.get("target_date") ?? "") || null;

  if (!name) return { ok: false, message: "Nama tujuan wajib diisi" };
  if (!(target > 0)) return { ok: false, message: "Target harus lebih dari 0" };
  if (!(saved >= 0)) return { ok: false, message: "Tabungan awal tidak valid" };
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, message: "Tanggal tidak valid" };

  const { error } = await db()
    .from("goals")
    .insert({ name, target_amount: target, saved_amount: saved, target_date: date });
  if (error) return { ok: false, message: `Gagal menyimpan: ${error.message}` };

  revalidatePath("/plan");
  return { ok: true, message: "Tujuan tersimpan" };
}

export async function addToGoal(form: FormData) {
  const id = form.get("goal_id");
  const amount = Number(form.get("amount"));
  if (!isUuid(id) || !(amount > 0)) return;

  const { data } = await db().from("goals").select("saved_amount").eq("id", id).single();
  if (!data) return;
  await db()
    .from("goals")
    .update({ saved_amount: Number(data.saved_amount) + amount })
    .eq("id", id);
  revalidatePath("/plan");
}

export async function deleteGoal(id: string) {
  if (!isUuid(id)) return;
  await db().from("goals").delete().eq("id", id);
  revalidatePath("/plan");
}

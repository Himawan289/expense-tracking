import { db } from "@/lib/supabase";
import { formatIDR, formatMonth } from "@/lib/format";
import { getBudgetStatuses, getMonthData, getRangeData } from "@/lib/data";
import { escapeHtml, sendTelegram } from "@/lib/telegram";

/**
 * Kirim alert jika pengeluaran kategori bulan ini >= 80% atau >= 100% batas.
 * alert_log menjaga tiap level hanya terkirim sekali per kategori per bulan.
 */
export async function checkBudgetAlert(categoryId: string, ym: string) {
  const { categories, rows } = await getMonthData(ym);
  const status = (await getBudgetStatuses(rows, categories)).find(
    (b) => b.category_id === categoryId,
  );
  if (!status) return;

  const level = status.pct >= 100 ? 100 : status.pct >= 80 ? 80 : null;
  if (!level) return;

  const { error } = await db()
    .from("alert_log")
    .insert({ category_id: categoryId, month: `${ym}-01`, level });
  if (error) {
    if (error.code === "23505") return; // level ini sudah pernah dikirim
    throw error;
  }

  const head =
    level === 100
      ? `🚨 <b>Anggaran ${escapeHtml(status.name)} terlampaui!</b>`
      : `⚠️ <b>Anggaran ${escapeHtml(status.name)} hampir habis</b>`;
  const sent = await sendTelegram(
    [
      head,
      `Bulan: ${formatMonth(ym)}`,
      `Terpakai: ${formatIDR(status.spent)} dari ${formatIDR(status.limit)} (${status.pct.toFixed(0)}%)`,
      status.pct >= 100
        ? `Lebih: ${formatIDR(status.spent - status.limit)}`
        : `Sisa: ${formatIDR(status.limit - status.spent)}`,
    ].join("\n"),
  );
  if (!sent) {
    // Biar dicoba lagi pada transaksi berikutnya.
    await db()
      .from("alert_log")
      .delete()
      .eq("category_id", categoryId)
      .eq("month", `${ym}-01`)
      .eq("level", level);
  }
}

/** Reset log alert saat batas anggaran diubah. */
export async function resetAlerts(categoryId: string, ym: string) {
  await db().from("alert_log").delete().eq("category_id", categoryId).eq("month", `${ym}-01`);
}

type Report = { title: string; start: string; endExclusive: string; budgetMonth?: string };

export async function sendReport({ title, start, endExclusive, budgetMonth }: Report) {
  const { summary, spend } = await getRangeData(start, endExclusive);

  const lines = [
    `📊 <b>${escapeHtml(title)}</b>`,
    "",
    `Pemasukan: ${formatIDR(summary.income)}`,
    `Pengeluaran: ${formatIDR(summary.expense)}`,
    `${summary.balance >= 0 ? "Surplus" : "Defisit"}: ${formatIDR(Math.abs(summary.balance))}`,
  ];

  if (spend.length) {
    lines.push("", "<b>Pengeluaran per kategori</b>");
    for (const s of spend) {
      const pct = summary.expense ? ((s.total / summary.expense) * 100).toFixed(0) : "0";
      lines.push(`• ${escapeHtml(s.name)}: ${formatIDR(s.total)} (${pct}%)`);
    }
  }

  if (budgetMonth) {
    const { budgets } = await getMonthData(budgetMonth);
    if (budgets.length) {
      lines.push("", "<b>Status anggaran</b>");
      for (const b of budgets) {
        const flag = b.pct >= 100 ? "🚨" : b.pct >= 80 ? "⚠️" : "✅";
        lines.push(`${flag} ${escapeHtml(b.name)}: ${b.pct.toFixed(0)}% (${formatIDR(b.spent)}/${formatIDR(b.limit)})`);
      }
    }
  }

  return sendTelegram(lines.join("\n"));
}


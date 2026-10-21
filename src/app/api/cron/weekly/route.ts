import { sendReport } from "@/lib/alerts";
import { addDays, currentMonth, formatDate, todayISO } from "@/lib/format";

// Dipanggil Vercel Cron (lihat vercel.json): 7 hari terakhir termasuk hari ini.
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = todayISO();
  const start = addDays(today, -6);
  const ok = await sendReport({
    title: `Ringkasan Mingguan ${formatDate(start)} – ${formatDate(today)}`,
    start,
    endExclusive: addDays(today, 1),
    budgetMonth: currentMonth(),
  });
  return Response.json({ ok });
}

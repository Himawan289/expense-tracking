import { sendReport } from "@/lib/alerts";
import { currentMonth, formatMonth, monthRange, shiftMonth } from "@/lib/format";

// Jalan tanggal 1 tiap bulan: laporkan bulan sebelumnya.
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const prev = shiftMonth(currentMonth(), -1);
  const { start, end } = monthRange(prev);
  const ok = await sendReport({
    title: `Ringkasan Bulanan ${formatMonth(prev)}`,
    start,
    endExclusive: end,
    budgetMonth: prev,
  });
  return Response.json({ ok });
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { createTransaction } from "@/app/actions";
import { useCloseModal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, TxType } from "@/lib/types";

export const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TransactionForm({ categories }: { categories: Category[] }) {
  const [type, setType] = useState<TxType>("expense");
  const [state, action, pending] = useActionState(createTransaction, null);
  const close = useCloseModal();
  const options = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipe transaksi">
        {(["expense", "income"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            variant={type === t ? "default" : "outline"}
            className={cn("rounded-full", type === t && t === "income" && "bg-emerald-600 hover:bg-emerald-600/90")}
            onClick={() => setType(t)}
          >
            {t === "expense" ? "Pengeluaran" : "Pemasukan"}
          </Button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">Nominal (Rp)</Label>
        <Input id="amount" name="amount" type="number" inputMode="numeric" min={1} step="any" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category_id">Kategori</Label>
          <select id="category_id" name="category_id" required className={selectClass} key={type}>
            <option value="">Pilih…</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="occurred_on">Tanggal</Label>
          <Input id="occurred_on" name="occurred_on" type="date" defaultValue={todayISO()} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Catatan</Label>
        <Textarea id="note" name="note" rows={2} maxLength={200} />
      </div>

      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
      {state && !state.ok && (
        <p role="status" className="text-sm text-rose-600">
          {state.message}
        </p>
      )}
    </form>
  );
}

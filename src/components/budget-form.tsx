"use client";

import { useActionState, useEffect } from "react";
import { setBudget } from "@/app/actions";
import { useCloseModal } from "@/components/modal";
import { selectClass } from "@/components/transaction-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/lib/types";

export function BudgetForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(setBudget, null);
  const close = useCloseModal();

  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="budget_category">Kategori</Label>
        <select id="budget_category" name="category_id" required className={selectClass}>
          <option value="">Pilih…</option>
          {categories
            .filter((c) => c.type === "expense")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="monthly_limit">Batas per bulan (Rp)</Label>
        <Input id="monthly_limit" name="monthly_limit" type="number" min={1} step="any" required />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Menyimpan…" : "Simpan anggaran"}
      </Button>
      {state && !state.ok && (
        <p role="status" className="text-sm text-rose-600">
          {state.message}
        </p>
      )}
    </form>
  );
}

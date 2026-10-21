"use client";

import { useActionState, useEffect } from "react";
import { createGoal } from "@/app/actions";
import { useCloseModal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalForm() {
  const [state, action, pending] = useActionState(createGoal, null);
  const close = useCloseModal();

  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="goal_name">Nama tujuan</Label>
        <Input id="goal_name" name="name" maxLength={80} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="target_amount">Target (Rp)</Label>
          <Input id="target_amount" name="target_amount" type="number" min={1} step="any" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="saved_amount">Sudah terkumpul (Rp)</Label>
          <Input id="saved_amount" name="saved_amount" type="number" min={0} step="any" defaultValue={0} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="target_date">Target tanggal (opsional)</Label>
        <Input id="target_date" name="target_date" type="date" />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending ? "Menyimpan…" : "Simpan tujuan"}
      </Button>
      {state && !state.ok && (
        <p role="status" className="text-sm text-rose-600">
          {state.message}
        </p>
      )}
    </form>
  );
}

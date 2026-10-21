"use client";

import { createContext, useContext, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CloseCtx = createContext<() => void>(() => {});

/** Dipakai form di dalam Modal untuk menutup dialog setelah sukses. */
export const useCloseModal = () => useContext(CloseCtx);

export function Modal({
  title,
  trigger,
  triggerClassName,
  variant = "default",
  children,
}: {
  title: string;
  trigger: React.ReactNode;
  triggerClassName?: string;
  variant?: "default" | "outline" | "secondary";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={cn("rounded-full", triggerClassName)}
        onClick={() => ref.current?.showModal()}
      >
        {trigger}
      </Button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && close()}
        className="m-auto w-[min(92vw,28rem)] rounded-3xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button type="button" variant="ghost" size="icon-sm" onClick={close} aria-label="Tutup">
              <X />
            </Button>
          </div>
          <CloseCtx.Provider value={close}>{children}</CloseCtx.Provider>
        </div>
      </dialog>
    </>
  );
}

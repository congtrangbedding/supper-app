"use client"
import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@ecommerce-os/ui/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetClose = SheetPrimitive.Close

function SheetContent({
  className,
  children,
  side = "right",
  closeLabel = "Đóng",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "left" | "right"; closeLabel?: string }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 z-50 flex w-full max-w-[100vw] flex-col gap-4 overflow-y-auto border-border bg-card p-5 shadow-lg outline-none",
          side === "right" ? "right-0 border-l sm:max-w-xl" : "left-0 border-r sm:max-w-md",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <X className="size-4" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("pr-8 text-lg font-semibold", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Sheet, SheetClose, SheetContent, SheetTitle, SheetDescription }

"use client";
import { useId, useState } from "react";
import { Button } from "@ecommerce-os/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@ecommerce-os/ui/components/dialog";
import { Label } from "@ecommerce-os/ui/components/label";
import { NativeSelect } from "@ecommerce-os/ui/components/input";
import { PRESETS } from "../services/presets";
import { RATIO_CHOICES, RATIO_INFO, type RatioChoice } from "../types/production";

export type BulkKind = "template" | "ratio";

function Body({ kind, count, onConfirm, onCancel }: { kind: BulkKind; count: number; onConfirm: (value: string) => void; onCancel: () => void }) {
  const uid = useId();
  const [value, setValue] = useState(kind === "template" ? PRESETS[0]!.id : "SQUARE");
  return (
    <>
      <DialogTitle>{kind === "template" ? "Đổi bộ template" : "Đổi tỷ lệ đầu ra"}</DialogTitle>
      <DialogDescription>
        Áp dụng cho {count} flow đã chọn. Flow đang mô phỏng hoặc không hỗ trợ lựa chọn này sẽ được bỏ qua và báo lại. Flow đã có kết quả mô phỏng sẽ về trạng thái Sẵn sàng.
      </DialogDescription>
      <div className="grid gap-1.5">
        <Label htmlFor={uid}>{kind === "template" ? "Bộ template mới" : "Tỷ lệ mới"}</Label>
        <NativeSelect id={uid} value={value} onChange={e => setValue(e.target.value)}>
          {kind === "template" ? PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : RATIO_CHOICES.map(r => <option key={r} value={r}>{RATIO_INFO[r as RatioChoice].label} · {RATIO_INFO[r as RatioChoice].detail}</option>)}
        </NativeSelect>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button onClick={() => onConfirm(value)}>Áp dụng</Button>
      </DialogFooter>
    </>
  );
}

export function BulkDialog({ kind, count, onConfirm, onClose }: { kind: BulkKind | null; count: number; onConfirm: (kind: BulkKind, value: string) => void; onClose: () => void }) {
  return (
    <Dialog open={kind !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent>{kind && <Body key={kind} kind={kind} count={count} onCancel={onClose} onConfirm={value => onConfirm(kind, value)} />}</DialogContent>
    </Dialog>
  );
}

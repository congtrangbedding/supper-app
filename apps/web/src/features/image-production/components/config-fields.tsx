"use client";
import { useId } from "react";
import { Info } from "lucide-react";
import { Input, NativeSelect, Textarea } from "@ecommerce-os/ui/components/input";
import { Label } from "@ecommerce-os/ui/components/label";
import { cn } from "@ecommerce-os/ui/lib/utils";
import { applyPreset, expectedImageCount, futureFeatureNotes } from "../services/flow-model";
import { getPreset, PRESETS } from "../services/presets";
import {
  BACKGROUND_INFO,
  BACKGROUND_MODES,
  IMAGE_STYLES,
  MAX_INSTRUCTIONS,
  MODE_INFO,
  PRODUCTION_MODES,
  RATIO_CHOICES,
  RATIO_INFO,
  STYLE_LABELS,
  type BackgroundMode,
  type FlowConfig,
  type ImageStyle,
  type ProductionMode,
  type RatioChoice
} from "../types/production";

/** Shared by the left panel (defaults for new flows) and the detail drawer (one flow). */
export function ConfigFields({ config, onChange, disabled, showAdvanced = true }: { config: FlowConfig; onChange: (next: FlowConfig) => void; disabled?: boolean; showAdvanced?: boolean }) {
  const uid = useId();
  const id = (name: string) => uid + name;
  const preset = getPreset(config.templateSetId);
  const notes = futureFeatureNotes(config);

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor={id("set")}>Bộ template ảnh</Label>
        <NativeSelect id={id("set")} value={config.templateSetId} disabled={disabled} onChange={e => { const p = getPreset(e.target.value); if (p) onChange(applyPreset(config, p)); }}>
          {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </NativeSelect>
        {preset && <p className="text-xs text-muted-foreground">{preset.description}</p>}
      </div>

      <fieldset className="grid gap-1.5" disabled={disabled}>
        <legend className="mb-1.5 text-sm font-medium">Tỷ lệ đầu ra</legend>
        <div className="grid grid-cols-3 gap-2">
          {RATIO_CHOICES.map(r => {
            const supported = preset ? preset.supportedRatios.includes(r) : true;
            const checked = config.outputRatios === r;
            return (
              <label key={r} className={cn("flex cursor-pointer flex-col rounded-md border p-2 text-xs has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50", checked ? "border-primary bg-primary/5" : "bg-background", !supported && "cursor-not-allowed opacity-50")}>
                <input type="radio" className="sr-only" name={id("ratio")} value={r} checked={checked} disabled={!supported || disabled} onChange={() => onChange({ ...config, outputRatios: r as RatioChoice })} />
                <span className="font-medium">{RATIO_INFO[r].label}</span>
                <span className="text-muted-foreground">{RATIO_INFO[r].detail}</span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{preset && preset.supportedRatios.length < 3 ? preset.name + " chỉ hỗ trợ một số tỷ lệ. " : ""}Mỗi flow có 9 khung ảnh → <strong>{expectedImageCount(config)} ảnh dự kiến</strong>.</p>
      </fieldset>

      <fieldset className="grid gap-1.5" disabled={disabled}>
        <legend className="mb-1.5 text-sm font-medium">Chế độ sản xuất</legend>
        <div className="grid gap-1.5">
          {PRODUCTION_MODES.map(m => (
            <label key={m} className={cn("flex cursor-pointer gap-2 rounded-md border p-2 text-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50", config.productionMode === m ? "border-primary bg-primary/5" : "bg-background")}>
              <input type="radio" name={id("mode")} className="mt-1 accent-[var(--color-primary)]" value={m} checked={config.productionMode === m} onChange={() => onChange({ ...config, productionMode: m as ProductionMode })} />
              <span><span className="font-medium">{MODE_INFO[m].label}</span><span className="block text-xs text-muted-foreground">{MODE_INFO[m].description}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      {showAdvanced && (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor={id("style")}>Phong cách ảnh mặc định</Label>
            <NativeSelect id={id("style")} value={config.imageStyle} disabled={disabled} onChange={e => onChange({ ...config, imageStyle: e.target.value as ImageStyle })}>
              {IMAGE_STYLES.map(s => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
            </NativeSelect>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={id("bg")}>Nền ảnh</Label>
            <NativeSelect id={id("bg")} value={config.backgroundMode} disabled={disabled} onChange={e => onChange({ ...config, backgroundMode: e.target.value as BackgroundMode })}>
              {BACKGROUND_MODES.map(b => <option key={b} value={b}>{BACKGROUND_INFO[b].label}</option>)}
            </NativeSelect>
            {config.backgroundMode === "SOLID" && (
              <div className="flex items-center gap-2">
                <input type="color" aria-label="Chọn màu nền" className="h-9 w-12 cursor-pointer rounded border bg-background p-0.5" value={/^#[0-9a-fA-F]{6}$/.test(config.solidColor) ? config.solidColor : "#ffffff"} disabled={disabled} onChange={e => onChange({ ...config, solidColor: e.target.value })} />
                <Input aria-label="Mã màu nền" className="w-28 font-mono" value={config.solidColor} disabled={disabled} onChange={e => onChange({ ...config, solidColor: e.target.value })} />
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={id("prompt")}>Hướng dẫn sáng tạo</Label>
            <Textarea id={id("prompt")} value={config.creativeInstructions} disabled={disabled} maxLength={MAX_INSTRUCTIONS} placeholder="Ví dụ: tông màu sáng, nhấn vào độ thoáng mát. Chỉ lưu để dùng ở giai đoạn sau." onChange={e => onChange({ ...config, creativeInstructions: e.target.value })} />
            <p className="text-right text-xs text-muted-foreground tabular-nums">{config.creativeInstructions.length}/{MAX_INSTRUCTIONS}</p>
          </div>
        </>
      )}

      {notes.length > 0 && (
        <ul className="grid gap-1 rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning" aria-label="Tính năng chưa kết nối">
          {notes.map(n => <li key={n} className="flex gap-1.5"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />{n}</li>)}
        </ul>
      )}
    </div>
  );
}

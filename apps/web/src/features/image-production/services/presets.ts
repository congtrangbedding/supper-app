import { SLOT_DEFINITIONS, SLOT_KEYS, type ImageSlot, type ImageStyle, type RatioChoice } from "../types/production";

export interface ProductionPreset {
  id: string;
  /** short code used in template ids */
  code: string;
  name: string;
  description: string;
  defaultStyle: ImageStyle;
  supportedRatios: RatioChoice[];
  defaultRatios: RatioChoice;
}

export const PRESETS: readonly ProductionPreset[] = [
  { id: "standard", code: "STD", name: "Standard E-commerce", description: "Bố cục thương mại rõ ràng, phù hợp mọi sản phẩm.", defaultStyle: "STANDARD", supportedRatios: ["SQUARE", "PORTRAIT", "BOTH"], defaultRatios: "SQUARE" },
  { id: "minimal-premium", code: "MIN", name: "Minimal Premium", description: "Nhiều khoảng trống, tông trung tính, cảm giác cao cấp.", defaultStyle: "MINIMAL", supportedRatios: ["SQUARE", "PORTRAIT", "BOTH"], defaultRatios: "PORTRAIT" },
  { id: "lifestyle-bedroom", code: "LBR", name: "Lifestyle Bedroom", description: "Đặt sản phẩm trong không gian phòng ngủ. Chỉ khổ dọc.", defaultStyle: "LIFESTYLE", supportedRatios: ["PORTRAIT", "BOTH"], defaultRatios: "PORTRAIT" },
  { id: "material-focus", code: "MAT", name: "Material Focus", description: "Cận cảnh chất liệu, đường may và họa tiết.", defaultStyle: "MATERIAL", supportedRatios: ["SQUARE", "PORTRAIT", "BOTH"], defaultRatios: "SQUARE" },
  { id: "promotional", code: "PRM", name: "Promotional", description: "Nhấn khuyến mãi và điểm bán. Chỉ khổ vuông.", defaultStyle: "PROMO", supportedRatios: ["SQUARE", "BOTH"], defaultRatios: "SQUARE" }
];

export const DEFAULT_PRESET_ID = "standard";

export function getPreset(id: string): ProductionPreset | undefined {
  return PRESETS.find(p => p.id === id);
}

/** Builds an independent copy of the nine slots for a preset. Later preset edits never touch existing flows. */
export function buildSlots(preset: ProductionPreset): ImageSlot[] {
  return SLOT_KEYS.map((key, i) => {
    const index = i + 1;
    return {
      index,
      key,
      title: SLOT_DEFINITIONS[key].title,
      purpose: SLOT_DEFINITIONS[key].purpose,
      templateId: preset.code + "-" + String(index).padStart(2, "0"),
      templateLabel: preset.name + " · " + SLOT_DEFINITIONS[key].title
    };
  });
}

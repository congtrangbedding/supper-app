import { z } from "zod";

export const SLOT_COUNT = 9;

export const FLOW_STATUSES = ["DRAFT", "READY", "SIMULATING", "DEMO_COMPLETED", "DEMO_FAILED", "CANCELLED"] as const;
export type FlowStatus = (typeof FLOW_STATUSES)[number];
export const FLOW_STATUS_LABELS: Record<FlowStatus, string> = {
  DRAFT: "Nháp (thiếu dữ liệu)",
  READY: "Sẵn sàng",
  SIMULATING: "Đang mô phỏng",
  DEMO_COMPLETED: "Mô phỏng xong",
  DEMO_FAILED: "Mô phỏng lỗi",
  CANCELLED: "Đã hủy"
};

export const RATIO_CHOICES = ["SQUARE", "PORTRAIT", "BOTH"] as const;
export type RatioChoice = (typeof RATIO_CHOICES)[number];
export const RATIO_INFO: Record<RatioChoice, { label: string; detail: string; formats: string[] }> = {
  SQUARE: { label: "1:1", detail: "Vuông 1200×1200", formats: ["1:1 · 1200×1200"] },
  PORTRAIT: { label: "3:4", detail: "Dọc 1200×1600", formats: ["3:4 · 1200×1600"] },
  BOTH: { label: "1:1 + 3:4", detail: "Cả hai khổ", formats: ["1:1 · 1200×1200", "3:4 · 1200×1600"] }
};

export const PRODUCTION_MODES = ["TEMPLATE", "AI_ASSISTED", "HYBRID"] as const;
export type ProductionMode = (typeof PRODUCTION_MODES)[number];
export const MODE_INFO: Record<ProductionMode, { label: string; description: string }> = {
  TEMPLATE: { label: "Template", description: "Ghép ảnh gốc vào bố cục có sẵn. Không dùng AI." },
  AI_ASSISTED: { label: "AI Assisted", description: "AI hỗ trợ nền và bố cục. Chưa kết nối: chỉ lưu cấu hình cho giai đoạn sau." },
  HYBRID: { label: "Hybrid", description: "Template cho phần cố định, AI cho phần sáng tạo. Chưa kết nối: chỉ lưu cấu hình." }
};

export const BACKGROUND_MODES = ["ORIGINAL", "SOLID", "PRESET_SCENE", "AI_GENERATED"] as const;
export type BackgroundMode = (typeof BACKGROUND_MODES)[number];
export const BACKGROUND_INFO: Record<BackgroundMode, { label: string; future: boolean }> = {
  ORIGINAL: { label: "Giữ nền ảnh gốc", future: false },
  SOLID: { label: "Màu đơn sắc", future: false },
  PRESET_SCENE: { label: "Bối cảnh có sẵn", future: false },
  AI_GENERATED: { label: "Nền do AI tạo (tương lai)", future: true }
};

export const IMAGE_STYLES = ["STANDARD", "MINIMAL", "LIFESTYLE", "MATERIAL", "PROMO"] as const;
export type ImageStyle = (typeof IMAGE_STYLES)[number];
export const STYLE_LABELS: Record<ImageStyle, string> = {
  STANDARD: "Thương mại tiêu chuẩn",
  MINIMAL: "Tối giản cao cấp",
  LIFESTYLE: "Không gian phòng ngủ",
  MATERIAL: "Nhấn chất liệu",
  PROMO: "Khuyến mãi nổi bật"
};

export const SLOT_KEYS = ["hero", "material", "dimensions", "lifestyle", "patterns", "features", "usage", "care", "summary"] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

export interface ImageSlot {
  /** 1-based position in the set */
  index: number;
  key: SlotKey;
  title: string;
  purpose: string;
  templateId: string;
  templateLabel: string;
}

export const SLOT_DEFINITIONS: Record<SlotKey, { title: string; purpose: string }> = {
  hero: { title: "Ảnh chính sản phẩm", purpose: "Ảnh đại diện đầu tiên người mua nhìn thấy." },
  material: { title: "Chi tiết chất liệu", purpose: "Cận cảnh bề mặt và chất liệu đã xác minh." },
  dimensions: { title: "Kích thước", purpose: "Thông số kích thước theo từng phân loại." },
  lifestyle: { title: "Bối cảnh sử dụng", purpose: "Sản phẩm trong không gian thực tế." },
  patterns: { title: "Họa tiết và màu sắc", purpose: "Các màu và họa tiết hiện có." },
  features: { title: "Tính năng nổi bật", purpose: "Các đặc tính đã xác minh của sản phẩm." },
  usage: { title: "Tình huống sử dụng", purpose: "Cách dùng trong các tình huống phổ biến." },
  care: { title: "Hướng dẫn bảo quản", purpose: "Giặt, phơi, bảo quản." },
  summary: { title: "Tổng hợp sản phẩm", purpose: "Tóm tắt thông tin để chốt đơn." }
};

export interface FlowConfig {
  /** id of the preset the config was created from; the slots below are an independent snapshot */
  templateSetId: string;
  templateSetName: string;
  outputRatios: RatioChoice;
  productionMode: ProductionMode;
  imageStyle: ImageStyle;
  backgroundMode: BackgroundMode;
  /** only meaningful when backgroundMode is SOLID */
  solidColor: string;
  creativeInstructions: string;
  slots: ImageSlot[];
}

export const RUN_OUTCOMES = ["completed", "failed", "cancelled", "interrupted"] as const;
export type RunOutcome = (typeof RUN_OUTCOMES)[number];
export interface RunEntry {
  id: string;
  startedAt: string;
  endedAt: string;
  outcome: RunOutcome;
  note: string;
}

/** Display data kept so a flow stays readable after its product or variant is deleted. */
export interface FlowSnapshot {
  productName: string;
  productCode: string;
  category: string;
  variantSku?: string;
  variantLabel?: string;
}

export interface ProductionFlow {
  id: string;
  productId: string;
  variantId?: string;
  snapshot: FlowSnapshot;
  config: FlowConfig;
  status: FlowStatus;
  /** number of times a run was started; drives the deterministic demo failure */
  attempts: number;
  runs: RunEntry[];
  createdAt: string;
  updatedAt: string;
}

export const MAX_FLOWS = 200;
export const MAX_RUNS_PER_FLOW = 20;
export const MAX_INSTRUCTIONS = 1000;

const text = z.string();
const slotSchema = z.object({
  index: z.number().int().min(1).max(SLOT_COUNT),
  key: z.enum(SLOT_KEYS),
  title: text,
  purpose: text,
  templateId: text,
  templateLabel: text
});
const configSchema = z.object({
  templateSetId: text,
  templateSetName: text,
  outputRatios: z.enum(RATIO_CHOICES),
  productionMode: z.enum(PRODUCTION_MODES),
  imageStyle: z.enum(IMAGE_STYLES),
  backgroundMode: z.enum(BACKGROUND_MODES),
  solidColor: text,
  creativeInstructions: text.max(MAX_INSTRUCTIONS),
  slots: z.array(slotSchema).length(SLOT_COUNT)
});
export const flowSchema: z.ZodType<ProductionFlow> = z.object({
  id: text.min(1),
  productId: text.min(1),
  variantId: text.optional(),
  snapshot: z.object({
    productName: text,
    productCode: text,
    category: text,
    variantSku: text.optional(),
    variantLabel: text.optional()
  }),
  config: configSchema,
  status: z.enum(FLOW_STATUSES),
  attempts: z.number().int().min(0),
  runs: z.array(z.object({ id: text, startedAt: text, endedAt: text, outcome: z.enum(RUN_OUTCOMES), note: text })).max(MAX_RUNS_PER_FLOW),
  createdAt: text,
  updatedAt: text
});

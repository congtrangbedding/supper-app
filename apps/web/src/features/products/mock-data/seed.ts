import type { Product, ProductAsset, ProductCategory, ProductFact, ProductVariant } from "../types/product";

/** Fictional sample data. Every record carries isSample: true and is labelled DEMO in the UI. */
const photo = (file: string, name: string): ProductAsset[] => [
  { id: "asset-" + file, name, size: 0, mimeType: "image/jpeg", source: "sample", url: "/content/" + file + ".jpg", isMain: true }
];
const variant = (sku: string, color: string, size: string): ProductVariant => ({ id: "var-" + sku, sku, color, size });
const fact = (id: string, label: string, value: string, verified: boolean, evidence = ""): ProductFact => ({
  id, label, value, verified, evidence
});

interface Row {
  id: string;
  name: string;
  code: string;
  category: ProductCategory;
  material: string;
  color: string;
  pattern: string;
  dimensions: string;
  features: string[];
  image?: string;
  variants: ProductVariant[];
  facts: ProductFact[];
  status: Product["status"];
  day: number;
}

const rows: Row[] = [
  {
    id: "sample-cooling", name: "Chiếu điều hòa Mộc Hạ", code: "MH-160", category: "Chiếu mát", material: "Sợi làm mát", color: "Xanh sage",
    pattern: "Chần ô vuông", dimensions: "160 × 200 cm", features: ["Bề mặt mát khi chạm", "Giặt máy được"], image: "cooling",
    variants: [variant("MH-160-SG", "Xanh sage", "160 × 200 cm"), variant("MH-180-SG", "Xanh sage", "180 × 200 cm")],
    facts: [fact("f1", "Chất liệu", "Sợi làm mát", true, "Nhãn mác nhà cung cấp"), fact("f2", "Kích thước", "160 × 200 cm", true, "Đo thực tế")],
    status: "ready", day: 18
  },
  {
    id: "sample-bamboo", name: "Chiếu tre Thanh Trúc", code: "TT-180", category: "Chiếu tre", material: "Tre ép", color: "Mật ong",
    pattern: "Nan tre", dimensions: "180 × 200 cm", features: ["Nan tre đã xử lý mối mọt"], image: "bamboo",
    variants: [variant("TT-180-MO", "Mật ong", "180 × 200 cm"), variant("TT-160-MO", "Mật ong", "160 × 200 cm")],
    facts: [fact("f1", "Chất liệu", "Tre ép", true, "Hóa đơn nhập hàng"), fact("f2", "Chống mối mọt", "Đã xử lý", false)],
    status: "ready", day: 17
  },
  {
    id: "sample-rattan", name: "Chiếu mây Hạ Phong", code: "HP-150", category: "Chiếu mây", material: "Mây đan", color: "Nâu nhạt",
    pattern: "Đan chéo", dimensions: "150 × 200 cm", features: ["Đan thủ công"],
    variants: [variant("HP-150-NN", "Nâu nhạt", "150 × 200 cm")],
    facts: [fact("f1", "Chất liệu", "Mây đan", false)],
    status: "draft", day: 16
  },
  {
    id: "sample-blanket", name: "Chăn cotton Đất Nung", code: "DN-150", category: "Chăn", material: "Cotton waffle", color: "Đất nung",
    pattern: "Dệt tổ ong", dimensions: "150 × 200 cm", features: ["Thoáng khí", "Mềm sau giặt"], image: "blanket",
    variants: [variant("DN-150-DN", "Đất nung", "150 × 200 cm"), variant("DN-150-KM", "Kem", "150 × 200 cm"), variant("DN-200-DN", "Đất nung", "200 × 220 cm")],
    facts: [fact("f1", "Thành phần", "100% cotton", true, "Nhãn mác"), fact("f2", "Định lượng", "320 gsm", true, "Phiếu kiểm hàng")],
    status: "ready", day: 15
  },
  {
    id: "sample-linen", name: "Bộ ga linen Bình Minh", code: "BM-160", category: "Bộ chăn ga", material: "Linen", color: "Kem sữa",
    pattern: "Trơn", dimensions: "160 × 200 cm", features: ["Bộ 4 món"], image: "linen",
    variants: [variant("BM-160-KS", "Kem sữa", "160 × 200 cm"), variant("BM-180-KS", "Kem sữa", "180 × 200 cm"), variant("BM-160-XX", "Xám", "160 × 200 cm")],
    facts: [fact("f1", "Số món", "4 món", true, "Đếm thực tế")],
    status: "ready", day: 14
  },
  {
    id: "sample-pillow", name: "Gối tựa Lam Khói", code: "LK-045", category: "Gối", material: "Vải lanh", color: "Xanh khói",
    pattern: "Dệt thô", dimensions: "45 × 45 cm", features: ["Ruột bông có thể tháo"], image: "pillow",
    variants: [variant("LK-045-XK", "Xanh khói", "45 × 45 cm")],
    facts: [fact("f1", "Kích thước", "45 × 45 cm", false)],
    status: "draft", day: 13
  },
  {
    id: "sample-rug", name: "Thảm dệt Cát Nhẹ", code: "CN-120", category: "Thảm", material: "Cotton dệt", color: "Kem cát",
    pattern: "Sọc ngang", dimensions: "120 × 180 cm", features: ["Chống trượt mặt sau"], image: "rug",
    variants: [variant("CN-120-KC", "Kem cát", "120 × 180 cm"), variant("CN-160-KC", "Kem cát", "160 × 230 cm")],
    facts: [fact("f1", "Mặt sau", "Chống trượt", true, "Kiểm tra mẫu")],
    status: "ready", day: 12
  },
  {
    id: "sample-cooling-2", name: "Chiếu điều hòa Lục Thủy", code: "LT-180", category: "Chiếu mát", material: "Sợi tencel", color: "Xanh lục",
    pattern: "Vân sóng", dimensions: "180 × 200 cm", features: [], image: "cooling",
    variants: [], facts: [], status: "draft", day: 11
  },
  {
    id: "sample-bedding", name: "Bộ chăn ga Mây Trắng", code: "MT-180", category: "Bộ chăn ga", material: "Cotton satin", color: "Trắng",
    pattern: "Trơn", dimensions: "180 × 200 cm", features: ["Bộ 5 món"], image: "linen",
    variants: [variant("MT-180-TR", "Trắng", "180 × 200 cm")],
    facts: [fact("f1", "Số món", "5 món", true, "Đếm thực tế")],
    status: "archived", day: 10
  }
];

export function createSeedProducts(): Product[] {
  return rows.map(row => {
    const stamp = "2026-11-" + String(row.day).padStart(2, "0") + "T09:00:00.000Z";
    return {
      id: row.id, name: row.name, code: row.code, category: row.category, brand: "An Nhiên (mẫu)",
      description: row.name + " — dữ liệu mẫu để thử nghiệm giao diện.", material: row.material, color: row.color,
      pattern: row.pattern, dimensions: row.dimensions, features: row.features, notes: "", facts: row.facts,
      variants: row.variants, assets: row.image ? photo(row.image, row.name + ".jpg") : [], status: row.status,
      isSample: true, createdAt: stamp, updatedAt: stamp
    };
  });
}

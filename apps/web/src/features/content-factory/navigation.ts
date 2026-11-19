export type NavStatus = "ready" | "soon";

export interface FactoryNavItem {
  /** path below /content, without leading slash */
  slug: string;
  title: string;
  status: NavStatus;
  description: string;
}
export interface FactoryNavGroup {
  id: string;
  label: string;
  items: FactoryNavItem[];
}

export const BASE_PATH = "/content";

const soon = (slug: string, title: string, description: string): FactoryNavItem => ({ slug, title, status: "soon", description });

export const factoryNavGroups: FactoryNavGroup[] = [
  { id: "overview", label: "Tổng quan", items: [{ slug: "dashboard", title: "Dashboard", status: "ready", description: "Điểm vào và tiến độ phát triển của AI Content Factory." }] },
  {
    id: "products",
    label: "Sản phẩm",
    items: [
      { slug: "products", title: "Danh sách sản phẩm", status: "ready", description: "Quản lý sản phẩm, SKU và ảnh gốc." },
      { slug: "products/new", title: "Thêm sản phẩm", status: "ready", description: "Tạo sản phẩm mới." }
    ]
  },
  {
    id: "image",
    label: "Image Factory",
    items: [
      soon("images/factory", "Xưởng sản xuất ảnh", "Cấu hình và chạy sản xuất ảnh hàng loạt từ sản phẩm."),
      soon("images", "Dự án ảnh", "Danh sách các bộ ảnh đã tạo cho từng sản phẩm."),
      soon("images/editor", "Image Editor", "Chỉnh sửa chín khung ảnh của một bộ ảnh."),
      soon("image-templates", "Kho Templates ảnh", "Template bố cục cho ảnh 1200×1200 và 1200×1600.")
    ]
  },
  {
    id: "video",
    label: "Video Factory",
    items: [
      soon("videos/factory", "Xưởng sản xuất video", "Cấu hình và chạy sản xuất video."),
      soon("videos", "Dự án video", "Danh sách video đã tạo cho từng sản phẩm."),
      soon("videos/storyboard", "Storyboard Editor", "Biên tập phân cảnh và lời thoại."),
      soon("video-templates", "Kho Templates video", "Template video và định dạng khung hình.")
    ]
  },
  {
    id: "operations",
    label: "Vận hành",
    items: [
      soon("media", "Media Library", "Kho ảnh, video và tài nguyên gốc của gian hàng."),
      soon("batch", "Batch Production", "Chạy hàng loạt theo preset sản xuất."),
      soon("jobs", "Render Jobs", "Theo dõi hàng đợi, thử lại và tạo lại."),
      soon("approvals", "Duyệt nội dung", "Đối chiếu bản sản xuất với đặc tính thật của sản phẩm."),
      soon("publishing", "Hàng đợi đăng bài", "Xuất bộ đã duyệt và tích hợp sàn thương mại điện tử.")
    ]
  },
  {
    id: "settings",
    label: "Cài đặt",
    items: [soon("settings/brand", "Brand Kit", "Màu sắc, font và logo thương hiệu."), soon("settings/ai", "AI Settings", "Nhà cung cấp AI và preset chất lượng.")]
  }
];

export const allFactoryItems = factoryNavGroups.flatMap(group => group.items);

export function factoryHref(slug: string) {
  return BASE_PATH + "/" + slug;
}

export function findFactoryItem(slug: string) {
  return allFactoryItems.find(item => item.slug === slug);
}

export function slugFromPath(pathname: string) {
  return pathname.replace(/^\/content\/?/, "").replace(/\/$/, "");
}

/** Item that should be highlighted for a pathname; dynamic product routes belong to "products". */
export function activeSlug(pathname: string) {
  const slug = slugFromPath(pathname);
  if (findFactoryItem(slug)) return slug;
  if (slug.startsWith("products/")) return "products";
  return undefined;
}

export const SOON_SLUGS = allFactoryItems.filter(item => item.status === "soon").map(item => item.slug);

/** Old Phase 01 / prototype paths that now redirect to the new structure. */
export const legacyRedirects: Record<string, string> = {
  "content-factory": "dashboard",
  "content-factory/products": "products",
  "content-factory/image-studio": "images/factory",
  "content-factory/media": "media",
  "content-factory/templates": "image-templates",
  "content-factory/render-jobs": "jobs"
};

export interface Crumb {
  label: string;
  href?: string;
}
export function factoryCrumbs(slug: string, trail: Crumb[] = []): Crumb[] {
  const root: Crumb[] = [{ label: "AI Content Factory", href: factoryHref("dashboard") }];
  const item = findFactoryItem(slug);
  const group = factoryNavGroups.find(g => g.items.some(i => i.slug === slug));
  if (!item || !group) return [...root, ...trail];
  const crumbs = group.id === "overview" ? root : [...root, { label: group.label }];
  return trail.length ? [...crumbs, { label: item.title, href: factoryHref(item.slug) }, ...trail] : [...crumbs, { label: item.title }];
}

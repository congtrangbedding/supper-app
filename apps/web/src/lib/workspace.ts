import type { WorkspaceApplication } from "@ecommerce-os/contracts";

export const applications = [
  { slug: "content-factory", title: "AI Content Factory", description: "Sản xuất nội dung hình ảnh cho danh mục sản phẩm.", status: "in-development" },
  { slug: "marketing", title: "Marketing", description: "Quản lý quảng cáo, khuyến mãi và chiến dịch.", status: "coming-soon" },
  { slug: "accounting", title: "Kế toán", description: "Theo dõi giá vốn, hóa đơn và công nợ.", status: "coming-soon" },
  { slug: "analytics", title: "Phân tích Shopee", description: "Phân tích hiệu quả quảng cáo và sản phẩm.", status: "coming-soon" },
  { slug: "procurement", title: "Gọi hàng", description: "Lập kế hoạch nhập hàng và quản lý nhà cung cấp.", status: "coming-soon" }
] as const satisfies readonly WorkspaceApplication[];

export const factoryPages = [
  { slug: "products", title: "Sản phẩm" }, { slug: "image-studio", title: "Sản xuất ảnh" },
  { slug: "media", title: "Thư viện Media" }, { slug: "templates", title: "Templates" },
  { slug: "render-jobs", title: "Công việc Render" }
] as const;

export const destinations = [
  ...applications.map(app => ({ path: app.slug, title: app.title, description: app.description, status: app.status })),
  ...factoryPages.map(page => ({ path: "content-factory/" + page.slug, title: page.title, description: "Khu vực này thuộc lộ trình phát triển AI Image Factory.", status: "in-development" })),
  { path: "settings", title: "Cài đặt", description: "Cấu hình không gian làm việc sẽ có trong giai đoạn sau.", status: "coming-soon" }
];

export function getDestination(path: string) {
  return destinations.find(page => page.path === path);
}

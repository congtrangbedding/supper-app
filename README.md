# Ecommerce OS

Không gian vận hành nội bộ cho nhiều gian hàng Shopee và TikTok tại Việt Nam. Phase 01 cung cấp giao diện tổng quan và nền tảng phát triển. AI Image Factory thuộc AI Content Factory là mô-đun đầu tiên trong lộ trình.

## Chạy tại máy phát triển

Dùng Node.js 24 LTS và pnpm 10.34.9. Mở terminal tại thư mục chứa `pnpm-workspace.yaml`. Khi pnpm đã có trong PATH, chạy:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Truy cập http://localhost:3000. Nếu máy chỉ có Corepack, dùng `corepack pnpm install --frozen-lockfile` và `corepack pnpm dev`. Trên máy Windows hiện tại, shim pnpm nằm trong thư mục cục bộ. Để dùng lệnh ngắn trong phiên PowerShell mới:

```powershell
$env:Path = "$(Resolve-Path .tools/bin);$env:Path"
```

Phase 01 chạy với cấu hình mặc định. Nếu muốn tùy chỉnh môi trường, sao chép `.env.example` sang `apps/web/.env.local`. Docker và GPU chưa cần thiết.

## Lệnh từ gốc

| Lệnh | Mục đích |
| --- | --- |
| `pnpm dev` | Khởi động Next.js có tải lại khi sửa mã |
| `pnpm lint` | Kiểm tra ESLint toàn kho |
| `pnpm typecheck` | Sinh kiểu route và kiểm tra TypeScript |
| `pnpm test` | Chạy Vitest một lần |
| `pnpm build` | Tạo bản production |
| `pnpm start` | Phục vụ bản production đã build |

## Bố cục

- `apps/web/src/app` chứa App Router, dashboard, trang trạng thái và CSS.
- `apps/web/src/components` chứa khung điều hướng, header và vùng nội dung.
- pps/web/src/features chứa các tính năng: content-factory (điều hướng, dashboard) và products (Product Studio, dữ liệu demo lưu trên trình duyệt). Chạy pnpm dev rồi mở http://localhost:3000/content/dashboard. Chức năng chưa làm hiển thị Coming soon.
- `apps/web/src/lib` chứa danh mục điều hướng và ánh xạ biểu tượng.
- `packages/ui` cung cấp các thành phần shadcn/ui dùng chung.
- `packages/contracts` khai báo kiểu dữ liệu dùng qua ranh giới package.
- `packages/config` cung cấp cấu hình TypeScript strict.
- `docs` chứa [kiến trúc](docs/ARCHITECTURE.md), [lộ trình](docs/IMPLEMENTATION_PLAN.md), [nghiệm thu](docs/ACCEPTANCE_CRITERIA.md), [quyết định](docs/DECISIONS.md) và [môi trường](docs/ENVIRONMENT.md).

Ảnh phòng ngủ trên trang tổng quan là ảnh minh họa giao diện. [Ảnh nguồn trên Unsplash](https://images.unsplash.com/photo-1611892440504-42a792e24d32)

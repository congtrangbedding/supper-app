# Kiến trúc Ecommerce OS

Một ứng dụng Next.js phục vụ dashboard. App Router dựng nội dung trang ở máy chủ, sinh tĩnh các trang trạng thái từ danh mục. Header và điều hướng dùng client component để đọc đường dẫn và mở menu. Font và ảnh minh họa được phục vụ cục bộ.

## Hướng phụ thuộc

Web sử dụng UI và contracts. UI độc lập với route, shop và nghiệp vụ. Contracts chỉ mô tả giao diện trao đổi. Web, UI và contracts kế thừa TypeScript strict từ config. Workspace exports đưa mã nguồn TypeScript tới Next.js để biên dịch trong cùng bản phát hành.

## Modular monolith

Các miền dưới đây là ranh giới dự kiến. Mỗi miền sẽ sở hữu quy tắc và dữ liệu của mình. Miền khác gọi giao diện ứng dụng công khai khi cần phối hợp.

| Miền | Trách nhiệm dự kiến |
| --- | --- |
| core | Gian hàng, quyền truy cập và định danh dùng chung |
| content-factory | Đầu vào sản phẩm, bằng chứng thuộc tính, template, tài sản và phiên bản ảnh |
| marketing | Chiến dịch, quảng cáo và khuyến mãi |
| accounting | Hóa đơn, giá vốn và thanh toán |
| analytics | Tín hiệu sản phẩm và báo cáo hiệu quả |
| procurement | Kế hoạch nhập hàng và nhà cung cấp |

## AI Content Factory: UI-01 và UI-02 (chỉ frontend)

Mã nằm trong `apps/web/src/features` và route trong `apps/web/src/app/content`.

| Thư mục | Nội dung |
| --- | --- |
| `features/content-factory` | Danh mục điều hướng (`navigation.ts`), sidebar thu gọn được, breadcrumb, page header, toast, trang Coming soon, dashboard |
| `features/products/types` | Kiểu `Product`, `ProductVariant`, `ProductFact`, `ProductAsset`, schema zod và logic kiểm tra form (SKU trùng, điều kiện "Sẵn sàng") |
| `features/products/services` | `ProductRepository` (giao diện truy cập dữ liệu), bản cài đặt localStorage, store dùng chung, truy vấn tìm kiếm/lọc/sắp xếp, kho ảnh IndexedDB |
| `features/products/mock-data` | Dữ liệu mẫu hư cấu, mọi bản ghi có `isSample: true` và nhãn DEMO |
| `features/products/hooks`, `components` | `useProducts`, `useAssetUrls`, thư viện, form, chi tiết, upload ảnh |

Route: `/content/dashboard`, `/content/products`, `/content/products/new`, `/content/products/[id]`, `/content/products/[id]/edit`. Các mục điều hướng còn lại (Image/Video Factory, Vận hành, Cài đặt) dùng chung `/content/[...slug]` hiển thị trang Coming soon; slug ngoài danh mục trả 404. Các đường dẫn cũ `/content-factory` và `/content-factory/{products,image-studio,media,templates,render-jobs}` chuyển hướng (307) sang route mới.

### Lưu trữ demo và giới hạn

- Metadata sản phẩm lưu ở localStorage, khóa `ecommerce-os:content-factory:products:v1`. Dữ liệu hỏng được thay bằng bộ mẫu kèm thông báo. Nút "Khôi phục dữ liệu mẫu" đặt lại cả dữ liệu và ảnh.
- Ảnh người dùng chọn được lưu ở IndexedDB (`ecommerce-os-demo`), tối đa 8 ảnh mỗi sản phẩm, 3 MB mỗi ảnh, JPG/PNG/WebP. Bản ghi sản phẩm chỉ giữ metadata, không giữ byte ảnh hay object URL. Object URL chỉ tạo để xem trước và được thu hồi khi không dùng.
- Dữ liệu thuộc về từng trình duyệt, không chia sẻ giữa người dùng, không khóa ghi (hai tab sửa cùng lúc: ghi sau thắng). Xóa dữ liệu trang sẽ mất toàn bộ.
- Trang `/content/products/<id không tồn tại>` trả HTTP 200 rồi hiển thị trạng thái "Không tìm thấy sản phẩm", vì dữ liệu nằm ở trình duyệt.
- Cảnh báo thay đổi chưa lưu áp dụng khi đóng/tải lại tab và khi bấm Hủy; chưa chặn việc bấm liên kết điều hướng khác.
- "Đặc tính đã xác minh" do người bán tự đánh dấu; hệ thống không có AI hay cơ chế tự xác minh.
- Chưa có xác thực, cơ sở dữ liệu, kho tệp, AI, render hay tích hợp Shopee. Image/Video Factory, Media Library, Batch, Render Jobs, Duyệt, Đăng bài, Brand Kit và AI Settings chỉ là Coming soon.

Mã prototype trước đó của Codex (Image/Video Studio, batch, duyệt...) vượt phạm vi và được lưu để tham khảo tại `docs/archive-codex-content/`; thư mục này không được build, lint hay import.

## Dữ liệu và tác vụ nền trong tương lai

PostgreSQL lưu metadata và lịch sử, Prisma quản lý truy cập và migration. Storage tương thích S3 lưu ảnh gốc, ảnh đã render và gói xuất. Giữ khóa đối tượng trong cơ sở dữ liệu, cấp quyền truy cập tệp theo gian hàng. Giữ ảnh gốc để đối chiếu màu sắc, hình dạng và họa tiết.

Worker cùng codebase sẽ nhận công việc BullMQ qua Redis. Công việc tham chiếu phiên bản đầu vào bất biến, có trạng thái, khóa chống xử lý trùng và cơ chế thử lại. Worker ghi kết quả trước khi đánh dấu hoàn thành. Chỉ tách tiến trình khi có tác vụ nền.

Giao diện nhà cung cấp AI dự kiến nhận tham chiếu ảnh gốc, thuộc tính đã xác minh và yêu cầu chỉnh sửa. Adapter chuyển yêu cầu sang API cụ thể và trả tham chiếu kết quả hoặc lỗi có phân loại. Khóa API nằm phía máy chủ. Template SVG/React và Sharp đảm nhiệm bố cục và xuất ảnh theo kích thước, độc lập với nhà cung cấp AI.

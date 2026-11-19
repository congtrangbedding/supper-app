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

## AI Content Factory: UI-03 Xưởng sản xuất ảnh (chỉ frontend)

Route `/content/images/production` (mã trong `apps/web/src/features/image-production`). Không có API, cơ sở dữ liệu, AI hay tệp ảnh được tạo ra. "Hoàn tất" nghĩa là mô phỏng xong, không phải ảnh đã render.

| Thư mục | Nội dung |
| --- | --- |
| `types/production.ts` | Kiểu và schema zod: `ProductionFlow`, `FlowConfig`, 9 `ImageSlot`, trạng thái `DRAFT/READY/SIMULATING/DEMO_COMPLETED/DEMO_FAILED/CANCELLED`, giới hạn |
| `services/presets.ts` | 5 preset: Standard E-commerce, Minimal Premium, Lifestyle Bedroom (chỉ 3:4), Material Focus, Promotional (chỉ 1:1) |
| `services/flow-model.ts` | Logic thuần: cấu hình, kiểm tra, số ảnh dự kiến, chọn sản phẩm/phân loại, điều kiện sản xuất, ghép flow với sản phẩm, tìm kiếm, lọc, sắp xếp, phân trang |
| `services/production-repository.ts` | `ProductionRepository` (giao diện thay được bằng API) và bản localStorage |
| `services/simulation.ts`, `production-store.ts` | Bộ mô phỏng theo từng khung, store dùng chung (`useSyncExternalStore`) |
| `components/` | Panel cấu hình, chọn sản phẩm, bảng/thẻ flow, drawer chi tiết, thư viện 9 khung, hộp thoại hàng loạt |

- **Dữ liệu sản phẩm không bị nhân bản.** Flow chỉ giữ `productId`, `variantId` và một snapshot hiển thị (tên, mã, danh mục, SKU). Khi sản phẩm hoặc phân loại bị xóa, flow vẫn hiển thị bằng snapshot kèm cảnh báo và không thể chạy.
- **Preset được chụp lại.** Flow lưu bản sao 9 khung và tên bộ template; sửa preset sau này không đổi flow cũ.
- **Trạng thái Nháp/Sẵn sàng được suy ra** từ mức sẵn sàng hiện tại của sản phẩm (ảnh, phân loại, đặc tính đã xác minh), nên không bao giờ lỗi thời. Sản phẩm thiếu dữ liệu vẫn tạo được flow nhưng ở trạng thái Nháp, có lý do hiển thị và không chạy mô phỏng được.
- **Trùng lặp.** Cùng sản phẩm và phân loại đã có flow thì không tạo lại; giao diện hỏi xác nhận để tạo dự án riêng. Gửi hai lần liên tiếp chỉ tạo một lần.
- **Lưu trữ.** localStorage khóa `ecommerce-os:content-factory:production-flows:v1`, định dạng có phiên bản, kiểm tra từng bản ghi (bản ghi hỏng bị bỏ và có thông báo; JSON hỏng được đặt lại về trống). Tối đa 200 flow, 20 mục lịch sử mỗi flow. Không lưu byte ảnh hay object URL. Ghi sau thắng giữa các tab.
- **Mô phỏng.** Mỗi khung là một nhịp (450 ms), 9 nhịp mỗi flow, tiến độ chỉ nằm trong bộ nhớ. Kết quả có tính xác định: khoảng 1/5 flow lỗi có chủ đích ở lần chạy đầu (tại khung 6) để minh họa Thử lại; lần sau thành công. Chỉ ghi vào localStorage khi bắt đầu và kết thúc.
- **Tải lại hoặc rời trang khi đang mô phỏng:** mô phỏng không tiếp tục. Rời trang hoặc đóng workspace dừng mọi bộ đếm giờ và đặt flow thành `DEMO_FAILED` (lịch sử ghi "bị gián đoạn"); tải lại thì lần tải đầu của tab chuyển các flow còn `SIMULATING` thành `DEMO_FAILED`. Có thể Thử lại. Mở thêm tab mới khi tab khác đang mô phỏng sẽ làm các flow đó bị coi là gián đoạn.
- Chế độ AI Assisted/Hybrid và nền do AI tạo chỉ lưu cấu hình, được gắn nhãn "chưa kết nối".
- Bố cục: bảng từ 768 px, thẻ dưới 768 px; từ 1280 px panel cấu hình nằm bên trái (có thể ẩn, khi đó hiện thêm cột phụ), dưới 1280 px panel mở dạng sheet.
- Chưa làm (thuộc UI-04 trở đi): trình chỉnh sửa khung ảnh, kho template, render thật, tích hợp AI.

## Dữ liệu và tác vụ nền trong tương lai

PostgreSQL lưu metadata và lịch sử, Prisma quản lý truy cập và migration. Storage tương thích S3 lưu ảnh gốc, ảnh đã render và gói xuất. Giữ khóa đối tượng trong cơ sở dữ liệu, cấp quyền truy cập tệp theo gian hàng. Giữ ảnh gốc để đối chiếu màu sắc, hình dạng và họa tiết.

Worker cùng codebase sẽ nhận công việc BullMQ qua Redis. Công việc tham chiếu phiên bản đầu vào bất biến, có trạng thái, khóa chống xử lý trùng và cơ chế thử lại. Worker ghi kết quả trước khi đánh dấu hoàn thành. Chỉ tách tiến trình khi có tác vụ nền.

Giao diện nhà cung cấp AI dự kiến nhận tham chiếu ảnh gốc, thuộc tính đã xác minh và yêu cầu chỉnh sửa. Adapter chuyển yêu cầu sang API cụ thể và trả tham chiếu kết quả hoặc lỗi có phân loại. Khóa API nằm phía máy chủ. Template SVG/React và Sharp đảm nhiệm bố cục và xuất ảnh theo kích thước, độc lập với nhà cung cấp AI.

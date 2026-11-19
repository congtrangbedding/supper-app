# Nghiệm thu Phase 01

## Checklist

- [x] Khởi tạo trong checkout hiện tại, dùng repository Git sẵn có.
- [x] pnpm cài được phụ thuộc và phân giải các package nội bộ.
- [x] Next.js dùng App Router, src, alias và TypeScript strict.
- [x] Tailwind tạo CSS và shadcn/ui hiển thị Button, Card, Badge, Separator.
- [x] Dashboard tiếng Việt có đủ năm ứng dụng, trạng thái và quy trình dự kiến.
- [x] Điều hướng và các trang trạng thái hoạt động, đường dẫn lạ trả 404.
- [x] Lint, typecheck, test và build production thành công.
- [x] Khởi động ứng dụng và kiểm tra HTTP thành công.
- [x] Tài liệu tiếng Việt, tệp môi trường mẫu an toàn, thay đổi chưa được commit.

## AI Content Factory UI-01 và UI-02 (`/content/*`)

Chỉ frontend, dữ liệu demo (xem ARCHITECTURE.md). Đã kiểm tra trên Chrome với bản production:

- Route: Dashboard, danh sách, thêm, chi tiết, sửa và 15 trang Coming soon đều trả 200 khi truy cập trực tiếp; `/content` và `/content-factory*` chuyển hướng 307; slug lạ trả 404.
- Luồng thật: tìm kiếm không dấu, lọc danh mục/trạng thái, sắp xếp, chọn tất cả và chọn hàng loạt, tạo sản phẩm kèm biến thể, SKU trùng, đặc tính xác minh, kiểm tra ảnh (loại, dung lượng), xem trước ảnh, lưu và hiển thị lại sau khi tải lại trang, sửa, hộp thoại thay đổi chưa lưu, xóa có xác nhận, xóa hàng loạt, khôi phục dữ liệu mẫu, phục hồi khi localStorage hỏng, menu thao tác bằng bàn phím.
- Bố cục: không tràn ngang ở 320, 390, 768, 1024 và 1440 px trên 7 trang; bảng ở từ 768 px, thẻ dưới 768 px; menu mobile mở bằng nút, đóng bằng Escape và sau khi chọn liên kết.
- Chưa kiểm tra: trình đọc màn hình thật, bảng tương phản màu tự động, Firefox/Safari, thao tác kéo thả tệp thật (chỉ kiểm tra chọn tệp), thao tác sắp xếp lại ảnh bằng nút trong trình duyệt (có test logic).

## Kiểm tra tự động

Chạy từ gốc theo thứ tự `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Vitest kiểm tra HTML trang chủ, số ứng dụng và nhãn trạng thái, liên kết, danh mục đường dẫn và ghi đè lớp CSS dùng chung. Typecheck bao phủ web, UI và contracts.

## Kiểm tra ứng dụng đang chạy

1. Chạy `pnpm start`, mở http://localhost:3000. Kiểm tra lời chào, năm thẻ ứng dụng, quy trình dự kiến và ảnh minh họa.
2. Mở liên kết mô-đun chính và từng mục sidebar, tải lại trực tiếp. Trang hợp lệ trả HTTP 200, đường dẫn không tồn tại trả 404.
3. Mở Marketing để xác nhận nhãn Coming soon. Kiểm tra giao diện dùng trạng thái phát triển thực tế.
4. Thu hẹp cửa sổ xuống 390 px. Mở menu bằng bàn phím, nhấn Escape, mở lại và chọn ứng dụng. Kiểm tra tiêu đề, focus và cuộn ngang.
5. Đối chiếu ảnh desktop và mobile. Kiểm tra nội dung có thể đọc, nút có thể chọn và bảng điều hướng phù hợp với màn hình.

Đã kiểm tra trên Chrome với ảnh desktop 1440 px và mobile 390 px, đo tràn ngang ở 320, 390, 768, 1024 và 1440 px. Trang chủ và 11 điểm đến đều trả 200, đường dẫn ngoài danh mục trả 404. Menu mobile đóng bằng Escape và sau khi chọn trang.

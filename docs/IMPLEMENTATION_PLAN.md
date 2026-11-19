# Lộ trình tám giai đoạn

Đây là thứ tự đề xuất. Chỉ giai đoạn 01 thuộc phạm vi triển khai hiện tại.

| Giai đoạn | Phạm vi và phụ thuộc dự kiến | Điều kiện hoàn thành |
| --- | --- | --- |
| 01 · Nền tảng | pnpm workspace, Next.js, dashboard, gói chia sẻ và kiểm tra chất lượng | Đạt checklist nghiệm thu, khởi động được bản production |
| 02 · Sản phẩm và SKU | Thiết kế mô hình gian hàng, sản phẩm, SKU và thuộc tính. Đưa PostgreSQL và Prisma vào sau khi duyệt mô hình | Migration chạy lại được ở môi trường mới, dữ liệu hợp lệ và được phân tách theo gian hàng |
| 03 · Tư liệu gốc | Kho MinIO/S3, tải ảnh và liên kết bằng chứng thuộc tính | Kiểm tra định dạng, quyền truy cập và truy xuất được bản gốc |
| 04 · Template và bố cục | SVG/React, trình chỉnh bố cục, chữ, nền và vị trí | Duyệt mẫu 1200×1200 và 1200×1600, bảo toàn đặc điểm sản phẩm |
| 05 · Sản xuất ảnh | Adapter AI, Sharp, worker BullMQ và Redis | Một ảnh chính, tám ảnh mô tả, có thể thử lại khi lỗi |
| 06 · Phiên bản và duyệt | Lịch sử sửa đổi, đối chiếu ảnh và thuộc tính thật | Người duyệt truy vết và chọn được phiên bản đạt yêu cầu |
| 07 · Xuất và tích hợp | JPG, PNG, ZIP và tích hợp Shopee khi có quyền API | Xuất đúng bộ đã duyệt, kiểm tra lỗi và giới hạn API |
| 08 · Vận hành và mở rộng | Quan sát hệ thống, sao lưu, đánh giá bảo mật, lập kế hoạch các ứng dụng còn lại | Diễn tập phục hồi và phê duyệt triển khai nội bộ |

Video với Remotion và FFmpeg là hướng mở rộng sau MVP. Thời điểm xác thực người dùng và phân quyền cần được chốt trước khi cho phép truy cập dữ liệu thật.

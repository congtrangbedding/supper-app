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

## Dữ liệu và tác vụ nền trong tương lai

PostgreSQL lưu metadata và lịch sử, Prisma quản lý truy cập và migration. Storage tương thích S3 lưu ảnh gốc, ảnh đã render và gói xuất. Giữ khóa đối tượng trong cơ sở dữ liệu, cấp quyền truy cập tệp theo gian hàng. Giữ ảnh gốc để đối chiếu màu sắc, hình dạng và họa tiết.

Worker cùng codebase sẽ nhận công việc BullMQ qua Redis. Công việc tham chiếu phiên bản đầu vào bất biến, có trạng thái, khóa chống xử lý trùng và cơ chế thử lại. Worker ghi kết quả trước khi đánh dấu hoàn thành. Chỉ tách tiến trình khi có tác vụ nền.

Giao diện nhà cung cấp AI dự kiến nhận tham chiếu ảnh gốc, thuộc tính đã xác minh và yêu cầu chỉnh sửa. Adapter chuyển yêu cầu sang API cụ thể và trả tham chiếu kết quả hoặc lỗi có phân loại. Khóa API nằm phía máy chủ. Template SVG/React và Sharp đảm nhiệm bố cục và xuất ảnh theo kích thước, độc lập với nhà cung cấp AI.

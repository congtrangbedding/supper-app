# Quy ước phát triển

- Trao đổi và viết tài liệu bằng tiếng Việt. Tên kiểu, hàm, tệp và package dùng tiếng Anh.
- Làm việc trong workspace hiện tại. Chạy pnpm từ gốc, giữ lockfile đồng bộ với manifest.
- Giữ route và nội dung hiển thị tại web. Chỉ đưa thành phần dùng chung vào ui, kiểu liên mô-đun vào contracts, cấu hình công cụ vào config.
- Nhập qua exports công khai của package. Tránh phụ thuộc ngược từ package về app hoặc nhập xuyên vào thư mục nội bộ.
- Chỉ triển khai giai đoạn đã được giao. Mô tả chức năng tương lai trong tài liệu và dùng trạng thái trung thực trên giao diện.
- Giữ bí mật ngoài Git. Chỉ đặt ví dụ an toàn trong .env.example. Dữ liệu gửi đến trình duyệt phải phù hợp với quyền truy cập.
- Dùng HTML ngữ nghĩa, nhãn điều khiển tiếng Việt, trạng thái focus và điều hướng bàn phím. Khi thêm route, kiểm tra truy cập trực tiếp và điều hướng nội bộ.
- Hoàn thành khi lint, typecheck, test, build thành công, trang trả HTTP đúng, bố cục desktop/mobile đã được kiểm tra và tài liệu phản ánh thay đổi. Ghi rõ mọi kiểm tra chưa thực hiện.

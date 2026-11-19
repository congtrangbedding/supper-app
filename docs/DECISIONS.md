# Nhật ký quyết định

| Quyết định | Lý do và đánh đổi |
| --- | --- |
| Một modular monolith trong pnpm workspace | Dễ chạy trên máy 16 GB và thay đổi nhiều package trong một phiên bản. Ranh giới cần được duy trì bằng exports và review. |
| Next.js App Router, React, TypeScript strict | Cùng hệ kiểu từ route tới UI. Phần tương tác điều hướng cần JavaScript phía trình duyệt. |
| Tailwind CSS, shadcn/ui và Lucide | Token màu và primitive nhất quán. Mã shadcn/ui được lưu trong repo nên cần chủ động đối chiếu registry khi cập nhật. |
| Trang trạng thái dùng chung theo danh mục đường dẫn | Truy cập được từng mục, hỗ trợ liên kết trực tiếp và 404 cho đường dẫn lạ. |
| Vitest, ESLint và production smoke check | Bao phủ logic, HTML và khả năng phục vụ thực tế. Bố cục vẫn cần duyệt ở các kích thước màn hình. |
| Giữ ESLint 9.39.5 | Plugin React trong preset Next.js hiện khai báo hỗ trợ tới ESLint 9. Registry báo nhánh 9 đã hết hỗ trợ. Nâng bản khi toàn bộ preset hỗ trợ ESLint 10. |
| Dùng Windows-native cho checkout hiện tại | Tránh thay đổi máy hoặc chuyển thư mục. Với checkout Linux riêng trong tương lai, ưu tiên Ubuntu WSL2, filesystem Linux và VS Code Remote WSL. |
| Thư viện ảnh và font cục bộ | Dashboard và build hoạt động độc lập với CDN. Sharp là phụ thuộc gián tiếp của Next.js, chưa có pipeline xử lý ảnh nghiệp vụ. |

Hoãn quyết định nhà cung cấp AI, cơ chế xác thực, hạ tầng production, quota, schema dữ liệu và đồng bộ Shopee tới giai đoạn có yêu cầu thực tế.

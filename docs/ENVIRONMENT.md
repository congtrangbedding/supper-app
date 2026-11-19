# Môi trường kiểm tra ngày 19/11/2026

| Mục | Quan sát |
| --- | --- |
| Checkout | C:\Users\admin\WORKSPACE\CODE\supper-app, ban đầu có .git và README.md một dòng, nhánh main |
| Hệ điều hành | Windows 10 Pro 10.0.19045, PowerShell chạy trực tiếp trên Windows |
| Bộ nhớ | Tổng RAM khả dụng cho hệ điều hành 15,90 GiB, còn khoảng 3,26 GiB lúc kiểm tra |
| Đĩa | Ổ C còn khoảng 274,76 GiB lúc kiểm tra |
| Node.js / npm | 24.16.0 / 11.13.0 |
| Corepack / pnpm | 0.35.0 / 10.34.9. Ban đầu thiếu lệnh pnpm, đã tạo shim cục bộ tại .tools/bin |
| Git | 2.12.0.windows.1, repository có sẵn |
| Docker CLI / Compose | 29.6.1 / 5.2.0 |
| WSL2 | docker-desktop và OpenClawGateway đều dừng, danh sách chưa có Ubuntu |

Giữ checkout này trên Windows và sử dụng bộ công cụ Node.js phía Windows. Nếu phát triển trong Ubuntu WSL2 ở lần thiết lập riêng, đặt checkout trong filesystem Linux và mở bằng VS Code Remote WSL. Phase 01 không phụ thuộc Docker daemon hay GPU.

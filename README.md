# Nutrition Menu

## Cài đặt

Project này là website HTML/CSS/JavaScript thuần, không cần backend.

## Chạy project

1. Mở thư mục project trong VS Code.
2. Mở file `index.html` bằng Live Server hoặc mở trực tiếp trong trình duyệt.
3. Nếu cần, cài extension Live Server trong VS Code.

## Cấu trúc project

- `index.html` - giao diện trang chính
- `css/style.css` - stylesheet
- `js/data.js` - dữ liệu thực phẩm và mục tiêu dinh dưỡng
- `js/app.js` - logic tính tổng chi phí, dinh dưỡng và lưu localStorage
- `image001.png` đến `image005.png` - hình minh họa thực phẩm

## Chức năng

- Chọn thực phẩm và sửa số lượng
- Tính tổng chi phí theo giá nhập vào
- Tính tổng dinh dưỡng thực tế
- So sánh với chuẩn tối thiểu
- Lưu trạng thái trong localStorage
- Reset thực đơn
- Hiển thị thông báo toast khi cập nhật

## Dữ liệu quan trọng

- Giá đã lấy từ file Excel mẫu: thịt lợn 13.000 đ, trứng gà 6.000 đ, đậu phụ 3.000 đ, rau xanh 2.000 đ, gạo tẻ 2.200 đ.
- Dinh dưỡng chuẩn được lấy từ cấu trúc Excel mẫu: năng lượng 750 Kcal, protein 25 g, lipid 18 g, glucid 100 g, canxi 280 mg.
- Các giá trị bắt đầu như trong mẫu file Excel được giữ lại nếu có sẵn trong tài liệu nguồn.

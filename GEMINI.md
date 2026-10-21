# Hệ Thống Máy Chủ Ubuntu `owl189` (HP Z2 Mini G3 Workstation)

File ghi nhớ tự động (`GEMINI.md`) này giúp Antigravity (`agy`) luôn nắm rõ cấu hình, quy tắc ổ cứng, dịch vụ và tên miền của máy chủ này trong mọi phiên làm việc.

## 1. Phần cứng & Quy tắc 3 Ổ Cứng (BẮT BUỘC TUÂN THỦ)
- **Máy chủ:** HP Z2 Mini G3 Workstation (`Intel Xeon E3-1245 v5 @ 3.50GHz`, 8 luồng, 16GB RAM, GPU NVIDIA Quadro M620 Mobile, Ubuntu 24.04 LTS).
- **Quy tắc sử dụng 3 ổ cứng:**
  1. **`nvme0n1` (SSD NVMe Kingston 250GB):** Chứa Windows — **TUYỆT ĐỐI KHÔNG ĐỤNG CHẠM, KHÔNG FORMAT, KHÔNG MOUNT**.
  2. **`sdb` (SSD WD Green 120GB - LVM `107 GB` gắn tại `/`):** Dành riêng cho hệ điều hành Ubuntu, Docker, Nginx, Node.js, VS Code và các gói hệ thống.
  3. **`sda2` (HDD Seagate 1TB - `ext4` nhãn `WEBDATA`, `916 GB` gắn tại `/mnt/webdata`):** Chuyên chứa toàn bộ thư mục dự án Web.
     - `/home/owl189/webapps` ➔ trỏ sang `/mnt/webdata/webapps`
     - `/var/www` ➔ trỏ sang `/mnt/webdata/www`

## 2. Tên Miền, Bảo Mật & Dịch Vụ Web (`mtk.io.vn`)
- **Tên miền chính thức:** `https://mtk.io.vn` (và `https://www.mtk.io.vn`)
- **Mạng nội bộ (LAN):** `http://192.168.0.109`
- **Mật khẩu truy cập Web (Nginx Basic Auth `/etc/nginx/.htpasswd`):**
  - Tài khoản: `yasuo189`
  - Mật khẩu: `1890`
- **Dự án Web chính đang chạy (`PrintFlow` + `Trung tâm Giám sát SSH & Màn hình Ubuntu`):**
  - Thư mục code: `/home/owl189/webapps/repocanhan`
  - Kho GitHub: `https://github.com/MaiKhanhTruong-owl/repocanhan.git` (nhánh `master`, đã đăng nhập sẵn qua `gh` CLI với tài khoản `MaiKhanhTruong-owl`, email `sbt0918203277@gmail.com`).
  - Lệnh tắt cập nhật nhanh (kéo code từ GitHub + build + khởi động lại dịch vụ): `update-web` (`/usr/local/bin/update-web`).

## 3. Các Dịch Vụ `systemd` Chạy Ngầm 24/7 (Headless Ready)
Tất cả dịch vụ dưới đây đã được `enable` để tự động khởi chạy khi bật nút nguồn Mini PC (không cần cắm màn hình rời):
1. `printflow.service`: Chạy backend `.prod_server.mjs` + `bambuBridge.js` (`127.0.0.1:5173`), kết nối trực tiếp với máy in 3D Bambu Lab P1S trong mạng LAN.
2. `nginx.service`: Phục vụ giao diện `dist/` của PrintFlow ở cổng `80` và `127.0.0.1:8080`, khóa mật khẩu `yasuo189:1890`, chống spam Rate-Limit và chuyển tiếp `/api/`, `/novnc/`, `/websockify`.
3. `aquarium-tunnel.service`: Chạy Cloudflare Named Tunnel cố định (`owl189-server`, ID `0a41fad0-0e09-4900-bc73-e56067d3811b`, cấu hình tại `/etc/cloudflared/config.yml`) nối `mtk.io.vn` vào `127.0.0.1:8080` (ẩn IP nhà 100%).
4. `ssh-monitor.service`: Chạy `/home/owl189/ssh-monitor/server.py` (`127.0.0.1:8888`) đo thông số CPU, RAM, 2 ổ cứng, công suất điện thực tế (Intel RAPL Watts) và đồng bộ Terminal SSH (`pts/*`).
5. `ubuntu-headless-vnc.service` & `ubuntu-novnc.service`: Chạy màn hình Desktop Ubuntu ảo độc lập (`Xtigervnc :10` tại `127.0.0.1:5910` + `websockify` tại `127.0.0.1:6080`) để điều khiển chuột & bàn phím trực tiếp trên trang `https://mtk.io.vn` (tab *Trung tâm Giám sát SSH*) mà không cần cắm màn hình vật lý.

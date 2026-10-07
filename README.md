# PrintFlow - Local 3D Printing & Filament Hub 🚀

Ứng dụng web chạy hoàn toàn **offline / local** giúp người dùng in 3D:
1. **Quản lý kho cuộn nhựa (Filaments):** Chất liệu (PLA, PETG, ABS, TPU...), màu sắc trực quan, khối lượng còn lại, nhiệt độ in, vị trí lưu kho / AMS.
2. **Quản lý tên file & model 3D (Files):** Kéo thả trực tiếp file `.stl`, `.3mf`, `.gcode`, `.step`, `.obj` từ máy tính vào để tự động ghi nhận tên, dung lượng và định dạng.
3. **Kéo thả đa mục (Interactive Drag & Drop):**
   - Kéo thả cuộn nhựa giữa 4 cột trạng thái: *Đang nạp máy* ⟷ *Hộp sấy* ⟷ *Trong kho* ⟷ *Sắp hết*.
   - Kéo thả file in 3D giữa các cột quy trình: *Hàng đợi* ⟷ *Sẵn sàng* ⟷ *Đang in* ⟷ *Đã xong* ⟷ *In lỗi*.
   - **Kéo thả màu nhựa thả trực tiếp vào file in** để ghép màu in ấn!
   - Kéo thả cuộn nhựa vào **4 Khay AMS / Spool Hub** trực quan.
4. **An toàn dữ liệu:** Lưu trữ tự động trên máy (LocalStorage), có nút Xuất/Nhập file sao lưu JSON.

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh

Bạn chỉ cần **click đúp vào file `run.bat`**:
- Ứng dụng sẽ tự động khởi động và mở trình duyệt tại: `http://localhost:5173`.
- Hoặc gõ lệnh trong terminal:
  ```bash
  npm run dev
  ```

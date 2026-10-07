@echo off
chcp 65001 >nul
title PrintFlow - Day Web Len Mang (Vercel)

echo =======================================================
echo    PrintFlow - Đưa Web Lên Mạng Với Vercel (Miễn Phí)
echo =======================================================
echo.

cd /d "%~dp0"

echo [OK] Đang chuẩn bị đẩy ứng dụng lên Vercel...
echo Nếu đây là lần đầu, Vercel sẽ tự mở trình duyệt để bạn đăng nhập (bằng GitHub hoặc Google).
echo Khi xuất hiện các câu hỏi trong bảng điều khiển, bạn chỉ cần nhấn phím Enter để chọn mặc định!
echo.

npx vercel

echo.
echo Hoàn tất! Bạn có thể xem đường dẫn web online ở trên.
pause

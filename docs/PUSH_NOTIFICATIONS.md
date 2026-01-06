# Push Notifications – Chat Messages (US-015)

Tài liệu tóm lược triển khai thông báo tin nhắn mới (PR5).

---

## Công nghệ & Thành phần

- **Client**: Expo Notifications (React Native).
- **Backend**: Supabase Edge Function `send-notification` (Deno + supabase-js).
- **Push Provider**: EPNS (Expo) → APNs (iOS) / FCM (Android).
- **RLS bypass**: `SUPABASE_SERVICE_ROLE_KEY` trong Edge Function để đọc `push_tokens` / `notification_preferences`.

---

## Luồng tổng quan

1. **Gửi tin nhắn (sender)**: Sau khi insert message, client gọi Edge Function `send-notification` với danh sách userIds recipient + payload.
2. **Edge Function**:
   - Đọc tokens (service role để bypass RLS), đọc preferences.
   - Gửi EPNS; cleanup token chết (`DeviceNotRegistered`).
3. **Nhận tin (receiver)**:
   - `useChatInboxRealtime`: lắng nghe INSERT messages → tăng unread + fetchConversations (badge nhanh).
   - `useNotifications`: nhận push; suppress nếu đang ở đúng chat; ngược lại hiển thị banner+âm thanh; cập nhật unread foreground.
   - `NotificationService`: handler suppression theo activeChat resolver; đăng ký token (kèm device_id) hỗ trợ multi-device.

---

## Files chính

### FE

- `src/services/notifications/handlers/chatHandler.ts` – chuẩn hoá payload, gửi Edge Function.
- `src/hooks/chat/useChatRealtime.ts` – nhận payload realtime, gửi notification nếu phù hợp.
- `src/hooks/chat/useChatInboxRealtime.ts` – subscribe inbox global, tăng unread + refresh conversations.
- `src/hooks/useNotifications.ts` – suppression theo activeChat, xử lý foreground, cập nhật unread.
- `src/services/notifications/NotificationService.ts` – handler, resolver activeChat, đăng ký token (device_id), setup channels.
- i18n: `chat.notification.newMessageTitle` (vi/en).

### BE

- `supabase/functions/send-notification/index.ts` – gửi push, filter preferences, cleanup token chết.
- (Schema giữ nguyên, không migration mới trong PR5).

---

## Hỗ trợ đa thiết bị

- Token đăng ký kèm `device_id` (androidId / iOS vendor ID).
- `registerPushToken` upsert theo `(user_id, device_id)`; không xoá token của thiết bị khác.
- Edge Function cleanup token chết khi EPNS trả `DeviceNotRegistered`.

---

## Suppression (foreground)

- Đang ở đúng chat → suppress banner/sound.
- Không ở đúng chat → vẫn banner + âm thanh.
- Background/quit → hiển thị push bình thường.

---

## Yêu cầu cấu hình

1. **Edge Function**:
   - Đặt `SUPABASE_SERVICE_ROLE_KEY` cho function.
   - Deploy: `supabase functions deploy send-notification`.
2. **Android FCM**:
   - `google-services.json` + rebuild app.
   - Upload FCM server key/service account lên Expo/EAS (FCM credentials).
3. **Thiết bị thử nghiệm**:
   - Mỗi user cần mở app (login) trên mỗi thiết bị để đăng ký token riêng.

---

## Cách kiểm thử

- Chuẩn bị: 2 thiết bị/emulator khác nhau, mỗi thiết bị login 1 user → bảng `push_tokens` phải có 2 token.
- Foreground, đúng chat: không banner/sound.
- Foreground, tab khác/chat khác: có banner + sound, badge tăng ngay.
- Background/quit: nhận push, tap mở ChatRoom.
- Kiểm tra receipts từ Edge Function: không còn `No push tokens found`; không còn `DeviceNotRegistered` (token chết sẽ bị xoá nếu có).

---

## Lỗi đã gặp & Cách fix

- **Firebase/FCM chưa setup**: thêm google-services.json, rebuild; upload FCM key lên Expo.
- **`deleted_at` không tồn tại ở chat_participants**: bỏ `.is('deleted_at', null)` trong query.
- **`No push tokens found`**: dùng service role ở Edge Function để đọc tokens; ensure user nhận đã đăng ký token trên thiết bị của họ.
- **Token chết/không ổn định**: cleanup `DeviceNotRegistered` trong Edge Function; hỗ trợ multi-device để tránh mất token khi login trên cùng máy với user khác.

---

## Lưu ý vận hành

- Token gắn với thiết bị, không gắn vĩnh viễn với user; cùng thiết bị, khi login user khác, token sẽ được cập nhật owner.
- Mỗi user cần có ít nhất một token đang active (mở app sau login) để nhận push.
- Notification_preferences: sẽ được khởi tạo/hiển thị ở PR6 (mặc định chưa có record nếu chưa gọi service).

# 🕐 Hướng dẫn Setup Cron Job cho Session Reminders

## Mục đích

Thiết lập External Cron Job để tự động kiểm tra và gửi thông báo nhắc nhở buổi học trước 10 phút.

---

## 📋 Prerequisites

- ✅ Edge Function `check-session-reminders` đã được deploy
- ✅ Migration 048 đã chạy (database triggers)
- ✅ Có Supabase Service Role Key

---

## 🚀 Bước 1: Lấy Service Role Key

### 1.1. Truy cập Supabase Dashboard

```
https://supabase.com/dashboard/project/jermzrwhdpraitnwwgfj
```

### 1.2. Vào Settings → API

```
Settings → API → Project API keys → Legacy anon, service_role API keys -> service_role (secret)
```

### 1.3. Copy Service Role Key

---

## 🌐 Bước 2: Tạo tài khoản Cron-job.org

### 2.1. Truy cập

```
https://cron-job.org
```

### 2.2. Đăng ký tài khoản

- Email: your-email@example.com
- Password: (chọn password mạnh)
- Verify email

### 2.3. Đăng nhập

---

## ⚙️ Bước 3: Tạo Cron Job

### 3.1. Click "Create cronjob"

### 3.2. Điền thông tin

#### **Title**

```
Check Session Reminders
```

#### **URL**

```
https://jermzrwhdpraitnwwgfj.supabase.co/functions/v1/check-session-reminders
```

#### **Schedule**

**Mỗi 1 phút (Nếu cần độ chính xác cao)**

```
*/1 * * * *
```

#### **Request method**

```
POST
```

#### **Request headers**

Click "Add header" và thêm 2 headers:

**Header 1:**

```
Name: Content-Type
Value: application/json
```

**Header 2:**

```
Name: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implcm16cndoZHByYWl0bnd3Z2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTExNDcwNiwiZXhwIjoyMDc2NjkwNzA2fQ.xFUSBTovmD1QlCay4vafX9TuXNHtRmO3234Ps5gRp7k
```

#### **Request body**

```json
{}
```

#### **Timeout**

```
30 seconds
```

### 3.3. Save

Click "Create cronjob"

---

## ✅ Bước 4: Test Cron Job

### 4.1. Test thủ công

Click nút **"Run now"** trên dashboard

### 4.2. Kiểm tra kết quả

**Execution history sẽ hiển thị:**

```
Status: Success (200)
Response time: ~200-500ms
Response body: {"success":true,"processed":0,"sent":0,"failed":0}
```

### 4.3. Kiểm tra Edge Function logs

```bash
supabase functions logs check-session-reminders --tail
```

**Expected logs:**

```
=== Starting check-session-reminders ===
Timestamp: 2024-12-28T10:00:00.000Z
Step 1: Querying pending reminders...
Found 0 pending reminders
No pending reminders to process
=== Finished ===
```

---

## 🧪 Bước 5: Test với Session thật

### 5.1. Tạo test session

Trong app, tạo session mới:

- Tên: "Test Reminder"
- Thời gian: 15 phút sau
- Lưu

### 5.2. Kiểm tra reminder được tạo

```sql
-- Chạy trong Supabase SQL Editor
SELECT
  sr.id,
  sr.session_id,
  sr.scheduled_at,
  sr.sent,
  ss.title
FROM session_reminders sr
JOIN study_sessions ss ON sr.session_id = ss.id
WHERE ss.title = 'Test Reminder'
ORDER BY sr.created_at DESC;
```

**Expected:**

- `scheduled_at`: ~5 phút sau (15 phút - 10 phút)
- `sent`: false

### 5.3. Đợi hoặc trigger thủ công

**Option A: Đợi đến giờ**

- Đợi đến `scheduled_at`
- Cron sẽ tự động chạy

**Option B: Trigger thủ công**

```bash
curl -X POST \
  https://jermzrwhdpraitnwwgfj.supabase.co/functions/v1/check-session-reminders \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 5.4. Kiểm tra notification

**Trên điện thoại:**

- ✅ Nhận push notification
- ✅ Title: "CÒN 10 PHÚT NỮA"
- ✅ Body: "Buổi học Test Reminder sẽ bắt đầu..."

**Trong database:**

```sql
SELECT * FROM notifications
WHERE type = 'session_reminder'
ORDER BY created_at DESC
LIMIT 1;
```

**Trong logs:**

```sql
SELECT * FROM session_reminder_logs
WHERE status = 'sent'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📊 Bước 6: Monitoring

### 6.1. Xem Execution History

Trên cron-job.org dashboard:

- Vào "Cronjobs" → "Check Session Reminders"
- Click "Execution history"

**Thông tin hiển thị:**

- Thời gian chạy
- Status code (200 = success)
- Response time
- Response body

### 6.2. Xem Edge Function Logs

```bash
supabase functions logs check-session-reminders --tail
```

### 6.3. Xem Database Logs

```sql
-- Reminders đã gửi hôm nay
SELECT COUNT(*) as sent_today
FROM session_reminders
WHERE sent = true
  AND sent_at::date = CURRENT_DATE;

-- Reminders thất bại
SELECT * FROM session_reminder_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- Reminders sắp tới
SELECT
  sr.scheduled_at,
  ss.title,
  COUNT(*) as recipient_count
FROM session_reminders sr
JOIN study_sessions ss ON sr.session_id = ss.id
WHERE sr.sent = false
GROUP BY sr.session_id, sr.scheduled_at, ss.title
ORDER BY sr.scheduled_at ASC
LIMIT 10;
```

---

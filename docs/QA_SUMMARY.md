# ❓ Tóm Tắt Câu Hỏi & Trả Lời - Buddy Up

> Tài liệu tóm tắt các câu hỏi thường gặp và cách trả lời

---

## 1. CHAT

### ❓ "Tính năng chat em làm như nào?"

**Trả lời ngắn gọn:**

- Sử dụng **Supabase Realtime** (WebSocket) để realtime
- Lưu messages trong **PostgreSQL database** (table `messages`)
- Subscribe vào database changes → tự động nhận message mới
- Upload files lên **Supabase Storage**

**Trả lời chi tiết:**

1. **Tạo chat room:** Dùng RPC function `create_direct_chat` để đảm bảo không duplicate
2. **Gửi message:** Insert vào `messages` table → Realtime tự động broadcast
3. **Realtime:** Subscribe `postgres_changes` trên table `messages` với filter `chat_id`
4. **Unread count:** Tính bằng số messages sau `last_read_at` trong `chat_participants`
5. **File upload:** Upload lên Supabase Storage bucket `chat_uploads`, lưu URL trong message

### ❓ "Sử dụng cái gì?"

- **Supabase Realtime** (WebSocket)
- **PostgreSQL Database** (Supabase)
- **Supabase Storage** (cho files)

### ❓ "Tại sao không sử dụng bên ngoài?"

**Lý do:**

1. ✅ **Tích hợp sẵn:** Database changes tự động sync → Realtime (không cần setup server riêng)
2. ✅ **Security:** Row Level Security (RLS) đảm bảo chỉ participants nhận được messages
3. ✅ **Consistency:** Database = source of truth, không có sync issues
4. ✅ **Đơn giản:** Không cần maintain WebSocket server, Supabase tự động handle reconnection
5. ✅ **Cost-effective:** Free tier đủ dùng, không cần server riêng

**So sánh:**

- Socket.io: Cần maintain server riêng → phức tạp hơn
- Firebase Realtime: NoSQL khó query, pricing cao
- **→ Chọn Supabase vì đơn giản, tích hợp tốt, security tốt**

---

## 2. NOTIFICATIONS

### ❓ "Tính năng thông báo em làm như nào?"

**Trả lời ngắn gọn:**

- **Expo Notifications** + **Firebase Cloud Messaging (FCM)** cho push notifications
- **Supabase Edge Function** để gửi notifications từ server
- Lưu **push tokens** trong database
- **Notification preferences** để user bật/tắt từng loại

**Trả lời chi tiết:**

**Flow:**

1. **Initialize:** Request permissions → Get Expo Push Token → Register vào database
2. **Gửi notification:** Client gọi Edge Function → Function lấy push tokens → Gửi đến Expo Push Service → Expo gửi đến FCM/APNS → Device nhận
3. **In-app notifications:** Lưu vào database table `notifications` để hiển thị trong app
4. **Suppression:** Không hiển thị notification nếu user đang xem chat đó

**Các thành phần:**

- **Client:** Expo Notifications (request permissions, receive notifications)
- **Backend:** Supabase Edge Function (gửi notifications)
- **Service:** Expo Push Notification Service (EPNS) → FCM/APNS
- **Database:** `push_tokens`, `notification_preferences`, `notifications`

**Tại sao dùng Edge Function?**

- Security: Service role key không expose ở client
- External APIs: Gọi Expo Push Service từ server (không thể từ client)
- Database access: Cần service role để đọc push_tokens (RLS)

---

## 3. SUPABASE AUTH

### ❓ "Em hiểu gì về Supabase Auth?"

**Bản chất:**

- Authentication service tích hợp sẵn với Supabase
- Cung cấp: User management, Multiple providers (Email/OAuth), JWT tokens, Session management

**Các tính năng:**

1. **Email/Password:** Sign up, sign in, password reset (OTP)
2. **OAuth:** Google, Facebook (và nhiều providers khác)
3. **JWT Tokens:** Access token (short-lived) + Refresh token (long-lived)
4. **Session Management:** Persistent sessions, auto refresh tokens

**Cách hoạt động:**

- User sign in → Supabase verify credentials → Tạo JWT tokens → Lưu session vào AsyncStorage
- Mỗi request tự động include JWT token trong header
- Database RLS policies check token để authorize

**Security:**

- Passwords được hash (bcrypt) - không bao giờ lưu plain text
- JWT tokens có expiration
- Auto refresh tokens khi hết hạn
- RLS policies đảm bảo user chỉ access được data của mình

**Ví dụ trong code:**

```typescript
// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// OAuth
await supabase.auth.signInWithOAuth({ provider: 'google' });

// Session
const {
  data: { session },
} = await supabase.auth.getSession();
```

---

## 4. SUPABASE STORAGE

### ❓ "Em hiểu gì về Supabase Storage?"

**Bản chất:**

- Object storage service (tương tự AWS S3)
- Cung cấp: Buckets, File management, RLS policies

**Các tính năng:**

1. **Buckets:** Container cho files (có thể set public/private)
2. **File Operations:** Upload, download, delete, get public URLs
3. **RLS Policies:** Control ai có thể upload/download

**Cách sử dụng:**

```typescript
// Upload
await supabase.storage.from('bucket_name').upload('path/to/file', fileBuffer);

// Get public URL
const { data } = supabase.storage.from('bucket_name').getPublicUrl('path/to/file');
```

**Trong dự án:**

- Bucket `chat_uploads`: Lưu images và PDFs trong chat
- Upload với path: `${chatId}/images/${timestamp}-${filename}`
- Get public URL để hiển thị trong app

**Ưu điểm:**

- Tích hợp sẵn với Supabase (không cần setup S3 riêng)
- RLS policies cho security
- CDN để serve files nhanh
- Free tier: 1GB

---

## 5. SUPABASE EDGE FUNCTIONS

### ❓ "Em hiểu gì về Supabase Edge Functions?"

**Bản chất:**

- Serverless functions chạy trên Deno runtime
- Cho phép custom backend logic không thể làm ở client

**Các tính năng:**

1. **Serverless:** Không cần maintain server, auto scaling
2. **Deno Runtime:** TypeScript native, secure by default
3. **Custom Logic:** Xử lý phức tạp, gọi external APIs

**Cách hoạt động:**

- Deploy function lên Supabase
- Function có URL: `https://[project].supabase.co/functions/v1/[function-name]`
- Client gọi qua `supabase.functions.invoke()`

**Ví dụ trong dự án:**

- Function `send-notification`: Gửi push notifications
  - Nhận request từ client
  - Lấy push tokens từ database (dùng service role key để bypass RLS)
  - Gọi Expo Push Service
  - Lưu in-app notifications vào database

**Tại sao cần Edge Function?**

- Security: Service role key không expose ở client
- External APIs: Gọi services từ server (không thể từ client)
- Database access: Cần service role để đọc sensitive data

**Cost:**

- Free tier: 500K invocations/month
- Sau đó: $0.0000025/invocation (rất rẻ)

---

## 6. CÁC CÂU HỎI KHÁC

### ❓ "Realtime có reliable không?"

**A:** Có, Supabase tự động:

- Reconnect nếu mất kết nối
- Retry mechanism
- Fallback nếu WebSocket fail

### ❓ "Notification có delay không?"

**A:** Thường < 5 giây, phụ thuộc vào:

- Expo Push Service
- FCM/APNS
- Network

### ❓ "Storage có giới hạn không?"

**A:**

- Free tier: 1GB
- Có thể optimize: Compress images, delete old files

### ❓ "Tại sao không dùng Socket.io?"

**A:**

- Socket.io cần maintain server riêng → phức tạp
- Supabase Realtime tích hợp sẵn → đơn giản
- RLS security tốt hơn
- Không cần handle reconnection

### ❓ "Tại sao không dùng Firebase?"

**A:**

- Supabase dùng PostgreSQL (SQL) → dễ query phức tạp
- RLS policies mạnh mẽ hơn Firebase Rules
- Pricing tốt hơn
- Open source, có thể self-host

---

## 7. CÁCH TRẢ LỜI TỔNG QUÁT

### Khi được hỏi về một tính năng:

1. **Nêu công nghệ sử dụng**
2. **Giải thích cách hoạt động** (flow)
3. **Lý do chọn giải pháp đó** (so sánh với alternatives)
4. **Ví dụ code** (nếu có thể)

### Khi được hỏi về Supabase:

1. **Giải thích bản chất** (là gì, làm gì)
2. **Các tính năng chính**
3. **Cách sử dụng trong dự án**
4. **Ưu điểm** (so sánh với alternatives)

---

**Xem chi tiết tại:** `docs/FEATURE_DETAILED_EXPLANATION.md`

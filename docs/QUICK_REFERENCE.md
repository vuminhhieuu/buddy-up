# 📋 Quick Reference - Buddy Up Project

> Tài liệu tóm tắt nhanh để xem lại trước khi vấn đáp

---

## 🎯 DỰ ÁN LÀ GÌ?

**Buddy Up** - Ứng dụng kết nối sinh viên tìm bạn học:

- Tìm bạn học phù hợp (matching algorithm)
- Chat realtime 1-1
- Tạo nhóm học tập
- Lên lịch buổi học
- Thông báo & nhắc nhở

---

## 🛠️ CÔNG NGHỆ CHÍNH

| Hạng mục          | Công nghệ                | Phiên bản |
| ----------------- | ------------------------ | --------- |
| **Frontend**      | React Native + Expo      | ~54.0     |
| **Language**      | TypeScript               | ~5.9      |
| **State**         | Redux Toolkit            | 2.9       |
| **Backend**       | Supabase                 | -         |
| **Database**      | PostgreSQL               | -         |
| **Navigation**    | React Navigation v7      | -         |
| **Form**          | Formik + Yup             | -         |
| **i18n**          | i18next                  | -         |
| **Notifications** | Expo Notifications + FCM | -         |

---

## 📱 CÁC TÍNH NĂNG

### 1. **Authentication**

- ✅ Email/Password
- ✅ Google OAuth
- ✅ Facebook OAuth
- ✅ Quên mật khẩu (OTP)

### 2. **Buddy Matching**

- ✅ Tìm kiếm với filters
- ✅ Match percentage (weighted algorithm)
- ✅ Gửi/nhận request kết bạn
- ✅ Lưu profiles

### 3. **Chat**

- ✅ Chat 1-1 realtime
- ✅ Gửi text + files
- ✅ Unread count
- ✅ Quick messages

### 4. **Study Sessions**

- ✅ Tạo/sửa/xóa session
- ✅ Mời participants
- ✅ Reminders tự động
- ✅ Calendar views (day/week/month)

### 5. **Study Groups**

- ✅ Tạo public group
- ✅ Posts trong group
- ✅ Members management
- ✅ Invitations

### 6. **Notifications**

- ✅ Push notifications
- ✅ In-app notifications
- ✅ Suppression (không notify khi đang xem chat)

---

## 🏗️ KIẾN TRÚC

```
Mobile App (React Native)
    ↓
Redux Store (State Management)
    ↓
Services Layer (API calls)
    ↓
Supabase (Auth + Database + Realtime)
```

**Cấu trúc thư mục:**

- `components/` - UI components
- `screens/` - Full pages
- `services/` - Business logic
- `store/` - Redux slices
- `navigation/` - Navigation config
- `hooks/` - Custom hooks
- `utils/` - Helpers

---

## 🔐 BẢO MẬT

1. **Row Level Security (RLS)**
   - Policies ở database level
   - Không thể bypass từ client

2. **Authentication**
   - JWT tokens
   - Session persistence
   - Auto refresh

3. **Environment Variables**
   - Secrets không hardcode
   - Load từ env

---

## ⚡ REALTIME

- **Supabase Realtime** (WebSocket)
- Subscribe to database changes
- Auto-update UI
- Dùng cho: Chat messages, Buddy requests

---

## 📊 DATABASE CHÍNH

**Core Tables:**

- `profiles` - User profiles
- `connections` - Buddy connections
- `chats` - Chat rooms
- `messages` - Chat messages
- `study_sessions` - Buổi học
- `study_groups` - Nhóm học
- `group_posts` - Posts trong group

**Tất cả đều có RLS policies**

---

## 🎨 MATCH ALGORITHM

**Weighted Score:**

- Learning Goals: **30%**
- Available Times: **25%**
- Learning Style: **20%**
- Level: **15%**
- Location: **5%**
- Interests: **3%**
- Streak Bonus: **2%**

---

## 💡 CÁCH TRẢ LỜI CÂU HỎI

### "Tại sao chọn React Native?"

→ Code một lần, chạy iOS + Android. Team quen React. Expo phát triển nhanh.

### "Tại sao Supabase?"

→ PostgreSQL (SQL mạnh). RLS tốt. Realtime tích hợp. Open source.

### "Bảo mật như thế nào?"

→ RLS ở database. JWT auth. Không hardcode secrets.

### "Realtime hoạt động ra sao?"

→ WebSocket subscribe database changes. Auto-update UI.

### "Match % tính thế nào?"

→ Weighted algorithm với 7 factors. Learning goals quan trọng nhất (30%).

---

## 📁 FILE QUAN TRỌNG

**Config:**

- `src/config/supabase.ts` - Supabase client
- `src/config/i18n.ts` - i18n setup
- `src/config/env.ts` - Environment variables

**Services:**

- `src/services/auth.ts` - Authentication
- `src/services/buddy/search.ts` - Buddy search
- `src/services/chat/messages.ts` - Chat messages
- `src/services/session/create.ts` - Create session
- `src/services/groups/create.ts` - Create group

**Store:**

- `src/store/slices/authSlice.ts` - Auth state
- `src/store/slices/buddySlice.ts` - Buddy state
- `src/store/slices/chatSlice.ts` - Chat state

**Utils:**

- `src/utils/matchCalculation.ts` - Match algorithm

---

## 🚀 DEPLOYMENT

- **Build:** Expo EAS Build
- **Platforms:** iOS + Android
- **Backend:** Supabase (hosted)

---

## 📝 NOTES

- **i18n:** Hỗ trợ Tiếng Việt + English
- **Notifications:** Expo Notifications + Firebase FCM
- **File Upload:** Supabase Storage
- **Error Handling:** Try-catch + logger
- **Code Quality:** ESLint + Prettier + Husky

---

**Xem chi tiết tại:** `docs/PROJECT_OVERVIEW.md`

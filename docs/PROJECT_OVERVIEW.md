# 📚 Tổng Quan Dự Án Buddy Up - Tài Liệu Vấn Đáp

> Tài liệu này tổng hợp toàn bộ thông tin về dự án Buddy Up để hỗ trợ vấn đáp với giảng viên.

---

## 1. GIỚI THIỆU DỰ ÁN

### 1.1. Mục đích

**Buddy Up** là ứng dụng mobile giúp sinh viên và người học kết nối với bạn học phù hợp để:

- Cùng nhau học tập và trao đổi kiến thức
- Tạo nhóm học tập
- Lên lịch buổi học
- Chat realtime
- Theo dõi tiến độ học tập

### 1.2. Đối tượng sử dụng

- Sinh viên đại học
- Người học tự do
- Người muốn tìm bạn học cùng môn học/sở thích

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1. Frontend Framework

- **React Native** (phiên bản 0.81.4)
- **Expo** (phiên bản ~54.0.13)
- **TypeScript** (phiên bản ~5.9.2)
- **React** (phiên bản 19.1.0)

**Lý do chọn:**

- Phát triển đa nền tảng (iOS + Android) với một codebase
- Hot reload nhanh, phát triển nhanh
- TypeScript đảm bảo type safety
- Expo cung cấp nhiều native modules sẵn có

### 2.2. State Management

- **Redux Toolkit** (RTK) - phiên bản 2.9.2
- **React Redux** - phiên bản 9.2.0

**Cấu trúc Store:**

```typescript
{
  auth: AuthState,      // Quản lý authentication
  buddy: BuddyState,    // Quản lý buddy matching
  chat: ChatState       // Quản lý chat conversations
}
```

**Lý do chọn Redux Toolkit:**

- Quản lý state tập trung, dễ debug
- Hỗ trợ async actions với `createAsyncThunk`
- DevTools tích hợp
- Pattern rõ ràng, dễ maintain

### 2.3. Backend & Database

- **Supabase** (Backend-as-a-Service)
  - **Authentication**: Email/Password + OAuth (Google, Facebook)
  - **PostgreSQL Database**: Lưu trữ dữ liệu
  - **Realtime**: WebSocket cho chat realtime
  - **Storage**: Lưu trữ ảnh, file
  - **Row Level Security (RLS)**: Bảo mật dữ liệu

**Lý do chọn Supabase:**

- Serverless, không cần tự quản lý server
- Realtime tích hợp sẵn cho chat
- RLS policies đảm bảo bảo mật
- PostgreSQL mạnh mẽ, hỗ trợ complex queries
- Free tier đủ cho development

### 2.4. Navigation

- **React Navigation v7**
  - `@react-navigation/native` - Core
  - `@react-navigation/native-stack` - Stack navigation
  - `@react-navigation/bottom-tabs` - Tab navigation

**Cấu trúc Navigation:**

```
AppNavigator (Root)
├── OnboardingNavigator (Lần đầu mở app)
├── AuthNavigator (Đăng nhập/Đăng ký)
└── MainTabsNavigator (App chính)
    ├── HomeTab
    ├── BuddyTab (BuddyStackNavigator)
    ├── ChatTab (ChatStackNavigator)
    ├── CommunityTab
    └── ProfileTab (ProfileStackNavigator)
```

### 2.5. Form Handling & Validation

- **Formik** (phiên bản 2.4.6) - Quản lý form state
- **Yup** (phiên bản 1.7.1) - Schema validation

**Ví dụ sử dụng:**

- Form đăng ký/đăng nhập
- Form setup profile
- Form tạo session/group

### 2.6. Internationalization (i18n)

- **i18next** (phiên bản 23.12.3)
- **react-i18next** (phiên bản 15.0.1)

**Hỗ trợ ngôn ngữ:**

- Tiếng Việt (mặc định)
- Tiếng Anh

**Cấu trúc i18n:**

```
src/assets/i18n/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── buddy.json
│   ├── chat.json
│   └── ...
└── vi/
    ├── common.json
    ├── auth.json
    └── ...
```

### 2.7. Notifications

- **expo-notifications** (phiên bản ~0.32.14)
- **Firebase Cloud Messaging** (FCM) - Cho push notifications

**Tính năng:**

- Push notifications khi có tin nhắn mới
- Nhắc nhở buổi học
- Thông báo khi có request kết bạn

### 2.8. UI Libraries & Styling

- **React Native Reanimated** - Animations
- **React Native Gesture Handler** - Gesture handling
- **Lucide React Native** - Icons
- **React Native Toast Message** - Toast notifications
- **Expo Linear Gradient** - Gradient backgrounds
- **Expo Image Picker** - Chọn ảnh từ gallery
- **Expo Document Picker** - Chọn file

### 2.9. Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Lint trước khi commit
- **TypeScript** - Type checking

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1. Kiến trúc tổng thể

```
┌─────────────────────────────────────┐
│     React Native Mobile App          │
│  (iOS + Android, Expo Framework)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Supabase Services            │
├─────────────────────────────────────┤
│  • Authentication (Auth)             │
│  • PostgreSQL Database               │
│  • Realtime (WebSocket)              │
│  • Storage (Files/Images)            │
│  • Edge Functions (Serverless)        │
└─────────────────────────────────────┘
```

### 3.2. Cấu trúc thư mục (Clean Architecture)

```
src/
├── components/          # UI Components (reusable)
│   ├── auth/
│   ├── buddy/
│   ├── chat/
│   ├── groups/
│   ├── ui/              # Common UI components
│   └── ...
├── screens/             # Screen components (full pages)
│   ├── auth/
│   ├── buddy/
│   ├── chat/
│   ├── session/
│   └── ...
├── navigation/          # Navigation configuration
├── services/            # Business logic & API calls
│   ├── auth.ts
│   ├── buddy/
│   ├── chat/
│   ├── session/
│   └── ...
├── store/               # Redux store & slices
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── buddySlice.ts
│   │   └── chatSlice.ts
│   └── index.ts
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
├── config/              # Configuration files
│   ├── supabase.ts
│   ├── i18n.ts
│   └── env.ts
├── constants/           # Constants & enums
└── types/               # TypeScript type definitions
```

### 3.3. Data Flow

```
User Action
    ↓
Component (UI)
    ↓
Dispatch Redux Action (Async Thunk)
    ↓
Service Layer (API calls to Supabase)
    ↓
Supabase (Database/Auth/Realtime)
    ↓
Response → Redux Slice (Update State)
    ↓
Component Re-renders (via useSelector)
```

---

## 4. CÁC TÍNH NĂNG CHÍNH

### 4.1. Authentication & User Management

#### 4.1.1. Đăng ký/Đăng nhập

**Các phương thức:**

- Email/Password
- Google OAuth
- Facebook OAuth

**Flow đăng ký:**

1. User nhập email/password hoặc chọn OAuth
2. Supabase Auth xử lý authentication
3. Tạo profile trong database nếu user mới
4. Chuyển đến Profile Setup nếu chưa setup

**File liên quan:**

- `src/services/auth.ts` - Auth service
- `src/screens/auth/` - Auth screens
- `src/store/slices/authSlice.ts` - Auth state

#### 4.1.2. Profile Setup (4 bước)

**Bước 1:** Thông tin cơ bản

- Display name
- Avatar
- Bio

**Bước 2:** Mục tiêu học tập

- Learning goals (mảng)
- Level (beginner/intermediate/advanced)

**Bước 3:** Thời gian học

- Available times (morning/afternoon/evening/weekend...)
- Learning style (serious/relaxed/balanced)

**Bước 4:** Sở thích & Chủ đề

- Learning interests (topics)
- Location

**File liên quan:**

- `src/screens/auth/ProfileSetup/` - Profile setup screens
- `src/store/slices/authSlice.ts` - Profile data state

#### 4.1.3. Quên mật khẩu

**Flow:**

1. User nhập email
2. Gửi OTP qua email (Supabase)
3. User nhập OTP để verify
4. Đặt lại mật khẩu mới

**File liên quan:**

- `src/services/auth.ts` - `requestPasswordReset`, `verifyPasswordResetOTP`, `resetPassword`

---

### 4.2. Buddy Matching (Tìm bạn học)

#### 4.2.1. Tìm kiếm & Lọc

**Filters:**

- Search query (tên)
- Learning goals
- Available times
- Learning style
- Level
- Only online users
- Only verified users
- Hide rejected connections
- Only saved profiles

**File liên quan:**

- `src/services/buddy/search.ts` - Search logic
- `src/store/slices/buddySlice.ts` - Filters state

#### 4.2.2. Match Percentage Calculation

**Thuật toán tính % match:**

```typescript
WEIGHTS = {
  learningGoals: 30%,      // Mục tiêu học tập
  availableTimes: 25%,      // Thời gian rảnh
  learningStyle: 20%,       // Phong cách học
  level: 15%,               // Trình độ
  location: 5%,              // Địa điểm
  learningInterests: 3%,     // Sở thích
  streak: 2%                // Bonus nếu cả 2 có streak > 7
}
```

**File liên quan:**

- `src/utils/matchCalculation.ts` - Match calculation logic

#### 4.2.3. Gửi Request Kết Bạn

**Flow:**

1. User swipe right trên profile
2. Gửi connection request
3. Tạo record trong `connections` table với status `pending`
4. Người nhận nhận notification

**File liên quan:**

- `src/services/buddy/connections.ts` - Connection management
- `src/store/slices/buddySlice.ts` - Request state

#### 4.2.4. Xử lý Request

**Các hành động:**

- Accept: Tạo chat room, cập nhật connection status = `accepted`
- Reject: Cập nhật connection status = `rejected`

**File liên quan:**

- `src/services/buddy/connections.ts` - `respondToBuddyRequest`
- `src/hooks/useBuddyRequests.ts` - Realtime listener

#### 4.2.5. Saved Profiles

- Lưu profile để xem lại sau
- Filter "Only saved" để chỉ xem profiles đã lưu

**File liên quan:**

- `src/services/buddy/savedProfiles.ts` - Save/unsave logic

---

### 4.3. Chat (Nhắn tin)

#### 4.3.1. Chat 1-1

**Flow:**

1. Khi accept buddy request → Tự động tạo chat room
2. Chat room có type `direct`
3. 2 participants trong `chat_participants` table

**File liên quan:**

- `src/services/chat/rooms.ts` - Chat room management
- `src/services/chat/conversations.ts` - List conversations

#### 4.3.2. Chat Realtime

**Công nghệ:**

- Supabase Realtime (WebSocket)
- Subscribe to `messages` table changes
- Auto-update UI khi có message mới

**Implementation:**

```typescript
// Subscribe to new messages
supabase
  .channel(`chat:${chatId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
    },
    (payload) => {
      // Handle new message
    },
  )
  .subscribe();
```

**File liên quan:**

- `src/hooks/chat/useChatInboxRealtime.ts` - Realtime hook
- `src/services/chat/messages.ts` - Message service

#### 4.3.3. Gửi Tin Nhắn

**Tính năng:**

- Text messages
- File attachments (images, documents)
- Quick messages (predefined templates)

**Flow:**

1. User nhập message
2. Gọi `sendMessage` service
3. Insert vào `messages` table
4. Realtime trigger → Các participants nhận message
5. Gửi push notification cho người khác

**File liên quan:**

- `src/services/chat/messages.ts` - `sendMessage`, `sendQuickMessage`
- `src/services/chat/uploads.ts` - File upload handling

#### 4.3.4. Unread Count

- Track `last_read_at` trong `chat_participants`
- Tính unread = số messages sau `last_read_at`
- Hiển thị badge trên tab Chat

**File liên quan:**

- `src/store/slices/chatSlice.ts` - Unread count state
- `src/services/chat/messages.ts` - `markMessagesRead`

---

### 4.4. Study Sessions (Buổi học)

#### 4.4.1. Tạo Session

**Thông tin session:**

- Title
- Subject (optional)
- Scheduled start time
- Scheduled end time (optional)
- Location (optional)
- Description (optional)
- Participants (invite friends)

**Flow:**

1. User điền form tạo session
2. Insert vào `study_sessions` table
3. Tạo participants records (status = `invited`)
4. Tự động tạo reminders (10 phút trước session)

**File liên quan:**

- `src/services/session/create.ts` - `createStudySession`
- `src/screens/session/CreateSessionScreen.tsx` - UI

#### 4.4.2. Session Reminders

**Implementation:**

- Database trigger tự động tạo reminders
- RPC function `insert_session_reminders`
- Reminder time = `scheduled_start - 10 minutes`
- Push notification khi đến giờ reminder

**File liên quan:**

- `supabase/migrations/047_create_session_reminder_functions.sql`
- `src/services/session/reminders.ts`

#### 4.4.3. Session Views

**Các view:**

- List View: Danh sách sessions
- Week View: Lịch tuần
- Month View: Lịch tháng
- Day View: Lịch ngày

**File liên quan:**

- `src/screens/session/` - Session screens
- `src/components/session/` - Session components

#### 4.4.4. Session Completion

- Mark session as completed
- Track learning time
- Update user progress

**File liên quan:**

- `src/services/session/completion.ts`

---

### 4.5. Study Groups (Nhóm học)

#### 4.5.1. Tạo Public Group

**Thông tin group:**

- Name
- Description
- Cover image (optional)
- Icon emoji (optional)
- Topics (1-3 topics)
- Student level
- Main language
- Expected activity frequency
- Requires approval (yes/no)
- Posting permission (all/moderators only)
- Rules (optional, multiple)

**Flow:**

1. User điền form (4 steps)
2. Generate unique slug từ name
3. Insert vào `study_groups` table
4. Add creator as owner member
5. Insert rules nếu có
6. Send invitations nếu có

**File liên quan:**

- `src/services/groups/create.ts` - `createPublicGroup`
- `src/screens/groups/CreatePublicGroupScreen.tsx` - UI

#### 4.5.2. Group Posts

- Tạo post trong group
- Upload files/images
- Comment (future feature)

**File liên quan:**

- `src/services/groups/posts.ts`
- `src/screens/groups/CreateGroupPostScreen.tsx`

#### 4.5.3. Group Members

- Join/Leave group
- Member roles: owner, moderator, member
- Member status: active, inactive

**File liên quan:**

- `src/services/groups/members.ts`

#### 4.5.4. Group Invitations

- Invite friends to group
- Accept/Reject invitations

**File liên quan:**

- `src/services/groups/` - Invitation logic

---

### 4.6. Notifications

#### 4.6.1. Push Notifications

**Types:**

- Chat message: Khi có tin nhắn mới
- Session reminder: Nhắc nhở buổi học
- Buddy request: Có request kết bạn
- Group invitation: Được mời vào group

**Implementation:**

- Expo Notifications + Firebase Cloud Messaging
- Register push token khi user login
- Supabase Edge Function gửi notification

**File liên quan:**

- `src/services/notifications/NotificationService.ts`
- `src/services/notifications/sendNotification.ts`
- `supabase/functions/send-notification/` - Edge function

#### 4.6.2. In-App Notifications

- Notification screen hiển thị tất cả notifications
- Mark as read
- Navigate to related screen khi tap

**File liên quan:**

- `src/screens/invitations/NotificationsScreen.tsx`
- `src/services/notifications/NotificationRouter.ts`

#### 4.6.3. Notification Suppression

- Không hiển thị notification nếu user đang xem chat đó
- Check active chat ID vs notification chat ID

**File liên quan:**

- `src/services/notifications/NotificationService.ts` - `shouldSuppressNotification`

---

### 4.7. Profile & Settings

#### 4.7.1. Profile Screen

- Hiển thị thông tin user
- Edit profile
- View achievements
- View stats (streak, sessions completed...)

**File liên quan:**

- `src/screens/profile/ProfileScreen.tsx`
- `src/services/profile/overview.ts`

#### 4.7.2. Achievements

- Badges system
- Track user progress
- Streak counter

**File liên quan:**

- `src/services/achievements.ts`
- `src/services/profile/achievements.ts`

#### 4.7.3. Settings

- Change password
- Language settings
- Notification preferences
- Theme (future)

**File liên quan:**

- `src/screens/profile/ProfileSettingsScreen.tsx`
- `src/services/notifications/notificationPreferences.ts`

---

## 5. DATABASE SCHEMA

### 5.1. Core Tables

#### `profiles`

- `user_id` (PK, FK → auth.users)
- `display_name`
- `avatar_url`
- `bio`
- `location`
- `learning_goals` (array)
- `available_times` (array)
- `learning_style`
- `level`
- `learning_interests` (array)
- `is_online`
- `is_verified`
- `created_at`, `updated_at`, `deleted_at`

#### `connections`

- `id` (PK)
- `user_id_1` (FK → profiles)
- `user_id_2` (FK → profiles)
- `status` (pending/accepted/rejected)
- `created_at`, `updated_at`, `deleted_at`

#### `chats`

- `id` (PK)
- `type` (direct/group)
- `name` (optional, for groups)
- `created_by` (FK → profiles)
- `created_at`, `updated_at`, `deleted_at`

#### `chat_participants`

- `chat_id` (FK → chats)
- `user_id` (FK → profiles)
- `last_read_at`
- `joined_at`

#### `messages`

- `id` (PK)
- `chat_id` (FK → chats)
- `sender_id` (FK → profiles)
- `content` (text)
- `attachments` (JSON array)
- `created_at`, `deleted_at`

#### `study_sessions`

- `id` (PK)
- `title`
- `subject` (optional)
- `scheduled_start`
- `scheduled_end` (optional)
- `creator_id` (FK → profiles)
- `location` (optional)
- `description` (optional)
- `status` (scheduled/in_progress/completed/cancelled)
- `created_at`, `updated_at`, `deleted_at`

#### `study_session_participants`

- `session_id` (FK → study_sessions)
- `user_id` (FK → profiles)
- `status` (invited/accepted/declined)
- `joined_at`

#### `study_groups`

- `id` (PK)
- `name`
- `description`
- `slug` (unique)
- `cover_image_url`
- `icon_emoji`
- `privacy_type` (public/private)
- `creator_id` (FK → profiles)
- `topics` (array)
- `student_level`
- `main_language`
- `expected_activity_frequency`
- `requires_approval`
- `posting_permission`
- `created_at`, `updated_at`, `deleted_at`

#### `group_members`

- `group_id` (FK → study_groups)
- `user_id` (FK → profiles)
- `role` (owner/moderator/member)
- `status` (active/inactive)
- `joined_at`

#### `group_posts`

- `id` (PK)
- `group_id` (FK → study_groups)
- `author_id` (FK → profiles)
- `content`
- `file_urls` (array)
- `created_at`, `updated_at`, `deleted_at`

### 5.2. Row Level Security (RLS)

**Tất cả tables đều có RLS policies:**

- Users chỉ có thể đọc/sửa dữ liệu của mình
- Chat participants chỉ đọc được messages của chat họ tham gia
- Group members chỉ đọc được posts của group họ tham gia
- ...

**File liên quan:**

- `supabase/migrations/014_enable_rls.sql`
- `supabase/migrations/015_*_rls_policies_*.sql`

---

## 6. REALTIME FEATURES

### 6.1. Chat Realtime

- Subscribe to `messages` table changes
- Auto-update chat UI khi có message mới
- Update unread count

**File liên quan:**

- `src/hooks/chat/useChatInboxRealtime.ts`

### 6.2. Buddy Requests Realtime

- Subscribe to `connections` table changes
- Auto-update incoming requests list
- Update badge count

**File liên quan:**

- `src/hooks/useBuddyRequests.ts`

---

## 7. SECURITY

### 7.1. Authentication

- Supabase Auth với JWT tokens
- Session persistence với AsyncStorage
- Auto refresh tokens

### 7.2. Row Level Security (RLS)

- Database-level security
- Policies kiểm tra user permissions
- Không thể bypass từ client

### 7.3. Environment Variables

- `SUPABASE_URL` và `SUPABASE_ANON_KEY` từ env
- Không hardcode secrets trong code

---

## 8. PERFORMANCE OPTIMIZATIONS

### 8.1. Code Splitting

- Lazy load screens khi cần
- Dynamic imports cho i18n resources

### 8.2. Image Optimization

- Expo Image với caching
- Compress images trước khi upload

### 8.3. List Optimization

- FlatList với `getItemLayout` khi có thể
- Pagination cho buddy search
- Virtual scrolling

### 8.4. State Management

- Redux selectors để tránh unnecessary re-renders
- Memoization với `useMemo`, `useCallback`

---

## 9. TESTING & QUALITY

### 9.1. Code Quality

- ESLint + Prettier
- TypeScript strict mode
- Husky pre-commit hooks

### 9.2. Error Handling

- Try-catch blocks
- Error logging với logger utility
- User-friendly error messages

---

## 10. DEPLOYMENT

### 10.1. Build

- Expo EAS Build
- Separate builds cho iOS và Android

### 10.2. Environment

- Development: Expo Go
- Production: Standalone app

---

## 11. CÁC VẤN ĐỀ ĐÃ GIẢI QUYẾT

### 11.1. OAuth Flow

- Xử lý redirect URL cho mobile
- Parse tokens từ hash fragment
- Handle Facebook email permission issue

### 11.2. Realtime Performance

- Optimize subscriptions
- Unsubscribe khi component unmount
- Debounce updates

### 11.3. Notification Handling

- Suppress notifications khi user đang xem chat
- Multi-device support
- Handle notification permissions

---

## 12. FUTURE ENHANCEMENTS

### 12.1. Tính năng có thể thêm

- Video call trong chat
- Group chat (nhiều người)
- Voice messages
- File sharing improvements
- Advanced analytics
- Social features (likes, comments on posts)

### 12.2. Technical Improvements

- Offline mode với local database
- Better caching strategy
- Performance monitoring
- Analytics integration

---

## 13. CÁCH TRẢ LỜI CÂU HỎI THƯỜNG GẶP

### Q: Tại sao chọn React Native thay vì Flutter/Native?

**A:**

- React Native cho phép code một lần, chạy trên cả iOS và Android
- Team đã có kinh nghiệm với React/JavaScript
- Ecosystem lớn, nhiều libraries
- Expo giúp phát triển nhanh với nhiều native modules sẵn có

### Q: Tại sao chọn Supabase thay vì Firebase?

**A:**

- Supabase dùng PostgreSQL (SQL) - dễ query phức tạp hơn NoSQL
- RLS policies mạnh mẽ hơn Firebase Rules
- Realtime tích hợp tốt với PostgreSQL
- Open source, có thể self-host
- Pricing tốt hơn cho PostgreSQL

### Q: Làm sao đảm bảo bảo mật?

**A:**

- Row Level Security (RLS) ở database level
- Không thể bypass từ client
- JWT tokens cho authentication
- Environment variables cho secrets
- Input validation với Yup

### Q: Realtime hoạt động như thế nào?

**A:**

- Supabase Realtime dùng WebSocket
- Subscribe to database changes
- Auto-update UI khi có thay đổi
- Unsubscribe khi component unmount để tránh memory leak

### Q: Match percentage được tính như thế nào?

**A:**

- Weighted algorithm với các factors:
  - Learning goals: 30%
  - Available times: 25%
  - Learning style: 20%
  - Level: 15%
  - Location: 5%
  - Interests: 3%
  - Streak bonus: 2%
- Tính điểm từng factor rồi weighted average

### Q: Làm sao handle offline mode?

**A:**

- Hiện tại chưa có offline mode
- Có thể implement với:
  - Local database (SQLite)
  - Queue actions khi offline
  - Sync khi online lại

---

## 14. TÀI LIỆU THAM KHẢO

- React Native Docs: https://reactnative.dev
- Expo Docs: https://docs.expo.dev
- Supabase Docs: https://supabase.com/docs
- Redux Toolkit Docs: https://redux-toolkit.js.org
- React Navigation Docs: https://reactnavigation.org

---

**Chúc bạn vấn đáp thành công! 🎓**

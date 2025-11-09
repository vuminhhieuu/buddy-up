# RLS Policies Reference Guide

Tài liệu tham khảo nhanh về tất cả Row Level Security (RLS) policies trong database Buddy Up.

## 📋 Tổng quan

Tất cả bảng trong `public` schema đều đã được enable RLS. Mỗi bảng có các policies riêng để kiểm soát quyền truy cập dữ liệu.

**Nguyên tắc chung:**

- ✅ Users chỉ có thể truy cập dữ liệu họ được phép
- ✅ Soft-deleted rows (`deleted_at IS NOT NULL`) được filter tự động
- ✅ `auth.uid()` được dùng để xác định user hiện tại
- ✅ Service role có quyền cao nhất (cho admin operations)

---

## 📊 Bảng tổng hợp Policies

| Bảng                           | SELECT              | INSERT        | UPDATE         | DELETE         |
| ------------------------------ | ------------------- | ------------- | -------------- | -------------- |
| **profiles**                   | All authenticated   | Own only      | Own only       | Own only       |
| **connections**                | Involved users      | Own request   | Involved users | Involved users |
| **chats**                      | Participants        | Authenticated | Creator/Admin  | Creator/Owner  |
| **chat_participants**          | In chat             | Admin/Creator | Own or Admin   | Own or Admin   |
| **messages**                   | Participants        | Participants  | Own or Admin   | Own or Admin   |
| **study_sessions**             | Creator/Participant | Authenticated | Creator only   | Creator only   |
| **study_session_participants** | Creator/Participant | Creator only  | Own or Creator | Own or Creator |
| **badges**                     | All authenticated   | Service role  | Service role   | Service role   |
| **user_progress**              | Own only            | Own only      | Own only       | Service role   |
| **user_badges**                | Own only            | Service role  | Service role   | Service role   |

---

## 🔐 Chi tiết Policies theo Bảng

### 1. Profiles (`public.profiles`)

**Mục đích:** Quản lý thông tin profile của users

| Policy                | Operation | Quyền truy cập                           |
| --------------------- | --------- | ---------------------------------------- |
| `profiles_select_all` | SELECT    | Tất cả authenticated users (public read) |
| `profiles_insert_own` | INSERT    | Chỉ tạo profile của chính mình           |
| `profiles_update_own` | UPDATE    | Chỉ update profile của chính mình        |
| `profiles_delete_own` | DELETE    | Chỉ soft-delete profile của chính mình   |

**Use Cases:**

- ✅ User A có thể xem profile của User B (cho matching)
- ✅ User chỉ có thể edit profile của mình
- ✅ Profile được filter `deleted_at IS NULL` tự động

**Code Example:**

```typescript
// ✅ Allowed: View any profile
const { data } = await supabase.from('profiles').select('*').eq('user_id', otherUserId);

// ✅ Allowed: Update own profile
const { data } = await supabase
  .from('profiles')
  .update({ display_name: 'New Name' })
  .eq('user_id', currentUserId);

// ❌ Not allowed: Update other user's profile
const { error } = await supabase
  .from('profiles')
  .update({ display_name: 'Hacked' })
  .eq('user_id', otherUserId); // Will fail
```

---

### 2. Connections (`public.connections`)

**Mục đích:** Quản lý friend requests và connections giữa users

| Policy                           | Operation | Quyền truy cập                                      |
| -------------------------------- | --------- | --------------------------------------------------- |
| `connections_select_involved`    | SELECT    | Chỉ users trong cặp connection                      |
| `connections_insert_own_request` | INSERT    | Tạo request cho chính mình                          |
| `connections_update_involved`    | UPDATE    | Users trong cặp có thể update (accept/reject/block) |
| `connections_delete_involved`    | DELETE    | Users trong cặp có thể soft-delete                  |

**Use Cases:**

- ✅ User A và User B có connection → cả 2 đều thấy được
- ✅ User A gửi request → chỉ User A là `requested_by`
- ✅ User B có thể accept/reject request
- ✅ User A hoặc B có thể block connection

**Code Example:**

```typescript
// ✅ Allowed: View connections where user is involved
const { data } = await supabase
  .from('connections')
  .select('*')
  .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

// ✅ Allowed: Create connection request
const { data } = await supabase.from('connections').insert({
  user_id_1: currentUserId,
  user_id_2: otherUserId,
  requested_by: currentUserId,
  status: 'pending',
});

// ✅ Allowed: Accept connection
const { data } = await supabase
  .from('connections')
  .update({ status: 'accepted' })
  .eq('id', connectionId);
```

---

### 3. Chats (`public.chats`)

**Mục đích:** Quản lý chat conversations (direct hoặc group)

| Policy                          | Operation | Quyền truy cập                      |
| ------------------------------- | --------- | ----------------------------------- |
| `chats_select_participants`     | SELECT    | Chỉ participants mới thấy được      |
| `chats_insert_authenticated`    | INSERT    | Authenticated users có thể tạo chat |
| `chats_update_creator_or_admin` | UPDATE    | Creator hoặc admin/owner            |
| `chats_delete_creator_or_owner` | DELETE    | Creator hoặc owner                  |

**Use Cases:**

- ✅ Chỉ participants mới thấy được chat
- ✅ User có thể tạo chat mới
- ✅ Chỉ creator hoặc admin mới update được (title, etc.)
- ✅ Chỉ creator hoặc owner mới delete được

**Code Example:**

```typescript
// ✅ Allowed: View chats where user is participant
const { data } = await supabase.from('chats').select('*').eq('id', chatId); // Policy checks participation automatically

// ✅ Allowed: Create chat
const { data } = await supabase.from('chats').insert({
  type: 'direct',
  created_by: currentUserId,
});

// ❌ Not allowed: Update chat if not creator/admin
const { error } = await supabase.from('chats').update({ title: 'Hacked' }).eq('id', chatId); // Will fail if not creator/admin
```

---

### 4. Chat Participants (`public.chat_participants`)

**Mục đích:** Quản lý participants trong chats

| Policy                                      | Operation | Quyền truy cập               |
| ------------------------------------------- | --------- | ---------------------------- |
| `chat_participants_select_in_chat`          | SELECT    | Participants trong chat      |
| `chat_participants_insert_admin_or_creator` | INSERT    | Chỉ creator hoặc admin       |
| `chat_participants_update_own_or_admin`     | UPDATE    | Own participation hoặc admin |
| `chat_participants_delete_own_or_admin`     | DELETE    | Leave chat hoặc admin remove |

**Use Cases:**

- ✅ Participants có thể xem danh sách participants
- ✅ Chỉ admin/creator mới add được participants
- ✅ User có thể update `last_read_at` của mình
- ✅ Admin có thể update role của participants
- ✅ User có thể leave chat
- ✅ Admin có thể remove participants

**Code Example:**

```typescript
// ✅ Allowed: View participants (if in chat)
const { data } = await supabase.from('chat_participants').select('*').eq('chat_id', chatId);

// ✅ Allowed: Update own last_read_at
const { data } = await supabase
  .from('chat_participants')
  .update({ last_read_at: new Date().toISOString() })
  .eq('chat_id', chatId)
  .eq('user_id', currentUserId);

// ✅ Allowed: Leave chat
const { data } = await supabase
  .from('chat_participants')
  .delete()
  .eq('chat_id', chatId)
  .eq('user_id', currentUserId);
```

---

### 5. Messages (`public.messages`)

**Mục đích:** Quản lý messages trong chats

| Policy                         | Operation | Quyền truy cập         |
| ------------------------------ | --------- | ---------------------- |
| `messages_select_participants` | SELECT    | Chỉ participants       |
| `messages_insert_participants` | INSERT    | Chỉ participants       |
| `messages_update_own_or_admin` | UPDATE    | Own message hoặc admin |
| `messages_delete_own_or_admin` | DELETE    | Own message hoặc admin |

**Use Cases:**

- ✅ Chỉ participants mới thấy được messages
- ✅ Chỉ participants mới gửi được messages
- ✅ User có thể edit message của mình
- ✅ Admin có thể edit/delete bất kỳ message nào

**Code Example:**

```typescript
// ✅ Allowed: View messages (if participant)
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_id', chatId)
  .order('created_at', { ascending: false });

// ✅ Allowed: Send message (if participant)
const { data } = await supabase.from('messages').insert({
  chat_id: chatId,
  sender_id: currentUserId,
  content: 'Hello!',
});

// ✅ Allowed: Edit own message
const { data } = await supabase
  .from('messages')
  .update({
    content: 'Edited message',
    edited_at: new Date().toISOString(),
  })
  .eq('id', messageId)
  .eq('sender_id', currentUserId);
```

---

### 6. Study Sessions (`public.study_sessions`)

**Mục đích:** Quản lý scheduled study sessions

| Policy                                         | Operation | Quyền truy cập            |
| ---------------------------------------------- | --------- | ------------------------- |
| `study_sessions_select_creator_or_participant` | SELECT    | Creator hoặc participants |
| `study_sessions_insert_authenticated`          | INSERT    | Authenticated users       |
| `study_sessions_update_creator`                | UPDATE    | Chỉ creator               |
| `study_sessions_delete_creator`                | DELETE    | Chỉ creator               |

**Use Cases:**

- ✅ Creator và participants mới thấy được session
- ✅ User có thể tạo session
- ✅ Chỉ creator mới update/delete được

**Code Example:**

```typescript
// ✅ Allowed: View sessions (if creator or participant)
const { data } = await supabase.from('study_sessions').select('*').eq('id', sessionId);

// ✅ Allowed: Create session
const { data } = await supabase.from('study_sessions').insert({
  creator_id: currentUserId,
  title: 'Math Study Session',
  scheduled_start: '2025-01-15T10:00:00Z',
});

// ❌ Not allowed: Update if not creator
const { error } = await supabase
  .from('study_sessions')
  .update({ title: 'Hacked' })
  .eq('id', sessionId); // Will fail if not creator
```

---

### 7. Study Session Participants (`public.study_session_participants`)

**Mục đích:** Quản lý participants trong study sessions

| Policy                                                     | Operation | Quyền truy cập            |
| ---------------------------------------------------------- | --------- | ------------------------- |
| `study_session_participants_select_creator_or_participant` | SELECT    | Creator hoặc participants |
| `study_session_participants_insert_creator`                | INSERT    | Chỉ creator               |
| `study_session_participants_update_own_or_creator`         | UPDATE    | Own status hoặc creator   |
| `study_session_participants_delete_own_or_creator`         | DELETE    | Leave hoặc creator remove |

**Use Cases:**

- ✅ Creator và participants mới thấy được danh sách
- ✅ Chỉ creator mới invite được participants
- ✅ User có thể accept/decline invitation
- ✅ User có thể leave session
- ✅ Creator có thể remove participants

**Code Example:**

```typescript
// ✅ Allowed: View participants (if creator or participant)
const { data } = await supabase
  .from('study_session_participants')
  .select('*')
  .eq('session_id', sessionId);

// ✅ Allowed: Accept invitation
const { data } = await supabase
  .from('study_session_participants')
  .update({ status: 'accepted' })
  .eq('session_id', sessionId)
  .eq('user_id', currentUserId);

// ✅ Allowed: Leave session
const { data } = await supabase
  .from('study_session_participants')
  .delete()
  .eq('session_id', sessionId)
  .eq('user_id', currentUserId);
```

---

### 8. Badges (`public.badges`)

**Mục đích:** Master table cho achievement badges

| Policy                       | Operation | Quyền truy cập                      |
| ---------------------------- | --------- | ----------------------------------- |
| `badges_select_all`          | SELECT    | Tất cả authenticated users (public) |
| `badges_insert_service_role` | INSERT    | Chỉ service role                    |
| `badges_update_service_role` | UPDATE    | Chỉ service role                    |
| `badges_delete_service_role` | DELETE    | Chỉ service role                    |

**Use Cases:**

- ✅ Tất cả users có thể xem badges (public read)
- ✅ Chỉ admin/backend (service role) mới tạo/update/delete được

**Code Example:**

```typescript
// ✅ Allowed: View all badges
const { data } = await supabase.from('badges').select('*');

// ❌ Not allowed: Create badge (requires service role)
const { error } = await supabase.from('badges').insert({
  id: 'new_badge',
  name: 'New Badge',
}); // Will fail - needs service role

// ✅ Service role can create badges
// (Use Supabase service role key in backend)
```

---

### 9. User Progress (`public.user_progress`)

**Mục đích:** Track progress và gamification của users

| Policy                              | Operation | Quyền truy cập   |
| ----------------------------------- | --------- | ---------------- |
| `user_progress_select_own`          | SELECT    | Chỉ own progress |
| `user_progress_insert_own`          | INSERT    | Chỉ own progress |
| `user_progress_update_own`          | UPDATE    | Chỉ own progress |
| `user_progress_delete_service_role` | DELETE    | Chỉ service role |

**Use Cases:**

- ✅ User chỉ xem được progress của mình
- ✅ User chỉ update được progress của mình
- ✅ Progress được tự động tạo khi user đăng ký

**Code Example:**

```typescript
// ✅ Allowed: View own progress
const { data } = await supabase.from('user_progress').select('*').eq('user_id', currentUserId);

// ✅ Allowed: Update own progress
const { data } = await supabase
  .from('user_progress')
  .update({ xp: 100, level: 2 })
  .eq('user_id', currentUserId);

// ❌ Not allowed: View other user's progress
const { error } = await supabase.from('user_progress').select('*').eq('user_id', otherUserId); // Will fail
```

---

### 10. User Badges (`public.user_badges`)

**Mục đích:** Track badges mà users đã earn

| Policy                            | Operation | Quyền truy cập   |
| --------------------------------- | --------- | ---------------- |
| `user_badges_select_own`          | SELECT    | Chỉ own badges   |
| `user_badges_insert_service_role` | INSERT    | Chỉ service role |
| `user_badges_update_service_role` | UPDATE    | Chỉ service role |
| `user_badges_delete_service_role` | DELETE    | Chỉ service role |

**Use Cases:**

- ✅ User chỉ xem được badges của mình
- ✅ Badges được award tự động bởi system (service role)
- ✅ Users không thể tự thêm badges

**Code Example:**

```typescript
// ✅ Allowed: View own badges
const { data } = await supabase
  .from('user_badges')
  .select('*, badges(*)')
  .eq('user_id', currentUserId);

// ❌ Not allowed: Award badge to self
const { error } = await supabase.from('user_badges').insert({
  user_id: currentUserId,
  badge_id: 'early_bird',
}); // Will fail - needs service role

// ✅ Service role can award badges
// (Use Supabase service role key in backend/Edge Functions)
```

---

## 🔧 Helper Functions

Các helper functions được tạo trong `025_create_rls_helper_functions.sql`:

### `is_chat_participant(chat_id, user_id)`

- **Mục đích:** Check nếu user là participant trong chat
- **Return:** `boolean`
- **Use case:** Optimize policies (optional)

### `is_chat_admin(chat_id, user_id)`

- **Mục đích:** Check nếu user có role admin/owner trong chat
- **Return:** `boolean`
- **Use case:** Optimize policies (optional)

### `is_session_participant(session_id, user_id)`

- **Mục đích:** Check nếu user là participant trong session
- **Return:** `boolean`
- **Use case:** Optimize policies (optional)

**Note:** Hiện tại policies sử dụng explicit subqueries. Helper functions có thể dùng để optimize nếu cần.

---

## 🚨 Lưu ý quan trọng

### 1. Service Role

- **Badges** và **User Badges** cần service role để insert/update/delete
- Sử dụng service role key trong backend/Edge Functions
- **KHÔNG** expose service role key trong client app

### 2. Soft Delete

- Tất cả policies tự động filter `deleted_at IS NULL`
- Soft-deleted rows không thể truy cập được
- Hard delete chỉ xảy ra khi user account bị xóa (CASCADE)

### 3. Testing Policies

- Test với nhiều users khác nhau
- Test positive cases (allowed operations)
- Test negative cases (should fail)
- Test edge cases (boundary conditions)

### 4. Performance

- Policies có thể ảnh hưởng performance
- Indexes đã được tạo để optimize queries
- Helper functions có thể dùng để optimize nếu cần

---

## 📝 Checklist khi implement features

Khi implement feature mới, check:

- [ ] User có quyền SELECT data cần thiết?
- [ ] User có quyền INSERT data mới?
- [ ] User có quyền UPDATE data cần thiết?
- [ ] User có quyền DELETE data (nếu cần)?
- [ ] Service role được dùng đúng chỗ?
- [ ] Soft delete được handle đúng?
- [ ] Policies được test kỹ?

---

## 🔗 Related Files

- Migration files: `014_enable_rls.sql` đến `025_create_rls_helper_functions.sql`
- Main README: `README.md`
- Schema files: `001_create_enums.sql` đến `013_create_triggers.sql`

---

**Last Updated:** 2025-01-04  
**Version:** 1.0

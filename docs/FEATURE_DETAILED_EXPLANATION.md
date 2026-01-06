# 📖 Giải Thích Chi Tiết Các Tính Năng - Buddy Up

> Tài liệu giải thích chi tiết cách làm từng tính năng, bản chất, và lý do chọn giải pháp

---

## 1. TÍNH NĂNG CHAT - CHI TIẾT

### 1.1. Câu hỏi: "Tính năng chat em làm như nào? Sử dụng cái gì? Tại sao lại không sử dụng bên ngoài?"

### 1.2. Trả lời chi tiết:

#### **A. Công nghệ sử dụng:**

**1. Supabase Realtime (WebSocket)**

- **Bản chất:** Supabase Realtime là một hệ thống WebSocket được tích hợp sẵn với PostgreSQL database
- **Cách hoạt động:**
  - Khi có thay đổi trong database (INSERT, UPDATE, DELETE), Supabase tự động broadcast qua WebSocket
  - Client subscribe vào các changes của table `messages`
  - Khi có message mới → Realtime trigger → Client nhận được ngay lập tức

**2. PostgreSQL Database**

- Table `chats`: Lưu thông tin chat room
- Table `chat_participants`: Lưu danh sách người tham gia chat
- Table `messages`: Lưu tin nhắn

**3. Supabase Storage**

- Lưu trữ file attachments (images, PDFs)
- Bucket: `chat_uploads`

#### **B. Tại sao không dùng dịch vụ bên ngoài (Firebase, Socket.io tự host, v.v.)?**

**Lý do chọn Supabase Realtime:**

1. **Tích hợp sẵn với Database**
   - Không cần setup WebSocket server riêng
   - Database changes tự động sync → Realtime
   - Đơn giản hơn, ít code hơn

2. **Row Level Security (RLS)**
   - Security ở database level
   - Chỉ user có quyền mới nhận được messages
   - Không thể bypass từ client

3. **Consistency**
   - Dữ liệu trong database = dữ liệu realtime
   - Không có vấn đề sync giữa database và realtime server

4. **Cost-effective**
   - Không cần maintain server riêng
   - Free tier đủ cho development
   - Scaling tự động

5. **Đơn giản hơn**
   - Không cần setup Socket.io server
   - Không cần handle connection management
   - Supabase tự động handle reconnection

#### **C. Cách triển khai chi tiết:**

**1. Tạo Chat Room:**

```typescript
// src/services/chat/rooms.ts
export async function createDirectChat(userId1: string, userId2: string) {
  // Sử dụng RPC function trong database để đảm bảo:
  // - Không tạo duplicate chat
  // - Atomic operation (tất cả hoặc không gì cả)
  const { data: chatId } = await supabase.rpc('create_direct_chat', {
    p_user_id_1: userId1,
    p_user_id_2: userId2,
  });

  // RPC function sẽ:
  // 1. Check xem đã có chat giữa 2 user chưa
  // 2. Nếu có → return chat ID hiện tại
  // 3. Nếu chưa → tạo chat mới + add 2 participants
}
```

**2. Gửi Message:**

```typescript
// src/services/chat/messages.ts
export async function sendMessage(chatId: string, senderId: string, content: string) {
  // 1. Validate: Check chat tồn tại và user là participant
  // 2. Insert message vào database
  const { data: message } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      content: content.trim(),
      attachments: [],
    })
    .select()
    .single();

  // 3. Update chat's updated_at để sort conversations
  await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);

  // 4. Realtime sẽ tự động broadcast message này đến tất cả participants
  // 5. Gửi push notification cho người khác (fire-and-forget)
}
```

**3. Realtime Subscription:**

```typescript
// src/hooks/chat/useChatRealtime.ts
useEffect(() => {
  if (!chatId) return;

  // Subscribe to messages changes cho chat này
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT', // Chỉ listen INSERT (message mới)
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`, // Chỉ messages của chat này
      },
      (payload) => {
        // Khi có message mới → update Redux state
        const newMessage = payload.new as Message;
        dispatch(addMessage(newMessage));

        // Mark as read nếu user đang xem chat này
        if (activeChatId === chatId) {
          markMessagesRead(chatId, userId);
        }
      },
    )
    .subscribe();

  // Cleanup: Unsubscribe khi component unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, [chatId]);
```

**4. Unread Count:**

```typescript
// Logic tính unread:
// - Lưu last_read_at trong chat_participants
// - Unread = số messages có created_at > last_read_at
// - Chỉ đếm messages từ người khác (không đếm của mình)

const unreadCount = messages.filter(
  (msg) => msg.created_at > lastReadAt && msg.sender_id !== currentUserId,
).length;
```

**5. File Upload:**

```typescript
// src/services/chat/uploads.ts
export async function uploadChatImage(chatId: string, imageUri: string) {
  // 1. Resize và compress image
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );

  // 2. Convert sang Buffer
  const buffer = await readFileAsBuffer(manipulated.uri);

  // 3. Upload lên Supabase Storage
  const filePath = `${chatId}/images/${Date.now()}-${fileName}`;
  await supabase.storage.from('chat_uploads').upload(filePath, buffer, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });

  // 4. Get public URL
  const { data } = supabase.storage.from('chat_uploads').getPublicUrl(filePath);

  // 5. Return attachment object để gửi kèm message
  return {
    url: data.publicUrl,
    type: 'image',
    size: buffer.byteLength,
  };
}
```

#### **D. Flow hoàn chỉnh:**

```
User gửi message
    ↓
1. Validate (chat tồn tại? user là participant?)
    ↓
2. Insert vào database (messages table)
    ↓
3. Supabase Realtime tự động broadcast
    ↓
4. Tất cả participants nhận message qua WebSocket
    ↓
5. Redux state update → UI re-render
    ↓
6. Gửi push notification (nếu user không đang xem chat)
```

#### **E. Ưu điểm của cách làm này:**

1. **Real-time thực sự:** < 1 giây latency
2. **Reliable:** Supabase tự động reconnect nếu mất kết nối
3. **Secure:** RLS đảm bảo chỉ participants mới nhận được messages
4. **Scalable:** Supabase handle scaling tự động
5. **Simple:** Không cần maintain WebSocket server riêng

---

## 2. TÍNH NĂNG NOTIFICATIONS - CHI TIẾT

### 2.1. Câu hỏi: "Tính năng thông báo em làm như nào?"

### 2.2. Trả lời chi tiết:

#### **A. Công nghệ sử dụng:**

**1. Expo Notifications**

- Client-side: Request permissions, receive notifications
- Register push tokens

**2. Firebase Cloud Messaging (FCM)**

- Backend: Gửi push notifications đến devices
- Expo Push Notification Service (EPNS) làm trung gian

**3. Supabase Edge Functions**

- Serverless function để gửi notifications
- Chạy trên Deno runtime

**4. Supabase Database**

- Table `push_tokens`: Lưu push tokens của users
- Table `notification_preferences`: Lưu preferences (bật/tắt từng loại)
- Table `notifications`: Lưu in-app notifications

#### **B. Cách triển khai chi tiết:**

**1. Initialize Notification Service:**

```typescript
// src/services/notifications/NotificationService.ts
async initialize(userId: string) {
  // 1. Request permissions
  const permissionStatus = await requestNotificationPermissions();
  if (!permissionStatus.granted) return { success: false };

  // 2. Get Expo Push Token
  const tokenResult = await getExpoPushToken();
  // Token format: ExponentPushToken[xxxxx]

  // 3. Register token vào database
  await registerPushToken(userId, tokenResult.token, deviceId);

  // 4. Setup notification handlers
  this.addNotificationReceivedListener(...);
  this.addNotificationResponseListener(...);
}
```

**2. Gửi Notification:**

```typescript
// src/services/notifications/sendNotification.ts
export async function sendNotification(params: {
  type: 'chat_message' | 'buddy_request' | 'session_reminder',
  userIds: string[],
  title: string,
  body: string,
  data: { chatId?: string, ... }
}) {
  // Gọi Supabase Edge Function
  const { data } = await supabase.functions.invoke('send-notification', {
    body: params
  });
}
```

**3. Edge Function (Backend):**

```typescript
// supabase/functions/send-notification/index.ts
serve(async (req) => {
  // 1. Validate authorization
  const authHeader = req.headers.get('Authorization');

  // 2. Parse request body
  const { userIds, title, body, data } = await req.json();

  // 3. Get push tokens từ database
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token, user_id, platform')
    .in('user_id', userIds);

  // 4. Check notification preferences
  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('user_id, chat_enabled, buddy_enabled, ...')
    .in('user_id', userIds);

  // 5. Filter tokens dựa trên preferences
  const enabledTokens = tokens.filter((token) => {
    const pref = preferences.find((p) => p.user_id === token.user_id);
    // Check xem loại notification này có được enable không
    return pref?.chat_enabled ?? true; // Default = enabled
  });

  // 6. Prepare notifications cho Expo Push Service
  const notifications = enabledTokens.map((token) => ({
    to: token.token, // Expo push token
    title,
    body,
    data,
    sound: 'default',
    priority: 'high',
    channelId: 'chat', // Android channel
  }));

  // 7. Gửi đến Expo Push Notification Service
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notifications),
  });

  // 8. Save in-app notifications vào database
  await supabase.from('notifications').insert(
    userIds.map((userId) => ({
      user_id: userId,
      type: data.type,
      title,
      body,
      data,
      read: false,
    })),
  );

  return new Response(JSON.stringify({ sent: notifications.length }));
});
```

**4. Notification Suppression:**

```typescript
// Không hiển thị notification nếu user đang xem chat đó
shouldSuppressNotification(data: { chatId?: string }): boolean {
  const activeChatId = this.activeChatResolver?.();
  const isForeground = AppState.currentState === 'active';

  // Suppress nếu:
  // - App đang foreground VÀ
  // - User đang xem chat này
  return isForeground && activeChatId === data.chatId;
}
```

**5. Handle Notification Tap:**

```typescript
// src/services/notifications/NotificationRouter.ts
handleNotificationTap(response: NotificationResponse) {
  const data = response.notification.request.content.data;

  switch (data.type) {
    case 'chat_message':
      navigation.navigate('ChatRoom', { chatId: data.chatId });
      break;
    case 'buddy_request':
      navigation.navigate('BuddyRequests');
      break;
    case 'session_reminder':
      navigation.navigate('SessionDetail', { sessionId: data.sessionId });
      break;
  }
}
```

#### **C. Flow hoàn chỉnh:**

```
Event xảy ra (ví dụ: có message mới)
    ↓
1. Service gọi sendNotification()
    ↓
2. Gọi Supabase Edge Function
    ↓
3. Edge Function:
   - Lấy push tokens từ database
   - Check preferences
   - Filter tokens
   - Gửi đến Expo Push Service
   - Save in-app notification
    ↓
4. Expo Push Service gửi đến FCM/APNS
    ↓
5. Device nhận notification
    ↓
6. Hiển thị (hoặc suppress nếu đang xem chat)
    ↓
7. User tap → Navigate đến screen liên quan
```

#### **D. Tại sao dùng Expo Push Service?**

1. **Đơn giản:** Không cần setup FCM/APNS trực tiếp
2. **Cross-platform:** Một API cho cả iOS và Android
3. **Reliable:** Expo maintain infrastructure
4. **Free:** Đủ cho development và production nhỏ

---

## 3. SUPABASE AUTH - CHI TIẾT

### 3.1. Bản chất:

**Supabase Auth** là một authentication service được tích hợp sẵn với Supabase, cung cấp:

1. **User Management**
   - Đăng ký, đăng nhập
   - Password reset
   - Email verification
   - User profiles

2. **Multiple Providers**
   - Email/Password
   - OAuth (Google, Facebook, GitHub, ...)
   - Magic links

3. **JWT Tokens**
   - Access token (short-lived)
   - Refresh token (long-lived)
   - Auto refresh

4. **Session Management**
   - Persistent sessions
   - Auto refresh tokens
   - Session storage (AsyncStorage trong React Native)

### 3.2. Cách sử dụng trong dự án:

**1. Sign Up:**

```typescript
// src/services/auth.ts
export async function signUpWithEmail(params: {
  email: string;
  password: string;
  displayName: string;
}) {
  // 1. Tạo user trong Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        display_name: params.displayName, // Metadata
      },
    },
  });

  // 2. Tạo profile trong database
  if (data.user) {
    await supabase.from('profiles').insert({
      user_id: data.user.id,
      display_name: params.displayName,
    });
  }

  return data;
}
```

**2. Sign In:**

```typescript
export async function signInWithEmail(params: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(params);
  // Supabase tự động:
  // - Verify credentials
  // - Tạo JWT tokens
  // - Lưu session vào AsyncStorage
  // - Set headers cho các requests tiếp theo
  return data;
}
```

**3. OAuth Flow:**

```typescript
export async function signInWithGoogle() {
  // 1. Get authorization URL từ Supabase
  const { data: oauthData } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'buddyup://auth/callback',
      skipBrowserRedirect: true,
    },
  });

  // 2. Mở browser để user login
  const result = await WebBrowser.openAuthSessionAsync(oauthData.url, 'buddyup://auth/callback');

  // 3. Parse tokens từ redirect URL
  const parsed = new URL(result.url);
  const hashParams = new URLSearchParams(parsed.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  // 4. Set session
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // 5. Tạo profile nếu user mới
  await createProfileIfNeeded(userId, userMetadata);
}
```

**4. Session Management:**

```typescript
// src/hooks/useAuthSession.ts
export function useAuthSession() {
  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // User đã login → update Redux state
          dispatch(setUser({
            userId: session.user.id,
            email: session.user.email,
          }));
        } else if (event === 'SIGNED_OUT') {
          // User đã logout → clear state
          dispatch(signOutState());
        } else if (event === 'TOKEN_REFRESHED') {
          // Token được refresh → session vẫn valid
        }
      }
    );

    // Check session hiện tại
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      dispatch(setUser({ ... }));
    }

    return () => subscription.unsubscribe();
  }, []);
}
```

**5. Password Reset:**

```typescript
export async function requestPasswordReset(email: string) {
  // Supabase gửi OTP qua email
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Không tạo user mới
    },
  });
}

export async function verifyPasswordResetOTP(email: string, token: string) {
  // Verify OTP
  const { data } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  // Sau khi verify → có temporary session
}

export async function resetPassword(email: string, newPassword: string) {
  // Update password (cần temporary session từ verifyOTP)
  await supabase.auth.updateUser({
    password: newPassword,
  });
}
```

### 3.3. Security Features:

1. **JWT Tokens:**
   - Access token: Short-lived (1 hour)
   - Refresh token: Long-lived (30 days)
   - Auto refresh khi access token hết hạn

2. **Row Level Security:**
   - Mỗi request tự động include JWT token
   - Database policies check token để authorize

3. **Password Hashing:**
   - Supabase tự động hash passwords (bcrypt)
   - Không bao giờ lưu plain text

---

## 4. SUPABASE STORAGE - CHI TIẾT

### 4.1. Bản chất:

**Supabase Storage** là một object storage service (tương tự AWS S3), cung cấp:

1. **Buckets**
   - Container cho files
   - Có thể set public/private
   - Có thể set policies (RLS)

2. **File Management**
   - Upload files
   - Download files
   - Delete files
   - Get public URLs

3. **Policies**
   - RLS policies cho buckets
   - Control ai có thể upload/download

### 4.2. Cách sử dụng trong dự án:

**1. Upload File:**

```typescript
// src/services/storage.ts
export async function uploadPublicFile(params: { bucket: string; path: string; file: Blob }) {
  // Upload file
  const { data, error } = await supabase.storage
    .from(params.bucket) // Bucket name
    .upload(
      params.path, // File path trong bucket
      params.file, // File content
      {
        upsert: true, // Overwrite nếu đã tồn tại
        cacheControl: '3600', // Cache 1 hour
      },
    );

  return data;
}
```

**2. Get Public URL:**

```typescript
export function getPublicUrl(params: { bucket: string; path: string }) {
  // Get public URL để hiển thị trong app
  const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);

  return data.publicUrl;
  // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
}
```

**3. Upload Chat Image:**

```typescript
// src/services/chat/uploads.ts
export async function uploadChatImage(chatId: string, imageUri: string) {
  // 1. Resize và compress
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  // 2. Convert sang Buffer
  const buffer = await readFileAsBuffer(manipulated.uri);

  // 3. Upload
  const filePath = `${chatId}/images/${Date.now()}-${fileName}`;
  await supabase.storage
    .from('chat_uploads')
    .upload(filePath, buffer, {
      contentType: 'image/jpeg',
    });

  // 4. Get public URL
  const { data } = supabase.storage
    .from('chat_uploads')
    .getPublicUrl(filePath);

  return { url: data.publicUrl, ... };
}
```

**4. Storage Policies:**

```sql
-- Cho phép authenticated users upload vào chat_uploads
CREATE POLICY "Users can upload to chat_uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat_uploads');

-- Cho phép public read (để hiển thị images)
CREATE POLICY "Public can read chat_uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat_uploads');
```

### 4.3. Ưu điểm:

1. **Tích hợp sẵn:** Không cần setup S3 riêng
2. **RLS Policies:** Security ở storage level
3. **CDN:** Files được serve qua CDN (nhanh)
4. **Free tier:** 1GB storage free

---

## 5. SUPABASE EDGE FUNCTIONS - CHI TIẾT

### 5.1. Bản chất:

**Supabase Edge Functions** là serverless functions chạy trên Deno runtime, cho phép:

1. **Custom Backend Logic**
   - Xử lý phức tạp không thể làm ở client
   - Gọi external APIs
   - Scheduled tasks

2. **Serverless**
   - Không cần maintain server
   - Auto scaling
   - Pay per use

3. **Deno Runtime**
   - TypeScript native
   - Secure by default
   - Modern APIs

### 5.2. Cách sử dụng trong dự án:

**1. Send Notification Function:**

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // 1. Validate request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  // 2. Create Supabase client với service role key
  // Service role key bypass RLS để đọc push_tokens
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Bypass RLS
  );

  // 3. Parse request body
  const { userIds, title, body, data } = await req.json();

  // 4. Get push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token, user_id')
    .in('user_id', userIds);

  // 5. Send to Expo Push Service
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notifications),
  });

  // 6. Return result
  return new Response(JSON.stringify({ sent: notifications.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**2. Invoke từ Client:**

```typescript
// src/services/notifications/sendNotification.ts
export async function sendNotification(params: {
  type: string;
  userIds: string[];
  title: string;
  body: string;
  data: any;
}) {
  // Gọi Edge Function
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: params, // Request body
  });

  return { success: !error, sent: data?.sent };
}
```

**3. Tại sao cần Edge Function?**

- **Security:** Service role key không được expose ở client
- **External APIs:** Gọi Expo Push Service từ server (không thể từ client)
- **Database Access:** Cần service role để đọc push_tokens (RLS)
- **Reliability:** Server-side execution đảm bảo notification được gửi

### 5.3. Deploy Edge Function:

```bash
# Deploy function
supabase functions deploy send-notification

# Function sẽ có URL:
# https://[project].supabase.co/functions/v1/send-notification
```

---

## 6. TỔNG KẾT - SO SÁNH VỚI GIẢI PHÁP KHÁC

### 6.1. Chat:

| Giải pháp             | Ưu điểm                                          | Nhược điểm                                |
| --------------------- | ------------------------------------------------ | ----------------------------------------- |
| **Supabase Realtime** | ✅ Tích hợp DB<br>✅ RLS security<br>✅ Đơn giản | ❌ Phụ thuộc Supabase                     |
| Socket.io tự host     | ✅ Tự control<br>✅ Flexible                     | ❌ Cần maintain server<br>❌ Phức tạp hơn |
| Firebase Realtime     | ✅ Real-time tốt                                 | ❌ NoSQL (khó query)<br>❌ Pricing cao    |

**→ Chọn Supabase vì:** Đơn giản, tích hợp tốt, security tốt

### 6.2. Notifications:

| Giải pháp                     | Ưu điểm                          | Nhược điểm                                           |
| ----------------------------- | -------------------------------- | ---------------------------------------------------- |
| **Expo Push + Edge Function** | ✅ Cross-platform<br>✅ Đơn giản | ❌ Phụ thuộc Expo                                    |
| FCM trực tiếp                 | ✅ Tự control                    | ❌ Phức tạp setup<br>❌ Cần handle iOS/Android riêng |
| OneSignal                     | ✅ Feature-rich                  | ❌ Cost cao<br>❌ Phụ thuộc service                  |

**→ Chọn Expo Push vì:** Đơn giản, free, cross-platform

### 6.3. Storage:

| Giải pháp            | Ưu điểm                                      | Nhược điểm                            |
| -------------------- | -------------------------------------------- | ------------------------------------- |
| **Supabase Storage** | ✅ Tích hợp sẵn<br>✅ RLS policies<br>✅ CDN | ❌ Phụ thuộc Supabase                 |
| AWS S3               | ✅ Tự control<br>✅ Flexible                 | ❌ Cần setup riêng<br>❌ Phức tạp hơn |
| Cloudinary           | ✅ Image optimization                        | ❌ Cost cao<br>❌ Chỉ cho images      |

**→ Chọn Supabase Storage vì:** Tích hợp tốt, đơn giản, đủ dùng

---

## 7. CÁC CÂU HỎI THƯỜNG GẶP

### Q1: "Tại sao không dùng Socket.io?"

**A:**

- Socket.io cần maintain server riêng → phức tạp hơn
- Supabase Realtime tích hợp sẵn với database → đơn giản hơn
- RLS security tốt hơn
- Không cần handle reconnection (Supabase tự động)

### Q2: "Realtime có reliable không?"

**A:**

- Có, Supabase tự động reconnect nếu mất kết nối
- Có retry mechanism
- Có fallback nếu WebSocket fail

### Q3: "Notification có delay không?"

**A:**

- Thường < 5 giây
- Phụ thuộc vào:
  - Expo Push Service
  - FCM/APNS
  - Network
- Có thể optimize bằng cách:
  - Batch notifications
  - Priority queue

### Q4: "Storage có giới hạn không?"

**A:**

- Free tier: 1GB
- Có thể upgrade
- Có thể optimize bằng cách:
  - Compress images
  - Delete old files
  - Use CDN

### Q5: "Edge Functions có cost không?"

**A:**

- Free tier: 500K invocations/month
- Sau đó: $0.0000025/invocation
- Rất rẻ cho production nhỏ

---

**Kết luận:** Tất cả các tính năng đều được implement với Supabase ecosystem để đảm bảo tính nhất quán, đơn giản, và security tốt.

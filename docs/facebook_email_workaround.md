# Facebook OAuth: Fix "Invalid Scopes: email"

## Vấn đề

Khi login Facebook, gặp lỗi:

```
Invalid Scopes: email. This message is only shown to developers.
Users of your app will ignore these permissions if present.
```

**Nguyên nhân:**

- Facebook policy mới (2023+): Permission `email` cần được **approved qua App Review**
- Ngay cả **Administrator** cũng **KHÔNG ĐƯỢC** dùng `email` scope nếu chưa approved
- Development Mode không bypass rule này

---

## ✅ Giải pháp nhanh (Development) - Enable email từ Facebook App Dashboard

### Bước 1: Enable email Permission ở Facebook App

1. Vào [Facebook Developers](https://developers.facebook.com/)
2. Chọn **Your App** (buddy-up app)
3. Vào **App Review** → **Permissions and Features** (như ảnh setup)
4. Tìm permission **"email"** trong danh sách:
   - **Quyền**: "email"
   - **Mô tả**: "Quyền email cho phép ứng dụng của bạn đọc địa chỉ email chính của một người."
   - **Status**: Xem trạng thái hiện tại
   - **Hành động**: Nút tương tác

### Bước 2: Enable email cho Test Users (Development)

**Cách 1: Dùng Test User (Nhanh nhất - Recommended)**

1. Vào Facebook App → **Roles** → **Test Users**
2. Tạo test user mới hoặc sử dụng test user hiện tại
3. Quyền `email` sẽ **tự động enabled** cho test users trong Development Mode
4. Copy access token của test user hoặc dùng test account để login vào app
5. ✅ Email sẽ được trả về trong OAuth response

**Cách 2: Request Advanced Access (Cho Production)**

1. Click vào dòng **"email"** trong bảng "Permissions and Features"
2. Xem **Status** - nếu là "Yêu cầu" (Pending):
   - Click **"Hành động"** → **"Yêu cầu truy cập nâng cao"** (Request Advanced Access)
3. Điền form với:
   - **Use case description**: Giải thích tại sao cần email (tạo tài khoản, recovery, notifications)
   - **Screenshots**: Chụp màn hình login và profile screen
   - **Privacy Policy URL**: Đường dẫn đến chính sách bảo mật
4. Submit và chờ Facebook review (2-7 ngày)

### Bước 3: Update Supabase Scopes

1. Vào [Supabase Dashboard](https://app.supabase.com/)
2. Project của bạn → **Authentication** → **Providers**
3. Tìm **Facebook** → Click để expand
4. Tìm field **"Scopes"**
5. Sửa từ: `public_profile`
6. Thành: `public_profile,email`
7. Click **Save**

### Bước 4: Test lại

1. Clear browser cache hoặc test ở Incognito mode
2. Test Facebook login
3. ✅ Lần này sẽ không bị lỗi "Invalid Scopes: email"
4. ✅ `user.email` sẽ có giá trị

---

## Giải pháp thay thế (Development) - Không dùng email

### Bước 1: Configure Supabase Facebook Provider

1. Vào [Supabase Dashboard](https://app.supabase.com/)
2. Project của bạn → **Authentication** → **Providers**
3. Tìm **Facebook** → Click để expand
4. Tìm field **"Scopes"** (có thể trong Advanced Settings)
5. **Xóa** `email` khỏi scopes
6. Chỉ giữ: `public_profile`
7. Click **Save**

### Bước 2: Test lại OAuth

Sau khi save, test lại Facebook login:

- ✅ OAuth flow sẽ success
- ✅ User được tạo trong Supabase
- ⚠️ `user.email` sẽ là `null`
- ✅ `user.user_metadata.name` vẫn có (từ public_profile)

### Bước 3: Handle missing email trong code

Vì Facebook không trả về email, cần update code:

**Option 1: Dùng Facebook ID làm identifier**

```typescript
// src/services/auth.ts - createProfileIfNeeded
const displayName =
  userMetadata?.display_name ||
  userMetadata?.name ||
  userMetadata?.full_name ||
  `User_${userId.substring(0, 8)}`; // Fallback nếu không có name

const email = session.user.email || null; // Allow null email

await supabase.from('profiles').insert({
  user_id: userId,
  display_name: displayName,
  avatar_url: avatarUrl,
  email: email, // Có thể null
});
```

**Option 2: Yêu cầu user nhập email sau**

Trong ProfileSetup flow, thêm bước nhập email nếu user.email là null:

```typescript
// src/screens/ProfileSetup/Step1.tsx
if (!user.email) {
  // Show email input field
  // Validate và lưu email
}
```

---

## Giải pháp lâu dài (Production) - Submit App Review

Nếu muốn có email từ Facebook cho public users:

### Bước 1: Prepare App Review Materials

Cần chuẩn bị:

1. **App Icon** (512x512px)
2. **Privacy Policy URL**
   - Host tại: your-website.com/privacy-policy
   - Hoặc dùng template generator online
3. **Screenshots** của app:
   - Login screen với Facebook button
   - Sau login: Profile screen hiển thị email
   - Ít nhất 2-3 screenshots rõ ràng
4. **Use Case Description** (Tiếng Anh):
   ```
   We request email permission to:
   1. Create user account with email as unique identifier
   2. Send important notifications and updates
   3. Enable account recovery via email
   4. Merge Facebook login with existing email/password accounts
   ```

### Bước 2: Submit Review

1. Vào Facebook Developers → Your App
2. **App Review** → **Permissions and Features**
3. Tìm **"email"** permission
4. Click **"Request Advanced Access"**
5. Điền form:
   - **Tell us how you're using this permission**: Paste use case description
   - **Upload screenshots**: Upload 2-3 screenshots
   - **Privacy Policy URL**: Paste URL
6. Click **Submit for Review**

### Bước 3: Wait for Approval

- Timeline: 2-7 ngày (thường 3-5 ngày)
- Facebook sẽ review manual
- Có thể bị reject nếu:
  - Screenshots không rõ
  - Privacy policy không đầy đủ
  - Use case không hợp lý
- Nếu rejected: Fix theo feedback và submit lại

### Bước 4: After Approval

Sau khi approved:

1. Vào Supabase Dashboard → Facebook Provider
2. **Add back** `email` vào Scopes: `public_profile,email`
3. Save
4. Test lại → Email sẽ work cho tất cả users

---

## So sánh 2 options

| Feature          | No Email (Quick)         | With Email (Reviewed) |
| ---------------- | ------------------------ | --------------------- |
| Setup time       | 5 phút                   | 3-7 ngày              |
| Email available  | ❌ Không                 | ✅ Có                 |
| User identifier  | Facebook ID              | Email                 |
| Account merge    | ❌ Không thể             | ✅ Có thể             |
| Testing          | ✅ Ngay lập tức          | ⏳ Sau review         |
| Production ready | ⚠️ Cần handle null email | ✅ Đầy đủ             |

---

## Recommendation

**Cho Development/Testing:**

- Dùng "No Email" option
- Test OAuth flow ngay
- Handle null email trong code

**Trước Production:**

- Submit App Review
- Approve email permission
- Re-enable email scope
- Test với email có sẵn

---

## Troubleshooting

### Vẫn bị lỗi sau khi xóa email scope?

1. **Clear Supabase cache:**
   - Disable Facebook provider
   - Save
   - Enable lại
   - Save
   - Test

2. **Check Facebook App Settings:**
   - App Domains có chứa `supabase.co` chưa
   - Valid OAuth Redirect URIs có Supabase URL chưa

3. **Check browser cache:**
   - Clear browser cache
   - Hoặc test trong Incognito mode

### User complain về không có email?

2 cách handle:

1. **Hiển thị thông báo:**

   ```typescript
   if (!user.email) {
     Alert.alert(
       'Email Not Available',
       'Facebook login does not provide email. Please add email in your profile settings.',
     );
   }
   ```

2. **Yêu cầu nhập email:**
   ```typescript
   // In ProfileSetup
   if (!user.email) {
     return <EmailInputStep />;
   }
   ```

---

## References

- [Facebook Login Review Guide](https://developers.facebook.com/docs/facebook-login/review)
- [Supabase Facebook Auth](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- [Facebook Permissions Reference](https://developers.facebook.com/docs/permissions/reference)

# OAuth Setup Guide – Google & Facebook (US-002)

Hướng dẫn chi tiết thiết lập OAuth cho Google và Facebook để hỗ trợ đăng nhập bằng social accounts.

---

## Tổng quan về Redirect URI

Trong OAuth flow, có **2 loại Redirect URI** cần hiểu:

### 1. Supabase Redirect URI (Backend)

- **Format**: `https://[project-ref].supabase.co/auth/v1/callback`
- **Mục đích**: Supabase nhận callback từ Google/Facebook sau khi user authenticate
- **Nơi config**:
  - Google Cloud Console → Authorized redirect URIs
  - Facebook Developers → Valid OAuth Redirect URIs
- **Ví dụ**: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

### 2. Mobile App Redirect URI (Client)

- **Format**: `buddyup://auth/callback` (custom URL scheme)
- **Mục đích**: App nhận callback từ Supabase sau khi OAuth flow hoàn tất
- **Nơi config**:
  - Trong code: `expo-auth-session` tự động tạo từ `scheme` trong `app.json`
  - Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
- **Ví dụ**: `buddyup://auth/callback`

### Flow hoàn chỉnh:

```
User clicks "Login with Google"
  ↓
App opens browser → Google OAuth page
  ↓
User authenticates → Google redirects to Supabase
  ↓
Supabase processes → Redirects to mobile app (buddyup://auth/callback)
  ↓
App receives callback → Exchange code for session
```

---

## Bước 1: Tạo Google OAuth App

### 1.1. Truy cập Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Đăng nhập bằng Google account
3. Tạo project mới hoặc chọn project hiện có

### 1.2. Enable Google+ API

1. Vào **APIs & Services** → **Library**
2. Tìm "Google+ API" hoặc "Google Identity"
3. Click **Enable**

### 1.3. Configure OAuth Consent Screen

1. Vào **APIs & Services** → **OAuth consent screen**
2. Chọn **External** (nếu chưa có organization)
3. Điền thông tin:
   - **App name**: Buddy Up
   - **User support email**: Email của bạn
   - **Developer contact information**: Email của bạn
4. Click **Save and Continue**
5. **Scopes**: Không cần thêm, click **Save and Continue**
6. **Test users**: Có thể thêm email để test, click **Save and Continue**

### 1.4. Tạo OAuth 2.0 Client ID

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Chọn **Application type**: **Web application**
4. Điền thông tin:
   - **Name**: Buddy Up OAuth Client
   - **Authorized redirect URIs**:
     - Thêm Supabase redirect URI: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
     - Lưu ý: Thay `[YOUR-PROJECT-REF]` bằng project reference của bạn (tìm trong Supabase Dashboard → Settings → API)
5. Click **Create**
6. **Lưu lại**:
   - **Client ID** (sẽ cần cho Supabase)
   - **Client Secret** (sẽ cần cho Supabase)

---

## Bước 2: Tạo Facebook OAuth App

### 2.1. Truy cập Facebook Developers

1. Vào [Facebook for Developers](https://developers.facebook.com/)
2. Đăng nhập bằng Facebook account
3. Click **My Apps** → **Create App**

### 2.2. Tạo App mới

1. Chọn **Consumer** (hoặc **Business** nếu cần)
2. Điền thông tin:
   - **App Display Name**: Buddy Up
   - **App Contact Email**: Email của bạn
3. Click **Create App**

### 2.3. Thêm Facebook Login Product

1. Trong App Dashboard, tìm **Add a Product**
2. Tìm **Facebook Login** → Click **Set Up**
3. Chọn **Web** platform (không chọn iOS/Android)

### 2.4. Configure Facebook Login Settings

1. Vào **Facebook Login** → **Settings** (hoặc **Đăng nhập bằng Facebook** → **Cài đặt**)
2. **Bật các toggle switches cần thiết**:
   - **"Đăng nhập OAuth ứng dụng"** (OAuth App Login): Bật **Có** (Yes)
   - **"Đăng nhập OAuth trên web"** (Web OAuth Login): Bật **Có** (Yes)
   - **"Thực thi HTTPS"** (Enforce HTTPS): Bật **Có** (Yes) - Khuyến nghị
   - **"Chế độ sử dụng nghiêm ngặt cho URI chuyển hướng"** (Strict Mode for Redirect URIs): Bật **Có** (Yes) - Khuyến nghị
3. **Thêm Valid OAuth Redirect URIs**:
   - Tìm phần **"URI chuyển hướng OAuth hợp lệ"** (Valid OAuth Redirect URIs)
   - Trong text area lớn, thêm Supabase redirect URI:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - **Lưu ý**:
     - Thay `[YOUR-PROJECT-REF]` bằng project reference của bạn (tìm trong Supabase Dashboard → Settings → API)
     - Vì đang bật "Strict Mode", URI phải khớp chính xác 100%
     - Mỗi URI trên một dòng riêng (nếu có nhiều URI)
4. **(Optional) Test Redirect URI**:
   - Sử dụng phần **"Công cụ xác thực URI chuyển hướng"** (Redirect URI validation tool)
   - Nhập URI vào ô "Chuyển hướng URI để kiểm tra"
   - Click **"Kiểm tra URI"** (Test URI)
   - Nếu hợp lệ sẽ không có lỗi màu đỏ
5. Click **"Lưu thay đổi"** (Save Changes) ở cuối trang

### 2.5. Lấy App ID và App Secret

1. Vào **Settings** → **Basic** (hoặc **Cài đặt** → **Cơ bản**)
2. **Lưu lại**:
   - **App ID** (sẽ cần cho Supabase) - Hiển thị ngay trên trang
   - **App Secret** (click **Show** để xem, sẽ cần cho Supabase) - Cần click để hiển thị

**Lưu ý quan trọng**:

- App Secret chỉ hiển thị một lần khi tạo app mới
- Nếu mất App Secret, bạn cần tạo lại (hoặc reset trong Settings)
- Không chia sẻ App Secret công khai

### 2.6. (Optional) Thêm App Domains

1. Trong **Settings** → **Basic** → **App Domains**
2. Thêm domain: `supabase.co`
3. Click **Save Changes**

**Lưu ý**: App Domains không bắt buộc cho OAuth flow, nhưng có thể giúp Facebook validate redirect URIs tốt hơn.

### 2.7. **QUAN TRỌNG** - Thêm Test Users (Development Mode)

⚠️ **BẮT BUỘC nếu app đang ở Development Mode và chưa submit App Review**

Facebook App mặc định ở **Development Mode** và chỉ cho phép Administrator và Test Users login.

**Option 1: Thêm Administrator (Khuyến nghị cho testing)**

1. Vào **Roles** → **Administrators**
2. Click **Add Administrators**
3. Nhập Facebook email hoặc User ID của bạn
4. Click **Submit**
5. Người được mời sẽ nhận notification và phải accept

**Option 2: Tạo Test Users**

1. Vào **Roles** → **Test Users**
2. Click **Add Test Users** hoặc **Create Test Users**
3. Chọn số lượng test users cần tạo
4. Facebook sẽ tạo fake accounts để test
5. Dùng credentials của test users để login

**Option 3: Add Testers**

1. Vào **Roles** → **Testers**
2. Click **Add Testers**
3. Nhập Facebook email của người cần test
4. Người được mời phải accept invitation

**⚠️ Facebook App Review - BẮT BUỘC để lấy email:**

**Vấn đề hiện tại:**

- Mặc dù bạn là Administrator, Facebook vẫn **CHẶN** `email` scope nếu chưa được approved
- Lỗi: "Invalid Scopes: email" xảy ra cho tất cả users (kể cả Admin)
- Đây là policy mới của Facebook từ 2023

**2 Options:**

**Option A: Submit App Review (Production - Có email)**

```
1. Vào App Dashboard → App Review → Permissions and Features
2. Tìm "email" permission → Click "Request Advanced Access"
3. Điền form:
   - Use case: "User authentication and profile creation"
   - Screenshots: Login flow và profile screen
   - Privacy Policy URL: Link đến privacy policy của app
4. Submit và chờ review (2-7 ngày)
5. Sau khi approved, email scope sẽ hoạt động
```

**Option B: Không dùng email (Development - Testing nhanh)**

```
1. Vào Supabase Dashboard → Authentication → Providers → Facebook
2. Xóa "email" khỏi Scopes field
3. Chỉ giữ "public_profile"
4. Save và test lại
5. OAuth sẽ work NHƯNG user.email = null
```

**Khuyến nghị:**

- Development/Testing: Dùng Option B (nhanh, không cần wait review)
- Production: Submit Option A để có đầy đủ email

**⚠️ Nếu không thêm test users:**

- Sẽ gặp lỗi: **"Invalid Scopes: email"**
- OAuth flow sẽ fail
- Chỉ Administrator có thể login

---

## Bước 3: Cấu hình Supabase Dashboard

### 3.1. Enable Google Provider

1. Vào [Supabase Dashboard](https://app.supabase.com/)
2. Chọn project của bạn
3. Vào **Authentication** → **Providers**
4. Tìm **Google** → Click để expand
5. **Enable Google**:
   - **Client ID (for OAuth)**: Dán Google Client ID từ bước 1.4
   - **Client Secret (for OAuth)**: Dán Google Client Secret từ bước 1.4
6. Click **Save**

### 3.2. Enable Facebook Provider

1. Trong cùng trang **Authentication** → **Providers**
2. Tìm **Facebook** → Click để expand
3. **Enable Facebook**:
   - **Client ID (for OAuth)**: Dán Facebook App ID từ bước 2.5
   - **Client Secret (for OAuth)**: Dán Facebook App Secret từ bước 2.5
4. **⚠️ QUAN TRỌNG - Fix "Invalid Scopes: email":**
   - Tìm phần **"Scopes"** (có thể ở phần Advanced hoặc Additional Settings)
   - Nếu có `email`, xóa nó đi
   - Chỉ giữ lại: `public_profile`
   - Hoặc để trống để dùng default scope
5. Click **Save**

**Lưu ý về Email:**

- Nếu không request `email` scope, user sẽ không có email từ Facebook
- Profile sẽ được tạo nhưng `email` field sẽ là `null`
- Cần handle logic cho trường hợp user không có email
- Để có email, cần submit App Review và approve permission

### 3.3. Configure Redirect URLs

1. Vào **Authentication** → **URL Configuration**
2. Trong **Redirect URLs**, đảm bảo có:
   - `buddyup://auth/callback` (mobile app redirect URI)
   - Có thể thêm: `exp://127.0.0.1:8081` (cho Expo development)
3. Click **Save**

---

## Bước 4: Verify Configuration

### Checklist:

- [ ] Google OAuth app đã được tạo với redirect URI Supabase
- [ ] Facebook OAuth app đã được tạo với redirect URI Supabase
- [ ] **Facebook Settings**:
  - [ ] "Đăng nhập OAuth ứng dụng" đã bật
  - [ ] "Đăng nhập OAuth trên web" đã bật
  - [ ] "Thực thi HTTPS" đã bật
  - [ ] "Chế độ sử dụng nghiêm ngặt cho URI chuyển hướng" đã bật
  - [ ] Valid OAuth Redirect URIs đã được thêm và test thành công
  - [ ] **⚠️ ĐÃ THÊM TEST USERS/ADMINISTRATOR** (BẮT BUỘC nếu app ở Development Mode)
- [ ] Google provider đã được enable trong Supabase với Client ID/Secret đúng
- [ ] Facebook provider đã được enable trong Supabase với App ID/Secret đúng
- [ ] Redirect URL `buddyup://auth/callback` đã được thêm vào Supabase

### Test OAuth Flow:

1. Chạy app: `npx expo start`
2. Vào màn hình Login
3. Click "Đăng nhập với Google" hoặc "Đăng nhập với Facebook"
4. Browser sẽ mở → User authenticate → Redirect về app
5. Nếu thành công, user sẽ được đăng nhập

---

## Troubleshooting

### Lỗi: "redirect_uri_mismatch"

- **Nguyên nhân**: Redirect URI trong Google/Facebook không khớp với Supabase
- **Giải pháp**:
  - **Google**: Kiểm tra lại redirect URI trong Google Cloud Console → Credentials → OAuth client
  - **Facebook**:
    - Kiểm tra trong **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs**
    - Sử dụng **"Công cụ xác thực URI chuyển hướng"** để test URI trước
    - Đảm bảo URI khớp chính xác 100% (vì Strict Mode đang bật)
    - Copy-paste URI từ Supabase để tránh typo
  - Format đúng: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
  - Project reference tìm trong Supabase Dashboard → Settings → API → Project URL

### Lỗi: "invalid_client"

- **Nguyên nhân**: Client ID hoặc Client Secret sai
- **Giải pháp**:
  - Kiểm tra lại Client ID/Secret trong Supabase Dashboard
  - Đảm bảo đã copy đúng từ Google Cloud Console / Facebook Developers

### Lỗi: "App not configured for OAuth"

- **Nguyên nhân**: OAuth consent screen chưa được config đúng
- **Giải pháp**:
  - Vào Google Cloud Console → OAuth consent screen
  - Đảm bảo đã điền đủ thông tin và publish (hoặc thêm test users)

### Lỗi: "Deep link not handled"

- **Nguyên nhân**: App scheme chưa được config trong `app.json`
- **Giải pháp**:
  - Đảm bảo `app.json` có `scheme: "buddyup"`
  - Rebuild app sau khi thay đổi `app.json`

### Lỗi Facebook: "Đây là URI chuyển hướng không hợp lệ của ứng dụng này"

- **Nguyên nhân**: URI chưa được thêm vào danh sách Valid OAuth Redirect URIs
- **Giải pháp**:
  - Vào **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs**
  - Thêm URI vào text area: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
  - Click **"Lưu thay đổi"** (Save Changes)
  - Sử dụng công cụ validation để test lại URI

### Lỗi Facebook: "Invalid Scopes: email"

- **Nguyên nhân**: Facebook App ở Development Mode và tài khoản test chưa được thêm
- **Giải pháp ngắn hạn (Development)**:
  1. **Option 1 - Thêm Test Users:**
     - Vào Facebook Developers → Your App
     - **Roles** → **Administrators** hoặc **Testers**
     - Thêm Facebook account của bạn vào danh sách
     - Hoặc tạo Test User mới trong **Roles** → **Test Users**
  2. **Option 2 - App Review (Production):**
     - Nếu muốn cho public users sử dụng, cần submit app review
     - Vào **App Review** → **Permissions and Features**
     - Request review cho permission **"email"** và **"public_profile"**
     - Giải thích use case và submit screenshots
     - Chờ Facebook approve (có thể mất vài ngày)

  3. **Option 3 - Không dùng email (Temporary Workaround):**
     - Chỉ request `public_profile` permission
     - Nhưng sẽ không lấy được email từ Facebook
     - Cần xử lý trường hợp user không có email

- **Khuyến nghị**: Dùng Option 1 cho development/testing, sau đó submit App Review cho production

### Lỗi: "Unsupported provider: Provider [ID] could not be found"

- **Nguyên nhân**: Google/Facebook provider chưa được enable trong Supabase Dashboard
- **Giải pháp**:
  1. **Kiểm tra Supabase Dashboard**:
     - Vào [Supabase Dashboard](https://app.supabase.com/)
     - Chọn project của bạn
     - Vào **Authentication** → **Providers**
     - Tìm **Google** → Đảm bảo toggle switch đã được **BẬT** (ON)
     - Kiểm tra **Client ID** và **Client Secret** đã được điền đúng chưa
  2. **Nếu chưa enable**:
     - Click vào **Google** để expand
     - Bật toggle **Enable Google**
     - Paste **Client ID** và **Client Secret** từ Google Cloud Console
     - Click **Save**
  3. **Verify Configuration**:
     - Đảm bảo Client ID và Client Secret đã được copy đúng (không có khoảng trắng thừa)
     - Đảm bảo đã click **Save** sau khi điền thông tin
  4. **Nếu vẫn lỗi**:
     - Thử disable và enable lại Google provider
     - Kiểm tra lại Client ID/Secret trong Google Cloud Console
     - Đảm bảo redirect URI đã được thêm vào Google Cloud Console

---

## Lưu ý quan trọng

1. **Bảo mật**:
   - Không commit Client Secret / App Secret vào git
   - Chỉ lưu trong Supabase Dashboard (đã được encrypt)

2. **Development vs Production**:
   - **Development Mode**:
     - Có thể dùng test users trong Google OAuth consent screen
     - Facebook app ở chế độ Development không cần submit review
     - OAuth flow hoạt động bình thường với test users
     - **Cảnh báo "Không đủ điều kiện để gửi" trong Facebook KHÔNG ảnh hưởng** đến OAuth trong development
   - **Production**:
     - Cần verify app với Google/Facebook
     - Cần submit Facebook App Review nếu muốn publish công khai
     - Cần điền đầy đủ: App Icon, Privacy Policy URL, User Data Deletion, Category

3. **Facebook App Status - Development Mode**:
   - App ở chế độ Development có thể sử dụng OAuth với:
     - Test users (thêm trong Roles → Test Users)
     - Admin/Developer của app
   - **Không cần** điền App Icon, Privacy Policy, User Data Deletion để test OAuth
   - Cảnh báo màu đỏ chỉ áp dụng khi muốn submit app để publish công khai
   - **Kết luận**: Bạn có thể bỏ qua cảnh báo này trong giai đoạn development

4. **Redirect URI**:
   - Supabase redirect URI: Dùng cho Google/Facebook config
   - Mobile app redirect URI: Dùng cho Supabase URL Configuration
   - Không nhầm lẫn 2 loại này

5. **Testing**:
   - Test trên emulator Android trước
   - Đảm bảo browser có thể mở được (emulator cần có Google Play Services)
   - Để test Facebook OAuth, đảm bảo bạn đang login bằng Facebook account là Admin/Developer của app, hoặc thêm account vào Test Users

---

## Tài liệu tham khảo

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)

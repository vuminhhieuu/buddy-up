# Social Authentication Implementation Guide

## Tổng quan

Document này ghi lại quá trình implement đăng nhập/đăng ký bằng Google và Facebook cho ứng dụng React Native (Expo) sử dụng Supabase.

**Ngày hoàn thành:** 11/12/2025  
**Phiên bản:** 1.0

---

## Công nghệ sử dụng

- **React Native:** Expo SDK 54
- **Backend:** Supabase (Authentication, Database)
- **OAuth Libraries:**
  - `expo-auth-session`: Xử lý OAuth flow
  - `expo-web-browser`: Mở browser cho OAuth
- **Deep Linking:** Custom URL scheme `buddyup://`
- **State Management:** Redux Toolkit

---

## Kiến trúc OAuth Flow

### Flow tổng quan

```
User clicks "Login with Google"
  ↓
App calls signInWithGoogle()
  ↓
Supabase.auth.signInWithOAuth() → Get authorization URL
  ↓
WebBrowser.openAuthSessionAsync() → Open Google login
  ↓
User authenticates with Google
  ↓
Google redirects to: buddyup://auth/callback#access_token=...&refresh_token=...
  ↓
App parses tokens from URL hash
  ↓
supabase.auth.setSession({ access_token, refresh_token })
  ↓
createProfileIfNeeded() → Create profile if new user
  ↓
RegisterForm checks isNewProfile
  ↓
  If true: Navigate to ProfileSetup
  If false: Login successful, enter app
```

### OAuth Flow Type: **Implicit Flow**

Supabase sử dụng **Implicit Flow** cho mobile apps với custom URL schemes:

- Tokens được trả về trực tiếp trong URL hash fragment
- Không cần PKCE code exchange
- Format: `buddyup://auth/callback#access_token=...&refresh_token=...`

---

## Các bước Implementation

### 1. Setup Dependencies

```bash
npx expo install expo-auth-session expo-web-browser
```

### 2. Configure Deep Linking

**File:** `app.json`

```json
{
  "expo": {
    "scheme": "buddyup"
  }
}
```

### 3. Configure Supabase Redirect URLs

Trong Supabase Dashboard → Authentication → URL Configuration:

**Redirect URLs:**

- `buddyup://auth/callback` (Production/Development)

### 4. Setup OAuth Providers

**Google OAuth:**

- Tạo OAuth Client trong Google Cloud Console
- Lấy Client ID và Client Secret
- Configure trong Supabase Dashboard

**Facebook OAuth:**

- Tạo App trong Facebook Developers
- Lấy App ID và App Secret
- Configure trong Supabase Dashboard

Chi tiết setup: Xem `docs/oauth_setup.md`

### 5. Code Implementation

#### a. OAuth Config (`src/config/oauth.ts`)

```typescript
import * as AuthSession from 'expo-auth-session';

export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[keyof typeof OAUTH_PROVIDERS];

export function makeOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'buddyup',
    path: 'auth/callback',
  });
}
```

#### b. Auth Service (`src/services/auth.ts`)

**Core Functions:**

1. **`signInWithOAuth(provider: OAuthProvider)`**
   - Get authorization URL from Supabase
   - Open browser với OAuth URL
   - Parse tokens từ redirect URL
   - Set session với Supabase
   - Create profile if needed
   - Return `{ session, user, isNewProfile }`

2. **`createProfileIfNeeded(userId, userMetadata)`**
   - Check nếu profile đã tồn tại
   - Nếu chưa có, tạo profile mới
   - Extract `display_name` và `avatar_url` từ `user_metadata`
   - Return `boolean` (true nếu tạo mới, false nếu đã có)

**Key Implementation Details:**

```typescript
async function signInWithOAuth(provider: OAuthProvider) {
  // 1. Generate redirect URI
  const redirectUri = makeOAuthRedirectUri();

  // 2. Get OAuth URL from Supabase
  const { data: oauthData } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true, // We handle browser manually
    },
  });

  // 3. Open browser
  const result = await WebBrowser.openAuthSessionAsync(oauthData.url, redirectUri);

  // 4. Parse tokens from hash fragment
  const parsed = new URL(result.url);
  const hashParams = new URLSearchParams(parsed.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  // 5. Set session
  const { data } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // 6. Create profile if needed
  const isNewProfile = await createProfileIfNeeded(data.user.id, {
    display_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
    avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
  });

  return { ...data, isNewProfile };
}
```

#### c. RegisterForm Integration

```typescript
const handleSocialLogin = async (provider: 'google' | 'facebook') => {
  try {
    // Set flag to prevent auto-navigation during social login
    dispatch(setIsRegistering(true));

    const result = await signInWithGoogle(); // or signInWithFacebook()

    if (result.session?.user) {
      const user = result.session.user;
      const isNewProfile = (result as any).isNewProfile;

      dispatch(
        setUser({
          userId: user.id,
          email: user.email ?? null,
        }),
      );

      if (isNewProfile) {
        // New user - trigger profile setup
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        dispatch(setProfileSetupInProgress(true));
        dispatch(setCurrentProfileStep(1));
        dispatch(setProfileData({ displayName, avatarUrl }));

        setTimeout(() => {
          dispatch(setIsRegistering(false));
          onNavigateToProfileSetup?.(displayName);
        }, 100);
      } else {
        // Existing user - login successful
        dispatch(setIsRegistering(false));
      }
    }
  } catch (error) {
    dispatch(setIsRegistering(false));
    // Handle error...
  }
};
```

---

## Vấn đề gặp phải & Giải pháp

### ❌ Issue 1: "Unsupported provider: provider is not enabled"

**Nguyên nhân:**

- Provider chưa được enable trong Supabase Dashboard
- Client ID/Secret chưa được configure đúng

**Giải pháp:**

1. Vào Supabase Dashboard → Authentication → Providers
2. Enable Google/Facebook
3. Nhập đúng Client ID và Client Secret
4. Lưu và test lại

---

### ❌ Issue 2: "No authorization code received"

**Nguyên nhân:**

- Code tìm `code` parameter (PKCE flow)
- Nhưng Supabase trả về `access_token` và `refresh_token` (Implicit flow)

**Giải pháp:**
Đổi từ PKCE flow sang Implicit flow:

```typescript
// ❌ Before: Tìm code
const code = parsed.searchParams.get('code');

// ✅ After: Parse tokens từ hash
const hashParams = new URLSearchParams(parsed.hash.substring(1));
const accessToken = hashParams.get('access_token');
const refreshToken = hashParams.get('refresh_token');

// ❌ Before: Exchange code
await supabase.auth.exchangeCodeForSession({ code });

// ✅ After: Set session trực tiếp
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken,
});
```

---

### ❌ Issue 3: App bị loading vô tận sau social login

**Nguyên nhân:**

1. `setSession()` trigger `onAuthStateChange` event
2. `useAuthSession` hook nhận `SIGNED_IN` event
3. App tự động navigate vào MainTabs
4. `RegisterForm` bị unmount trước khi xử lý xong
5. Code check profile không chạy được

**Giải pháp:**
Block auto-navigation bằng flag `isRegistering`:

```typescript
// RegisterForm
const handleSocialLogin = async () => {
  // Set flag TRƯỚC KHI gọi OAuth
  dispatch(setIsRegistering(true));

  const result = await signInWithGoogle();

  // Process result...

  // Clear flag SAU KHI xử lý xong
  dispatch(setIsRegistering(false));
};

// useAuthSession
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    // Skip nếu đang trong social login flow
    if (isRegistering) return;

    // Normal navigation logic...
  });
}, [isRegistering]);
```

---

### ❌ Issue 4: Profile không được tạo sau social login

**Nguyên nhân:**

- `createProfileIfNeeded()` được gọi NHƯNG không return thông tin
- `RegisterForm` phải check lại database để biết có profile chưa
- Do timing issue, check có thể fail

**Giải pháp:**
`createProfileIfNeeded()` return boolean:

```typescript
async function createProfileIfNeeded(userId, metadata): Promise<boolean> {
  // Check if exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingProfile) {
    return false; // Already exists
  }

  // Create new
  await supabase.from('profiles').insert({
    user_id: userId,
    display_name: metadata.display_name,
    avatar_url: metadata.avatar_url,
  });

  return true; // Created new
}

// In signInWithOAuth
const isNewProfile = await createProfileIfNeeded(userId, metadata);
return { ...data, isNewProfile };
```

---

### ❌ Issue 5: Avatar không hiển thị trong ProfileSetup

**Nguyên nhân:**

- `RegisterForm` chỉ set `displayName` vào `profileData`
- Không extract và set `avatarUrl` từ `user_metadata`

**Giải pháp:**
Extract và set avatar:

```typescript
if (isNewProfile) {
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

  dispatch(
    setProfileData({
      displayName,
      avatarUrl, // Add this
    }),
  );
}
```

---

### ❌ Issue 6: Facebook "Invalid Scopes: email"

**Nguyên nhân:**

- Facebook App đang ở Development Mode
- Tài khoản đang test chưa được thêm vào Roles
- Permission "email" cần được approved cho production

**Giải pháp (Development):**

**Option 1: Thêm Test Users (Nhanh nhất)**

```
1. Vào Facebook Developers → Your App
2. Roles → Administrators
3. Add your Facebook account
4. Test lại OAuth flow
```

**Option 2: Tạo Test Users**

```
1. Roles → Test Users
2. Add Test User
3. Login với test user account
4. OAuth sẽ work với test user
```

**Giải pháp (Production):**

```
1. App Review → Permissions and Features
2. Request "email" và "public_profile" permissions
3. Giải thích use case + screenshots
4. Submit và chờ approve (vài ngày)
```

**Workaround tạm thời - Configure Supabase:**

**KHÔNG CẦN MODIFY CODE!** Chỉ cần config Supabase:

1. **Vào Supabase Dashboard** → Authentication → Providers → Facebook
2. **Xóa** `email` khỏi field **"Scopes"**
3. **Chỉ giữ**: `public_profile`
4. **Save** và test lại

**Chi tiết:** Xem `docs/facebook_email_workaround.md`

**Lưu ý:** Không có email sẽ cần xử lý logic đặc biệt:

- User profile có thể không có email (`user.email = null`)
- Không thể merge với email/password account
- Cần alternative identifier (Facebook ID hoặc user_id)

---

## Best Practices

### 1. Error Handling

```typescript
try {
  const result = await signInWithOAuth(provider);
} catch (error: any) {
  // Check for user cancellation
  if (error?.code === 'user_cancelled') {
    logger.debug('User cancelled login');
    return; // Don't show error
  }

  // Show error to user
  Alert.alert('Login Failed', translateAuthError(error));
}
```

### 2. User Metadata Extraction

Google và Facebook có format khác nhau:

```typescript
// Google
const displayName = user.user_metadata?.full_name || user.user_metadata?.name;
const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

// Facebook
const displayName = user.user_metadata?.full_name || user.user_metadata?.name;
const avatarUrl = user.user_metadata?.avatar_url;
```

### 3. Redirect URI Configuration

**Development vs Production:**

- Development: `buddyup://auth/callback`
- Production: Same (custom scheme works for both)

**Expo Go:**

- Expo Go requires Expo proxy: `https://auth.expo.io/@owner/slug/auth/callback`
- Development builds use custom scheme directly

### 4. Profile Creation Strategy

**Option 1: Create immediately (Hiện tại đang dùng)**

- ✅ Profile sẵn sàng ngay sau login
- ✅ Không cần check thêm
- ✅ ProfileSetup chỉ cập nhật thông tin bổ sung

**Option 2: Create in ProfileSetup**

- ❌ Phức tạp hơn
- ❌ Cần handle race conditions
- ✅ Linh hoạt hơn về data

→ **Khuyến nghị:** Dùng Option 1 (create immediately)

---

## Testing Checklist

### Test Cases

- [ ] **New User - Google:**
  1. Xóa user trong Supabase
  2. Click "Đăng ký bằng Google"
  3. Login Google
  4. ✅ Navigate đến ProfileSetup
  5. ✅ Display name được điền sẵn
  6. ✅ Avatar được hiển thị
  7. Hoàn thành ProfileSetup
  8. ✅ Vào app thành công

- [ ] **Existing User - Google:**
  1. User đã có profile
  2. Click "Đăng nhập bằng Google"
  3. Login Google
  4. ✅ Vào app trực tiếp (không qua ProfileSetup)

- [ ] **User Cancellation:**
  1. Click social login
  2. Cancel trên Google login screen
  3. ✅ Quay về login screen
  4. ✅ Không hiển thị error alert

- [ ] **Network Error:**
  1. Tắt mạng
  2. Click social login
  3. ✅ Hiển thị error message phù hợp

- [ ] **Facebook Login:** (Tương tự Google)
  - ⚠️ **Lưu ý:** Nếu gặp "Invalid Scopes: email":
    - Đảm bảo đã thêm test user vào Facebook App
    - Hoặc login bằng Facebook account là Administrator của app
    - Hoặc submit App Review để approve "email" permission

---

## Maintenance Notes

### Dependencies

**Critical:**

- `expo-auth-session`: OAuth handling
- `expo-web-browser`: Browser launcher
- `@supabase/supabase-js`: Supabase client

**Update Guidelines:**

- Test OAuth flow after updating `expo-auth-session`
- Check breaking changes in Supabase client updates
- Verify deep linking works after Expo SDK updates

### Monitoring

**Logs to monitor:**

```typescript
LOG  [signInWithOAuth] Starting OAuth flow
LOG  [signInWithOAuth] Tokens from hash - access_token: found, refresh_token: found
LOG  [createProfileIfNeeded] Profile created for user
LOG  [RegisterForm] New user from google, triggering profile setup
```

**Common error patterns:**

- "No tokens received" → Check redirect URI configuration
- "Profile creation failed" → Check database permissions/RLS
- "User cancelled" → Normal, don't alert

---

## Future Enhancements

### Potential Improvements

1. **Apple Sign In:**
   - Required for iOS App Store
   - Use `expo-apple-authentication`

2. **Account Linking:**
   - Link Google + Facebook for same email
   - Merge profiles if needed

3. **Refresh Token Handling:**
   - Auto-refresh expired tokens
   - Handle refresh failures

4. **Offline Support:**
   - Cache session locally
   - Queue profile updates

5. **Analytics:**
   - Track social login success/failure rates
   - Monitor provider performance

---

## References

- [Supabase OAuth Guide](https://supabase.com/docs/guides/auth/social-login)
- [Expo AuthSession Docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google OAuth Setup](./oauth_setup.md)
- [Facebook OAuth Setup](./oauth_setup.md)
- [Facebook "Invalid Scopes: email" Fix](./facebook_email_workaround.md)

---

## Change Log

**v1.0 - 11/12/2025:**

- Initial implementation
- Google & Facebook OAuth support
- Profile auto-creation
- ProfileSetup integration
- Avatar extraction from social providers

---

## Contact

Nếu gặp vấn đề, hãy check:

1. Log trong terminal
2. Supabase Dashboard → Authentication → Logs
3. File `oauth_setup.md` cho setup details

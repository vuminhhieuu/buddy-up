# 🧑‍🤝‍🧑 Buddy Up – Study Connection App

> **Buddy Up** là ứng dụng giúp sinh viên và người học kết nối với bạn học phù hợp để cùng nhau học tập, trao đổi kiến thức và phát triển kỹ năng thông qua chat, nhóm học và lịch trình học tập.
> Dự án được phát triển bằng **React Native (Expo)** và **Supabase**, hướng tới khả năng mở rộng, realtime và trải nghiệm thân thiện trên cả Android & iOS.

---

## 1. Giới thiệu

**Buddy Up** ra đời từ nhu cầu kết nối sinh viên, giúp họ dễ dàng tìm kiếm bạn học có cùng môn học, lịch học, hoặc mục tiêu rèn luyện.
Ứng dụng cung cấp:

* Chat realtime (1–1 & nhóm học)
* Lên lịch buổi học
* Nhận thông báo nhắc nhở và hoạt động mới
* Thống kê hiệu quả học tập

---

## 2. Tính năng chính

| Nhóm                        | Tính năng                                 | Mô tả                                          |
| --------------------------- | ----------------------------------------- | ---------------------------------------------- |
| 👤 **User & Auth**          | Đăng ký, đăng nhập, cập nhật hồ sơ        | Xác thực Supabase, lưu dữ liệu người dùng      |
| 🔎 **Matching**             | Tìm kiếm bạn học phù hợp                  | Dựa trên thông tin học, sở thích, kỹ năng      |
| 💬 **Chat & Group**         | Nhắn tin 1–1, chat nhóm, gửi lời mời nhóm | Sử dụng Supabase Realtime (channels)           |
| 🗓️ **Schedule & Reminder** | Quản lý lịch học, nhắc nhở tự động        | Đồng bộ thời gian & gửi notification trong app |
| 📈 **Analytics & Progress** | Theo dõi tiến độ, thống kê hoạt động học  | Giao diện biểu đồ & thống kê tuần/tháng        |
| ⚙️ **Settings**             | Tuỳ chỉnh cá nhân, theme, thông báo       | Lưu trữ cục bộ (AsyncStorage)                  |
| 🔐 **Security**             | Bảo mật dữ liệu người dùng                | RLS Policies (Supabase) + Authentication       |

---

## 3. Kiến trúc hệ thống

> Trích từ **System Architecture Document**

**Kiến trúc tổng thể:**
Ứng dụng tuân theo mô hình **Client–Backend-as-a-Service**, nơi:

* **Frontend (Mobile)**: React Native + Expo
* **Backend**: Supabase (Auth, Postgres, Storage, Realtime)
* **Realtime Layer**: Supabase Realtime (channels)
* **Storage**: Supabase Storage
* **Automation & CI/CD**: GitHub Actions + Expo EAS

```
[React Native App]
     │
     ▼
[Supabase Auth] ←──→ [Postgres (Supabase)]
     │                     │
     │                     ▼
     └──> [Realtime Channels] → [Notifications / Analytics]
```

**Các module chính:**

* **Auth Module** – quản lý đăng ký/đăng nhập
* **Match Module** – logic matching người dùng
* **Chat Module** – chat realtime, nhóm học
* **StudyGroup Module** – nhóm học + lịch học
* **Notification Module** – in-app notification
* **Analytics Module** – thống kê & báo cáo

---

## 4. Công nghệ sử dụng

> Trích từ **Tech Stack Decision Record (ADR)**

| Hạng mục             | Công nghệ                                      | Ghi chú                             |
| -------------------- | ---------------------------------------------- | ----------------------------------- |
| **Frontend**         | React Native (Expo) + TypeScript               | Phát triển nhanh, đa nền tảng       |
| **State Management** | Redux Toolkit                                  | Quy ước mạnh, dễ mở rộng            |
| **Backend**          | Supabase (Auth, Postgres, Storage, Realtime)   | Realtime + serverless               |
| **Database**         | Postgres (Supabase)                            | Lợi thế SQL + RLS                   |
| **Design**           | Figma                                          | Wireframe + Mockup đồng bộ          |
| **Testing**          | Jest + Detox                                   | Unit + E2E test                     |
| **CI/CD**            | GitHub Actions + Expo EAS                      | Build/test/deploy tự động           |
| **Security**         | RLS Policies + Env secrets                     | Bảo mật dữ liệu người dùng          |
| **i18n**             | i18next + react-i18next                        | Đa ngôn ngữ trong app               |

---

## 5. Cấu trúc thư mục

```
buddy-up/
├── .expo/
├── .git/
├── .github/                 # GitHub Actions workflows, Copilot instructions/prompts
├── assets/                  # Hình ảnh, fonts, icons, v.v.
│   ├── images/
│   ├── fonts/
│   └── icons/
├── components/              # Các component UI có thể tái sử dụng (stateless hoặc ít logic)
│   ├── common/              # Các component rất chung, không phụ thuộc vào business logic
│   │   ├── Button/Button.tsx
│   │   ├── Text/Text.tsx
│   │   └── ...
│   ├── specific/            # Các component tái sử dụng nhưng có liên quan đến business logic cụ thể
│   │   ├── StudySessionCard/StudySessionCard.tsx
│   │   └── ...
│   └── index.ts             # Export tất cả components
├── constants/               # Các hằng số toàn cục (API keys, URLs, magic strings)
│   ├── index.ts
│   └── colors.ts
│   └── sizes.ts
├── contexts/                # React Contexts cho quản lý trạng thái toàn cục
│   ├── AuthContext.tsx
│   ├── ChatContext.tsx
│   └── index.ts
├── hooks/                   # Các custom React Hooks
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── index.ts
├── navigation/              # Cấu hình điều hướng (React Navigation)
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── MainTabNavigator.tsx
│   └── index.ts
├── screens/                 # Các màn hình chính của ứng dụng (chứa nhiều component)
│   ├── Auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── Home/
│   │   ├── HomeScreen.tsx
│   │   └── components/      # Components chỉ dùng trong màn hình Home
│   ├── Chat/
│   │   ├── ChatListScreen.tsx
│   │   ├── ChatDetailScreen.tsx
│   │   └── components/
│   ├── Profile/
│   │   ├── ProfileScreen.tsx
│   │   └── EditProfileScreen.tsx
│   └── ...
├── services/                # Các dịch vụ tương tác với backend (Supabase, API)
│   ├── auth.ts              # Supabase Auth
│   ├── db.ts                # Truy vấn Postgres thông qua Supabase
│   ├── storage.ts           # Supabase Storage
│   ├── realtime.ts          # Kênh Realtime, presence
│   └── index.ts
├── utils/                   # Các hàm tiện ích, helper functions
│   ├── helpers.ts
│   ├── validators.ts
│   └── index.ts
├── App.tsx                  # Entry point của ứng dụng
├── app.json                 # Expo configuration
├── babel.config.js
├── tsconfig.json            # TypeScript configuration
├── .env                     # Environment variables
├── .env.example
├── .eslintrc.js             # ESLint configuration
├── .prettierrc.js           # Prettier configuration
├── package.json
├── yarn.lock
└── README.md

```

---

## 6. Hướng dẫn cài đặt

### 🔹 Yêu cầu

* Node.js **v20.19.4+**
* npm **v10+**
* Expo CLI

### 🔹 Cài đặt

```bash
# Clone dự án
git clone https://github.com/vuminhhieuu/buddy-up.git
cd buddy-up

# Cài deps
npm install

# Chạy dev server
npx expo start

# Env
copy file .example.env thành .env và đổi real key
```

---

## 7. Thiết lập Supabase

### 1️⃣ Tạo project tại [Supabase](https://supabase.com)

Bật:

* Authentication → Email/Password (hoặc Social/OAuth nếu cần)
* Database → Tạo schema/tables cần thiết
* Realtime → Enable Realtime cho tables cần theo dõi
* Storage → Create bucket (nếu cần)

### 2️⃣ Tạo file `.env`

```
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Supabase config

`src/config/supabase.ts`

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 4️⃣ Cài đặt packages

```bash
npm i @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
# (tuỳ chọn) RTK/RTK Query
npm i @reduxjs/toolkit react-redux
# i18n
npm i i18next react-i18next
```

### 5️⃣ Thiết lập i18n

`src/config/i18n.ts`

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../assets/i18n/en/common.json';
import vi from '../assets/i18n/vi/common.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'vi',
  fallbackLng: 'en',
  resources: {
    en: { common: en },
    vi: { common: vi },
  },
  ns: ['common'],
  defaultNS: 'common',
});

export default i18n;
```

Sử dụng trong component:

```ts
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
// t('welcome')
```
---



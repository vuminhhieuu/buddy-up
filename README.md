# 🧑‍🤝‍🧑 Buddy Up – Study Connection App

> **Buddy Up** là ứng dụng giúp sinh viên và người học kết nối với bạn học phù hợp để cùng nhau học tập, trao đổi kiến thức và phát triển kỹ năng thông qua chat, nhóm học và lịch trình học tập.
> Dự án được phát triển bằng **React Native (Expo)** và **Firebase**, hướng tới khả năng mở rộng, realtime và trải nghiệm thân thiện trên cả Android & iOS.

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
| 👤 **User & Auth**          | Đăng ký, đăng nhập, cập nhật hồ sơ        | Xác thực Firebase, lưu dữ liệu người dùng      |
| 🔎 **Matching**             | Tìm kiếm bạn học phù hợp                  | Dựa trên thông tin học, sở thích, kỹ năng      |
| 💬 **Chat & Group**         | Nhắn tin 1–1, chat nhóm, gửi lời mời nhóm | Sử dụng Firestore realtime & Cloud Functions   |
| 🗓️ **Schedule & Reminder** | Quản lý lịch học, nhắc nhở tự động        | Đồng bộ thời gian & gửi notification trong app |
| 📈 **Analytics & Progress** | Theo dõi tiến độ, thống kê hoạt động học  | Giao diện biểu đồ & thống kê tuần/tháng        |
| ⚙️ **Settings**             | Tuỳ chỉnh cá nhân, theme, thông báo       | Lưu trữ cục bộ (AsyncStorage)                  |
| 🔐 **Security**             | Bảo mật dữ liệu người dùng                | Firebase Security Rules + Authentication       |

---

## 3. Kiến trúc hệ thống

> Trích từ **System Architecture Document**

**Kiến trúc tổng thể:**
Ứng dụng tuân theo mô hình **Client–Backend-as-a-Service**, nơi:

* **Frontend (Mobile)**: React Native + Expo
* **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
* **Realtime Layer**: Firestore Listener
* **Storage**: Firebase Cloud Storage
* **Automation & CI/CD**: GitHub Actions + Expo EAS

```
[React Native App]
     │
     ▼
[Firebase Auth] ←──→ [Firestore DB]
     │                     │
     │                     ▼
     └──> [Cloud Functions] → [Notifications / Analytics]
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
| **State Management** | Zustand                                        | Nhẹ, dễ bảo trì                     |
| **Backend**          | Firebase (Auth, Firestore, Storage, Functions) | Realtime + serverless               |
| **Database**         | Firestore (NoSQL)                              | Cấu trúc theo collection-per-module |
| **Design**           | Figma                                          | Wireframe + Mockup đồng bộ          |
| **Testing**          | Jest + Detox                                   | Unit + E2E test                     |
| **CI/CD**            | GitHub Actions + Expo EAS                      | Build/test/deploy tự động           |
| **Security**         | Firebase Rules + Env secrets                   | Bảo mật dữ liệu người dùng          |

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
├── services/                # Các dịch vụ tương tác với backend (Firebase, API)
│   ├── auth.ts
│   ├── firestore.ts
│   ├── storage.ts
│   ├── matching.ts          # Logic gọi Cloud Function matching
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
npm start
```

---

## 7. Thiết lập Firebase

### 1️⃣ Tạo project tại [Firebase Console](https://console.firebase.google.com)

Bật:

* Authentication → Email/Password
* Firestore Database → Test Mode (dev)
* Storage → Default bucket

### 2️⃣ Tạo file `.env`

```
FIREBASE_API_KEY=xxxx
FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
FIREBASE_PROJECT_ID=xxxx
FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=xxxx
FIREBASE_APP_ID=xxxx
```

### 3️⃣ Firebase config

`src/config/firebase.ts`

```ts
import { initializeApp } from "firebase/app";
import { getAuth, getFirestore, getStorage } from "firebase";
import Constants from "expo-constants";

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---



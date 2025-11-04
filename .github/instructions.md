# Project Technology Stack

This project uses the following technologies and frameworks:

- **Frontend:** React Native (Expo SDK ~54.0.13), TypeScript, React Navigation v7
- **State Management:** Redux Toolkit (RTK) + optional RTK Query
- **Backend:** Supabase (Auth, Postgres, Storage, Realtime)
- **Database:** Postgres (via Supabase)
- **Form Handling:** Formik v2 + Yup v1 (validation)
- **Navigation:** React Navigation (Native Stack Navigator)
- **Storage:** AsyncStorage (@react-native-async-storage/async-storage)
- **HTTP Client:** Axios v1
- **Styling:** React Native StyleSheet (native styling)
- **Internationalization:** i18next + react-i18next
- **Version Control:** Git, GitHub
- **CI/CD:** GitHub Actions, Expo EAS (for builds)
- **Code Quality Tools:** ESLint, Prettier, Husky, lint-staged
- **Testing:** Jest, React Native Testing Library (planned)
- **Platform:** iOS and Android (mobile-first)

---

# Coding Conventions and Best Practices

## Language and Type Safety

- **Language:** TypeScript for all JavaScript-based code. Use strict type checking.
- **Type Definitions:** Define interfaces/types in `src/models` or co-located with components/services.
- **Avoid `any`:** Use proper types or `unknown` when necessary.

## Architecture

- **Architecture Pattern:** Clean Architecture principles (separation of concerns: UI, Domain, Data layers).
- **Layer Separation:**
  - **UI Layer:** `src/screens`, `src/components` - React components and screens
- **Domain Layer:** `src/store` (Redux Toolkit), business logic
- **Data Layer:** `src/services`, `src/api` - Supabase interactions, external APIs
- **Service Layer:** Centralize Supabase operations and external API calls in `src/services`.

## Folder Structure

```
src/
├── api/              # API client configurations (Axios instances, interceptors)
├── assets/           # Images, fonts, icons
├── components/       # Reusable UI components
│   ├── common/      # Generic components (Button, Text, Input, etc.)
│   └── specific/    # Business-specific components (StudySessionCard, etc.)
├── config/          # Configuration files (Supabase config, constants)
├── hooks/           # Custom React Hooks (useAuth, useChat, etc.)
├── navigation/      # Navigation setup (React Navigation)
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainTabNavigator.tsx
├── screens/         # Main application screens/views
│   ├── Auth/       # Login, Register screens
│   ├── Home/       # Home screen
│   ├── Chat/       # Chat list, chat detail screens
│   └── Profile/    # Profile, Edit Profile screens
├── services/       # API calls, Supabase interactions
│   ├── auth.ts     # Supabase Auth operations
│   ├── db.ts       # Postgres (via Supabase) queries
│   └── storage.ts  # Supabase Storage operations
├── store/          # Redux Toolkit store (state management)
├── styles/         # Global styles, theme definitions
└── utils/          # Utility functions, helpers, validators
```

## Naming Conventions

- **Variables:** `camelCase` (e.g., `userName`, `isLoading`)
- **Functions:** `camelCase` (e.g., `fetchUserData`, `handleSubmit`)
- **Components:** `PascalCase` (e.g., `Button`, `ChatScreen`, `UserProfile`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`, `MAX_FILE_SIZE`)
- **Files:** Match component/function name (e.g., `Button.tsx`, `useAuth.ts`)
- **Directories:** `PascalCase` for components/screens, `camelCase` for utilities/services

## Code Formatting and Linting

- **Code Formatting:** Adhere to Prettier rules (configured in `.prettierrc` or `package.json`).
- **Linting:** Adhere to ESLint rules (configured in `.eslintrc.js`).
- **Auto-formatting:** Use Prettier on save. Run `npm run lint` before committing.
- **Pre-commit Hooks:** Husky + lint-staged configured to run linting/formatting before commits.

## Comments and Documentation

- **JSDoc:** Use JSDoc for complex functions, components, and exported utilities.
- **Inline Comments:** Explain non-obvious logic, business rules, or workarounds.
- **Component Props:** Document component props using TypeScript interfaces/types.
- **Example:**
  ```typescript
  /**
   * Fetches user data from Firestore by user ID.
   * @param userId - The unique identifier of the user
   * @returns Promise<User | null> - User data or null if not found
   * @throws {Error} If Firebase connection fails
   */
  async function fetchUser(userId: string): Promise<User | null> {
    // Implementation
  }
  ```

## Error Handling

- **Centralized Error Handling:** Use try-catch blocks for all async operations.
- **Error Boundaries:** Implement React error boundaries for component-level error handling.
- **Firebase Errors:** Handle Firebase-specific errors (auth, Firestore) gracefully with user-friendly messages.
- **Logging:** Log errors appropriately (console.error in dev, error tracking service in production).

## State Management

- **Global State:** Use Redux Toolkit store in `src/store` for shared application state.
- **Slices:** Organize state by feature with RTK slices; use Immer for immutable updates.
- **Data Fetching:** Prefer RTK Query for server cache and request lifecycle; otherwise use thunks.
- **Local State:** Use React `useState` and `useReducer` for component-specific state.
- **Avoid:** Prop drilling beyond 2-3 levels; use context or RTK instead.

## Supabase Best Practices

- **Environment Variables:** Read `SUPABASE_URL` and `SUPABASE_ANON_KEY` via Expo Constants; do not hardcode.
- **Client Setup:** Initialize Supabase once in `src/config/supabase.ts` with React Native `AsyncStorage` adapter.
- **Auth:** Use `onAuthStateChange` to persist/refresh sessions; handle deep links for OAuth if enabled.
- **RLS:** Enforce Row Level Security with Postgres policies; validate on server side where applicable.
- **Realtime:** Use channels for presence/DB changes; always unsubscribe in `useEffect` cleanup.
- **Error Handling:** Normalize `PostgrestError` and `AuthError` to user-friendly messages.

## React Native Best Practices

- **Performance:**
  - Use `React.memo` for expensive components.
  - Avoid unnecessary re-renders (use `useMemo`, `useCallback` appropriately).
  - Optimize FlatList with `keyExtractor`, `getItemLayout`, and `removeClippedSubviews`.
- **Accessibility:** Add `accessibilityLabel`, `accessibilityRole`, and `accessibilityHint` to interactive elements.
- **Platform-Specific Code:** Use `Platform.select()` or separate files (`Button.ios.tsx`, `Button.android.tsx`) when needed.
- **Safe Areas:** Use `react-native-safe-area-context` for proper safe area handling.

## i18n Best Practices

- Use `i18next` + `react-i18next` for localization.
- Store translation resources under `src/assets/i18n/` by namespace (e.g., `common.json`, `auth.json`).
- Initialize in `src/config/i18n.ts` and load before rendering app.
- Use `useTranslation()` in components; avoid hardcoded UI text.
- Keep translation keys meaningful and stable; avoid string concatenation patterns.

---

# Output Format and Quality Requirements

When generating code, ensure the following:

## Comments and Documentation

- **Comments:** Include clear and concise comments for complex logic, functions, and components.
- **JSDoc:** Generate JSDoc comments for all public functions, exported utilities, and component props.
- **Inline Comments:** Explain business logic, non-obvious algorithms, or workarounds.

## Unit Tests

- **Test Coverage:** For new functions or components, generate corresponding unit tests using Jest and React Native Testing Library.
- **Test Structure:** Follow Arrange-Act-Assert pattern.
- **Test Files:** Place test files next to source files (e.g., `Button.test.tsx` next to `Button.tsx`).

## Code Quality

- **SonarLint Compliance:** Ensure generated code adheres to SonarLint best practices:
  - Avoid code smells (duplicated code, long methods, complex conditions).
  - Avoid security vulnerabilities (SQL injection, XSS, insecure storage).
  - Follow React/TypeScript best practices.
- **ESLint Compliance:** Code must pass ESLint checks (no warnings or errors).
- **Prettier Formatting:** Code must be formatted according to Prettier configuration.

## Accessibility

- **Accessibility Labels:** Add `accessibilityLabel` to interactive elements (buttons, inputs, images).
- **Roles:** Use appropriate `accessibilityRole` (button, text, image, etc.).
- **Hints:** Provide `accessibilityHint` for complex interactions.
- **Testing:** Test with screen readers when possible.

## Performance

- **Efficient Code:** Generate efficient code; avoid unnecessary computations.
- **Re-renders:** Avoid unnecessary re-renders in React Native:
  - Use `React.memo` for pure components.
  - Use `useMemo` for expensive calculations.
  - Use `useCallback` for stable function references.
- **List Performance:** Optimize FlatList/SectionList with proper keys and optimizations.

## Type Safety

- **TypeScript:** All code must be properly typed. Avoid `any`; use `unknown` when necessary.
- **Interface Definitions:** Define interfaces/types for props, state, and data models.
- **Type Exports:** Export types/interfaces for reusability.

---

# Project Context

## Project Overview

**Project Name:** Buddy Up  
**Version:** 1.1  
**Description:** Buddy Up is a mobile application that connects students and learners to find suitable study partners. The app helps users find study buddies who share similar subjects, schedules, or learning goals, facilitating collaboration, knowledge exchange, and skill development through chat, study groups, and learning schedules.

**Primary Goal:** Create a platform to help students connect with study partners, increase learning motivation, improve study efficiency, and build a supportive learning community.

## Key Features (MVP Scope)

- **User Authentication:** Registration, login, profile management using Firebase Authentication
- **Matching System:** Find suitable study partners based on subjects, schedules, interests, and skills
- **Chat:** Real-time 1-on-1 and group chat using Firestore real-time capabilities
- **Study Groups:** Create and manage study groups, send invitations
- **Schedule & Reminders:** Manage study schedules and receive automatic reminders
- **Progress Tracking:** Track learning progress and view activity statistics (weekly/monthly views)
- **Settings:** Personalization, theme settings, notification preferences

**Out of MVP Scope:**
- Voice/Video calls via WebRTC (planned for future)
- AI features (planned for future)
- Public community features (planned for future)
- Advanced leaderboard (planned for future)

## Architecture Overview

**Architecture Pattern:** Client + BaaS (Supabase)

- **Frontend (Mobile):** React Native + Expo
- **Backend:** Supabase (Auth, Postgres, Storage, Realtime)
- **Realtime Layer:** Supabase Realtime channels
- **Storage:** Supabase Storage
- **Automation & CI/CD:** GitHub Actions + Expo EAS

**System Modules:**
- **Auth Module:** User registration, login, profile management
- **Match Module:** User matching logic based on preferences
- **Chat Module:** Real-time chat, study groups
- **StudyGroup Module:** Study groups and schedule management
- **Notification Module:** In-app notifications
- **Analytics Module:** Statistics and progress reporting

## Constraints and Assumptions

- **Development Timeline:** MVP development over 2 months
- **Team Size:** 4 developers
- **Platforms:** iOS and Android (mobile-first, web support optional)
- **Technology Stack:** React Native (Expo) + Supabase (as per requirements)
- **Database:** Postgres (via Supabase)

## Success Metrics (Business Goals)

- User registration and retention rates
- Daily/Monthly Active Users (DAU/MAU)
- Connection/match success rate
- Study session completion rate
- User engagement metrics

---

# Additional Guidelines

## Environment Setup

- Node.js version: v20.19.4+
- npm version: v10+
- Expo CLI installed globally or via npx

## Supabase Configuration

- Supabase config is loaded from environment variables via Expo Constants
- Environment variables are stored in `.env` file (not committed to git)
- Reference: `src/config/supabase.ts` for Supabase client initialization

## Git Workflow

- Use feature branches for new features
- Follow conventional commits format (optional but recommended)
- Pre-commit hooks run linting and formatting automatically

## When Adding New Features

1. **Plan the Architecture:** Decide which layer (UI, Domain, Data) the code belongs to
2. **Create Types/Interfaces:** Define TypeScript types first
3. **Write Tests:** Generate unit tests alongside implementation
4. **Follow Conventions:** Use naming conventions and folder structure as defined
5. **Document:** Add JSDoc comments for exported functions/components
6. **Test:** Ensure code passes linting, formatting, and type checks

---

# References

- Project README: `/README.md`
- Notion Documentation: Business & Requirement Layer (BRD, BPD, SRS, FRD, NFR)
- Expo Documentation: https://docs.expo.dev
- Supabase Documentation: https://supabase.com/docs
- React Navigation: https://reactnavigation.org
- Redux Toolkit: https://redux-toolkit.js.org
- Project Prompts:
-  - .github/prompts/general.md
-  - .github/prompts/commit-guidance.md
-  - .github/prompts/review-guidance.md
-  - .github/prompts/test-guidance.md

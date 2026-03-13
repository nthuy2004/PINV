# Công Nghệ Sử Dụng Trong Dự Án LearnHub

## 1. Framework & Ngôn Ngữ

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **Next.js** | 14.2.18 | Framework React fullstack, sử dụng App Router |
| **React** | ^18.3.1 | Thư viện UI component-based |
| **React DOM** | ^18.3.1 | Render React components lên DOM |
| **TypeScript** | ^5.6.3 | Ngôn ngữ lập trình typed superset của JavaScript |

---

## 2. Firebase (Backend-as-a-Service)

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **Firebase** | ^10.14.1 | SDK chính cho client-side |
| **Firebase Admin** | ^12.7.0 | SDK admin cho server-side (API routes) |

### Dịch vụ Firebase được sử dụng:

| Dịch vụ | Mục đích |
|---------|----------|
| **Firebase Authentication** | Xác thực người dùng (Email/Password) |
| **Cloud Firestore** | Cơ sở dữ liệu NoSQL realtime |
| **Firebase Storage** | Lưu trữ file (ảnh, tài liệu) |
| **Realtime Subscriptions** | Lắng nghe thay đổi dữ liệu realtime (onSnapshot) |

---

## 3. Styling & UI

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **TailwindCSS** | ^3.4.15 | Utility-first CSS framework |
| **PostCSS** | ^8.4.47 | CSS transformer/processor |
| **Autoprefixer** | ^10.4.20 | Tự động thêm vendor prefixes cho CSS |
| **clsx** | ^2.1.1 | Utility ghép class names có điều kiện |
| **tailwind-merge** | ^2.5.5 | Merge TailwindCSS classes thông minh, tránh xung đột |

### Font chữ:

| Font | Vai trò |
|------|---------|
| **Inter** | Font chính (`font-sans`) |
| **Outfit** | Font tiêu đề/display (`font-display`) |

### Dark Mode:
- Sử dụng TailwindCSS `class` strategy
- Toggle qua `localStorage`

---

## 4. Animation & Motion

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **Framer Motion** | ^11.11.17 | Thư viện animation cho React (AnimatePresence, motion components) |

### Custom Animations (TailwindCSS):
- `fade-in`, `slide-up`, `slide-down`, `scale-in`, `pulse-slow`, `bounce-subtle`

---

## 5. Form & Validation

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **React Hook Form** | ^7.53.2 | Quản lý form hiệu quả, ít re-render |
| **Zod** | ^3.23.8 | Schema validation (TypeScript-first) |
| **@hookform/resolvers** | ^3.9.1 | Kết nối Zod với React Hook Form |

---

## 6. State Management

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **Zustand** | ^5.0.1 | Quản lý state toàn cục nhẹ, đơn giản |
| **React Context API** | (built-in) | Auth state management (AuthProvider/useAuth) |
| **@tanstack/react-query** | ^5.60.5 | Server state management, data fetching & caching |

---

## 7. Bản Đồ & Vị Trí

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **Leaflet** | ^1.9.4 | Thư viện bản đồ tương tác mã nguồn mở |
| **React Leaflet** | ^4.2.1 | React wrapper cho Leaflet |
| **Firebase GeoPoint** | (built-in) | Lưu trữ tọa độ vị trí người dùng |

---

## 8. Icons

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **Lucide React** | ^0.460.0 | Bộ icon SVG hiện đại, nhẹ (fork của Feather Icons) |

### Icons được sử dụng (một số tiêu biểu):
`Mail`, `Lock`, `BookOpen`, `Users`, `UsersRound`, `Coins`, `ShoppingBag`, `Timer`, `Flame`, `RefreshCw`, `UserPlus`, `Copy`, `Check`, `MessageCircle`, `Search`, `Play`, `Pause`, `Sun`, `Moon`, `Bell`, `Shield`, `Trash2`, `ChevronRight`, `Heart`, `Camera`, `LogOut`, ...

---

## 9. Date & Time

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **date-fns** | ^4.1.0 | Thư viện xử lý ngày tháng hiện đại, nhẹ |
| **Firebase Timestamp** | (built-in) | Kiểu dữ liệu timestamp của Firestore |

---

## 10. Hình Ảnh & Media

| Công nghệ | Mô tả |
|-----------|-------|
| **Next.js Image Optimization** | Tối ưu hình ảnh tự động |
| **Firebase Storage** | Lưu trữ ảnh upload |
| **Unsplash** | Nguồn hình nền Pomodoro |
| **ImgBB** (`i.ibb.co`) | Hosting hình ảnh bổ sung |

### Remote Image Sources (cấu hình trong `next.config.mjs`):
- `firebasestorage.googleapis.com`
- `lh3.googleusercontent.com`
- `images.unsplash.com`
- `i.ibb.co`

---

## 11. Dev Tools & Build

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| **ESLint** | ^8.57.1 | Linter cho JavaScript/TypeScript |
| **eslint-config-next** | 14.2.18 | Cấu hình ESLint cho Next.js |
| **@types/node** | ^20.17.6 | TypeScript types cho Node.js |
| **@types/react** | ^18.3.12 | TypeScript types cho React |
| **@types/react-dom** | ^18.3.1 | TypeScript types cho React DOM |
| **@types/leaflet** | ^1.9.14 | TypeScript types cho Leaflet |
| **@types/firebase** | ^2.4.32 | TypeScript types cho Firebase |

---

## 12. Kiến Trúc & Patterns

| Pattern | Mô tả |
|---------|-------|
| **App Router** | Next.js 14 routing dựa trên file system |
| **Route Groups** | `(auth)` và `(main)` để nhóm routes |
| **Server Actions** | Next.js server actions (body size limit: 10MB) |
| **Context Pattern** | AuthProvider wrap toàn app |
| **Custom Hooks** | `useAuth()` cho authentication |
| **Component Library** | UI components tái sử dụng (`Button`, `Input`, `Avatar`) |
| **Path Aliases** | `@/*` → `./src/*` |

---

## 13. API & External Services

| Service | Mục đích |
|---------|----------|
| **Next.js API Routes** | `/api/ai`, `/api/mock-users`, `/api/upload` |
| **Google Maps** | Mở vị trí quán cafe trên Google Maps |
| **Firebase Cloud Services** | Auth, Firestore, Storage |

---

## Tóm Tắt Nhanh

```
Frontend:    Next.js 14 + React 18 + TypeScript
Styling:     TailwindCSS + Framer Motion
Backend:     Firebase (Auth + Firestore + Storage)
State:       Zustand + React Context + TanStack Query
Forms:       React Hook Form + Zod
Maps:        Leaflet + React Leaflet
Icons:       Lucide React
Date:        date-fns
Build:       ESLint + PostCSS + Autoprefixer
```

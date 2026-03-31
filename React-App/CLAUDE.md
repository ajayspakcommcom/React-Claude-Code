# Project Context for Claude Code

## About This Project
This is a React + TypeScript + Webpack learning project following the React.js Roadmap (Beginner → Senior → Expert).

- Full roadmap: `documentation/react-roadmap.md`
- Full session log: `documentation/what-we-did.md`

---

## Goal
Build and explore all React features that are **industry standard**, level by level.

---

## Current Level
- [x] Beginner (Foundations) — COMPLETE
- [ ] Intermediate (Production Ready) — IN PROGRESS
- [ ] Senior (Architecture & Scale)
- [ ] Expert (Frontend Engineer / Architect)

---

## Intermediate Progress
- [x] Advanced React — COMPLETE (`src/intermediate/advanced-react/`)
- [x] Routing — File-based COMPLETE (`React-App-FileRouter/` — separate Vite project)
- [x] Routing — Code-based COMPLETE (`React-App-CodeRouter/` — separate Vite project)
- [ ] State Management — IN PROGRESS (Context+Reducer done, next: Redux Toolkit)
- [ ] Forms & Validation
- [ ] Styling
- [ ] Performance
- [ ] API Integration
- [ ] Testing (Basics)
- [ ] Practice

---

## Folder Structure

```
Claude-Code/
├── React-App/                        ← THIS project (Webpack, port 3000)
│   ├── documentation/
│   │   ├── react-roadmap.md
│   │   └── what-we-did.md            ← Full session log, read this to resume
│   └── src/
│       ├── App.tsx
│       ├── beginner/
│       │   ├── react-basics/         ← 6 files
│       │   ├── hooks/                ← 15 built-in + custom/ (8 custom hooks)
│       │   └── practice/             ← Counter, Todo, CRUD
│       └── intermediate/
│           └── advanced-react/       ← 5 files
│
├── React-App-FileRouter/             ← File-based routing (Vite, port 5173)
│   └── src/
│       ├── main.tsx                  ← router config: context, scrollRestoration, pendingMs
│       ├── auth.ts                   ← simple auth store
│       ├── components/
│       │   └── HeavyPage.tsx         ← lazy-loaded component (code split)
│       └── routes/
│           ├── __root.tsx            ← createRootRouteWithContext, nav, activeOptions
│           ├── index.tsx             ← /  (home, file→route mapping table)
│           ├── about.tsx             ← /about
│           ├── login.tsx             ← /login (useNavigate, useSearch for redirect)
│           ├── contact.tsx           ← /contact (useNavigate full demo)
│           ├── lazy-demo.tsx         ← /lazy-demo (lazyRouteComponent, code splitting)
│           ├── users/
│           │   ├── index.tsx         ← /users (pendingComponent, staleTime)
│           │   └── $userId.tsx       ← /users/:id (useParams in nested component, errorComponent)
│           ├── products/
│           │   ├── index.tsx         ← /products (useSearch, loaderDeps, activeOptions, route masking, context)
│           │   └── $productId.tsx    ← /products/:id (parallel loaders, useParams nested)
│           └── _auth/
│               ├── _auth.tsx         ← pathless layout (beforeLoad guard)
│               └── dashboard.tsx     ← /dashboard (protected route)
│
└── React-App-CodeRouter/             ← Code-based routing (Vite, port 5173)
    └── src/
        ├── router.tsx                ← ALL routes defined here (createRoute + addChildren)
        ├── auth.ts
        └── pages/
            ├── Home.tsx              ← / (comparison table: file-based vs code-based)
            ├── About.tsx             ← /about
            ├── Users.tsx             ← /users (getRouteApi, pendingComponent, staleTime)
            ├── UserDetail.tsx        ← /users/:userId (useParams in nested component)
            ├── Products.tsx          ← /products (useSearch, loaderDeps, activeOptions)
            ├── Contact.tsx           ← /contact (useNavigate)
            ├── Login.tsx             ← /login
            └── Dashboard.tsx         ← /dashboard (beforeLoad guard in router.tsx)
```

---

## How to Resume in a New Session
1. Read this file — you now know the current state
2. Read `documentation/what-we-did.md` for full detail on every file built
3. Next topic to build: **State Management** (inside `React-App/src/intermediate/`)
4. After state management → **Forms & Validation**

---

## State Management — Progress

All work inside `React-App/src/intermediate/state-management/`.

| File | Concept | Status |
|------|---------|--------|
| `01_ContextReducer.tsx` | Context + useReducer global store (shopping cart) | ✅ Done |
| `02_ReduxToolkit.tsx` | `createSlice`, `configureStore`, `useSelector`, `useDispatch` | ⬜ **START HERE** |
| `03_RTKQuery.tsx` | `createApi`, `fetchBaseQuery`, `useGetQuery`, `useMutation` | ⬜ |

### Redux Toolkit — what to build
- `npm install @reduxjs/toolkit react-redux` (not yet installed)
- `createSlice({ name, initialState, reducers })` — actions + reducer in one file
- `configureStore({ reducer })` — set up the store
- `Provider` from react-redux wrapping the demo
- `useSelector(state => state.x)` — read state
- `useDispatch()` + dispatch action — update state
- Use a **counter + todo** example to show multiple slices

---

## TanStack Router — All Concepts Covered ✅

| Concept | File |
|---------|------|
| File-based routing, auto route tree | All route files |
| Nested routes, Outlet | `users/index.tsx`, `_auth/` |
| Dynamic segments ($param) | `users/$userId.tsx`, `products/$productId.tsx` |
| Loader + useLoaderData | `users/`, `products/` |
| pendingComponent | `users/index.tsx`, `users/$userId.tsx`, `products/`, `lazy-demo.tsx` |
| errorComponent | `users/$userId.tsx`, `products/$productId.tsx` |
| staleTime | `users/index.tsx`, `products/index.tsx` |
| loaderDeps | `products/index.tsx` |
| useNavigate | `login.tsx`, `contact.tsx` |
| useSearch (typed, Zod) | `login.tsx`, `products/index.tsx` |
| useParams (nested component) | `users/$userId.tsx`, `products/$productId.tsx` |
| Link activeOptions (exact + includeSearch) | `__root.tsx`, `products/index.tsx` |
| Lazy routes (lazyRouteComponent) | `lazy-demo.tsx` + `components/HeavyPage.tsx` |
| Scroll restoration | `main.tsx` (scrollRestoration: true) |
| Route masking | `products/index.tsx` (mask prop on Link) |
| Parallel loaders | `products/$productId.tsx` (Promise.all) |
| Context in loaders | `main.tsx` (context:{}), `__root.tsx` (createRootRouteWithContext), `products/index.tsx` |
| Pathless layout + beforeLoad guard | `_auth.tsx`, `_auth/dashboard.tsx` |

---

## Tech Stack
- React 18, TypeScript 5, Webpack 5
- TanStack Router (routing — in React-App-FileRouter)
- Zod (search param validation)

---

## Commands
```bash
# Main app
cd React-App && npm start          # → http://localhost:3000

# Routing app (separate project)
cd React-App-FileRouter && npm run dev   # → http://localhost:5173
```

---

## Progress Log
| Date       | Topic                          | Status |
|------------|-------------------------------|--------|
| 2026-03-30 | Project setup                  | Done   |
| 2026-03-31 | Beginner — React Basics        | Done   |
| 2026-03-31 | Beginner — All Hooks (15+8)    | Done   |
| 2026-03-31 | Beginner — Practice apps       | Done   |
| 2026-03-31 | Intermediate — Advanced React  | Done   |
| 2026-03-31 | Intermediate — Routing (all)   | Done   |

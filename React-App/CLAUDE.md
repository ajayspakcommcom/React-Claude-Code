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
- [x] State Management — COMPLETE (`01_ContextReducer`, `02_ReduxToolkit`, `03_RTKQuery`, `04_TanStackQuery`)
- [x] Forms & Validation — COMPLETE (`01_ReactHookForm`, `02_ZodValidation`, `03_AdvancedPatterns`)
- [x] Styling — COMPLETE (`01_CSSModules`, `02_StyledComponents`, `03_TailwindCSS`)
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
│           ├── advanced-react/       ← 5 files
│           └── state-management/     ← 4 files (complete)
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
3. Next topic to build: **Forms & Validation** (inside `React-App/src/intermediate/`)
4. After forms → **Styling**

---

## State Management — COMPLETE ✅

All work inside `React-App/src/intermediate/state-management/`.

| File | Concept | Status |
|------|---------|--------|
| `01_ContextReducer.tsx` | Context + useReducer global store (shopping cart) | ✅ Done |
| `02_ReduxToolkit.tsx` | `createSlice`, `configureStore`, `useSelector`, `useDispatch` | ✅ Done |
| `03_RTKQuery.tsx` | `createApi`, `fetchBaseQuery`, `builder.query`, `builder.mutation`, cache tags | ✅ Done |
| `04_TanStackQuery.tsx` | `useQuery`, `useMutation`, `useInfiniteQuery`, prefetch, optimistic updates, devtools | ✅ Done |

### What each file demonstrates

**01_ContextReducer** — built-in React, no library needed
- Discriminated union action types, pure reducer, split state/dispatch contexts, custom hooks, `memo()`

**02_ReduxToolkit** — industry standard for large apps
- `createSlice` (Immer, auto action types), `configureStore`, `Provider`, `useSelector`, `useDispatch`, typed `RootState`

**03_RTKQuery** — data fetching layer built into RTK
- `createApi`, `fetchBaseQuery`, `builder.query` + `builder.mutation`, `providesTags` + `invalidatesTags`, `skip`, optimistic delete

**04_TanStackQuery** — most popular server-state library
- `useQuery` (query keys, staleTime, gcTime, select, enabled, retry, refetchOnWindowFocus)
- `useMutation` (add POST, update PATCH, delete + optimistic rollback)
- `useInfiniteQuery` (load more, getNextPageParam)
- Parallel queries, dependent queries, pagination with `keepPreviousData`
- `prefetchQuery` (hover to warm cache), `useQueryClient`, `ReactQueryDevtools`

---

## Forms & Validation — COMPLETE ✅

All work inside `React-App/src/intermediate/forms-validation/`.

| File | Concept | Status |
|------|---------|--------|
| `01_ReactHookForm.tsx` | `useForm`, `register`, `handleSubmit`, `formState`, `watch`, `reset`, `setValue`, `setError` | ✅ Done |
| `02_ZodValidation.tsx` | `zodResolver`, nested objects, `z.coerce`, `.refine`, `.superRefine`, `z.infer<T>` | ✅ Done |
| `03_AdvancedPatterns.tsx` | `useFieldArray`, `useWatch`, `Controller`, `FormProvider`, `useFormContext`, `trigger`, multi-step | ✅ Done |
| `04_RHFAdvanced.tsx` | `criteriaMode: "all"`, `reValidateMode`, `resetField`, `setFocus`, `shouldUnregister`, `errors.root` | ✅ Done |
| `05_ZodAdvanced.tsx` | `z.array`, `z.discriminatedUnion`, `z.date`, `z.record`, `.extend/.pick/.omit/.partial/.merge` | ✅ Done |

## Styling — NEXT

All work inside `React-App/src/intermediate/styling/`.

| File | Concept | Status |
|------|---------|--------|
| `01_CSSModules.tsx` | Scoped class names, composition, dynamic classes | ⬜ **START HERE** |
| `02_StyledComponents.tsx` | Tagged template literals, props-based styles, theming | ⬜ |
| `03_TailwindCSS.tsx` | Utility classes, responsive, dark mode | ⬜ |

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
- @reduxjs/toolkit, react-redux (Redux Toolkit + RTK Query)
- @tanstack/react-query, @tanstack/react-query-devtools (TanStack Query)
- TanStack Router (routing — in React-App-FileRouter / React-App-CodeRouter)
- Zod (search param validation)

---

## Commands
```bash
# Main app
cd React-App && npm start          # → http://localhost:3000

# File-based routing app
cd React-App-FileRouter && npm run dev   # → http://localhost:5173

# Code-based routing app
cd React-App-CodeRouter && npm run dev   # → http://localhost:5173
```

---

## Progress Log
| Date       | Topic                              | Status |
|------------|------------------------------------|--------|
| 2026-03-30 | Project setup                      | Done   |
| 2026-03-31 | Beginner — React Basics            | Done   |
| 2026-03-31 | Beginner — All Hooks (15+8)        | Done   |
| 2026-03-31 | Beginner — Practice apps           | Done   |
| 2026-03-31 | Intermediate — Advanced React      | Done   |
| 2026-03-31 | Intermediate — Routing (all)       | Done   |
| 2026-03-31 | Intermediate — State Management    | Done   |

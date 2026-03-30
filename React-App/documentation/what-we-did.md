# What We Did — Session Log

## Project Setup
- Cloned repo from: https://github.com/ajayspakcommcom/Claude-Code.git
- Working directory: `/Users/spakcomm-ajay/Documents/Claude-Code`
- React app lives at: `React-App/`
- Stack: React + TypeScript + Webpack

---

## React Basics — Files Created

Based on the `### React Basics` section of `React-App/documentation/react-roadmap.md`.

All files are inside `React-App/src/basics/`:

### 01_JSX.tsx
- What JSX is (HTML-like syntax inside JavaScript)
- Embedding JS expressions using `{}`
- Using `className` instead of `class`
- Inline styles with camelCase object properties
- JSX comments with `{/* */}`

### 02_FunctionalComponents.tsx
- Defining a functional component (plain JS function returning JSX)
- Composing components inside other components
- Returning `null` to render nothing

### 03_PropsVsState.tsx
- **Props**: data passed from parent → child, read-only inside child
- **State**: data managed inside a component with `useState`
- Calling the state setter triggers a re-render
- TypeScript interface used to type props (`UserCardProps`)
- Example: `UserCard` (props) + `Counter` (state)

### 04_EventsAndConditionalRendering.tsx
- React event names are camelCase: `onClick`, `onChange`, `onSubmit`
- `e.preventDefault()` stops page reload on form submit
- Conditional rendering with **ternary**: `condition ? <A /> : <B />`
- Conditional rendering with **short-circuit**: `condition && <A />`
- `React.ChangeEvent<HTMLInputElement>` and `React.FormEvent` types used

### 05_ListsAndKeys.tsx
- `Array.map()` to render lists
- `key` prop must be unique among siblings
- Prefer stable IDs over array indexes as keys
- Why index keys are risky for dynamic/reordered lists

### 06_BasicForms.tsx
- Controlled components: input value stored in React state
- Generic `handleChange` covers text, email, select, and checkbox
- `[e.target.name]` dynamic key pattern to update any field
- `type === "checkbox"` branch to handle `checked` vs `value`
- Form reset by setting state back to initial values
- Submit button disabled until checkbox is checked

---

## App.tsx
- Updated to import and render all 6 basics demos in sequence
- Each demo wrapped in a `<section>` with `<hr />` separators

---

## Git & GitHub
- Added `.gitignore` at project root to exclude `node_modules/`, `dist/`, `build/`
- Initial commit: `deaf7fe`
- Pushed to: https://github.com/ajayspakcommcom/Claude-Code.git (branch: `main`)

---

## What's Next (React Basics remaining)
All 6 topics from the roadmap are covered. Next section to explore:

### Hooks (Must) — `React-App/documentation/react-roadmap.md` line 22
- `useState` — already used, can go deeper (lazy init, functional updates)
- `useEffect` — side effects, API calls, cleanup, dependency array rules

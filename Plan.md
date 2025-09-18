# X - DID Client Dashboard: Product & UI Flow Plan

## Overview
A secure, responsive web application for universities/colleges to issue and manage degree certificates as Verifiable Credentials (VCs) anchored on W3C Decentralized Identifiers (DIDs). Built with React + Vite + Tailwind, aligned with SecureDApp’s mission and branding.

## Stakeholder Value
- Institutions can issue trusted, verifiable degrees at scale.
- Students and verifiers benefit from authenticity and portability of credentials.
- Backed by SecureDApp’s Web3 security expertise.

---

## High-Level Flow
1. Home (Public)
2. Register (Public)
3. Login (Public)
4. Dashboard (Protected)
5. Templates (Protected)
6. Degrees (Protected)
7. Verification (Protected now; Public variant planned)
8. Profile/Settings (Future)

---

## Pages & Rationale

### 1) Home (`src/pages/Home.jsx`)
- Purpose: Marketing/landing for institutions. Communicates value, features, SecureDApp credibility.
- Key elements:
  - Hero with CTAs: Sign In, Get Started
  - “Powered by SecureDApp” section and link
  - Features grid and “Why SecureDApp” differentiators

### 2) Register (`src/pages/Register.jsx`)
- Purpose: Onboard institutions with operational details for issuance.
- Tech: `react-hook-form` with strong validation.
- Fields:
  - Institution details: name, type, website
  - Contact: person name, email, phone
  - Address: country, state, city, address
  - Ops: expected issuance volume, IPFS provider preference
  - Security: password + confirm, terms consent
- Outcome: Redirect to Login after successful registration (mock now).

### 3) Login (`src/pages/Login.jsx`)
- Purpose: Authenticate institution admin.
- Tech: `react-hook-form` with validation; mock auth via `AuthContext`.
- UX: “Welcome Back” + “Sign in to X-DID Dashboard”, links to Register, SecureDApp site.
- Outcome: Redirect to intended protected route or `/dashboard`.

### 4) Dashboard (`src/pages/Dashboard.jsx`)
- Purpose: Snapshot of KPIs and recent activity; admin starting point.
- Elements: Cards (Issued, Pending Verifications, Templates Downloaded), Recent Activity list.

### 5) Templates (`src/pages/Templates.jsx`)
- Purpose: Entry to issuance pipeline.
- Elements: Download standardized CSV; upload CSV/Excel via `Dropzone` for preview.
- Next: Client-side parsing (e.g., PapaParse) and preview grid with validations.

### 6) Degrees (`src/pages/Degrees.jsx`)
- Purpose: Manage issued degrees.
- Elements: Responsive table; future filters (search/status/date), pagination, sorting.

### 7) Verification (`src/pages/Verification.jsx`)
- Purpose: Verify VC hash/JSON and show validity & issuer.
- Next: Public `/verify` page without auth; QR support.

### 8) Profile/Settings (Future)
- Manage institution profile, IPFS credentials, DID method, RBAC, API keys.

---

## Routing & Access Control
- Public: `/`, `/login`, `/register`
- Protected: `/dashboard`, `/templates`, `/degrees`, `/verification`
- Implementation:
  - `AuthContext` (`src/context/AuthContext.jsx`): mock user in localStorage; `login`, `logout`.
  - `RequireAuth` (`src/routes/RequireAuth.jsx`): redirects to `/login` with `state.from`.
  - `App.jsx`: defines routes and wraps protected ones.
  - `main.jsx`: wraps app with `AuthProvider` and `BrowserRouter`.

---

## UI/UX & Components
- Responsive layout: `Layout.jsx` (mobile sidebar overlay + desktop fixed sidebar, `max-w-7xl` container)
- Header: Auth-aware actions (Sign In / Get Started vs user + Logout)
- Sidebar: Active route highlighting; closes on mobile nav
- PageHeader: Consistent titles/actions across pages
- Button, FormInput: Accessible, mobile-first
- Dropzone: Drag-and-drop uploader for templates
- Footer: “Powered by SecureDApp” with company link

---

## Example Institution Journey
1. Visit Home → review features and SecureDApp’s credibility.
2. Click Get Started → Register → fill institution, contact, ops details → submit.
3. Sign In → land on Dashboard → view KPIs.
4. Go to Templates → download CSV → upload filled CSV → preview (coming) → confirm issuance (backend).
5. Manage issued degrees in Degrees page; filter/search; view metadata and artifacts.
6. Use Verification to validate credentials; public page planned for external verifiers.

---

## Next Features (Implementation Roadmap)
- Issuance Pipeline
  - CSV/Excel parsing (PapaParse) and validation map.
  - Preview grid with per-row validation states; confirm -> POST to backend.
- Degrees Enhancements
  - Filter/search bar (name, email, roll no, status, date range), server-side pagination.
  - Degree details drawer/page: VC metadata, VC hash, IPFS links, audit trail.
- Verification
  - Public `/verify` (no auth), QR scanning, clearer result UI.
- Profile/Settings
  - Institution profile, IPFS credentials, DID method toggle (`did:key` → `did:ethr`), API keys, RBAC.
- Notifications & A11y
  - Toasts for success/error; ARIA roles; keyboard navigation.
- Theming & Branding
  - Logo assets, brand palette, optional dark mode.
- Deployment
  - `.env`-driven API base URL; error boundaries; loading/skeleton states.

---

## Tech Stack (Frontend)
- React + Vite, Tailwind CSS
- React Router, react-hook-form
- @tanstack/react-query (planned for data fetching)
- Axios, Heroicons, React Icons

---

## Links
- Company: https://securedapp.io/
- Readme: `README.md` (project overview, tech stack)

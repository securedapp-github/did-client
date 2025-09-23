# DID Client Dashboard

## Project Overview

**DID Client Dashboard** is a secure web application designed for issuing and managing degree certificates as Verifiable Credentials (VCs) anchored on Decentralized Identifier (DID) standards. This project is developed as part of an internship at SecureDApp, a blockchain security company specializing in Web3 solutions.

The dashboard enables authorized administrators (e.g., university staff) to:

- Download predefined degree templates.
- Upload and validate degree data from CSV/Excel files.
- Preview and confirm batches of degrees for issuance.
- Issue signed VCs for each degree, storing artifacts on IPFS.
- View and search issued degrees with verification capabilities.
- Verify the authenticity of presented degree certificates.

This system promotes trust and verifiability in educational credentials using blockchain-inspired technologies, aligning with SecureDApp's mission to secure digital assets in decentralized ecosystems.

## Key Features

### Authentication & Authorization

- Email/password-based login with JWT sessions.
- Role-based access control (admin-only for issuance).
- Secure password hashing and basic rate limiting.

### Template Management

- Download a standardized degree template (CSV/Excel format) with required fields.
- Upload and parse user-filled templates, with column mapping and validation.

### Degree Issuance Pipeline

- Preview parsed data in a tabular format before confirmation.
- Bulk issuance: Sign degrees as VCs using DID keys and store metadata in the database.
- IPFS integration for storing degree artifacts (e.g., JSON VCs or PDF certificates).
- Status tracking for each degree (pending, issued, failed).

### Degree Management

- Search and filter issued degrees by name, email, roll number, etc.
- Paginated table view with details like issuance date, VC hash, IPFS links.
- Download or view associated files.

### Verification Module

- Public-facing verification: Accept a VC hash or JSON to verify signature and resolve DID.
- Display verification results, including issuer DID and validity status.

### Security & Compliance

- Audit logs for all issuance and access events.
- Encryption for sensitive data; plans for key rotation and HSM integration.
- Adherence to W3C DID and VC standards for interoperability.

## Tech Stack

### Frontend

- **React** (with Vite for build tooling) – Modern, component-based UI.
- **Tailwind CSS** – Utility-first styling for responsive design.
- **React Query** – For API state management and caching.
- **Axios** – HTTP client for backend communication.
- **Headless UI / shadcn/ui** – Accessible UI components.

### Backend

- **Node.js** with **TypeScript** – Robust, typed server-side development.
- **Express.js** or **NestJS** – RESTful API framework.
- **MongoDB** – NoSQL database for flexible document storage (e.g., VC metadata).
- **Veramo** – DID and VC toolkit for signing and verification.
- **IPFS** (via Web3.Storage or Pinata) – Decentralized file storage.

### Additional Tools

- **JWT** for authentication.
- **Bcrypt** for password hashing.
- **Helmet, CORS** for security middleware.
- **dotenv** for environment variable management.
- **GitHub Actions** for CI/CD.
- **Vercel/Netlify** for frontend hosting.
- **Render/Railway** for backend deployment.

## Architecture

### High-Level Diagram

```
[Frontend (React)]
     |
     | (REST APIs)
     v
[Backend (Node/TS)]
     |
     +-- Auth Module
     +-- Template Module
     +-- Upload & Issuance Module (with Veramo for DID/VC)
     +-- IPFS Integration
     +-- Verification Module
     +-- Database (MongoDB)
```

### Data Flow

1. Admin logs in and downloads a degree template.
2. Admin uploads a filled template (CSV/Excel).
3. Backend parses and validates the file, previews entries.
4. On confirmation, backend issues VCs (signs with DID keys), stores on IPFS, updates DB.
5. Admin can search/view issued degrees.
6. External users can verify a degree by submitting VC data.

### Data Models (MongoDB Collections)

- **users**: {_id, email, passwordHash, role, createdAt}
- **degree_templates**: {_id, name, version, fields[], createdBy, createdAt}
- **degree_batches**: {_id, templateId, uploadedBy, fileMeta, parsedCount, status, createdAt}
- **degrees**: {_id, batchId, studentName, email, rollNo, course, issueDate, vcHash, vcId, ipfsCidJson, ipfsCidPdf, status, createdAt}
- **audit_logs**: {_id, actorId, action, entityType, entityId, meta, timestamp}

## API Endpoints (Draft)

### Authentication

- `POST /auth/login` – Login with email/password, returns JWT.
- `POST /auth/register` – Register new admin (if needed).

### Templates

- `GET /templates/download` – Download template file.
- `POST /templates` – Create/upload a new template.

### Batches & Issuance

- `POST /batches/upload` – Upload CSV/Excel, parse and return preview data.
- `GET /batches/:id/preview` – Get parsed entries for a batch.
- `POST /batches/:id/confirm-issue` – Confirm and issue VCs for the batch.

### Degrees

- `GET /degrees` – List degrees with filters (search, status, pagination).
- `GET /degrees/:id` – Get details of a specific degree.

### Verification

- `POST /verify` – Verify a VC by hash/JSON, return verification status.

### IPFS

- `GET /ipfs/:cid` – Proxy or download file from IPFS (if needed).

## Setup Instructions

### Prerequisites

- Node.js (v18+), npm/yarn
- MongoDB (local or cloud, e.g., MongoDB Atlas)
- IPFS account (Web3.Storage or Pinata)
- DID keys (generated via Veramo)

### Installation

1. Clone the repository:

   ```
   git clone <repo-url>
   cd did-client-dashboard
   ```
2. Install dependencies:

   ```
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```
3. Set up environment variables:

   - Create `.env` files in `frontend/` and `backend/` based on `.env.example`.
   - Examples:
     - Backend: `MONGODB_URI`, `JWT_SECRET`, `IPFS_API_KEY`, `DID_PRIVATE_KEY`
     - Frontend: `REACT_APP_API_BASE_URL`
4. Set up MongoDB:

   - Ensure MongoDB is running and accessible.
   - Run migrations/scripts to create collections (if any).
5. Generate DID keys:

   - Use Veramo CLI or code to generate `did:key` for testing.
6. Run the application:

   ```
   # Backend (in separate terminal)
   cd backend
   npm run dev

   # Frontend
   cd frontend
   npm run dev
   ```

   - Frontend will run on `http://localhost:3000`.
   - Backend on `http://localhost:5000` (example).

### Deployment

- Frontend: Deploy to Vercel/Netlify via Git integration.
- Backend: Deploy to Render/Railway, set environment variables.
- CI/CD: Use GitHub Actions for automated testing and deployment.

## Usage

1. **Login**: Access the dashboard with admin credentials.
2. **Download Template**: Click to download the CSV template.
3. **Upload Data**: Upload a filled template; review the preview table.
4. **Issue Degrees**: Confirm to sign and store VCs.
5. **View Degrees**: Search and manage issued degrees.
6. **Verify**: Use the verification endpoint for external checks.

For testing, use sample CSV files with dummy data.

## Timeline & Milestones

- **Week 1**: Foundations (Auth, DB, Skeleton UI).
- **Week 2**: Template Upload/Preview.
- **Week 3**: Issuance Pipeline (DID/VC Signing, IPFS).
- **Week 4**: View/Search, Verification, QA.
- **Optional Week 5**: Enhancements (KMS, Analytics).

## Risks & Clarifying Questions

- DID Method: Start with `did:key`; upgrade to `did:ethr` later?
- Visual Certificates: Generate PDFs or stick to JSON VCs?
- Existing Infrastructure: Any CA/keys to integrate?
- Compliance: Data retention, PII handling?
- Hosting: Approved providers?

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/xyz`).
3. Commit changes (`git commit -m 'Add xyz'`).
4. Push and create a PR.

Follow the existing code style (TypeScript, ESLint). Add tests for new features.

## License

This project is proprietary to SecureDApp. All rights reserved.
